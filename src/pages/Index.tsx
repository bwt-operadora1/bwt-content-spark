import { useState } from "react";
import { TravelData } from "@/types/travel";
import PdfUpload from "@/components/PdfUpload";
import DataDashboard from "@/components/DataDashboard";
import CanvasPreview from "@/components/CanvasPreview";
import ScriptGenerator from "@/components/ScriptGenerator";
import VideoGenerator from "@/components/VideoGenerator";
import ProductPage from "@/components/ProductPage";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [data, setData] = useState<TravelData | null>(null);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-2xl">
          <PdfUpload onDataExtracted={setData} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="container max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setData(null)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs bg-accent text-accent-foreground">
                BWT
              </div>
              <span className="font-display font-semibold text-foreground">Content Agent</span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground font-medium">{data.destino}</span>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[380px_1fr] gap-8">
          {/* Left Column - Data */}
          <div className="space-y-6">
            <DataDashboard data={data} onChange={setData} />
          </div>

          {/* Right Column - Outputs */}
          <div>
            <Tabs defaultValue="lamina" className="w-full">
              <TabsList className="w-full grid grid-cols-4 mb-6">
                <TabsTrigger value="lamina">📸 Lâmina</TabsTrigger>
                <TabsTrigger value="video">🎬 Vídeo</TabsTrigger>
                <TabsTrigger value="script">📝 Script</TabsTrigger>
                <TabsTrigger value="pagina">🌐 Página</TabsTrigger>
              </TabsList>
              <TabsContent value="lamina">
                <CanvasPreview data={data} />
              </TabsContent>
              <TabsContent value="video">
                <VideoGenerator data={data} />
              </TabsContent>
              <TabsContent value="script">
                <ScriptGenerator data={data} />
              </TabsContent>
              <TabsContent value="pagina">
                <ProductPage data={data} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
