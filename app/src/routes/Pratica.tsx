import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XP_REVISAO, obterStore } from '../engine';
import type { RespostaPratica, ResultadoPratica } from '../engine';
import type { BancoPratica, ItemPratica } from '../pratica/tipos';
import { NOME_HABILIDADE } from '../pratica/tipos';
import { marcarVistos, montarRodada, rngDeterministico } from '../pratica/sessao';
import type { Habilidade } from '../engine';
import { ExMC } from '../licao/ExMC';
import { ExIntruso } from '../licao/ExIntruso';
import { PainelReveal } from '../licao/Feedback';
import type { FaseExercicio, ResolucaoExercicio } from '../licao/tipos';
import { vibrar } from '../licao/tipos';
import { Ic } from '../icones/Icones';
import { DelayedSkeleton } from '../components/DelayedSkeleton';
import { Odometro, TchinObservador } from '../coreografia/Coreografias';
import { tocar } from '../som/som';
import { RevisarCartas } from '../pratica/RevisarCartas';
import { baralhoDisponivel, cartasParaHoje, lerAgenda } from '../pratica/cartas';
import { track } from '../lib/analytics';

import '../licao/player.css';
import './pratica.css';

type Etapa =
  | { t: 'carregando' }
  | { t: 'pronto'; foco: Habilidade }
  | { t: 'jogando' }
  | { t: 'cartas' }
  | { t: 'resultado'; resultado: ResultadoPratica };

export default function Pratica() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const cena = params.get('cena');
  /* Entrada direta no modo cartas vinda da Trilha (sem rng deterministico). */
  const irCartas = params.get('ir') === 'cartas';
  const [banco, setBanco] = useState<ItemPratica[] | null>(null);
  const [etapa, setEtapa] = useState<Etapa>({ t: 'carregando' });
  const [rodada, setRodada] = useState<ItemPratica[]>([]);
  const [posicao, setPosicao] = useState(0);
  const [respostas, setRespostas] = useState<RespostaPratica[]>([]);
  const [fase, setFase] = useState<FaseExercicio>('respondendo');
  const [resolucao, setResolucao] = useState<ResolucaoExercicio | null>(null);

  /* Banco lazy: fora do bundle inicial, chega so quando a pratica abre */
  useEffect(() => {
    let vivo = true;
    import('../content/pratica/banco-pratica.json').then((mod) => {
      if (!vivo) return;
      const dado = mod.default as unknown as BancoPratica;
      setBanco(dado.exercicios);
    });
    return () => {
      vivo = false;
    };
  }, []);

  const rng = useMemo(() => (cena ? rngDeterministico(20260611) : Math.random), [cena]);

  /* cena=cartas (screenshot) ou ir=cartas (entrada real pela Trilha): o modo
     de cartas nao depende do banco, entao abre direto sem passar pela rodada. */
  useEffect(() => {
    if ((cena === 'cartas' || irCartas) && etapa.t === 'carregando') setEtapa({ t: 'cartas' });
  }, [cena, irCartas, etapa]);

  /* Com o banco em maos, monta a rodada da vez */
  useEffect(() => {
    if (!banco || etapa.t !== 'carregando') return;
    const score = obterStore().scorePaladarAtual();
    /* cena=rotulo (screenshot): so itens com rotulo real na rodada */
    const fonte = cena === 'rotulo' ? banco.filter((e) => e.imagem) : banco;
    const { itens, foco } = montarRodada(fonte.length >= 8 ? fonte : banco, score, rng);
    setRodada(itens);
    if (cena === 'jogo' || cena === 'rotulo') {
      setEtapa({ t: 'jogando' });
    } else {
      setEtapa({ t: 'pronto', foco });
    }
  }, [banco, etapa, rng, cena]);

  const comecar = () => {
    setPosicao(0);
    setRespostas([]);
    setFase('respondendo');
    setResolucao(null);
    setEtapa({ t: 'jogando' });
    track('pratica_iniciada', { exercicios: rodada.length });
  };

  const maisUma = () => {
    if (!banco) return;
    const score = obterStore().scorePaladarAtual();
    const { itens } = montarRodada(banco, score, rng);
    setRodada(itens);
    comecar();
  };

  const onResolver = (r: ResolucaoExercicio) => {
    setResolucao(r);
    setRespostas((rs) => [
      ...rs,
      { correto: r.correto, dificuldade: rodada[posicao].dificuldade, habilidade: rodada[posicao].habilidade },
    ]);
    vibrar();
    tocar(r.correto ? 'acerto' : 'erro');
    setFase('revelado');
  };

  const onContinuar = () => {
    if (posicao + 1 >= rodada.length) {
      const resultado = obterStore().concluirPratica(respostas);
      marcarVistos(rodada.map((e) => e.id));
      track('pratica_concluida', { acertos: resultado.acertos, erros: resultado.erros, xp: resultado.xp });
      setEtapa({ t: 'resultado', resultado });
      return;
    }
    setPosicao((p) => p + 1);
    setFase('respondendo');
    setResolucao(null);
  };

  if (etapa.t === 'carregando') {
    return (
      <div className="player">
        <DelayedSkeleton />
      </div>
    );
  }

  if (etapa.t === 'cartas') {
    return <RevisarCartas aoVoltar={() => navigate('/')} cena={cena === 'cartas'} />;
  }

  if (etapa.t === 'pronto') {
    const baralho = baralhoDisponivel();
    const paraHoje = cartasParaHoje(baralho, lerAgenda(), Date.now());
    return (
      <div className="player player-vazio">
        <span className="vazio-selo">
          <Ic nome="taca" size={28} />
        </span>
        <h1 className="vazio-titulo">Prática livre</h1>
        <p className="vazio-texto">
          Oito perguntas com vinhos de verdade, das prateleiras daqui. Esta rodada puxa mais{' '}
          {NOME_HABILIDADE[etapa.foco]}, seu próximo ponto forte.
        </p>
        <p className="vazio-texto pratica-nota">
          Aqui não se gasta vida. Concluir a rodada recupera 1.
        </p>
        <button type="button" className="btn btn-primary btn-jogo btn-cheio tap" onClick={comecar}>
          Começar a rodada
        </button>
        {baralho.length > 0 && (
          <button
            type="button"
            className="btn btn-outline btn-cheio tap"
            onClick={() => setEtapa({ t: 'cartas' })}
          >
            <Ic nome="livro-flashcard" size={18} />
            Revisar com cartas
            {paraHoje > 0 && <span className="pratica-vencidas">{paraHoje} para hoje</span>}
          </button>
        )}
        <button type="button" className="btn btn-outline btn-cheio tap" onClick={() => navigate('/')}>
          Voltar à trilha
        </button>
      </div>
    );
  }

  if (etapa.t === 'resultado') {
    const { resultado } = etapa;
    return (
      <div className="player player-vazio">
        <span className="vazio-selo vazio-selo-ok">
          <Ic nome="check" size={28} />
        </span>
        <h1 className="vazio-titulo">
          {resultado.erros === 0 ? 'Rodada impecável.' : 'Rodada concluída.'}
        </h1>
        <p className="vazio-texto">
          {resultado.acertos} de {resultado.acertos + resultado.erros} certas.
          {resultado.erros > 0 ? ' Os tropeços de hoje voltam mais fáceis amanhã.' : ' Paladar afiado.'}
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
          <p className="vazio-texto pratica-nota">XP de prática reduzido pelo ritmo de hoje. Amanhã volta cheio.</p>
        )}
        <button type="button" className="btn btn-primary btn-jogo btn-cheio tap" onClick={maisUma}>
          Mais uma rodada
        </button>
        <button type="button" className="btn btn-outline btn-cheio tap" onClick={() => navigate('/')}>
          Voltar à trilha
        </button>
      </div>
    );
  }

  const atual = rodada[posicao];
  if (!atual) {
    return (
      <div className="player">
        <DelayedSkeleton />
      </div>
    );
  }

  return (
    <div className="player">
      <header className="player-topo app-chrome">
        <button
          type="button"
          className="player-fechar tap"
          aria-label="Sair da prática"
          onClick={() => navigate('/')}
        >
          <Ic nome="x-fechar" size={22} />
        </button>
        <div
          className="player-barra"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round((posicao / rodada.length) * 100)}
          aria-label={`Pergunta ${posicao + 1} de ${rodada.length}`}
        >
          <div
            className="player-barra-fill"
            style={{
              transform: `translateX(${(Math.max(0.04, posicao / rodada.length) - 1) * 100}%)`,
            }}
          />
        </div>
        <span className="pratica-contagem" aria-hidden="true">
          {posicao + 1}/{rodada.length}
        </span>
      </header>

      <div className="player-meio" key={posicao}>
        {atual.tipo === 'mc' ? (
          <ExMC ex={atual} fase={fase} onResolver={onResolver} />
        ) : (
          <ExIntruso ex={atual} fase={fase} onResolver={onResolver} />
        )}
      </div>

      <TchinObservador visivel={fase === 'respondendo'} />

      {fase === 'revelado' && resolucao && (
        <PainelReveal
          resolucao={resolucao}
          calibracao={null}
          rotuloContinuar={posicao + 1 >= rodada.length ? 'Ver resultado' : 'Continuar'}
          marco={posicao + 1 >= rodada.length}
          onContinuar={onContinuar}
        />
      )}
    </div>
  );
}
