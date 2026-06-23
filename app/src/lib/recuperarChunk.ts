/**
 * Recuperacao de "chunk antigo" pos-deploy.
 *
 * Depois de um deploy, o index.html em cache (PWA) pode apontar pra chunks com
 * hash velho que sumiram do servidor -> "Failed to fetch dynamically imported
 * module" ao abrir uma rota lazy (Trilha, Desafio, Lente...). Aqui a gente:
 *   1. limpa os caches do PWA (precache com o index/chunks antigos),
 *   2. pede a atualizacao do Service Worker (sem desregistrar -> preserva o push),
 *   3. recarrega: a proxima navegacao cai na rede e pega o index/chunks novos.
 *
 * Guarda de 20s (sessionStorage) evita loop de reload se o problema persistir.
 */
let emRecuperacao = false;

export async function recuperarChunk(): Promise<void> {
  if (emRecuperacao) return;
  const agora = Date.now();
  const ultimo = Number(sessionStorage.getItem('tp.chunk.reload') ?? '0');
  if (agora - ultimo < 20_000) return;
  emRecuperacao = true;
  sessionStorage.setItem('tp.chunk.reload', String(agora));
  try {
    if (typeof caches !== 'undefined') {
      const chaves = await caches.keys();
      await Promise.all(chaves.map((k) => caches.delete(k)));
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.update().catch(() => {})));
    }
  } catch {
    /* ignora: o reload abaixo ja ajuda */
  }
  window.location.reload();
}
