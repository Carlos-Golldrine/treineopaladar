import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { indiceAtual, obterStore, sessaoConcluida, useWallet } from '../engine';
import type { ExercicioMC, Nivel, Objetivo, ResultadoSessao } from '../engine';
import type { FaseExercicio, ResolucaoExercicio } from '../licao/tipos';
import { vibrar } from '../licao/tipos';
import { ExMC } from '../licao/ExMC';
import { PainelReveal } from '../licao/Feedback';
import { Ic } from '../icones/Icones';
import { ICONE_OBJETIVO } from '../trilha/objetivo';
import { tocar } from '../som/som';
import { track } from '../lib/analytics';
import {
  CARTAS_NIVEL,
  CARTAS_OBJETIVO,
  FALAS,
  IDX_J4,
  IDX_J5,
  IDX_J7,
  j5PorObjetivo,
  licaoFtue,
} from './conteudo';
import { Mascotinho } from '../mascote';
import type { EstadoMascote } from '../mascote';
import { ExVisual } from './ExVisual';
import { CartasEscolha } from './Cartas';
import type { CartaUi } from './Cartas';
import { Conclusao1 } from './Conclusao1';
import { SoftWall } from './SoftWall';
import '../licao/player.css';
import './onboarding.css';

/* ------------------------------ Rota -------------------------------- */

export default function LicaoUm() {
  const [params] = useSearchParams();
  const cena = params.get('cena');
  if (cena) return <LicaoUmDemo cena={cena} />;
  return <LicaoUmReal />;
}

/* --------------------------- Vista comum ----------------------------- */

const cartasObjetivo: CartaUi[] = CARTAS_OBJETIVO.map((c) => ({
  ...c,
  icone: ICONE_OBJETIVO[c.id as Objetivo],
}));
const cartasNivel: CartaUi[] = CARTAS_NIVEL;

interface VistaFtueProps {
  progresso: number;
  vidas: number;
  /** Vidas so entram no topo depois do primeiro erro (revelacao progressiva). */
  vidasVisiveis: boolean;
  /** Pergunta no balao do Mascotinho (null = sem balao). */
  pergunta: string | null;
  estadoMascote: EstadoMascote;
  treme: boolean;
  chave: string;
  painel: ReactNode;
  children: ReactNode;
}

function VistaFtue({ progresso, vidas, vidasVisiveis, pergunta, estadoMascote, treme, chave, painel, children }: VistaFtueProps) {
  return (
    <div className="player">
      <header className="player-topo app-chrome">
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
        {vidasVisiveis && (
          <div className="player-vidas ftue-surge" aria-label={`${vidas} vidas`}>
            <Ic nome={vidas > 0 ? 'coracao-vida' : 'coracao-vazio'} size={18} />
            <span className="player-vidas-num" key={vidas}>
              {vidas}
            </span>
          </div>
        )}
      </header>

      <div className={`player-meio${treme ? ' treme' : ''}`} key={chave}>
        {pergunta && (
          <div className="licao-mascote">
            <Mascotinho estado={estadoMascote} tamanho={70} />
            <h2 className="licao-balao">{pergunta}</h2>
          </div>
        )}
        {children}
      </div>

      {painel}
    </div>
  );
}

/* --------------------------- Fluxo real ------------------------------ */

type Passo =
  | { t: 'carregando' }
  | { t: 'jogada'; indice: number; jogada: number }
  | { t: 'objetivo' }
  | { t: 'nivel' }
  | { t: 'conclusao'; resultado: ResultadoSessao }
  | { t: 'softwall'; xp: number };

function LicaoUmReal() {
  const navigate = useNavigate();
  const store = obterStore();
  const { wallet } = useWallet();
  const [passo, setPasso] = useState<Passo>({ t: 'carregando' });
  const [fase, setFase] = useState<FaseExercicio>('respondendo');
  const [resolucao, setResolucao] = useState<ResolucaoExercicio | null>(null);
  const [vidasVisiveis, setVidasVisiveis] = useState(false);
  const [objetivoSel, setObjetivoSel] = useState<Objetivo | null>(null);
  const errouAlguma = useRef(false);
  const nivelResolvido = useRef(false);
  const progressoMax = useRef(0.04);

  /* Funil do onboarding: marca cada passo alcancado (o drop-off e o ultimo). */
  useEffect(() => {
    if (passo.t !== 'carregando') track('ftue_passo', { passo: passo.t });
  }, [passo.t]);

  /** Decide o proximo passo olhando a fila do engine e os interstitials. */
  const irParaProxima = useCallback(() => {
    const ativa = store.getSessao();
    if (!ativa || sessaoConcluida(ativa.sessao)) {
      const resultado = store.finalizarLicao();
      store.concluirOnboarding();
      /* Marco do funil: dispara UMA vez so, no momento real de concluir o onboarding
         (mesmo se a tela de conclusao for pulada). Vira CompleteRegistration no Meta
         Pixel. Nao repetir na Conclusao1 (ela tambem aparece no replay/softwall). */
      track('ftue_concluido', resultado ? { xp: resultado.xp, streak: store.streakEfetivo() } : undefined);
      if (resultado) setPasso({ t: 'conclusao', resultado });
      else navigate('/', { replace: true });
      return;
    }
    const idx = indiceAtual(ativa.sessao);
    if (idx === null) return;

    /* J3: objetivo disfarcado de jogada, antes da pegadinha (J4) */
    if (idx >= IDX_J4 && store.getEstado().objetivo === null) {
      setPasso({ t: 'objetivo' });
      return;
    }

    /* J6: nivel, antes da consolidacao (J7). Pergunta inferivel e
       pergunta que nao deveria ser feita: com 2+ tropecos ate aqui,
       o nivel e iniciante e a jogada e cortada. */
    if (idx === IDX_J7 && !nivelResolvido.current && store.getEstado().nivelDeclarado === null) {
      if (ativa.sessao.erros >= 2) {
        store.definirNivel('iniciante');
        nivelResolvido.current = true;
      } else {
        setPasso({ t: 'nivel' });
        return;
      }
    }

    setFase('respondendo');
    setResolucao(null);
    setPasso({ t: 'jogada', indice: idx, jogada: ativa.sessao.posicao });
  }, [navigate, store]);

  useEffect(() => {
    if (store.getEstado().onboardingCompleto) {
      navigate('/', { replace: true });
      return;
    }
    store.iniciarLicao(licaoFtue, 'nova');
    irParaProxima();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exercicioDe = (indice: number): ExercicioMC => {
    if (indice === IDX_J5) {
      const objetivo = store.getEstado().objetivo ?? 'mercado';
      return j5PorObjetivo[objetivo];
    }
    return licaoFtue.exercicios[indice] as ExercicioMC;
  };

  const onResolver = (r: ResolucaoExercicio) => {
    if (passo.t !== 'jogada') return;
    setResolucao(r);
    store.responder(r.correto);
    vibrar();
    tocar(r.correto ? 'acerto' : 'erro');
    setFase('revelado');
    if (!r.correto && !errouAlguma.current) {
      /* Primeiro erro: o tooltip de vidas entra (revelacao progressiva) */
      errouAlguma.current = true;
      setVidasVisiveis(true);
    }
  };

  const escolherObjetivo = (id: string) => {
    const objetivo = id as Objetivo;
    setObjetivoSel(objetivo);
    store.definirObjetivo(objetivo);
    track('ftue_objetivo', { objetivo });
  };

  const escolherNivel = (id: string) => {
    store.definirNivel(id as Nivel);
    track('ftue_nivel', { nivel: id });
    nivelResolvido.current = true;
    irParaProxima();
  };

  if (passo.t === 'conclusao') {
    const resultado = passo.resultado;
    return (
      <Conclusao1
        xp={resultado.xp}
        streak={store.streakEfetivo()}
        onMeta={(meta) => {
          store.definirMetaDiaria(meta);
          setPasso({ t: 'softwall', xp: resultado.xp });
        }}
      />
    );
  }
  if (passo.t === 'softwall') {
    return <SoftWall xp={passo.xp} onTrilha={() => navigate('/', { replace: true })} />;
  }
  if (passo.t === 'carregando') {
    return <div className="player" aria-busy="true" />;
  }

  /* Progresso: jogadas do engine + interstitials, nunca regride */
  const ativa = store.getSessao();
  if (ativa) {
    const extrasFeitos =
      (store.getEstado().objetivo !== null ? 1 : 0) + (nivelResolvido.current ? 1 : 0);
    const p = (ativa.sessao.posicao + extrasFeitos) / (ativa.sessao.fila.length + 2);
    progressoMax.current = Math.max(progressoMax.current, p);
  }

  // Reinsercao de verdade: na fase revelada a resposta recem-dada ja esta na
  // lista, entao o exercicio so e "repetido" com 2+ respostas registradas.
  const respostasDoPasso =
    passo.t === 'jogada' && ativa
      ? ativa.sessao.respostas.filter((r) => r.exercicio === passo.indice).length
      : 0;
  const repetida = fase === 'revelado' ? respostasDoPasso >= 2 : respostasDoPasso >= 1;
  const concluiu = !ativa || sessaoConcluida(ativa.sessao);
  const errou = fase === 'revelado' && resolucao !== null && !resolucao.correto;

  /* Pergunta no balao do Mascotinho + emocao conforme o momento */
  let perguntaBalao: string | null = null;
  let estadoMascote: EstadoMascote = 'idle';
  if (passo.t === 'jogada') {
    perguntaBalao = exercicioDe(passo.indice).pergunta;
    estadoMascote = fase === 'revelado' && resolucao ? (resolucao.correto ? 'feliz' : 'triste') : 'idle';
  } else if (passo.t === 'objetivo') {
    perguntaBalao = objetivoSel ? FALAS.objetivo[objetivoSel] : 'Onde você mais quer mandar bem?';
    estadoMascote = objetivoSel ? 'feliz' : 'idle';
  } else if (passo.t === 'nivel') {
    perguntaBalao = 'Quanto você já conhece de vinho?';
  }

  return (
    <VistaFtue
      progresso={progressoMax.current}
      vidas={wallet.vidas}
      vidasVisiveis={vidasVisiveis}
      pergunta={perguntaBalao}
      estadoMascote={estadoMascote}
      treme={errou}
      chave={passo.t === 'jogada' ? `j-${passo.jogada}` : passo.t}
      painel={
        fase === 'revelado' && resolucao && passo.t === 'jogada' ? (
          <PainelReveal
            resolucao={resolucao}
            calibracao={null}
            licao={licaoFtue}
            rotuloContinuar={concluiu ? 'Ver resultado' : 'Continuar'}
            marco={concluiu}
            comMascote={false}
            onContinuar={irParaProxima}
          />
        ) : null
      }
    >
      {passo.t === 'objetivo' && (
        <CartasEscolha
          pergunta="Onde você mais quer mandar bem?"
          sub="Sua escolha muda a próxima jogada."
          cartas={cartasObjetivo}
          selecionada={objetivoSel}
          emGrade
          onEscolher={escolherObjetivo}
          onContinuar={objetivoSel ? irParaProxima : undefined}
        />
      )}
      {passo.t === 'nivel' && (
        <CartasEscolha
          pergunta="Quanto você já conhece de vinho?"
          sub="Isso ajusta o ritmo da trilha."
          cartas={cartasNivel}
          selecionada={null}
          onEscolher={escolherNivel}
        />
      )}
      {passo.t === 'jogada' && (
        <>
          {repetida && (
            <div className="player-tags app-chrome">
              <span className="tag tag-denovo">De novo essa, agora vai</span>
            </div>
          )}
          {passo.indice === 0 ? (
            <ExVisual ex={exercicioDe(0)} fase={fase} onResolver={onResolver} />
          ) : (
            <ExMC ex={exercicioDe(passo.indice)} fase={fase} onResolver={onResolver} />
          )}
        </>
      )}
    </VistaFtue>
  );
}

/* ----------------- Cenas demo (so para screenshots) ------------------ */

const nada = () => undefined;

function LicaoUmDemo({ cena }: { cena: string }) {
  const navigate = useNavigate();
  if (cena === 'conclusao') {
    return <Conclusao1 xp={25} streak={1} onMeta={() => navigate('/licao-1?cena=softwall')} />;
  }
  if (cena === 'softwall') {
    return <SoftWall xp={25} onTrilha={() => navigate('/')} />;
  }
  if (cena === 'j3') {
    return (
      <VistaFtue progresso={3 / 8} vidas={5} vidasVisiveis={false} pergunta={FALAS.objetivo.mercado} estadoMascote="feliz" treme={false} chave="demo-j3" painel={null}>
        <CartasEscolha
          pergunta="Onde você mais quer mandar bem?"
          sub="Sua escolha muda a próxima jogada."
          cartas={cartasObjetivo}
          selecionada="mercado"
          emGrade
          onEscolher={nada}
          onContinuar={nada}
        />
      </VistaFtue>
    );
  }
  if (cena === 'erro') {
    const ex = licaoFtue.exercicios[IDX_J4] as ExercicioMC;
    return (
      <VistaFtue
        progresso={4 / 8}
        vidas={5}
        vidasVisiveis
        pergunta={ex.pergunta}
        estadoMascote="triste"
        treme={false}
        chave="demo-erro"
        painel={
          <PainelReveal
            resolucao={{ correto: false, titulo: ex.erroMsg, porque: ex.porque }}
            calibracao={null}
            licao={licaoFtue}
            rotuloContinuar="Continuar"
            comMascote={false}
            onContinuar={nada}
          />
        }
      >
        <ExMC ex={ex} fase="revelado" onResolver={nada} presetErro />
      </VistaFtue>
    );
  }
  return <DemoJ1 />;
}

function DemoJ1() {
  const [fase, setFase] = useState<FaseExercicio>('respondendo');
  const [resolucao, setResolucao] = useState<ResolucaoExercicio | null>(null);
  const ex = licaoFtue.exercicios[0] as ExercicioMC;
  const estadoMascote: EstadoMascote =
    fase === 'revelado' && resolucao ? (resolucao.correto ? 'feliz' : 'triste') : 'idle';
  return (
    <VistaFtue
      progresso={0.04}
      vidas={5}
      vidasVisiveis={false}
      pergunta={ex.pergunta}
      estadoMascote={estadoMascote}
      treme={false}
      chave="demo-j1"
      painel={
        fase === 'revelado' && resolucao ? (
          <PainelReveal
            resolucao={resolucao}
            calibracao={null}
            licao={licaoFtue}
            rotuloContinuar="Continuar"
            comMascote={false}
            onContinuar={nada}
          />
        ) : null
      }
    >
      <ExVisual
        ex={ex}
        fase={fase}
        onResolver={(r) => {
          setResolucao(r);
          setFase('revelado');
          tocar(r.correto ? 'acerto' : 'erro');
        }}
      />
    </VistaFtue>
  );
}
