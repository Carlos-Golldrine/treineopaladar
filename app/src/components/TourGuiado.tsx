/**
 * Tour guiado de primeiro acesso: o Mascotinho leva a pessoa pelas abas
 * principais (Desafio, Trilha, Mesa, Perfil) explicando cada uma, e termina
 * abrindo a edicao do perfil — pra todo novo usuario sair com perfil editado e
 * o app conhecido. Mostrado 1x (flag tourFeito), pos-onboarding (so monta dentro
 * do Shell, que ja exige onboardingCompleto). `?tour=1` força (teste / rever).
 *
 * Motion: card sobe com mola, mascote entra com bounce e flutua, a aba da vez
 * pulsa (sobe acima do scrim), troca de passo re-anima (key=i). Tudo
 * transform/opacity; respeita prefers-reduced-motion (ver tour.css).
 * Voz Mago+Sabio, sem emoji, sem travessao.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mascotinho, type EstadoMascote } from '../mascote';
import { track } from '../lib/analytics';
import { useFtueFlags } from '../onboarding/flags';
import './tour.css';

interface Passo {
  rota: string;
  titulo: string;
  texto: string;
  estado: EstadoMascote;
  /** O mascote inclina pra baixo, indicando a aba da vez. */
  aponta?: boolean;
  /** Rotulo do botao de avancar (ultimo passo). */
  cta?: string;
}

const PASSOS: Passo[] = [
  {
    rota: '/',
    titulo: 'Oi, eu sou o Tchin',
    texto: 'Em meio minuto eu te mostro o essencial do app. Bora?',
    estado: 'feliz',
  },
  {
    rota: '/desafio',
    titulo: 'Desafio do Dia',
    texto: 'Um rótulo novo por dia, quatro perguntas sobre ele. É o seu hábito diário, rapidinho.',
    estado: 'idle',
    aponta: true,
  },
  {
    rota: '/trilha',
    titulo: 'Sua Trilha',
    texto: 'As lições na ordem do seu objetivo. É aqui que o paladar treina de verdade.',
    estado: 'idle',
    aponta: true,
  },
  {
    rota: '/mesa',
    titulo: 'A Mesa',
    texto: 'Toda semana você senta com gente do seu ritmo. Sem conversa, só brindes.',
    estado: 'idle',
    aponta: true,
  },
  {
    rota: '/perfil',
    titulo: 'Seu Perfil',
    texto: 'Seu progresso fica aqui. Bora deixar com a sua cara: escolha nome e avatar.',
    estado: 'feliz',
    aponta: true,
    cta: 'Editar meu perfil',
  },
];

export function TourGuiado() {
  const navigate = useNavigate();
  const [flags, marcar] = useFtueFlags();
  const forcar =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('tour');
  const [ativo, setAtivo] = useState(false);
  const [i, setI] = useState(0);

  /* Decide se mostra: forçado por ?tour=1, ou 1x pos-onboarding (so dentro do
     Shell, que ja garante onboardingCompleto). Pequeno atraso pra assentar a tela. */
  useEffect(() => {
    if (forcar) {
      setAtivo(true);
      return;
    }
    if (flags.tourFeito) return;
    const t = window.setTimeout(() => setAtivo(true), 800);
    return () => window.clearTimeout(t);
  }, [forcar, flags.tourFeito]);

  /* A cada passo: marca o body (pra aba da vez pulsar acima do scrim) e navega. */
  useEffect(() => {
    if (!ativo) return;
    document.body.classList.add('tour-ativo');
    navigate(PASSOS[i].rota, { replace: true });
    track('tour_passo', { passo: i });
  }, [ativo, i, navigate]);

  /* Garante a limpeza do body se desmontar no meio. */
  useEffect(() => () => document.body.classList.remove('tour-ativo'), []);

  if (!ativo) return null;
  const passo = PASSOS[i];
  const ultimo = i === PASSOS.length - 1;

  const encerrar = (concluido: boolean) => {
    document.body.classList.remove('tour-ativo');
    marcar({ tourFeito: true });
    setAtivo(false);
    track(concluido ? 'tour_concluido' : 'tour_pulado', { passo: i });
  };

  const proximo = () => {
    if (ultimo) {
      encerrar(true);
      navigate('/perfil?editar=1', { replace: true }); // termina na edicao do perfil
      return;
    }
    setI((v) => v + 1);
  };

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-label={`Ajuda: ${passo.titulo}`}>
      <div className="tour-scrim" />
      <div className="tour-card app-chrome" key={i}>
        <div className={`tour-masc${passo.aponta ? ' tour-masc-aponta' : ''}`} aria-hidden="true">
          <Mascotinho estado={passo.estado} tamanho={84} />
        </div>
        <span className="tour-eyebrow">
          Passo {i + 1} de {PASSOS.length}
        </span>
        <h2 className="tour-titulo">{passo.titulo}</h2>
        <p className="tour-texto">{passo.texto}</p>
        <div className="tour-pontos" aria-hidden="true">
          {PASSOS.map((_, k) => (
            <span key={k} className={`tour-ponto${k === i ? ' tour-ponto-on' : ''}`} />
          ))}
        </div>
        <button type="button" className="btn btn-primary btn-jogo btn-cheio tap" onClick={proximo}>
          {passo.cta ?? (ultimo ? 'Concluir' : 'Próximo')}
        </button>
        {!ultimo && (
          <button type="button" className="tour-pular tap" onClick={() => encerrar(false)}>
            Pular
          </button>
        )}
      </div>
    </div>
  );
}
