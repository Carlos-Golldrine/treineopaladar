import { useState } from 'react';
import { Mascotinho } from '../mascote';
import './gate-termos.css';

/**
 * Gate de consentimento: o app so e acessivel APOS aceitar (18+ e Politica de
 * Privacidade). Bloqueia tudo ate o aceite; guarda em localStorage e nao
 * reaparece. Renderizado global (main.tsx), acima de qualquer tela. Bump da chave
 * (v2...) reexige o aceite quando a politica mudar.
 */
const CHAVE = 'tp.termos.v1';
const POLITICA_URL = 'https://cdn.tchintchin.com.br/privacy/privacy.html';

function jaAceitou(): boolean {
  try {
    return localStorage.getItem(CHAVE) === '1';
  } catch {
    return false; // storage bloqueado: pede o aceite (vale na sessao)
  }
}

export function GateTermos() {
  const [aceito, setAceito] = useState(jaAceitou);
  if (aceito) return null;

  const aceitar = () => {
    try {
      localStorage.setItem(CHAVE, '1');
    } catch {
      /* modo privado/quota: o aceite vale nesta sessao */
    }
    setAceito(true);
  };

  return (
    <div className="gate-termos" role="dialog" aria-modal="true" aria-labelledby="gate-termos-titulo">
      <div className="gate-termos-cartao app-chrome">
        <Mascotinho estado="idle" tamanho={88} rotulo="Mascote do Treine seu Paladar" />
        <h1 id="gate-termos-titulo" className="gate-termos-titulo">
          Antes de começar
        </h1>
        <p className="gate-termos-texto">
          O Treine seu Paladar é para maiores de 18 anos. Para continuar, você precisa concordar com a
          nossa Política de Privacidade.
        </p>
        <a
          className="gate-termos-link tap"
          href={POLITICA_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Ler a Política de Privacidade
        </a>
        <button
          type="button"
          className="btn btn-primary btn-jogo btn-cheio tap gate-termos-cta"
          onClick={aceitar}
        >
          Concordo e continuar
        </button>
      </div>
    </div>
  );
}
