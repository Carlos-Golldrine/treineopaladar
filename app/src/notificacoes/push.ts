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
 * True quando o backend de push ja existe (chave VAPID publica configurada).
 * Enquanto a VAPID e a Edge Function de cron nao sobem, isto e false e o primer
 * fica DORMENTE: nao faz sentido pedir permissao que ninguem vai entregar (e
 * pedir cedo, sem entregar, queima o canal). Ligar = setar VITE_VAPID_PUBLIC_KEY.
 */
export function pushAtivado(): boolean {
  return Boolean(import.meta.env.VITE_VAPID_PUBLIC_KEY);
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

/** Salva (upsert por endpoint) a subscription no Supabase, ligada ao usuario. */
async function salvarSubscription(sub: PushSubscription): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const uid = (await sb.auth.getUser()).data.user?.id;
  if (!uid) return;
  const keys = sub.toJSON().keys ?? {};
  if (!keys.p256dh || !keys.auth) return;
  await sb.from('push_subscriptions').upsert(
    {
      endpoint: sub.endpoint,
      user_id: uid,
      p256dh: keys.p256dh,
      auth: keys.auth,
      plataforma: plataforma(),
      visto_em: new Date().toISOString(),
    },
    { onConflict: 'endpoint' },
  );
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
        applicationServerKey: chaveParaBytes(import.meta.env.VITE_VAPID_PUBLIC_KEY as string),
      }));
    await salvarSubscription(sub);
  } catch {
    /* SW nao pronto ou push bloqueado: a intencao guardada basta por ora */
  }
}
