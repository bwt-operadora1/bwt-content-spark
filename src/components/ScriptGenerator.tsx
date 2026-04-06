import { Video, Copy, Check, Sparkles } from "lucide-react";
import { useState, useMemo } from "react";
import { TravelData, VideoScene } from "@/types/travel";
import { Button } from "@/components/ui/button";

interface ScriptGeneratorProps {
  data: TravelData;
}

const ScriptGenerator = ({ data }: ScriptGeneratorProps) => {
  const [copied, setCopied] = useState(false);

  const scenes: VideoScene[] = useMemo(
    () => [
      { cena: 1, texto: `Malas prontas para ${data.destino}? ✈️🌴`, duracao: "0-5s" },
      { cena: 2, texto: `Hospedagem VIP no ${data.hotel} 🏨✨`, duracao: "5-10s" },
      { cena: 3, texto: `Tudo isso por apenas ${data.precoTotal}! 🔥💰`, duracao: "10-15s" },
    ],
    [data]
  );

  const caption = useMemo(
    () =>
      `✈️ ${data.destino} te espera! 🌊\n\n🏨 ${data.hotel}\n🌙 ${data.duracao} | 🍽️ ${data.regime}\n💰 A partir de ${data.precoTotal}\n\n📍 Roteiro inclui: ${data.roteiro.slice(0, 3).join(", ")}\n\n👉 Fale com a BWT e garanta sua vaga!\n\n#BWT #${data.destino.replace(/\s/g, "")} #Viagem #TudoIncluido #Promo`,
    [data]
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Script */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-accent" />
          <h2 className="text-2xl font-display font-semibold">Script para Reels</h2>
        </div>

        <div className="grid gap-3">
          {scenes.map((scene) => (
            <div key={scene.cena} className="glass-card rounded-xl p-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0">
                {scene.cena}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium mb-1">{scene.duracao}</p>
                <p className="text-foreground font-medium">{scene.texto}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Caption */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-display font-semibold">Legenda Viral</h3>
          </div>
          <Button onClick={handleCopy} size="sm" variant="outline" className="gap-2">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copiado!" : "Copiar"}
          </Button>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{caption}</p>
        </div>
      </div>
    </div>
  );
};

export default ScriptGenerator;
