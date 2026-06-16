/**
 * Convite "Adicionar a tela inicial" (PWA): captura do evento de instalacao e
 * deteccao de plataforma.
 *
 * O `beforeinstallprompt` (Android/Chromium) dispara uma unica vez e cedo,
 * possivelmente antes do React montar. Por isso guardamos o evento aqui, num
 * modulo carregado no main, e os componentes leem/assinam deste estado.
 * No iOS a Apple nao expoe esse evento: o convite vira passo a passo manual.
 */

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let diferido: BeforeInstallPromptEvent | null = null;
const ouvintes = new Set<() => void>();

function avisar(): void {
  ouvintes.forEach((fn) => fn());
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    /* Segura o mini-infobar padrao do Chrome: o convite e nosso, no momento certo */
    e.preventDefault();
    diferido = e as BeforeInstallPromptEvent;
    avisar();
  });
  window.addEventListener('appinstalled', () => {
    diferido = null;
    avisar();
  });
}

/** Ha um prompt nativo pronto para disparar (Android/desktop Chromium)? */
export function temInstalacaoNativa(): boolean {
  return diferido !== null;
}

/** Dispara o prompt nativo do navegador. Retorna o desfecho da pessoa. */
export async function instalarNativo(): Promise<'accepted' | 'dismissed' | 'indisponivel'> {
  if (!diferido) return 'indisponivel';
  const evento = diferido;
  await evento.prompt();
  const { outcome } = await evento.userChoice;
  diferido = null;
  avisar();
  return outcome;
}

/** Assina mudancas (prompt ficou disponivel / app instalado). Devolve o cancelador. */
export function assinarInstalacao(fn: () => void): () => void {
  ouvintes.add(fn);
  return () => {
    ouvintes.delete(fn);
  };
}

/** O app ja roda instalado (standalone)? Entao nao convidamos. */
export function estaInstalado(): boolean {
  if (typeof window === 'undefined') return false;
  const standalone = window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return standalone || iosStandalone;
}

/** iPhone/iPad, incluindo iPadOS (que se disfarca de Mac com toque). */
export function ehIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const iphone = /iphone|ipod|ipad/i.test(ua);
  const ipadOs = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return iphone || ipadOs;
}
