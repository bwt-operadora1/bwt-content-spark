import { Download, Image as ImageIcon, RefreshCw, Edit2 } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { TravelData } from "@/types/travel";
import { Button } from "@/components/ui/button";
import { useDestinationImage } from "@/hooks/useDestinationImage";
import { drawFeed, drawStory, LaminaState, DEFAULT_LAMINA_STATE, scaleLaminaState } from "@/lib/laminaRenderer";
import LaminaEditor from "./LaminaEditor";

interface CanvasPreviewProps {
  data: TravelData;
  onDataChange?: (data: TravelData) => void;
}

const SW = 320, SH = Math.round((320 * 1350) / 1080);
const FW = 320, FH = 320;

// Shimmer skeleton for canvas loading state
const CanvasSkeleton = ({ width, height }: { width: number; height: number }) => (
  <div
    style={{ width, height, borderRadius: 12, overflow: "hidden" }}
    className="relative"
  >
    <div
      className="absolute inset-0 animate-pulse"
      style={{ background: "linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted-foreground)/0.08) 50%, hsl(var(--muted)) 75%)", backgroundSize: "200% 100%" }}
    />
  </div>
);

const CanvasPreview = ({ data, onDataChange }: CanvasPreviewProps) => {
  const storyRef = useRef<HTMLCanvasElement>(null);
  const feedRef = useRef<HTMLCanvasElement>(null);

  const [exportingStory, setExportingStory] = useState(false);
  const [exportingFeed, setExportingFeed] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [feedState, setFeedState] = useState<LaminaState>(DEFAULT_LAMINA_STATE);
  const [storyState, setStoryState] = useState<LaminaState>(DEFAULT_LAMINA_STATE);

  const { imageEl, loading: imageLoading } = useDestinationImage(data.destino);

  useEffect(() => {
    if (!feedRef.current) return;
    drawFeed(feedRef.current, data, FW, FH, imageEl, { laminaState: feedState });
  }, [data, imageEl, feedState]);

  useEffect(() => {
    if (!storyRef.current) return;
    drawStory(storyRef.current, data, SW, SH, imageEl, { laminaState: storyState });
  }, [data, imageEl, storyState]);

  const handleExportFeed = async () => {
    setExportingFeed(true);
    try {
      const canvas = document.createElement("canvas");
      drawFeed(canvas, data, 1080, 1080, imageEl, { laminaState: scaleLaminaState(feedState, FW, 1080) });
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bwt-${data.destino.toLowerCase().replace(/\s+/g, "-")}-feed.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    } finally {
      setExportingFeed(false);
    }
  };

  const handleExportStory = async () => {
    setExportingStory(true);
    try {
      const canvas = document.createElement("canvas");
      drawStory(canvas, data, 1080, 1350, imageEl, { laminaState: scaleLaminaState(storyState, SW, 1080) });
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bwt-${data.destino.toLowerCase().replace(/\s+/g, "-")}-story.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    } finally {
      setExportingStory(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" style={{ color: "#9333EA" }} />
          <h2 className="text-2xl font-display font-semibold">Lâminas</h2>
        </div>

        {/* Preview grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* ── Feed ── */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-full flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Feed</p>
                <p className="text-xs text-muted-foreground">1080 × 1080 px</p>
              </div>
            </div>

            {/* Canvas or shimmer */}
            <div style={{ borderRadius: 12, overflow: "hidden", boxShadow: "0 10px 40px rgba(0,0,0,0.3)" }}>
              {imageLoading ? (
                <CanvasSkeleton width={FW} height={FH} />
              ) : (
                <canvas ref={feedRef} width={FW} height={FH} style={{ display: "block" }} />
              )}
            </div>

            {/* Photo status */}
            {!imageLoading && imageEl && (
              <span className="text-xs font-medium" style={{ color: "#10b981" }}>● Foto carregada</span>
            )}

            {/* Export button */}
            <Button
              onClick={handleExportFeed}
              disabled={exportingFeed || imageLoading}
              className="w-full gap-2 font-semibold"
              style={{ background: "#9333EA", color: "#0d1b2a" }}
            >
              {exportingFeed
                ? <><RefreshCw className="w-4 h-4 animate-spin" />Gerando...</>
                : <><Download className="w-4 h-4" />Exportar Feed PNG</>}
            </Button>
          </div>

          {/* ── Story ── */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-full flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Story</p>
                <p className="text-xs text-muted-foreground">1080 × 1350 px</p>
              </div>
            </div>

            {/* Canvas or shimmer */}
            <div style={{ borderRadius: 12, overflow: "hidden", boxShadow: "0 10px 40px rgba(0,0,0,0.3)" }}>
              {imageLoading ? (
                <CanvasSkeleton width={SW} height={SH} />
              ) : (
                <canvas ref={storyRef} width={SW} height={SH} style={{ display: "block" }} />
              )}
            </div>

            {/* Photo status */}
            {!imageLoading && imageEl && (
              <span className="text-xs font-medium" style={{ color: "#10b981" }}>● Foto carregada</span>
            )}

            {/* Export button */}
            <Button
              onClick={handleExportStory}
              disabled={exportingStory || imageLoading}
              className="w-full gap-2 font-semibold"
              style={{ background: "#9333EA", color: "#0d1b2a" }}
            >
              {exportingStory
                ? <><RefreshCw className="w-4 h-4 animate-spin" />Gerando...</>
                : <><Download className="w-4 h-4" />Exportar Story PNG</>}
            </Button>
          </div>
        </div>

        {/* Open Editor — centered below both previews */}
        <div className="flex justify-center pt-2">
          <Button
            onClick={() => setEditorOpen(true)}
            variant="outline"
            className="gap-2 font-semibold"
            style={{ borderColor: "rgba(147,51,234,0.4)", color: "#9333EA" }}
          >
            <Edit2 className="w-4 h-4" />
            Abrir Editor Avançado
          </Button>
        </div>
      </div>

      {editorOpen && (
        <LaminaEditor
          data={data}
          initialFeedState={feedState}
          initialStoryState={storyState}
          onClose={() => setEditorOpen(false)}
          onSave={(fs, ss) => { setFeedState(fs); setStoryState(ss); }}
          onDataChange={onDataChange}
        />
      )}
    </>
  );
};

export default CanvasPreview;
