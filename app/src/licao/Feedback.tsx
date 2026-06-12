import { useState } from 'react';
import type { Licao } from '../engine';
import type { Calibracao, ResolucaoExercicio } from './tipos';
import { Ic } from '../icones/Icones';
import { Tchin } from '../mascote';

/* ------------------------ "Certeza ou chute?" ------------------------ */

export function PainelCalibrar({ onEscolher }: { onEscolher: (c: Calibracao) => void }) {
  return (
    <div className="painel painel-calibrar app-chrome" role="dialog" aria-label="Certeza ou chute?">
      <p className="painel-titulo">Certeza ou chute?</p>
      <p className="painel-sub">Vale ser honesto. Isso treina o seu radar.</p>
      <div className="painel-botoes">
        <button type="button" className="btn btn-outline btn-meio tap" onClick={() => onEscolher('chute')}>
          Chute
        </button>
        <button
          type="button"
          className="btn btn-primary btn-jogo btn-meio tap"
          onClick={() => onEscolher('certeza')}
        >
          Certeza
        </button>
      </div>
    </div>
  );
}

/* ----------------------------- Reveal ------------------------------- */

function normalizar(texto: string): string[] {
  return (
    texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .match(/[a-z]{4,}/g) ?? []
  );
}

/** Trecho da ficha canonica mais proximo do "porque" do exercicio. */
export function trechoFicha(licao: Licao, porque: string): string {
  const chaves = new Set(normalizar(porque));
  let melhor = licao.fichaCanonica[0] ?? '';
  let melhorPts = -1;
  for (const frase of licao.fichaCanonica) {
    const pts = normalizar(frase).filter((t) => chaves.has(t)).length;
    if (pts > melhorPts) {
      melhorPts = pts;
      melhor = frase;
    }
  }
  return melhor;
}

interface PainelRevealProps {
  resolucao: ResolucaoExercicio;
  calibracao: Calibracao | null;
  /** Sem licao (pratica e Desafio do Dia) o "Entenda melhor" nao aparece. */
  licao?: Licao;
  rotuloContinuar: string;
  /** Acerto de marco (ultima resposta da rodada): o Tchin entra feliz. */
  marco?: boolean;
  /** False quando outro mascote ja esta em cena (toast do FTUE). */
  comMascote?: boolean;
  onContinuar: () => void;
  /** So para a cena de screenshot: abre o "Entenda melhor" ja expandido. */
  entendaInicial?: boolean;
}

export function PainelReveal({
  resolucao,
  calibracao,
  licao,
  rotuloContinuar,
  marco = false,
  comMascote = true,
  onContinuar,
  entendaInicial,
}: PainelRevealProps) {
  const [entenda, setEntenda] = useState(entendaInicial ?? false);
  const { correto, titulo, porque } = resolucao;
  /* Mascote vivo em TODO feedback (delight 7.1): feliz discreto no acerto,
     lamenta gentil no erro. Celebracao grande continua so nos marcos. */
  const mascoteEmCena = comMascote;
  void marco;

  let nota: string | null = null;
  if (calibracao === 'certeza' && !correto) {
    nota = 'Você tinha certeza e errou. É desses que o cérebro mais grava.';
  } else if (calibracao === 'chute' && correto) {
    nota = 'Chute certeiro. Leia o porquê e ele vira certeza.';
  }

  return (
    <div
      className={`painel painel-reveal ${correto ? 'painel-ok' : 'painel-erro'}`}
      role="status"
      aria-live="polite"
    >
      {mascoteEmCena && (
        <div className="reveal-tchin" aria-hidden="true">
          <Tchin estado={correto ? 'feliz' : 'lamenta'} tamanho={60} />
        </div>
      )}
      <div className="reveal-cabeca">
        <span className={`reveal-selo ${correto ? 'reveal-selo-ok' : 'reveal-selo-erro'}`}>
          <Ic nome={correto ? 'check' : 'x-fechar'} size={20} />
        </span>
        <p className="reveal-titulo">{titulo}</p>
      </div>
      <p className="reveal-porque">{porque}</p>
      {nota && <p className="reveal-nota">{nota}</p>}
      {!correto && licao && (
        <div className="entenda">
          <button
            type="button"
            className="entenda-toggle tap app-chrome"
            aria-expanded={entenda}
            onClick={() => setEntenda(!entenda)}
          >
            Entenda melhor
            <Ic nome="seta-baixo" size={16} className={entenda ? 'entenda-seta entenda-seta-aberta' : 'entenda-seta'} />
          </button>
          {entenda && <p className="entenda-texto">{trechoFicha(licao, porque)}</p>}
        </div>
      )}
      <button
        type="button"
        className={`btn btn-jogo btn-cheio tap ${correto ? 'btn-ok' : 'btn-erro'}`}
        onClick={onContinuar}
      >
        {rotuloContinuar}
      </button>
    </div>
  );
}
