import { Upload, Sparkles, AlertCircle, FileText } from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";
import { TravelData, SAMPLE_DATA } from "@/types/travel";
import { extractTextFromPdf, parseTravelData } from "@/lib/pdfParser";

interface PdfUploadProps {
  onDataExtracted: (data: TravelData) => void;
}

const PdfUpload = ({ onDataExtracted }: PdfUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Restaurar sessão anterior do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("bwt-session");
      if (saved) {
        const data = JSON.parse(saved) as TravelData;
        onDataExtracted(data);
      }
    } catch {
      // sessão inválida — ignora
    }
  }, []);

  const processFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      setError("Por favor, selecione um arquivo PDF.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setFileName(file.name);

    try {
      const text = await extractTextFromPdf(file);

      if (!text || text.trim().length < 20) {
        setError("Não foi possível extrair texto do PDF. O arquivo pode ser uma imagem escaneada.");
        setIsProcessing(false);
        return;
      }

      const data = parseTravelData(text);
      localStorage.setItem("bwt-session", JSON.stringify(data));
      onDataExtracted(data);
    } catch (err) {
      console.error("PDF processing error:", err);
      setError("Erro ao processar o PDF. Tente novamente ou use os dados de exemplo.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div
      style={{ background: "linear-gradient(160deg, #0d1b2a 0%, #0a2a3a 60%, #0d1b2a 100%)" }}
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
    >
      {/* Logo / Header */}
      <div className="flex flex-col items-center gap-3 mb-12">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center font-display font-black text-xl"
          style={{ background: "#00b4c8", color: "#0d1b2a" }}
        >
          BWT
        </div>
        <div className="text-center">
          <h1 className="font-display text-4xl font-black tracking-tight" style={{ color: "#ffffff" }}>
            Content <span style={{ color: "#00b4c8" }}>Agent</span>
          </h1>
          <p className="mt-2 text-sm font-medium" style={{ color: "rgba(200,216,232,0.7)" }}>
            Transforme orçamentos Infotera em materiais de marketing prontos
          </p>
        </div>
      </div>

      {/* Cards de funcionalidades */}
      <div className="grid grid-cols-2 gap-3 mb-10 w-full max-w-sm">
        {[
          { icon: "📸", label: "Lâmina Story", sub: "1080×1350 PNG" },
          { icon: "🎬", label: "Script Reels", sub: "Cenas + legenda" },
          { icon: "📝", label: "Copy Completo", sub: "WhatsApp + e-mail" },
          { icon: "🌐", label: "Página HTML", sub: "Pronta para publicar" },
        ].map((f) => (
          <div
            key={f.label}
            className="rounded-xl p-3 flex items-center gap-3"
            style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(0,180,200,0.2)" }}
          >
            <span className="text-2xl">{f.icon}</span>
            <div>
              <p className="text-xs font-semibold" style={{ color: "#fff" }}>
                {f.label}
              </p>
              <p className="text-xs" style={{ color: "rgba(200,216,232,0.5)" }}>
                {f.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Upload zone */}
      <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="w-full max-w-sm rounded-2xl cursor-pointer transition-all duration-300 text-center p-10"
        style={{
          border: isDragging ? "2px solid #00b4c8" : "2px dashed rgba(0,180,200,0.4)",
          background: isDragging ? "rgba(0,180,200,0.08)" : "rgba(255,255,255,0.03)",
          transform: isDragging ? "scale(1.02)" : "scale(1)",
          opacity: isProcessing ? 0.7 : 1,
          pointerEvents: isProcessing ? "none" : "auto",
        }}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: "rgba(0,180,200,0.3)", borderTopColor: "#00b4c8" }}
            />
            <div>
              <p className="font-semibold text-sm" style={{ color: "#fff" }}>
                {fileName ? `Lendo ${fileName}` : "Extraindo dados..."}
              </p>
              <p className="text-xs mt-1" style={{ color: "rgba(200,216,232,0.5)" }}>
                Analisando orçamento Infotera
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(0,180,200,0.15)" }}
            >
              <Upload className="w-8 h-8" style={{ color: "#00b4c8" }} />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "#fff" }}>
                Arraste o PDF do orçamento
              </p>
              <p className="text-xs mt-1" style={{ color: "rgba(200,216,232,0.5)" }}>
                ou clique para selecionar · Gerado pelo Infotera
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Erro */}
      {error && (
        <div
          className="flex items-center gap-2 text-sm mt-4 px-4 py-3 rounded-xl max-w-sm w-full"
          style={{ background: "rgba(220,53,69,0.15)", border: "0.5px solid rgba(220,53,69,0.3)", color: "#ff8090" }}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Dados de exemplo */}
      <button
        onClick={() => {
          localStorage.setItem("bwt-session", JSON.stringify(SAMPLE_DATA));
          onDataExtracted(SAMPLE_DATA);
        }}
        className="flex items-center gap-2 text-sm mt-6 transition-colors"
        style={{ color: "rgba(0,180,200,0.7)" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#00b4c8")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(0,180,200,0.7)")}
      >
        <Sparkles className="w-4 h-4" />
        Usar dados de exemplo (Punta Cana)
      </button>

      <p className="text-xs mt-8" style={{ color: "rgba(200,216,232,0.25)" }}>
        BWT Operadora · Curitiba/PR · bwtoperadora.com.br
      </p>
    </div>
  );
};

export default PdfUpload;
