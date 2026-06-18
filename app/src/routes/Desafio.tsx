import { useEffect, useMemo, useState } from 'react';
import { track } from '../lib/analytics';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { obterStore } from '../engine';
import type { ExercicioMC } from '../engine';
import { ExMC } from '../licao/ExMC';
import { RotuloFigura } from '../licao/RotuloFigura';
import { PainelReveal } from '../licao/Feedback';
import type { FaseExercicio, ResolucaoExercicio } from '../licao/tipos';
import { vibrar } from '../licao/tipos';
import { Ic } from '../icones/Icones';
import type { NomeIcone } from '../icones/Icones';
import { DelayedSkeleton } from '../components/DelayedSkeleton';
import { TchinObservador } from '../coreografia/Coreografias';
import { tocar } from '../som/som';
import { garantirMesa, postarDesafioResultado } from '../lib/mesa';
import { nuvemConfigurada } from '../lib/supabase';

import '../licao/player.css';
import './desafio.css';

/* Idempotencia: posta o resultado na mesa no maximo 1x por dia (cliques repetidos
   so renavegam para A Mesa, sem duplicar o post). */
const CHAVE_DESAFIO_MESA = 'tp.desafio.mesa.v1';
function jaPostouNaMesa(dia: string): boolean {
  try {
    return localStorage.getItem(CHAVE_DESAFIO_MESA) === dia;
  } catch {
    return false;
  }
}
function marcarPostadoNaMesa(dia: string): void {
  try {
    localStorage.setItem(CHAVE_DESAFIO_MESA, dia);
  } catch {
    /* modo privado/quota: segue sem memorizar */
  }
}

/* ------------------------------ Dados -------------------------------- */

interface VinhoRevelado {
  nome: string;
  uva: string;
  pais: string;
  faixaPreco: string;
  /**
   * Doçura do rótulo (seco / meio seco / suave), opcional: a fábrica
   * inclui o subtipo onde o banco tem o dado. É a informação que o
   * público diz não achar no rótulo (DD C6), por isso vira chip
   * destacado quando existe. Aceita as duas grafias do pipeline.
   */
  subtipoDocura?: string;
  subtipo_docura?: string;
}

/** Doçura exibível do vinho revelado (qualquer grafia do pipeline). */
function docuraDoVinho(vinho: VinhoRevelado): string | null {
  const bruto = vinho.subtipoDocura ?? vinho.subtipo_docura ?? '';
  const limpo = bruto.trim().toLowerCase();
  return limpo.length > 0 ? limpo : null;
}

interface DesafioDia {
  id: string;
  vinhoId: string;
  imagem: string;
  perguntas: ExercicioMC[];
  vinho: VinhoRevelado;
}

interface ArquivoDesafios {
  total: number;
  desafios: DesafioDia[];
}

/* --------------------- Dia oficial (Brasilia) ------------------------ */

/** Dia local America/Sao_Paulo no formato YYYY-MM-DD (reset oficial). */
export function diaSaoPaulo(agora: number): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(agora);
}

/** Selecao deterministica: dias desde a epoch (no fuso de SP), modulo N. */
export function indiceDoDia(dia: string, total: number): number {
  const [ano, mes, diaN] = dia.split('-').map(Number);
  const dias = Math.floor(Date.UTC(ano, mes - 1, diaN) / 86400000);
  return ((dias % total) + total) % total;
}

function diaCurto(dia: string): string {
  const [, mes, diaN] = dia.split('-');
  return `${diaN}/${mes}`;
}

/** Ms ate a proxima meia-noite de Brasilia (reset oficial do Desafio do Dia). */
function msAteMeiaNoiteBrasilia(agora: number): number {
  const partes = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(agora);
  const valor = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value ?? 0);
  const decorrido = (((valor('hour') % 24) * 60 + valor('minute')) * 60 + valor('second')) * 1000 + (agora % 1000);
  return 24 * 3600 * 1000 - decorrido;
}

function formatarContagem(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const seg = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
}

/* -------------------- Tentativa do dia (1 por dia) -------------------- */

const CHAVE_TENTATIVA = 'tp.desafio.v1';

interface TentativaDia {
  data: string;
  acertos: number;
  /** Grade compartilhavel, so com os caracteres permitidos (sem emoji). */
  grade: string;
}

function lerTentativa(dia: string): TentativaDia | null {
  try {
    const cru = localStorage.getItem(CHAVE_TENTATIVA);
    if (!cru) return null;
    const dado = JSON.parse(cru) as Partial<TentativaDia>;
    if (dado.data === dia && typeof dado.grade === 'string' && typeof dado.acertos === 'number') {
      return { data: dado.data, acertos: dado.acertos, grade: dado.grade };
    }
  } catch {
    /* sem storage */
  }
  return null;
}

function gravarTentativa(t: TentativaDia): void {
  try {
    localStorage.setItem(CHAVE_TENTATIVA, JSON.stringify(t));
  } catch {
    /* sem storage */
  }
}

/* ------------------------------- Rota -------------------------------- */

type Etapa =
  | { t: 'carregando' }
  | { t: 'aberto' }
  | { t: 'jogando' }
  | { t: 'resultado'; tentativa: TentativaDia; xpGanho: number | null };

const COMO_FUNCIONA: { icone: NomeIcone; text: string }[] = [
  { icone: 'garrafa', text: 'Um rótulo real por dia, o mesmo para todo mundo.' },
  { icone: 'alvo-desafio', text: 'Quatro perguntas rápidas sobre ele.' },
  { icone: 'mesa', text: 'Compare seu resultado com a sua mesa, sem spoiler.' },
];

export default function Desafio() {
  const dia = useMemo(() => diaSaoPaulo(Date.now()), []);
  const [params] = useSearchParams();
  const cena = params.get('cena');
  const [desafio, setDesafio] = useState<DesafioDia | null>(null);
  const [etapa, setEtapa] = useState<Etapa>({ t: 'carregando' });

  /* Conteudo lazy: o arquivo de desafios chega fora do bundle inicial */
  useEffect(() => {
    let vivo = true;
    import('../content/pratica/desafios.json').then((mod) => {
      if (!vivo) return;
      const dado = mod.default as unknown as ArquivoDesafios;
      /* Cena demo (screenshots e e2e): resultado com chip de docura,
         sem gravar nada. Dado real continua vindo so do banco. */
      if (cena === 'resultado') {
        const base = dado.desafios[0];
        setDesafio({ ...base, vinho: { ...base.vinho, subtipoDocura: 'seco' } });
        setEtapa({
          t: 'resultado',
          tentativa: { data: dia, acertos: 3, grade: '■■□■' },
          xpGanho: null,
        });
        return;
      }
      const escolhido = dado.desafios[indiceDoDia(dia, dado.desafios.length)];
      setDesafio(escolhido);
      const tentativa = lerTentativa(dia);
      setEtapa(tentativa ? { t: 'resultado', tentativa, xpGanho: null } : { t: 'aberto' });
    });
    return () => {
      vivo = false;
    };
  }, [dia, cena]);

  const concluir = (acertosArr: boolean[]) => {
    const grade = acertosArr.map((ok) => (ok ? '■' : '□')).join('');
    const tentativa: TentativaDia = {
      data: dia,
      acertos: acertosArr.filter(Boolean).length,
      grade,
    };
    gravarTentativa(tentativa);
    const xpGanho = obterStore().concluirDesafioDia(dia);
    track('desafio_concluido', { acertos: tentativa.acertos, total: acertosArr.length, xp: xpGanho ?? 0 });
    tocar('marco');
    setEtapa({ t: 'resultado', tentativa, xpGanho });
  };

  if (etapa.t === 'carregando' || !desafio) {
    return (
      <>
        <header className="screen-header app-chrome">
          <h1 className="screen-title">Desafio do Dia</h1>
          <p className="screen-sub">Um por dia, à meia-noite. Para todo mundo.</p>
        </header>
        <DelayedSkeleton />
      </>
    );
  }

  if (etapa.t === 'jogando') {
    return <DesafioJogo desafio={desafio} onConcluir={concluir} onSair={() => setEtapa({ t: 'aberto' })} />;
  }

  return (
    <>
      <header className="screen-header app-chrome">
        <h1 className="screen-title">Desafio do Dia</h1>
        <p className="screen-sub">Um por dia, à meia-noite. Para todo mundo.</p>
      </header>

      {etapa.t === 'aberto' ? (
        <AbertoHoje dia={dia} desafio={desafio} onJogar={() => setEtapa({ t: 'jogando' })} />
      ) : (
        <ResultadoHoje dia={dia} desafio={desafio} tentativa={etapa.tentativa} xpGanho={etapa.xpGanho} />
      )}

      <section className="how" aria-label="Como funciona">
        <h3 className="how-title">Como funciona</h3>
        {COMO_FUNCIONA.map((step) => (
          <div className="how-row" key={step.text}>
            <span className="how-icon">
              <Ic nome={step.icone} size={20} />
            </span>
            <p>{step.text}</p>
          </div>
        ))}
      </section>
    </>
  );
}

/* --------------------------- Estado aberto ---------------------------- */

function AbertoHoje({
  dia,
  desafio,
  onJogar,
}: {
  dia: string;
  desafio: DesafioDia;
  onJogar: () => void;
}) {
  return (
    <section className="daily-card" aria-label="Desafio de hoje">
      <p className="daily-data">Rótulo de {diaCurto(dia)}</p>
      <RotuloFigura src={desafio.imagem} alt="Rótulo misterioso de hoje" />
      <h2 className="daily-title">Olhe com calma. O rótulo entrega muito.</h2>
      <p className="daily-copy">Toque na garrafa para ver de perto. Quatro perguntas sobre ela, uma chance por dia, sem vidas em jogo.</p>
      <button type="button" className="btn btn-gold btn-jogo btn-cheio tap" onClick={onJogar}>
        Aceitar o desafio
      </button>
    </section>
  );
}

/* ------------------------- Jogo (4 perguntas) ------------------------- */

function DesafioJogo({
  desafio,
  onConcluir,
  onSair,
}: {
  desafio: DesafioDia;
  onConcluir: (acertos: boolean[]) => void;
  onSair: () => void;
}) {
  const [posicao, setPosicao] = useState(0);
  const [acertos, setAcertos] = useState<boolean[]>([]);
  const [fase, setFase] = useState<FaseExercicio>('respondendo');
  const [resolucao, setResolucao] = useState<ResolucaoExercicio | null>(null);

  const pergunta = useMemo<ExercicioMC>(
    () => ({ ...desafio.perguntas[posicao], imagem: desafio.imagem }),
    [desafio, posicao],
  );

  const onResolver = (r: ResolucaoExercicio) => {
    setResolucao(r);
    setAcertos((a) => [...a, r.correto]);
    vibrar();
    tocar(r.correto ? 'acerto' : 'erro');
    setFase('revelado');
  };

  const onContinuar = () => {
    if (posicao + 1 >= desafio.perguntas.length) {
      onConcluir(acertos);
      return;
    }
    setPosicao((p) => p + 1);
    setFase('respondendo');
    setResolucao(null);
  };

  return (
    <div className="desafio-veu">
      <div className="player">
        <header className="player-topo app-chrome">
          <button type="button" className="player-fechar tap" aria-label="Sair do desafio" onClick={onSair}>
            <Ic nome="x-fechar" size={22} />
          </button>
          <div
            className="player-barra"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round((posicao / desafio.perguntas.length) * 100)}
            aria-label={`Pergunta ${posicao + 1} de ${desafio.perguntas.length}`}
          >
            <div
              className="player-barra-fill"
              style={{
                transform: `translateX(${(Math.max(0.04, posicao / desafio.perguntas.length) - 1) * 100}%)`,
              }}
            />
          </div>
          <span className="pratica-contagem" aria-hidden="true">
            {posicao + 1}/{desafio.perguntas.length}
          </span>
        </header>

        <div className="player-meio desafio-meio" key={posicao}>
          <ExMC ex={pergunta} fase={fase} onResolver={onResolver} />
        </div>

        <TchinObservador visivel={fase === 'respondendo'} />

        {fase === 'revelado' && resolucao && (
          <PainelReveal
            resolucao={resolucao}
            calibracao={null}
            rotuloContinuar={posicao + 1 >= desafio.perguntas.length ? 'Ver resultado' : 'Continuar'}
            marco={posicao + 1 >= desafio.perguntas.length}
            onContinuar={onContinuar}
          />
        )}
      </div>
    </div>
  );
}

/* ----------------------------- Resultado ------------------------------ */

function ResultadoHoje({
  dia,
  desafio,
  tentativa,
  xpGanho,
}: {
  dia: string;
  desafio: DesafioDia;
  tentativa: TentativaDia;
  xpGanho: number | null;
}) {
  const navigate = useNavigate();
  const [restante, setRestante] = useState(() => msAteMeiaNoiteBrasilia(Date.now()));
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setRestante(msAteMeiaNoiteBrasilia(Date.now())), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!copiado) return;
    const t = window.setTimeout(() => setCopiado(false), 2200);
    return () => window.clearTimeout(t);
  }, [copiado]);

  const compartilhar = async () => {
    // Caminho principal (regra de produto, DECISOES-PRODUTO-V2): publicar o resultado
    // no feed da Mesa e abrir A Mesa (in-app), nao um share externo.
    if (nuvemConfigurada()) {
      try {
        const mesaId = await garantirMesa();
        if (mesaId) {
          if (!jaPostouNaMesa(dia)) {
            await postarDesafioResultado(mesaId, tentativa.grade, tentativa.acertos);
            marcarPostadoNaMesa(dia);
          }
          track('desafio_compartilhado', { destino: 'mesa' });
          navigate('/mesa');
          return;
        }
      } catch {
        /* sem sessao/rede: cai no fallback externo abaixo */
      }
    }
    // Fallback gracioso (sem nuvem): share nativo / copiar a grade estilo Wordle.
    const texto = `Desafio do Dia ${diaCurto(dia)}, Treine seu Paladar\n${tentativa.grade} ${tentativa.acertos} de 4`;
    try {
      if (navigator.share) {
        await navigator.share({ text: texto });
        return;
      }
      throw new Error('sem share');
    } catch {
      try {
        await navigator.clipboard.writeText(texto);
        setCopiado(true);
      } catch {
        /* clipboard bloqueado: nada a fazer */
      }
    }
  };

  return (
    <>
      <section className="daily-card" aria-label="Seu resultado de hoje">
        <p className="daily-data">Desafio de {diaCurto(dia)}</p>
        <div className="grade" aria-label={`${tentativa.acertos} acertos em 4 perguntas`}>
          {tentativa.grade.split('').map((c, i) => (
            <span key={i} className={`grade-quadro${c === '■' ? ' grade-certo' : ''}`} aria-hidden="true" />
          ))}
        </div>
        <h2 className="daily-title">
          {tentativa.acertos === 4
            ? 'Quatro de quatro. Que taça.'
            : `${tentativa.acertos} de 4. ${tentativa.acertos >= 2 ? 'Bonito olho.' : 'Amanhã tem revanche.'}`}
        </h2>
        {xpGanho !== null && <p className="daily-xp">+{xpGanho} XP</p>}
        <button type="button" className="btn btn-gold btn-jogo btn-cheio tap" onClick={compartilhar}>
          <Ic nome="compartilhar" size={18} />
          Compartilhar com a mesa
        </button>
        {copiado && (
          <p className="daily-toast" role="status">
            Resultado copiado. É só colar na conversa.
          </p>
        )}
      </section>

      <section className="revelado" aria-label="O vinho de hoje, revelado">
        <p className="revelado-eyebrow">O vinho de hoje era</p>
        <div className="revelado-vinho">
          <div className="revelado-rotulo">
            <img src={desafio.imagem} alt={`Rótulo de ${desafio.vinho.nome}`} loading="lazy" decoding="async" />
          </div>
          <div className="revelado-info">
            <h3 className="revelado-nome">{desafio.vinho.nome}</h3>
            {docuraDoVinho(desafio.vinho) && (
              <p className="chip-docura" aria-label={`Doçura: ${docuraDoVinho(desafio.vinho)}`}>
                {docuraDoVinho(desafio.vinho)}
              </p>
            )}
            <dl className="revelado-fatos">
              <div className="revelado-fato">
                <dt>Uva</dt>
                <dd>{desafio.vinho.uva}</dd>
              </div>
              <div className="revelado-fato">
                <dt>País</dt>
                <dd>{desafio.vinho.pais}</dd>
              </div>
              <div className="revelado-fato">
                <dt>Faixa de preço</dt>
                <dd>{desafio.vinho.faixaPreco}</dd>
              </div>
            </dl>
          </div>
        </div>
        <p className="revelado-proximo">
          Próximo rótulo em <strong className="folha-mono">{formatarContagem(restante)}</strong>
        </p>
      </section>
    </>
  );
}
