import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { licoesPorId, unidadeDaLicao } from '../content';
import {
  PRECOS_LOJA,
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
import { gravarAnimTrilha, vibrar } from './tipos';
import { ExMC } from './ExMC';
import { ExSwipe } from './ExSwipe';
import { ExSlider } from './ExSlider';
import { ExOrdenar } from './ExOrdenar';
import { ExIntruso } from './ExIntruso';
import { ExDuasVerdades } from './ExDuasVerdades';
import { PainelCalibrar, PainelReveal } from './Feedback';
import { Conclusao } from './Conclusao';
import { FichaBolso } from './FichaBolso';
import { MicroAula } from '../trilha/MicroAula';
import { microAulasVistas } from '../trilha/microaulas';
import { Ic } from '../icones/Icones';
import { Mascotinho, MascoteToast, type EstadoMascote } from '../mascote';
import { CenaHabilidade } from '../cenas';
import { useFtueFlags } from '../onboarding/flags';
import { tocar } from '../som/som';
import { track } from '../lib/analytics';
import './player.css';

/* Toast unico que aponta a ficha de bolso na 1a licao (copy fora de
   conteudo.ts por contrato: mascote curto, max 8 palavras). */
const FALA_APONTA_FICHA = 'Dá uma espiada na ficha antes? Fica aqui.';

/* --------------------------- Dica comprada --------------------------- */

type DicaAplicada =
  | { tipo: 'eliminar'; indice: number }
  | { tipo: 'regra' }
  | { tipo: 'faixa'; min: number; max: number };

/** O efeito da dica por formato (mc/duasverdades eliminam, intruso revela
 *  a regra, slider estreita a faixa em 50%). Null = formato sem dica. */
function dicaPara(ex: Exercicio): DicaAplicada | null {
  switch (ex.tipo) {
    case 'mc':
      return { tipo: 'eliminar', indice: ex.opcoes.findIndex((_, i) => i !== ex.correta) };
    case 'duasverdades':
      return { tipo: 'eliminar', indice: ex.afirmacoes.findIndex((_, i) => i !== ex.mentira) };
    case 'intruso':
      return { tipo: 'regra' };
    case 'slider': {
      const min = Math.min(Math.max(0, Math.round(ex.alvo) - 25), 50);
      return { tipo: 'faixa', min, max: min + 50 };
    }
    default:
      return null;
  }
}

/** A pergunta que vai no balao do mascote, por tipo de exercicio. */
function perguntaDoEx(ex: Exercicio): string {
  switch (ex.tipo) {
    case 'mc':
    case 'slider':
    case 'intruso':
      return ex.pergunta;
    case 'ordenar':
    case 'swipe':
      return ex.instrucao;
    case 'duasverdades':
      return 'Toque na mentira.';
  }
}

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
        <button type="button" className="btn btn-primary btn-jogo tap" onClick={() => navigate('/')}>
          Voltar à trilha
        </button>
      </div>
    );
  }
  if (cena) {
    return <PlayerDemo licao={licao} cena={cena} estado={params.get('estado')} />;
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
  /** True quando esta resposta fecha a licao: acerto vira marco (mascote feliz). */
  marco?: boolean;
  onResolver: (r: ResolucaoExercicio) => void;
  onCalibrar: (c: Calibracao) => void;
  onContinuar: () => void;
  onSair: () => void;
  /** Debita a dica (10 cristais). Ausente = dica indisponivel (Desafio). */
  onUsarDica?: () => boolean;
  presetErro?: boolean;
  entendaInicial?: boolean;
  /** So para cenas de screenshot. */
  dicaInicial?: boolean;
  fichaInicial?: boolean;
  /** Mostra o toast unico do mascote apontando a ficha de bolso. */
  apontarFicha?: boolean;
  /** Chamado quando o toast da ficha e dispensado (grava a flag uma vez). */
  onFichaApontada?: () => void;
  /** Hex da cor da unidade: tinge o fundo da cena da habilidade. */
  corUnidade?: string;
}

function VistaJogo({
  licao,
  atual,
  progresso,
  vidas,
  mostrarHook,
  fases,
  rotuloContinuar,
  marco,
  onResolver,
  onCalibrar,
  onContinuar,
  onSair,
  onUsarDica,
  presetErro,
  entendaInicial,
  dicaInicial,
  fichaInicial,
  apontarFicha,
  onFichaApontada,
  corUnidade,
}: VistaProps) {
  const [confirmandoSaida, setConfirmandoSaida] = useState(false);
  const { fase, resolucao, calibracao } = fases;
  const errou = fase === 'revelado' && resolucao !== null && !resolucao.correto;
  const { ex } = atual;

  /* Mascote (Mascotinho) no topo, com o balao da pergunta: idle enquanto
     pensa, feliz no acerto, triste no erro. */
  const estadoMascote: EstadoMascote =
    fase === 'revelado' && resolucao ? (resolucao.correto ? 'feliz' : 'triste') : 'idle';
  const pergunta = perguntaDoEx(ex);

  /* Ficha de bolso (pre-licao) e dica por cristais (max 1 por exercicio) */
  const [fichaAberta, setFichaAberta] = useState(fichaInicial ?? false);
  /* Quantas cartas a ficha mostra (os 3 primeiros fatos da ficha canonica). */
  const fichasNoBolso = Math.min(3, licao.fichaCanonica.length);
  /* Toast unico do mascote apontando a ficha (some ao abrir ou dispensar). */
  const [toastFicha, setToastFicha] = useState(apontarFicha ?? false);
  const dispensarToastFicha = () => {
    setToastFicha(false);
    onFichaApontada?.();
  };
  const [dica, setDica] = useState<DicaAplicada | null>(() => (dicaInicial ? dicaPara(ex) : null));
  const [dicaAviso, setDicaAviso] = useState(false);

  /* Cada exercicio novo zera a dica (max 1 por exercicio) */
  const jogadaRef = useRef(atual.jogada);
  useEffect(() => {
    if (jogadaRef.current === atual.jogada) return;
    jogadaRef.current = atual.jogada;
    setDica(null);
    setDicaAviso(false);
  }, [atual.jogada]);

  const podeDica =
    onUsarDica !== undefined && fase === 'respondendo' && dica === null && dicaPara(ex) !== null;

  const comprarDica = () => {
    if (!podeDica || !onUsarDica) return;
    if (onUsarDica()) {
      tocar('moeda');
      setDica(dicaPara(ex));
    } else {
      setDicaAviso(true);
    }
  };

  /* Cena da habilidade: arte interativa no vazio entre a pergunta e as
     opcoes. So enquanto a pessoa responde; some no reveal (a atencao vai
     para o feedback). CenaHabilidade decide sozinha se aparece (habilidade
     sensorial + exercicio sem rotulo). */
  const cena =
    fase === 'respondendo' ? (
      <CenaHabilidade habilidade={licao.habilidade} exercicio={ex} corUnidade={corUnidade} />
    ) : null;

  const corpo = (() => {
    const comum = { fase, onResolver, cena } as const;
    switch (ex.tipo) {
      case 'mc':
        return (
          <ExMC
            ex={ex}
            {...comum}
            presetErro={presetErro}
            eliminada={dica?.tipo === 'eliminar' ? dica.indice : undefined}
          />
        );
      case 'swipe':
        return <ExSwipe ex={ex} {...comum} />;
      case 'slider':
        return <ExSlider ex={ex} {...comum} faixaDica={dica?.tipo === 'faixa' ? dica : undefined} />;
      case 'ordenar':
        return <ExOrdenar ex={ex} {...comum} />;
      case 'intruso':
        return <ExIntruso ex={ex} {...comum} regraRevelada={dica?.tipo === 'regra'} />;
      case 'duasverdades':
        return (
          <ExDuasVerdades
            ex={ex}
            {...comum}
            eliminada={dica?.tipo === 'eliminar' ? dica.indice : undefined}
          />
        );
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
          <Ic nome="x-fechar" size={22} />
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
          <Ic nome={vidas > 0 ? 'coracao-vida' : 'coracao-vazio'} size={18} />
          <span className="player-vidas-num" key={vidas}>
            {vidas}
          </span>
        </div>
      </header>

      <div className={`player-meio${errou ? ' treme' : ''}`} key={atual.jogada}>
        <div className="licao-mascote">
          <Mascotinho estado={estadoMascote} tamanho={70} />
          <h2 className="licao-balao">{pergunta}</h2>
        </div>
        {mostrarHook && <p className="player-hook">{licao.hook}</p>}
        {(atual.repetida || ex.dificuldade === 3) && (
          <div className="player-tags app-chrome">
            {atual.repetida && <span className="tag tag-denovo">De novo essa, agora vai</span>}
            {ex.dificuldade === 3 && <span className="tag tag-desafio">Desafio</span>}
          </div>
        )}
        {(mostrarHook || podeDica || dicaAviso) && (
          <div className="player-extras app-chrome">
            {mostrarHook && (
              <button
                type="button"
                className="ficha-chamada tap"
                aria-label={`Ler a ficha de bolso desta lição, ${fichasNoBolso} ${fichasNoBolso === 1 ? 'carta' : 'cartas'}`}
                onClick={() => {
                  dispensarToastFicha();
                  setFichaAberta(true);
                }}
              >
                <Ic nome="livro-flashcard" size={16} />
                Ler antes ({fichasNoBolso} {fichasNoBolso === 1 ? 'carta' : 'cartas'})
              </button>
            )}
            {podeDica && (
              <button
                type="button"
                className="dica-botao tap"
                aria-label={`Usar uma dica por ${PRECOS_LOJA.dica} cristais`}
                onClick={comprarDica}
              >
                <Ic nome="lampada-dica" size={16} />
                Dica
                <span className="dica-preco">
                  <Ic nome="cristal" size={13} />
                  {PRECOS_LOJA.dica}
                </span>
              </button>
            )}
            {dicaAviso && (
              <p className="dica-aviso" role="status">
                Cristais curtos por agora. Lições e meta diária enchem o cofre.
              </p>
            )}
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
          marco={marco}
          comMascote={false}
          onContinuar={onContinuar}
          entendaInicial={entendaInicial}
        />
      )}

      {fichaAberta && <FichaBolso licao={licao} onFechar={() => setFichaAberta(false)} />}

      {/* Aponta a ficha so enquanto o botao esta na tela (1o exercicio) */}
      {toastFicha && mostrarHook && !fichaAberta && (
        <MascoteToast texto={FALA_APONTA_FICHA} estado="ensina" onFechar={dispensarToastFicha} />
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
              <button
                type="button"
                className="btn btn-primary btn-jogo btn-cheio tap"
                onClick={() => setConfirmandoSaida(false)}
              >
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
  | { t: 'microaula' }
  | { t: 'aviso-pacing' }
  | { t: 'sem-vidas' }
  | { t: 'jogando' }
  | {
      t: 'conclusao';
      resultado: ResultadoSessao;
      xpCheckpoint: number | null;
      /** True quando ESTA conclusao garantiu o dia do streak (chama acende). */
      streakGanho: boolean;
    };

function PlayerReal({ licao }: { licao: Licao }) {
  const navigate = useNavigate();
  const store = obterStore();
  const { sessao, concluida, iniciar, responder, finalizar, abandonar } = useSessao();
  const { wallet, streakEfetivo, proximaVidaEmMs } = useWallet();
  const [ftue, marcarFtue] = useFtueFlags();
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
      track('licao_iniciada', { licao_id: licao.id, unidade: unidadeDaLicao(licao.id)?.meta.id, tipo: t });
    },
    [iniciar, licao, fases],
  );

  /* Gates de entrada: vidas e soft cap (nunca bloqueia, so avisa) */
  const entrar = useCallback(() => {
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
  }, [licao.id, comecar, store]);

  /* Abertura de unidade (primeira visita): a micro-aula apresenta o
     conceito antes da 1a licao; pulavel, e quem ja jogou nao reve */
  useEffect(() => {
    store.sincronizar();
    const unidade = unidadeDaLicao(licao.id);
    const inedita =
      unidade !== undefined &&
      !microAulasVistas().includes(unidade.meta.id) &&
      unidade.licoes.every((l) => (store.getEstado().progresso[l.id]?.vezesConcluida ?? 0) === 0);
    if (inedita) {
      setEtapa({ t: 'microaula' });
      return;
    }
    entrar();
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
      tocar(r.correto ? 'acerto' : 'erro');
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
      /* Marcos: streak ganho agora e coroa nova alimentam as coreografias */
      const riscoAntes = store.streakEmRisco();
      const coroasAntes = store.getEstado().progresso[licao.id]?.coroas ?? 0;
      const r = finalizar();
      if (!r) {
        navigate('/');
        return;
      }
      const coroasDepois = store.getEstado().progresso[licao.id]?.coroas ?? 0;
      gravarAnimTrilha({ licao: licao.id, coroa: coroasDepois > coroasAntes });
      /* Checkpoint: a conclusao que fecha a unidade paga 50 XP, uma vez */
      const unidade = unidadeDaLicao(licao.id);
      const fechouUnidade =
        unidade !== undefined &&
        unidade.licoes.every((l) => (store.getEstado().progresso[l.id]?.vezesConcluida ?? 0) > 0);
      const xpCheckpoint = fechouUnidade ? store.concluirCheckpoint(unidade.meta.id) : null;
      setEtapa({
        t: 'conclusao',
        resultado: r,
        xpCheckpoint,
        streakGanho: riscoAntes && !store.streakEmRisco(),
      });
      return;
    }
    fases.reset();
    setAtual(null);
  };

  const sair = () => {
    // Drop-off: abandonou a licao no meio (concluida vai pro resultado, nao por aqui).
    if (!concluida) {
      track('licao_abandonada', { licao_id: licao.id, unidade: unidadeDaLicao(licao.id)?.meta.id });
    }
    abandonar();
    navigate('/');
  };

  if (etapa.t === 'microaula') {
    const unidade = unidadeDaLicao(licao.id);
    if (!unidade) return <div className="player" aria-busy="true" />;
    return <MicroAula unidade={unidade} onFim={entrar} />;
  }

  if (etapa.t === 'aviso-pacing') {
    return (
      <div className="player player-vazio">
        <span className="vazio-selo">
          <Ic nome="ampulheta" size={28} />
        </span>
        <h1 className="vazio-titulo">Pausa boa também é treino</h1>
        <p className="vazio-texto">
          Seu cérebro fixa melhor dormindo em cima disso. Amanhã tem mais. XP reduzido a partir daqui.
        </p>
        <button type="button" className="btn btn-primary btn-jogo btn-cheio tap" onClick={() => comecar('nova')}>
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
          <Ic nome="coracao-vazio" size={28} />
        </span>
        <h1 className="vazio-titulo">Suas vidas acabaram por agora</h1>
        <p className="vazio-texto">
          A próxima chega em {formatarMs(proximaVidaEmMs)}. Enquanto isso, revisar uma lição concluída
          recupera 1 vida na hora.
        </p>
        {jaConcluida && (
          <button
            type="button"
            className="btn btn-primary btn-jogo btn-cheio tap"
            onClick={() => comecar('revisao')}
          >
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
        streakGanhoAgora={etapa.streakGanho}
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
      marco={concluida}
      onResolver={onResolver}
      onCalibrar={onCalibrar}
      onContinuar={onContinuar}
      onSair={sair}
      onUsarDica={() => store.usarDica()}
      apontarFicha={!ftue.fichaApontada}
      onFichaApontada={() => marcarFtue({ fichaApontada: true })}
      corUnidade={unidadeDaLicao(licao.id)?.meta.cor}
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

function PlayerDemo({ licao, cena, estado }: { licao: Licao; cena: string; estado: string | null }) {
  const navigate = useNavigate();
  if (cena === 'conclusao') {
    return (
      <Conclusao
        licao={licao}
        resultado={RESULTADO_DEMO}
        tipo="nova"
        streak={1}
        streakGanhoAgora
        onTrilha={() => navigate('/')}
        onRevisar={() => navigate('/')}
      />
    );
  }
  if (cena === 'microaula') {
    const unidade = unidadeDaLicao(licao.id);
    if (!unidade) return <div className="player" aria-busy="true" />;
    return <MicroAula unidade={unidade} onFim={() => navigate('/')} />;
  }
  return <DemoJogo licao={licao} cena={cena} estado={estado} />;
}

function DemoJogo({ licao, cena, estado }: { licao: Licao; cena: string; estado: string | null }) {
  const navigate = useNavigate();
  const estadoErro = estado === 'erro';
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
    tocar(r.correto ? 'acerto' : 'erro');
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
      marco={sessaoConcluida(sessao)}
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
      onUsarDica={() => true}
      presetErro={estadoErro}
      entendaInicial={estadoErro}
      dicaInicial={estado === 'dica'}
      fichaInicial={estado === 'ficha'}
      apontarFicha={estado === 'aponta'}
      corUnidade={unidadeDaLicao(licao.id)?.meta.cor}
    />
  );
}
