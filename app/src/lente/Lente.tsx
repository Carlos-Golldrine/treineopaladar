/**
 * A Lente (teste): tela cheia, fora do Shell.
 *
 * Fluxo:
 *  1. inicio    -> a pessoa fotografa o rotulo (camera com moldura).
 *  2. analisando-> ate 8s: mascote animado, mensagens girando, barra. Em paralelo:
 *     cria sessao, manda a foto pro n8n e faz polling no Supabase.
 *  3. briefing  -> explica o quiz e a pessoa escolhe o tempo (Facil/Dificil/Hard).
 *     Serve de buffer: enquanto le e escolhe, o n8n termina de gerar as perguntas.
 *  4. quiz      -> responde as 9 perguntas com cronometro. Sem reveal por pergunta.
 *  5. fim       -> placar + revisao (acertos/erros + explicacao).
 *
 * A Q1 e generica (o tipo do vinho), validada contra a ordem 1 do n8n.
 */
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ic } from '../icones/Icones';
import { Mascotinho } from '../mascote';
import { MascoteAnalisa } from './MascoteAnalisa';
import { CameraCaptura } from './CameraCaptura';
import {
  criarSessaoQuiz,
  enviarFotoParaN8n,
  lerPerguntas,
  lerStatusSessao,
  responderQuiz,
  type FichaVinho,
  type PerguntaQuiz,
} from './api';
import './lente.css';

type Fase = 'inicio' | 'camera' | 'analisando' | 'briefing' | 'quiz' | 'fim' | 'erro';

interface ResultadoPergunta {
  pergunta: string;
  escolha: string;
  correta: string;
  acertou: boolean;
  explicacao: string | null;
}

const TIPOS = ['Tinto', 'Branco', 'Rosé', 'Espumante'];

/* Duracao da tela de analise (cobre parte do processamento do n8n). */
const DURACAO_ANALISE = 8000;

const MENSAGENS = [
  'Lendo o rótulo',
  'Analisando todas as notas do vinho',
  'Conhecendo a uva e a região',
  'Criando perguntas sobre esse vinho',
  'Já vai começar',
];

/* Dificuldade = tempo no relogio pra responder as 9 perguntas. */
const DIFICULDADES = [
  { id: 'facil', nome: 'Fácil', tempo: '4 min', seg: 240 },
  { id: 'dificil', nome: 'Difícil', tempo: '3 min', seg: 180 },
  { id: 'hard', nome: 'Hard', tempo: '1 min', seg: 60 },
] as const;

const formatTempo = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const norm = (s: string) =>
  (s || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();

export default function Lente() {
  const navigate = useNavigate();
  const [fase, setFase] = useState<Fase>('inicio');
  const [perguntas, setPerguntas] = useState<PerguntaQuiz[] | null>(null);
  const [vinho, setVinho] = useState<FichaVinho | null>(null);
  const [idx, setIdx] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [respostas, setRespostas] = useState<ResultadoPergunta[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [erroMsg, setErroMsg] = useState('');
  const [msgIdx, setMsgIdx] = useState(0);
  const [difSel, setDifSel] = useState(240);
  const [tempoRestante, setTempoRestante] = useState(0);
  const [tempoEsgotado, setTempoEsgotado] = useState(false);

  const quizIdRef = useRef<string | null>(null);
  const perguntasRef = useRef<PerguntaQuiz[] | null>(null);
  const erroRef = useRef<string | null>(null);
  const cancelado = useRef(false);

  const total = perguntas?.length ?? 9;

  const exibida =
    idx === 0
      ? { pergunta: 'Qual o tipo deste vinho?', opcoes: TIPOS }
      : perguntas
        ? { pergunta: perguntas[idx].pergunta, opcoes: perguntas[idx].opcoes }
        : null;

  const progresso = total > 0 ? (idx + 1) / total : 0;
  const acertos = respostas.filter((r) => r.acertou).length;

  /* Fase analisando: gira as mensagens e, apos DURACAO_ANALISE, cai no briefing. */
  useEffect(() => {
    if (fase !== 'analisando') return;
    setMsgIdx(0);
    const msgIv = window.setInterval(
      () => setMsgIdx((i) => Math.min(i + 1, MENSAGENS.length - 1)),
      Math.floor(DURACAO_ANALISE / MENSAGENS.length),
    );
    const t = window.setTimeout(() => {
      if (!cancelado.current && !erroRef.current) setFase('briefing');
    }, DURACAO_ANALISE);
    return () => {
      window.clearInterval(msgIv);
      window.clearTimeout(t);
    };
  }, [fase]);

  /* Cronometro do quiz: conta pra baixo enquanto estiver no quiz. */
  useEffect(() => {
    if (fase !== 'quiz') return;
    const iv = window.setInterval(() => setTempoRestante((t) => Math.max(0, t - 1)), 1000);
    return () => window.clearInterval(iv);
  }, [fase]);

  /* Tempo esgotado -> resultado. */
  useEffect(() => {
    if (fase === 'quiz' && tempoRestante === 0) {
      setTempoEsgotado(true);
      setFase('fim');
    }
  }, [fase, tempoRestante]);

  const sair = () => {
    cancelado.current = true;
    navigate('/');
  };

  const processarFoto = async (file: File) => {
    cancelado.current = false;
    perguntasRef.current = null;
    erroRef.current = null;
    setPerguntas(null);
    setVinho(null);
    setIdx(0);
    setSel(null);
    setRespostas([]);
    setErroMsg('');
    setTempoEsgotado(false);
    setFase('analisando');
    const id = await criarSessaoQuiz();
    if (!id) {
      erroRef.current = 'Não consegui iniciar. Confira a conexão e tente de novo.';
      setErroMsg(erroRef.current);
      setFase('erro');
      return;
    }
    quizIdRef.current = id;
    void enviarFotoParaN8n(id, file);
    pollar(id);
  };

  const abrirCamera = () => setFase('camera');

  const aoEscolherFoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) void processarFoto(file);
  };

  const comecarQuiz = (seg: number) => {
    setTempoRestante(seg);
    setTempoEsgotado(false);
    setIdx(0);
    setSel(null);
    setRespostas([]);
    setFase('quiz');
  };

  const pollar = (id: string) => {
    let tentativas = 0;
    const tick = async () => {
      if (cancelado.current) return;
      const s = await lerStatusSessao(id);
      if (cancelado.current) return;
      if (s?.status === 'pronto') {
        const ps = await lerPerguntas(id);
        if (cancelado.current) return;
        if (ps.length === 0) {
          erroRef.current = 'O quiz veio vazio. Tente escanear de novo.';
          setErroMsg(erroRef.current);
          setFase('erro');
          return;
        }
        perguntasRef.current = ps;
        setPerguntas(ps);
        setVinho(s.vinho);
        return;
      }
      if (s?.status === 'erro') {
        erroRef.current = s.erro || 'Não consegui ler esse rótulo. Tente uma foto mais nítida.';
        setErroMsg(erroRef.current);
        setFase('erro');
        return;
      }
      tentativas += 1;
      if (tentativas > 60) {
        erroRef.current = 'Está demorando mais que o normal. Tente de novo.';
        setErroMsg(erroRef.current);
        setFase('erro');
        return;
      }
      window.setTimeout(tick, tentativas < 4 ? 1000 : 2000);
    };
    window.setTimeout(tick, 1000);
  };

  const esperarPronto = (): Promise<PerguntaQuiz[] | null> =>
    new Promise((resolve) => {
      if (perguntasRef.current) {
        resolve(perguntasRef.current);
        return;
      }
      let n = 0;
      const iv = window.setInterval(() => {
        if (cancelado.current || erroRef.current) {
          window.clearInterval(iv);
          resolve(null);
        } else if (perguntasRef.current) {
          window.clearInterval(iv);
          resolve(perguntasRef.current);
        } else if (++n > 80) {
          window.clearInterval(iv);
          resolve(null);
        }
      }, 300);
    });

  /* Responde a pergunta atual (valida no servidor, guarda o resultado) e avanca.
     NAO revela acerto/erro aqui: a revisao aparece so no fim. */
  const responderEavancar = async () => {
    if (sel === null || enviando) return;
    setEnviando(true);
    const ps = idx === 0 ? await esperarPronto() : perguntasRef.current;
    if (cancelado.current) return;
    if (!ps || ps.length === 0) {
      setEnviando(false);
      setErroMsg(erroRef.current || 'Não consegui ler esse rótulo. Tente uma foto mais nítida.');
      setFase('erro');
      return;
    }
    if (!perguntas) setPerguntas(ps);
    const alvo = ps[idx];
    const escolhaTexto = idx === 0 ? TIPOS[sel] : alvo.opcoes[sel];
    const respostaIdx =
      idx === 0 ? alvo.opcoes.findIndex((o) => norm(o) === norm(TIPOS[sel])) : sel;
    const r = await responderQuiz(quizIdRef.current!, alvo.id, respostaIdx);
    setEnviando(false);
    const res: ResultadoPergunta = {
      pergunta: idx === 0 ? 'Qual o tipo deste vinho?' : alvo.pergunta,
      escolha: escolhaTexto,
      correta: r ? (alvo.opcoes[r.correta] ?? '') : '',
      acertou: !!r?.acertou,
      explicacao: r?.explicacao ?? null,
    };
    setRespostas((prev) => [...prev, res]);
    if (idx + 1 >= ps.length) {
      setFase('fim');
      return;
    }
    setIdx((i) => i + 1);
    setSel(null);
  };

  if (fase === 'camera') {
    return (
      <CameraCaptura
        onCapturar={(f) => void processarFoto(f)}
        onCancelar={() => setFase('inicio')}
      />
    );
  }

  return (
    <div className="lente">
      <header className="lente-topo app-chrome">
        <button type="button" className="lente-voltar tap" onClick={sair} aria-label="Voltar">
          <Ic nome="x-fechar" size={22} />
        </button>
        {fase === 'quiz' ? (
          <>
            <div
              className="lente-barra"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progresso * 100)}
              aria-label="Progresso do quiz"
            >
              <div
                className="lente-barra-fill"
                style={{ transform: `translateX(${(Math.max(0.04, Math.min(1, progresso)) - 1) * 100}%)` }}
              />
            </div>
            <span className={`lente-timer${tempoRestante <= 20 ? ' lente-timer-urgente' : ''}`}>
              {formatTempo(tempoRestante)}
            </span>
          </>
        ) : (
          <>
            <span className="lente-titulo">A Lente</span>
            <span className="chip-beta">Teste</span>
          </>
        )}
      </header>

      {fase === 'inicio' && (
        <div className="lente-centro">
          <Mascotinho estado="idle" tamanho={104} />
          <h1 className="lente-h1">Tem um vinho na mão?</h1>
          <p className="lente-sub">
            Tire uma foto do rótulo. A gente analisa o vinho e monta um quiz rápido sobre ele.
          </p>
          <button
            type="button"
            className="btn btn-primary btn-jogo btn-cheio tap lente-cta"
            onClick={abrirCamera}
          >
            <Ic nome="taca" size={20} />
            Fotografar o rótulo
          </button>
          <label className="lente-link tap">
            ou escolher da galeria
            <input type="file" accept="image/*" onChange={aoEscolherFoto} hidden />
          </label>
        </div>
      )}

      {fase === 'analisando' && (
        <div className="lente-centro lente-analise">
          <MascoteAnalisa tamanho={150} ativo />
          <p className="lente-analise-msg" key={msgIdx}>
            {MENSAGENS[msgIdx]}
          </p>
          <div className="lente-analise-barra" role="progressbar" aria-label="Analisando">
            <div
              className="lente-analise-barra-fill"
              style={{ animationDuration: `${DURACAO_ANALISE}ms` }}
            />
          </div>
        </div>
      )}

      {fase === 'briefing' && (
        <div className="lente-fim">
          <div className="lente-fim-rolagem">
            <Mascotinho estado="feliz" tamanho={88} />
            <h1 className="lente-h1">{vinho?.nome ? vinho.nome : 'Seu quiz está pronto'}</h1>
            <p className="lente-sub">
              São 9 perguntas sobre {vinho?.nome ? 'esse vinho' : 'o seu vinho'}: o tipo, a uva, a
              região e como ele costuma se mostrar na taça (corpo, acidez, taninos e aromas).
            </p>
            <p className="lente-brief-label">Escolha o tempo no relógio</p>
            <div className="lente-dificuldades">
              {DIFICULDADES.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className={`lente-dif tap${difSel === d.seg ? ' lente-dif-sel' : ''}`}
                  aria-pressed={difSel === d.seg}
                  onClick={() => setDifSel(d.seg)}
                >
                  <span className="lente-dif-nome">{d.nome}</span>
                  <span className="lente-dif-tempo">{d.tempo}</span>
                </button>
              ))}
            </div>
            <p className="lente-brief-dica">Menos tempo no relógio, mais desafio.</p>
          </div>
          <div className="lente-fim-acoes">
            <button
              type="button"
              className="btn btn-primary btn-jogo btn-cheio tap"
              onClick={() => comecarQuiz(difSel)}
            >
              Começar
            </button>
          </div>
        </div>
      )}

      {fase === 'quiz' && exibida && (
        <>
          <div className="lente-meio" key={idx}>
            <p className={`lente-vinho${vinho?.nome ? '' : ' lente-vinho-buscando'}`}>
              {vinho?.nome ? vinho.nome : 'Analisando o vinho…'}
            </p>
            <div className="lente-mascote">
              <MascoteAnalisa tamanho={72} ativo />
              <h2 className="lente-balao">{exibida.pergunta}</h2>
            </div>
            <div className="lente-opcoes" role="group" aria-label="Opções de resposta">
              {exibida.opcoes.map((opcao, i) => (
                <button
                  key={`${idx}-${i}-${opcao}`}
                  type="button"
                  className={`lente-opcao tap entra${i === sel ? ' lente-opcao-sel' : ''}`}
                  style={{ animationDelay: `${i * 45}ms` }}
                  aria-pressed={i === sel}
                  onClick={() => setSel(i)}
                >
                  {opcao}
                </button>
              ))}
            </div>
          </div>

          <div className="lente-rodape">
            <button
              type="button"
              className="btn btn-primary btn-jogo btn-cheio tap"
              disabled={sel === null || enviando}
              onClick={responderEavancar}
            >
              {enviando ? 'Salvando…' : idx + 1 >= total ? 'Ver resultado' : 'Próxima'}
            </button>
          </div>
        </>
      )}

      {fase === 'fim' && (
        <div className="lente-fim">
          <div className="lente-fim-rolagem">
            <Mascotinho estado={acertos * 2 >= total ? 'feliz' : 'triste'} tamanho={96} />
            <p className="lente-placar">
              <span className="lente-placar-num">{acertos}</span>
              <span className="lente-placar-de">de {total}</span>
            </p>
            <h1 className="lente-h1">
              {tempoEsgotado ? 'Tempo esgotado' : acertos * 2 >= total ? 'Mandou bem!' : 'Treino é isso aí'}
            </h1>
            {vinho?.nome && <p className="lente-sub">Vinho: {vinho.nome}</p>}

            <ul className="lente-revisao">
              {respostas.map((r, i) => (
                <li key={i} className={`lente-rev ${r.acertou ? 'lente-rev-ok' : 'lente-rev-erro'}`}>
                  <span className={`lente-selo ${r.acertou ? 'lente-selo-ok' : 'lente-selo-erro'}`}>
                    <Ic nome={r.acertou ? 'check' : 'x-fechar'} size={15} />
                  </span>
                  <div className="lente-rev-txt">
                    <p className="lente-rev-perg">{r.pergunta}</p>
                    {!r.acertou && (
                      <p className="lente-rev-det">
                        Você: {r.escolha} · Certo: {r.correta}
                      </p>
                    )}
                    {r.explicacao && <p className="lente-rev-exp">{r.explicacao}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="lente-fim-acoes">
            <button
              type="button"
              className="btn btn-primary btn-jogo btn-cheio tap lente-cta"
              onClick={abrirCamera}
            >
              <Ic nome="taca" size={20} />
              Escanear outro
            </button>
            <button type="button" className="lente-link tap" onClick={sair}>
              Voltar ao início
            </button>
          </div>
        </div>
      )}

      {fase === 'erro' && (
        <div className="lente-centro">
          <Mascotinho estado="triste" tamanho={104} />
          <h1 className="lente-h1">Ops</h1>
          <p className="lente-sub">{erroMsg}</p>
          <button
            type="button"
            className="btn btn-primary btn-jogo btn-cheio tap lente-cta"
            onClick={abrirCamera}
          >
            <Ic nome="taca" size={20} />
            Tentar de novo
          </button>
          <button type="button" className="lente-link tap" onClick={sair}>
            Voltar ao início
          </button>
        </div>
      )}
    </div>
  );
}
