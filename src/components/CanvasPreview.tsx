import { Download, Image as ImageIcon, RefreshCw, Loader2, Edit2 } from "lucide-react";
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

const CanvasPreview = ({ data, onDataChange }: CanvasPreviewProps) => {
  const storyRef = useRef<HTMLCanvasElement>(null);
  const feedRef = useRef<HTMLCanvasElement>(null);

  const [exportingStory, setExportingStory] = useState(false);
  const [exportingFeed, setExportingFeed] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [feedState, setFeedState] = useState<LaminaState>(DEFAULT_LAMINA_STATE);
  const [storyState, setStoryState] = useState<LaminaState>(DEFAULT_LAMINA_STATE);

  const { imageEl, loading: imageLoading } = useDestinationImage(data.destino);

  // Redraw feed thumbnail
  useEffect(() => {
    if (!feedRef.current) return;
    drawFeed(feedRef.current, data, FW, FH, imageEl, { laminaState: feedState });
  }, [data, imageEl, feedState]);

  // Redraw story thumbnail
  useEffect(() => {
    if (!storyRef.current) return;
    drawStory(storyRef.current, data, SW, SH, imageEl, { laminaState: storyState });
  }, [data, imageEl, storyState]);

  const handleExportFeed = async () => {
    setExportingFeed(true);
    try {
      const canvas = document.createElement("canvas");
      const scale = 1080 / FW;
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" style={{ color: "#00b4c8" }} />
            <h2 className="text-2xl font-display font-semibold">Lâminas</h2>
            {imageLoading && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                Carregando foto...
              </span>
            )}
            {!imageLoading && imageEl && (
              <span className="text-xs text-emerald-600 font-medium">● Foto carregada</span>
            )}
          </div>
          <Button
            onClick={() => setEditorOpen(true)}
            style={{ background: "#00b4c8", color: "#003d45" }}
            className="gap-2 font-semibold text-sm"
          >
            <Edit2 className="w-4 h-4" />
            Abrir Editor
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* ── Feed ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="font-semibold text-sm">Feed</p>
                <p className="text-xs text-muted-foreground">1080 × 1080 px</p>
              </div>
              <Button
                onClick={handleExportFeed}
                disabled={exportingFeed}
                size="sm"
                style={{ background: "#00b4c8", color: "#0d1b2a" }}
                className="hover:opacity-90 font-semibold text-xs"
              >
                {exportingFeed
                  ? <><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Gerando...</>
                  : <><Download className="w-3 h-3 mr-1" />Exportar PNG</>}
              </Button>
            </div>
            <div className="flex justify-center">
              <div style={{ borderRadius: 12, overflow: "hidden", boxShadow: "0 10px 40px rgba(0,0,0,0.3)" }}>
                <canvas ref={feedRef} width={FW} height={FH} style={{ display: "block" }} />
              </div>
            </div>
          </div>

          {/* ── Story ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="font-semibold text-sm">Story</p>
                <p className="text-xs text-muted-foreground">1080 × 1350 px</p>
              </div>
              <Button
                onClick={handleExportStory}
                disabled={exportingStory}
                size="sm"
                style={{ background: "#00b4c8", color: "#0d1b2a" }}
                className="hover:opacity-90 font-semibold text-xs"
              >
                {exportingStory
                  ? <><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Gerando...</>
                  : <><Download className="w-3 h-3 mr-1" />Exportar PNG</>}
              </Button>
            </div>
            <div className="flex justify-center">
              <div style={{ borderRadius: 12, overflow: "hidden", boxShadow: "0 10px 40px rgba(0,0,0,0.3)" }}>
                <canvas ref={storyRef} width={SW} height={SH} style={{ display: "block" }} />
              </div>
            </div>
          </div>
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
