/**
 * Client unico do Supabase para o PWA (browser).
 * Le as credenciais publicas de import.meta.env (VITE_*). Sem elas, a nuvem
 * fica desligada e o app roda 100% na copia local do engine.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

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
