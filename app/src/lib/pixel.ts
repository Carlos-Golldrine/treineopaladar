/**
 * Meta Pixel (Facebook/Instagram Ads) — camada fina e segura sobre o `fbq` global.
 * O Pixel base e carregado (e gated pelo dominio de producao) no index.html; aqui
 * ficam so os disparadores. Tudo guarded: se o fbq nao existir (dev, preview, tracker
 * bloqueado, sem rede) vira no-op e nada quebra.
 *
 * O mapeamento app->Meta vive em analytics.ts (espelharNoPixel), chamado por TODO
 * track(). Este modulo so expoe PageView / evento padrao / evento custom.
 */
type Fbq = (metodo: string, evento: string, params?: Record<string, unknown>) => void;

function fbq(): Fbq | null {
  const f = (window as unknown as { fbq?: Fbq }).fbq;
  return typeof f === 'function' ? f : null;
}

/** PageView (load inicial vem do index.html; aqui sao as trocas de rota da SPA). */
export function pixelPageView(): void {
  try {
    fbq()?.('track', 'PageView');
  } catch {
    /* tracker bloqueado: no-op */
  }
}

/** Evento PADRAO do Meta (CompleteRegistration, Lead, Subscribe, ViewContent...). */
export function pixelTrack(evento: string, params?: Record<string, unknown>): void {
  try {
    fbq()?.('track', evento, params);
  } catch {
    /* no-op */
  }
}

/** Evento CUSTOM (nome livre) — pra "trackear tudo" o que ja existe na telemetria. */
export function pixelTrackCustom(nome: string, params?: Record<string, unknown>): void {
  try {
    fbq()?.('trackCustom', nome, params);
  } catch {
    /* no-op */
  }
}
