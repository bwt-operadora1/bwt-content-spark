import { useRef, useEffect, useState } from "react";
import { Video, Play, Loader2, Download, X, CheckCircle2 } from "lucide-react";
import { TravelData } from "@/types/travel";
import { Button } from "@/components/ui/button";
import { useDestinationImage } from "@/hooks/useDestinationImage";

// ─── Canvas dimensions ────────────────────────────────────────────────────────
const PW = 270, PH = 480;   // preview (9:16 scaled)
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

function wrapCenter(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  maxW: number,
  lineH: number
) {
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
  const startY = cy - ((lines.length - 1) * lineH) / 2;
  lines.forEach((l, i) => ctx.fillText(l, cx, startY + i * lineH));
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
  if (progress < 0.22) return progress / 0.22;
  if (!isLast && progress > 0.80) return 1 - (progress - 0.80) / 0.20;
  return 1;
}

// ─── Frame renderer ───────────────────────────────────────────────────────────

function drawVideoFrame(
  canvas: HTMLCanvasElement,
  data: TravelData,
  bgImage: HTMLImageElement | null,
  t: number
) {
  const W = canvas.width;
  const H = canvas.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { idx, progress } = getSceneAt(t);
  const isLast = idx === 4;
  const alpha = textAlpha(progress, isLast);

  // Build scene list from Gemini output or use sensible defaults
  const scenes: { tipo: string; texto: string }[] = (
    data.marketing?.reelsScript?.map((s) => ({ tipo: s.tipo, texto: s.texto })) ?? [
      { tipo: "Hook", texto: `${data.destino} te espera! ✈ Que tal essa viagem?` },
      { tipo: "Produto", texto: `${data.hotel} · ${data.duracao} · ${data.regime}` },
      { tipo: "Oferta", texto: `${data.precoParcela}/mês · ${data.precoAVista} à vista` },
      {
        tipo: "Inclui",
        texto: (data.inclui ?? []).slice(0, 3).join(" · ") || "Aéreo + Hotel + Transfer",
      },
      { tipo: "CTA", texto: "Reserve agora! Entre em contato com a agência 📲" },
    ]
  );

  const scene = scenes[idx] ?? scenes[scenes.length - 1];

  // ── Background ──
  ctx.fillStyle = "#0a1520";
  ctx.fillRect(0, 0, W, H);

  if (bgImage && bgImage.naturalWidth > 0) {
    const scale = Math.max(W / bgImage.naturalWidth, H / bgImage.naturalHeight);
    const sw = bgImage.naturalWidth * scale;
    const sh = bgImage.naturalHeight * scale;
    ctx.drawImage(bgImage, (W - sw) / 2, (H - sh) / 2, sw, sh);
  }

  // ── Gradient overlay ──
  const ov = ctx.createLinearGradient(0, 0, 0, H);
  ov.addColorStop(0, "rgba(5,15,30,0.62)");
  ov.addColorStop(0.4, "rgba(5,15,30,0.38)");
  ov.addColorStop(1, "rgba(5,15,30,0.88)");
  ctx.fillStyle = ov;
  ctx.fillRect(0, 0, W, H);

  // ── Scene indicator dots (top) ──
  for (let i = 0; i < 5; i++) {
    const r = i === idx ? W * 0.014 : W * 0.009;
    ctx.beginPath();
    ctx.arc(W * (0.28 + i * 0.11), H * 0.072, r, 0, Math.PI * 2);
    ctx.fillStyle = i === idx ? "#00b4c8" : "rgba(255,255,255,0.3)";
    ctx.fill();
  }

  // ── Scene type label ──
  ctx.globalAlpha = alpha * 0.85;
  ctx.fillStyle = "#00b4c8";
  ctx.font = `600 ${Math.round(H * 0.024)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(scene.tipo.toUpperCase(), W / 2, H * 0.37);

  // ── Main scene text ──
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 ${Math.round(H * 0.048)}px sans-serif`;
  ctx.textAlign = "center";
  wrapCenter(ctx, scene.texto, W / 2, H * 0.49, W * 0.84, Math.round(H * 0.058));

  // ── Always-visible bottom section ──
  ctx.globalAlpha = 1;

  // Destination name
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 ${Math.round(H * 0.062)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(data.destino.toUpperCase(), W / 2, H * 0.796);

  // Price pill
  const pillTxt = `${data.precoPorPessoa} / pessoa`;
  ctx.font = `700 ${Math.round(H * 0.029)}px sans-serif`;
  const pW = ctx.measureText(pillTxt).width + W * 0.07;
  const pH = H * 0.052;
  const pX = (W - pW) / 2;
  const pY = H * 0.828;
  ctx.fillStyle = "#00b4c8";
  rrect(ctx, pX, pY, pW, pH, pH / 2);
  ctx.fill();
  ctx.fillStyle = "#003d45";
  ctx.fillText(pillTxt, W / 2, pY + pH * 0.68);

  // Progress bar
  const barY = H * 0.925;
  const barW = W * 0.82;
  const barH2 = Math.max(2, H * 0.004);
  const barX = (W - barW) / 2;
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(barX, barY, barW, barH2);
  ctx.fillStyle = "#00b4c8";
  ctx.fillRect(barX, barY, barW * (t / TOTAL_DURATION), barH2);

  ctx.globalAlpha = 1;
}

// ─── Component ────────────────────────────────────────────────────────────────

type Status = "idle" | "generating" | "done";

interface VideoGeneratorProps {
  data: TravelData;
}

const VideoGenerator = ({ data }: VideoGeneratorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const rafRef = useRef<number>(0);
  const bgImageRef = useRef<HTMLImageElement | null>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);

  const { imageEl, loading: imageLoading } = useDestinationImage(data.destino);

  // Keep bgImageRef in sync (refs don't trigger re-renders)
  useEffect(() => {
    bgImageRef.current = imageEl;
  }, [imageEl]);

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
      drawVideoFrame(canvas, data, bgImageRef.current, t);
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [status, data]);

  // ── Generate video ────────────────────────────────────────────────────────
  const handleGenerate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Stop preview loop
    cancelAnimationFrame(rafRef.current);

    canvas.width = PW;
    canvas.height = PH;

    chunksRef.current = [];
    setProgress(0);
    setStatus("generating");

    // High-res offscreen canvas for recording
    const offscreen = document.createElement("canvas");
    offscreen.width = VW;
    offscreen.height = VH;

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
      ? "video/webm;codecs=vp8"
      : "video/webm";

    const stream = offscreen.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType });
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bwt-${data.destino.toLowerCase().replace(/\s+/g, "-")}-reels.webm`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus("done");
    };

    recorder.start();

    const DURATION_MS = TOTAL_DURATION * 1000;
    const start = performance.now();
    let lastProgress = -1;

    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / 1000, TOTAL_DURATION);

      // Draw to preview canvas and offscreen recording canvas
      drawVideoFrame(canvas, data, bgImageRef.current, t);
      drawVideoFrame(offscreen, data, bgImageRef.current, t);

      // Only update React state when the integer percentage changes (avoids 60 re-renders/sec)
      const pct = Math.min(100, Math.round((elapsed / DURATION_MS) * 100));
      if (pct !== lastProgress) {
        setProgress(pct);
        lastProgress = pct;
      }

      if (elapsed < DURATION_MS) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        recorder.stop();
      }
    };

    rafRef.current = requestAnimationFrame(animate);
  };

  const handleCancel = () => {
    cancelAnimationFrame(rafRef.current);
    recorderRef.current?.stop();
    setStatus("idle");
    setProgress(0);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Video className="w-5 h-5" style={{ color: "#00b4c8" }} />
        <h2 className="text-2xl font-display font-semibold">Vídeo Viral</h2>
        {imageLoading && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            Carregando foto...
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
          {status === "generating" && (
            <div
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                background: "rgba(0,180,200,0.9)",
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
              Vídeo 9:16 · 15s · 1080×1920 px · Reels / TikTok
            </p>
            <Button
              onClick={handleGenerate}
              style={{ background: "#00b4c8", color: "#0d1b2a" }}
              className="font-semibold hover:opacity-90 px-6"
            >
              <Play className="w-4 h-4 mr-2" />
              Gerar Vídeo
            </Button>
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
                  background: "#00b4c8",
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
              Download do .webm concluído!
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleGenerate}
                style={{ background: "#00b4c8", color: "#0d1b2a" }}
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
