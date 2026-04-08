import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PdfUpload from "@/components/PdfUpload";
import CanvasPreview from "@/components/CanvasPreview";
import VideoGenerator from "@/components/VideoGenerator";
import ScriptGenerator from "@/components/ScriptGenerator";
import ProductPage from "@/components/ProductPage";
import DataDashboard from "@/components/DataDashboard";
import { TravelData } from "@/types/travel";
import { Image, Video, FileText, Globe, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [travelData, setTravelData] = useState<TravelData | null>(null);
  const [activeTab, setActiveTab] = useState("lamina");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <img
            src="https://www.bwtoperadora.com.br/images/logo-bwt.svg"
            alt="BWT Operadora"
            className="h-10"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div>
            <h1 className="text-2xl font-display text-foreground uppercase tracking-wide">
              BWT Content Agent
            </h1>
            <p className="text-sm text-muted-foreground">
              Gerador de Lâminas, Vídeos e Conteúdo de Viagem
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!travelData ? (
          <div className="max-w-2xl mx-auto">
            <PdfUpload onDataExtracted={setTravelData} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-start gap-4">
              <DataDashboard data={travelData} onChange={setTravelData} />
              <Button
                onClick={() => {
                  localStorage.removeItem("bwt-session");
                  setTravelData(null);
                }}
                size="sm"
                variant="outline"
                className="shrink-0 gap-2"
              >
                <Upload className="w-4 h-4" />
                Novo Upload
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-muted">
                <TabsTrigger value="lamina" className="flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Lâmina
                </TabsTrigger>
                <TabsTrigger value="video" className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Vídeo
                </TabsTrigger>
                <TabsTrigger value="script" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Script
                </TabsTrigger>
                <TabsTrigger value="pagina" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
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
        )}
      </main>
    </div>
  );
};

export default Index;
