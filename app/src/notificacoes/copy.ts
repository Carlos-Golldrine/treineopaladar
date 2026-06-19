/**
 * Biblioteca de copy de notificacao, portada de docs/NOTIFICACOES.md
 * secao 4 para dado TIPADO. Sera consumida pelo backend de push (Edge
 * Function cron) e por testes; aqui no client serve ao primer e ao
 * fallback de notificacao local.
 *
 * Leis da marca (verbatim, BRIEF secao 1 + NOTIFICACOES secao 4):
 *  - sem emoji, sem travessao (em dash e en dash)
 *  - acentuacao pt-BR completa (o texto e visivel ao usuario)
 *  - voz Mago + Sabio, anti-elitista, cutucada gentil nunca mesquinha
 *  - titulo ~30-40 caracteres, corpo ~100-120 visiveis
 *  - {N}, {nome}, {X}, {unidade} sao variaveis, resolvidas pelo backend
 *  - NUNCA "ultima chance" (vocabulario banido)
 *
 * 2-3 variantes por categoria para o "bandit pobre" do backend (escolher
 * a variante com mais clique). A ordem das variantes nao tem significado.
 */

/** Uma mensagem pronta para virar notificacao (apos resolver variaveis). */
export interface VarianteCopy {
  /** Titulo curto, ~30-40 caracteres. */
  titulo: string;
  /** Corpo, ~100-120 caracteres visiveis. */
  corpo: string;
}

/**
 * Categorias dos gatilhos de notificacao (mapa de NOTIFICACOES secao 3).
 * win-back e quebrado por janela (d1/d3/d7/d14) porque o tom muda em cada.
 */
export type CategoriaNotif =
  | 'ofensiva_risco'
  | 'meta_diaria'
  | 'marco_streak'
  | 'winback_d1'
  | 'winback_d3'
  | 'winback_d7'
  | 'winback_d14'
  | 'desistencia'
  | 'liga'
  | 'mesa_social'
  | 'desafio_dia'
  | 'conquista'
  | 'curiosidade'
  | 'recompensa';

export type BibliotecaCopy = Record<CategoriaNotif, readonly VarianteCopy[]>;

/**
 * A biblioteca. Congelada para que ninguem mute por engano em runtime;
 * o backend le, escolhe variante e resolve as variaveis.
 */
export const COPY_NOTIF: BibliotecaCopy = {
  /* Ofensiva em risco: o motor, aversao a perda pura (streak-saver). */
  ofensiva_risco: [
    {
      titulo: 'Sua ofensiva vence à meia-noite',
      corpo: 'Falta uma lição pra manter os {N} dias. São 2 minutos.',
    },
    {
      titulo: 'Tchin aqui, rapidinho',
      corpo: 'Seu paladar treinou {N} dias seguidos. Não deixa zerar hoje.',
    },
    {
      titulo: 'O relógio tá correndo',
      corpo: 'Uma lição agora e a ofensiva de {N} dias continua viva.',
    },
  ],

  /* Meta diaria quase batida: nudge leve. */
  meta_diaria: [
    {
      titulo: 'Faltou pouco hoje',
      corpo: 'Sua meta do dia tá quase fechando. Uma lição resolve.',
    },
    {
      titulo: 'Você começou e parou',
      corpo: 'Tá a uma lição de bater a meta de hoje. Bora fechar?',
    },
  ],

  /* Marco de streak / elogio: reforco positivo, nao so pressao. */
  marco_streak: [
    {
      titulo: '{N} dias. Olha você.',
      corpo: 'Seu paladar tá ficando afiado de verdade. Amanhã tem mais.',
    },
    {
      titulo: 'Uma semana inteira',
      corpo: '7 dias de treino. Quem chega aqui costuma não parar mais.',
    },
    {
      titulo: '100 dias de paladar',
      corpo: 'Isso aqui é coisa de quem leva vinho a sério. Respeito.',
    },
  ],

  /* Win-back escalonado: tom muda por janela; nunca culpa. */
  winback_d1: [
    {
      titulo: 'O vinho perguntou de você',
      corpo: 'Bora destravar mais um eixo do paladar hoje?',
    },
    {
      titulo: 'Cadê você, ein',
      corpo: 'Ficou faltando o treino de ontem. A gente recomeça leve.',
    },
  ],
  winback_d3: [
    {
      titulo: 'Cadê você?',
      corpo: 'Faz três dias. A gente recomeça leve, do ponto onde parou.',
    },
    {
      titulo: 'Três dias sem treino',
      corpo: 'Seu progresso tá guardado. Volta no seu ritmo, sem corre.',
    },
  ],
  winback_d7: [
    {
      titulo: 'Seu paladar sente falta de treino',
      corpo: 'Uma semana parado. Volta quando quiser, sem pressa.',
    },
    {
      titulo: 'Faz uma semana',
      corpo: 'O treino fica do jeito que você deixou. Só tocar pra seguir.',
    },
  ],
  winback_d14: [
    {
      titulo: 'Ainda dá pra retomar',
      corpo: 'Seu progresso tá guardado. Sem cobrança, no seu tempo.',
    },
    {
      titulo: 'Duas semanas, e tudo bem',
      corpo: 'Seu paladar não esquece o que aprendeu. Quando der, a gente continua.',
    },
  ],

  /* Desistencia (psicologia reversa, rarissima, arma de ultima instancia). */
  desistencia: [
    {
      titulo: 'Tudo bem, eu paro',
      corpo: 'Esses lembretes não parecem ajudar. Vou sossegar por uns dias.',
    },
  ],

  /* Liga: competicao com prazo. Sem "ultima chance" (banido). */
  liga: [
    {
      titulo: 'Você subiu pra Reserva',
      corpo: 'Boa semana de treino. A divisão nova começa agora.',
    },
    {
      titulo: 'Última hora na liga',
      corpo: 'Faltam {X} XP pra segurar sua posição. A semana fecha hoje.',
    },
  ],

  /* Mesa e social: o loop de accountability da dupla, com cap. */
  mesa_social: [
    {
      titulo: 'Alguém deu um Tchin pra você',
      corpo: '{nome} curtiu seu progresso na mesa. Dá uma olhada.',
    },
    {
      titulo: '{nome} tá te esperando',
      corpo: 'A dupla trava se um dos dois some. Não deixa cair hoje.',
    },
    {
      titulo: 'Degustação da semana no ar',
      corpo: 'Um rótulo novo na mesa. Qual seu palpite de paladar?',
    },
  ],

  /* Desafio do Dia: habito diario, na manha do usuario. */
  desafio_dia: [
    {
      titulo: 'Rótulo do dia chegou',
      corpo: 'Quatro perguntas, um rótulo. Será que você acerta hoje?',
    },
    {
      titulo: 'A mesa já encarou o desafio',
      corpo: 'Seu desafio de hoje ainda tá aberto. Topa?',
    },
  ],

  /* Conquista / coroa / nivel: elogio na hora. */
  conquista: [
    {
      titulo: 'Coroa nova no bolso',
      corpo: 'Você dominou {unidade}. Tá lendo vinho que nem gente grande.',
    },
    {
      titulo: 'Subiu de nível',
      corpo: 'Seu Score de Paladar deu um salto. Olha só onde você chegou.',
    },
  ],

  /* Valor / curiosidade: reengaja por conteudo, sem cobrar. */
  curiosidade: [
    {
      titulo: 'Tanino em uma frase',
      corpo: 'É aquela secura na boca do tinto. Treina isso em 2 minutos?',
    },
    {
      titulo: 'Sabia disso?',
      corpo: 'Espumante seco é mais doce que o brut. Vem entender o porquê.',
    },
  ],

  /* Recompensa: o que os cristais destravaram. */
  recompensa: [
    {
      titulo: 'Seus cristais renderam',
      corpo: 'Já dá pra abrir um modo novo. Vem ver o que destravou.',
    },
    {
      titulo: 'Cofre cheio de cristais',
      corpo: 'Você juntou o bastante pra proteger a ofensiva. Dá uma espiada.',
    },
  ],
} as const;

/** Todas as categorias, util para testes e para o painel do backend. */
export const CATEGORIAS_NOTIF = Object.keys(COPY_NOTIF) as CategoriaNotif[];

/**
 * Resolve as variaveis ({N}, {nome}, {X}, {unidade}) de uma string de
 * copy. O backend faz o mesmo; exposto aqui para o fallback local e
 * para testes. Variavel sem valor fica como esta (nunca quebra).
 */
export function resolverCopy(
  texto: string,
  vars: Partial<Record<'N' | 'nome' | 'X' | 'unidade', string | number>>,
): string {
  return texto.replace(/\{(N|nome|X|unidade)\}/g, (m, chave: 'N' | 'nome' | 'X' | 'unidade') => {
    const v = vars[chave];
    return v === undefined ? m : String(v);
  });
}
