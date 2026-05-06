import { useRef, useEffect, useState } from "react";
import { Video, Play, Loader2, Download, X, CheckCircle2, Upload, RefreshCw, ImageIcon } from "lucide-react";
import { TravelData } from "@/types/travel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDestinationImages } from "@/hooks/useDestinationImage";
import { fetchDestinationImages } from "@/lib/imageSearch";
import { saveArchiveEntry } from "@/lib/archive";
import { IMAGE_DISCLAIMER } from "@/lib/laminaRenderer";
import { loadImageNoTaint } from "@/lib/imageLoader";
import { compressImageToDataUrl } from "@/lib/imageCompress";
import { toast } from "@/hooks/use-toast";
import { Muxer, ArrayBufferTarget } from "mp4-muxer";

// ─── Canvas dimensions ────────────────────────────────────────────────────────
const PW = 300, PH = 533;   // preview (9:16 scaled)
const VW = 1080, VH = 1920; // export (full Reels/TikTok resolution)

// ─── Scene timeline (seconds) ────────────────────────────────────────────────
const SCENE_TIMES = [0, 3, 7, 11, 14, 15] as const;
const TOTAL_DURATION = 15; // seconds

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function wrapLeft(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number
): number {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineH));
  return y + lines.length * lineH;
}

function drawCenteredSmallText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  lines.slice(0, 2).forEach((l, i) => ctx.fillText(l, x, y + i * lineH));
}

function getSceneAt(t: number): { idx: number; progress: number } {
  const clamped = Math.min(t, TOTAL_DURATION - 0.001);
  for (let i = 0; i < SCENE_TIMES.length - 1; i++) {
    if (clamped < SCENE_TIMES[i + 1]) {
      const start = SCENE_TIMES[i];
      const end = SCENE_TIMES[i + 1];
      return { idx: i, progress: (clamped - start) / (end - start) };
    }
  }
  return { idx: 4, progress: 1 };
}

function textAlpha(progress: number, isLast: boolean): number {
  if (progress < 0.18) return progress / 0.18;
  if (!isLast && progress > 0.82) return 1 - (progress - 0.82) / 0.18;
  return 1;
}

// Ken Burns: subtle pan/zoom per scene
const KB_CONFIGS = [
  { s0: 1.04, s1: 1.12, x0: 0, x1: -0.02, y0: 0, y1: 0.01 },   // zoom in, drift left-down
  { s0: 1.12, s1: 1.04, x0: -0.02, x1: 0.01, y0: 0, y1: 0 },    // zoom out, drift right
  { s0: 1.08, s1: 1.08, x0: 0.02, x1: -0.02, y0: 0, y1: 0 },    // pan right→left
  { s0: 1.06, s1: 1.14, x0: 0, x1: 0, y0: 0.01, y1: -0.01 },    // zoom in, pan up
  { s0: 1.05, s1: 1.05, x0: -0.01, x1: 0.01, y0: 0, y1: 0 },    // gentle pan
];

function drawKenBurns(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  W: number,
  H: number,
  sceneIdx: number,
  progress: number
) {
  if (!img.naturalWidth) return;
  const kb = KB_CONFIGS[sceneIdx % KB_CONFIGS.length];
  const scale = kb.s0 + (kb.s1 - kb.s0) * progress;
  const ox = (kb.x0 + (kb.x1 - kb.x0) * progress) * W;
  const oy = (kb.y0 + (kb.y1 - kb.y0) * progress) * H;

  const imgAspect = img.naturalWidth / img.naturalHeight;
  const canvasAspect = W / H;
  let drawW, drawH;
  if (imgAspect > canvasAspect) {
    drawH = H * scale;
    drawW = drawH * imgAspect;
  } else {
    drawW = W * scale;
    drawH = drawW / imgAspect;
  }
  ctx.drawImage(img, (W - drawW) / 2 + ox, (H - drawH) / 2 + oy, drawW, drawH);
}

// ─── Frame renderer ───────────────────────────────────────────────────────────

function drawVideoFrame(
  canvas: HTMLCanvasElement,
  data: TravelData,
  bgImages: (HTMLImageElement | null)[],
  t: number
) {
  const W = canvas.width;
  const H = canvas.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { idx, progress } = getSceneAt(t);
  const isLast = idx === 4;
  const alpha = textAlpha(progress, isLast);

  // Build scene list
  const scenes: { tipo: string; texto: string }[] = (
    data.marketing?.reelsScript?.map((s) => ({ tipo: s.tipo, texto: s.texto })) ?? [
      { tipo: "DESTINO", texto: `${data.destino} te espera! ✈` },
      { tipo: "PACOTE", texto: `${data.hotel}\n${data.duracao} · ${data.regime}` },
      { tipo: "OFERTA", texto: `A partir de ${data.parcelas}x ${data.precoParcela}` },
      { tipo: "INCLUI", texto: (data.inclui ?? []).slice(0, 3).join("\n") || "Aéreo + Hotel + Transfer" },
      { tipo: "RESERVE JÁ", texto: "Entre em contato com a agência 📲" },
    ]
  );

  const scene = scenes[idx] ?? scenes[scenes.length - 1];

  // Use different image per scene (cycle through available)
  const img = bgImages.length > 0
    ? (bgImages[idx % bgImages.length] ?? bgImages[0])
    : null;

  // ── Background ──
  ctx.fillStyle = "#050f1e";
  ctx.fillRect(0, 0, W, H);

  if (img && img.naturalWidth > 0) {
    drawKenBurns(ctx, img, W, H, idx, progress);
  }

  // ── Gradient overlay ──
  const ov = ctx.createLinearGradient(0, 0, 0, H);
  ov.addColorStop(0, "rgba(5,15,30,0.55)");
  ov.addColorStop(0.35, "rgba(5,15,30,0.25)");
  ov.addColorStop(0.65, "rgba(5,15,30,0.30)");
  ov.addColorStop(1, "rgba(5,15,30,0.92)");
  ctx.fillStyle = ov;
  ctx.fillRect(0, 0, W, H);

  // ── BWT branding top-left ──
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 ${Math.round(H * 0.022)}px sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText("BWT OPERADORA", Math.round(W * 0.037), H * 0.088);
  ctx.globalAlpha = 1;

  const cardX = Math.round(W * 0.037);
  const cardW = W - Math.round(W * 0.074);

  const BWT_PURPLE = "#6B21A8";
  const pad = Math.round(W * 0.05);

  // ── Strong gradient only at bottom third ──────────────────────────────────
  const grad2 = ctx.createLinearGradient(0, H * 0.52, 0, H);
  grad2.addColorStop(0, "rgba(0,0,0,0)");
  grad2.addColorStop(0.35, "rgba(0,0,0,0.55)");
  grad2.addColorStop(1, "rgba(0,0,0,0.88)");
  ctx.fillStyle = grad2;
  ctx.fillRect(0, H * 0.52, W, H * 0.48);

  // ── Helper: text with drop shadow ─────────────────────────────────────────
  const shadow = (blur: number, col = "rgba(0,0,0,0.9)") => {
    ctx.shadowColor = col; ctx.shadowBlur = blur;
  };
  const noShadow = () => { ctx.shadowBlur = 0; };

  // ── Scene card — 60–74% zone ──────────────────────────────────────────────
  ctx.globalAlpha = alpha;

  const sceneFs = Math.round(H * 0.028);
  const lineH   = Math.round(H * 0.036);

  // Scene text — max 2 lines, with shadow
  const sceneLines: string[] = [];
  ctx.font = `700 ${sceneFs}px sans-serif`;
  for (const rawLine of scene.texto.split("\n")) {
    const words = rawLine.split(" ");
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > cardW && line) { sceneLines.push(line); line = w; }
      else line = test;
    }
    if (line) sceneLines.push(line);
  }
  shadow(12);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  let sy = Math.round(H * 0.64);
  for (const line of sceneLines.slice(0, 2)) {
    ctx.fillText(line, W / 2, sy);
    sy += lineH;
  }
  noShadow();
  ctx.globalAlpha = 1;

  // ── Bottom info — 80–95% zone ─────────────────────────────────────────────
  const destTxt = data.destino.toUpperCase();
  let destFs = Math.round(H * 0.052);
  ctx.font = `900 ${destFs}px sans-serif`;
  ctx.textAlign = "center";
  while (ctx.measureText(destTxt).width > cardW && destFs > 16) {
    destFs -= 2; ctx.font = `900 ${destFs}px sans-serif`;
  }
  shadow(16);
  ctx.fillStyle = "#ffffff";
  const destY = Math.round(H * 0.82);
  ctx.fillText(destTxt, W / 2, destY);
  noShadow();

  // Price pill + dates row — centered
  const rowY = destY + Math.round(H * 0.050);
  const priceTxt = `${data.parcelas}x ${data.precoParcela}`;
  ctx.font = `700 ${Math.round(H * 0.024)}px sans-serif`;
  const pPillH = Math.round(H * 0.038);
  const pPillW = ctx.measureText(priceTxt).width + Math.round(W * 0.055);
  ctx.fillStyle = BWT_PURPLE;
  rrect(ctx, W / 2 - pPillW / 2, rowY, pPillW, pPillH, pPillH / 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillText(priceTxt, W / 2, rowY + pPillH * 0.70);

  if (data.dataInicio && data.dataFim) {
    shadow(8);
    ctx.fillStyle = "rgba(255,255,255,0.70)";
    ctx.font = `500 ${Math.round(H * 0.018)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(`${data.dataInicio} → ${data.dataFim}`, W / 2, rowY + pPillH + Math.round(H * 0.026));
    noShadow();
  }

  if (data.companhiaAerea) {
    shadow(8);
    ctx.fillStyle = "rgba(255,255,255,0.80)";
    ctx.font = `700 ${Math.round(H * 0.020)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(data.companhiaAerea.toUpperCase(), W / 2, rowY + pPillH + Math.round(H * 0.052));
    noShadow();
  }

  ctx.fillStyle = "rgba(255,255,255,0.48)";
  ctx.font = `500 ${Math.round(H * 0.009)}px sans-serif`;
  ctx.textAlign = "center";
  drawCenteredSmallText(ctx, IMAGE_DISCLAIMER, W / 2, H - Math.round(H * 0.024), W * 0.88, Math.round(H * 0.012));
}

const SCENE_LABELS = ["Hook", "Produto", "Oferta", "Inclui", "CTA"];

function updateSceneImageUrls(data: TravelData, idx: number, url: string): TravelData {
  const nextUrls = [...(data.videoSceneImageUrls ?? [])];
  nextUrls[idx] = url;
  return { ...data, videoSceneImageUrls: nextUrls };
}

// ─── Component ────────────────────────────────────────────────────────────────

type Status = "idle" | "generating" | "done";

interface VideoGeneratorProps {
  data: TravelData;
  onDataChange?: (data: TravelData) => void;
}

const VideoGenerator = ({ data, onDataChange }: VideoGeneratorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const bgImagesRef = useRef<(HTMLImageElement | null)[]>([]);

  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [currentScene, setCurrentScene] = useState(0);
  const [sceneImages, setSceneImages] = useState<(HTMLImageElement | null)[]>([]);
  const [searchTerms, setSearchTerms] = useState<string[]>(["", "", "", "", ""]);
  const [refreshingIdx, setRefreshingIdx] = useState<number | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { imageEls, loading: imageLoading } = useDestinationImages(data.destino, 5);

  useEffect(() => {
    let cancelled = false;
    const urls = data.videoSceneImageUrls ?? [];
    if (!urls.some(Boolean)) return;
    Promise.all(urls.slice(0, 5).map((url) => url ? loadImageFromUrl(url) : Promise.resolve(null))).then((imgs) => {
      if (cancelled) return;
      setSceneImages((prev) => {
        const next = [...prev];
        imgs.forEach((img, idx) => { if (img) next[idx] = img; });
        return next;
      });
    });
    return () => { cancelled = true; };
  }, [data.videoSceneImageUrls]);

  // Initialize sceneImages from auto-fetched images
  useEffect(() => {
    if (imageEls.length > 0) {
      setSceneImages((prev) => {
        const next = [...prev];
        for (let i = 0; i < 5; i++) {
          if (!next[i]) next[i] = imageEls[i % imageEls.length] ?? null;
        }
        return next;
      });
    }
  }, [imageEls]);

  // Keep bgImagesRef in sync (refs don't trigger re-renders)
  useEffect(() => {
    bgImagesRef.current = sceneImages.length > 0 ? sceneImages : imageEls;
  }, [sceneImages, imageEls]);

  const loadImageFromUrl = (url: string): Promise<HTMLImageElement | null> =>
    loadImageNoTaint(url);

  const handleReplaceScene = async (idx: number) => {
    const term = searchTerms[idx]?.trim() || data.destino;
    setRefreshingIdx(idx);
    try {
      const urls = await fetchDestinationImages(term, 5);
      // Pick a random one to give variety
      const url = urls[Math.floor(Math.random() * urls.length)];
      const img = await loadImageFromUrl(url);
      if (img) {
        setSceneImages((prev) => {
          const next = [...prev];
          next[idx] = img;
          return next;
        });
        onDataChange?.(updateSceneImageUrls(data, idx, url));
      }
    } finally {
      setRefreshingIdx(null);
    }
  };

  const handleUploadScene = async (idx: number, file: File) => {
    const err = validateImageFile(file);
    if (err) {
      toast({ title: "Formato inválido", description: err, variant: "destructive" });
      return;
    }
    try {
      const url = await compressImageToDataUrl(file);
      const img = await loadImageFromUrl(url);
      if (img) {
        setSceneImages((prev) => {
          const next = [...prev];
          next[idx] = img;
          return next;
        });
        onDataChange?.(updateSceneImageUrls(data, idx, url));
      }
    } catch (err) {
      console.error("[VideoGenerator] scene upload failed", err);
      toast({ title: "Falha no upload", description: "Não foi possível processar a imagem.", variant: "destructive" });
    }
  };

  // ── Preview animation loop (idle + done) ──────────────────────────────────
  useEffect(() => {
    if (status === "generating") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = PW;
    canvas.height = PH;

    let raf: number;
    const start = performance.now();

    const loop = (now: number) => {
      const t = ((now - start) / 1000) % TOTAL_DURATION;
      drawVideoFrame(canvas, data, bgImagesRef.current, t);
      setCurrentScene(getSceneAt(t).idx);
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [status, data]);

  // ── Generate video (MP4 via VideoEncoder + mp4-muxer) ────────────────────
  const handleGenerate = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    cancelAnimationFrame(rafRef.current);
    setProgress(0);
    setStatus("generating");

    const FPS = 30;
    const TOTAL_FRAMES = TOTAL_DURATION * FPS;

    const offscreen = document.createElement("canvas");
    offscreen.width = VW;
    offscreen.height = VH;

    const muxer = new Muxer({
      target: new ArrayBufferTarget(),
      video: { codec: "avc", width: VW, height: VH },
      fastStart: "in-memory",
    });

    const encoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => console.error("[VideoEncoder]", e),
    });

    encoder.configure({
      codec: "avc1.640033",
      width: VW,
      height: VH,
      bitrate: 8_000_000,
      framerate: FPS,
    });

    let lastProgress = -1;

    try {
      for (let f = 0; f < TOTAL_FRAMES; f++) {
        const t = f / FPS;
        drawVideoFrame(canvas, data, bgImagesRef.current, t);
        drawVideoFrame(offscreen, data, bgImagesRef.current, t);

        const frame = new VideoFrame(offscreen, { timestamp: Math.round((f / FPS) * 1_000_000) });
        encoder.encode(frame, { keyFrame: f % (FPS * 2) === 0 });
        frame.close();

        const pct = Math.min(100, Math.round((f / TOTAL_FRAMES) * 100));
        if (pct !== lastProgress) {
          setProgress(pct);
          lastProgress = pct;
          // Yield to keep UI responsive every 10 frames
          if (f % 10 === 0) await new Promise((r) => setTimeout(r, 0));
        }
      }

      await encoder.flush();
      muxer.finalize();

      const { buffer } = muxer.target;
      const blob = new Blob([buffer], { type: "video/mp4" });
      saveArchiveEntry(data, "Vídeo exportado");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bwt-${data.destino.toLowerCase().replace(/\s+/g, "-")}-reels.mp4`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus("done");
    } catch (err) {
      console.error("[VideoGenerator] generation failed", err);
      try { encoder.close(); } catch { /* noop */ }
      toast({
        title: "Erro ao gerar vídeo",
        description: "A imagem de uma das cenas não pôde ser usada. Troque por outra (busca ou upload) e tente novamente.",
        variant: "destructive",
      });
      setStatus("idle");
      setProgress(0);
    }
  };

  const handleCancel = () => {
    cancelAnimationFrame(rafRef.current);
    setStatus("idle");
    setProgress(0);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Video className="w-5 h-5" style={{ color: "#9333EA" }} />
        <h2 className="text-2xl font-display font-semibold">Vídeo Viral</h2>
        {imageLoading && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            Carregando fotos...
          </span>
        )}
        {!imageLoading && imageEls.length > 0 && (
          <span className="text-xs text-emerald-600 font-medium">
            ● {imageEls.filter(Boolean).length} foto{imageEls.filter(Boolean).length !== 1 ? "s" : ""} carregada{imageEls.filter(Boolean).length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="flex flex-col items-center gap-5">
        {/* Canvas preview */}
        <div
          style={{
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: "0 16px 48px rgba(0,0,0,0.45)",
            position: "relative",
          }}
        >
          <canvas ref={canvasRef} width={PW} height={PH} style={{ display: "block" }} />
          {status !== "generating" && (
            <div
              style={{
                position: "absolute",
                bottom: 8,
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(0,0,0,0.65)",
                borderRadius: 6,
                padding: "2px 10px",
                fontSize: 11,
                fontWeight: 600,
                color: "#9333EA",
                whiteSpace: "nowrap",
              }}
            >
              Cena {currentScene + 1} · {SCENE_LABELS[currentScene] ?? ""}
            </div>
          )}
          {status === "generating" && (
            <div
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                background: "rgba(147,51,234,0.9)",
                borderRadius: 6,
                padding: "2px 8px",
                fontSize: 11,
                fontWeight: 700,
                color: "#003d45",
              }}
            >
              ● REC
            </div>
          )}
        </div>

        {/* Controls */}
        {status === "idle" && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground text-center">
              Vídeo 9:16 · 15s · 1080×1920 px · MP4 · Reels / TikTok
            </p>
            <Button
              onClick={handleGenerate}
              style={{ background: "#9333EA", color: "#fff" }}
              className="font-semibold hover:opacity-90 px-6"
            >
              <Play className="w-4 h-4 mr-2" />
              Gerar Vídeo
            </Button>
          </div>
        )}

        {/* Scene image manager */}
        {status === "idle" && (
          <div className="w-full max-w-2xl border border-border/60 rounded-xl p-4 bg-muted/30">
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon className="w-4 h-4" style={{ color: "#9333EA" }} />
              <h3 className="text-sm font-semibold">Imagens das cenas</h3>
              <span className="text-xs text-muted-foreground">— troque por busca ou upload</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SCENE_LABELS.map((label, idx) => {
                const img = sceneImages[idx];
                return (
                  <div key={idx} className="flex gap-3 p-2 rounded-lg bg-background border border-border/40">
                    <div
                      className="w-16 h-24 rounded-md overflow-hidden bg-muted shrink-0 flex items-center justify-center"
                      style={{
                        backgroundImage: img ? `url(${img.src})` : undefined,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      {!img && <ImageIcon className="w-5 h-5 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold" style={{ color: "#9333EA" }}>
                          {idx + 1}
                        </span>
                        <span className="text-xs font-semibold">{label}</span>
                      </div>
                      <Input
                        placeholder={`Buscar (ex: ${data.destino})`}
                        value={searchTerms[idx]}
                        onChange={(e) => {
                          const next = [...searchTerms];
                          next[idx] = e.target.value;
                          setSearchTerms(next);
                        }}
                        className="h-7 text-xs"
                      />
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs flex-1"
                          onClick={() => handleReplaceScene(idx)}
                          disabled={refreshingIdx === idx}
                        >
                          {refreshingIdx === idx ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3 h-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs flex-1"
                          onClick={() => fileInputRefs.current[idx]?.click()}
                        >
                          <Upload className="w-3 h-3" />
                        </Button>
                        <input
                          ref={(el) => (fileInputRefs.current[idx] = el)}
                          type="file"
                          accept={ACCEPTED_IMAGE_ACCEPT_ATTR}
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadScene(idx, f);
                            e.target.value = "";
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {status === "generating" && (
          <div className="flex flex-col items-center gap-3 w-full max-w-xs">
            <p className="text-sm text-muted-foreground">
              Gravando... {progress}% · {Math.round((progress / 100) * TOTAL_DURATION)}s de {TOTAL_DURATION}s
            </p>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${progress}%`,
                  background: "#9333EA",
                  transition: "width 0.1s linear",
                }}
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </div>
        )}

        {status === "done" && (
          <div className="flex flex-col items-center gap-3">
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
              Download do .mp4 concluído!
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleGenerate}
                style={{ background: "#9333EA", color: "#fff" }}
                className="font-semibold hover:opacity-90"
              >
                <Download className="w-4 h-4 mr-2" />
                Gerar novamente
              </Button>
              <Button variant="outline" onClick={() => setStatus("idle")}>
                Visualizar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoGenerator;
