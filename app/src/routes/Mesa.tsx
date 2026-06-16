import { useCallback, useEffect, useRef, useState } from 'react';
import { Ic } from '../icones/Icones';
import { Sheet } from '../components/Sheet';
import { nuvemConfigurada } from '../lib/supabase';
import {
  alternarTchin,
  assinarMesa,
  carregarFeed,
  definirPrivacidade,
  garantirMesa,
  postarProvei,
} from '../lib/mesa';
import type { FeedMesa, PostMesa } from '../lib/mesa';

import './mesa.css';

const CHIPS = ['Frutado', 'Seco', 'Encorpado', 'Leve', 'Ácido', 'Macio', 'Tânico', 'Adocicado'];
const DIMS: Array<{ k: string; nome: string }> = [
  { k: 'acidez', nome: 'Acidez' },
  { k: 'tanino', nome: 'Tanino' },
  { k: 'corpo', nome: 'Corpo' },
  { k: 'frutado', nome: 'Frutado' },
  { k: 'docura', nome: 'Doçura' },
];

function tempoRelativo(iso: string): string {
  const min = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.floor(h / 24)} d`;
}

export default function Mesa() {
  const [feed, setFeed] = useState<FeedMesa | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [indisponivel, setIndisponivel] = useState(false);
  const [compor, setCompor] = useState(false);
  const [convidando, setConvidando] = useState(false);
  const mesaId = useRef<string | null>(null);

  const recarregar = useCallback(async (id: string) => {
    const f = await carregarFeed(id);
    if (f) setFeed(f);
  }, []);

  useEffect(() => {
    let limpar = () => {};
    let vivo = true;
    void (async () => {
      if (!nuvemConfigurada()) {
        setIndisponivel(true);
        setCarregando(false);
        return;
      }
      const id = await garantirMesa();
      if (!vivo) return;
      if (!id) {
        setIndisponivel(true);
        setCarregando(false);
        return;
      }
      mesaId.current = id;
      await recarregar(id);
      if (!vivo) return;
      setCarregando(false);
      limpar = assinarMesa(id, () => void recarregar(id));
    })();
    return () => {
      vivo = false;
      limpar();
    };
  }, [recarregar]);

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

  const enviarProvei = async (chips: string[]) => {
    setCompor(false);
    if (mesaId.current) {
      await postarProvei(mesaId.current, chips);
      await recarregar(mesaId.current);
    }
  };

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
          <button
            type="button"
            className="mesa-convidar-btn tap"
            aria-label="Convidar para a mesa"
            onClick={() => setConvidando(true)}
          >
            <Ic nome="compartilhar" size={20} />
          </button>
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
      ) : (
        <section className="mesa-feed" aria-label="Feed da mesa">
          {feed && <LigaCard feed={feed} />}
          {feed?.posts.length === 0 && (
            <p className="mesa-vazio">Sua mesa está montada. Seja o primeiro a brindar.</p>
          )}
          {feed?.posts.map((p) => (
            <CartaPost key={p.id} post={p} onTchin={() => void tchin(p)} />
          ))}
        </section>
      )}

      {!indisponivel && !carregando && (
        <button type="button" className="mesa-provei btn btn-primary btn-jogo tap" onClick={() => setCompor(true)}>
          <Ic nome="taca" size={18} />
          Provei um vinho
        </button>
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

/* -------------------------------- Liga ------------------------------ */

function LigaCard({ feed }: { feed: FeedMesa }) {
  const minha = feed.ranking.find((r) => r.eu);
  const nomeDiv = feed.divisao.charAt(0).toUpperCase() + feed.divisao.slice(1);
  return (
    <section className="liga-card app-chrome" aria-label="Liga da semana">
      <div className="liga-topo">
        <span className={`liga-divisao liga-${feed.divisao}`}>{nomeDiv}</span>
        <span className="liga-pos">
          {minha ? `Você em ${minha.posicao}º de ${feed.ranking.length}` : `${feed.ranking.length} na mesa`}
        </span>
      </div>
      <ol className="liga-lista">
        {feed.ranking.slice(0, 5).map((r) => (
          <li key={r.userId} className={r.eu ? 'liga-linha liga-eu' : 'liga-linha'}>
            <span className="liga-rank">{r.posicao}</span>
            <span className="liga-nome">{r.eu ? 'Você' : 'Alguém da mesa'}</span>
            <span className="liga-pts">{r.pontos} XP</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ------------------------------ Cartas ------------------------------ */

function CartaPost({ post, onTchin }: { post: PostMesa; onTchin: () => void }) {
  const autor = post.userId === null ? 'Degustação da Semana' : post.meu ? 'Você' : 'Alguém da mesa';

  return (
    <article className={`mesa-card mesa-card-${post.tipo} app-chrome`}>
      <div className="mesa-card-topo">
        <span className="mesa-autor">{autor}</span>
        <span className="mesa-tempo">{tempoRelativo(post.criadoEm)}</span>
      </div>

      {post.tipo === 'degustacao_palpite' && <CorpoDegustacao payload={post.payload} />}
      {post.tipo === 'conquista' && (
        <p className="mesa-conquista">
          <Ic nome="bandeira-meta" size={18} /> {String(post.payload.texto ?? 'Conquista nova')}
        </p>
      )}
      {post.tipo === 'desafio_resultado' && (
        <p className="mesa-grade">
          <span className="mesa-grade-mono">{String(post.payload.grade ?? '')}</span>
          <span className="mesa-grade-num">{String(post.payload.acertos ?? '')} no Desafio de hoje</span>
        </p>
      )}
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

function CorpoProvei({ payload }: { payload: Record<string, unknown> }) {
  const chips = Array.isArray(payload.chips) ? (payload.chips as string[]) : [];
  return (
    <div className="mesa-provei-corpo">
      <p className="mesa-provei-titulo">Provei um vinho hoje</p>
      <div className="mesa-chips">
        {chips.map((c) => (
          <span className="mesa-chip" key={c}>
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

/* --------------------------- Compositor ----------------------------- */

function ComporProvei({
  onFechar,
  onEnviar,
}: {
  onFechar: () => void;
  onEnviar: (chips: string[]) => void;
}) {
  const [sel, setSel] = useState<string[]>([]);
  const alternar = (c: string) =>
    setSel((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]));

  return (
    <Sheet titulo="Provei um vinho" onFechar={onFechar}>
      <p className="folha-texto">Marque o que você sentiu. Sem nota, sem cerimônia.</p>
      <div className="mesa-chips mesa-chips-escolha">
        {CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            className={`mesa-chip mesa-chip-btn tap${sel.includes(c) ? ' mesa-chip-on' : ''}`}
            aria-pressed={sel.includes(c)}
            onClick={() => alternar(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="btn btn-primary btn-jogo btn-cheio tap"
        disabled={sel.length === 0}
        onClick={() => onEnviar(sel)}
      >
        Compartilhar na mesa
      </button>
    </Sheet>
  );
}
