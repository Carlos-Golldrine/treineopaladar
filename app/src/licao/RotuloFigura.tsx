import { useEffect, useState } from 'react';

/**
 * Rotulo real acima da pergunta (exercicios mc/intruso com `imagem`, Desafio).
 * Carrega lazy e mostra skeleton so depois de 300ms. Tocavel: abre o rotulo em
 * tela cheia (lightbox) para ver os detalhes da garrafa numa proporcao boa.
 */
export function RotuloFigura({ src, alt = 'Rótulo da garrafa' }: { src: string; alt?: string }) {
  const [carregada, setCarregada] = useState(false);
  const [skeleton, setSkeleton] = useState(false);
  const [ampliado, setAmpliado] = useState(false);

  useEffect(() => {
    setCarregada(false);
    setSkeleton(false);
    const t = window.setTimeout(() => setSkeleton(true), 300);
    return () => window.clearTimeout(t);
  }, [src]);

  /* Esc fecha o rotulo ampliado */
  useEffect(() => {
    if (!ampliado) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAmpliado(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ampliado]);

  return (
    <>
      <button
        type="button"
        className={`rotulo-figura tap${!carregada && skeleton ? ' rotulo-figura-skeleton' : ''}`}
        onClick={() => setAmpliado(true)}
        aria-label="Toque para ampliar o rótulo"
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={carregada ? 'rotulo-img rotulo-img-pronta' : 'rotulo-img'}
          onLoad={() => setCarregada(true)}
        />
        <span className="rotulo-zoom" aria-hidden="true">
          <IconeLupa />
        </span>
      </button>

      {ampliado && (
        <div
          className="rotulo-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={() => setAmpliado(false)}
        >
          <img src={src} alt={alt} className="rotulo-lightbox-img" />
          <button type="button" className="rotulo-lightbox-fechar tap" aria-label="Fechar">
            <IconeX />
          </button>
          <p className="rotulo-lightbox-dica" aria-hidden="true">
            Toque para fechar
          </p>
        </div>
      )}
    </>
  );
}

/* Lupa com "+" (ampliar): desenho proprio, sem emoji/stock */
function IconeLupa() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path d="M15.5 15.5 L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10.5 8 V13 M8 10.5 H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconeX() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      <path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
