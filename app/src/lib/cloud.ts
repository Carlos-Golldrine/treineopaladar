/**
 * Bootstrap e orquestracao da nuvem (F3). Garante uma sessao (anonima no soft
 * wall), reage a login / criacao de conta e mantem o write-through.
 * Best-effort: qualquer falha deixa o app rodando na copia local do engine.
 */
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { getSupabase } from './supabase';
import { carregarDaNuvem, salvarNaNuvem } from './sync';
import { identificar } from './analytics';
import { estadoInicial, obterStore } from '../engine/store';
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

/**
 * "Dono" do estado local: o uid a que o tp.v1 deste aparelho pertence. E a chave
 * do isolamento entre contas — o write-through so sobe quando o dono bate com a
 * sessao, e a reconciliacao NUNCA mescla o estado de um uid em outro. Sem isso, o
 * merge local-first vazava XP/progresso de uma conta para toda conta que logasse
 * no mesmo aparelho.
 */
const CHAVE_DONO = 'tp.dono';

function lerDono(): string | null {
  try {
    return localStorage.getItem(CHAVE_DONO);
  } catch {
    return null;
  }
}

function gravarDono(uid: string): void {
  try {
    localStorage.setItem(CHAVE_DONO, uid);
  } catch {
    /* modo privado / quota: o guard do write-through ainda bloqueia upload cruzado */
  }
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
  // So sobe se o estado local for DESTA conta (dono === uid): nunca empurra o
  // estado de uma conta para outra, mesmo num flush de logout.
  if (!sb || !uid || lerDono() !== uid) return;
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

  // Write-through: a cada mudanca do store, sobe o estado do usuario corrente
  // (debounced). So sobe quando o dono do estado local bate com a sessao — assim
  // um estado ainda nao reconciliado (troca de conta, offline) nunca contamina a
  // conta nova.
  store.subscribe(() => {
    const uid = usuarioCorrente;
    if (!uid || lerDono() !== uid) return;
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

  const dono = lerDono();

  // TROCA DE IDENTIDADE: o estado local pertence a OUTRA conta (dono definido e
  // diferente do uid da sessao). Mesclar aqui vazaria XP/progresso entre contas
  // — exatamente o bug. Em vez disso, ADOTA a conta atual: substitui o local pelo
  // que a nuvem dela tem (ou comeca limpo, se for conta nova). Nada se perde: o
  // progresso de cada conta vive na nuvem sob o uid dela e volta no proximo login.
  if (dono && dono !== uid) {
    try {
      const remoto = await carregarDaNuvem(sb, uid);
      if (remoto && !estaVazio(remoto)) {
        store.repor(remoto);
      } else {
        store.repor(estadoInicial(Date.now()));
        await salvarNaNuvem(sb, uid, store.getEstado());
      }
      gravarDono(uid); // so marca como reconciliado APOS sucesso
    } catch {
      // Offline/erro: NAO mexe no local e NAO grava o dono. O write-through fica
      // bloqueado (dono != uid) ate reconciliar de novo — sem risco de contaminar.
    }
    return;
  }

  // MESMA identidade (dono === uid) ou primeira marcacao (dono == null: claim do
  // estado pre-existente para a conta corrente — rollout sem perda). Reconciliacao
  // local-first normal; o merge aqui e seguro porque e a MESMA conta.
  try {
    const local = store.getEstado();
    if (estaVazio(local)) {
      // Sem progresso local: a nuvem manda (ou semeia os defaults se ela tambem estiver vazia).
      const remoto = await carregarDaNuvem(sb, uid);
      if (remoto && !estaVazio(remoto)) store.repor(remoto);
      else await salvarNaNuvem(sb, uid, store.getEstado());
    } else if (event === 'SIGNED_IN') {
      // Login/relogin na PROPRIA conta: se ela ja tem progresso, mescla (reconcilia
      // edicoes offline e multi-aparelho do mesmo dono).
      const remoto = await carregarDaNuvem(sb, uid);
      if (remoto && !estaVazio(remoto)) store.hidratar(remoto);
      else await salvarNaNuvem(sb, uid, local);
    } else {
      // Reload (INITIAL_SESSION) ou conta recem-criada do anonimo (USER_UPDATED): sobe o local.
      await salvarNaNuvem(sb, uid, local);
    }
    gravarDono(uid);
  } catch {
    /* best-effort */
  }
}
