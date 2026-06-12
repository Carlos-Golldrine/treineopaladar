import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { licoesPorId, unidadeDaLicao } from '../content';
import {
  ehD0,
  finalizarSessao,
  indiceAtual,
  iniciarSessao,
  obterStore,
  responder as responderSessao,
  sessaoConcluida,
  useSessao,
  useWallet,
} from '../engine';
import type { Exercicio, Licao, ResultadoSessao, Sessao, TipoSessao } from '../engine';
import type { Calibracao, FaseExercicio, ResolucaoExercicio } from './tipos';
import { vibrar } from './tipos';
import { ExMC } from './ExMC';
import { ExSwipe } from './ExSwipe';
import { ExSlider } from './ExSlider';
import { ExOrdenar } from './ExOrdenar';
import { ExIntruso } from './ExIntruso';
import { ExDuasVerdades } from './ExDuasVerdades';
import { PainelCalibrar, PainelReveal } from './Feedback';
import { Conclusao } from './Conclusao';
import { Icon } from '../components/Icon';
import closeIcon from '@material-symbols/svg-500/rounded/close.svg?raw';
import heartIcon from '@material-symbols/svg-500/rounded/favorite-fill.svg?raw';
import hourglassIcon from '@material-symbols/svg-500/rounded/hourglass-fill.svg?raw';
import './player.css';

/* ------------------------------ Rota -------------------------------- */

export default function PlayerLicao() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const licao = id ? licoesPorId[id] : undefined;
  const cena = params.get('cena');

  if (!licao) {
    return (
      <div className="player player-vazio">
        <h1 className="vazio-titulo">Essa lição ainda não mora aqui</h1>
        <p className="vazio-texto">A trilha sabe o caminho. Vamos voltar para ela?</p>
        <button type="button" className="btn btn-primary tap" onClick={() => navigate('/')}>
          Voltar à trilha
        </button>
      </div>
    );
  }
  if (cena) {
    return <PlayerDemo licao={licao} cena={cena} estadoErro={params.get('estado') === 'erro'} />;
  }
  return <PlayerReal licao={licao} />;
}

/* ------------------------ Maquina de fases --------------------------- */

interface Fases {
  fase: FaseExercicio;
  resolucao: ResolucaoExercicio | null;
  calibracao: Calibracao | null;
  setFase: (f: FaseExercicio) => void;
  setResolucao: (r: ResolucaoExercicio | null) => void;
  setCalibracao: (c: Calibracao | null) => void;
  reset: () => void;
}

function useFases(inicial?: Partial<Pick<Fases, 'fase' | 'resolucao'>>): Fases {
  const [fase, setFase] = useState<FaseExercicio>(inicial?.fase ?? 'respondendo');
  const [resolucao, setResolucao] = useState<ResolucaoExercicio | null>(inicial?.resolucao ?? null);
  const [calibracao, setCalibracao] = useState<Calibracao | null>(null);
  const reset = useCallback(() => {
    setFase('respondendo');
    setResolucao(null);
    setCalibracao(null);
  }, []);
  return { fase, resolucao, calibracao, setFase, setResolucao, setCalibracao, reset };
}

/* -------------------------- Vista do jogo ---------------------------- */

interface AtualEx {
  indice: number;
  ex: Exercicio;
  repetida: boolean;
  jogada: number;
}

interface VistaProps {
  licao: Licao;
  atual: AtualEx;
  progresso: number;
  vidas: number;
  mostrarHook: boolean;
  fases: Fases;
  rotuloContinuar: string;
  onResolver: (r: ResolucaoExercicio) => void;
  onCalibrar: (c: Calibracao) => void;
  onContinuar: () => void;
  onSair: () => void;
  presetErro?: boolean;
  entendaInicial?: boolean;
}

function VistaJogo({
  licao,
  atual,
  progresso,
  vidas,
  mostrarHook,
  fases,
  rotuloContinuar,
  onResolver,
  onCalibrar,
  onContinuar,
  onSair,
  presetErro,
  entendaInicial,
}: VistaProps) {
  const [confirmandoSaida, setConfirmandoSaida] = useState(false);
  const { fase, resolucao, calibracao } = fases;
  const errou = fase === 'revelado' && resolucao !== null && !resolucao.correto;
  const { ex } = atual;

  const corpo = (() => {
    const comum = { fase, onResolver } as const;
    switch (ex.tipo) {
      case 'mc':
        return <ExMC ex={ex} {...comum} presetErro={presetErro} />;
      case 'swipe':
        return <ExSwipe ex={ex} {...comum} />;
      case 'slider':
        return <ExSlider ex={ex} {...comum} />;
      case 'ordenar':
        return <ExOrdenar ex={ex} {...comum} />;
      case 'intruso':
        return <ExIntruso ex={ex} {...comum} />;
      case 'duasverdades':
        return <ExDuasVerdades ex={ex} {...comum} />;
    }
  })();

  return (
    <div className="player">
      <header className="player-topo app-chrome">
        <button
          type="button"
          className="player-fechar tap"
          aria-label="Sair da lição"
          onClick={() => setConfirmandoSaida(true)}
        >
          <Icon svg={closeIcon} size={22} />
        </button>
        <div
          className="player-barra"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progresso * 100)}
          aria-label="Progresso da lição"
        >
          <div
            className="player-barra-fill"
            style={{ transform: `translateX(${(Math.max(0.04, Math.min(1, progresso)) - 1) * 100}%)` }}
          />
        </div>
        <div className="player-vidas" aria-label={`${vidas} vidas`}>
          <Icon svg={heartIcon} size={18} />
          <span className="player-vidas-num" key={vidas}>
            {vidas}
          </span>
        </div>
      </header>

      <div className={`player-meio${errou ? ' treme' : ''}`} key={atual.jogada}>
        {mostrarHook && <p className="player-hook">{licao.hook}</p>}
        {(atual.repetida || ex.dificuldade === 3) && (
          <div className="player-tags app-chrome">
            {atual.repetida && <span className="tag tag-denovo">De novo essa, agora vai</span>}
            {ex.dificuldade === 3 && <span className="tag tag-desafio">Desafio</span>}
          </div>
        )}
        {corpo}
      </div>

      {fase === 'aguardando' && <PainelCalibrar onEscolher={onCalibrar} />}
      {fase === 'revelado' && resolucao && (
        <PainelReveal
          resolucao={resolucao}
          calibracao={calibracao}
          licao={licao}
          rotuloContinuar={rotuloContinuar}
          onContinuar={onContinuar}
          entendaInicial={entendaInicial}
        />
      )}

      {confirmandoSaida && (
        <div className="veu" role="dialog" aria-modal="true" aria-label="Sair da lição?">
          <button type="button" className="veu-fundo" aria-label="Voltar ao treino" onClick={() => setConfirmandoSaida(false)} />
          <div className="painel painel-sair app-chrome">
            <p className="painel-titulo">Sair da lição?</p>
            <p className="painel-sub">
              Tudo bem parar. O treino dessa lição não fica salvo, mas a trilha continua no mesmo lugar.
            </p>
            <div className="painel-botoes painel-botoes-coluna">
              <button type="button" className="btn btn-primary btn-cheio tap" onClick={() => setConfirmandoSaida(false)}>
                Voltar ao treino
              </button>
              <button type="button" className="btn btn-sair tap" onClick={onSair}>
                Sair mesmo assim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------------------- Player real ----------------------------- */

type Etapa =
  | { t: 'carregando' }
  | { t: 'aviso-pacing' }
  | { t: 'sem-vidas' }
  | { t: 'jogando' }
  | { t: 'conclusao'; resultado: ResultadoSessao; xpCheckpoint: number | null };

function PlayerReal({ licao }: { licao: Licao }) {
  const navigate = useNavigate();
  const store = obterStore();
  const { sessao, concluida, iniciar, responder, finalizar, abandonar } = useSessao();
  const { wallet, streakEfetivo, proximaVidaEmMs } = useWallet();
  const [etapa, setEtapa] = useState<Etapa>({ t: 'carregando' });
  const [tipo, setTipo] = useState<TipoSessao>('nova');
  const [atual, setAtual] = useState<AtualEx | null>(null);
  const fases = useFases();

  const comecar = useCallback(
    (t: TipoSessao) => {
      setTipo(t);
      const s = iniciar(licao, t);
      if (!s) {
        setEtapa({ t: 'sem-vidas' });
        return;
      }
      fases.reset();
      setAtual(null);
      setEtapa({ t: 'jogando' });
    },
    [iniciar, licao, fases],
  );

  /* Gates de entrada: vidas e soft cap (nunca bloqueia, so avisa) */
  useEffect(() => {
    store.sincronizar();
    const w = store.getEstado().wallet;
    const t: TipoSessao = store.revisoesVencidas().includes(licao.id) ? 'revisao' : 'nova';
    if (t === 'nova' && w.vidas <= 0) {
      setTipo('nova');
      setEtapa({ t: 'sem-vidas' });
      return;
    }
    if (t === 'nova' && w.licoesHoje >= 3 && !ehD0(w.criadoEm, Date.now())) {
      setTipo('nova');
      setEtapa({ t: 'aviso-pacing' });
      return;
    }
    comecar(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [licao.id]);

  /* Pega o proximo exercicio da fila quando o snapshot local esvazia */
  useEffect(() => {
    if (etapa.t !== 'jogando' || atual !== null) return;
    const ativa = store.getSessao();
    if (!ativa) return;
    const idx = indiceAtual(ativa.sessao);
    if (idx === null) return;
    const ex = licao.exercicios[idx];
    if (!ex) return;
    setAtual({
      indice: idx,
      ex,
      repetida: ativa.sessao.respostas.some((r) => r.exercicio === idx),
      jogada: ativa.sessao.posicao,
    });
  }, [etapa, atual, sessao, store, licao]);

  const revelar = useCallback(
    (r: ResolucaoExercicio) => {
      responder(r.correto);
      vibrar();
      fases.setFase('revelado');
    },
    [responder, fases],
  );

  const onResolver = (r: ResolucaoExercicio) => {
    fases.setResolucao(r);
    if (atual?.ex.calibrar) {
      fases.setFase('aguardando');
      return;
    }
    revelar(r);
  };

  const onCalibrar = (c: Calibracao) => {
    fases.setCalibracao(c);
    if (fases.resolucao) revelar(fases.resolucao);
  };

  const onContinuar = () => {
    const ativa = store.getSessao();
    if (!ativa || sessaoConcluida(ativa.sessao)) {
      const r = finalizar();
      if (!r) {
        navigate('/');
        return;
      }
      /* Checkpoint: a conclusao que fecha a unidade paga 50 XP, uma vez */
      const unidade = unidadeDaLicao(licao.id);
      const fechouUnidade =
        unidade !== undefined &&
        unidade.licoes.every((l) => (store.getEstado().progresso[l.id]?.vezesConcluida ?? 0) > 0);
      const xpCheckpoint = fechouUnidade ? store.concluirCheckpoint(unidade.meta.id) : null;
      setEtapa({ t: 'conclusao', resultado: r, xpCheckpoint });
      return;
    }
    fases.reset();
    setAtual(null);
  };

  const sair = () => {
    abandonar();
    navigate('/');
  };

  if (etapa.t === 'aviso-pacing') {
    return (
      <div className="player player-vazio">
        <span className="vazio-selo">
          <Icon svg={hourglassIcon} size={28} />
        </span>
        <h1 className="vazio-titulo">Pausa boa também é treino</h1>
        <p className="vazio-texto">
          Seu cérebro fixa melhor dormindo em cima disso. Amanhã tem mais. XP reduzido a partir daqui.
        </p>
        <button type="button" className="btn btn-primary btn-cheio tap" onClick={() => comecar('nova')}>
          Seguir assim mesmo
        </button>
        <button type="button" className="btn btn-outline btn-cheio tap" onClick={() => navigate('/')}>
          Voltar à trilha
        </button>
      </div>
    );
  }

  if (etapa.t === 'sem-vidas') {
    const jaConcluida = (store.getEstado().progresso[licao.id]?.vezesConcluida ?? 0) > 0;
    return (
      <div className="player player-vazio">
        <span className="vazio-selo vazio-selo-vida">
          <Icon svg={heartIcon} size={28} />
        </span>
        <h1 className="vazio-titulo">Suas vidas acabaram por agora</h1>
        <p className="vazio-texto">
          A próxima chega em {formatarMs(proximaVidaEmMs)}. Enquanto isso, revisar uma lição concluída
          recupera 1 vida na hora.
        </p>
        {jaConcluida && (
          <button type="button" className="btn btn-primary btn-cheio tap" onClick={() => comecar('revisao')}>
            Revisar esta lição
          </button>
        )}
        <button type="button" className="btn btn-outline btn-cheio tap" onClick={() => navigate('/')}>
          Voltar à trilha
        </button>
      </div>
    );
  }

  if (etapa.t === 'conclusao') {
    return (
      <Conclusao
        licao={licao}
        resultado={etapa.resultado}
        tipo={tipo}
        streak={streakEfetivo}
        xpCheckpoint={etapa.xpCheckpoint}
        onTrilha={() => navigate('/')}
        onRevisar={() => comecar('revisao')}
      />
    );
  }

  if (etapa.t !== 'jogando' || !atual || !sessao) {
    return <div className="player" aria-busy="true" />;
  }

  return (
    <VistaJogo
      licao={licao}
      atual={atual}
      progresso={sessao.posicao / sessao.fila.length}
      vidas={wallet.vidas}
      mostrarHook={atual.indice === 0 && sessao.respostas.length === 0}
      fases={fases}
      rotuloContinuar={concluida ? 'Ver resultado' : 'Continuar'}
      onResolver={onResolver}
      onCalibrar={onCalibrar}
      onContinuar={onContinuar}
      onSair={sair}
    />
  );
}

function formatarMs(ms: number | null): string {
  if (ms === null || ms <= 0) return 'instantes';
  const total = Math.ceil(ms / 60000);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h <= 0) return `${m} min`;
  return `${h}h${String(m).padStart(2, '0')}`;
}

/* ----------------- Player demo (cenas de screenshot) ----------------- */

const RESULTADO_DEMO: ResultadoSessao = {
  acertos: 10,
  erros: 0,
  perfeita: true,
  xp: 25,
  cristais: 7,
  duracao: 372000,
  errosPendentes: [],
};

function PlayerDemo({ licao, cena, estadoErro }: { licao: Licao; cena: string; estadoErro: boolean }) {
  const navigate = useNavigate();
  if (cena === 'conclusao') {
    return (
      <Conclusao
        licao={licao}
        resultado={RESULTADO_DEMO}
        tipo="nova"
        streak={1}
        onTrilha={() => navigate('/')}
        onRevisar={() => navigate('/')}
      />
    );
  }
  return <DemoJogo licao={licao} cena={cena} estadoErro={estadoErro} />;
}

function DemoJogo({ licao, cena, estadoErro }: { licao: Licao; cena: string; estadoErro: boolean }) {
  const navigate = useNavigate();
  const alvo = Math.max(
    0,
    licao.exercicios.findIndex((e) => e.tipo === cena),
  );
  const [sessao, setSessao] = useState<Sessao>(() => iniciarSessao(licao, 'nova', Date.now(), [alvo]));
  const [atual, setAtual] = useState<AtualEx | null>(() => {
    const idx = indiceAtual(iniciarSessao(licao, 'nova', 0, [alvo]));
    if (idx === null) return null;
    return { indice: idx, ex: licao.exercicios[idx], repetida: false, jogada: 0 };
  });
  const exDemo = atual?.ex;
  const fases = useFases(
    estadoErro && exDemo && exDemo.tipo === 'mc'
      ? { fase: 'revelado', resolucao: { correto: false, titulo: exDemo.erroMsg, porque: exDemo.porque } }
      : undefined,
  );
  const [resultado, setResultado] = useState<ResultadoSessao | null>(null);

  if (resultado) {
    return (
      <Conclusao
        licao={licao}
        resultado={resultado}
        tipo="nova"
        streak={1}
        onTrilha={() => navigate('/')}
        onRevisar={() => navigate('/')}
      />
    );
  }
  if (!atual) return <div className="player" aria-busy="true" />;

  const revelar = (r: ResolucaoExercicio) => {
    setSessao((s) => responderSessao(s, r.correto, licao).sessao);
    vibrar();
    fases.setFase('revelado');
  };

  const progressoBase = atual.indice / licao.exercicios.length;
  const progresso = Math.max(progressoBase, sessao.posicao / sessao.fila.length);

  return (
    <VistaJogo
      licao={licao}
      atual={atual}
      progresso={progresso}
      vidas={5}
      mostrarHook={atual.indice === 0 && sessao.respostas.length === 0 && !estadoErro}
      fases={fases}
      rotuloContinuar={sessaoConcluida(sessao) ? 'Ver resultado' : 'Continuar'}
      onResolver={(r) => {
        fases.setResolucao(r);
        if (atual.ex.calibrar) fases.setFase('aguardando');
        else revelar(r);
      }}
      onCalibrar={(c) => {
        fases.setCalibracao(c);
        if (fases.resolucao) revelar(fases.resolucao);
      }}
      onContinuar={() => {
        if (sessaoConcluida(sessao)) {
          setResultado(finalizarSessao(sessao, Date.now(), { licoesConcluidasHoje: 0, isentoD0: true }));
          return;
        }
        const idx = indiceAtual(sessao);
        if (idx === null) return;
        fases.reset();
        setAtual({
          indice: idx,
          ex: licao.exercicios[idx],
          repetida: sessao.respostas.some((r) => r.exercicio === idx),
          jogada: sessao.posicao,
        });
      }}
      onSair={() => navigate('/')}
      presetErro={estadoErro}
      entendaInicial={estadoErro}
    />
  );
}
