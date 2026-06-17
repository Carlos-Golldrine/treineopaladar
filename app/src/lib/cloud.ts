/**
 * Bootstrap e orquestracao da nuvem (F3). Garante uma sessao (anonima no soft
 * wall), reage a login / criacao de conta e mantem o write-through.
 * Best-effort: qualquer falha deixa o app rodando na copia local do engine.
 */
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { getSupabase } from './supabase';
import { carregarDaNuvem, salvarNaNuvem } from './sync';
import { identificar } from './analytics';
import { obterStore } from '../engine/store';
import type { EstadoV1 } from '../engine/types';

/** Estado "intocado": defaults do onboarding, sem progresso nem XP. */
function estaVazio(e: EstadoV1): boolean {
  return (
    !e.onboardingCompleto &&
    Object.keys(e.progresso).length === 0 &&
    e.checkpoints.length === 0 &&
    e.wallet.xpTotal === 0
  );
}

let iniciado = false;
/** Usuario corrente (atualizado a cada evento de auth); o write-through usa este. */
let usuarioCorrente: string | null = null;
/** Timer do write-through debounced; modular para flush/parada no logout. */
let timer: ReturnType<typeof setTimeout> | null = null;

/** Sobe agora (sincrono) o estado pendente do usuario corrente, cancelando o debounce. */
export async function flushSincronizacao(): Promise<void> {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  const sb = getSupabase();
  const uid = usuarioCorrente;
  if (!sb || !uid) return;
  await salvarNaNuvem(sb, uid, obterStore().getEstado()).catch(() => undefined);
}

/** Para o write-through e esquece o usuario corrente (usar antes do signOut no logout). */
export function pararSincronizacao(): void {
  usuarioCorrente = null;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

/** Liga a sincronizacao com a nuvem. Idempotente (so roda uma vez). */
export async function iniciarNuvem(): Promise<void> {
  if (iniciado) return;
  iniciado = true;

  const sb = getSupabase();
  if (!sb) return;
  const store = obterStore();

  // Write-through: a cada mudanca do store, sobe o estado do usuario corrente (debounced).
  store.subscribe(() => {
    const uid = usuarioCorrente;
    if (!uid) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      void salvarNaNuvem(sb, uid, store.getEstado()).catch(() => undefined);
    }, 1500);
  });

  // Reage a auth (login, criacao de conta, refresh). Defer: nao chamar funcoes
  // async do supabase de dentro do callback (recomendacao do supabase-js).
  sb.auth.onAuthStateChange((event, session) => {
    setTimeout(() => void reconciliar(event, session), 0);
  });

  // Garante uma sessao no boot: anonima se nao houver. O onAuthStateChange
  // (INITIAL_SESSION ou SIGNED_IN) dispara o reconciliar.
  try {
    const { data } = await sb.auth.getSession();
    if (!data.session) await sb.auth.signInAnonymously();
  } catch {
    /* nuvem indisponivel: segue na copia local */
  }
}

/** Reconcilia o estado local com a nuvem conforme o evento de auth. */
async function reconciliar(event: AuthChangeEvent, session: Session | null): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const store = obterStore();

  usuarioCorrente = session?.user?.id ?? null;
  const uid = usuarioCorrente;
  if (!uid) return;
  identificar(uid, { anonimo: Boolean(session?.user?.is_anonymous) });
  if (event !== 'INITIAL_SESSION' && event !== 'SIGNED_IN' && event !== 'USER_UPDATED') return;

  try {
    const local = store.getEstado();
    if (estaVazio(local)) {
      // Sem progresso local: a nuvem manda (ou semeia os defaults se ela tambem estiver vazia).
      const remoto = await carregarDaNuvem(sb, uid);
      if (remoto && !estaVazio(remoto)) store.hidratar(remoto);
      else await salvarNaNuvem(sb, uid, store.getEstado());
    } else if (event === 'SIGNED_IN') {
      // Login numa conta existente: se ela ja tem progresso, a nuvem manda.
      const remoto = await carregarDaNuvem(sb, uid);
      if (remoto && !estaVazio(remoto)) store.hidratar(remoto);
      else await salvarNaNuvem(sb, uid, local);
    } else {
      // Reload (INITIAL_SESSION) ou conta recem-criada (USER_UPDATED): sobe o local.
      await salvarNaNuvem(sb, uid, local);
    }
  } catch {
    /* best-effort */
  }
}
