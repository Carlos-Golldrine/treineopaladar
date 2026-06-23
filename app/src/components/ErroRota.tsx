/**
 * Tela amigavel quando uma rota nao carrega (errorElement do router). O caso
 * comum e o "chunk antigo" pos-deploy: dispara a recuperacao (limpa cache do
 * PWA + atualiza o SW + recarrega) e mostra "Atualizando" no lugar do erro feio.
 */
import { useEffect } from 'react';
import { recuperarChunk } from '../lib/recuperarChunk';

export default function ErroRota() {
  useEffect(() => {
    void recuperarChunk();
  }, []);
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
        textAlign: 'center',
        background: 'var(--bg)',
      }}
    >
      <div>
        <p style={{ font: '600 1.25rem/1.3 var(--font-display)', color: 'var(--wine-900)', margin: 0 }}>
          Atualizando o app
        </p>
        <p style={{ marginTop: '8px', fontSize: '0.9rem', color: 'var(--neutral-600)' }}>
          Pegando a versão mais nova. Só um instante.
        </p>
      </div>
    </div>
  );
}
