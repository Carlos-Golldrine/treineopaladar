/**
 * Meta Pixel (Facebook/Instagram Ads) — instrumentacao pra trafego pago.
 * ID enviado pela equipe de marketing. O Pixel base dispara PageView no load e
 * espelhamos a telemetria existente (analytics.ts) pra ca: cada navegacao vira
 * PageView e cada evento nomeado vira um evento padrao do Meta (CompleteRegistration
 * etc.) ou um evento custom — assim "trackeia tudo" sem espalhar fbq pelo codigo.
 *
 * Gated por PRODUCAO: em dev/preview nao carrega o pixel real (nao polui os dados
 * de anuncio). Os forwarders chamam window.fbq so se existir, entao sao no-op fora
 * de producao (e testaveis com um stub de window.fbq).
 */
const PIXEL_ID = (import.meta.env.VITE_META_PIXEL_ID as string | undefined) ?? '1666225634676067';

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string; callMethod?: unknown };
    _fbq?: unknown;
  }
}

let ligado = false;

/** True quando ha Pixel configurado (sempre, com o ID do marketing como fallback). */
export function pixelConfigurado(): boolean {
  return Boolean(PIXEL_ID);
}

/** Carrega o Meta Pixel e dispara o primeiro PageView. So em producao. No-op repetido. */
export function iniciarPixel(): void {
  if (ligado || !PIXEL_ID) return;
  if (!import.meta.env.PROD) return; // dev/preview nao manda pro pixel real
  carregarFbevents();
  window.fbq?.('init', PIXEL_ID);
  window.fbq?.('track', 'PageView');
  ligado = true;
}

/* Snippet oficial do Meta reescrito em TS: cria window.fbq (fila) e injeta o fbevents.js. */
function carregarFbevents(): void {
  if (window.fbq) return;
  const n = function (...args: unknown[]) {
    if (n.callMethod) (n.callMethod as (...a: unknown[]) => void)(...args);
    else n.queue!.push(args);
  } as Window['fbq'] & { queue: unknown[] };
  n.queue = [];
  n.loaded = true;
  n.version = '2.0';
  window.fbq = n;
  window._fbq = window._fbq || n;
  const t = document.createElement('script');
  t.async = true;
  t.src = 'https://connect.facebook.net/en_US/fbevents.js';
  const s = document.getElementsByTagName('script')[0];
  s.parentNode?.insertBefore(t, s);
}

/** PageView (navegacao SPA). */
export function pixelPageView(): void {
  window.fbq?.('track', 'PageView');
}

/** Evento PADRAO do Meta (CompleteRegistration, Lead, Purchase, Contact...). */
export function pixelTrack(evento: string, props?: Record<string, unknown>): void {
  window.fbq?.('track', evento, props);
}

/** Evento CUSTOM (nome livre) — pra "trackear tudo" o que ja existe na telemetria. */
export function pixelTrackCustom(evento: string, props?: Record<string, unknown>): void {
  window.fbq?.('trackCustom', evento, props);
}
