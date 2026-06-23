/**
 * MascoteAnalisa: o mascote animado (piscando/respirando) como video em loop,
 * gerado por IA a partir da arte do usuario. Corpo inteiro, fundo branco que
 * mescla com o bg claro do app. Autoplay mudo em loop (funciona no mobile).
 */
import './mascote-analisa.css';

export function MascoteAnalisa({ tamanho = 160, ativo = true }: { tamanho?: number; ativo?: boolean }) {
  return (
    <video
      className={`masc-analisa${ativo ? ' masc-analisa-ativo' : ''}`}
      src="/lente/mascote-blink.mp4?v=2"
      autoPlay
      loop
      muted
      playsInline
      aria-hidden="true"
      style={{ width: tamanho, height: 'auto' }}
    />
  );
}
