import { Upload, Sparkles, AlertCircle } from "lucide-react";
import { useState, useCallback, useRef } from "react";
import { TravelData, SAMPLE_DATA } from "@/types/travel";
import { extractTextFromPdf, parseTravelData } from "@/lib/pdfParser";

interface PdfUploadProps {
  onDataExtracted: (data: TravelData) => void;
}

const PdfUpload = ({ onDataExtracted }: PdfUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      setError("Por favor, selecione um arquivo PDF.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const text = await extractTextFromPdf(file);

      if (!text || text.trim().length < 20) {
        setError("Não foi possível extrair texto do PDF. O arquivo pode ser uma imagem escaneada.");
        setIsProcessing(false);
        return;
      }

      const data = parseTravelData(text);
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
    <div className="flex flex-col items-center gap-8 py-16">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-display font-bold text-foreground">
          BWT <span className="text-accent">Content Agent</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-md">
          Transforme orçamentos em materiais de marketing incríveis
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleFileSelect}
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          w-full max-w-lg p-12 rounded-2xl border-2 border-dashed cursor-pointer
          transition-all duration-300 text-center
          ${isDragging
            ? "border-accent bg-accent/10 scale-[1.02]"
            : "border-border hover:border-accent/50 hover:bg-muted/50"
          }
          ${isProcessing ? "pointer-events-none opacity-70" : ""}
        `}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
            <p className="text-muted-foreground font-medium">Extraindo dados do PDF...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                Arraste o PDF do orçamento aqui
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                ou clique para selecionar o arquivo
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm max-w-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <button
        onClick={() => onDataExtracted(SAMPLE_DATA)}
        className="flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors font-medium"
      >
        <Sparkles className="w-4 h-4" />
        Usar dados de exemplo (Cancún)
      </button>
    </div>
  );
};

export default PdfUpload;
