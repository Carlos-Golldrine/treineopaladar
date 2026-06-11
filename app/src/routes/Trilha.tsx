import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { licoesPorId, unidade1Meta } from '../content';
import { VIDAS_MAX, useProgresso, useWallet } from '../engine';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { Taca } from '../components/Taca';
import type { EstadoTaca } from '../components/Taca';
import { useFtueFlags } from '../onboarding/flags';
import { RevelacaoCristais } from '../onboarding/RevelacoesTrilha';
import { MascoteToast } from '../onboarding/Mascote';
import { FALAS } from '../onboarding/conteudo';

import fireIcon from '@material-symbols/svg-500/rounded/local_fire_department-fill.svg?raw';
import heartIcon from '@material-symbols/svg-500/rounded/favorite-fill.svg?raw';
import diamondIcon from '@material-symbols/svg-500/rounded/diamond-fill.svg?raw';
import crownIcon from '@material-symbols/svg-500/rounded/crown-fill.svg?raw';

import './trilha.css';

type Aba = 'streak' | 'vidas' | 'cristais' | null;

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

export default function Trilha() {
  const navigate = useNavigate();
  const { wallet, streakEfetivo, streakEmRisco, proximaVidaEmMs } = useWallet();
  const { progresso, revisoesVencidas, onboardingCompleto } = useProgresso();
  const [aba, setAba] = useState<Aba>(null);
  useTique(aba === 'vidas' && proximaVidaEmMs !== null);

  /* Revelacao progressiva (FTUE): cristais so entram no HUD apos o
     1 toque de coleta; tooltip de loja so na primeira vez sem vidas */
  const [ftue, marcarFtue] = useFtueFlags();
  const [recemColetado, setRecemColetado] = useState(false);

  const licoes = unidade1Meta.ordemLicoes
    .map((id) => licoesPorId[id])
    .filter((l) => l !== undefined);
  const concluidas = licoes.filter((l) => (progresso[l.id]?.vezesConcluida ?? 0) > 0).length;

  const mostrarColeta = onboardingCompleto && !ftue.cristaisColetados && concluidas > 0;
  const mostrarLoja =
    onboardingCompleto && !ftue.lojaVista && !mostrarColeta && wallet.vidas === 0;

  /* A primeira licao sem conclusao e a atual; as seguintes ficam bloqueadas */
  const idxAtual = licoes.findIndex((l) => (progresso[l.id]?.vezesConcluida ?? 0) === 0);

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

      <section className="unit-card" aria-label="Unidade atual">
        <p className="unit-eyebrow">Unidade 1</p>
        <h1 className="unit-title">{unidade1Meta.titulo}</h1>
        <p className="unit-desc">{unidade1Meta.subtitulo}</p>
        <div className="unit-progress">
          <div
            className="unit-bar"
            role="progressbar"
            aria-valuenow={concluidas}
            aria-valuemin={0}
            aria-valuemax={licoes.length}
            aria-label={`${concluidas} de ${licoes.length} lições concluídas`}
          >
            <div className="unit-bar-fill" style={{ width: `${(concluidas / licoes.length) * 100}%` }} />
          </div>
          <span className="unit-count">
            {concluidas}/{licoes.length}
          </span>
        </div>
      </section>

      <ol className="trail" aria-label="Lições da unidade">
        {licoes.map((licao, i) => {
          const p = progresso[licao.id];
          const coroas = p?.coroas ?? 0;
          const feita = (p?.vezesConcluida ?? 0) > 0;
          const atual = i === idxAtual;
          const bloqueada = !feita && !atual;
          const revisar = revisoesVencidas.includes(licao.id);

          const estado: EstadoTaca = bloqueada
            ? 'bloqueada'
            : feita
              ? coroas >= 3
                ? 'ouro'
                : 'concluida'
              : 'disponivel';

          const classe = `trail-item${atual ? ' current' : ''}${feita || atual ? ' reached' : ''}${bloqueada ? ' locked' : ''}`;

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
                        : `Treinar de novo a lição ${licao.titulo}`
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
                    <Icon key={n} svg={crownIcon} size={13} className={n <= coroas ? 'coroa coroa-ganha' : 'coroa'} />
                  ))}
                </span>
              )}
              <span className="node-label">{licao.titulo.split(':')[0]}</span>
            </li>
          );
        })}
      </ol>

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
