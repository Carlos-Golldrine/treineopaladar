import { useCallback, useEffect, useRef, useState } from 'react';
import { Ic } from '../icones/Icones';
import { Sheet } from '../components/Sheet';
import { Avatar } from '../components/Avatar';
import { ContaSheet } from '../components/ContaSheet';
import { nuvemConfigurada } from '../lib/supabase';
import { useConta } from '../lib/conta';
import { track } from '../lib/analytics';
import {
  alternarTchin,
  assinarMesa,
  carregarFeed,
  definirPrivacidade,
  entrarNaMesa,
  expulsarMembro,
  garantirMesa,
  listarMesasPublicas,
  minhaMesaAtual,
  passarLideranca,
  postarProvei,
  sairDaMesa,
} from '../lib/mesa';
import type { FeedMesa, MesaPublica, PostMesa, RankItem } from '../lib/mesa';

import './mesa.css';

const CHIPS = ['Frutado', 'Seco', 'Encorpado', 'Leve', 'Ácido', 'Macio', 'Tânico', 'Adocicado'];
const DIMS: Array<{ k: string; nome: string }> = [
  { k: 'acidez', nome: 'Acidez' },
  { k: 'tanino', nome: 'Tanino' },
  { k: 'corpo', nome: 'Corpo' },
  { k: 'frutado', nome: 'Frutado' },
  { k: 'docura', nome: 'Doçura' },
];

/* Flag local: depois de sair, NAO auto-entra de novo (senao a mesa "puxa" a
   pessoa de volta na proxima abertura). Volta a 'on' quando ela entra numa mesa. */
const LS_AUTO = 'tp.mesa.auto';
function autoEntrar(): boolean {
  try {
    return localStorage.getItem(LS_AUTO) !== '0';
  } catch {
    return true;
  }
}
function marcarAuto(ligado: boolean): void {
  try {
    localStorage.setItem(LS_AUTO, ligado ? '1' : '0');
  } catch {
    /* modo privado pode bloquear o storage: tudo bem, cai no padrao */
  }
}

function tempoRelativo(iso: string): string {
  const min = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.floor(h / 24)} d`;
}

export default function Mesa() {
  const { anonimo, carregando: contaCarregando } = useConta();
  const [feed, setFeed] = useState<FeedMesa | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [indisponivel, setIndisponivel] = useState(false);
  const [semConta, setSemConta] = useState(false);
  const [semMesa, setSemMesa] = useState(false);
  const [compor, setCompor] = useState(false);
  const [convidando, setConvidando] = useState(false);
  const [membrosAberto, setMembrosAberto] = useState(false);
  const [mesasAberto, setMesasAberto] = useState(false);
  const [contaAberta, setContaAberta] = useState(false);
  const mesaId = useRef<string | null>(null);
  const limparRef = useRef<() => void>(() => {});

  /* Recarrega o feed. Como o ranking so e visivel para membros, se eu nao
     apareco nele confirmo com o servidor: se nao sou mais membro desta mesa
     (sai noutra aba ou fui expulso), caio no estado "sem mesa". Confirmar
     evita falso-positivo de um erro de rede transitorio (ranking vazio). */
  const recarregar = useCallback(async (id: string) => {
    const f = await carregarFeed(id);
    if (!f) return;
    if (f.ranking.some((r) => r.eu)) {
      setFeed(f);
      return;
    }
    const atual = await minhaMesaAtual();
    if (atual === id) {
      setFeed(f);
      return;
    }
    limparRef.current();
    limparRef.current = () => {};
    mesaId.current = null;
    setFeed(null);
    setMembrosAberto(false);
    setSemMesa(true);
  }, []);

  /* Liga numa mesa: solta a assinatura anterior, carrega e reassina. */
  const montar = useCallback(
    async (id: string) => {
      limparRef.current();
      mesaId.current = id;
      setSemMesa(false);
      await recarregar(id);
      limparRef.current = assinarMesa(id, () => void recarregar(id));
    },
    [recarregar],
  );

  useEffect(() => {
    if (contaCarregando) return; // espera saber se e anonimo antes de decidir
    let vivo = true;
    setCarregando(true);
    void (async () => {
      if (!nuvemConfigurada()) {
        setIndisponivel(true);
        setCarregando(false);
        return;
      }
      /* A Mesa e so para contas reais: anonimo ve o convite a criar conta. */
      if (anonimo) {
        setSemConta(true);
        setCarregando(false);
        return;
      }
      setSemConta(false);
      let id = await minhaMesaAtual();
      if (!vivo) return;
      if (!id && autoEntrar()) {
        id = await garantirMesa();
        if (id) marcarAuto(true);
      }
      if (!vivo) return;
      if (!id) {
        /* Sem mesa e sem auto-entrar (sai antes): mostra o "encontrar mesas". */
        setSemMesa(true);
        setCarregando(false);
        return;
      }
      await montar(id);
      if (!vivo) return;
      setCarregando(false);
      track('mesa_aberta', { mesa_id: id });
    })();
    return () => {
      vivo = false;
      limparRef.current();
    };
  }, [montar, anonimo, contaCarregando]);

  const tchin = async (p: PostMesa) => {
    setFeed((f) =>
      f
        ? {
            ...f,
            posts: f.posts.map((x) =>
              x.id === p.id
                ? { ...x, meuTchin: !x.meuTchin, tchins: x.tchins + (x.meuTchin ? -1 : 1) }
                : x,
            ),
          }
        : f,
    );
    await alternarTchin(p.id, !p.meuTchin);
  };

  const enviarProvei = async (chips: string[], texto: string) => {
    setCompor(false);
    /* Posta SO na mesa atual (mesaId.current), nunca em varias. */
    if (mesaId.current) {
      await postarProvei(mesaId.current, chips, texto);
      await recarregar(mesaId.current);
    }
  };

  /* Entrar numa mesa publica escolhida na lista. */
  const entrarEm = async (id: string) => {
    setMesasAberto(false);
    setCarregando(true);
    const novo = await entrarNaMesa(id);
    if (novo) {
      marcarAuto(true);
      await montar(novo);
      track('mesa_entrou', { mesa_id: novo, origem: 'lista' });
    }
    setCarregando(false);
  };

  /* Entrar numa mesa do meu ritmo (auto-pareamento). */
  const entrarAuto = async () => {
    setCarregando(true);
    const id = await garantirMesa();
    if (id) {
      marcarAuto(true);
      await montar(id);
      track('mesa_entrou', { mesa_id: id, origem: 'auto' });
    }
    setCarregando(false);
  };

  /* Sair da mesa atual. Nao auto-entra de novo ate a pessoa escolher. */
  const sair = async () => {
    const id = mesaId.current;
    if (!id) return;
    setMembrosAberto(false);
    await sairDaMesa(id);
    marcarAuto(false);
    limparRef.current();
    limparRef.current = () => {};
    mesaId.current = null;
    setFeed(null);
    setSemMesa(true);
    track('mesa_saiu', { mesa_id: id });
    setMesasAberto(true);
  };

  const expulsar = async (alvo: string) => {
    const id = mesaId.current;
    if (!id) return;
    await expulsarMembro(id, alvo);
    await recarregar(id);
    track('mesa_expulsou', { mesa_id: id });
  };

  const passar = async (novo: string) => {
    const id = mesaId.current;
    if (!id) return;
    await passarLideranca(id, novo);
    await recarregar(id);
    track('mesa_lideranca_passada', { mesa_id: id });
  };

  const meuRank = feed?.ranking.find((r) => r.eu) ?? null;
  const souAnfitriao = !!(meuRank && feed?.anfitriao && meuRank.userId === feed.anfitriao);

  return (
    <>
      <header className="screen-header app-chrome mesa-header">
        <div className="mesa-header-textos">
          <h1 className="screen-title">
            Mesa
            {feed?.privada && (
              <span className="mesa-privada-selo" aria-label="Mesa privada">
                <Ic nome="cadeado" size={13} />
              </span>
            )}
          </h1>
          <p className="screen-sub">
            {feed
              ? `${feed.membros} ${feed.membros === 1 ? 'pessoa' : 'pessoas'} nesta semana`
              : 'Degustação em boa companhia'}
          </p>
        </div>
        {feed && (
          <div className="mesa-header-acoes">
            <button
              type="button"
              className="mesa-convidar-btn tap"
              aria-label="Encontrar outras mesas"
              onClick={() => setMesasAberto(true)}
            >
              <Ic nome="mesa" size={20} />
            </button>
            <button
              type="button"
              className="mesa-convidar-btn tap"
              aria-label="Convidar para a mesa"
              onClick={() => setConvidando(true)}
            >
              <Ic nome="compartilhar" size={20} />
            </button>
          </div>
        )}
      </header>

      {indisponivel ? (
        <section className="mesa-empty" aria-label="Mesa indisponível">
          <div className="mesa-art">
            <Ic nome="mesa" size={44} />
          </div>
          <h2 className="mesa-title">A mesa está fechada agora</h2>
          <p className="mesa-copy">Volte com conexão para sentar com quem treina no seu ritmo.</p>
        </section>
      ) : carregando ? (
        <section className="mesa-carregando" aria-label="Montando a mesa">
          <div className="mesa-skel" />
          <div className="mesa-skel" />
        </section>
      ) : semConta ? (
        <section className="mesa-empty" aria-label="Conta necessária">
          <div className="mesa-art">
            <Ic nome="mesa" size={44} />
          </div>
          <h2 className="mesa-title">A Mesa é para quem tem conta</h2>
          <p className="mesa-copy">
            Crie sua conta (ou entre) para sentar com a galera, aparecer no ranking e brindar. É
            rápido, e seu progresso fica salvo no mesmo lugar.
          </p>
          <button
            type="button"
            className="btn btn-primary btn-jogo tap mesa-empty-btn"
            onClick={() => setContaAberta(true)}
          >
            <Ic nome="taca" size={18} />
            Criar conta ou entrar
          </button>
        </section>
      ) : semMesa ? (
        <section className="mesa-empty" aria-label="Sem mesa">
          <div className="mesa-art">
            <Ic nome="mesa" size={44} />
          </div>
          <h2 className="mesa-title">Você não está em nenhuma mesa</h2>
          <p className="mesa-copy">Escolha uma mesa para sentar ou entre numa do seu ritmo.</p>
          <button
            type="button"
            className="btn btn-primary btn-jogo tap mesa-empty-btn"
            onClick={() => setMesasAberto(true)}
          >
            <Ic nome="mesa" size={18} />
            Encontrar mesas
          </button>
          <button type="button" className="btn btn-outline tap mesa-empty-btn" onClick={() => void entrarAuto()}>
            Entrar numa do meu ritmo
          </button>
        </section>
      ) : (
        <section className="mesa-feed" aria-label="Feed da mesa">
          {feed && <LigaCard feed={feed} onAbrirMembros={() => setMembrosAberto(true)} />}
          {feed?.posts.length === 0 && (
            <p className="mesa-vazio">Sua mesa está montada. Seja o primeiro a brindar.</p>
          )}
          {feed?.posts.map((p) => (
            <CartaPost key={p.id} post={p} onTchin={() => void tchin(p)} />
          ))}
        </section>
      )}

      {!indisponivel && !carregando && !semMesa && !semConta && (
        <button type="button" className="mesa-provei btn btn-primary btn-jogo tap" onClick={() => setCompor(true)}>
          <Ic nome="taca" size={18} />
          Provei um vinho
        </button>
      )}

      {contaAberta && (
        <ContaSheet onFechar={() => setContaAberta(false)} onSucesso={() => setContaAberta(false)} />
      )}

      {compor && <ComporProvei onFechar={() => setCompor(false)} onEnviar={enviarProvei} />}

      {convidando && feed && (
        <ConvidarSheet
          feed={feed}
          onFechar={() => {
            setConvidando(false);
            if (mesaId.current) void recarregar(mesaId.current);
          }}
        />
      )}

      {membrosAberto && feed && (
        <MembrosSheet
          feed={feed}
          souAnfitriao={souAnfitriao}
          onExpulsar={(id) => void expulsar(id)}
          onPassar={(id) => void passar(id)}
          onSair={() => void sair()}
          onFechar={() => setMembrosAberto(false)}
        />
      )}

      {mesasAberto && (
        <MesasSheet
          mesaAtual={mesaId.current}
          onEntrar={(id) => void entrarEm(id)}
          onFechar={() => setMesasAberto(false)}
        />
      )}
    </>
  );
}

/* ------------------------- Convite + privacidade -------------------- */

function ConvidarSheet({ feed, onFechar }: { feed: FeedMesa; onFechar: () => void }) {
  const [privada, setPrivada] = useState(feed.privada);
  const [copiado, setCopiado] = useState(false);
  const link = `${window.location.origin}/mesa/entrar/${feed.codigoConvite}`;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 1800);
    } catch {
      /* alguns navegadores bloqueiam o clipboard: o campo continua selecionavel */
    }
  };

  const alternarPrivada = async () => {
    const novo = !privada;
    setPrivada(novo);
    const r = await definirPrivacidade(feed.mesaId, novo);
    if (r === null) setPrivada(!novo);
  };

  return (
    <Sheet titulo="Convidar para a mesa" onFechar={onFechar}>
      <p className="folha-texto">Mande o link para quem você quer na sua mesa desta semana.</p>
      <div className="mesa-convite-link">
        <input
          className="mesa-convite-input"
          readOnly
          value={link}
          aria-label="Link de convite"
          onFocus={(e) => e.currentTarget.select()}
        />
        <button type="button" className="btn btn-primary btn-jogo tap mesa-convite-copiar" onClick={copiar}>
          <Ic nome="compartilhar" size={16} />
          {copiado ? 'Copiado' : 'Copiar'}
        </button>
      </div>

      <button
        type="button"
        className="mesa-privada-toggle tap"
        role="switch"
        aria-checked={privada}
        onClick={alternarPrivada}
      >
        <span className="mesa-privada-info">
          <span className="mesa-privada-titulo">
            <Ic nome="cadeado" size={16} /> Mesa privada
          </span>
          <span className="mesa-privada-sub">
            {privada
              ? 'Só entra quem tem o link. Ninguém novo é adicionado sozinho.'
              : 'Aberta: pessoas no seu ritmo entram automaticamente.'}
          </span>
        </span>
        <span className={`mesa-switch${privada ? ' mesa-switch-on' : ''}`} aria-hidden="true">
          <span className="mesa-switch-bola" />
        </span>
      </button>
    </Sheet>
  );
}

/* ----------------------------- Membros ------------------------------ */

function MembrosSheet({
  feed,
  souAnfitriao,
  onExpulsar,
  onPassar,
  onSair,
  onFechar,
}: {
  feed: FeedMesa;
  souAnfitriao: boolean;
  onExpulsar: (userId: string) => void;
  onPassar: (userId: string) => void;
  onSair: () => void;
  onFechar: () => void;
}) {
  /* Confirmacao em dois toques (sem confirm() do navegador). */
  const [expulsarId, setExpulsarId] = useState<string | null>(null);
  const [passarId, setPassarId] = useState<string | null>(null);
  const [confirmandoSair, setConfirmandoSair] = useState(false);

  return (
    <Sheet titulo="Membros da mesa" onFechar={onFechar}>
      <p className="folha-texto">
        {souAnfitriao
          ? 'Você é o anfitrião. Pode passar a coroa ou remover quem não combina com a mesa.'
          : 'Quem está sentado na mesa desta semana.'}
      </p>
      <ul className="mesa-membros">
        {feed.ranking.map((r) => {
          const ehAnfitriao = r.userId === feed.anfitriao;
          const mostrarAcoes = souAnfitriao && !r.eu;
          return (
            <li key={r.userId} className="mesa-membro">
              <Avatar id={r.avatar} nome={r.nome} size={36} className="mesa-membro-avatar" />
              <span className="mesa-membro-nome">
                {r.eu ? 'Você' : r.nome ?? 'Alguém da mesa'}
                {ehAnfitriao && (
                  <span className="mesa-anfitriao-selo">
                    <Ic nome="coroa" size={14} /> Anfitrião
                  </span>
                )}
              </span>
              {mostrarAcoes && (
                <span className="mesa-membro-acoes">
                  {passarId === r.userId ? (
                    <button
                      type="button"
                      className="mesa-membro-btn mesa-membro-btn-ouro tap"
                      onClick={() => {
                        onPassar(r.userId);
                        setPassarId(null);
                      }}
                    >
                      Confirmar coroa
                    </button>
                  ) : expulsarId === r.userId ? (
                    <button
                      type="button"
                      className="mesa-membro-btn mesa-membro-btn-perigo tap"
                      onClick={() => {
                        onExpulsar(r.userId);
                        setExpulsarId(null);
                      }}
                    >
                      Confirmar
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="mesa-membro-btn tap"
                        aria-label={`Passar a liderança para ${r.nome ?? 'este membro'}`}
                        onClick={() => {
                          setPassarId(r.userId);
                          setExpulsarId(null);
                        }}
                      >
                        <Ic nome="coroa" size={16} />
                      </button>
                      <button
                        type="button"
                        className="mesa-membro-btn tap"
                        aria-label={`Remover ${r.nome ?? 'este membro'} da mesa`}
                        onClick={() => {
                          setExpulsarId(r.userId);
                          setPassarId(null);
                        }}
                      >
                        <Ic nome="x-fechar" size={16} />
                      </button>
                    </>
                  )}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {confirmandoSair ? (
        <button type="button" className="btn mesa-sair-btn mesa-sair-confirma tap" onClick={onSair}>
          Confirmar saída da mesa
        </button>
      ) : (
        <button type="button" className="btn mesa-sair-btn tap" onClick={() => setConfirmandoSair(true)}>
          <Ic nome="seta-voltar" size={16} />
          Sair desta mesa
        </button>
      )}
    </Sheet>
  );
}

/* ------------------------- Encontrar mesas -------------------------- */

function MesasSheet({
  mesaAtual,
  onEntrar,
  onFechar,
}: {
  mesaAtual: string | null;
  onEntrar: (id: string) => void;
  onFechar: () => void;
}) {
  const [mesas, setMesas] = useState<MesaPublica[] | null>(null);

  useEffect(() => {
    let vivo = true;
    void listarMesasPublicas().then((lista) => {
      if (vivo) setMesas(lista);
    });
    return () => {
      vivo = false;
    };
  }, []);

  return (
    <Sheet titulo="Encontrar mesas" onFechar={onFechar}>
      <p className="folha-texto">Mesas abertas desta semana. Entrar numa sai da sua atual.</p>
      {mesas === null ? (
        <div className="mesa-carregando mesa-carregando-folha">
          <div className="mesa-skel" />
          <div className="mesa-skel" />
        </div>
      ) : mesas.length === 0 ? (
        <p className="mesa-vazio">Nenhuma mesa aberta agora. Que tal abrir a sua?</p>
      ) : (
        <ul className="mesa-lista-publica">
          {mesas.map((m) => {
            const atual = m.id === mesaAtual;
            return (
              <li key={m.id} className="mesa-publica">
                <span className="mesa-publica-art" aria-hidden="true">
                  <Ic nome="mesa" size={22} />
                </span>
                <span className="mesa-publica-info">
                  <span className="mesa-publica-nome">
                    Mesa de {m.anfitriaoNome ?? 'alguém da liga'}
                  </span>
                  <span className="mesa-publica-sub">
                    {m.membros} {m.membros === 1 ? 'pessoa' : 'pessoas'}
                  </span>
                </span>
                {atual ? (
                  <span className="mesa-publica-aqui">
                    <Ic nome="check" size={14} /> Você aqui
                  </span>
                ) : (
                  <button
                    type="button"
                    className="btn btn-outline mesa-publica-btn tap"
                    onClick={() => onEntrar(m.id)}
                  >
                    Entrar
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Sheet>
  );
}

/* -------------------------------- Liga ------------------------------ */

function LigaCard({ feed, onAbrirMembros }: { feed: FeedMesa; onAbrirMembros: () => void }) {
  const minha = feed.ranking.find((r) => r.eu);
  const nomeDiv = feed.divisao.charAt(0).toUpperCase() + feed.divisao.slice(1);
  const linha = (r: RankItem) => (
    <li key={r.userId} className={r.eu ? 'liga-linha liga-eu' : 'liga-linha'}>
      <span className="liga-rank">{r.posicao}</span>
      <Avatar id={r.avatar} nome={r.nome} size={26} className="liga-avatar" />
      <span className="liga-nome">
        {r.eu ? 'Você' : r.nome ?? 'Alguém da mesa'}
        {r.userId === feed.anfitriao && (
          <Ic nome="coroa" size={14} className="liga-coroa" label="Anfitrião" />
        )}
      </span>
      <span className="liga-pts">{r.pontos} XP</span>
    </li>
  );
  return (
    <section className="liga-card app-chrome" aria-label="Liga da semana">
      <div className="liga-topo">
        <span className={`liga-divisao liga-${feed.divisao}`}>{nomeDiv}</span>
        <span className="liga-pos">
          {minha ? `Você em ${minha.posicao}º de ${feed.ranking.length}` : `${feed.ranking.length} na mesa`}
        </span>
      </div>
      <ol className="liga-lista">{feed.ranking.slice(0, 5).map(linha)}</ol>
      <button type="button" className="liga-membros-btn tap" onClick={onAbrirMembros}>
        Ver membros e gerenciar
        <Ic nome="seta-direita" size={16} />
      </button>
    </section>
  );
}

/* ------------------------------ Cartas ------------------------------ */

function CartaPost({ post, onTchin }: { post: PostMesa; onTchin: () => void }) {
  const ehSistema = post.userId === null;
  const autor = ehSistema
    ? 'Degustação da Semana'
    : post.meu
      ? 'Você'
      : post.nomeAutor ?? 'Alguém da mesa';

  return (
    <article className={`mesa-card mesa-card-${post.tipo} app-chrome`}>
      <div className="mesa-card-topo">
        <span className="mesa-autor-grupo">
          {!ehSistema && (
            <Avatar id={post.avatarAutor} nome={post.nomeAutor} size={28} className="mesa-avatar" />
          )}
          <span className="mesa-autor">{autor}</span>
        </span>
        <span className="mesa-tempo">{tempoRelativo(post.criadoEm)}</span>
      </div>

      {post.tipo === 'degustacao_palpite' && <CorpoDegustacao payload={post.payload} />}
      {post.tipo === 'conquista' && (
        <p className="mesa-conquista">
          <Ic nome="bandeira-meta" size={18} /> {String(post.payload.texto ?? 'Conquista nova')}
        </p>
      )}
      {post.tipo === 'desafio_resultado' && <CorpoDesafio payload={post.payload} />}
      {post.tipo === 'provei' && <CorpoProvei payload={post.payload} />}

      <button
        type="button"
        className={`mesa-tchin tap${post.meuTchin ? ' mesa-tchin-on' : ''}`}
        aria-pressed={post.meuTchin}
        onClick={onTchin}
      >
        <Ic nome="taca" size={16} />
        Tchin!{post.tchins > 0 ? ` ${post.tchins}` : ''}
      </button>
    </article>
  );
}

function CorpoDegustacao({ payload }: { payload: Record<string, unknown> }) {
  const perfil = (payload.perfil as Record<string, number>) ?? {};
  const thumb = payload.thumbnail_url as string | null;
  return (
    <div className="mesa-degustacao">
      {thumb && <img className="mesa-degustacao-foto" src={thumb} alt="" loading="lazy" />}
      <div className="mesa-degustacao-info">
        <p className="mesa-eyebrow">Degustação da Semana</p>
        <p className="mesa-vinho-nome">{String(payload.nome ?? 'Vinho da semana')}</p>
        {payload.produtor ? <p className="mesa-vinho-prod">{String(payload.produtor)}</p> : null}
        <div className="mesa-perfil" role="img" aria-label="Perfil sensorial">
          {DIMS.map((d) => (
            <div className="mesa-perfil-linha" key={d.k}>
              <span className="mesa-perfil-nome">{d.nome}</span>
              <span className="mesa-perfil-pontos" aria-hidden="true">
                {'●'.repeat(Number(perfil[d.k] ?? 0))}
                {'○'.repeat(Math.max(0, 5 - Number(perfil[d.k] ?? 0)))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CorpoDesafio({ payload }: { payload: Record<string, unknown> }) {
  const grade = typeof payload.grade === 'string' ? payload.grade : '';
  const total = grade.length || 4;
  const acertos = Number(payload.acertos ?? grade.split('').filter((c) => c === '■').length);
  return (
    <div className="mesa-desafio">
      <p className="mesa-desafio-eyebrow">Desafio do Dia</p>
      <div className="mesa-desafio-grade" aria-label={`${acertos} de ${total} no desafio`}>
        {grade.split('').map((c, i) => {
          const certo = c === '■';
          return (
            <span
              key={i}
              className={`mesa-desafio-quadro${certo ? ' mesa-q-certo' : ' mesa-q-errado'}`}
              aria-hidden="true"
            >
              <Ic nome={certo ? 'check' : 'x-fechar'} size={16} />
            </span>
          );
        })}
      </div>
      <p className="mesa-desafio-num">
        {acertos} de {total} certas
      </p>
    </div>
  );
}

function CorpoProvei({ payload }: { payload: Record<string, unknown> }) {
  const chips = Array.isArray(payload.chips) ? (payload.chips as string[]) : [];
  const texto = typeof payload.texto === 'string' ? payload.texto : '';
  return (
    <div className="mesa-provei-corpo">
      <div className="mesa-provei-cabeca">
        <span className="mesa-provei-selo" aria-hidden="true">
          <Ic nome="taca" size={16} />
        </span>
        <span className="mesa-provei-titulo">Provei um vinho hoje</span>
      </div>
      {texto && <p className="mesa-provei-texto">{texto}</p>}
      {chips.length > 0 && (
        <div className="mesa-chips mesa-chips-nota">
          {chips.map((c) => (
            <span className="mesa-chip mesa-chip-nota" key={c}>
              {c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* --------------------------- Compositor ----------------------------- */

function ComporProvei({
  onFechar,
  onEnviar,
}: {
  onFechar: () => void;
  onEnviar: (chips: string[], texto: string) => void;
}) {
  const [sel, setSel] = useState<string[]>([]);
  const [texto, setTexto] = useState('');
  const alternar = (c: string) =>
    setSel((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]));
  const vazio = sel.length === 0 && texto.trim() === '';

  return (
    <Sheet titulo="Provei um vinho" onFechar={onFechar}>
      <div className="provei-cabeca">
        <span className="provei-selo" aria-hidden="true">
          <Ic nome="taca" size={22} />
        </span>
        <p className="folha-texto provei-intro">Marque o que você sentiu. Sem nota, sem cerimônia.</p>
      </div>
      <div className="provei-grade">
        {CHIPS.map((c) => {
          const on = sel.includes(c);
          return (
            <button
              key={c}
              type="button"
              className={`provei-token tap${on ? ' provei-token-on' : ''}`}
              aria-pressed={on}
              onClick={() => alternar(c)}
            >
              {on && <Ic nome="check" size={15} />}
              {c}
            </button>
          );
        })}
      </div>
      <textarea
        className="provei-texto-campo"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Quer dizer algo do vinho? (opcional)"
        maxLength={280}
        rows={2}
        aria-label="Escreva algo sobre o vinho (opcional)"
      />
      <button
        type="button"
        className="btn btn-primary btn-jogo btn-cheio tap provei-enviar"
        disabled={vazio}
        onClick={() => onEnviar(sel, texto.trim())}
      >
        <Ic nome="taca" size={18} />
        {vazio
          ? 'Marque ou escreva algo'
          : sel.length > 1
            ? `Compartilhar na mesa · ${sel.length}`
            : 'Compartilhar na mesa'}
      </button>
    </Sheet>
  );
}
