import { useEffect, useState } from 'react';
import { Ic } from '../icones/Icones';
import { RodapeTchin } from '../components/RodapeTchin';
import { definirSom, somLigado } from '../som/som';
import { OBJETIVOS, obterStore, useProgresso, useWallet } from '../engine';
import type { Habilidade, Objetivo } from '../engine';
import { ICONE_OBJETIVO, ROTULO_OBJETIVO } from '../trilha/objetivo';
import { Sheet } from '../components/Sheet';
import { ContaSheet } from '../components/ContaSheet';
import { Avatar, AVATARES, AVATAR_IDS } from '../components/Avatar';
import { useConta, sairDaConta } from '../lib/conta';
import {
  aceitarLembretes,
  desativarLembretes,
  limparAdiamentoPrimer,
  permissaoAtual,
  pushAtivado,
  suportaPush,
  temInscricaoAtiva,
} from '../notificacoes/push';
import type { EstadoPermissao } from '../notificacoes/push';
import { ehIos, estaInstalado } from '../lib/pwa';
import { IconeCompartilhar, IconeAdicionar } from '../components/ConvitePwa';

import './perfil.css';

const DIMENSOES: Array<{ nome: string; chave: Habilidade }> = [
  { nome: 'Acidez', chave: 'acidez' },
  { nome: 'Tanino', chave: 'tanino' },
  { nome: 'Corpo', chave: 'corpo' },
  { nome: 'Frutado', chave: 'frutado' },
  { nome: 'Doçura', chave: 'docura' },
];

function desdeQuando(criadoEm: number): string {
  const dias = Math.max(0, Math.floor((Date.now() - criadoEm) / 86_400_000));
  if (dias === 0) return 'Treinando desde hoje';
  if (dias === 1) return 'Treinando desde ontem';
  return `Treinando há ${dias} dias`;
}

export default function Perfil() {
  const [som, setSom] = useState(somLigado);
  const [trocandoObjetivo, setTrocandoObjetivo] = useState(false);
  const { wallet, streakEfetivo } = useWallet();
  const { scorePaladar, objetivo, nome, avatar } = useProgresso();
  const conta = useConta();
  const [criandoConta, setCriandoConta] = useState(false);
  const [editando, setEditando] = useState(false);
  const [nomeRascunho, setNomeRascunho] = useState('');
  const [avatarRascunho, setAvatarRascunho] = useState<string | null>(null);

  const abrirEdicao = () => {
    setNomeRascunho(nome ?? '');
    setAvatarRascunho(avatar);
    setEditando(true);
  };
  const salvarPerfil = () => {
    obterStore().definirNome(nomeRascunho);
    if (avatarRascunho) obterStore().definirAvatar(avatarRascunho);
    setEditando(false);
  };

  const alternarSom = () => {
    const novo = !som;
    setSom(novo);
    definirSom(novo);
  };

  const trocarObjetivo = (novo: Objetivo) => {
    obterStore().definirObjetivo(novo);
    setTrocandoObjetivo(false);
  };

  const algumScore = DIMENSOES.some(({ chave }) => Math.round(scorePaladar[chave]) > 0);

  return (
    <>
      <header className="profile-head app-chrome">
        <button
          type="button"
          className="profile-avatar-btn tap"
          onClick={abrirEdicao}
          aria-label="Editar nome e avatar"
        >
          <span className="profile-avatar-anel">
            <Avatar id={avatar} nome={nome} size={88} />
          </span>
          <span className="profile-avatar-lapis" aria-hidden="true">
            <Ic nome="lapis" size={16} />
          </span>
        </button>
        <h1 className="profile-name">
          {nome ?? (conta.anonimo || !conta.email ? 'Visitante' : 'Sua conta')}
        </h1>
        <p className="profile-sub">{conta.email ?? desdeQuando(wallet.criadoEm)}</p>
        <button type="button" className="profile-editar tap" onClick={abrirEdicao}>
          {nome ? 'Editar perfil' : 'Escolher nome e avatar'}
        </button>
        <div className="profile-stats">
          <div
            className="stat-chip"
            aria-label={`Sequência de ${streakEfetivo} ${streakEfetivo === 1 ? 'dia' : 'dias'}`}
          >
            <Ic
              nome={streakEfetivo === 0 ? 'chama-apagada' : 'chama-streak'}
              size={16}
              className="stat-fire"
            />
            <span className="stat-value">{streakEfetivo}</span>
          </div>
          <div className="stat-chip" aria-label={`${wallet.cristais} cristais`}>
            <Ic nome="cristal" size={16} className="stat-gem" />
            <span className="stat-value">{wallet.cristais}</span>
          </div>
          <div className="stat-chip" aria-label={`${wallet.xpTotal} pontos de experiência`}>
            <span className="stat-value">{wallet.xpTotal} XP</span>
          </div>
        </div>
      </header>

      <section className="score-card" aria-label="Score de Paladar">
        <h2 className="score-title">Score de Paladar</h2>
        <p className="score-sub">
          Cinco dimensões, de 0 a 1000. Cada acerto treina uma delas.
        </p>
        <div className="score-rows">
          {DIMENSOES.map(({ nome, chave }) => {
            const valor = Math.round(scorePaladar[chave]);
            return (
              <div className="score-row" key={chave}>
                <span className="score-name">{nome}</span>
                <div
                  className="score-bar"
                  role="progressbar"
                  aria-valuenow={valor}
                  aria-valuemin={0}
                  aria-valuemax={1000}
                  aria-label={`${nome}: ${valor} de 1000`}
                >
                  <div
                    className="score-bar-fill"
                    style={{ width: `${Math.min(100, (valor / 1000) * 100)}%` }}
                  />
                </div>
                <span className="score-value">{valor}</span>
              </div>
            );
          })}
        </div>
        <p className="score-note">
          {algumScore
            ? 'O score sobe com acerto e desce devagar com o tempo parado. Igual paladar.'
            : 'Seu score nasce nas primeiras lições. Continue treinando.'}
        </p>
      </section>

      <section className="ajustes" aria-label="Ajustes">
        <button
          type="button"
          className="ajuste-som tap app-chrome"
          aria-pressed={som}
          onClick={alternarSom}
        >
          <span className="ajuste-icone">
            <Ic nome={som ? 'som-on' : 'som-off'} size={22} />
          </span>
          <span className="ajuste-textos">
            <span className="ajuste-titulo">Sons do treino</span>
            <span className="ajuste-sub">
              {som ? 'Ligados, em volume de boa conversa' : 'Desligados por enquanto'}
            </span>
          </span>
          <span className={`ajuste-estado${som ? ' ajuste-estado-on' : ''}`}>
            {som ? 'on' : 'off'}
          </span>
        </button>

        <LembretesAjuste />

        <InstalarAjuste />

        {objetivo && (
          <button
            type="button"
            className="ajuste-som tap app-chrome"
            onClick={() => setTrocandoObjetivo(true)}
            aria-label={`Treinando para: ${ROTULO_OBJETIVO[objetivo]}. Tocar para trocar`}
          >
            <span className="ajuste-icone">
              <Ic nome={ICONE_OBJETIVO[objetivo]} size={22} />
            </span>
            <span className="ajuste-textos">
              <span className="ajuste-titulo">Treinando para: {ROTULO_OBJETIVO[objetivo]}</span>
              <span className="ajuste-sub">A ordem da trilha segue esse objetivo</span>
            </span>
            <span className="ajuste-estado">trocar</span>
          </button>
        )}
      </section>

      {trocandoObjetivo && (
        <Sheet titulo="Treinar para quê?" onFechar={() => setTrocandoObjetivo(false)}>
          <p className="folha-texto">
            A trilha reorganiza as unidades pelo seu objetivo. Nada se perde: só muda a ordem do
            caminho.
          </p>
          <div className="objetivo-lista" role="group" aria-label="Objetivos">
            {OBJETIVOS.map((o) => (
              <button
                key={o}
                type="button"
                className={`objetivo-opcao tap${o === objetivo ? ' objetivo-atual' : ''}`}
                aria-pressed={o === objetivo}
                onClick={() => trocarObjetivo(o)}
              >
                <Ic nome={ICONE_OBJETIVO[o]} size={20} />
                <span>{ROTULO_OBJETIVO[o]}</span>
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {editando && (
        <Sheet titulo="Editar perfil" onFechar={() => setEditando(false)}>
          <label className="campo-rotulo" htmlFor="perfil-nome">
            Como você quer ser chamado
          </label>
          <input
            id="perfil-nome"
            className="campo-texto"
            type="text"
            maxLength={30}
            value={nomeRascunho}
            onChange={(e) => setNomeRascunho(e.target.value)}
            placeholder="Seu nome ou apelido"
            autoComplete="off"
          />
          <p className="folha-texto">Esse nome aparece pra você e pra galera da sua Mesa.</p>
          <p className="campo-rotulo">Escolha um avatar</p>
          <div className="avatar-grade" role="group" aria-label="Avatares">
            {AVATAR_IDS.map((aid) => (
              <button
                key={aid}
                type="button"
                className={`avatar-opcao tap${aid === avatarRascunho ? ' avatar-opcao-sel' : ''}`}
                aria-pressed={aid === avatarRascunho}
                aria-label={AVATARES[aid].rotulo}
                onClick={() => setAvatarRascunho(aid)}
              >
                <Avatar id={aid} size={48} />
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-primary btn-cheio tap" onClick={salvarPerfil}>
            Salvar
          </button>
        </Sheet>
      )}

      {conta.anonimo || !conta.email ? (
        <section className="save-cta">
          <button type="button" className="btn btn-outline tap" onClick={() => setCriandoConta(true)}>
            Salvar meu progresso
          </button>
          <p className="save-note">
            Por enquanto, seu treino fica só neste aparelho. Criar conta leva menos de um minuto.
          </p>
        </section>
      ) : (
        <section className="save-cta">
          <p className="save-note">
            Progresso salvo na sua conta: {conta.email}. Você acessa de qualquer aparelho.
          </p>
          <button type="button" className="btn btn-outline tap" onClick={() => void sairDaConta()}>
            Sair
          </button>
        </section>
      )}

      {criandoConta && <ContaSheet onFechar={() => setCriandoConta(false)} />}

      <RodapeTchin />
    </>
  );
}

/* Controle de notificacoes nos Ajustes: liga os lembretes a qualquer momento,
   sem depender do primer (que so aparece 1x e com varias condicoes). Some quando
   o navegador nao suporta push (ex.: iPhone sem o app instalado na tela inicial). */
function LembretesAjuste() {
  const [perm, setPerm] = useState<EstadoPermissao>(() => permissaoAtual());
  const [ativo, setAtivo] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  /* Estado real = existe inscricao VIVA (nao so a permissao concedida): cobre o
     caso de permissao 'granted' mas inscricao expirada/limpa. */
  useEffect(() => {
    let vivo = true;
    void temInscricaoAtiva().then((a) => {
      if (vivo) setAtivo(a);
    });
    return () => {
      vivo = false;
    };
  }, []);

  if (!suportaPush()) return null;

  const disponivel = pushAtivado();
  const bloqueado = perm === 'denied';

  /* Toggle de verdade: liga (pede permissao + inscreve) ou DESLIGA (cancela a
     inscricao + remove do banco). Antes so ligava — desligar nao fazia nada. */
  const alternar = async () => {
    if (!disponivel || bloqueado || ocupado) return;
    setOcupado(true);
    try {
      if (ativo) {
        await desativarLembretes();
        limparAdiamentoPrimer(); // volta a oferecer o convite na home imediatamente
        setAtivo(false);
      } else {
        await aceitarLembretes();
        setPerm(permissaoAtual());
        setAtivo(await temInscricaoAtiva());
      }
    } finally {
      setOcupado(false);
    }
  };

  const sub = !disponivel
    ? 'Em breve'
    : bloqueado
      ? 'Bloqueado no navegador. Libere nas configurações do site.'
      : ativo
        ? 'Ligados, um toque no fim da tarde. Toque para desligar.'
        : 'Toque para ativar o lembrete da ofensiva';

  return (
    <button
      type="button"
      className="ajuste-som tap app-chrome"
      aria-pressed={ativo}
      disabled={!disponivel || bloqueado || ocupado}
      onClick={() => void alternar()}
    >
      <span className="ajuste-icone">
        <Ic nome="sino" size={22} />
      </span>
      <span className="ajuste-textos">
        <span className="ajuste-titulo">Lembretes do treino</span>
        <span className="ajuste-sub">{sub}</span>
      </span>
      <span className={`ajuste-estado${ativo ? ' ajuste-estado-on' : ''}`}>
        {ativo ? 'on' : bloqueado ? '—' : 'off'}
      </span>
    </button>
  );
}

/* Atalho de instalacao no iPhone: no iOS nao ha prompt automatico de instalar,
   entao mostramos um passo a passo aqui (e o ConvitePwa ja nudga sozinho). Some
   no Android (la o convite tem prompt nativo) e quando o app ja esta instalado. */
function InstalarAjuste() {
  const [aberto, setAberto] = useState(false);

  if (!ehIos() || estaInstalado()) return null;

  return (
    <>
      <button
        type="button"
        className="ajuste-som tap app-chrome"
        onClick={() => setAberto(true)}
        aria-label="Adicionar à tela inicial"
      >
        <span className="ajuste-icone">
          <IconeAdicionar />
        </span>
        <span className="ajuste-textos">
          <span className="ajuste-titulo">Adicionar à tela inicial</span>
          <span className="ajuste-sub">Abre como app e recebe lembretes no iPhone</span>
        </span>
        <span className="ajuste-estado">instalar</span>
      </button>

      {aberto && (
        <Sheet titulo="Adicionar à tela inicial" onFechar={() => setAberto(false)}>
          <p className="folha-texto">
            No iPhone, adicionando à tela inicial o app abre em tela cheia e passa a receber
            notificações, igual a um app baixado. São dois toques:
          </p>
          <ol className="convite-passos">
            <li>
              <span className="convite-passo-ic" aria-hidden="true">
                <IconeCompartilhar />
              </span>
              <span>
                Toque em <strong>Compartilhar</strong> na barra do Safari.
              </span>
            </li>
            <li>
              <span className="convite-passo-ic" aria-hidden="true">
                <IconeAdicionar />
              </span>
              <span>
                Escolha <strong>Adicionar à Tela de Início</strong>.
              </span>
            </li>
          </ol>
        </Sheet>
      )}
    </>
  );
}
