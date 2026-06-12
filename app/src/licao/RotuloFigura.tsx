import { useEffect, useState } from 'react';

/**
 * Rotulo real acima da pergunta (exercicios mc/intruso com `imagem`).
 * Carrega lazy, ocupa no maximo 40vh sobre fundo neutro e so mostra
 * skeleton depois de 300ms (nada pisca em conexao boa).
 */
export function RotuloFigura({ src, alt = 'Rótulo da garrafa' }: { src: string; alt?: string }) {
  const [carregada, setCarregada] = useState(false);
  const [skeleton, setSkeleton] = useState(false);

  useEffect(() => {
    setCarregada(false);
    setSkeleton(false);
    const t = window.setTimeout(() => setSkeleton(true), 300);
    return () => window.clearTimeout(t);
  }, [src]);

  return (
    <figure
      className={`rotulo-figura${!carregada && skeleton ? ' rotulo-figura-skeleton' : ''}`}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={carregada ? 'rotulo-img rotulo-img-pronta' : 'rotulo-img'}
        onLoad={() => setCarregada(true)}
      />
    </figure>
  );
}
