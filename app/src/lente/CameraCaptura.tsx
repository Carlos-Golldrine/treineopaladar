/**
 * CameraCaptura: camera dentro do app (getUserMedia) com uma MOLDURA central pra
 * a pessoa centralizar o rotulo. Ao capturar, recorta a regiao central (3:4) ->
 * File JPEG. Reserva: escolher da galeria. Precisa de HTTPS (ou localhost).
 */
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import './camera.css';

export function CameraCaptura({
  onCapturar,
  onCancelar,
}: {
  onCapturar: (file: File) => void;
  onCancelar: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
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

  const capturar = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const vw = v.videoWidth;
    const vh = v.videoHeight;
    /* Recorte central com a proporcao da moldura (3:4). */
    const aspect = 3 / 4;
    let ch = vh * 0.86;
    let cw = ch * aspect;
    if (cw > vw * 0.92) {
      cw = vw * 0.92;
      ch = cw / aspect;
    }
    const cx = (vw - cw) / 2;
    const cy = (vh - ch) / 2;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(cw);
    canvas.height = Math.round(ch);
    canvas.getContext('2d')!.drawImage(v, cx, cy, cw, ch, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        pararStream();
        onCapturar(new File([blob], 'rotulo.jpg', { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.92,
    );
  };

  const aoGaleria = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    pararStream();
    onCapturar(file);
  };

  const cancelar = () => {
    pararStream();
    onCancelar();
  };

  return (
    <div className="cam">
      {!erro && <video ref={videoRef} className="cam-video" playsInline muted />}

      <div className="cam-overlay" aria-hidden="true">
        <div className="cam-moldura">
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
