import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import PdfUpload from "@/components/PdfUpload";
import CanvasPreview from "@/components/CanvasPreview";
import VideoGenerator from "@/components/VideoGenerator";
import ScriptGenerator from "@/components/ScriptGenerator";
import ProductPage from "@/components/ProductPage";
import DataDashboard from "@/components/DataDashboard";
import { TravelData } from "@/types/travel";
import { Image, Video, FileText, Globe, Upload } from "lucide-react";

const Index = () => {
  const [travelData, setTravelData] = useState<TravelData | null>(null);
  const [activeTab, setActiveTab] = useState("lamina");

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
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div>
              <h1 className="text-xl font-display text-foreground uppercase tracking-wide leading-tight">
                BWT Content Agent
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

            {/* Sidebar: dados editáveis */}
            <div className="lg:sticky lg:top-[61px] lg:max-h-[calc(100vh-77px)] lg:overflow-y-auto">
              <DataDashboard data={travelData} onChange={setTravelData} />
            </div>

            {/* Main: tabs de conteúdo */}
            <div className="min-w-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-muted">
                  <TabsTrigger value="lamina" className="flex items-center gap-1.5 text-xs sm:text-sm">
                    <Image className="w-3.5 h-3.5" />
                    Lâmina
                  </TabsTrigger>
                  <TabsTrigger value="video" className="flex items-center gap-1.5 text-xs sm:text-sm">
                    <Video className="w-3.5 h-3.5" />
                    Vídeo
                  </TabsTrigger>
                  <TabsTrigger value="script" className="flex items-center gap-1.5 text-xs sm:text-sm">
                    <FileText className="w-3.5 h-3.5" />
                    Script
                  </TabsTrigger>
                  <TabsTrigger value="pagina" className="flex items-center gap-1.5 text-xs sm:text-sm">
                    <Globe className="w-3.5 h-3.5" />
                    Página
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="lamina" className="mt-6">
                  <CanvasPreview data={travelData} />
                </TabsContent>
                <TabsContent value="video" className="mt-6">
                  <VideoGenerator data={travelData} />
                </TabsContent>
                <TabsContent value="script" className="mt-6">
                  <ScriptGenerator data={travelData} />
                </TabsContent>
                <TabsContent value="pagina" className="mt-6">
                  <ProductPage data={travelData} />
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
