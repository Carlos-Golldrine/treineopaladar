import { Navigate, useNavigate } from 'react-router-dom';
import { useProgresso } from '../engine';
import { TchinDuo } from './Mascote';

/**
 * Splash unico (fase 0 do blueprint): logo, 1 frase de valor, 1 botao.
 * Nada de carrossel, login ou pedidos de permissao. Do toque em Comecar
 * a primeira pergunta em menos de 10s: a Licao 1 ja esta no bundle.
 */
export default function Splash() {
  const navigate = useNavigate();
  const { onboardingCompleto } = useProgresso();

  if (onboardingCompleto) return <Navigate to="/" replace />;

  return (
    <div className="splash">
      <div className="splash-alto app-chrome">
        <TchinDuo size={92} />
        <p className="splash-wordmark">Treine seu Paladar</p>
        <p className="splash-by">by Tchin Tchin</p>
      </div>

      <h1 className="splash-frase">
        Aprenda a confiar
        <br />
        no seu paladar.
      </h1>

      <div className="splash-acao">
        <button type="button" className="btn btn-primary btn-cheio tap" onClick={() => navigate('/licao-1')}>
          Começar
        </button>
      </div>

      <footer className="splash-footer app-chrome">
        <span className="splash-18" aria-label="Conteúdo para maiores de 18 anos">
          18+
        </span>
        <p>Para maiores de 18 anos. Beba com moderação: o paladar agradece.</p>
      </footer>
    </div>
  );
}
