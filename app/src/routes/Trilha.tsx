import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { unidades } from '../content';
import type { Unidade } from '../content';
import { PRECOS_LOJA, obterStore, useProgresso, useWallet, VIDAS_MAX } from '../engine';
import type { ProgressoLicao } from '../engine';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { Taca } from '../components/Taca';
import type { EstadoTaca } from '../components/Taca';
import { desbloquearUnidade, useDesbloqueios } from '../trilha/desbloqueios';
import { useFtueFlags } from '../onboarding/flags';
import { RevelacaoCristais } from '../onboarding/RevelacoesTrilha';
import { MascoteToast } from '../onboarding/Mascote';
import { FALAS } from '../onboarding/conteudo';

import fireIcon from '@material-symbols/svg-500/rounded/local_fire_department-fill.svg?raw';
import heartIcon from '@material-symbols/svg-500/rounded/favorite-fill.svg?raw';
import diamondIcon from '@material-symbols/svg-500/rounded/diamond-fill.svg?raw';
import crownIcon from '@material-symbols/svg-500/rounded/crown-fill.svg?raw';
import lockIcon from '@material-symbols/svg-500/rounded/lock-fill.svg?raw';
import flagIcon from '@material-symbols/svg-500/rounded/flag-fill.svg?raw';
import wineIcon from '@material-symbols/svg-500/rounded/wine_bar-fill.svg?raw';
import chevronIcon from '@material-symbols/svg-500/rounded/chevron_right.svg?raw';

import './trilha.css';

type Aba = 'streak' | 'vidas' | 'cristais' | null;

/** Cores de unidade claras (gold) pedem texto escuro sobre o card. */
const CORES_CLARAS = new Set(['#D4A574', '#B8894A']);

function formatarRegen(ms: number | null): string {
  if (ms === null || ms <= 0) return '0:00:00';
  const s = Math.ceil(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const seg = s % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
}

/** Re-renderiza a cada segundo enquanto ativo (para contadores ao vivo). */
function useTique(ativo: boolean): number {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    if (!ativo) return;
    const id = window.setInterval(() => setAgora(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [ativo]);
  return agora;
}

interface VistaUnidade {
  unidade: Unidade;
  indice: number;
  concluidas: number;
  completa: boolean;
  aberta: boolean;
  compravel: boolean;
}

function montarVistas(
  progresso: Record<string, ProgressoLicao>,
  desbloqueios: readonly string[],
): VistaUnidade[] {
  const vistas: VistaUnidade[] = [];
  for (let i = 0; i < unidades.length; i++) {
    const unidade = unidades[i];
    const concluidas = unidade.licoes.filter(
      (l) => (progresso[l.id]?.vezesConcluida ?? 0) > 0,
    ).length;
    const anterior = vistas[i - 1];
    const aberta = i === 0 || anterior.completa || desbloqueios.includes(unidade.meta.id);
    vistas.push({
      unidade,
      indice: i,
      concluidas,
      completa: concluidas === unidade.licoes.length,
      aberta,
      compravel: false,
    });
  }
  /* So a primeira unidade fechada oferece o desbloqueio antecipado */
  const primeiraFechada = vistas.find((v) => !v.aberta);
  if (primeiraFechada) primeiraFechada.compravel = true;
  return vistas;
}

export default function Trilha() {
  const navigate = useNavigate();
  const { wallet, streakEfetivo, streakEmRisco, proximaVidaEmMs } = useWallet();
  const { progresso, revisoesVencidas, checkpoints, onboardingCompleto } = useProgresso();
  const desbloqueios = useDesbloqueios();
  const [aba, setAba] = useState<Aba>(null);
  const [unidadeComprando, setUnidadeComprando] = useState<VistaUnidade | null>(null);
  useTique(aba === 'vidas' && proximaVidaEmMs !== null);

  /* Revelacao progressiva (FTUE): cristais so entram no HUD apos o
     1 toque de coleta; tooltip de loja so na primeira vez sem vidas */
  const [ftue, marcarFtue] = useFtueFlags();
  const [recemColetado, setRecemColetado] = useState(false);

  const vistas = useMemo(() => montarVistas(progresso, desbloqueios), [progresso, desbloqueios]);
  const totalConcluidas = vistas.reduce((soma, v) => soma + v.concluidas, 0);

  /* O no "atual" (pill Comecar) e a 1a licao nao concluida da 1a unidade
     aberta e incompleta; outras unidades abertas tem a 1a pendente livre */
  const vistaAtual = vistas.find((v) => v.aberta && !v.completa);
  const idAtual = vistaAtual?.unidade.licoes.find(
    (l) => (progresso[l.id]?.vezesConcluida ?? 0) === 0,
  )?.id;

  const mostrarColeta = onboardingCompleto && !ftue.cristaisColetados && totalConcluidas > 0;
  const mostrarLoja =
    onboardingCompleto && !ftue.lojaVista && !mostrarColeta && wallet.vidas === 0;

  /* Quem ja avancou de unidade abre a trilha no proprio no atual */
  useEffect(() => {
    if (!vistaAtual || vistaAtual.indice === 0) return;
    document
      .querySelector('.trail-item.current')
      ?.scrollIntoView({ block: 'center', behavior: 'auto' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const comprarDesbloqueio = (vista: VistaUnidade) => {
    const ok = obterStore().comprar('desbloqueioUnidade');
    if (ok) desbloquearUnidade(vista.unidade.meta.id);
    setUnidadeComprando(null);
  };

  return (
    <>
      <header className="hud app-chrome">
        <button
          type="button"
          className={`hud-chip hud-streak tap${streakEmRisco ? ' hud-risco' : ''}`}
          aria-label={`Sequência de ${streakEfetivo} ${streakEfetivo === 1 ? 'dia' : 'dias'}`}
          onClick={() => setAba('streak')}
        >
          <Icon svg={fireIcon} size={18} />
          <span className="hud-value">{streakEfetivo}</span>
        </button>
        <button
          type="button"
          className="hud-chip hud-lives tap"
          aria-label={`${wallet.vidas} vidas`}
          onClick={() => setAba('vidas')}
        >
          <Icon svg={heartIcon} size={18} />
          <span className="hud-value">{wallet.vidas}</span>
        </button>
        {ftue.cristaisColetados && (
          <button
            type="button"
            className={`hud-chip hud-gems tap${recemColetado ? ' ftue-surge' : ''}`}
            aria-label={`${wallet.cristais} cristais`}
            onClick={() => setAba('cristais')}
          >
            <Icon svg={diamondIcon} size={18} />
            <span className="hud-value">{wallet.cristais}</span>
          </button>
        )}
      </header>

      {totalConcluidas > 0 && (
        <button
          type="button"
          className="pratica-card tap"
          onClick={() => navigate('/pratica')}
          aria-label="Abrir a prática livre"
        >
          <span className="pratica-selo">
            <Icon svg={wineIcon} size={22} />
          </span>
          <span className="pratica-textos">
            <span className="pratica-titulo">Prática livre</span>
            <span className="pratica-sub">Rodadas de 8 com rótulos de verdade. Sem gastar vida.</span>
          </span>
          <Icon svg={chevronIcon} size={22} className="pratica-seta" />
        </button>
      )}

      {vistas.map((vista) => {
        const { meta, licoes } = vista.unidade;
        const clara = CORES_CLARAS.has(meta.cor.toUpperCase());
        const numero = vista.indice + 1;

        if (!vista.aberta) {
          return (
            <section
              className="unit-locked"
              key={meta.id}
              aria-label={`Unidade ${numero}, ${meta.titulo}, bloqueada`}
            >
              <span className="unit-locked-selo">
                <Icon svg={lockIcon} size={18} />
              </span>
              <div className="unit-locked-textos">
                <p className="unit-locked-eyebrow">Unidade {numero}</p>
                <h2 className="unit-locked-titulo">{meta.titulo}</h2>
                <p className="unit-locked-sub">
                  Abre quando a unidade {numero - 1} estiver completa.
                </p>
              </div>
              {vista.compravel && (
                <button
                  type="button"
                  className="unit-abrir tap"
                  onClick={() => setUnidadeComprando(vista)}
                >
                  <Icon svg={diamondIcon} size={16} />
                  Abrir antes
                </button>
              )}
            </section>
          );
        }

        return (
          <section key={meta.id} aria-label={`Unidade ${numero}: ${meta.titulo}`}>
            <div
              className={`unit-card${clara ? ' unit-card-clara' : ''}`}
              style={{ background: meta.cor }}
            >
              <p className="unit-eyebrow">Unidade {numero}</p>
              <h2 className="unit-title">{meta.titulo}</h2>
              <p className="unit-desc">{meta.subtitulo}</p>
              <div className="unit-progress">
                <div
                  className="unit-bar"
                  role="progressbar"
                  aria-valuenow={vista.concluidas}
                  aria-valuemin={0}
                  aria-valuemax={licoes.length}
                  aria-label={`${vista.concluidas} de ${licoes.length} lições concluídas`}
                >
                  <div
                    className="unit-bar-fill"
                    style={{ width: `${(vista.concluidas / licoes.length) * 100}%` }}
                  />
                </div>
                <span className="unit-count">
                  {vista.concluidas}/{licoes.length}
                </span>
              </div>
            </div>

            <ol className="trail" aria-label={`Lições da unidade ${numero}`}>
              {licoes.map((licao) => {
                const p = progresso[licao.id];
                const coroas = p?.coroas ?? 0;
                const feita = (p?.vezesConcluida ?? 0) > 0;
                const atual = licao.id === idAtual;
                const primeiraPendente =
                  !feita && licoes.find((l) => (progresso[l.id]?.vezesConcluida ?? 0) === 0)?.id === licao.id;
                const bloqueada = !feita && !primeiraPendente;
                const revisar = revisoesVencidas.includes(licao.id);

                const estado: EstadoTaca = bloqueada
                  ? 'bloqueada'
                  : feita
                    ? coroas >= 3
                      ? 'ouro'
                      : 'concluida'
                    : 'disponivel';

                const classe = `trail-item${atual ? ' current' : ''}${feita || !bloqueada ? ' reached' : ''}${bloqueada ? ' locked' : ''}`;

                return (
                  <li className={classe} key={licao.id}>
                    {bloqueada ? (
                      <div className="node node-taca" aria-label={`${licao.titulo}, bloqueada`}>
                        <Taca estado="bloqueada" />
                      </div>
                    ) : (
                      <button
                        type="button"
                        className={`node node-taca tap${atual ? ' node-atual' : ''}`}
                        aria-label={
                          atual
                            ? `Começar a lição ${licao.titulo}`
                            : revisar
                              ? `Revisar a lição ${licao.titulo}`
                              : feita
                                ? `Treinar de novo a lição ${licao.titulo}`
                                : `Começar a lição ${licao.titulo}`
                        }
                        onClick={() => navigate(`/licao/${licao.id}`)}
                      >
                        {atual && (
                          <span className="start-pill" aria-hidden="true">
                            Começar
                          </span>
                        )}
                        {!atual && revisar && (
                          <span className="start-pill pill-revisar" aria-hidden="true">
                            Revisar
                          </span>
                        )}
                        <Taca estado={estado} coroas={coroas} />
                      </button>
                    )}
                    {feita && (
                      <span className="node-coroas" aria-label={`${coroas} de 3 coroas`}>
                        {[1, 2, 3].map((n) => (
                          <Icon
                            key={n}
                            svg={crownIcon}
                            size={13}
                            className={n <= coroas ? 'coroa coroa-ganha' : 'coroa'}
                          />
                        ))}
                      </span>
                    )}
                    <span className="node-label">{licao.titulo.split(':')[0]}</span>
                  </li>
                );
              })}
              <li
                className={`trail-item trail-checkpoint${vista.completa ? ' reached' : ''}`}
                aria-label={
                  checkpoints.includes(meta.id)
                    ? `Checkpoint da unidade ${numero} conquistado`
                    : `Checkpoint da unidade ${numero}: complete as 5 lições e ganhe 50 XP`
                }
              >
                <span
                  className={`checkpoint-selo${checkpoints.includes(meta.id) ? ' checkpoint-ganho' : ''}`}
                >
                  <Icon svg={flagIcon} size={20} />
                </span>
                <span className="node-label">
                  {checkpoints.includes(meta.id) ? 'Checkpoint, 50 XP' : 'Checkpoint'}
                </span>
              </li>
            </ol>
          </section>
        );
      })}

      {aba === 'streak' && (
        <Sheet titulo="Sua sequência" onFechar={() => setAba(null)}>
          <p className="folha-numero folha-num-streak">
            <Icon svg={fireIcon} size={26} />
            {streakEfetivo} {streakEfetivo === 1 ? 'dia' : 'dias'}
          </p>
          <p className="folha-texto">
            {streakEmRisco
              ? 'Hoje ainda não conta. Uma lição, mesmo curta, salva o dia.'
              : streakEfetivo > 0
                ? 'Dia garantido. Volte amanhã e a chama segue acesa.'
                : 'Conclua uma lição hoje e a sequência começa.'}
          </p>
          {wallet.bestStreak > 0 && (
            <p className="folha-texto folha-suave">
              Melhor sequência até hoje: {wallet.bestStreak} {wallet.bestStreak === 1 ? 'dia' : 'dias'}.
            </p>
          )}
        </Sheet>
      )}

      {aba === 'vidas' && (
        <Sheet titulo="Vidas" onFechar={() => setAba(null)}>
          <div className="folha-coracoes" aria-label={`${wallet.vidas} de ${VIDAS_MAX} vidas`}>
            {Array.from({ length: VIDAS_MAX }, (_, i) => (
              <Icon key={i} svg={heartIcon} size={26} className={i < wallet.vidas ? 'vida vida-cheia' : 'vida'} />
            ))}
          </div>
          <p className="folha-texto">
            {proximaVidaEmMs === null ? (
              'Vidas cheias. Bom momento para uma lição nova.'
            ) : (
              <>
                Próxima vida em <strong className="folha-mono">{formatarRegen(proximaVidaEmMs)}</strong>. Uma vida
                volta a cada 4 horas.
              </>
            )}
          </p>
          <p className="folha-texto folha-suave">
            Concluir uma revisão recupera 1 vida na hora. E o primeiro tropeço de cada lição não custa nada.
          </p>
        </Sheet>
      )}

      {aba === 'cristais' && (
        <Sheet titulo="Cristais" onFechar={() => setAba(null)}>
          <p className="folha-numero folha-num-cristais">
            <Icon svg={diamondIcon} size={24} />
            {wallet.cristais}
          </p>
          <p className="folha-texto">
            Cristais valem treino. Você ganha estudando e gasta para proteger sua sequência, recuperar vidas e
            abrir novos modos.
          </p>
        </Sheet>
      )}

      {unidadeComprando && (
        <Sheet
          titulo={`Abrir a Unidade ${unidadeComprando.indice + 1} agora?`}
          onFechar={() => setUnidadeComprando(null)}
        >
          <p className="folha-texto">
            {unidadeComprando.unidade.meta.titulo} abre de graça quando a unidade anterior estiver
            completa. Para abrir agora: {PRECOS_LOJA.desbloqueioUnidade} cristais, cerca de uma semana
            de treino.
          </p>
          <p className="folha-numero folha-num-cristais" aria-label={`Você tem ${wallet.cristais} cristais`}>
            <Icon svg={diamondIcon} size={20} />
            {wallet.cristais}
            <span className="folha-saldo-rotulo">seu saldo</span>
          </p>
          {wallet.cristais < PRECOS_LOJA.desbloqueioUnidade && (
            <p className="folha-texto folha-suave">
              Faltam {PRECOS_LOJA.desbloqueioUnidade - wallet.cristais} cristais. Lições, metas e
              sequência enchem o cofre.
            </p>
          )}
          <button
            type="button"
            className="btn btn-primary btn-cheio tap"
            disabled={wallet.cristais < PRECOS_LOJA.desbloqueioUnidade}
            onClick={() => comprarDesbloqueio(unidadeComprando)}
          >
            Abrir por {PRECOS_LOJA.desbloqueioUnidade} cristais
          </button>
        </Sheet>
      )}

      {mostrarColeta && (
        <RevelacaoCristais
          cristais={wallet.cristais}
          onColetar={() => {
            setRecemColetado(true);
            marcarFtue({ cristaisColetados: true });
          }}
        />
      )}

      {mostrarLoja && <MascoteToast texto={FALAS.loja} fixo onFechar={() => marcarFtue({ lojaVista: true })} />}
    </>
  );
}
