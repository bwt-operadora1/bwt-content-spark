import { Download, Image as ImageIcon, RefreshCw } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { TravelData } from "@/types/travel";
import { Button } from "@/components/ui/button";
import { getDestinationContext, getUnsplashSearchUrl, type DestinationContext } from "@/lib/destinationContext";

interface CanvasPreviewProps {
  data: TravelData;
}

function getPalette(destino: string) {
  return getDestinationContext(destino).palette;
}

const COND_PADRAO =
  "Valores por pessoa em Reais. Sujeito a disponibilidade e alterações sem prévio aviso. Parcelamento em até 10x, respeitando parcela mínima de R$ 150,00. Nos reservamos o direito a correções de possíveis erros de digitação. Consulte regras gerais em www.bwtoperadora.com.br";

const CanvasPreview = ({ data }: CanvasPreviewProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [bgLoaded, setBgLoaded] = useState(false);

  const destCtx = getDestinationContext(data.destino);
  const pal = destCtx.palette;

  // Load destination background image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = getUnsplashSearchUrl(destCtx.imageKeyword, 1080, 600);
    img.onload = () => {
      setBgImage(img);
      setBgLoaded(true);
    };
    img.onerror = () => setBgLoaded(false);
  }, [data.destino]);

  // Exportação via Canvas 2D nativo — sem html-to-image, sem CORS
  const handleExport = async () => {
    setExporting(true);
    try {
      const W = 1080,
        H = 1350,
        scale = 3;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;

      // Fundo navy
      ctx.fillStyle = "#0d1b2a";
      roundRect(ctx, 0, 0, W, H, 0);
      ctx.fill();

      const imgH = Math.round(H * 0.42);

      // Céu
      const skyGrd = ctx.createLinearGradient(0, 0, 0, imgH * 0.6);
      skyGrd.addColorStop(0, pal.sky);
      skyGrd.addColorStop(1, "#d4f1f9");
      ctx.fillStyle = skyGrd;
      ctx.fillRect(0, 0, W, imgH * 0.6);

      // Sol
      ctx.fillStyle = "rgba(255,253,200,0.9)";
      ctx.beginPath();
      ctx.arc(W * 0.74, imgH * 0.16, 60, 0, Math.PI * 2);
      ctx.fill();

      // Nuvens
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      [
        [0.08, 0.18, 70, 28],
        [0.28, 0.13, 90, 34],
        [0.48, 0.17, 75, 28],
        [0.62, 0.11, 80, 30],
      ].forEach(([x, y, rx, ry]) => {
        ctx.beginPath();
        ctx.ellipse(W * x, imgH * y, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      // Água
      const waterGrd = ctx.createLinearGradient(0, imgH * 0.6, 0, imgH * 0.82);
      waterGrd.addColorStop(0, pal.water);
      waterGrd.addColorStop(1, "#0d5a70");
      ctx.fillStyle = waterGrd;
      ctx.fillRect(0, imgH * 0.6, W, imgH * 0.22);

      // Ondas
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, imgH * 0.6);
      for (let x = 0; x <= W; x += 10) ctx.lineTo(x, imgH * 0.6 + 6 * Math.sin((x / 80) * Math.PI));
      ctx.stroke();

      // Areia
      ctx.fillStyle = pal.sand;
      ctx.fillRect(0, imgH * 0.82, W, imgH * 0.18);

      // Palmeiras
      drawPalm(ctx, W * 0.14, imgH * 0.2, imgH * 0.34, pal.palm);
      drawPalm(ctx, W * 0.72, imgH * 0.2, imgH * 0.26, pal.palm);

      // Overlay gradiente
      const ovGrd = ctx.createLinearGradient(0, 0, 0, imgH);
      ovGrd.addColorStop(0, "rgba(0,0,0,0)");
      ovGrd.addColorStop(0.65, "rgba(0,0,0,0)");
      ovGrd.addColorStop(1, "rgba(13,27,42,0.75)");
      ctx.fillStyle = ovGrd;
      ctx.fillRect(0, 0, W, imgH);

      // Badge desconto
      if (data.desconto) {
        ctx.fillStyle = "#00b4c8";
        ctx.fillRect(W - 230, 0, 230, 28);
        ctx.fillStyle = "#003d45";
        ctx.font = `bold ${18}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("COM ATÉ", W - 115, 20);
        ctx.fillStyle = "#000";
        ctx.fillRect(W - 230, 28, 230, 52);
        ctx.fillStyle = "#fff";
        ctx.font = `900 ${52}px sans-serif`;
        ctx.fillText(`${data.desconto}% OFF`, W - 115, 73);
      }

      // Tag produto
      ctx.fillStyle = "rgba(13,27,42,0.88)";
      roundRect(ctx, 40, imgH - 52, 200, 36, 18);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = `600 ${20}px sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText(`✈ ${data.tipoProduto || "Aéreo + Hotel"}`, 58, imgH - 28);

      // Selo campanha
      if (data.campanha) {
        ctx.strokeStyle = "#00b4c8";
        ctx.lineWidth = 6;
        ctx.fillStyle = "#062d36";
        ctx.beginPath();
        ctx.arc(W - 100, imgH + 40, 90, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#00b4c8";
        ctx.font = `bold ${16}px sans-serif`;
        ctx.textAlign = "center";
        wrapText(ctx, data.campanha.toUpperCase(), W - 100, imgH + 20, 150, 18);
        ctx.fillStyle = "#fff";
        ctx.font = `900 ${22}px sans-serif`;
        ctx.fillText("2026", W - 100, imgH + 55);
      }

      // Título destino
      const bodyY = imgH + (data.campanha ? 80 : 50);
      ctx.fillStyle = "#fff";
      ctx.font = `800 ${data.destino.length > 12 ? 56 : 66}px 'Barlow Condensed', sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText(data.destino, 60, bodyY);

      // INCLUI
      const items = data.inclui || [];
      let iy = bodyY + 44;
      ctx.fillStyle = "#fff";
      ctx.font = `700 ${18}px sans-serif`;
      ctx.fillText("INCLUI", 60, iy);
      iy += 22;
      items.slice(0, 5).forEach((item) => {
        ctx.fillStyle = "#00b4c8";
        ctx.font = `${17}px sans-serif`;
        ctx.fillText("•", 60, iy);
        ctx.fillStyle = "#c8d8e8";
        ctx.font = `${17}px sans-serif`;
        ctx.fillText(item.substring(0, 52), 82, iy);
        iy += 22;
      });

      // Preço
      if (data.precoParcela) {
        ctx.textAlign = "right";
        ctx.fillStyle = "#8aaabb";
        ctx.font = `${16}px sans-serif`;
        ctx.fillText("A PARTIR DE", W - 60, bodyY + 10);
        ctx.fillStyle = "#00d4e8";
        ctx.font = `900 ${88}px sans-serif`;
        ctx.fillText(`${data.parcelas}x`, W - 60, bodyY + 78);
        ctx.fillStyle = "#fff";
        ctx.font = `900 ${60}px sans-serif`;
        ctx.fillText(`R$ ${data.precoParcela.replace("R$ ", "")}`, W - 60, bodyY + 130);
        if (data.precoAVista) {
          ctx.fillStyle = "#fff";
          ctx.font = `600 ${18}px sans-serif`;
          ctx.fillText(`Ou ${data.precoAVista}`, W - 60, bodyY + 155);
        }
        ctx.fillStyle = "#8aaabb";
        ctx.font = `${15}px sans-serif`;
        ctx.fillText("por pessoa em apto duplo", W - 60, bodyY + 175);
      }

      // Cia aérea
      if (data.companhiaAerea) {
        ctx.fillStyle = "#fff";
        ctx.font = `800 ${28}px sans-serif`;
        ctx.textAlign = "right";
        ctx.fillText(data.companhiaAerea, W - 60, iy + 10);
        iy += 36;
      }

      // Data pill
      if (data.dataInicio && data.dataFim) {
        ctx.fillStyle = "#00b4c8";
        ctx.textAlign = "left";
        roundRect(ctx, 60, iy + 4, 320, 36, 18);
        ctx.fill();
        ctx.fillStyle = "#003d45";
        ctx.font = `700 ${18}px sans-serif`;
        ctx.fillText(`📅 ${data.dataInicio} a ${data.dataFim}`, 80, iy + 27);
        iy += 52;
      }

      // Footer
      const footerY = H - 100;
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, footerY);
      ctx.lineTo(W, footerY);
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = `700 ${20}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("UM PRODUTO BWT OPERADORA", W / 2, footerY + 28);

      // Rodapé condições
      ctx.fillStyle = "#f0ede8";
      ctx.fillRect(0, footerY + 46, W, H - (footerY + 46));
      ctx.fillStyle = "#444";
      ctx.font = `${13}px sans-serif`;
      wrapText(ctx, COND_PADRAO, 20, footerY + 64, W - 40, 16);

      // Download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bwt-${data.destino.toLowerCase().replace(/\s/g, "-")}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  // Utilitários canvas
  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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
    ctx.strokeStyle = color;
    ctx.lineWidth = size * 0.055;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(px, py + size);
    ctx.quadraticCurveTo(px + size * 0.12, py + size * 0.5, px + size * 0.06, py);
    ctx.stroke();
    [
      [-0.4, -0.12],
      [0, 0],
      [0.4, -0.1],
    ].forEach(([angle, dy]) => {
      ctx.save();
      ctx.translate(px + size * 0.06, py + size * dy);
      ctx.rotate(angle);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.32, size * 0.09, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
    });
  }

  function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number) {
    const words = text.split(" ");
    let line = "";
    let cy = y;
    ctx.textAlign = "left";
    for (const w of words) {
      const test = line + (line ? " " : "") + w;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, cy);
        cy += lineH;
        line = w;
      } else line = test;
    }
    if (line) ctx.fillText(line, x, cy);
  }

  // Preview scale
  const scale = 360 / 1080;

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
          className="hover:opacity-90"
        >
          {exporting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
          {exporting ? "Gerando..." : "Exportar PNG 1080×1350"}
        </Button>
      </div>

      <div className="flex justify-center">
        <div
          style={{
            width: 1080 * scale,
            height: 1350 * scale,
            overflow: "hidden",
            borderRadius: 12,
            boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
          }}
        >
          <div
            ref={canvasRef}
            style={{
              width: 1080,
              height: 1350,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              position: "relative",
              fontFamily: "'Inter', sans-serif",
              background: "#0d1b2a",
              overflow: "hidden",
            }}
          >
            {/* Imagem ilustrada do destino */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "42%" }}>
              {/* Céu */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `linear-gradient(180deg, ${pal.sky} 0%, #d4f1f9 55%, ${pal.water} 55%, #0d5a70 78%, ${pal.sand} 78%, ${pal.sand} 100%)`,
                }}
              />
              {/* Sol */}
              <div
                style={{
                  position: "absolute",
                  top: "10%",
                  right: "28%",
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "rgba(255,253,200,0.9)",
                }}
              />
              {/* Overlay gradiente bottom */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(180deg, transparent 60%, rgba(13,27,42,0.7) 100%)",
                }}
              />
            </div>

            {/* Badge desconto */}
            {data.desconto && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                }}
              >
                <div
                  style={{
                    background: "#00b4c8",
                    color: "#003d45",
                    fontSize: 14,
                    fontWeight: 700,
                    padding: "4px 16px",
                    letterSpacing: 1,
                  }}
                >
                  COM ATÉ
                </div>
                <div
                  style={{
                    background: "#000",
                    color: "#fff",
                    fontSize: 56,
                    fontWeight: 900,
                    padding: "0 16px",
                    lineHeight: 1.1,
                    display: "flex",
                    alignItems: "baseline",
                    gap: 4,
                  }}
                >
                  {data.desconto}
                  <span style={{ fontSize: 20, fontWeight: 700, color: "#ccc" }}>% OFF</span>
                </div>
              </div>
            )}

            {/* Tag produto */}
            <div
              style={{
                position: "absolute",
                top: "38%",
                left: 40,
                background: "rgba(13,27,42,0.9)",
                border: "1px solid rgba(0,180,200,0.4)",
                borderRadius: 30,
                padding: "8px 20px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ color: "#fff", fontSize: 18, fontWeight: 600 }}>
                ✈ {data.tipoProduto || "Aéreo + Hotel"}
              </span>
            </div>

            {/* Selo campanha */}
            {data.campanha && (
              <div
                style={{
                  position: "absolute",
                  top: "36%",
                  right: 40,
                  width: 130,
                  height: 130,
                  borderRadius: "50%",
                  background: "#062d36",
                  border: "3px solid #00b4c8",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    color: "#00b4c8",
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    textAlign: "center",
                    lineHeight: 1.2,
                    padding: "0 10px",
                  }}
                >
                  {data.campanha}
                </span>
                <span style={{ color: "#fff", fontSize: 16, fontWeight: 900, marginTop: 4 }}>2026</span>
              </div>
            )}

            {/* Corpo */}
            <div style={{ position: "absolute", top: "44%", left: 0, right: 0, bottom: 0, padding: "20px 40px 0" }}>
              <h2
                style={{
                  color: "#fff",
                  fontSize: 72,
                  fontWeight: 800,
                  lineHeight: 1.05,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  letterSpacing: -1,
                }}
              >
                {data.destino}
              </h2>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginTop: 16,
                  gap: 20,
                }}
              >
                {/* Inclui */}
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: 2,
                      marginBottom: 8,
                      textTransform: "uppercase",
                    }}
                  >
                    INCLUI
                  </p>
                  {(data.inclui || []).slice(0, 5).map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5 }}>
                      <span style={{ color: "#00b4c8", fontSize: 13, flexShrink: 0 }}>•</span>
                      <span style={{ color: "#c8d8e8", fontSize: 13, lineHeight: 1.4 }}>{item}</span>
                    </div>
                  ))}
                </div>

                {/* Preço */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ color: "#8aaabb", fontSize: 12, letterSpacing: 1, textTransform: "uppercase" }}>
                    A PARTIR DE
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "flex-end",
                      gap: 4,
                      marginTop: 2,
                    }}
                  >
                    <span style={{ color: "#00d4e8", fontSize: 36, fontWeight: 900 }}>{data.parcelas}x</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end" }}>
                    <span style={{ color: "#fff", fontSize: 20, fontWeight: 600 }}>R$</span>
                    <span style={{ color: "#fff", fontSize: 56, fontWeight: 900, lineHeight: 1 }}>
                      {data.precoParcela?.replace("R$ ", "")}
                    </span>
                  </div>
                  {data.precoAVista && (
                    <p style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>Ou {data.precoAVista}</p>
                  )}
                  <p style={{ color: "#8aaabb", fontSize: 11, marginTop: 2 }}>por pessoa em apto duplo</p>
                </div>
              </div>

              {/* Cia aérea */}
              {data.companhiaAerea && (
                <p
                  style={{
                    color: "#fff",
                    fontSize: 18,
                    fontWeight: 700,
                    textAlign: "right",
                    marginTop: 8,
                    opacity: 0.9,
                  }}
                >
                  {data.companhiaAerea}
                </p>
              )}

              {/* Data pill */}
              {data.dataInicio && data.dataFim && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#00b4c8",
                    color: "#003d45",
                    fontSize: 14,
                    fontWeight: 700,
                    padding: "7px 18px",
                    borderRadius: 30,
                    marginTop: 12,
                  }}
                >
                  📅 {data.dataInicio} a {data.dataFim}
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                position: "absolute",
                bottom: 60,
                left: 0,
                right: 0,
                textAlign: "center",
                borderTop: "1px solid rgba(255,255,255,0.1)",
                paddingTop: 10,
              }}
            >
              <p style={{ color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>
                UM PRODUTO BWT OPERADORA
              </p>
            </div>
            <div
              style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#f0ede8", padding: "8px 20px" }}
            >
              <p style={{ color: "#555", fontSize: 8.5, lineHeight: 1.5 }}>{COND_PADRAO}</p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Preview 360px · Exporta em 1080×1350px · Padrão Story BWT
      </p>
    </div>
  );
};

export default CanvasPreview;
