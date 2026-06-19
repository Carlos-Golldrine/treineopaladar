/** API publica da camada de notificacao (F3, client). */
export { PrimerNotificacao } from './PrimerNotificacao';
export { GatePrimer } from './GatePrimer';
export {
  aceitarLembretes,
  permissaoAtual,
  suportaPush,
  temIntencaoPush,
} from './push';
export type { EstadoPermissao, ResultadoPrimer } from './push';
export { setBadge, clearBadge, sincronizarBadge, temBadge } from './badge';
export { COPY_NOTIF, CATEGORIAS_NOTIF, resolverCopy } from './copy';
export type { BibliotecaCopy, CategoriaNotif, VarianteCopy } from './copy';
