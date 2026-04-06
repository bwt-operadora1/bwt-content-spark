import { Download, Image as ImageIcon, RefreshCw } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { TravelData } from "@/types/travel";
import { Button } from "@/components/ui/button";

interface CanvasPreviewProps {
  data: TravelData;
}

const COND_PADRAO =
  "Valores por pessoa em Reais. Sujeito a disponibilidade e alterações sem prévio aviso. Parcelamento em até 10x, respeitando parcela mínima de R$ 150,00. Nos reservamos o direito a correções de possíveis erros de digitação. Consulte regras gerais em www.bwtoperadora.com.br";

// Paleta por destino
const PALETTES: Record<string, [string, string, string, string]> = {
  // [sky, water, sand, palm]
  cancun: ["#87ceeb", "#00bcd4", "#f4d03f", "#1a6e30"],
  cancún: ["#87ceeb", "#00bcd4", "#f4d03f", "#1a6e30"],
  "punta cana": ["#87d3eb", "#20b2aa", "#f5deb3", "#1a7a40"],
  aruba: ["#a8d8ea", "#00ced1", "#deb887", "#8b6914"],
  jamaica: ["#7ec8e3", "#008080", "#f0e68c", "#1a6e20"],
  bahamas: ["#b0e0e6", "#40e0d0", "#ffe4b5", "#2a8a50"],
  cuba: ["#87ceeb", "#008b8b", "#d2b48c", "#8b6914"],
  europa: ["#b0c4de", "#4169e1", "#e8e8e8", "#2a3a6e"],
  paris: ["#b0c4de", "#4169e1", "#e8e8e8", "#2a3a6e"],
  miami: ["#87ceeb", "#00ced1", "#fffacd", "#20a050"],
  orlando: ["#87ceeb", "#1e90ff", "#ffd700", "#1a6e30"],
  default: ["#87ceeb", "#00bcd4", "#f4d03f", "#1a6e30"],
};

function getPalette(destino: string): [string, string, string, string] {
  const d = destino.toLowerCase();
  for (const [k, v] of Object.entries(PALETTES)) {
    if (d.includes(k)) return v;
  }
  return PALETTES.default;
}

// ─── Funções de desenho ────────────────────────────────────────────────────────

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

function drawPalm(ctx: CanvasRenderingContext2D, px: number, py: number, size: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.05;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(px, py + size);
  ctx.quadraticCurveTo(px + size * 0.1, py + size * 0.5, px + size * 0.05, py);
  ctx.stroke();
  const fronds = [
    [-0.5, 0],
    [0, -0.05],
    [0.45, 0.05],
  ];
  fronds.forEach(([angle]) => {
    ctx.save();
    ctx.translate(px + size * 0.05, py);
    ctx.rotate(angle as number);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.32, size * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
  ctx.restore();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number,
): number {
  const words = text.split(" ");
  let line = "";
  let cy = y;
  for (const w of words) {
    const test = line + (line ? " " : "") + w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, cy);
      cy += lineH;
      line = w;
    } else line = test;
  }
  if (line) {
    ctx.fillText(line, x, cy);
    cy += lineH;
  }
  return cy;
}

function drawLamina(canvas: HTMLCanvasElement, data: TravelData, W: number, H: number) {
  const ctx = canvas.getContext("2d")!;
  canvas.width = W;
  canvas.height = H;

  const [sky, water, sand, palm] = getPalette(data.destino);
  const imgH = Math.round(H * 0.41);

  // ── FUNDO NAVY ──
  ctx.fillStyle = "#0d1b2a";
  ctx.fillRect(0, 0, W, H);

  // ── CÉU ──
  const skyGrd = ctx.createLinearGradient(0, 0, 0, imgH * 0.58);
  skyGrd.addColorStop(0, sky);
  skyGrd.addColorStop(1, "#d4f1f9");
  ctx.fillStyle = skyGrd;
  ctx.fillRect(0, 0, W, imgH * 0.58);

  // Sol
  ctx.fillStyle = "rgba(255,253,200,0.92)";
  ctx.beginPath();
  ctx.arc(W * 0.73, imgH * 0.16, W * 0.057, 0, Math.PI * 2);
  ctx.fill();

  // Nuvens
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  [
    [0.08, 0.2, 68, 26],
    [0.26, 0.13, 90, 32],
    [0.47, 0.18, 72, 26],
  ].forEach(([x, y, rx, ry]) => {
    ctx.beginPath();
    ctx.ellipse(W * x, imgH * y, rx as number, ry as number, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // ── ÁGUA ──
  const waterY = imgH * 0.58;
  const waterH = imgH * 0.24;
  const wGrd = ctx.createLinearGradient(0, waterY, 0, waterY + waterH);
  wGrd.addColorStop(0, water);
  wGrd.addColorStop(1, "#0a5a6e");
  ctx.fillStyle = wGrd;
  ctx.fillRect(0, waterY, W, waterH);

  // ondas
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, waterY);
  for (let x = 0; x <= W; x += 8) ctx.lineTo(x, waterY + 5 * Math.sin((x / 70) * Math.PI));
  ctx.stroke();

  // ── AREIA ──
  ctx.fillStyle = sand;
  ctx.fillRect(0, waterY + waterH, W, imgH - (waterY + waterH));

  // ── PALMEIRAS ──
  drawPalm(ctx, W * 0.13, imgH * 0.19, imgH * 0.33, palm);
  drawPalm(ctx, W * 0.71, imgH * 0.2, imgH * 0.24, palm);

  // ── OVERLAY GRADIENTE ──
  const ovGrd = ctx.createLinearGradient(0, 0, 0, imgH);
  ovGrd.addColorStop(0.55, "rgba(0,0,0,0)");
  ovGrd.addColorStop(1, "rgba(13,27,42,0.72)");
  ctx.fillStyle = ovGrd;
  ctx.fillRect(0, 0, W, imgH);

  // ── BADGE DESCONTO ──
  if (data.desconto) {
    ctx.fillStyle = "#00b4c8";
    ctx.fillRect(W - Math.round(W * 0.22), 0, Math.round(W * 0.22), Math.round(H * 0.027));
    ctx.fillStyle = "#003d45";
    ctx.font = `700 ${Math.round(H * 0.014)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(
      (data.desconto || "COM ATÉ").toUpperCase().includes("COM") ? data.desconto : `COM ATÉ`,
      W - Math.round(W * 0.11),
      Math.round(H * 0.02),
    );
    ctx.fillStyle = "#000";
    ctx.fillRect(W - Math.round(W * 0.22), Math.round(H * 0.027), Math.round(W * 0.22), Math.round(H * 0.05));
    ctx.fillStyle = "#fff";
    ctx.font = `900 ${Math.round(H * 0.042)}px sans-serif`;
    ctx.fillText(`${data.desconto}% OFF`, W - Math.round(W * 0.11), Math.round(H * 0.066));
  }

  // ── TAG PRODUTO ──
  const tagY = imgH - Math.round(H * 0.044);
  const tagH = Math.round(H * 0.033);
  ctx.fillStyle = "rgba(13,27,42,0.9)";
  rrect(ctx, Math.round(W * 0.037), tagY, Math.round(W * 0.22), tagH, tagH / 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,180,200,0.5)";
  ctx.lineWidth = 1.5;
  rrect(ctx, Math.round(W * 0.037), tagY, Math.round(W * 0.22), tagH, tagH / 2);
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = `600 ${Math.round(H * 0.019)}px sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText(`✈ ${data.tipoProduto || "Aéreo + Hotel"}`, Math.round(W * 0.06), tagY + tagH * 0.68);

  // ── SELO CAMPANHA ──
  if (data.campanha) {
    const sr = Math.round(W * 0.088);
    const sx = W - sr - Math.round(W * 0.04);
    const sy = imgH - Math.round(H * 0.015);
    ctx.fillStyle = "#062d36";
    ctx.beginPath();
    ctx.arc(sx, sy + sr * 0.5, sr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#00b4c8";
    ctx.lineWidth = Math.round(W * 0.006);
    ctx.beginPath();
    ctx.arc(sx, sy + sr * 0.5, sr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#00b4c8";
    ctx.font = `700 ${Math.round(H * 0.011)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(data.campanha.toUpperCase(), sx, sy + sr * 0.2);
    ctx.fillStyle = "#fff";
    ctx.font = `900 ${Math.round(H * 0.017)}px sans-serif`;
    ctx.fillText("2026", sx, sy + sr * 0.75);
  }

  // ── CORPO ──
  const bodyX = Math.round(W * 0.037);
  const bodyY = imgH + Math.round(H * 0.025);
  const lineBase = Math.round(H * 0.016);

  // Título destino
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 ${Math.round(H * 0.065)}px 'Barlow Condensed', sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText(data.destino, bodyX, bodyY + Math.round(H * 0.055));

  // Inclui label
  let iy = bodyY + Math.round(H * 0.075);
  ctx.fillStyle = "#fff";
  ctx.font = `700 ${lineBase}px sans-serif`;
  ctx.fillText("INCLUI", bodyX, iy);
  iy += Math.round(H * 0.022);

  const items = (data.inclui || []).slice(0, 5);
  items.forEach((item) => {
    ctx.fillStyle = "#00b4c8";
    ctx.font = `${lineBase}px sans-serif`;
    ctx.fillText("•", bodyX, iy);
    ctx.fillStyle = "#c8d8e8";
    ctx.font = `${lineBase}px sans-serif`;
    const maxW = W * 0.52;
    const txt = item.length > 55 ? item.substring(0, 55) + "…" : item;
    ctx.fillText(txt, bodyX + Math.round(W * 0.025), iy);
    iy += Math.round(H * 0.02);
  });

  // Preço (coluna direita)
  if (data.precoParcela) {
    const px2 = W - Math.round(W * 0.037);
    let py2 = bodyY + Math.round(H * 0.042);
    ctx.textAlign = "right";
    ctx.fillStyle = "#8aaabb";
    ctx.font = `${Math.round(H * 0.013)}px sans-serif`;
    ctx.fillText("A PARTIR DE", px2, py2);
    py2 += Math.round(H * 0.018);
    ctx.fillStyle = "#00d4e8";
    ctx.font = `900 ${Math.round(H * 0.048)}px sans-serif`;
    ctx.fillText(`${data.parcelas}x`, px2, py2);
    py2 += Math.round(H * 0.008);
    ctx.fillStyle = "#fff";
    ctx.font = `900 ${Math.round(H * 0.056)}px sans-serif`;
    ctx.fillText(`R$ ${data.precoParcela.replace("R$ ", "")}`, px2, py2 + Math.round(H * 0.048));
    py2 += Math.round(H * 0.062);
    if (data.precoAVista) {
      ctx.fillStyle = "#fff";
      ctx.font = `600 ${Math.round(H * 0.014)}px sans-serif`;
      ctx.fillText(`Ou ${data.precoAVista}`, px2, py2);
      py2 += Math.round(H * 0.018);
    }
    ctx.fillStyle = "#8aaabb";
    ctx.font = `${Math.round(H * 0.012)}px sans-serif`;
    ctx.fillText("por pessoa em apto duplo", px2, py2);
  }

  // Cia aérea
  if (data.companhiaAerea) {
    ctx.textAlign = "right";
    ctx.fillStyle = "#fff";
    ctx.font = `700 ${Math.round(H * 0.022)}px sans-serif`;
    ctx.fillText(data.companhiaAerea, W - Math.round(W * 0.037), iy + Math.round(H * 0.01));
    iy += Math.round(H * 0.032);
  }

  // Data pill
  if (data.dataInicio && data.dataFim) {
    const pillH = Math.round(H * 0.032);
    const dataTxt = `📅 ${data.dataInicio} a ${data.dataFim}`;
    ctx.font = `700 ${Math.round(H * 0.016)}px sans-serif`;
    ctx.textAlign = "left";
    const pillW = ctx.measureText(dataTxt).width + Math.round(W * 0.04);
    ctx.fillStyle = "#00b4c8";
    rrect(ctx, bodyX, iy, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.fillStyle = "#003d45";
    ctx.fillText(dataTxt, bodyX + Math.round(W * 0.02), iy + pillH * 0.68);
    iy += pillH + Math.round(H * 0.01);
  }

  // ── FOOTER BWT ──
  const footerY = H - Math.round(H * 0.083);
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, footerY);
  ctx.lineTo(W, footerY);
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = `700 ${Math.round(H * 0.016)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("UM PRODUTO BWT OPERADORA", W / 2, footerY + Math.round(H * 0.026));

  // Rodapé condições
  const condY = footerY + Math.round(H * 0.046);
  ctx.fillStyle = "#f0ede8";
  ctx.fillRect(0, condY, W, H - condY);
  ctx.fillStyle = "#444";
  ctx.font = `${Math.round(H * 0.0095)}px sans-serif`;
  ctx.textAlign = "left";
  wrapText(
    ctx,
    COND_PADRAO,
    Math.round(W * 0.018),
    condY + Math.round(H * 0.012),
    W - Math.round(W * 0.036),
    Math.round(H * 0.013),
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const CanvasPreview = ({ data }: CanvasPreviewProps) => {
  const previewRef = useRef<HTMLCanvasElement>(null);
  const [exporting, setExporting] = useState(false);

  // Preview: 360px wide
  const PW = 360,
    PH = Math.round((360 * 1350) / 1080);

  useEffect(() => {
    if (previewRef.current) {
      drawLamina(previewRef.current, data, PW, PH);
    }
  }, [data]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const canvas = document.createElement("canvas");
      drawLamina(canvas, data, 1080, 1350);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bwt-${data.destino.toLowerCase().replace(/\s+/g, "-")}-lamina.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" style={{ color: "#00b4c8" }} />
          <h2 className="text-2xl font-display font-semibold">Lâmina Estática</h2>
        </div>
        <Button
          onClick={handleExport}
          disabled={exporting}
          size="sm"
          style={{ background: "#00b4c8", color: "#0d1b2a" }}
          className="hover:opacity-90 font-semibold"
        >
          {exporting ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Exportar PNG 1080×1350
            </>
          )}
        </Button>
      </div>

      <div className="flex justify-center">
        <div style={{ borderRadius: 12, overflow: "hidden", boxShadow: "0 10px 40px rgba(0,0,0,0.3)" }}>
          <canvas ref={previewRef} width={PW} height={PH} style={{ display: "block" }} />
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Preview {PW}px · Exporta em 1080×1350px · Padrão Story BWT
      </p>
    </div>
  );
};

export default CanvasPreview;
