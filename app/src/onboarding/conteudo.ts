/**
 * Conteudo da Licao 1 do FTUE (pesquisa/ftue.md, secao 6 + DECISOES secao 7).
 * A Licao 1 E o tutorial: 7 jogadas, nenhuma tela de leitura.
 *
 * Mapa das jogadas:
 *   J1 (indice 0)  impossivel de errar, conhecimento do mundo real (servir gelado)
 *   J2 (indice 1)  primeiro conteudo sensorial de verdade, facil
 *   J3 (intersticial) objetivo disfarcado de jogada: grava no engine e MUDA a J5
 *   J4 (indice 2)  pegadinha honesta ~50%: primeiro erro dispara o tooltip de vidas
 *   J5 (indice 3)  personalizada pelo objetivo da J3 (payoff visivel)
 *   J6 (intersticial) nivel, 3 cartas; cortada quando inferivel pelos erros
 *   J7 (indice 4)  consolidacao: so compoe o que ja foi dominado (padrao Portal)
 *
 * Fatos enologicos vivem SOMENTE na fichaCanonica abaixo (revisada).
 * Copy: voz Mago+Sabio, sem emoji, sem travessao, growth mindset no erro.
 */

import type { ExercicioMC, Licao, Objetivo } from '../engine';

/* Indices dos exercicios do engine dentro de licaoFtue.exercicios */
export const IDX_J1 = 0;
export const IDX_J2 = 1;
export const IDX_J4 = 2;
export const IDX_J5 = 3;
export const IDX_J7 = 4;

/* ----------------------- Jogadas de exercicio ----------------------- */

/* Comparativo de proposito: o tinto TAMBEM aceita geladeira (a J4 ensina
   exatamente isso), entao a pergunta precisa do "MAIS gelado" para ser
   factualmente exata. Branco serve a 8-12 graus; tinto fresco, 12-16. */
const j1: ExercicioMC = {
  tipo: 'mc',
  dificuldade: 1,
  pergunta: 'Qual destes você serviria mais gelado?',
  opcoes: ['Vinho branco', 'Vinho tinto'],
  correta: 0,
  okMsg: 'Isso. Os dois gostam de frescor, o branco só gosta de mais.',
  erroMsg: 'Tudo bem. Os dois gostam de frescor, o branco só gosta de mais.',
  porque: 'Branco e espumante vão bem gelados de verdade. O tinto também agradece um fresco, só que mais leve. Guarde essa: ela volta já, já.',
};

const j2: ExercicioMC = {
  tipo: 'mc',
  dificuldade: 1,
  pergunta: 'Você toma um gole de espumante bem gelado. O que a boca sente primeiro?',
  opcoes: [
    'Bolhas pinicando e um frescor que acorda a boca',
    'Um calor descendo, tipo pimenta',
    'Um amargo forte de café',
  ],
  correta: 0,
  okMsg: 'Exato. Seu paladar já está prestando atenção.',
  erroMsg: 'Quase. O espumante chega em bolhas e frescor. Vale provar de novo com calma.',
  porque: 'O gás do espumante pinica a língua de leve, e a temperatura baixa traz o frescor.',
};

const j4: ExercicioMC = {
  tipo: 'mc',
  dificuldade: 2,
  pergunta: 'E o tinto, pode ir à geladeira?',
  opcoes: [
    'Pode. Os leves agradecem uns 20 minutos',
    'Nunca. Tinto se serve do jeito que está',
    'Só vinho estragado vai para a geladeira',
  ],
  correta: 0,
  okMsg: 'Olha você derrubando mito de mesa.',
  erroMsg: 'Essa pega quase todo mundo. Tinto leve gosta de 20 minutos de geladeira.',
  porque: 'No calor do Brasil, o tinto passa do ponto. Os leves ficam mais saborosos levemente refrescados.',
};

const j5Mercado: ExercicioMC = {
  tipo: 'mc',
  dificuldade: 2,
  pergunta: 'No mercado, o rótulo diz seco. O que esperar do gole?',
  opcoes: [
    'Um vinho com quase nada de açúcar',
    'Um vinho que resseca a língua',
    'Um vinho perto de vencer',
  ],
  correta: 0,
  okMsg: 'Isso. Rótulo decifrado no primeiro dia.',
  erroMsg: 'Boa tentativa. Seco fala do açúcar: quase nenhum sobrou no vinho.',
  porque: 'Seco quer dizer pouco açúcar sobrando da fermentação. O nome assusta mais que o gole.',
};

const j5Restaurante: ExercicioMC = {
  tipo: 'mc',
  dificuldade: 2,
  pergunta: 'No restaurante, a mesa pediu fritura. Qual pedido segura bem a rodada?',
  opcoes: [
    'Um espumante seco, bem gelado',
    'Um tinto encorpado, sem gelar',
    'Tanto faz, vinho é tudo igual',
  ],
  correta: 0,
  okMsg: 'Pedido de quem sabe o que faz.',
  erroMsg: 'Quase. Fritura ama espumante: as bolhas limpam a boca a cada gole.',
  porque: 'A acidez e as bolhas do espumante cortam a gordura e renovam o apetite.',
};

const j5Receber: ExercicioMC = {
  tipo: 'mc',
  dificuldade: 2,
  pergunta: 'Convidados chegando, salgadinhos na mesa. O que abrir primeiro?',
  opcoes: [
    'Um espumante bem gelado',
    'O tinto mais pesado da estante',
    'Nenhum vinho antes do jantar',
  ],
  correta: 0,
  okMsg: 'Seus convidados estão em boas mãos.',
  erroMsg: 'Quase. Espumante gelado abre a noite: refresca e combina com salgados.',
  porque: 'Espumante refresca, abre o apetite e acompanha entradas salgadas com folga.',
};

const j5Presente: ExercicioMC = {
  tipo: 'mc',
  dificuldade: 2,
  pergunta: 'Presente para um casal que adora receber visitas. Qual garrafa você leva?',
  opcoes: [
    'Um espumante seco, para abrirem bem gelado',
    'O tinto mais pesado da loja, sem pensar',
    'Tanto faz, garrafa é tudo igual',
  ],
  correta: 0,
  okMsg: 'Presente entregue, anfitriões conquistados.',
  erroMsg: 'Quase. Espumante gelado abre qualquer encontro e acompanha os salgados.',
  porque: 'Espumante se serve bem gelado e acompanha entradas e salgados: presente que já chega pronto para a ocasião.',
};

const j5Trabalho: ExercicioMC = {
  tipo: 'mc',
  dificuldade: 2,
  pergunta: 'Primeiro dia atendendo. O cliente pediu indicação: um tinto leve para o calor. Qual dica vai junto?',
  opcoes: [
    'Uns 20 minutos de geladeira antes de servir',
    'Deixar a garrafa ao sol para abrir o aroma',
    'Tinto nunca chega perto da geladeira',
  ],
  correta: 0,
  okMsg: 'Dica de quem vive de vinho.',
  erroMsg: 'Quase. Tinto leve agradece 20 minutos de geladeira, e o cliente agradece a dica.',
  porque: 'Tintos leves ficam mais saborosos levemente refrescados. Dica simples que faz o cliente voltar.',
};

const j5Outros: ExercicioMC = {
  tipo: 'mc',
  dificuldade: 2,
  pergunta: 'Uma garrafa diz seco no rótulo. O que esperar do primeiro gole?',
  opcoes: [
    'Um vinho com quase nada de açúcar',
    'Um vinho que resseca a língua',
    'Um vinho perto de vencer',
  ],
  correta: 0,
  okMsg: 'Isso. Primeira palavra do rótulo decifrada.',
  erroMsg: 'Boa tentativa. Seco fala do açúcar: quase nenhum sobrou no vinho.',
  porque: 'Seco quer dizer pouco açúcar sobrando da fermentação. O nome assusta mais que o gole.',
};

const j7: ExercicioMC = {
  tipo: 'mc',
  dificuldade: 1,
  pergunta: 'Para fechar: amigos a caminho e um espumante na mão. Qual é o plano?',
  opcoes: [
    'Geladeira nele, bem gelado na hora de abrir',
    'Deixar no armário até a visita chegar',
    'Esquentar de leve para soltar o aroma',
  ],
  correta: 0,
  okMsg: 'Pronto. Primeira lição no bolso.',
  erroMsg: 'Respira. Espumante pede geladeira: bem gelado ele brilha.',
  porque: 'Espumante se serve bem gelado, entre 6 e 10 graus. É a regra que abre qualquer encontro.',
};

/** J5 muda conforme o objetivo escolhido na J3 (payoff visivel da escolha). */
export const j5PorObjetivo: Record<Objetivo, ExercicioMC> = {
  mercado: j5Mercado,
  restaurante: j5Restaurante,
  receber: j5Receber,
  presente: j5Presente,
  trabalho: j5Trabalho,
  outros: j5Outros,
};

/* --------------------------- Licao do engine -------------------------- */

export const licaoFtue: Licao = {
  id: 'ftue-l1',
  unidade: 'ftue',
  ordem: 0,
  titulo: 'Lição 1: primeiros goles',
  habilidade: 'rotulo',
  hook: '',
  fichaCanonica: [
    'Vinhos brancos e espumantes são servidos bem gelados, entre 6 e 10 graus.',
    'Vinhos tintos são servidos frescos, entre 14 e 18 graus, abaixo da temperatura ambiente do Brasil.',
    'Tintos leves, como o Pinot Noir, ficam mais saborosos com uns 20 minutos de geladeira antes de servir.',
    'Vinho seco é o que tem pouco ou nenhum açúcar sobrando da fermentação.',
    'A acidez e as bolhas do espumante limpam a gordura da boca, por isso ele acompanha bem frituras e salgados.',
    'O gás carbônico do espumante provoca a sensação de bolhas pinicando a língua.',
  ],
  exercicios: [j1, j2, j4, j5Mercado, j7],
  aplicacao: 'Na próxima garrafa que passar pela sua mão, você já sabe se ela vai ou não para a geladeira.',
  recap: 'Branco e espumante vão gelados, tinto vai fresco, e seco fala de açúcar, nunca de defeito.',
  voceAgoraSabe: [
    'Branco e espumante se servem bem gelados. O tinto vai fresco, e os leves aceitam geladeira rápida',
    'Seco no rótulo fala do açúcar: quase nenhum sobrou no vinho',
  ],
  curiosidade:
    'A regra dos 20 minutos de geladeira vale ouro no verão: até um tinto encorpado fica mais elegante levemente refrescado.',
  teaser: 'Na trilha, a primeira parada: seco, meio seco e suave, sem mistério.',
};

/* --------------------- Cartas dos interstitials ---------------------- */

export interface CartaConteudo {
  id: string;
  rotulo: string;
  /** 1 a 3, so para as cartas de nivel (pontinhos). */
  pontos?: number;
}

/* J3: grid 2x3, rotulos curtos (1 toque, leitura de relance) */
export const CARTAS_OBJETIVO: CartaConteudo[] = [
  { id: 'mercado', rotulo: 'No mercado' },
  { id: 'restaurante', rotulo: 'No restaurante' },
  { id: 'receber', rotulo: 'Recebendo em casa' },
  { id: 'presente', rotulo: 'Presentear' },
  { id: 'trabalho', rotulo: 'Trabalho com vinho' },
  { id: 'outros', rotulo: 'Outro motivo' },
];

export const CARTAS_NIVEL: CartaConteudo[] = [
  { id: 'iniciante', rotulo: 'Estou começando', pontos: 1 },
  { id: 'intermediario', rotulo: 'Já arrisco uns palpites', pontos: 2 },
  { id: 'avancado', rotulo: 'Já sei o que gosto', pontos: 3 },
];

/* ------------------------- Falas do mascote -------------------------- */
/* Regra do ruido (George Fan): o Tchin so fala para ensinar ou celebrar.
   Maximo de 8 palavras por fala, sem excecao. */

export const FALAS = {
  abertura: 'Vou te provar uma coisa.',
  celebraJ1: 'Viu? Você já sabia o começo.',
  vidas: 'Errou? Tranquilo. Você tem 5 vidas.',
  conclusao: 'Tchin! Pelo seu primeiro passo.',
  coleta: 'Seus primeiros cristais. Toque para guardar.',
  loja: 'Sem vidas? Cristais recarregam na loja.',
  objetivo: {
    mercado: 'Boa. A prateleira vai virar terreno seu.',
    restaurante: 'Boa. A carta de vinhos vira aliada.',
    receber: 'Boa. Seus encontros vão ficar famosos.',
    presente: 'Boa. Presente com história ninguém esquece.',
    trabalho: 'Boa. Seu cliente vai notar a diferença.',
    outros: 'Boa. Curiosidade é o melhor começo.',
  } as Record<Objetivo, string>,
} as const;
