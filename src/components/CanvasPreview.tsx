import { Download, Image as ImageIcon } from "lucide-react";
import { useRef } from "react";
import { toPng } from "html-to-image";
import { TravelData } from "@/types/travel";
import bwtLogo from "@/assets/bwt-logo.png";
import { Button } from "@/components/ui/button";

interface CanvasPreviewProps {
  data: TravelData;
}

const CanvasPreview = ({ data }: CanvasPreviewProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = await toPng(canvasRef.current, {
        width: 1080,
        height: 1350,
        pixelRatio: 1,
      });
      const link = document.createElement("a");
      link.download = `bwt-${data.destino.toLowerCase().replace(/\s/g, "-")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  // Scale: preview at 400px wide, export at 1080px
  const scale = 400 / 1080;
  const canvasW = 1080;
  const canvasH = 1350;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-accent" />
          <h2 className="text-2xl font-display font-semibold">Lâmina Estática</h2>
        </div>
        <Button onClick={handleExport} size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Download className="w-4 h-4 mr-2" />
          Exportar PNG
        </Button>
      </div>

      <div className="flex justify-center">
        <div
          style={{
            width: canvasW * scale,
            height: canvasH * scale,
            overflow: "hidden",
            borderRadius: 12,
            boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
          }}
        >
          <div
            ref={canvasRef}
            style={{
              width: canvasW,
              height: canvasH,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              position: "relative",
              fontFamily: "'Inter', sans-serif",
              background: "#5B21B6",
              overflow: "hidden",
            }}
          >
            {/* Background Image */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=80)`,
                backgroundSize: "cover",
                backgroundPosition: "center top",
              }}
            />
            {/* Gradient overlays */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 30%, rgba(91,33,182,0.85) 65%, rgba(60,20,130,0.95) 100%)" }} />

            {/* Discount Badge - Top Right */}
            {data.desconto && (
              <div style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 220,
                height: 100,
                background: "linear-gradient(135deg, #00b4d8, #0096c7)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderBottomLeftRadius: 16,
              }}>
                <span style={{ color: "white", fontSize: 14, fontWeight: 500, letterSpacing: 1 }}>COM ATÉ</span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ color: "white", fontSize: 56, fontWeight: 800, lineHeight: 1 }}>{data.desconto}</span>
                  <span style={{ color: "white", fontSize: 22, fontWeight: 700 }}>%</span>
                </div>
                <span style={{ color: "white", fontSize: 16, fontWeight: 700, letterSpacing: 2 }}>OFF</span>
              </div>
            )}

            {/* Campaign Seal - Right side */}
            {data.campanha && (
              <div style={{
                position: "absolute",
                top: 280,
                right: 40,
                width: 200,
                height: 200,
                borderRadius: "50%",
                border: "4px solid #d4a853",
                background: "radial-gradient(circle, rgba(91,33,182,0.9), rgba(60,20,130,0.95))",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
              }}>
                <span style={{ color: "#d4a853", fontSize: 13, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>🌴</span>
                <span style={{ color: "white", fontSize: 16, fontWeight: 800, textAlign: "center", lineHeight: 1.2, textTransform: "uppercase", marginTop: 4 }}>
                  {data.campanha}
                </span>
                <div style={{ display: "flex", gap: 30, marginTop: 8 }}>
                  <span style={{ color: "#d4a853", fontSize: 14, fontWeight: 700 }}>20</span>
                  <span style={{ color: "#d4a853", fontSize: 14, fontWeight: 700 }}>26</span>
                </div>
              </div>
            )}

            {/* Product Type Badge */}
            {data.tipoProduto && (
              <div style={{
                position: "absolute",
                top: 530,
                left: 60,
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "linear-gradient(135deg, #00b4d8, #0096c7)",
                padding: "10px 24px",
                borderRadius: 8,
              }}>
                <span style={{ fontSize: 20 }}>✈️</span>
                <span style={{ color: "white", fontSize: 22, fontWeight: 700, letterSpacing: 1 }}>{data.tipoProduto}</span>
              </div>
            )}

            {/* Destination Title */}
            <div style={{
              position: "absolute",
              top: 590,
              left: 60,
              right: 60,
            }}>
              <h2 style={{
                color: "white",
                fontSize: 52,
                fontWeight: 800,
                lineHeight: 1.1,
                textShadow: "0 2px 20px rgba(0,0,0,0.5)",
                fontFamily: "'Playfair Display', serif",
              }}>
                {data.destino} Impressionante
              </h2>
            </div>

            {/* Inclui Section */}
            <div style={{
              position: "absolute",
              top: 720,
              left: 60,
              width: 520,
            }}>
              <p style={{ color: "#d4a853", fontSize: 18, fontWeight: 800, letterSpacing: 2, marginBottom: 12, textTransform: "uppercase" }}>INCLUI</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(data.inclui || []).map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ color: "#d4a853", fontSize: 14, marginTop: 2 }}>•</span>
                    <span style={{ color: "white", fontSize: 15, lineHeight: 1.4 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Block - Right side */}
            <div style={{
              position: "absolute",
              top: 720,
              right: 60,
              textAlign: "right",
            }}>
              <span style={{ color: "white", fontSize: 16, fontWeight: 500, letterSpacing: 1, display: "block" }}>A PARTIR DE</span>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: 4, marginTop: 4 }}>
                <span style={{ color: "#d4a853", fontSize: 28, fontWeight: 700 }}>{data.parcelas}x</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: 4 }}>
                <span style={{ color: "white", fontSize: 18, fontWeight: 500 }}>R$</span>
                <span style={{ color: "white", fontSize: 72, fontWeight: 800, lineHeight: 1 }}>
                  {data.precoParcela?.replace("R$ ", "")}
                </span>
              </div>
              <p style={{ color: "white", fontSize: 15, fontWeight: 500, marginTop: 4 }}>
                Ou {data.precoAVista}
              </p>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 2 }}>por pessoa em apto duplo</p>
            </div>

            {/* Date Badge */}
            {data.dataInicio && data.dataFim && (
              <div style={{
                position: "absolute",
                bottom: 160,
                left: 60,
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "linear-gradient(135deg, #00b4d8, #0096c7)",
                padding: "10px 20px",
                borderRadius: 8,
              }}>
                <span style={{ fontSize: 18 }}>📅</span>
                <span style={{ color: "white", fontSize: 20, fontWeight: 700 }}>{data.dataInicio} a {data.dataFim}</span>
              </div>
            )}

            {/* Airline Logo */}
            {data.companhiaAerea && (
              <div style={{
                position: "absolute",
                bottom: 130,
                right: 60,
              }}>
                <span style={{ color: "#FF6600", fontSize: 48, fontWeight: 900, fontFamily: "sans-serif", letterSpacing: 4 }}>
                  {data.companhiaAerea}
                </span>
              </div>
            )}

            {/* Footer with BWT Logo */}
            <div style={{
              position: "absolute",
              bottom: 40,
              left: 0,
              right: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}>
              <img src={bwtLogo} alt="BWT Operadora" style={{ height: 50, objectFit: "contain" }} />
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 500, letterSpacing: 2, textTransform: "uppercase" }}>
                OPERADORA DE TURISMO
              </p>
            </div>

            {/* Fine Print */}
            <div style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background: "rgba(60,20,130,0.9)",
              padding: "10px 40px",
            }}>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, lineHeight: 1.4, textAlign: "center" }}>
                Condições Específicas: Tarifa promocional, não reembolsável. Consulte valores para demais datas. Sujeito a disponibilidade e alterações sem prévio aviso.
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Preview em 400px — exporta em 1080×1350
      </p>
    </div>
  );
};

export default CanvasPreview;
