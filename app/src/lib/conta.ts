/**
 * Acoes de conta (F3.1b) sobre o Supabase Auth e um hook de estado.
 * Fluxo anonimo-primeiro: criar conta = anexar e-mail+senha ao usuario anonimo
 * (mesmo user_id, nada se perde). Entrar = trocar para uma conta existente.
 */
import { useEffect, useState } from 'react';
import { getSupabase } from './supabase';
import { flushSincronizacao, pararSincronizacao } from './cloud';

/** Google so aparece quando o OAuth client estiver configurado (Google Cloud + Supabase). */
export const GOOGLE_PRONTO = true;

export interface EstadoConta {
  carregando: boolean;
  /** Usuario anonimo: ainda nao salvou conta permanente. */
  anonimo: boolean;
  /** E-mail da conta, quando permanente. */
  email: string | null;
}

/** Estado de conta ao vivo (reage a login, criacao de conta, logout). */
export function useConta(): EstadoConta {
  const sb = getSupabase();
  const [estado, setEstado] = useState<EstadoConta>({ carregando: true, anonimo: true, email: null });

  useEffect(() => {
    if (!sb) {
      setEstado({ carregando: false, anonimo: true, email: null });
      return;
    }
    let vivo = true;
    void sb.auth.getUser().then(({ data }) => {
      if (!vivo) return;
      const u = data.user;
      setEstado({ carregando: false, anonimo: Boolean(u?.is_anonymous), email: u?.email ?? null });
    });
    const { data: sub } = sb.auth.onAuthStateChange((_evento, session) => {
      const u = session?.user;
      setEstado({ carregando: false, anonimo: Boolean(u?.is_anonymous), email: u?.email ?? null });
    });
    return () => {
      vivo = false;
      sub.subscription.unsubscribe();
    };
  }, [sb]);

  return estado;
}

export interface ResultadoConta {
  ok: boolean;
  erro?: string;
  /** True quando o e-mail ainda precisa ser confirmado (config do projeto). */
  confirmarEmail?: boolean;
}

/** Anexa e-mail+senha ao usuario anonimo corrente (mesmo user_id, progresso intacto). */
export async function criarContaEmail(email: string, senha: string): Promise<ResultadoConta> {
  const sb = getSupabase();
  if (!sb) return { ok: false, erro: 'Sincronização indisponível agora.' };
  const { data, error } = await sb.auth.updateUser({ email, password: senha });
  if (error) return { ok: false, erro: traduzErro(error.message) };
  return { ok: true, confirmarEmail: !data.user?.email_confirmed_at };
}

/**
 * Login/cadastro com Google. Usuario anonimo: linkIdentity (preserva o progresso,
 * mesmo user_id). Caso contrario: signInWithOAuth. Ambos redirecionam para o Google
 * e voltam para a origem (a sessao e capturada por detectSessionInUrl).
 */
export async function entrarComGoogle(): Promise<ResultadoConta> {
  const sb = getSupabase();
  if (!sb) return { ok: false, erro: 'Sincronização indisponível agora.' };
  const redirectTo = window.location.origin;
  const {
    data: { user },
  } = await sb.auth.getUser();

  // Anonimo: tenta vincular (preserva o mesmo user_id). Se "manual linking" estiver
  // desabilitado no projeto, o endpoint responde 404; caimos para signInWithOAuth e o
  // progresso local e reenviado ao novo usuario pela reconciliacao da nuvem (cloud.ts).
  if (user?.is_anonymous) {
    const { error } = await sb.auth.linkIdentity({ provider: 'google', options: { redirectTo } });
    if (!error) return { ok: true };
  }

  const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
  if (error) return { ok: false, erro: traduzErro(error.message) };
  return { ok: true };
}

/** Entra numa conta existente (troca a sessao; a nuvem reidrata o estado). */
export async function entrarComEmail(email: string, senha: string): Promise<ResultadoConta> {
  const sb = getSupabase();
  if (!sb) return { ok: false, erro: 'Sincronização indisponível agora.' };
  const { error } = await sb.auth.signInWithPassword({ email, password: senha });
  if (error) return { ok: false, erro: traduzErro(error.message) };
  return { ok: true };
}

/**
 * Sai da conta: sobe o ultimo estado, encerra a sessao e recomeca como visitante
 * anonimo. MANTEM o progresso local (incl. o onboarding ja visto) — sem re-fazer o
 * tutorial; ao logar de novo, o estado e mesclado, nada se perde.
 */
export async function sairDaConta(): Promise<void> {
  await flushSincronizacao(); // garante que o ultimo estado subiu para a conta atual
  pararSincronizacao(); // para o write-through e esquece o uid antes do signOut
  const sb = getSupabase();
  if (sb) {
    try {
      await sb.auth.signOut();
    } catch {
      /* ignore */
    }
  }
  window.location.assign('/');
}

/** Traduz erros comuns do Auth para o tom da marca (sem jargao, acolhedor). */
function traduzErro(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('already registered') || m.includes('already been registered') || m.includes('already exists')) {
    return 'Esse e-mail já tem conta. Tente entrar.';
  }
  if (m.includes('invalid login credentials')) return 'E-mail ou senha não conferem.';
  if (m.includes('password should be at least') || m.includes('at least 6')) {
    return 'A senha precisa de pelo menos 6 caracteres.';
  }
  if (m.includes('unable to validate email') || m.includes('invalid format') || m.includes('valid email')) {
    return 'Confira o e-mail digitado.';
  }
  if (m.includes('email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar (veja sua caixa de entrada).';
  }
  if (m.includes('rate limit') || m.includes('too many') || m.includes('for security purposes')) {
    return 'Muitas tentativas. Tente de novo em instantes.';
  }
  return 'Algo não saiu como esperado. Tente de novo.';
}
