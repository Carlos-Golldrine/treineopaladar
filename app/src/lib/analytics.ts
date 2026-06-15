/**
 * Telemetria (PostHog) — F3. Gated por env: sem VITE_POSTHOG_KEY vira no-op,
 * então testes/E2E e ambientes sem chave rodam sem enviar nada.
 * autocapture + pageviews dão retencao (gates D1/D30) e funil de clique de graça;
 * os eventos nomeados (ftue, licao, desafio, conta) afinam a analise de pacing.
 */
import posthog from 'posthog-js';

const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
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
}

/** Registra um evento nomeado. No-op se a telemetria nao estiver ligada. */
export function track(evento: string, props?: Record<string, unknown>): void {
  if (!ligado) return;
  posthog.capture(evento, props);
}

/** Associa os eventos ao usuario (id do Supabase). No-op se desligada. */
export function identificar(userId: string, props?: Record<string, unknown>): void {
  if (!ligado) return;
  posthog.identify(userId, props);
}

/** Desassocia (ex.: logout). No-op se desligada. */
export function resetTelemetria(): void {
  if (!ligado) return;
  posthog.reset();
}
