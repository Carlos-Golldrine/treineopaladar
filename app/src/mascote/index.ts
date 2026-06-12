/**
 * API pública do mascote vivo.
 * Para trocar o mascote antigo: substituir os imports de
 * `onboarding/Mascote` por `mascote` (mesmo contrato de props).
 */
export { Tchin } from './Tchin';
export type { EstadoTchin, TchinProps } from './Tchin';

export { MascoteBalao, MascoteToast } from './Balao';

export { CenaMascote } from './CenaMascote';
export type { PassoCena, CenaMascoteProps } from './CenaMascote';

export {
  PROPS_CENA,
  PropGarrafa,
  PropTacaCha,
  PropLimao,
  PropSol,
  PropFrio,
  PropUva,
} from './PropsCena';
export type { PropCenaId } from './PropsCena';

/**
 * Compat: a dupla de taças brindando é a LOGO da marca, não o personagem.
 * Re-exportada para o swap de import não quebrar Splash/Conclusao1
 * (que usam o duo como marca, não como mascote).
 */
export { TchinDuo } from '../onboarding/Mascote';
