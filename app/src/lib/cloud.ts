/**
 * Bootstrap e orquestracao da nuvem (F3). Garante uma sessao (anonima no soft
 * wall), reage a login / criacao de conta e mantem o write-through.
 * Best-effort: qualquer falha deixa o app rodando na copia local do engine.
 */
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { getSupabase } from './supabase';
import { carregarDaNuvem, salvarNaNuvem } from './sync';
import { identificar } from './analytics';
import { reassociarPushAtual } from '../notificacoes/push';
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
const CHAVE_DONO_ANON = 'tp.dono.anon';

function lerDono(): string | null {
  try {
    return localStorage.getItem(CHAVE_DONO);
  } catch {
    return null;
  }
}

/** True se o estado local pertence a um usuario ANONIMO — a origem de um "upgrade"
 * (anonimo que cria/atrela conta). Distingue migrar (anonimo) de isolar (conta real). */
function donoEraAnonimo(): boolean {
  try {
    return localStorage.getItem(CHAVE_DONO_ANON) === '1';
  } catch {
    return false;
  }
}

function gravarDono(uid: string, anonimo: boolean): void {
  try {
    localStorage.setItem(CHAVE_DONO, uid);
    localStorage.setItem(CHAVE_DONO_ANON, anonimo ? '1' : '0');
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
    // Re-aponta a inscricao Web Push deste device para a conta atual (cura a sub
    // orfa da troca anonima->real; sem isso o push fica preso no uid antigo).
    // Independe da reconciliacao: o RPC usa a sessao corrente (auth.uid()).
    if (session?.user && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
      setTimeout(() => void reassociarPushAtual(), 0);
    }
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
  const anon = Boolean(session?.user?.is_anonymous);
  identificar(uid, { anonimo: anon });
  if (event !== 'INITIAL_SESSION' && event !== 'SIGNED_IN' && event !== 'USER_UPDATED') return;

  const dono = lerDono();

  // TROCA DE IDENTIDADE: o estado local pertence a OUTRO uid (dono definido e diferente
  // do uid da sessao). Mesclar entre contas REAIS vazaria XP/progresso — o bug do
  // isolamento. Regra: se a conta nova ja tem nuvem, adota a dela; se o local e de um
  // ANONIMO com progresso (upgrade: criou conta com uid novo), MIGRA esse progresso pra
  // conta nova; senao (troca entre contas reais), comeca limpo. O progresso de cada conta
  // vive na nuvem sob o uid dela e volta no proximo login.
  if (dono && dono !== uid) {
    try {
      const remoto = await carregarDaNuvem(sb, uid);
      if (remoto && !estaVazio(remoto)) {
        // A conta nova ja tem progresso na nuvem: adota o dela.
        store.repor(remoto);
      } else if (donoEraAnonimo() && !estaVazio(store.getEstado())) {
        // UPGRADE: o estado local e de um ANONIMO com progresso (ex.: acabou de
        // concluir o onboarding) e ele criou/atrelou uma conta com uid NOVO (ex.:
        // Google quando o "manual linking" esta off -> signInWithOAuth). MIGRA o
        // progresso para a conta nova em vez de descartar. NAO reabre o vazamento
        // entre contas: so migra quando a ORIGEM e anonima (dono real -> conta nova
        // segue limpa, isolada).
        await salvarNaNuvem(sb, uid, store.getEstado());
      } else {
        // Troca entre contas reais (ou anonimo sem progresso): comeca limpo.
        store.repor(estadoInicial(Date.now()));
        await salvarNaNuvem(sb, uid, store.getEstado());
      }
      gravarDono(uid, anon); // so marca como reconciliado APOS sucesso
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
    gravarDono(uid, anon);
  } catch {
    /* best-effort */
  }
}
