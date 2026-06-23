/**
 * CameraCaptura: camera no app (getUserMedia) com MOLDURA central e VERIFICACAO de
 * qualidade em tempo real. A cada ~160ms a gente analisa SO a regiao da moldura num
 * canvas minusculo e mede sinais baratos: luz (claridade + reflexo), nitidez
 * (variancia do laplaciano), densidade de bordas (tem rotulo no quadro?) e MOVIMENTO
 * (diferenca entre frames). So dispara sozinho quando esta bom E PARADO por N frames
 * consecutivos (~1,3s) e SO depois de um atraso de armamento (da tempo de mirar) —
 * estilo scanner de documento. O botao manual continua disponivel. Mensagem ao vivo
 * orienta (mais luz, segure firme, aproxime). Lanterna (torch) onde o navegador
 * suporta (Android; iOS Safari nao deixa via web). Ao capturar, recorta EXATAMENTE a
 * moldura e reduz (max 1280px) -> OCR recebe so o rotulo. Precisa HTTPS.
 */
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import './camera.css';

const MAX_LADO = 1280;

/* ---- Verificacao de qualidade (constantes TUNAVEIS; calibrar no celular real) ---- */
const ANALISE_LARGURA = 132; // largura do canvas de analise (mantem proporcao da moldura)
const ANALISE_INTERVALO_MS = 160; // ~6 leituras por segundo
const ESTABILIDADE_TICKS = 8; // frames bons E PARADOS consecutivos pra disparar (~1,3s; casa com .cam-mira-anel)
const ARMAR_APOS_MS = 1500; // nao dispara nesse 1o intervalo: da tempo de apontar pro vinho
const MOVIMENTO_MAX = 10; // diferenca media de luma entre frames; acima disso = celular se movendo
const LUMA_ESCURO = 55; // claridade media abaixo disso = escuro
const LUMA_CLAROU = 222; // claridade media acima disso = estourado
const SATURACAO_MAX = 0.03; // fracao de pixels saturados (reflexo especular) que reprova
const NITIDEZ_MIN = 85; // variancia do laplaciano minima (foco) — exige foco de verdade
const BORDA_MIN = 0.05; // fracao minima de pixels com borda forte — superficie lisa nao passa como "tem rotulo"
const BORDA_FORTE = 22; // |laplaciano| acima disso conta como borda
const PRONTA_TIMEOUT_MS = 4000; // se o video nao "acordar" ate aqui, cai no fallback de galeria

type Qualidade = 'escuro' | 'clarao' | 'sem_rotulo' | 'borrado' | 'bom';
/* O que a UI mostra: as qualidades ruins + 'segurar' (bom mas mexendo/cedo) + 'travando' (bom e parado, contando). */
type Etapa = 'escuro' | 'clarao' | 'sem_rotulo' | 'borrado' | 'segurar' | 'travando';

const MENSAGEM: Record<Etapa, string> = {
  escuro: 'Procure um lugar mais iluminado',
  clarao: 'Muita luz, evite o reflexo',
  sem_rotulo: 'Aproxime o rótulo na moldura',
  borrado: 'Segure firme pra focar',
  segurar: 'Segure firme no rótulo',
  travando: 'Isso, segurando...',
};

/* torch nao esta nos tipos padrao do lib.dom; estendemos pontualmente. */
type CapacidadesTorch = MediaTrackCapabilities & { torch?: boolean };
type RestricaoTorch = MediaTrackConstraintSet & { torch?: boolean };

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

/* Mapeia o object-fit: cover do video pras coordenadas nativas e devolve a regiao
   da moldura (recorte). Usado pela captura E pela analise (mesma area). */
function regiaoMolduraNativa(v: HTMLVideoElement, m: HTMLElement) {
  const vw = v.videoWidth;
  const vh = v.videoHeight;
  const vr = v.getBoundingClientRect();
  const fr = m.getBoundingClientRect();
  const escala = Math.max(vr.width / vw, vr.height / vh);
  const offX = (vr.width - vw * escala) / 2;
  const offY = (vr.height - vh * escala) / 2;
  let nx = (fr.left - vr.left - offX) / escala;
  let ny = (fr.top - vr.top - offY) / escala;
  let nw = fr.width / escala;
  let nh = fr.height / escala;
  nx = Math.max(0, Math.min(nx, vw));
  ny = Math.max(0, Math.min(ny, vh));
  nw = Math.min(nw, vw - nx);
  nh = Math.min(nh, vh - ny);
  return { nx, ny, nw, nh };
}

/* Analisa um frame: devolve a qualidade, a luma (pra comparar movimento no proximo)
   e se esta PARADO em relacao ao frame anterior. */
function analisarFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  prevLuma: Float32Array | null,
): { q: Qualidade; luma: Float32Array; estavel: boolean } {
  const { data } = ctx.getImageData(0, 0, w, h);
  const total = w * h;
  const luma = new Float32Array(total);
  let somaLuma = 0;
  let saturados = 0;
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const y = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    luma[p] = y;
    somaLuma += y;
    if (y > 250) saturados++;
  }

  // movimento: diferenca media de luma vs frame anterior (mesmo tamanho)
  let estavel = false;
  if (prevLuma && prevLuma.length === total) {
    let dif = 0;
    for (let p = 0; p < total; p++) dif += Math.abs(luma[p] - prevLuma[p]);
    estavel = dif / total < MOVIMENTO_MAX;
  }

  const media = somaLuma / total;
  let q: Qualidade;
  if (media < LUMA_ESCURO) q = 'escuro';
  else if (media > LUMA_CLAROU || saturados / total > SATURACAO_MAX) q = 'clarao';
  else {
    let soma = 0;
    let soma2 = 0;
    let n = 0;
    let bordas = 0;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const p = y * w + x;
        const lap = 4 * luma[p] - luma[p - 1] - luma[p + 1] - luma[p - w] - luma[p + w];
        soma += lap;
        soma2 += lap * lap;
        n++;
        if (lap > BORDA_FORTE || lap < -BORDA_FORTE) bordas++;
      }
    }
    const variancia = n === 0 ? 0 : Math.max(0, soma2 / n - (soma / n) ** 2);
    if (n === 0 || bordas / n < BORDA_MIN) q = 'sem_rotulo';
    else if (variancia < NITIDEZ_MIN) q = 'borrado';
    else q = 'bom';
  }
  return { q, luma, estavel };
}

function textoDica(e: Etapa | null, torchOk: boolean, torchOn: boolean): string {
  if (e == null) return 'Centralize o rótulo na moldura';
  if (e === 'escuro' && torchOk && !torchOn) return 'Ambiente escuro: toque na luz';
  return MENSAGEM[e];
}

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
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const analiseRef = useRef<HTMLCanvasElement | null>(null);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bomConsecutivoRef = useRef(0);
  const prevLumaRef = useRef<Float32Array | null>(null);
  const analiseDesdeRef = useRef(0); // instante em que a analise (re)comecou — base do armamento
  /* vivoRef: o componente ainda esta montado/ativo? Re-checado apos CADA await pra
     nao criar timer orfao nem chamar onCapturar de uma camera ja fechada. */
  const vivoRef = useRef(true);
  const capturandoRef = useRef(false);
  const prontaRef = useRef(false);
  /* prop sempre atual (evita closure velha no auto-disparo do intervalo) */
  const onCapturarRef = useRef(onCapturar);
  onCapturarRef.current = onCapturar;

  const [pronta, setPronta] = useState(false);
  const [erro, setErro] = useState(false);
  const [etapa, setEtapa] = useState<Etapa | null>(null);
  const [torchSuportado, setTorchSuportado] = useState(false);
  const [torchLigado, setTorchLigado] = useState(false);
  /* Foto tirada aguardando confirmacao ("Quer usar essa foto?"). Null = camera ao vivo. */
  const [revisao, setRevisao] = useState<{ file: File; url: string } | null>(null);

  const pararAnalise = () => {
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current);
      intervaloRef.current = null;
    }
  };

  const iniciarAnalise = () => {
    if (intervaloRef.current) return;
    bomConsecutivoRef.current = 0;
    prevLumaRef.current = null;
    analiseDesdeRef.current = performance.now();
    intervaloRef.current = setInterval(() => tickRef.current(), ANALISE_INTERVALO_MS);
  };

  const pararStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop()); // parar a track tambem apaga o torch/LED
    streamRef.current = null;
    trackRef.current = null;
  };

  const capturar = async () => {
    if (capturandoRef.current) return;
    const v = videoRef.current;
    const m = molduraRef.current;
    if (!v || !v.videoWidth || !m) return;
    capturandoRef.current = true;
    const { nx, ny, nw, nh } = regiaoMolduraNativa(v, m);
    const file = await canvasParaArquivo(recortarReduzido(v, nx, ny, nw, nh));
    if (!vivoRef.current) return; // desmontou/cancelou durante o await: nada de foto fantasma
    if (!file) {
      // toBlob falhou (pressao de memoria): nao trava a analise, deixa tentar de novo
      capturandoRef.current = false;
      bomConsecutivoRef.current = 0;
      return;
    }
    // Nao envia ainda: mostra "Quer usar essa foto?". O stream fica congelado
    // (track.enabled=false) pra "Tirar outra" voltar instantaneo, sem reabrir a camera.
    pararAnalise();
    if (trackRef.current) trackRef.current.enabled = false;
    setRevisao({ file, url: URL.createObjectURL(file) });
  };

  /* tick recriado a cada render (closures frescas); o intervalo chama a versao atual. */
  const tickRef = useRef<() => void>(() => {});
  tickRef.current = () => {
    if (capturandoRef.current || document.hidden) return;
    const v = videoRef.current;
    const m = molduraRef.current;
    let cv = analiseRef.current;
    if (!v || !v.videoWidth || !m) return;
    if (!cv) {
      cv = document.createElement('canvas');
      analiseRef.current = cv;
    }
    const { nx, ny, nw, nh } = regiaoMolduraNativa(v, m);
    if (nw < 8 || nh < 8) return;
    const escala = ANALISE_LARGURA / nw;
    const cw = ANALISE_LARGURA;
    const ch = Math.max(1, Math.round(nh * escala));
    if (cv.width !== cw || cv.height !== ch) {
      cv.width = cw;
      cv.height = ch;
      prevLumaRef.current = null; // tamanho mudou: zera a base de movimento
    }
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(v, nx, ny, nw, nh, 0, 0, cw, ch);

    const { q, luma, estavel } = analisarFrame(ctx, cw, ch, prevLumaRef.current);
    prevLumaRef.current = luma;
    const armado = performance.now() - analiseDesdeRef.current > ARMAR_APOS_MS;

    let proxima: Etapa;
    if (q !== 'bom') proxima = q; // escuro / clarao / sem_rotulo / borrado
    else if (!estavel || !armado) proxima = 'segurar'; // bom, mas mexendo ou cedo demais
    else proxima = 'travando'; // bom, parado e armado: comeca a travar
    setEtapa((prev) => (prev === proxima ? prev : proxima));

    if (proxima === 'travando') {
      bomConsecutivoRef.current += 1;
      if (bomConsecutivoRef.current >= ESTABILIDADE_TICKS) void capturar();
    } else {
      bomConsecutivoRef.current = 0;
    }
  };

  /* Abre a camera. setPronta SO quando o video tem dimensoes (loadeddata) ou cai no
     fallback de erro depois de PRONTA_TIMEOUT_MS — nunca uma "tela preta pronta". */
  useEffect(() => {
    vivoRef.current = true;
    const v = videoRef.current;
    let fallback: ReturnType<typeof setTimeout> | null = null;

    const marcarPronta = () => {
      if (!vivoRef.current || prontaRef.current) return;
      prontaRef.current = true;
      setPronta(true);
    };

    (async () => {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
      } catch {
        if (vivoRef.current) setErro(true);
        return;
      }
      if (!vivoRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      const track = stream.getVideoTracks()[0] ?? null;
      trackRef.current = track;
      const caps = (track?.getCapabilities?.() ?? {}) as CapacidadesTorch;
      if (caps.torch) setTorchSuportado(true);
      if (!v) {
        setErro(true);
        pararStream();
        return;
      }
      v.srcObject = stream;
      try {
        await v.play();
      } catch {
        /* autoplay/gesto (iOS): segue; o loadeddata abaixo cobre quando houver frame */
      }
      if (!vivoRef.current) {
        pararStream();
        return;
      }
      if (v.videoWidth > 0) marcarPronta();
      else {
        v.addEventListener('loadeddata', marcarPronta, { once: true });
        v.addEventListener('playing', marcarPronta, { once: true });
      }
      iniciarAnalise();
      fallback = setTimeout(() => {
        if (vivoRef.current && !prontaRef.current) {
          pararAnalise();
          setErro(true);
        }
      }, PRONTA_TIMEOUT_MS);
    })();

    return () => {
      vivoRef.current = false;
      if (fallback) clearTimeout(fallback);
      pararAnalise();
      pararStream();
    };
  }, []);

  /* Background: para a analise e desliga o sensor (track.enabled=false apaga o LED)
     pra nao drenar bateria com o app fora de foco; religa ao voltar (re-armando). */
  useEffect(() => {
    const aoMudarVisibilidade = () => {
      const track = trackRef.current;
      if (document.hidden) {
        pararAnalise();
        if (track) track.enabled = false;
      } else if (vivoRef.current && !capturandoRef.current && streamRef.current) {
        if (track) track.enabled = true;
        iniciarAnalise();
      }
    };
    document.addEventListener('visibilitychange', aoMudarVisibilidade);
    return () => document.removeEventListener('visibilitychange', aoMudarVisibilidade);
  }, []);

  const alternarTorch = async () => {
    const track = trackRef.current;
    if (!track) return;
    const novo = !torchLigado;
    try {
      await track.applyConstraints({ advanced: [{ torch: novo } as RestricaoTorch] });
      setTorchLigado(novo);
    } catch {
      /* o aparelho disse que suporta mas recusou: desabilita pra nao enganar */
      setTorchSuportado(false);
    }
  };

  const aoGaleria = async (e: ChangeEvent<HTMLInputElement>) => {
    const original = e.target.files?.[0];
    e.target.value = '';
    if (!original) return;
    capturandoRef.current = true;
    vivoRef.current = false;
    pararAnalise();
    pararStream();
    /* Da galeria nao ha moldura: so reduz (sem recortar) pra acelerar o OCR. */
    const img = new Image();
    img.src = URL.createObjectURL(original);
    try {
      await img.decode();
      const file = await canvasParaArquivo(
        recortarReduzido(img, 0, 0, img.naturalWidth, img.naturalHeight),
      );
      onCapturarRef.current(file ?? original);
    } catch {
      onCapturarRef.current(original);
    } finally {
      URL.revokeObjectURL(img.src);
    }
  };

  const cancelar = () => {
    capturandoRef.current = true;
    vivoRef.current = false;
    pararAnalise();
    pararStream();
    onCancelar();
  };

  /* Confirma a foto da revisao: envia pro processamento (OCR -> quiz). */
  const usarFoto = () => {
    if (!revisao) return;
    pararStream();
    vivoRef.current = false;
    onCapturarRef.current(revisao.file);
  };

  /* "Tirar outra": descarta a revisao e volta pra camera ao vivo (re-arma a analise). */
  const tirarOutra = () => {
    setRevisao(null);
    capturandoRef.current = false;
    if (trackRef.current) trackRef.current.enabled = true;
    iniciarAnalise();
  };

  /* Revoga o Object URL da foto revisada ao trocar/desmontar (evita vazamento). */
  useEffect(() => {
    return () => {
      if (revisao) URL.revokeObjectURL(revisao.url);
    };
  }, [revisao]);

  const molduraOk = etapa === 'travando';

  return (
    <div className="cam">
      {!erro && <video ref={videoRef} className="cam-video" playsInline muted />}

      <div className="cam-overlay" aria-hidden="true">
        <div className={`cam-moldura${molduraOk ? ' cam-moldura-ok' : ''}`} ref={molduraRef}>
          <span className="cam-canto cam-canto-tl" />
          <span className="cam-canto cam-canto-tr" />
          <span className="cam-canto cam-canto-bl" />
          <span className="cam-canto cam-canto-br" />
          {molduraOk && <span className="cam-mira-anel" />}
        </div>
        <p className="cam-dica" aria-live="polite">
          {erro ? '' : textoDica(etapa, torchSuportado, torchLigado)}
        </p>
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

        {torchSuportado && (
          <button
            type="button"
            className={`cam-torch tap${torchLigado ? ' cam-torch-ativo' : ''}${
              etapa === 'escuro' && !torchLigado ? ' cam-torch-sugerir' : ''
            }`}
            onClick={() => void alternarTorch()}
            aria-label={torchLigado ? 'Desligar a luz' : 'Ligar a luz'}
            aria-pressed={torchLigado}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path d="M13 2 L5 13 h5 l-1 9 8-12 h-5 z" fill="currentColor" />
            </svg>
          </button>
        )}
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
          className={`cam-shutter tap${molduraOk ? ' cam-shutter-ok' : ''}`}
          onClick={() => void capturar()}
          disabled={!pronta}
          aria-label="Tirar foto"
        />

        <span className="cam-espaco" />
      </div>

      {revisao && (
        <div className="cam-revisao">
          <img className="cam-revisao-img" src={revisao.url} alt="Foto do rótulo" />
          <div className="cam-revisao-barra">
            <p className="cam-revisao-msg">Quer usar essa foto?</p>
            <div className="cam-revisao-acoes">
              <button type="button" className="cam-revisao-sim tap" onClick={usarFoto}>
                Usar essa foto
              </button>
              <button type="button" className="cam-revisao-outra tap" onClick={tirarOutra}>
                Tirar outra
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
