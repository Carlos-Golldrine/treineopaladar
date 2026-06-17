import { useEffect, useReducer, useState } from 'react';
import { track } from '../lib/analytics';
import { assinarInstalacao, ehIos, estaInstalado, instalarNativo } from '../lib/pwa';
import './convite-pwa.css';

/**
 * Convite "Adicionar a tela inicial" (PWA). Aparece para QUEM ESTA NO NAVEGADOR
 * (fora do app instalado) e NUNCA dentro do app ja baixado (standalone/webview).
 * A dispensa vale so para a SESSAO atual (reaparece numa proxima visita), para que
 * quem desinstalou consiga reinstalar mesmo ja tendo passado pelo onboarding.
 * Dois caminhos: Android dispara o prompt nativo; iPhone mostra o passo a passo.
 */
const CHAVE_DISPENSADO = 'tp.pwa.dispensado';

function dispensadoNaSessao(): boolean {
  try {
    return sessionStorage.getItem(CHAVE_DISPENSADO) === '1';
  } catch {
    return false;
  }
}
function marcarDispensado(): void {
  try {
    sessionStorage.setItem(CHAVE_DISPENSADO, '1');
  } catch {
    /* modo privado/quota: segue sem memorizar */
  }
}

export function ConvitePwa() {
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const [aberto, setAberto] = useState(false);
  const [instalando, setInstalando] = useState(false);
  const [dicaManual, setDicaManual] = useState(false);

  const ios = ehIos();

  /* Reage quando o prompt nativo fica disponivel ou o app e instalado */
  useEffect(() => assinarInstalacao(rerender), []);

  /* Abre para quem esta no NAVEGADOR (nao standalone) e nao dispensou nesta sessao */
  useEffect(() => {
    if (estaInstalado() || dispensadoNaSessao()) return;
    const t = window.setTimeout(() => setAberto(true), 2500);
    return () => window.clearTimeout(t);
  }, []);

  /* Se o app for instalado com o convite aberto, fecha e nao reabre nesta sessao */
  useEffect(() => {
    const quandoInstalado = () => {
      marcarDispensado();
      setAberto(false);
    };
    window.addEventListener('appinstalled', quandoInstalado);
    return () => window.removeEventListener('appinstalled', quandoInstalado);
  }, []);

  /* Telemetria: convite visto */
  useEffect(() => {
    if (aberto) track('pwa_convite_visto', { plataforma: ios ? 'ios' : 'android' });
  }, [aberto, ios]);

  if (!aberto) return null;

  const fechar = (motivo: 'instalado' | 'depois') => {
    marcarDispensado();
    setAberto(false);
    if (motivo === 'depois') track('pwa_convite_dispensado');
  };

  const aoInstalar = async () => {
    setInstalando(true);
    const r = await instalarNativo();
    setInstalando(false);
    if (r === 'accepted') {
      track('pwa_instalado');
      fechar('instalado');
    } else if (r === 'indisponivel') {
      /* Navegador sem prompt nativo: cai na dica do menu */
      setDicaManual(true);
    }
    /* 'dismissed': mantem o convite aberto pra pessoa tentar de novo */
  };

  return (
    <div className="convite" role="dialog" aria-modal="true" aria-labelledby="convite-titulo">
      <button
        type="button"
        className="convite-fundo"
        aria-label="Fechar"
        onClick={() => fechar('depois')}
      />
      <div className="convite-painel app-chrome">
        <div className="convite-alca" aria-hidden="true" />

        <div className="convite-cabeca">
          <img
            className="convite-icone"
            src="/icons/icon-192.png"
            width={56}
            height={56}
            alt=""
            aria-hidden="true"
          />
          <div className="convite-texto">
            <h2 className="convite-titulo" id="convite-titulo">
              Tenha o Paladar à mão
            </h2>
            <p className="convite-sub">
              Adicione à tela inicial: abre em tela cheia, sem barra do navegador, e fica a um toque.
            </p>
          </div>
        </div>

        {ios ? (
          <ol className="convite-passos">
            <li>
              <span className="convite-passo-ic" aria-hidden="true">
                <IconeCompartilhar />
              </span>
              <span>
                Toque em <strong>Compartilhar</strong> na barra do navegador.
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
        ) : (
          dicaManual && (
            <p className="convite-dica">
              Abra o menu do navegador e toque em <strong>Instalar app</strong> (ou{' '}
              <strong>Adicionar à tela inicial</strong>).
            </p>
          )
        )}

        <div className="convite-acoes">
          {ios ? (
            <button
              type="button"
              className="btn btn-primary btn-jogo btn-cheio tap"
              onClick={() => fechar('instalado')}
            >
              Entendi
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-jogo btn-cheio tap"
              onClick={aoInstalar}
              disabled={instalando}
            >
              {instalando ? 'Abrindo…' : 'Instalar app'}
            </button>
          )}
          <button type="button" className="btn btn-depois tap" onClick={() => fechar('depois')}>
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}

/* Glifo de "compartilhar" do iOS (caixa com seta pra cima): desenho proprio */
function IconeCompartilhar() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      <path
        d="M12 3.5 V14.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 7 L12 3.5 L15.5 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 10 H6.5 A1.5 1.5 0 0 0 5 11.5 V18.5 A1.5 1.5 0 0 0 6.5 20 H17.5 A1.5 1.5 0 0 0 19 18.5 V11.5 A1.5 1.5 0 0 0 17.5 10 H16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* Glifo de "adicionar" (mais dentro de quadrado arredondado): desenho proprio */
function IconeAdicionar() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 8.5 V15.5 M8.5 12 H15.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
