import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PdfUpload from "@/components/PdfUpload";
import CanvasPreview from "@/components/CanvasPreview";
import VideoGenerator from "@/components/VideoGenerator";
import ScriptGenerator from "@/components/ScriptGenerator";
import ProductPage from "@/components/ProductPage";
import DataDashboard from "@/components/DataDashboard";
import { TravelData } from "@/types/travel";
import { Image, Video, FileText, Globe, RefreshCw, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [travelData, setTravelData] = useState<TravelData | null>(null);
  const [activeTab, setActiveTab] = useState("lamina");
  const [generated, setGenerated] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (travelData) localStorage.setItem("bwt-session", JSON.stringify(travelData));
  }, [travelData]);

  const handleClear = () => {
    localStorage.removeItem("bwt-session");
    setTravelData(null);
    setGenerated(new Set());
    setActiveTab("lamina");
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setGenerated(prev => new Set(prev).add(tab));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header — só aparece quando há dados */}
      {travelData && (
        <header className="sticky top-0 z-50 border-b" style={{background:"#0d1b2a",borderColor:"rgba(0,180,200,0.2)"}}>
          <div className="container max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-black text-xs"
                style={{background:"#00b4c8",color:"#0d1b2a"}}>BWT</div>
              <span className="font-display font-bold text-white tracking-wide text-sm">Content Agent</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
                style={{background:"rgba(0,180,200,0.15)",color:"#00b4c8"}}>
                <MapPin className="w-3 h-3"/>
                {travelData.destino}
              </div>
              <Button variant="ghost" size="sm" onClick={handleClear}
                className="text-white/50 hover:text-white hover:bg-white/10 gap-1.5 text-xs">
                <RefreshCw className="w-3 h-3"/>Novo orçamento
              </Button>
            </div>
          </div>
        </header>
      )}

      <main className={travelData ? "container max-w-7xl mx-auto px-4 py-6" : ""}>
        {!travelData ? (
          <PdfUpload onDataExtracted={setTravelData}/>
        ) : (
          <div className="grid lg:grid-cols-[360px_1fr] gap-6">
            {/* Painel esquerdo */}
            <div className="space-y-4 lg:max-h-[calc(100vh-80px)] lg:overflow-y-auto lg:pr-2">
              <DataDashboard data={travelData} onChange={setTravelData}/>
            </div>

            {/* Painel direito — abas */}
            <div>
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="w-full grid grid-cols-4 mb-6 h-12 rounded-xl p-1"
                  style={{background:"#0d1b2a"}}>
                  {[
                    {v:"lamina",  icon:<Image className="w-4 h-4"/>,   label:"Lâmina"},
                    {v:"video",   icon:<Video className="w-4 h-4"/>,   label:"Vídeo"},
                    {v:"script",  icon:<FileText className="w-4 h-4"/>,label:"Script"},
                    {v:"pagina",  icon:<Globe className="w-4 h-4"/>,   label:"Página"},
                  ].map(tab => (
                    <TabsTrigger key={tab.v} value={tab.v}
                      className="rounded-lg text-xs font-medium gap-1.5 transition-all data-[state=active]:text-[#0d1b2a]"
                      style={{color:"rgba(200,216,232,0.6)"}}>
                      {tab.icon}
                      <span className="hidden sm:inline">{tab.label}</span>
                      {generated.has(tab.v) && tab.v !== activeTab && (
                        <span className="w-1.5 h-1.5 rounded-full ml-0.5" style={{background:"#00b4c8"}}/>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsContent value="lamina"><CanvasPreview data={travelData}/></TabsContent>
                <TabsContent value="video"><VideoGenerator data={travelData}/></TabsContent>
                <TabsContent value="script"><ScriptGenerator data={travelData}/></TabsContent>
                <TabsContent value="pagina"><ProductPage data={travelData}/></TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
