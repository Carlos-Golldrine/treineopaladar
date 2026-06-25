/**
 * SET DE ICONES PROPRIETARIOS do Treine seu Paladar.
 * Substitui TODO icone de estoque (Material Symbols banido, BRIEF-DESIGN.md secao 1).
 *
 * Regras do set (consistencia absoluta):
 * - grid 24x24, traco 2.25-2.5px, stroke-linecap/linejoin round
 * - duotone: traco em currentColor (padrao wine-900) + NO MAXIMO 1 area de
 *   preenchimento por icone, sempre gold-500 (recompensa/energia) ou wine-100
 *   (volume neutro). Detalhes solidos pequenos (pontos, pingos) usam currentColor.
 * - personalidade quente: a chama tem curva viva, o cristal e lapidado,
 *   o coracao tem peso, taca/mesa/balanca repetem o "pe sorridente" do mascote.
 *
 * Uso: <Ic nome="chama-streak" size={24} label="Streak" />
 * Sem label o icone e decorativo (aria-hidden), igual ao Icon antigo.
 */

import type { CSSProperties, ReactElement } from 'react';

/** gold-500: recompensa, destaque, cristais (token travado do brief) */
const OURO = '#D4A574';
/**
 * wine-100: preenchimento suave do duotone de icones, papel nomeado aqui
 * (derivado do wine-700 a ~10% sobre o bg #FAFAF8, par do ok-100/warm-100).
 */
const VINHO_100 = '#F2E3E1';

/** Traco padrao do set */
const t = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

/** Traco fino para detalhes internos (facetas, ondas, nervuras) */
const td = { ...t, strokeWidth: 2.25 } as const;

/** Traco utilitario mais cheio (setas, check, x) */
const tu = { ...t, strokeWidth: 2.5 } as const;

/** Forma fechada com preenchimento + contorno no traco padrao */
const tf = (fill: string) => ({ ...t, fill }) as const;

/* ============================================================
   GLIFOS (so o miolo; o <svg> e montado pelo <Ic>)
   ============================================================ */

const ICONES = {
  /* ---------- jogo: economia e progresso ---------- */

  /** Chama do streak acesa: curva viva, miolo de ouro */
  'chama-streak': (
    <>
      <path
        d="M12 21.5 C9.7 21.5 8.2 20 8.2 18 C8.2 16.5 9.1 15.4 10.1 14.3 C10.8 13.5 11.5 12.7 11.9 11.7 C13.6 13 15.8 15.2 15.8 18 C15.8 20 14.3 21.5 12 21.5 Z"
        fill={OURO}
      />
      <path
        {...t}
        d="M12 21.5 C7.7 21.5 5 18.8 5 15.2 C5 12.7 6.3 10.8 7.7 9.2 C9 7.7 10.2 6.3 10.4 4.3 C10.5 3.6 10.4 3 10.2 2.3 C13.8 3.8 15.6 6.3 15.8 8.9 C16.6 8.3 17.2 7.4 17.4 6.3 C18.8 8.3 19 10.6 19 15.2 C19 18.8 16.3 21.5 12 21.5 Z"
      />
    </>
  ),

  /** Chama apagada (streak em risco): mesma silhueta, fria, sem miolo */
  'chama-apagada': (
    <path
      {...tf(VINHO_100)}
      d="M12 21.5 C7.7 21.5 5 18.8 5 15.2 C5 12.7 6.3 10.8 7.7 9.2 C9 7.7 10.2 6.3 10.4 4.3 C10.5 3.6 10.4 3 10.2 2.3 C13.8 3.8 15.6 6.3 15.8 8.9 C16.6 8.3 17.2 7.4 17.4 6.3 C18.8 8.3 19 10.6 19 15.2 C19 18.8 16.3 21.5 12 21.5 Z"
    />
  ),

  /** Coracao de vida cheio: tem peso, ombros largos */
  'coracao-vida': (
    <path
      {...tf(OURO)}
      d="M12 20.3 C6.4 16.7 3.3 13.4 3.3 9.8 C3.3 6.9 5.5 4.8 8.2 4.8 C9.7 4.8 11.2 5.5 12 6.8 C12.8 5.5 14.3 4.8 15.8 4.8 C18.5 4.8 20.7 6.9 20.7 9.8 C20.7 13.4 17.6 16.7 12 20.3 Z"
    />
  ),

  /** Coracao de vida gasto: mesma forma, esvaziado */
  'coracao-vazio': (
    <path
      {...tf(VINHO_100)}
      d="M12 20.3 C6.4 16.7 3.3 13.4 3.3 9.8 C3.3 6.9 5.5 4.8 8.2 4.8 C9.7 4.8 11.2 5.5 12 6.8 C12.8 5.5 14.3 4.8 15.8 4.8 C18.5 4.8 20.7 6.9 20.7 9.8 C20.7 13.4 17.6 16.7 12 20.3 Z"
    />
  ),

  /** Cristal lapidado: coroa de ouro, facetas ate a quilha */
  cristal: (
    <>
      <path d="M7.2 3.8 H16.8 L20.8 9.3 H3.2 Z" fill={OURO} />
      <path {...td} d="M8.3 9.3 L12 20.6 M15.7 9.3 L12 20.6 M3.2 9.3 H20.8" />
      <path {...t} d="M7.2 3.8 H16.8 L20.8 9.3 L12 20.6 L3.2 9.3 Z" />
    </>
  ),

  /** Raio de XP/energia */
  'raio-energia': (
    <path {...tf(OURO)} d="M13.4 2.8 L5.8 13.2 L10.4 13.2 L9.8 21.2 L18.2 10.6 L12.8 10.6 Z" />
  ),

  /** Coroa de dominio da licao */
  coroa: (
    <>
      <path
        {...tf(OURO)}
        d="M4.6 18.6 L3.6 8.2 L8.6 11.4 L12 5.6 L15.4 11.4 L20.4 8.2 L19.4 18.6 Z"
      />
      <path {...td} d="M5.4 15.2 H18.6" />
    </>
  ),

  /** Estrela de avaliacao/marco */
  estrela: (
    <path
      {...tf(OURO)}
      d="M12 3.2 L14.7 8.7 L20.7 9.6 L16.35 13.85 L17.4 19.9 L12 17 L6.6 19.9 L7.65 13.85 L3.3 9.6 L9.3 8.7 Z"
    />
  ),

  /** Bau de recompensa: tampa abaulada de ouro, fecho pesado */
  'presente-bau': (
    <>
      <path {...tf(OURO)} d="M4.4 11 C4.4 7.4 7.8 4.8 12 4.8 C16.2 4.8 19.6 7.4 19.6 11 Z" />
      <path
        {...t}
        d="M4.4 11 H19.6 V18 C19.6 19.2 18.6 20.2 17.4 20.2 H6.6 C5.4 20.2 4.4 19.2 4.4 18 Z"
      />
      <rect x="10.5" y="9.4" width="3" height="4.4" rx="1.4" fill="currentColor" />
    </>
  ),

  /** Cadeado de conteudo bloqueado */
  cadeado: (
    <>
      <rect {...tf(VINHO_100)} x="5.2" y="10.2" width="13.6" height="10" rx="3" />
      <path {...t} d="M8.6 10.2 V7.6 C8.6 5.4 10.1 3.8 12 3.8 C13.9 3.8 15.4 5.4 15.4 7.6 V10.2" />
      <circle cx="12" cy="14.4" r="1.6" fill="currentColor" />
      <path {...td} d="M12 15.6 V17.3" />
    </>
  ),

  /** Bandeira de meta/checkpoint */
  'bandeira-meta': (
    <>
      <path {...t} d="M6 3.2 V20.8" />
      <path {...tf(OURO)} d="M6 4.4 L18.8 7.8 L6 11.2 Z" />
    </>
  ),

  /* ---------- navegacao do app ---------- */

  /** Trilha: caminho em zigue-zague subindo, com paradas e chegada de ouro */
  'mapa-trilha': (
    <>
      <path {...t} d="M3.5 12 L8.5 10.5 L14.5 12.2 L19.5 10.5 V18.5 L14.5 20 L8.5 18.5 L3.5 20 Z" />
      <path {...td} d="M8.5 10.5 V18.5 M14.5 12.2 V20" />
      <path {...tf(OURO)} d="M12 2.6 C14.4 2.6 16.3 4.5 16.3 6.9 C16.3 10 12 14.3 12 14.3 C12 14.3 7.7 10 7.7 6.9 C7.7 4.5 9.6 2.6 12 2.6 Z" />
      <circle cx="12" cy="6.9" r="1.4" fill="currentColor" />
    </>
  ),

  /** Alvo do Desafio do Dia */
  'alvo-desafio': (
    <>
      <circle {...t} cx="12" cy="12" r="8.4" />
      <circle {...t} cx="12" cy="12" r="4.4" fill={OURO} />
      <path {...tu} d="M19.5 4.5 L12.6 11.4" />
      <path {...tu} d="M15.5 11.2 L12.6 11.4 L12.8 8.5" />
      <path {...tu} d="M16.4 4.5 L19.5 4.5 L19.5 7.6" />
    </>
  ),

  /** A Mesa: tampo de ouro, pe de bistro (eco do pe da taca), faisca do brinde */
  mesa: (
    <>
      <path
        d="M12 2.2 L12.7 4 L14.5 4.7 L12.7 5.4 L12 7.2 L11.3 5.4 L9.5 4.7 L11.3 4 Z"
        fill="currentColor"
      />
      <rect {...tf(OURO)} x="2.8" y="8.8" width="18.4" height="3.4" rx="1.7" />
      <path {...td} d="M5.6 12.6 V15.2 M18.4 12.6 V15.2" />
      <path {...t} d="M12 12.6 V18.4 M8.2 20.6 Q12 18.8 15.8 20.6" />
    </>
  ),

  /** Perfil: a taca como retrato no medalhao */
  'perfil-taca': (
    <>
      <circle {...td} cx="12" cy="12" r="9.6" />
      <path
        {...td}
        fill={OURO}
        d="M8.6 6.8 H15.4 C15.4 9.9 14.2 12 12 12.7 C9.8 12 8.6 9.9 8.6 6.8 Z"
      />
      <path {...td} d="M12 12.7 V15.4 M9.8 16.9 Q12 15.9 14.2 16.9" />
    </>
  ),

  /* ---------- utilitarios ---------- */

  check: <path {...tu} d="M4.8 12.6 L9.8 17.6 L19.2 7" />,

  'x-fechar': <path {...tu} d="M6.8 6.8 L17.2 17.2 M17.2 6.8 L6.8 17.2" />,

  'seta-voltar': <path {...tu} d="M19.2 12 H5.6 M11.2 6.4 L5.4 12 L11.2 17.6" />,

  'seta-direita': <path {...tu} d="M9.4 5.4 L16.2 12 L9.4 18.6" />,

  'seta-baixo': <path {...tu} d="M5.4 9.4 L12 16.2 L18.6 9.4" />,

  /** Lapis de editar: corpo inclinado, ponta no canto, faixa perto da borracha */
  lapis: (
    <>
      <path {...t} d="M15.6 4.4 L19.6 8.4 L8.8 19.2 L4.4 20 L5.2 15.6 Z" />
      <path {...td} d="M13.4 6.6 L17.4 10.6" />
    </>
  ),

  /** Compartilhar: o no de origem e de ouro (a descoberta sai de voce) */
  compartilhar: (
    <>
      <path {...td} d="M8.4 10.7 L15 6.9 M8.4 13.3 L15 17.1" />
      <circle {...td} cx="6" cy="12" r="2.7" fill={OURO} />
      <circle {...td} cx="17.4" cy="5.6" r="2.7" />
      <circle {...td} cx="17.4" cy="18.4" r="2.7" />
    </>
  ),

  'som-on': (
    <>
      <path
        {...tf(OURO)}
        d="M12.7 4.6 V19.4 L7.4 15.2 H4.6 C4.15 15.2 3.8 14.85 3.8 14.4 V9.6 C3.8 9.15 4.15 8.8 4.6 8.8 H7.4 Z"
      />
      <path {...td} d="M16.2 9.2 C17.2 10.7 17.2 13.3 16.2 14.8 M19 6.8 C21 9.8 21 14.2 19 17.2" />
    </>
  ),

  'som-off': (
    <>
      <path
        {...tf(VINHO_100)}
        d="M12.7 4.6 V19.4 L7.4 15.2 H4.6 C4.15 15.2 3.8 14.85 3.8 14.4 V9.6 C3.8 9.15 4.15 8.8 4.6 8.8 H7.4 Z"
      />
      <path {...t} d="M16 9.8 L20.4 14.2 M20.4 9.8 L16 14.2" />
    </>
  ),

  /** Ajuda: balao de conversa com pergunta (nunca tom de manual) */
  ajuda: (
    <>
      <path
        {...tf(VINHO_100)}
        d="M12 3.4 C16.9 3.4 20.8 7 20.8 11.6 C20.8 16.2 16.9 19.8 12 19.8 C10.9 19.8 9.9 19.6 8.9 19.3 L5 20.8 L5.9 17.2 C4.2 15.7 3.2 13.8 3.2 11.6 C3.2 7 7.1 3.4 12 3.4 Z"
      />
      <path {...t} d="M9.6 9.4 C9.7 8.1 10.7 7.2 12 7.2 C13.4 7.2 14.4 8.1 14.4 9.3 C14.4 10.9 12.4 11.1 12.1 12.6" />
      <circle cx="12.1" cy="15.6" r="1.3" fill="currentColor" />
    </>
  ),

  /** Flashcards: carta da frente com anotacoes, carta de tras espiando */
  'livro-flashcard': (
    <>
      <path {...td} d="M8.6 4.2 H17.6 C19 4.2 20.2 5.4 20.2 6.8 V15.8" />
      <rect {...tf(VINHO_100)} x="3.8" y="7.4" width="13" height="13" rx="2.6" />
      <path {...td} d="M7.4 12 H13.6 M7.4 15.6 H11" />
    </>
  ),

  /** Dica: lampada acesa de ouro */
  'lampada-dica': (
    <>
      <path
        {...tf(OURO)}
        d="M12 3.2 C15.6 3.2 18.2 5.8 18.2 9.1 C18.2 11.1 17.2 12.6 15.9 13.8 C15.2 14.4 14.8 15 14.7 15.9 H9.3 C9.2 15 8.8 14.4 8.1 13.8 C6.8 12.6 5.8 11.1 5.8 9.1 C5.8 5.8 8.4 3.2 12 3.2 Z"
      />
      <path {...t} d="M9.7 19.2 H14.3" />
      <path {...td} d="M10.7 21.6 H13.3" />
    </>
  ),

  play: <path {...tf(OURO)} d="M9 5.4 L19.6 12 L9 18.6 Z" />,

  pausa: (
    <>
      <rect {...tf(OURO)} x="6.6" y="5" width="3.6" height="14" rx="1.8" />
      <rect {...tf(OURO)} x="13.8" y="5" width="3.6" height="14" rx="1.8" />
    </>
  ),

  relogio: (
    <>
      <circle {...tf(VINHO_100)} cx="12" cy="12" r="8.8" />
      <path {...t} d="M12 7.2 V12 L15.4 13.9" />
    </>
  ),

  /** Ampulheta do cronometro: areia de ouro ja no fundo */
  ampulheta: (
    <>
      <path d="M9.7 19 C10.2 16.9 11 15.7 12 14.8 C13 15.7 13.8 16.9 14.3 19 Z" fill={OURO} />
      <path
        {...t}
        d="M7.6 3.4 C7.6 7.5 9.5 9.8 12 12 C14.5 9.8 16.4 7.5 16.4 3.4 M7.6 20.6 C7.6 16.5 9.5 14.2 12 12 C14.5 14.2 16.4 16.5 16.4 20.6"
      />
      <path {...t} d="M6.8 3.4 H17.2 M6.8 20.6 H17.2" />
    </>
  ),

  /* ---------- mundo do vinho ---------- */

  /** Garrafa com rotulo de ouro */
  garrafa: (
    <>
      <path
        {...t}
        d="M10.3 2.6 H13.7 V6.7 C13.7 7.7 16.4 8.4 16.4 11.2 V18.9 C16.4 20.2 15.4 21.2 14.1 21.2 H9.9 C8.6 21.2 7.6 20.2 7.6 18.9 V11.2 C7.6 8.4 10.3 7.7 10.3 6.7 Z"
      />
      <rect x="9.4" y="12.6" width="5.2" height="4.4" rx="1" fill={OURO} />
      <path {...td} d="M10.3 4.8 H13.7" />
    </>
  ),

  /** Taca com vinho de ouro e o pe sorridente do mascote */
  taca: (
    <>
      <path
        d="M7.8 7 H16.2 C15.7 10.3 14.2 12.3 12 13 C9.8 12.3 8.3 10.3 7.8 7 Z"
        fill={OURO}
      />
      <path
        {...t}
        d="M6.8 3.4 H17.2 C17.2 8.9 15.2 12.3 12 13.3 C8.8 12.3 6.8 8.9 6.8 3.4 Z"
      />
      <path {...t} d="M12 13.3 V17.6 M8.4 20.6 Q12 18.7 15.6 20.6" />
    </>
  ),

  /** A Lente: moldura de scan (eco da camera) com a taca de ouro no miolo */
  lente: (
    <>
      <path {...t} d="M4.5 8 V6 A1.5 1.5 0 0 1 6 4.5 H8" />
      <path {...t} d="M16 4.5 H18 A1.5 1.5 0 0 1 19.5 6 V8" />
      <path {...t} d="M8 19.5 H6 A1.5 1.5 0 0 1 4.5 18 V16" />
      <path {...t} d="M19.5 16 V18 A1.5 1.5 0 0 1 18 19.5 H16" />
      <path {...tf(OURO)} d="M9.4 8 H14.6 C14.6 10.9 13.4 12.6 12 13.1 C10.6 12.6 9.4 10.9 9.4 8 Z" />
      <path {...td} d="M12 13.1 V15.6 M10.6 16.4 Q12 15.7 13.4 16.4" />
    </>
  ),

  /** Saca-rolhas: cabo de ouro, espiral viva */
  'saca-rolhas': (
    <>
      <rect {...tf(OURO)} x="6.4" y="3.2" width="11.2" height="3.6" rx="1.8" />
      <path {...t} d="M12 6.8 V9.6" />
      <path
        {...td}
        d="M12 9.6 C14.3 10.1 14.3 11.9 12 12.4 C9.7 12.9 9.7 14.7 12 15.2 C14.3 15.7 14.3 17.5 12 18 C10.9 18.2 10.4 19.1 10.4 20.2"
      />
    </>
  ),

  /** Cacho de uvas: bagas cheias, folha de ouro */
  uvas: (
    <>
      <path {...t} d="M12 7 V3.6" />
      <path
        {...td}
        fill={OURO}
        d="M12.4 4.6 C14.7 2.4 17.8 2.9 18.7 5 C16.5 6.9 13.5 6.3 12.4 4.6 Z"
      />
      <circle cx="9.2" cy="10" r="2.4" fill="currentColor" />
      <circle cx="14.8" cy="10" r="2.4" fill="currentColor" />
      <circle cx="9.9" cy="14.4" r="2.4" fill="currentColor" />
      <circle cx="14.1" cy="14.4" r="2.4" fill="currentColor" />
      <circle cx="12" cy="18.7" r="2.4" fill="currentColor" />
    </>
  ),

  /** Slider de intensidade (corpo, acidez, doçura) */
  'regua-slider': (
    <>
      <path {...t} d="M3.6 12 H20.4" />
      <circle {...t} cx="14.6" cy="12" r="3.6" fill={OURO} />
    </>
  ),

  /** Balanca de comparacao: um prato ja pende de ouro */
  'balanca-comparar': (
    <>
      <path {...t} d="M12 4.6 V19 M8.4 20.8 Q12 19.2 15.6 20.8 M5 7.4 H19" />
      <circle cx="12" cy="4.6" r="1.3" fill="currentColor" />
      <path {...td} d="M5 7.4 L2.8 11.8 M5 7.4 L7.2 11.8" />
      <path {...td} fill={OURO} d="M2.2 11.8 A2.8 2.8 0 0 0 7.8 11.8 Z" />
      <path {...td} d="M19 7.4 L16.8 11.8 M19 7.4 L21.2 11.8" />
      <path {...td} d="M16.2 11.8 A2.8 2.8 0 0 0 21.8 11.8 Z" />
    </>
  ),

  /* ---------- contextos de consumo (FTUE) ---------- */

  casa: (
    <>
      <path
        {...t}
        d="M4.4 11.2 L12 4.2 L19.6 11.2 V18.6 C19.6 19.8 18.6 20.8 17.4 20.8 H6.6 C5.4 20.8 4.4 19.8 4.4 18.6 Z"
      />
      <path
        {...td}
        fill={OURO}
        d="M9.9 20.8 V16.4 C9.9 15.2 10.8 14.3 12 14.3 C13.2 14.3 14.1 15.2 14.1 16.4 V20.8 Z"
      />
    </>
  ),

  restaurante: (
    <>
      <path {...td} d="M5.4 3.2 V7.6 A2.8 2.8 0 0 0 11 7.6 V3.2 M8.2 3.2 V7" />
      <path {...t} d="M8.2 10.4 V20.8" />
      <path {...td} fill={OURO} d="M18.6 3.2 C15.9 5.9 15 9.3 16.3 12.6 H18.6 Z" />
      <path {...t} d="M18.6 12.6 V20.8" />
    </>
  ),

  'cesta-mercado': (
    <>
      <path {...t} d="M8.6 9.2 L12 3.6 L15.4 9.2" />
      <path
        {...tf(VINHO_100)}
        d="M3.6 9.2 H20.4 L18.9 17.8 C18.7 19.2 17.5 20.2 16.1 20.2 H7.9 C6.5 20.2 5.3 19.2 5.1 17.8 Z"
      />
      <path {...td} d="M9.7 12.6 L10.1 16.8 M14.3 12.6 L13.9 16.8" />
    </>
  ),

  /** Pegador de arrastar (ordenar) */
  arrastar: (
    <>
      <circle cx="9.3" cy="6.4" r="1.45" fill="currentColor" />
      <circle cx="14.7" cy="6.4" r="1.45" fill="currentColor" />
      <circle cx="9.3" cy="12" r="1.45" fill="currentColor" />
      <circle cx="14.7" cy="12" r="1.45" fill="currentColor" />
      <circle cx="9.3" cy="17.6" r="1.45" fill="currentColor" />
      <circle cx="14.7" cy="17.6" r="1.45" fill="currentColor" />
    </>
  ),

  /** Sino do primer de notificacao: badalo de ouro (o lembrete que chega) */
  sino: (
    <>
      <path
        {...t}
        d="M6.4 16.4 C6.4 16.4 7.6 15.2 7.6 11.6 C7.6 8.3 9.6 5.8 12 5.8 C14.4 5.8 16.4 8.3 16.4 11.6 C16.4 15.2 17.6 16.4 17.6 16.4 Z"
      />
      <path {...td} d="M4.8 16.4 H19.2" />
      <path {...tf(OURO)} d="M10.2 18.4 H13.8 C13.8 19.9 12.9 20.8 12 20.8 C11.1 20.8 10.2 19.9 10.2 18.4 Z" />
      <path {...td} d="M12 5.8 V3.8" />
    </>
  ),
};

export type NomeIcone = keyof typeof ICONES;

/** Lista completa, util para folha de contato e testes */
export const NOMES_ICONES = Object.keys(ICONES) as NomeIcone[];

type IcProps = {
  nome: NomeIcone;
  size?: number;
  /** Quando presente, o icone vira imagem acessivel; sem label, e decorativo */
  label?: string;
  className?: string;
  style?: CSSProperties;
};

/**
 * Icone proprietario do set. Cor do traco herda de `currentColor`
 * (padrao do app: wine-900 via cor de texto); os preenchimentos
 * duotone (gold-500 / wine-100) sao fixos por icone.
 */
export function Ic({ nome, size = 24, label, className, style }: IcProps) {
  return (
    <span
      className={className ? `ic ${className}` : 'ic'}
      style={{ display: 'inline-flex', flex: 'none', width: size, height: size, ...style }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {ICONES[nome]}
      </svg>
    </span>
  );
}

export type IconeElemento = ReactElement;
