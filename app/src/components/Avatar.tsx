/**
 * Avatares ilustrados (personagens sommelier). Sem upload: o `avatar` do perfil
 * guarda só um id curto; o arquivo vive em public/avatars/<id>.svg.
 *
 * Renderizamos o SVG INLINE (fetch + injeção), nao via <img>: como <img> o
 * Chrome desloca o conteudo do viewBox pra cima (sobra fundo embaixo). Inline
 * (DOM) respeita o viewBox e o circulo preenche. Os ids dos 12 SVGs sao unicos
 * entre si, entao nao ha colisao quando varios aparecem juntos (o seletor).
 * Fallback (sem avatar / enquanto carrega): inicial do nome.
 */
import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import './avatar.css';

export interface AvatarPreset {
  rotulo: string;
}

export const AVATARES: Record<string, AvatarPreset> = {
  urso: { rotulo: 'Urso' },
  raposa: { rotulo: 'Raposa' },
  gato: { rotulo: 'Gato' },
  arara: { rotulo: 'Arara' },
  anfitria: { rotulo: 'Anfitriã' },
  barbudo: { rotulo: 'Barbudo' },
  vovo: { rotulo: 'Vovô' },
  guaxinim: { rotulo: 'Guaxinim' },
  pinguim: { rotulo: 'Pinguim' },
  cachorro: { rotulo: 'Cachorro' },
  leitora: { rotulo: 'Leitora' },
  garcom: { rotulo: 'Garçom' },
};

export const AVATAR_IDS = Object.keys(AVATARES);

const cache = new Map<string, string>();
const pendentes = new Map<string, Promise<string>>();

/** Baixa o SVG uma vez, ajusta para preencher o container e cacheia. */
function carregarSvg(id: string): Promise<string> {
  const pronto = cache.get(id);
  if (pronto !== undefined) return Promise.resolve(pronto);
  let p = pendentes.get(id);
  if (!p) {
    p = fetch(`/avatars/${id}.svg?v=2`)
      .then((r) => r.text())
      .then((txt) => {
        const ajustado = txt
          .replace(/\swidth="[^"]*"/, ' width="100%"')
          .replace(/\sheight="[^"]*"/, ' height="100%"')
          .replace(/preserveAspectRatio="[^"]*"/, 'preserveAspectRatio="xMidYMid slice"');
        cache.set(id, ajustado);
        return ajustado;
      })
      .catch(() => '');
    pendentes.set(id, p);
  }
  return p;
}

interface AvatarProps {
  id: string | null;
  nome?: string | null;
  size?: number;
  className?: string;
}

export function Avatar({ id, nome, size = 48, className }: AvatarProps) {
  const presetId = id && AVATARES[id] ? id : null;
  const [svg, setSvg] = useState<string>(() => (presetId ? cache.get(presetId) ?? '' : ''));

  useEffect(() => {
    let vivo = true;
    if (presetId) {
      void carregarSvg(presetId).then((s) => {
        if (vivo) setSvg(s);
      });
    } else {
      setSvg('');
    }
    return () => {
      vivo = false;
    };
  }, [presetId]);

  const base: CSSProperties = { width: size, height: size };

  if (presetId && svg) {
    return (
      <span
        className={className ? `avatar avatar-svg ${className}` : 'avatar avatar-svg'}
        style={base}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }

  const inicial = (nome?.trim()?.[0] ?? '?').toUpperCase();
  return (
    <span
      className={className ? `avatar avatar-inicial ${className}` : 'avatar avatar-inicial'}
      style={{ ...base, fontSize: Math.round(size * 0.42) }}
      aria-hidden="true"
    >
      {inicial}
    </span>
  );
}
