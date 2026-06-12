/**
 * Laboratório do mascote (rota demo, dev only).
 * Aceita query string:
 *   ?estado=feliz            abre direto no estado
 *   ?estado=feliz&rajada=1   abre em idle e troca aos 500ms (captura de rajada)
 *   ?cena=1                  foca a micro-cena
 * No app real o integrador monta este componente em /mascote (dev).
 */
import { useEffect, useMemo, useState } from 'react';
import { Tchin, type EstadoTchin } from './Tchin';
import { MascoteBalao } from './Balao';
import { CenaMascote, type PassoCena } from './CenaMascote';
import './mascote.css';

const ESTADOS: EstadoTchin[] = ['idle', 'feliz', 'lamenta', 'ensina', 'celebra', 'surpreso'];

/* Micro-aula demo: o tanino, na voz do Tchin (máx 8 palavras por fala) */
const ROTEIRO_DEMO: PassoCena[] = [
  { estado: 'ensina', fala: 'Já sentiu a boca amarrar?', prop: 'taca-cha', duracaoMs: 2600 },
  { estado: 'surpreso', fala: 'Isso tem nome: tanino.', prop: 'uva', duracaoMs: 2400 },
  { estado: 'feliz', fala: 'Vem da casca da uva.', prop: 'uva', duracaoMs: 2400 },
  { estado: 'celebra', fala: 'Um brinde à descoberta!', prop: 'garrafa', duracaoMs: 3200 },
];

function lerQuery() {
  return new URLSearchParams(window.location.search);
}

export default function DemoMascote() {
  const q = useMemo(lerQuery, []);
  const alvo = q.get('estado') as EstadoTchin | null;
  const estadoAlvo = alvo && ESTADOS.includes(alvo) ? alvo : null;
  const rajada = q.get('rajada') === '1';

  const [estado, setEstado] = useState<EstadoTchin>(estadoAlvo && !rajada ? estadoAlvo : 'idle');
  const [cenaKey, setCenaKey] = useState(0);

  /* Rajada: nasce em idle e troca aos 500ms, p/ capturar a transição */
  useEffect(() => {
    if (rajada && estadoAlvo && estadoAlvo !== 'idle') {
      const t = window.setTimeout(() => setEstado(estadoAlvo), 500);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="tchin-demo">
      <h1>Tchin, o mascote vivo</h1>

      <div className="tchin-demo-pills app-chrome" role="group" aria-label="Estados do mascote">
        {ESTADOS.map((e) => (
          <button
            key={e}
            type="button"
            className="tchin-demo-pill tap"
            aria-pressed={estado === e}
            onClick={() => setEstado(e)}
          >
            {e}
          </button>
        ))}
      </div>

      <div id="palco" className="tchin-demo-palco">
        <Tchin estado={estado} tamanho={200} primeiraPiscadaMs={rajada ? 900 : undefined} />
      </div>

      <MascoteBalao texto="Toque na tela: eu sigo com os olhos." />

      <section className="tchin-demo-secao">
        <h2>Micro-cena (roteiro declarativo)</h2>
        <div id="cena">
          <CenaMascote
            key={cenaKey}
            roteiro={ROTEIRO_DEMO}
            aoTerminar={() => {
              /* No app real: fechar a micro-aula */
            }}
          />
        </div>
        <div className="tchin-demo-pills" style={{ marginTop: 12 }}>
          <button type="button" className="tchin-demo-pill tap" onClick={() => setCenaKey((k) => k + 1)}>
            Repetir cena
          </button>
        </div>
      </section>
    </main>
  );
}
