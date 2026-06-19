/**
 * notif-sw.js — handlers de Web Push do Treine seu Paladar (F3).
 *
 * Carregado via workbox.importScripts no service worker gerado pelo
 * vite-plugin-pwa (generateSW). Roda no escopo do MESMO service worker,
 * entao registra os listeners 'push' e 'notificationclick' sem precisar
 * de um segundo registro (nunca chamar navigator.serviceWorker.register
 * a parte: causaria SW duplicado). Todo o caching do app shell continua
 * por conta do generateSW; aqui so entram as notificacoes.
 *
 * Payload que a Edge Function (F3-backend, ainda a criar) vai mandar:
 *   { title, body, icon, badge, tag, url }
 * onde `url` e o deep-link in-app aberto no clique (ex: "/licao/u1-l1").
 *
 * Leis da marca: sem emoji, sem travessao. A copy vem da Edge Function
 * (espelha app/src/notificacoes/copy.ts), nao e hardcoded aqui.
 */

/* global self */

self.addEventListener('push', (event) => {
  let dados = {};
  try {
    if (event.data) dados = event.data.json();
  } catch {
    /* payload nao-JSON: cai no texto cru como corpo */
    dados = { body: event.data && event.data.text ? event.data.text() : '' };
  }

  const titulo = dados.title || 'Tchin';
  const opcoes = {
    body: dados.body || '',
    icon: dados.icon || '/icons/icon-192.png',
    badge: dados.badge || '/icons/icon-192.png',
    tag: dados.tag,
    data: { url: dados.url || '/' },
  };

  /* Regra de ouro do Chrome: todo push DEVE mostrar uma notificacao visivel. */
  event.waitUntil(self.registration.showNotification(titulo, opcoes));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const destino = data.url || '/';

  event.waitUntil(
    (async () => {
      const janelas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      /* Ja tem o app aberto: foca e navega ate o deep-link. */
      for (const janela of janelas) {
        if ('focus' in janela) {
          await janela.focus();
          if ('navigate' in janela && destino !== '/') {
            try {
              await janela.navigate(destino);
            } catch {
              /* navigate pode falhar entre origens: o foco ja basta */
            }
          }
          return;
        }
      }
      /* Nenhuma aba aberta: abre uma nova no deep-link. */
      if (self.clients.openWindow) await self.clients.openWindow(destino);
    })(),
  );
});
