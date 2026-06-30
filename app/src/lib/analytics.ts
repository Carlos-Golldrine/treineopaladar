/**
 * Telemetria (PostHog) — F3. Gated por env: sem VITE_POSTHOG_KEY vira no-op,
 * então testes/E2E e ambientes sem chave rodam sem enviar nada.
 * autocapture + pageviews dão retencao (gates D1/D30) e funil de clique de graça;
 * os eventos nomeados (ftue, licao, desafio, conta) afinam a analise de pacing.
 */
import posthog from 'posthog-js';
import { pixelPageView, pixelTrack, pixelTrackCustom } from './pixel';

/* Eventos da telemetria que viram evento PADRAO do Meta (otimizacao de anuncio).
   Os demais vao como evento custom com o mesmo nome (pt-BR), pra "trackear tudo". */
const PIXEL_PADRAO: Record<string, string> = {
  conta_criada: 'CompleteRegistration', // a conversao principal pro trafego pago
  ftue_concluido: 'Lead', // ativou: terminou o onboarding (1a licao)
  pwa_instalado: 'Subscribe', // instalou o PWA (proxy de "ativacao forte")
};

function espelharNoPixel(evento: string, props?: Record<string, unknown>): void {
  const padrao = PIXEL_PADRAO[evento];
  if (padrao) pixelTrack(padrao, props);
  else pixelTrackCustom(evento, props);
}

// Chave publica do PostHog (client-side por design). Env var tem prioridade; fallback garante o deploy.
const key =
  (import.meta.env.VITE_POSTHOG_KEY as string | undefined) ?? 'phc_rQtYFuuXF6E2oHsaRioWiMkrARLJXH4yxahDEmMjPG2P';
const host = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://us.i.posthog.com';

let ligado = false;

/** True quando ha chave de telemetria configurada. */
export function telemetriaConfigurada(): boolean {
  return Boolean(key);
}

/** Inicializa o PostHog uma vez. No-op sem chave. */
export function iniciarTelemetria(): void {
  if (ligado || !key) return;
  posthog.init(key, {
    api_host: host,
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    persistence: 'localStorage',
  });
  ligado = true;
  posthog.register({ id_sessao: idSessao() });
}

/* Id de sessao (uma vez por aba): super-propriedade em todo evento, para ligar
   o funil/jornada de uma mesma visita. */
function idSessao(): string {
  try {
    const chave = 'tp.sessao';
    let s = sessionStorage.getItem(chave);
    if (!s) {
      s = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      sessionStorage.setItem(chave, s);
    }
    return s;
  } catch {
    return 'sem-sessao';
  }
}

/** Registra um evento nomeado: PostHog + Meta Pixel (cada um com seu proprio gate). */
export function track(evento: string, props?: Record<string, unknown>): void {
  if (ligado) posthog.capture(evento, props);
  espelharNoPixel(evento, props);
}

/** Associa os eventos ao usuario (id do Supabase). No-op se desligada. */
export function identificar(userId: string, props?: Record<string, unknown>): void {
  if (!ligado) return;
  posthog.identify(userId, props);
  // `anonimo` vira super-propriedade: acompanha todo evento, nao so o perfil.
  if (props && 'anonimo' in props) posthog.register({ anonimo: Boolean(props.anonimo) });
}

/** Marca a visita de uma tela: tela_vista no PostHog + PageView no Pixel (SPA). */
export function telaVista(rota: string): void {
  if (ligado) posthog.capture('tela_vista', { rota });
  pixelPageView();
}

/** Desassocia (ex.: logout). No-op se desligada. */
export function resetTelemetria(): void {
  if (!ligado) return;
  posthog.reset();
}
