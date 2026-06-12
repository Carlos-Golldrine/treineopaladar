/**
 * Modo "Revisar com cartas" da Pratica: flashcards derivados das fichas
 * canonicas, flip 3D no toque, autoavaliacao Sabia / Quase / Nao sabia
 * alimentando a repeticao espacada (D+1/3/7/21 por card) e XP de revisao
 * pago pelo engine (concluirPratica: 10 com soft cap + vida de revisao).
 */
import { useMemo, useState } from 'react';
import { todasLicoes, licoesPorId } from '../content';
import { obterStore } from '../engine';
import type { RespostaPratica, ResultadoPratica } from '../engine';
import { XP_REVISAO } from '../engine';
import { Ic } from '../icones/Icones';
import { Odometro, TchinObservador } from '../coreografia/Coreografias';
import { tocar } from '../som/som';
import { vibrar } from '../licao/tipos';
import {
  avaliarCarta,
  derivarCartas,
  lerAgenda,
  gravarAgenda,
  montarSessaoCartas,
} from './cartas';
import type { AvaliacaoCarta, Carta } from './cartas';
import { rngDeterministico } from './sessao';

import './cartas.css';

/** Cards das licoes ja concluidas (as cartas nascem do que foi treinado). */
export function baralhoDisponivel(): Carta[] {
  const progresso = obterStore().getEstado().progresso;
  const concluidas = todasLicoes.filter((l) => (progresso[l.id]?.vezesConcluida ?? 0) > 0);
  return derivarCartas(concluidas);
}

interface Props {
  aoVoltar: () => void;
  /** Cena de screenshot: sessao deterministica. */
  cena?: boolean;
}

type Etapa =
  | { t: 'jogando' }
  | { t: 'resultado'; resultado: ResultadoPratica; sabia: number; total: number };

/** A frente do card: o fato com a lacuna desenhada (nao so underscores). */
function FrenteComLacuna({ frente }: { frente: string }) {
  const pedacos = frente.split('_____');
  return (
    <p className="carta3d-texto">
      <span>
        {pedacos.map((pedaco, i) => (
          <span key={i}>
            {pedaco}
            {i < pedacos.length - 1 && <span className="carta3d-lacuna" aria-label="lacuna" />}
          </span>
        ))}
      </span>
    </p>
  );
}

/** O verso: o fato canonico integro, com a palavra-chave em destaque. */
function VersoComChave({ fato, chave }: { fato: string; chave: string }) {
  const indice = fato.toLowerCase().indexOf(chave.toLowerCase());
  if (indice < 0) {
    return (
      <p className="carta3d-texto">
        <span>{fato}</span>
      </p>
    );
  }
  return (
    <p className="carta3d-texto">
      <span>
        {fato.slice(0, indice)}
        <strong className="carta3d-chave">{fato.slice(indice, indice + chave.length)}</strong>
        {fato.slice(indice + chave.length)}
      </span>
    </p>
  );
}

export function RevisarCartas({ aoVoltar, cena }: Props) {
  const rng = useMemo(() => (cena ? rngDeterministico(20260612) : Math.random), [cena]);
  const [agenda, setAgenda] = useState(lerAgenda);
  const [sessao, setSessao] = useState<Carta[]>(() =>
    montarSessaoCartas(baralhoDisponivel(), lerAgenda(), Date.now(), rng),
  );
  const [posicao, setPosicao] = useState(0);
  const [virada, setVirada] = useState(false);
  const [respostas, setRespostas] = useState<RespostaPratica[]>([]);
  const [etapa, setEtapa] = useState<Etapa>({ t: 'jogando' });

  const maisUma = () => {
    setSessao(montarSessaoCartas(baralhoDisponivel(), lerAgenda(), Date.now(), rng));
    setPosicao(0);
    setVirada(false);
    setRespostas([]);
    setEtapa({ t: 'jogando' });
  };

  const avaliar = (avaliacao: AvaliacaoCarta) => {
    const carta = sessao[posicao];
    if (!carta) return;
    const agora = Date.now();
    const novaAgenda = avaliarCarta(agenda, carta.id, avaliacao, agora);
    setAgenda(novaAgenda);
    gravarAgenda(novaAgenda);
    const novas: RespostaPratica[] = [
      ...respostas,
      { correto: avaliacao === 'sabia', dificuldade: 1, habilidade: carta.habilidade },
    ];
    setRespostas(novas);
    vibrar();
    if (avaliacao === 'sabia') tocar('acerto');
    if (avaliacao === 'naosabia') tocar('erro');

    if (posicao + 1 >= sessao.length) {
      const resultado = obterStore().concluirPratica(novas);
      tocar('conclusao');
      setEtapa({
        t: 'resultado',
        resultado,
        sabia: novas.filter((r) => r.correto).length,
        total: novas.length,
      });
      return;
    }
    setPosicao(posicao + 1);
    setVirada(false);
  };

  /* Baralho vazio: caminho triste com o mesmo capricho do feliz */
  if (sessao.length === 0) {
    return (
      <div className="player player-vazio">
        <span className="vazio-selo">
          <Ic nome="livro-flashcard" size={28} />
        </span>
        <h1 className="vazio-titulo">As cartas nascem das lições</h1>
        <p className="vazio-texto">
          Cada lição concluída vira um punhado de cartas para revisar. Termine uma na trilha e volte
          aqui.
        </p>
        <button type="button" className="btn btn-primary btn-jogo btn-cheio tap" onClick={aoVoltar}>
          Voltar à trilha
        </button>
      </div>
    );
  }

  if (etapa.t === 'resultado') {
    const { resultado, sabia, total } = etapa;
    return (
      <div className="player player-vazio">
        <span className="vazio-selo vazio-selo-ok">
          <Ic nome="livro-flashcard" size={28} />
        </span>
        <h1 className="vazio-titulo">
          {sabia === total ? 'Tudo na ponta da língua.' : 'Revisão concluída.'}
        </h1>
        <p className="vazio-texto">
          {sabia} de {total} você já sabia.
          {sabia < total
            ? ' As outras voltam amanhã, na hora certa de fixar.'
            : ' Essas cartas agora descansam alguns dias.'}
        </p>
        <div className="pratica-placar">
          <span className="pratica-ganho pratica-ganho-xp">
            +<Odometro valor={resultado.xp} /> XP
          </span>
          {resultado.vidaRecuperada && (
            <span className="pratica-ganho pratica-ganho-vida">
              <Ic nome="coracao-vida" size={16} />
              +1 vida
            </span>
          )}
        </div>
        {resultado.xp < XP_REVISAO && (
          <p className="vazio-texto pratica-nota">
            XP de revisão reduzido pelo ritmo de hoje. Amanhã volta cheio.
          </p>
        )}
        <button type="button" className="btn btn-primary btn-jogo btn-cheio tap" onClick={maisUma}>
          Mais uma rodada
        </button>
        <button type="button" className="btn btn-outline btn-cheio tap" onClick={aoVoltar}>
          Voltar à trilha
        </button>
      </div>
    );
  }

  const carta = sessao[posicao];
  const licao = licoesPorId[carta.licaoId];

  return (
    <div className="player">
      <header className="player-topo app-chrome">
        <button type="button" className="player-fechar tap" aria-label="Sair das cartas" onClick={aoVoltar}>
          <Ic nome="x-fechar" size={22} />
        </button>
        <div
          className="player-barra"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round((posicao / sessao.length) * 100)}
          aria-label={`Carta ${posicao + 1} de ${sessao.length}`}
        >
          <div
            className="player-barra-fill"
            style={{
              transform: `translateX(${(Math.max(0.04, posicao / sessao.length) - 1) * 100}%)`,
            }}
          />
        </div>
        <span className="pratica-contagem" aria-hidden="true">
          {posicao + 1}/{sessao.length}
        </span>
      </header>

      <div className="cartas-palco" key={posicao}>
        <button
          type="button"
          className={`carta3d tap${virada ? ' carta3d-virada' : ''}`}
          aria-label={virada ? 'Carta virada, fato completo' : 'Virar a carta'}
          onClick={() => setVirada(true)}
        >
          <span className="carta3d-miolo">
            <span className="carta3d-face carta3d-frente">
              <span className="carta3d-eyebrow">
                <Ic nome="livro-flashcard" size={16} />
                Complete a frase
              </span>
              <FrenteComLacuna frente={carta.frente} />
              <span className="carta3d-rodape">Toque para virar</span>
            </span>
            <span className="carta3d-face carta3d-verso">
              <span className="carta3d-eyebrow carta3d-eyebrow-verso">
                <Ic nome="check" size={16} />
                Da ficha da lição
              </span>
              <VersoComChave fato={carta.fato} chave={carta.chave} />
              {licao && <span className="carta3d-fonte">{licao.titulo}</span>}
            </span>
          </span>
        </button>

        {virada ? (
          <div className="cartas-avaliacao" role="group" aria-label="Você sabia?">
            <button
              type="button"
              className="btn btn-carta btn-carta-nao tap"
              onClick={() => avaliar('naosabia')}
            >
              Não sabia
            </button>
            <button
              type="button"
              className="btn btn-carta btn-carta-quase tap"
              onClick={() => avaliar('quase')}
            >
              Quase
            </button>
            <button
              type="button"
              className="btn btn-jogo btn-ok btn-carta tap"
              onClick={() => avaliar('sabia')}
            >
              Sabia
            </button>
          </div>
        ) : (
          <p className="cartas-dica-virar" aria-hidden="true">
            Tente lembrar antes de virar. É aí que fixa.
          </p>
        )}
      </div>

      <TchinObservador visivel={!virada} />
    </div>
  );
}
