import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
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
        /* Rotulos reais e bancos de conteudo lazy ficam FORA do precache:
           caem no runtime caching (decisao F2, ~351KB a menos na instalacao) */
        globIgnores: ['**/rotulos/**', '**/banco-pratica-*.js', '**/desafios-*.js'],
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
            /* chunks de conteudo lazy excluidos do precache: ficam offline
               apos o primeiro uso (hash no nome garante invalidacao) */
            urlPattern: ({ url }) =>
              /\/assets\/(banco-pratica|desafios)-[\w-]+\.js$/.test(url.pathname),
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
