/** Fixtures compartilhadas dos testes do engine. */

import type { Licao } from '../types';
import type { StorageLike } from '../store';

/** Storage em memoria com a mesma cara do localStorage. */
export function memStorage(): StorageLike & { dados: Map<string, string> } {
  const dados = new Map<string, string>();
  return {
    dados,
    getItem: (k) => dados.get(k) ?? null,
    setItem: (k, v) => {
      dados.set(k, v);
    },
  };
}

/** Relogio controlavel para injetar no store. */
export function relogio(inicio: number): { agora: () => number; avancar: (ms: number) => void; ir: (ts: number) => void } {
  let t = inicio;
  return {
    agora: () => t,
    avancar: (ms) => {
      t += ms;
    },
    ir: (ts) => {
      t = ts;
    },
  };
}

/** Licao minima valida no contrato, com 4 exercicios (dificuldades 1, 2, 2, 3). */
export function licaoFixture(id = 'u1-l1'): Licao {
  return {
    id,
    unidade: 'u1',
    ordem: 1,
    titulo: 'Tanino sem medo',
    habilidade: 'tanino',
    hook: 'Aquela secura na boca tem nome.',
    fichaCanonica: [
      'Tanino vem da casca, da semente e do engaco da uva.',
      'Tanino da a sensacao de adstringencia, a boca que seca.',
    ],
    exercicios: [
      {
        tipo: 'mc',
        dificuldade: 1,
        pergunta: 'De onde vem o tanino?',
        opcoes: ['Da casca da uva', 'Do acucar', 'Da agua'],
        correta: 0,
        okMsg: 'Isso. Casca e companhia.',
        erroMsg: 'Quase. O tanino mora na casca.',
        porque: 'Tanino vem da casca, da semente e do engaco.',
      },
      {
        tipo: 'slider',
        dificuldade: 2,
        pergunta: 'Quanto corpo tem um Malbec classico?',
        labelMin: 'leve',
        labelMax: 'encorpado',
        alvo: 70,
        tolerancia: 15,
        porque: 'Malbec costuma ser encorpado, mas sem exagero.',
      },
      {
        tipo: 'intruso',
        dificuldade: 2,
        calibrar: true,
        pergunta: 'Qual destes NAO e fonte de tanino?',
        opcoes: ['Casca', 'Semente', 'Acucar', 'Engaco'],
        intruso: 2,
        regra: 'Tanino vem das partes solidas da uva, nunca do acucar.',
      },
      {
        tipo: 'duasverdades',
        dificuldade: 3,
        tema: 'Tanino na taca',
        afirmacoes: [
          'Tanino seca a boca.',
          'Tanino vem da casca.',
          'Tanino deixa o vinho doce.',
        ],
        mentira: 2,
        porque: 'Tanino e adstringencia, nao docura.',
      },
    ],
    aplicacao: 'Na proxima taca de tinto, repare na secura que fica na gengiva.',
    recap: 'Tanino e a secura que vem das partes solidas da uva.',
    voceAgoraSabe: [
      'Reconhecer tanino pela boca que seca.',
      'Dizer de onde o tanino vem.',
    ],
    curiosidade: 'Cha preto forte tambem tem tanino, por isso amarra na boca.',
    teaser: 'A seguir: acidez, a faisca que faz o vinho ficar vivo.',
  };
}

/** Timestamp local de uma data e hora (usa o fuso da maquina, igual ao engine). */
export function ts(ano: number, mes: number, dia: number, hora = 10, minuto = 0): number {
  return new Date(ano, mes - 1, dia, hora, minuto).getTime();
}
