import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useProgresso } from '../engine';
import { Mascotinho } from '../mascote';
import { AberturaApp } from './AberturaApp';
import { LogoTchin } from '../icones/LogoTchin';
import { Sheet } from '../components/Sheet';
import { ContaSheet } from '../components/ContaSheet';
import { track } from '../lib/analytics';

/**
 * Splash unico (fase 0 do blueprint): mascote vivo, 1 frase de valor com
 * microprova, 1 botao. O Tchin respira em idle olhando para o Comecar.
 * Marca-mae presente: lockup "by Tchin Tchin" + selo Beta discreto.
 * Nada de carrossel, login ou pedidos de permissao: do toque em Comecar
 * a primeira pergunta em menos de 10s (Licao 1 ja esta no bundle).
 */
export default function Splash() {
  const navigate = useNavigate();
  const { onboardingCompleto } = useProgresso();
  const [comoFunciona, setComoFunciona] = useState(false);
  const [entrando, setEntrando] = useState(false);

  if (onboardingCompleto) return <Navigate to="/" replace />;

  return (
    <div className="splash">
      <AberturaApp />
      <div className="splash-alto app-chrome">
        <Mascotinho estado="idle" tamanho={104} rotulo="A taça que treina com você" />
        <p className="splash-wordmark">Treine seu Paladar</p>
        <div className="splash-marca">
          <LogoTchin size={15} className="splash-logo" />
          <span className="splash-by">by Tchin Tchin</span>
          <span className="chip-beta">Beta</span>
        </div>
      </div>

      <h1 className="splash-frase">
        Aprenda a confiar
        <br />
        no seu paladar.
      </h1>
      <p className="splash-prova">2 minutos por dia.</p>

      <div className="splash-acao">
        <button
          type="button"
          className="btn btn-primary btn-jogo btn-cheio tap"
          onClick={() => {
            track('ftue_iniciado');
            navigate('/licao-1');
          }}
        >
          Começar
        </button>
        <button type="button" className="splash-como tap" onClick={() => setComoFunciona(true)}>
          como funciona
        </button>
        <button type="button" className="splash-entrar tap" onClick={() => setEntrando(true)}>
          Já tem conta? <strong>Entrar</strong>
        </button>
      </div>

      <footer className="splash-footer app-chrome">
        <span className="splash-18" aria-label="Conteúdo para maiores de 18 anos">
          18+
        </span>
        <p>Para maiores de 18 anos. Beba com moderação: o paladar agradece.</p>
      </footer>

      {comoFunciona && (
        <Sheet titulo="Como funciona" onFechar={() => setComoFunciona(false)}>
          <p className="folha-texto">Lições de 2 minutos treinam seu paladar com perguntas rápidas.</p>
          <p className="folha-texto">Você ganha XP, mantém a sequência acesa e abre novas unidades.</p>
          <p className="folha-texto">Tudo com vinhos reais, das prateleiras daqui.</p>
        </Sheet>
      )}

      {entrando && (
        <ContaSheet
          modoInicial="entrar"
          onFechar={() => setEntrando(false)}
          onSucesso={(info) => {
            setEntrando(false);
            // Conta recem-criada (e-mail novo) ainda nao fez onboarding -> vai pra
            // Licao 1. Conta existente vai pro app (o Portao decide se ja onboardou).
            navigate(info?.criado ? '/licao-1' : '/', { replace: true });
          }}
        />
      )}
    </div>
  );
}
