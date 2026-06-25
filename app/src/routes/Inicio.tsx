/**
 * Inicio: o painel que orienta (nova home, estilo "app grande").
 * Junta o foco do Duolingo (contexto da unidade + 1 acao principal) com a
 * clareza do Uber (atalhos descobriveis em cards). Reusa os dados do engine.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgresso, useWallet } from '../engine';
import { unidadesDoObjetivo } from '../trilha/ordem';
import { useDesbloqueios } from '../trilha/desbloqueios';
import { Ic } from '../icones/Icones';
import { Mascotinho } from '../mascote';
import { AberturaHome, deveTocarAberturaHome } from '../onboarding/AberturaHome';
import { GatePrimer, sincronizarBadge } from '../notificacoes';
import { RodapeTchin } from '../components/RodapeTchin';
import './inicio.css';

function saudacao(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function Inicio() {
  const navigate = useNavigate();
  const { wallet, streakEfetivo, streakEmRisco } = useWallet();
  const { progresso, objetivo } = useProgresso();
  const desbloqueios = useDesbloqueios();
  /* Abertura da home: rosto aparece/sorri/esvanece; so depois o mascote entra
     pela lateral (o card de coach). Toca uma vez por carga. */
  const [introTocando, setIntroTocando] = useState(deveTocarAberturaHome);

  const unidades = useMemo(() => unidadesDoObjetivo(objetivo), [objetivo]);

  /* Badge no icone do app (PWA instalado): acende o "1" quando a ofensiva
     entra em risco, apaga quando esta em dia. No-op fora de PWA instalado. */
  useEffect(() => {
    void sincronizarBadge(streakEmRisco);
  }, [streakEmRisco]);

  /* Unidade atual = 1a aberta e incompleta; proxima licao = 1a pendente dela */
  const atual = useMemo(() => {
    let prevCompleta = true;
    for (let i = 0; i < unidades.length; i++) {
      const u = unidades[i];
      const concluidas = u.licoes.filter((l) => (progresso[l.id]?.vezesConcluida ?? 0) > 0).length;
      const completa = concluidas === u.licoes.length;
      const aberta = i === 0 || prevCompleta || desbloqueios.includes(u.meta.id);
      if (aberta && !completa) {
        const prox = u.licoes.find((l) => (progresso[l.id]?.vezesConcluida ?? 0) === 0);
        return {
          unidade: u,
          numero: i + 1,
          concluidas,
          total: u.licoes.length,
          idAtual: prox?.id ?? null,
          tituloLicao: prox ? prox.titulo.split(':')[0] : null,
        };
      }
      prevCompleta = completa;
    }
    const u = unidades[unidades.length - 1];
    return u
      ? { unidade: u, numero: unidades.length, concluidas: u.licoes.length, total: u.licoes.length, idAtual: null, tituloLicao: null }
      : null;
  }, [unidades, progresso, desbloqueios]);

  const continuar = () => {
    if (atual?.idAtual) navigate(`/licao/${atual.idAtual}`);
    else navigate('/pratica');
  };

  const pct = atual && atual.total > 0 ? (atual.concluidas / atual.total) * 100 : 0;

  return (
    <>
      {introTocando && <AberturaHome onFim={() => setIntroTocando(false)} />}

      <header className="inicio-topo app-chrome">
        <div className="inicio-saud">
          <p className="inicio-saud-eyebrow">{saudacao()}</p>
          <h1 className="inicio-saud-titulo">Pronto pra treinar?</h1>
        </div>
        <div className="inicio-stats">
          <span className="inicio-stat inicio-stat-streak" aria-label={`Sequência de ${streakEfetivo} dias`}>
            <Ic nome={streakEmRisco || streakEfetivo === 0 ? 'chama-apagada' : 'chama-streak'} size={17} />
            {streakEfetivo}
          </span>
          <span className="inicio-stat inicio-stat-vidas" aria-label={`${wallet.vidas} vidas`}>
            <Ic nome={wallet.vidas > 0 ? 'coracao-vida' : 'coracao-vazio'} size={17} />
            {wallet.vidas}
          </span>
          <span className="inicio-stat inicio-stat-cristais" aria-label={`${wallet.cristais} cristais`}>
            <Ic nome="cristal" size={17} />
            {wallet.cristais}
          </span>
        </div>
      </header>

      {atual && (
        <button type="button" className="inicio-foco tap" onClick={continuar}>
          <p className="inicio-foco-eyebrow">Unidade {atual.numero}</p>
          <h2 className="inicio-foco-titulo">{atual.unidade.meta.titulo}</h2>
          <div className="inicio-foco-prog">
            <div
              className="inicio-bar"
              role="progressbar"
              aria-valuenow={atual.concluidas}
              aria-valuemin={0}
              aria-valuemax={atual.total}
            >
              <div className="inicio-bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="inicio-foco-cont">
              {atual.concluidas}/{atual.total}
            </span>
          </div>
        </button>
      )}

      <div className="inicio-atalhos-cab">
        <span className="inicio-atalhos-titulo">Atalhos</span>
      </div>
      <div className="inicio-atalhos">
        <button type="button" className="inicio-atalho tap" onClick={() => navigate('/desafio')}>
          <span className="inicio-atalho-topo">
            <span className="inicio-atalho-ico inicio-atalho-ico-ouro">
              <Ic nome="alvo-desafio" size={20} />
            </span>
            <span className="inicio-atalho-badge">Novo</span>
          </span>
          <span className="inicio-atalho-titulo">Desafio do dia</span>
          <span className="inicio-atalho-sub">Rótulo de hoje</span>
        </button>

        <button type="button" className="inicio-atalho tap" onClick={() => navigate('/pratica')}>
          <span className="inicio-atalho-ico">
            <Ic nome="livro-flashcard" size={20} />
          </span>
          <span className="inicio-atalho-titulo">Prática livre</span>
          <span className="inicio-atalho-sub">Sem gastar vida</span>
        </button>

        <button type="button" className="inicio-atalho tap" onClick={() => navigate('/mesa')}>
          <span className="inicio-atalho-ico">
            <Ic nome="mesa" size={20} />
          </span>
          <span className="inicio-atalho-titulo">A Mesa</span>
          <span className="inicio-atalho-sub">Degustação em grupo</span>
        </button>

        <button type="button" className="inicio-atalho tap" onClick={() => navigate('/lente')}>
          <span className="inicio-atalho-ico inicio-atalho-ico-ouro">
            <Ic nome="lente" size={20} />
          </span>
          <span className="inicio-atalho-titulo">Escanear rótulo</span>
          <span className="inicio-atalho-sub">Descubra o vinho</span>
        </button>
      </div>

      {!introTocando && (
        <section className="inicio-coach" aria-label="Sua sequência">
          <div className="inicio-coach-masc">
            <div className="inicio-coach-entra">
              <Mascotinho estado="idle" tamanho={62} />
            </div>
          </div>
          <div className="inicio-coach-txt">
            <p className="inicio-coach-titulo">
              {streakEfetivo > 0
                ? `Sequência de ${streakEfetivo} ${streakEfetivo === 1 ? 'dia' : 'dias'}`
                : 'Comece sua sequência hoje'}
            </p>
            <p className="inicio-coach-sub">
              {streakEfetivo > 0
                ? 'Uma lição hoje mantém a chama acesa.'
                : 'Uma lição hoje já acende a chama.'}
            </p>
          </div>
        </section>
      )}

      <RodapeTchin />

      {/* Primer de notificacao (1x, pos-onboarding, so onde push faz sentido) */}
      <GatePrimer />
    </>
  );
}
