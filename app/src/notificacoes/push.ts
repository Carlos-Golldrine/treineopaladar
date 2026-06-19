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

/**
 * STUB de subscricao Web Push. Pega o registration do SW e, quando a
 * VAPID existir, chama pushManager.subscribe e salva no Supabase.
 * Por ora so confirma que o pipe esta vivo e deixa o ponto de extensao.
 */
async function tentarSubscrever(): Promise<void> {
  if (!suportaPush()) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    /* Se ja existe uma subscription (sessao anterior), nada a fazer aqui. */
    const existente = await reg.pushManager.getSubscription();
    if (existente) return;

    // TODO F3-backend: subscrever com VAPID e salvar no Supabase.
    //   const sub = await reg.pushManager.subscribe({
    //     userVisibleOnly: true,
    //     applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    //   });
    //   await fetch('/api/push/subscribe', { method: 'POST', body: JSON.stringify(sub) });
    // Enquanto a chave VAPID e a Edge Function nao existem, paramos aqui:
    // a intencao ja esta gravada e o backend assume quando subir.
  } catch {
    /* SW nao pronto ou push bloqueado: a intencao guardada basta por ora */
  }
}
