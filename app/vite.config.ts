import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        /* gsap em chunk proprio: so o chunk lazy da MicroAula o importa,
           e o nome estavel permite exclui-lo do precache do app shell */
        manualChunks(id) {
          if (id.includes('node_modules/gsap')) return 'gsap';
          return undefined;
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'Treine seu Paladar',
        short_name: 'Paladar',
        description:
          'Treino diário de paladar para escolher vinho com confiança.',
        lang: 'pt-BR',
        dir: 'ltr',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        theme_color: '#722F37',
        background_color: '#FAFAF8',
        categories: ['education', 'food', 'lifestyle'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        /* Rotulos reais, bancos de conteudo lazy e o gsap (motion das
           micro-aulas) ficam FORA do precache: caem no runtime caching
           (decisao F2, ~351KB a menos na instalacao; gsap so chega com
           a primeira micro-aula) */
        globIgnores: ['**/rotulos/**', '**/avatars/**', '**/banco-pratica-*.js', '**/desafios-*.js', '**/gsap-*.js'],
        /* F3 push: o generateSW gerado importa este script no topo, que
           adiciona os handlers de 'push' e 'notificationclick'. Mantemos a
           estrategia generateSW (e todo o runtime caching tunado acima)
           intacta; o push entra por cima, sem migrar para injectManifest.
           O notif-sw.js fica em /public e e servido na raiz. */
        importScripts: ['/notif-sw.js'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/rotulos/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'rotulos-v1',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 24 * 60 * 60,
              },
            },
          },
          {
            /* avatares-preset (fora do precache): chegam sob demanda e ficam
               offline apos o primeiro uso */
            urlPattern: ({ url }) => url.pathname.startsWith('/avatars/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'avatares-v1',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 24 * 60 * 60,
              },
            },
          },
          {
            /* chunks de conteudo lazy excluidos do precache: ficam offline
               apos o primeiro uso (hash no nome garante invalidacao) */
            urlPattern: ({ url }) =>
              /\/assets\/(banco-pratica|desafios|gsap)-[\w-]+\.js$/.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'conteudo-lazy-v1',
              expiration: {
                maxEntries: 8,
                maxAgeSeconds: 60 * 24 * 60 * 60,
              },
            },
          },
        ],
      },
    }),
  ],
});
