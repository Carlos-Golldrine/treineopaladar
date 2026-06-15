import { useState } from 'react';
import { Ic } from '../icones/Icones';
import { LogoTchin } from '../icones/LogoTchin';
import { definirSom, somLigado } from '../som/som';
import { OBJETIVOS, obterStore, useProgresso, useWallet } from '../engine';
import type { Habilidade, Objetivo } from '../engine';
import { ICONE_OBJETIVO, ROTULO_OBJETIVO } from '../trilha/objetivo';
import { Sheet } from '../components/Sheet';
import { ContaSheet } from '../components/ContaSheet';
import { useConta, sairDaConta } from '../lib/conta';

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
  const { scorePaladar, objetivo } = useProgresso();
  const conta = useConta();
  const [criandoConta, setCriandoConta] = useState(false);

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
        <div className="profile-avatar" aria-hidden="true">
          {conta.email ? conta.email[0]!.toUpperCase() : 'V'}
        </div>
        <h1 className="profile-name">{conta.anonimo || !conta.email ? 'Visitante' : 'Sua conta'}</h1>
        <p className="profile-sub">{conta.email ?? desdeQuando(wallet.criadoEm)}</p>
        <div className="profile-marca" aria-label="Parte do ecossistema Tchin Tchin, versão beta">
          <LogoTchin size={14} className="profile-logo" />
          <span className="profile-by">by Tchin Tchin</span>
          <span className="chip-beta">Beta</span>
        </div>
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
    </>
  );
}
