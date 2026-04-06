import { Download, Image as ImageIcon } from "lucide-react";
import { useRef } from "react";
import { toPng } from "html-to-image";
import { TravelData } from "@/types/travel";
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
        height: 1080,
        pixelRatio: 1,
      });
      const link = document.createElement("a");
      link.download = `bwt-${data.destino.toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-accent" />
          <h2 className="text-2xl font-display font-semibold">Lâmina Instagram</h2>
        </div>
        <Button onClick={handleExport} size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Download className="w-4 h-4 mr-2" />
          Exportar PNG
        </Button>
      </div>

      <div className="flex justify-center">
        <div
          ref={canvasRef}
          className="relative overflow-hidden rounded-2xl shadow-2xl"
          style={{ width: 400, height: 400, background: "linear-gradient(135deg, hsl(215 80% 22%), hsl(215 80% 35%))" }}
        >
          {/* Background image overlay */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url(https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=1080&q=80)`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Content */}
          <div className="relative h-full flex flex-col justify-between p-8">
            {/* Top: Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs" style={{ background: "hsl(40 85% 55%)", color: "hsl(215 80% 22%)" }}>
                BWT
              </div>
              <span className="text-white/80 text-xs font-medium tracking-wider uppercase">
                Operadora
              </span>
            </div>

            {/* Bottom: Info */}
            <div className="space-y-3">
              <div>
                <p className="text-white/70 text-xs font-medium uppercase tracking-widest">
                  {data.duracao} · {data.regime}
                </p>
                <h3 className="text-white text-2xl font-bold leading-tight mt-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {data.destino}
                </h3>
                <p className="text-white/80 text-sm mt-1">{data.hotel}</p>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-white/60 text-xs">a partir de</p>
                  <p className="text-2xl font-bold" style={{ color: "hsl(40 85% 55%)" }}>
                    {data.precoTotal}
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: "hsl(40 85% 55%)", color: "hsl(215 80% 22%)" }}>
                  {data.regime}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Preview em 400×400 — exporta em 1080×1080
      </p>
    </div>
  );
};

export default CanvasPreview;
