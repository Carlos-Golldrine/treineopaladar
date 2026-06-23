/**
 * A Lente (teste): tela cheia, fora do Shell.
 *
 * Fluxo:
 *  1. inicio    -> a pessoa fotografa o rotulo.
 *  2. analisando-> ate 4s: Mascotinho com tablet+caneta "analisando", mensagens
 *     girando e barra enchendo. Em paralelo: cria sessao, manda a foto pro n8n
 *     (OCR -> identifica -> gera quiz) e faz polling no Supabase.
 *  3. quiz      -> responde as perguntas em sequencia. NAO mostra acerto/erro a
 *     cada uma; so registra (validacao server-side via responder_quiz).
 *  4. fim       -> placar + revisao (o que acertou/errou em cada pergunta).
 *
 * A Q1 e generica (o tipo do vinho), validada contra a ordem 1 do n8n mapeando
 * a escolha pelo texto. UI no padrao do app (Mascotinho, barra, cards).
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

type Fase = 'inicio' | 'camera' | 'analisando' | 'quiz' | 'fim' | 'erro';

interface ResultadoPergunta {
  pergunta: string;
  escolha: string;
  correta: string;
  acertou: boolean;
  explicacao: string | null;
}

const TIPOS = ['Tinto', 'Branco', 'Rosé', 'Espumante'];

/* Duracao da tela de analise (cobre o processamento do n8n). */
const DURACAO_ANALISE = 7000;

const MENSAGENS = [
  'Lendo o rótulo',
  'Analisando todas as notas do vinho',
  'Conhecendo a uva e a região',
  'Criando perguntas sobre esse vinho',
  'Já vai começar',
];

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

  /* Fase analisando: gira as mensagens e, em ate 4s, cai no quiz. */
  useEffect(() => {
    if (fase !== 'analisando') return;
    setMsgIdx(0);
    const msgIv = window.setInterval(
      () => setMsgIdx((i) => Math.min(i + 1, MENSAGENS.length - 1)),
      Math.floor(DURACAO_ANALISE / MENSAGENS.length),
    );
    const t = window.setTimeout(() => {
      if (!cancelado.current && !erroRef.current) setFase('quiz');
    }, DURACAO_ANALISE);
    return () => {
      window.clearInterval(msgIv);
      window.clearTimeout(t);
    };
  }, [fase]);

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
        ) : (
          <span className="lente-titulo">A Lente</span>
        )}
        <span className="chip-beta">Teste</span>
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
            <Mascotinho estado={acertos * 2 >= respostas.length ? 'feliz' : 'triste'} tamanho={96} />
            <p className="lente-placar">
              <span className="lente-placar-num">{acertos}</span>
              <span className="lente-placar-de">de {respostas.length}</span>
            </p>
            <h1 className="lente-h1">{acertos * 2 >= respostas.length ? 'Mandou bem!' : 'Treino é isso aí'}</h1>
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
