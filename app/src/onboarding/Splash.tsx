import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useProgresso } from '../engine';
import { Tchin } from '../mascote';
import { LogoTchin } from '../icones/LogoTchin';
import { Sheet } from '../components/Sheet';

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
  const btnRef = useRef<HTMLButtonElement>(null);
  const [alvo, setAlvo] = useState<{ x: number; y: number } | null>(null);
  const [comoFunciona, setComoFunciona] = useState(false);

  /* O mascote olha para o botao Comecar (alvo do olhar em coords da pagina) */
  useEffect(() => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setAlvo({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
  }, []);

  if (onboardingCompleto) return <Navigate to="/" replace />;

  return (
    <div className="splash">
      <div className="splash-alto app-chrome">
        <Tchin
          estado="idle"
          tamanho={104}
          alvoX={alvo?.x}
          alvoY={alvo?.y}
          rotulo="Tchin, a taça que treina com você"
        />
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
          ref={btnRef}
          type="button"
          className="btn btn-primary btn-jogo btn-cheio tap"
          onClick={() => navigate('/licao-1')}
        >
          Começar
        </button>
        <button type="button" className="splash-como tap" onClick={() => setComoFunciona(true)}>
          como funciona
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
    </div>
  );
}
