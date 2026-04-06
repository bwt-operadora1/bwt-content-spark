import { useState } from "react";
import { TravelData } from "@/types/travel";
import PdfUpload from "@/components/PdfUpload";
import DataDashboard from "@/components/DataDashboard";
import CanvasPreview from "@/components/CanvasPreview";
import ScriptGenerator from "@/components/ScriptGenerator";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

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
        <div className="container max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
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
      <main className="container max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Left Column */}
          <div className="space-y-10">
            <DataDashboard data={data} onChange={setData} />
            <ScriptGenerator data={data} />
          </div>

          {/* Right Column */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <CanvasPreview data={data} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
