/**
 * Permissao de notificacao + intencao de Web Push.
 *
 * Decisao C-N (NOTIFICACOES secao 1): NUNCA o prompt nativo no load.
 * requestPermission() so e chamado a partir do aceite do primer proprio.
 *
 * STUB seguro de subscribe: a chave VAPID e o backend Supabase ainda nao
 * existem (F3-backend). Aqui a gente apenas guarda a INTENCAO de receber
 * push e deixa o TODO. Nada quebra se Notification/Push/SW nao existirem
 * (iOS sem instalar, navegador velho, etc.).
 */

import { getSupabase } from '../lib/supabase';

const CHAVE_INTENCAO = 'tp.push.intencao.v1';

export type EstadoPermissao = 'default' | 'granted' | 'denied' | 'indisponivel';

/** Le a permissao atual sem disparar prompt nenhum. */
export function permissaoAtual(): EstadoPermissao {
  if (typeof Notification === 'undefined') return 'indisponivel';
  return Notification.permission as EstadoPermissao;
}

/** True quando o ambiente tem o trio minimo pra Web Push (SW + Push + Notification). */
export function suportaPush(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    typeof Notification !== 'undefined'
  );
}

/**
 * Chave VAPID PUBLICA. E segura no client (a privada NUNCA vem pro client),
 * igual a publishable key do Supabase e a do PostHog. A env var tem prioridade,
 * mas o fallback garante que o push funciona mesmo se o Cloudflare nao injetar a
 * variavel no build (sem isso aparecia "Em breve"). Par da privada em supabase/.env.
 */
export const VAPID_PUBLICA =
  (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined) ??
  'BEgxReOXsfSVXOrssV2Laa464vmPM8xeIbPFc8Qqt0Xt78VpjG4v2ZVo9Lkf5srWekLDUGuWR3y0vcEq5BlH7PQ';

/** True quando ha chave VAPID (sempre, agora que ha fallback). */
export function pushAtivado(): boolean {
  return Boolean(VAPID_PUBLICA);
}

const CHAVE_ADIADO = 'tp.notif.adiado.v1';

/** True quando o primer foi adiado e a espera ainda nao venceu. */
export function primerAdiado(): boolean {
  try {
    const v = Number(localStorage.getItem(CHAVE_ADIADO) ?? 0);
    return Number.isFinite(v) && Date.now() < v;
  } catch {
    return false;
  }
}

/** Adia o primer por N dias. Em vez de "uma vez pra sempre", re-pergunta depois
 *  (alcanca quem tocou "Agora nao"). Quem aceita ganha um prazo longo. */
export function adiarPrimer(dias: number): void {
  try {
    localStorage.setItem(CHAVE_ADIADO, String(Date.now() + dias * 86400000));
  } catch {
    /* storage bloqueado: o primer pode reaparecer antes, tudo bem */
  }
}

/** Limpa o adiamento: o primer volta a poder aparecer na home imediatamente.
 *  Usado ao DESATIVAR no Perfil, pra a home reoferecer o convite na hora. */
export function limparAdiamentoPrimer(): void {
  try {
    localStorage.removeItem(CHAVE_ADIADO);
  } catch {
    /* ignore */
  }
}

/** Marca localmente que a pessoa QUER receber lembretes (intencao). */
function gravarIntencao(): void {
  try {
    localStorage.setItem(CHAVE_INTENCAO, JSON.stringify({ querPush: true, em: Date.now() }));
  } catch {
    /* sem localStorage: a intencao vale so nesta sessao */
  }
}

/** True se a intencao de receber push ja foi registrada localmente. */
export function temIntencaoPush(): boolean {
  try {
    const cru = localStorage.getItem(CHAVE_INTENCAO);
    if (!cru) return false;
    return (JSON.parse(cru) as { querPush?: boolean }).querPush === true;
  } catch {
    return false;
  }
}

export interface ResultadoPrimer {
  permissao: EstadoPermissao;
  /** True quando a intencao foi gravada e a tentativa de subscrever rodou. */
  intencaoRegistrada: boolean;
}

/**
 * Pede a permissao (so chamar no ACEITE do primer) e, se concedida,
 * registra a intencao e tenta subscrever via Web Push.
 *
 * Como a VAPID/backend ainda nao existem, a subscricao e um STUB: a
 * intencao fica guardada e o subscribe real entra na F3-backend.
 */
export async function aceitarLembretes(): Promise<ResultadoPrimer> {
  if (typeof Notification === 'undefined') {
    /* iOS Safari sem instalar, navegador antigo: nao da pra pedir. A
       pessoa ainda assim "quer" lembretes; guardamos a intencao pro
       backend mandar por outro canal (e-mail) quando existir. */
    gravarIntencao();
    return { permissao: 'indisponivel', intencaoRegistrada: true };
  }

  let permissao: EstadoPermissao;
  try {
    permissao = (await Notification.requestPermission()) as EstadoPermissao;
  } catch {
    /* Safari antigo so tem a forma com callback; tratamos como negado. */
    permissao = 'denied';
  }

  if (permissao !== 'granted') {
    return { permissao, intencaoRegistrada: false };
  }

  gravarIntencao();
  await tentarSubscrever();
  return { permissao, intencaoRegistrada: true };
}

/** Converte a chave VAPID publica (base64url) no Uint8Array que o
 *  pushManager.subscribe espera como applicationServerKey. */
function chaveParaBytes(base64: string): Uint8Array {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/');
  const cru = atob(b64);
  const bytes = new Uint8Array(cru.length);
  for (let i = 0; i < cru.length; i++) bytes[i] = cru.charCodeAt(i);
  return bytes;
}

/** Plataforma best-effort para segmentar envios (iOS exige PWA instalado). */
function plataforma(): string {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  return 'desktop';
}

/**
 * Salva/reivindica a subscription no Supabase, ligada ao usuario LOGADO agora.
 * Via RPC reassociar_push (SECURITY DEFINER): alem do primeiro salvamento, isso
 * RE-APONTA uma inscricao que ficou presa no uid antigo quando a conta anonima
 * virou real (o RLS sozinho barraria o novo dono de atualizar a linha alheia).
 * A funcao usa auth.uid() no servidor, entao nao precisamos passar o uid.
 */
async function salvarSubscription(sub: PushSubscription): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const keys = sub.toJSON().keys ?? {};
  if (!keys.p256dh || !keys.auth) return;
  await sb.rpc('reassociar_push', {
    p_endpoint: sub.endpoint,
    p_p256dh: keys.p256dh,
    p_auth: keys.auth,
    p_plataforma: plataforma(),
  });
}

/**
 * Re-aponta a inscricao Web Push DESTE navegador para a conta logada agora.
 * Cura a inscricao orfa quando a conta anonima vira real (ou troca de conta):
 * sem isso a sub fica presa no uid antigo e o push nunca chega na conta atual.
 * Chamado no boot/login (cloud.ts). Best-effort: sem sub viva, no-op.
 */
export async function reassociarPushAtual(): Promise<void> {
  if (!suportaPush() || !pushAtivado()) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await salvarSubscription(sub);
  } catch {
    /* SW nao pronto: re-tenta no proximo evento de auth */
  }
}

/**
 * Subscreve no Web Push (reaproveitando a subscription do navegador, se houver)
 * e salva no Supabase. Sem VAPID (pushAtivado false) nao faz nada — o primer nem
 * chega aqui, mas a guarda evita subscrever sem para onde enviar.
 */
async function tentarSubscrever(): Promise<void> {
  if (!suportaPush() || !pushAtivado()) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const existente = await reg.pushManager.getSubscription();
    const sub =
      existente ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: chaveParaBytes(VAPID_PUBLICA),
      }));
    await salvarSubscription(sub);
  } catch {
    /* SW nao pronto ou push bloqueado: a intencao guardada basta por ora */
  }
}

/**
 * True quando existe uma subscription de Web Push VIVA neste navegador. O primer
 * usa isso pra reaparecer pra quem NAO esta inscrito — inclui quem ja concedeu a
 * permissao ('granted') mas teve a inscricao expirada/limpa, nao so quem nunca
 * decidiu ('default').
 */
export async function temInscricaoAtiva(): Promise<boolean> {
  if (!suportaPush()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    return Boolean(await reg.pushManager.getSubscription());
  } catch {
    return false;
  }
}

/**
 * Desliga os lembretes: cancela a subscription do navegador e a remove do banco
 * (RLS: o dono apaga a propria). A PERMISSAO do navegador segue 'granted' (so o
 * usuario revoga isso nas configuracoes), mas sem subscription nao chega mais push.
 */
export async function desativarLembretes(): Promise<void> {
  if (!suportaPush()) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      const sb = getSupabase();
      if (sb) await sb.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      await sub.unsubscribe();
    }
  } catch {
    /* SW indisponivel ou erro de rede: melhor esforco */
  }
  try {
    localStorage.removeItem(CHAVE_INTENCAO);
  } catch {
    /* ignore */
  }
}
