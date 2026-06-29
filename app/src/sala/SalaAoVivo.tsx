/**
 * Sala Ao Vivo: lobby + quiz em grupo no modelo LOCKSTEP (estilo Kahoot, host-paced).
 * Todos ficam na MESMA pergunta. Cada um responde, mas o certo/errado SO aparece quando a
 * mesa inteira respondeu (ou o anfitriao revela). A pontuacao tambem so sobe na revelacao,
 * entao ninguem descobre que acertou espiando o placar. O anfitriao clica "Proxima" e todos
 * avancam juntos (Supabase Realtime). Reusa o visual do quiz da Lente.
 */
import { useEffect, useRef, useState } from 'react';
import { Ic } from '../icones/Icones';
import {
  assinarRanking,
  assinarSala,
  avancarPergunta,
  estadoJogo,
  iniciarSala,
  meuUid,
  perguntasDaSala,
  rankingSala,
  responderSala,
  revelarPergunta,
  sairSala,
  type EstadoJogo,
  type PerguntaSala,
  type RankItem,
} from './api';
import '../lente/lente.css';
import './sala.css';

export function SalaAoVivo({
  salaId,
  codigo,
  ehHost,
  onSair,
}: {
  salaId: string;
  codigo: string;
  ehHost: boolean;
  onSair: () => void;
}) {
  const [jogo, setJogo] = useState<EstadoJogo | null>(null);
  const [perguntas, setPerguntas] = useState<PerguntaSala[] | null>(null);
  const [meu, setMeu] = useState<string | null>(null);
  const [ranking, setRanking] = useState<RankItem[]>([]);

  // selecao ancorada ao indice da pergunta: nunca "vaza" pra pergunta seguinte (corrida do avanco)
  const [sel, setSel] = useState<{ idx: number; i: number } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [iniciando, setIniciando] = useState(false);
  const [agindo, setAgindo] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [erroResp, setErroResp] = useState(false);
  const vivo = useRef(true);

  useEffect(() => {
    vivo.current = true;
    const refJogo = async () => {
      const e = await estadoJogo(salaId);
      if (vivo.current && e) setJogo(e);
    };
    const refRanking = async () => {
      const r = await rankingSala(salaId);
      if (vivo.current) setRanking(r);
    };
    const carregar = async () => {
      const [ps, uid] = await Promise.all([perguntasDaSala(salaId), meuUid()]);
      if (!vivo.current) return;
      setPerguntas(ps);
      setMeu(uid);
      await Promise.all([refRanking(), refJogo()]);
    };
    void carregar();
    const desRanking = assinarRanking(salaId, () => {
      void refRanking();
      void refJogo();
    });
    const desSala = assinarSala(salaId, () => void refJogo());
    // resiliencia (PWA mobile): se o websocket dormir, re-sincroniza ao voltar o foco
    // e por um polling leve, pra ninguem ficar preso em "Aguardando a mesa".
    const aoVoltar = () => {
      if (document.visibilityState === 'visible') {
        void refJogo();
        void refRanking();
      }
    };
    document.addEventListener('visibilitychange', aoVoltar);
    window.addEventListener('focus', aoVoltar);
    const iv = window.setInterval(() => void refJogo(), 7000);
    return () => {
      vivo.current = false;
      desRanking();
      desSala();
      document.removeEventListener('visibilitychange', aoVoltar);
      window.removeEventListener('focus', aoVoltar);
      window.clearInterval(iv);
    };
  }, [salaId]);

  const host = jogo?.eh_host ?? ehHost;
  const iniciada = jogo?.iniciada ?? false;
  const fim = jogo?.fim ?? false;
  const idx = jogo?.pergunta_idx ?? 0;
  const total = jogo?.total ?? perguntas?.length ?? 0;
  const revelado = jogo?.revelado ?? false;
  const jaRespondi = jogo?.ja_respondi ?? false;
  const atual = perguntas?.[idx] ?? null;
  const selI = sel && sel.idx === idx ? sel.i : null; // selecao so vale pra pergunta atual

  // pergunta nova -> limpa envio/erro (a selecao ja se invalida sozinha via selI)
  useEffect(() => {
    setEnviando(false);
    setErroResp(false);
  }, [idx]);

  const refTudo = async () => {
    const [e, r] = await Promise.all([estadoJogo(salaId), rankingSala(salaId)]);
    if (!vivo.current) return;
    if (e) setJogo(e);
    setRanking(r);
  };

  const iniciar = async () => {
    if (iniciando) return;
    setIniciando(true);
    const ok = await iniciarSala(salaId);
    if (!vivo.current) return;
    setIniciando(false);
    if (ok) await refTudo();
  };

  const copiar = () => {
    try {
      void navigator.clipboard?.writeText(codigo);
    } catch {
      /* sem clipboard: o codigo ja esta grande na tela */
    }
    setCopiado(true);
    window.setTimeout(() => vivo.current && setCopiado(false), 1500);
  };

  const sair = () => {
    void sairSala(salaId);
    onSair();
  };

  const responder = async () => {
    if (selI === null || enviando || !atual) return;
    setEnviando(true);
    setErroResp(false);
    const r = await responderSala(salaId, atual.id, selI);
    if (!vivo.current) return;
    await refTudo();
    if (!vivo.current) return;
    setEnviando(false);
    if (r === null) setErroResp(true); // a mesa avancou/revelou no instante do clique
  };

  const avancar = async () => {
    if (agindo) return;
    setAgindo(true);
    await avancarPergunta(salaId);
    if (!vivo.current) return;
    await refTudo();
    if (vivo.current) setAgindo(false);
  };

  const revelar = async () => {
    if (agindo) return;
    setAgindo(true);
    await revelarPergunta(salaId);
    if (!vivo.current) return;
    await refTudo();
    if (vivo.current) setAgindo(false);
  };

  const top = ranking.slice(0, 3);
  const eu = ranking.find((r) => r.user_id === meu);
  const ultima = idx + 1 >= total;

  return (
    <div className="lente sala">
      <header className="lente-topo app-chrome">
        <button type="button" className="lente-voltar tap" onClick={sair} aria-label="Sair da sala">
          <Ic nome="seta-voltar" size={22} />
        </button>
        <span className="lente-titulo">Sala ao vivo</span>
        {iniciada && !fim && <span className="sala-codigo-chip">{codigo}</span>}
      </header>

      {/* ==================== LOBBY ==================== */}
      {!iniciada && (
        <div className="sala-lobby">
          {jogo?.vinho?.nome && (
            <p className="sala-lobby-vinho">
              <Ic nome="taca" size={18} /> {jogo.vinho.nome}
            </p>
          )}

          <div className="sala-codigo-cartao">
            <span className="sala-codigo-label">Código da sala</span>
            <strong className="sala-codigo-grande">{codigo}</strong>
            <button type="button" className="sala-copiar tap" onClick={copiar}>
              <Ic nome={copiado ? 'check' : 'compartilhar'} size={15} />
              {copiado ? 'Copiado' : 'Copiar código'}
            </button>
          </div>

          <p className="sala-lobby-sub">
            {host ? 'Chame a mesa: todos entram com esse código.' : 'Você está dentro. Boa sorte!'}
          </p>

          <div className="sala-jogadores">
            <span className="sala-jogadores-cab">
              Na sala
              <span className="sala-jogadores-n">{ranking.length}</span>
            </span>
            <ul className="sala-jogadores-lista">
              {ranking.map((r) => (
                <li key={r.user_id} className={`sala-jog ${r.user_id === meu ? 'sala-jog-eu' : ''}`}>
                  <span className="sala-jog-bolinha" />
                  <span className="sala-jog-nome">{r.nome ?? 'Alguém'}</span>
                  {r.user_id === meu && <span className="sala-jog-voce">você</span>}
                </li>
              ))}
              {ranking.length === 0 && <li className="sala-rank-vazio">Esperando a galera entrar…</li>}
            </ul>
          </div>

          <div className="sala-lobby-acao">
            {host ? (
              <button
                type="button"
                className="btn btn-primary btn-jogo btn-cheio tap"
                onClick={() => void iniciar()}
                disabled={iniciando}
              >
                {iniciando ? 'Começando…' : 'Começar o quiz'}
              </button>
            ) : (
              <p className="sala-aguardando">
                Aguardando o anfitrião começar<span className="sala-dots" aria-hidden="true" />
              </p>
            )}
          </div>
        </div>
      )}

      {/* ==================== QUIZ (lockstep) ==================== */}
      {iniciada && !fim && (
        <>
          {jogo?.vinho?.nome && (
            <p className="sala-quiz-vinho">
              <Ic nome="taca" size={15} /> {jogo.vinho.nome}
            </p>
          )}
          <div className="sala-ranking" aria-label="Ranking ao vivo">
            <div className="sala-ranking-cab">
              <span className="sala-ranking-titulo">Ranking</span>
              <span className="sala-ranking-ao-vivo">ao vivo</span>
            </div>
            <ol className="sala-ranking-lista">
              {top.map((r) => (
                <li key={r.user_id} className={`sala-rank ${r.user_id === meu ? 'sala-rank-eu' : ''}`}>
                  <span className={`sala-rank-pos sala-rank-pos-${r.posicao}`}>{r.posicao}</span>
                  <span className="sala-rank-nome">{r.nome ?? 'Alguém'}</span>
                  <span className="sala-rank-pts">{r.pontos}</span>
                </li>
              ))}
              {eu && eu.posicao > 3 && (
                <li className="sala-rank sala-rank-eu">
                  <span className="sala-rank-pos">{eu.posicao}</span>
                  <span className="sala-rank-nome">Você</span>
                  <span className="sala-rank-pts">{eu.pontos}</span>
                </li>
              )}
            </ol>
          </div>

          {atual && (
            <div className="lente-meio" key={idx}>
              <div className="lente-mascote">
                <h2 className="lente-balao">{atual.pergunta}</h2>
              </div>

              {!revelado && (
                <p className="sala-progresso" aria-live="polite">
                  {jogo?.responderam ?? 0} de {jogo?.total_participantes ?? 0} responderam
                </p>
              )}

              <div className="lente-opcoes" role="group" aria-label="Opções de resposta">
                {atual.opcoes.map((opcao, i) => {
                  let cls = '';
                  if (revelado) {
                    if (i === jogo?.correta) cls = ' sala-opcao-certa';
                    else if (i === jogo?.minha_resposta) cls = ' sala-opcao-errada';
                  } else if (jaRespondi) {
                    if (i === jogo?.minha_resposta) cls = ' lente-opcao-sel';
                  } else if (i === selI) {
                    cls = ' lente-opcao-sel';
                  }
                  const travado = revelado || jaRespondi;
                  return (
                    <button
                      key={`${idx}-${i}`}
                      type="button"
                      className={`lente-opcao tap${cls}`}
                      aria-pressed={i === selI}
                      disabled={travado}
                      onClick={() => !travado && setSel({ idx, i })}
                    >
                      {opcao}
                    </button>
                  );
                })}
              </div>

              {revelado && (
                <div className={`sala-reveal ${jogo?.acertou ? 'sala-reveal-ok' : 'sala-reveal-erro'}`}>
                  <p className="sala-reveal-tit">
                    {jogo?.acertou === true
                      ? 'Acertou! +10'
                      : jogo?.acertou === false
                        ? 'Não foi dessa vez'
                        : 'Sem resposta dessa vez'}
                  </p>
                  {jogo?.explicacao && <p className="sala-reveal-exp">{jogo.explicacao}</p>}
                </div>
              )}
            </div>
          )}

          <div className="lente-rodape">
            {revelado ? (
              host ? (
                <button
                  type="button"
                  className="btn btn-primary btn-jogo btn-cheio tap"
                  onClick={() => void avancar()}
                  disabled={agindo}
                >
                  {ultima ? 'Ver resultado' : 'Próxima pergunta'}
                </button>
              ) : (
                <p className="sala-aguardando">
                  Aguardando o anfitrião<span className="sala-dots" aria-hidden="true" />
                </p>
              )
            ) : jaRespondi ? (
              <div className="sala-espera">
                <p className="sala-aguardando">
                  Resposta enviada. Aguardando a mesa<span className="sala-dots" aria-hidden="true" />
                </p>
                {host && (
                  <button type="button" className="sala-revelar tap" onClick={() => void revelar()} disabled={agindo}>
                    Revelar agora
                  </button>
                )}
              </div>
            ) : (
              <>
                {erroResp && <p className="sala-erro">Não deu tempo, a mesa avançou.</p>}
                <button
                  type="button"
                  className="btn btn-primary btn-jogo btn-cheio tap"
                  disabled={selI === null || enviando || !atual}
                  onClick={() => void responder()}
                >
                  {enviando ? 'Enviando…' : 'Responder'}
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* ==================== FIM ==================== */}
      {iniciada && fim && (
        <>
          <div className="lente-fim-rolagem sala-fim">
            <h1 className="lente-h1">Fim do quiz</h1>
            <p className="lente-sub">Veja como a mesa se saiu.</p>
            <ol className="sala-ranking-final">
              {ranking.map((r) => (
                <li key={r.user_id} className={`sala-rank ${r.user_id === meu ? 'sala-rank-eu' : ''}`}>
                  <span className={`sala-rank-pos sala-rank-pos-${r.posicao}`}>{r.posicao}</span>
                  <span className="sala-rank-nome">{r.nome ?? 'Alguém'}</span>
                  <span className="sala-rank-pts">{r.pontos} pts</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="lente-rodape">
            <button type="button" className="btn btn-primary btn-jogo btn-cheio tap" onClick={sair}>
              Sair da sala
            </button>
          </div>
        </>
      )}
    </div>
  );
}
