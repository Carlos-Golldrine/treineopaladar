/**
 * CameraCaptura: camera no app (getUserMedia) com MOLDURA central. Ao capturar,
 * recorta EXATAMENTE a regiao da moldura (mapeando o object-fit: cover do video
 * pras coordenadas nativas) e reduz a imagem (max 1280px) -> o OCR recebe so o
 * rotulo, menor e mais rapido. Reserva: galeria (tambem reduzida). Precisa HTTPS.
 */
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import './camera.css';

const MAX_LADO = 1280;

/* Desenha um recorte da fonte (video/imagem) num canvas reduzido (max MAX_LADO). */
function recortarReduzido(
  source: CanvasImageSource,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
): HTMLCanvasElement {
  const escala = Math.min(1, MAX_LADO / Math.max(sw, sh));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(sw * escala));
  canvas.height = Math.max(1, Math.round(sh * escala));
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas;
}

const canvasParaArquivo = (canvas: HTMLCanvasElement): Promise<File | null> =>
  new Promise((resolve) =>
    canvas.toBlob(
      (blob) => resolve(blob ? new File([blob], 'rotulo.jpg', { type: 'image/jpeg' }) : null),
      'image/jpeg',
      0.85,
    ),
  );

export function CameraCaptura({
  onCapturar,
  onCancelar,
}: {
  onCapturar: (file: File) => void;
  onCancelar: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const molduraRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [pronta, setPronta] = useState(false);
  const [erro, setErro] = useState(false);

  const pararStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (!vivo) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setPronta(true);
      } catch {
        setErro(true);
      }
    })();
    return () => {
      vivo = false;
      pararStream();
    };
  }, []);

  const capturar = async () => {
    const v = videoRef.current;
    const m = molduraRef.current;
    if (!v || !v.videoWidth || !m) return;
    const vw = v.videoWidth;
    const vh = v.videoHeight;
    const vr = v.getBoundingClientRect();
    const fr = m.getBoundingClientRect();
    /* object-fit: cover -> o video e escalado e centralizado, sobra cortada. */
    const escala = Math.max(vr.width / vw, vr.height / vh);
    const offX = (vr.width - vw * escala) / 2;
    const offY = (vr.height - vh * escala) / 2;
    /* moldura (tela) -> coordenadas nativas do video. */
    let nx = (fr.left - vr.left - offX) / escala;
    let ny = (fr.top - vr.top - offY) / escala;
    let nw = fr.width / escala;
    let nh = fr.height / escala;
    nx = Math.max(0, Math.min(nx, vw));
    ny = Math.max(0, Math.min(ny, vh));
    nw = Math.min(nw, vw - nx);
    nh = Math.min(nh, vh - ny);
    const file = await canvasParaArquivo(recortarReduzido(v, nx, ny, nw, nh));
    if (!file) return;
    pararStream();
    onCapturar(file);
  };

  const aoGaleria = async (e: ChangeEvent<HTMLInputElement>) => {
    const original = e.target.files?.[0];
    e.target.value = '';
    if (!original) return;
    pararStream();
    /* Da galeria nao ha moldura: so reduz (sem recortar) pra acelerar o OCR. */
    try {
      const img = new Image();
      img.src = URL.createObjectURL(original);
      await img.decode();
      const file = await canvasParaArquivo(
        recortarReduzido(img, 0, 0, img.naturalWidth, img.naturalHeight),
      );
      URL.revokeObjectURL(img.src);
      onCapturar(file ?? original);
    } catch {
      onCapturar(original);
    }
  };

  const cancelar = () => {
    pararStream();
    onCancelar();
  };

  return (
    <div className="cam">
      {!erro && <video ref={videoRef} className="cam-video" playsInline muted />}

      <div className="cam-overlay" aria-hidden="true">
        <div className="cam-moldura" ref={molduraRef}>
          <span className="cam-canto cam-canto-tl" />
          <span className="cam-canto cam-canto-tr" />
          <span className="cam-canto cam-canto-bl" />
          <span className="cam-canto cam-canto-br" />
        </div>
        <p className="cam-dica">{erro ? '' : 'Centralize o rótulo na moldura'}</p>
      </div>

      {erro && (
        <div className="cam-erro">
          <p>Não consegui abrir a câmera. Escolha uma foto da galeria.</p>
        </div>
      )}

      <header className="cam-topo">
        <button type="button" className="cam-x tap" onClick={cancelar} aria-label="Fechar">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
            <path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <div className="cam-acoes">
        <label className="cam-galeria tap" aria-label="Escolher da galeria">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="2" />
            <circle cx="8.5" cy="10" r="1.6" fill="currentColor" />
            <path d="M5 18 L10 12 L14 16 L17 13 L21 18" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          </svg>
          <input type="file" accept="image/*" onChange={aoGaleria} hidden />
        </label>

        <button
          type="button"
          className="cam-shutter tap"
          onClick={capturar}
          disabled={!pronta}
          aria-label="Tirar foto"
        />

        <span className="cam-espaco" />
      </div>
    </div>
  );
}
