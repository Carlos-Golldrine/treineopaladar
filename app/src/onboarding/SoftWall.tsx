import { useState } from 'react';
import { Ic } from '../icones/Icones';
import { LogoTchin } from '../icones/LogoTchin';
import { ContaSheet } from '../components/ContaSheet';
import { useConta } from '../lib/conta';

/**
 * Soft wall de cadastro (fase 3 do blueprint): so depois do aha.
 * Mostra o que a pessoa ja construiu, convida a salvar e oferece um
 * "Depois" discreto e neutro. Nunca palavras como descartar ou perder.
 * "Criar conta" anexa e-mail+senha ao usuario anonimo (mesmo progresso).
 */
interface Props {
  xp: number;
  onTrilha: () => void;
}

export function SoftWall({ xp, onTrilha }: Props) {
  const [conta, setConta] = useState(false);
  const { anonimo, email } = useConta();
  // Quem chegou aqui ja com conta (entrou por "Ja tenho conta" e a gente criou
  // na hora) nao deve ser convidado a criar de novo — so segue pra trilha. Usa o
  // e-mail como sinal tambem: apos criar, o is_anonymous pode demorar a virar
  // false (confirmacao de e-mail pendente), mas o e-mail ja fica na sessao.
  const temConta = !anonimo || !!email;

  return (
    <div className="player wall">
      <div className="wall-conteudo">
        <p className="conclusao-eyebrow">Seu primeiro dia</p>
        <h1 className="wall-titulo">{temConta ? 'Tudo salvo na sua conta' : 'Salve seu progresso'}</h1>
        <p className="wall-sub">Olha o que você já construiu hoje:</p>
        <ul className="wall-lista">
          <li>
            <span className="wall-icone wall-icone-xp">
              <Ic nome="raio-energia" size={20} />
            </span>
            <span>
              <strong className="wall-mono">+{xp} XP</strong> no seu placar de treino
            </span>
          </li>
          <li>
            <span className="wall-icone wall-icone-streak">
              <Ic nome="chama-streak" size={20} />
            </span>
            <span>
              Sequência de <strong>1 dia</strong> acesa
            </span>
          </li>
          <li>
            <span className="wall-icone wall-icone-trilha">
              <Ic nome="taca" size={20} />
            </span>
            <span>Trilha do paladar aberta, Lição 2 esperando</span>
          </li>
        </ul>
        <p className="wall-ecossistema app-chrome">
          <LogoTchin size={14} />
          Parte do ecossistema Tchin Tchin.
        </p>
      </div>

      <footer className="wall-acoes">
        {temConta ? (
          <button type="button" className="btn btn-primary btn-jogo btn-cheio tap" onClick={onTrilha}>
            Continuar
          </button>
        ) : (
          <>
            <button type="button" className="btn btn-primary btn-jogo btn-cheio tap" onClick={() => setConta(true)}>
              Criar conta
            </button>
            <button type="button" className="btn btn-depois tap" onClick={onTrilha}>
              Depois
            </button>
          </>
        )}
      </footer>

      {conta && <ContaSheet onFechar={() => setConta(false)} onSucesso={onTrilha} />}
    </div>
  );
}
