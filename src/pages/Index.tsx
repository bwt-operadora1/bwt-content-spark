import { useState, useCallback, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import PdfUpload from "@/components/PdfUpload";
import CanvasPreview from "@/components/CanvasPreview";
import VideoGenerator from "@/components/VideoGenerator";
import ScriptGenerator from "@/components/ScriptGenerator";
import DataDashboard from "@/components/DataDashboard";
import { TravelData } from "@/types/travel";
import { Image, Video, FileText, Upload, Save, CheckCircle2, RefreshCw } from "lucide-react";

const Index = () => {
  const [travelData, setTravelData] = useState<TravelData | null>(null);
  const [activeTab, setActiveTab] = useState("lamina");
  const [isDirty, setIsDirty] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  // Key used to force remount of content tabs after save (to reset any internal state)
  const [contentKey, setContentKey] = useState(0);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Called by DataDashboard on every field change
  const handleDataChange = useCallback((data: TravelData) => {
    setTravelData(data);
    setIsDirty(true);
    setSaveState("idle");
  }, []);

  const handleSave = () => {
    if (!travelData) return;
    setSaveState("saving");

    // Persist to localStorage (same key used by PdfUpload)
    localStorage.setItem("bwt-session", JSON.stringify(travelData));

    // Force content tabs to re-render with fresh data
    setContentKey((k) => k + 1);
    setIsDirty(false);

    // Brief "saved" feedback then back to idle
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setTimeout(() => {
      setSaveState("saved");
      saveTimerRef.current = setTimeout(() => setSaveState("idle"), 2500);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src="https://www.bwtoperadora.com.br/images/logo-bwt.svg"
              alt="BWT Operadora"
              className="h-9"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div>
              <h1 className="text-xl font-display text-foreground uppercase tracking-wide leading-tight">
                Gerador de Lâminas BWT
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Gerador de Lâminas, Vídeos e Conteúdo de Viagem
              </p>
            </div>
          </div>

          {travelData && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.removeItem("bwt-session");
                setTravelData(null);
                setIsDirty(false);
                setSaveState("idle");
              }}
              className="shrink-0 gap-2"
            >
              <Upload className="w-3.5 h-3.5" />
              Novo Upload
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {!travelData ? (
          <div className="max-w-2xl mx-auto">
            <PdfUpload onDataExtracted={setTravelData} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">

            {/* ── Left sidebar: editable data ── */}
            <div className="lg:sticky lg:top-[73px] lg:max-h-[calc(100vh-89px)] lg:overflow-y-auto flex flex-col gap-0">
              <DataDashboard data={travelData} onChange={handleDataChange} />

              {/* ── Save banner ── */}
              <div
                className="transition-all duration-300 overflow-hidden"
                style={{ maxHeight: isDirty || saveState !== "idle" ? 120 : 0 }}
              >
                <div className="pt-3 pb-1">
                  {saveState === "saved" ? (
                    <div
                      className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                      style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981" }}
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Salvo! Lâminas, vídeo e textos atualizados.</span>
                    </div>
                  ) : (
                    <div
                      className="rounded-xl p-3 space-y-2"
                      style={{ background: "rgba(0,180,200,0.08)", border: "1px solid rgba(0,180,200,0.3)" }}
                    >
                      <p className="text-xs text-muted-foreground leading-snug">
                        Você tem alterações não salvas. Salve para atualizar lâminas, vídeo e textos.
                      </p>
                      <Button
                        className="w-full gap-2 font-semibold"
                        style={{ background: "#00b4c8", color: "#003d45" }}
                        onClick={handleSave}
                        disabled={saveState === "saving"}
                      >
                        {saveState === "saving" ? (
                          <><RefreshCw className="w-4 h-4 animate-spin" />Aplicando...</>
                        ) : (
                          <><Save className="w-4 h-4" />Salvar e Regerar Tudo</>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Right main: tabs ── */}
            <div className="min-w-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-muted">
                  <TabsTrigger value="lamina" className="flex items-center gap-1.5 text-xs sm:text-sm">
                    <Image className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Lâmina</span>
                    <span className="sm:hidden">Lâm.</span>
                  </TabsTrigger>
                  <TabsTrigger value="video" className="flex items-center gap-1.5 text-xs sm:text-sm">
                    <Video className="w-3.5 h-3.5" />
                    Vídeo
                  </TabsTrigger>
                  <TabsTrigger value="script" className="flex items-center gap-1.5 text-xs sm:text-sm">
                    <FileText className="w-3.5 h-3.5" />
                    Script
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="lamina" className="mt-6">
                  <CanvasPreview key={`lamina-${contentKey}`} data={travelData} onDataChange={handleDataChange} />
                </TabsContent>
                <TabsContent value="video" className="mt-6">
                  <VideoGenerator key={`video-${contentKey}`} data={travelData} />
                </TabsContent>
                <TabsContent value="script" className="mt-6">
                  <ScriptGenerator key={`script-${contentKey}`} data={travelData} />
                </TabsContent>

              </Tabs>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
