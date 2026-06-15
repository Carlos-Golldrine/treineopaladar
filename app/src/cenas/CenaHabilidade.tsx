/**
 * CenaHabilidade: a casca que escolhe a cena certa pela habilidade da
 * licao e a deita no vazio entre a pergunta e as opcoes do exercicio.
 *
 * Quando aparece (regras do brief, secao 7 e pedido do dono):
 *   - a habilidade da licao tem cena (todas as 7 tem);
 *   - o exercicio NAO traz imagem de rotulo (com rotulo, o espaco ja e
 *     dele: a cena nao compete com a foto).
 * O componente devolve null fora dessas condicoes, entao o Player nao
 * precisa decidir nada.
 *
 * Tinta sutil da cor da unidade no fundo do cartao (mistura com o bg
 * quente via color-mix), para a cena pertencer a unidade sem gritar.
 *
 * O toque e brincadeira: NUNCA muda a resposta nem bloqueia o fluxo. O
 * cartao fica em z baixo e nao captura o foco; so o pointerdown da cena
 * dispara o afago. As opcoes seguem com alvo >= 48px logo abaixo.
 */

import type { CSSProperties } from 'react';
import type { Exercicio, Habilidade } from '../engine';
import { CENAS } from './cenas';
import './cenas.css';

/** Habilidades com cena. Hoje, todas (o registro CENAS cobre as 7). */
function temCena(h: Habilidade): h is keyof typeof CENAS {
  return h in CENAS;
}

/** O exercicio carrega imagem de rotulo? (mc e intruso podem). */
function temImagem(ex: Exercicio): boolean {
  return (ex.tipo === 'mc' || ex.tipo === 'intruso') && typeof ex.imagem === 'string' && ex.imagem.length > 0;
}

interface Props {
  habilidade: Habilidade;
  exercicio: Exercicio;
  /** Hex da cor da unidade (UnidadeMeta.cor); tinge o fundo do cartao. */
  corUnidade?: string;
}

export function CenaHabilidade({ habilidade, exercicio, corUnidade }: Props) {
  if (!temCena(habilidade) || temImagem(exercicio)) return null;
  const Cena = CENAS[habilidade];

  /* Tinta da unidade: 8% da cor sobre o bg quente. color-mix tem
     fallback no neutral-50 caso o motor nao suporte (cobertura ampla
     hoje, mas a cena nunca pode sumir num fundo invisivel). */
  const estilo: CSSProperties | undefined = corUnidade
    ? ({ '--cena-tinta': `color-mix(in srgb, ${corUnidade} 8%, var(--bg))` } as CSSProperties)
    : undefined;

  return (
    <div className="cena-card app-chrome" style={estilo} aria-hidden="true">
      <Cena />
    </div>
  );
}
