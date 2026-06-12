/**
 * Contrato de conteudo do Treine seu Paladar.
 * Fonte da verdade dos types das licoes autorais e dos payloads de exercicio.
 * O engine ainda nao existe; quando nascer, deve importar daqui.
 */

export type Habilidade =
  | 'tanino'
  | 'acidez'
  | 'corpo'
  | 'docura'
  | 'frutado'
  | 'rotulo'
  | 'harmonizacao';

/** 1 = aquecimento (~90% de acerto esperado), 2 = nucleo (75-85%), 3 = desafio */
export type Dificuldade = 1 | 2 | 3;

interface ExercicioBase {
  dificuldade: Dificuldade;
  /** Quando true, a UI pergunta "certeza ou chute?" antes do reveal (hipercorrecao + curva de calibracao). */
  calibrar?: boolean;
}

export interface ExercicioMC extends ExercicioBase {
  tipo: 'mc';
  pergunta: string;
  opcoes: string[];
  /** Indice da opcao correta em `opcoes`. */
  correta: number;
  okMsg: string;
  erroMsg: string;
  /** Explicacao de 1 frase exibida no reveal. */
  porque: string;
  /** Path de rotulo real (ex.: "/rotulos/{id}.webp"), exibido acima da pergunta. */
  imagem?: string;
}

export interface CartaSwipe {
  texto: string;
  verdade: boolean;
  porque: string;
}

export interface ExercicioSwipe extends ExercicioBase {
  tipo: 'swipe';
  instrucao: string;
  /** 4 a 6 cartas. */
  cartas: CartaSwipe[];
}

export interface ExercicioSlider extends ExercicioBase {
  tipo: 'slider';
  pergunta: string;
  labelMin: string;
  labelMax: string;
  /** Posicao correta na regua, 0-100. */
  alvo: number;
  /** Margem aceita para ambos os lados, 10-20. */
  tolerancia: number;
  porque: string;
}

export interface ExercicioOrdenar extends ExercicioBase {
  tipo: 'ordenar';
  instrucao: string;
  /** Os itens chegam embaralhados na UI. */
  itens: string[];
  /** Indices de `itens` na ordem correta. */
  ordemCorreta: number[];
  porque: string;
}

export interface ExercicioIntruso extends ExercicioBase {
  tipo: 'intruso';
  pergunta: string;
  opcoes: string[];
  /** Indice do intruso em `opcoes`. */
  intruso: number;
  /** A regra do grupo em 1 frase de gente. */
  regra: string;
  /** Path de rotulo real (ex.: "/rotulos/{id}.webp"), exibido acima da pergunta. */
  imagem?: string;
}

export interface ExercicioDuasVerdades extends ExercicioBase {
  tipo: 'duasverdades';
  tema: string;
  /** Sempre 3 afirmacoes: 2 verdades e 1 mentira. */
  afirmacoes: string[];
  /** Indice da mentira em `afirmacoes`. */
  mentira: number;
  porque: string;
}

export type Exercicio =
  | ExercicioMC
  | ExercicioSwipe
  | ExercicioSlider
  | ExercicioOrdenar
  | ExercicioIntruso
  | ExercicioDuasVerdades;

export type TipoExercicio = Exercicio['tipo'];

export interface Licao {
  /** Ex.: "u1-l1" */
  id: string;
  /** Ex.: "u1" */
  unidade: string;
  ordem: number;
  titulo: string;
  habilidade: Habilidade;
  /** 1 frase que fisga, exibida antes da primeira jogada. */
  hook: string;
  /** Fatos enologicos verificaveis. Unica fonte de fato da licao; a factory de questoes deriva daqui. */
  fichaCanonica: string[];
  exercicios: Exercicio[];
  /** 1 frase de uso na vida real, exibida no fechamento. */
  aplicacao: string;
  /** 1 frase de sintese. */
  recap: string;
  /** Frases concretas do recap "Voce agora sabe" (mastery experience). */
  voceAgoraSabe: string[];
  /** 1 fato saboroso para a celebracao. */
  curiosidade: string;
  /** 1 frase sobre a proxima licao. */
  teaser: string;
}

export interface UnidadeMeta {
  /** Ex.: "u1" */
  id: string;
  titulo: string;
  subtitulo: string;
  /** Hex da paleta travada do brief. */
  cor: string;
  /** Ids das licoes na ordem da trilha. */
  ordemLicoes: string[];
}
