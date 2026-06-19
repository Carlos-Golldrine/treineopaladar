/**
 * Client unico do Supabase para o PWA (browser).
 * Le as credenciais publicas de import.meta.env (VITE_*). Sem elas, a nuvem
 * fica desligada e o app roda 100% na copia local do engine.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Credenciais publicas (vao no bundle do client de qualquer forma; protegidas por RLS).
// A env var tem prioridade, MAS so se tiver formato valido: se o painel do Cloudflare
// tiver lixo no campo (ex.: texto colado por engano), o ?? nao salvaria (valor != null),
// entao validamos o formato e caimos no fallback conhecido se nao bater.
function envValido(v: string | undefined, ok: (s: string) => boolean, fallback: string): string {
  const t = (v ?? '').trim();
  return ok(t) ? t : fallback;
}
const url = envValido(
  import.meta.env.VITE_SUPABASE_URL as string | undefined,
  (s) => /^https:\/\/[a-z0-9-]+\.supabase\.(co|in)\/?$/i.test(s),
  'https://vgalezyjhnddvemowgdp.supabase.co',
);
const key = envValido(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined,
  (s) => /^(sb_|eyJ)/.test(s) && !/\s/.test(s),
  'sb_publishable_I6VRM3kU8p0ZAWsKFKfkEw_dzPNqF8w',
);

let cliente: SupabaseClient | null = null;

/** True quando ha credenciais de nuvem (.env.local em dev, painel do Cloudflare em prod). */
export function nuvemConfigurada(): boolean {
  return Boolean(url && key);
}

/** Client unico do Supabase, ou null se nao houver credenciais. */
export function getSupabase(): SupabaseClient | null {
  if (!url || !key) return null;
  if (!cliente) {
    cliente = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    });
  }
  return cliente;
}
