import { FileText, Copy, Check, Sparkles, MessageCircle, Instagram } from "lucide-react";
import { useState, useMemo } from "react";
import { TravelData } from "@/types/travel";
import { Button } from "@/components/ui/button";

interface ScriptGeneratorProps {
  data: TravelData;
}

const ScriptGenerator = ({ data }: ScriptGeneratorProps) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const scenes = useMemo(
    () => [
      {
        cena: 1,
        duracao: "0–3s",
        tipo: "Hook",
        texto: `Você já imaginou acordar com essa vista em ${data.destino}? 🌊☀️`,
      },
      {
        cena: 2,
        duracao: "3–7s",
        tipo: "Produto",
        texto: `${data.hotel} — ${data.duracao} de puro luxo com ${data.regime}`,
      },
      {
        cena: 3,
        duracao: "7–11s",
        tipo: "Oferta",
        texto: `A partir de ${data.parcelas}x R$ ${data.precoParcela?.replace("R$ ", "")} por pessoa${data.desconto ? ` · ${data.desconto}% OFF` : ""}`,
      },
      {
        cena: 4,
        duracao: "11–14s",
        tipo: "Inclui",
        texto: `Aéreo + Hotel + Transfer + Seguro Viagem — tudo incluso ✅`,
      },
      { cena: 5, duracao: "14–15s", tipo: "CTA", texto: `Chama a BWT agora e garante sua vaga! 👇` },
    ],
    [data],
  );

  const captionInstagram = useMemo(
    () => `✈️ ${data.destino} te espera! 🌴

🏨 ${data.hotel}
🌙 ${data.duracao} | ${data.regime}
${data.desconto ? `🔥 Até ${data.desconto}% OFF\n` : ""}💰 A partir de ${data.parcelas}x R$ ${data.precoParcela?.replace("R$ ", "")}
${data.precoAVista ? `💳 Ou ${data.precoAVista}` : ""}
${data.dataInicio && data.dataFim ? `📅 ${data.dataInicio} a ${data.dataFim}` : ""}
${data.companhiaAerea ? `✈️ ${data.companhiaAerea}` : ""}

✅ O que inclui:
${(data.inclui || []).map((i) => `  • ${i}`).join("\n")}

👉 Solicite seu orçamento com a BWT Operadora!
📞 (41) 3888-3499 | bwtoperadora.com.br

#BWT #BWTOperadora #${data.destino.replace(/\s/g, "")} #Viagem #Turismo #${data.campanha?.replace(/\s/g, "") || "OperacaoCaribe"} #ViagemDeSonho #TudoIncluido #Pacote${data.desconto ? " #Promocao" : ""}`,
    [data],
  );

  const captionWhatsApp = useMemo(
    () => `🌴 *${data.destino} — Oferta Especial BWT*

🏨 *Hotel:* ${data.hotel}
🌙 *Duração:* ${data.duracao}
🍽️ *Regime:* ${data.regime}
${data.desconto ? `🔥 *Desconto:* Até ${data.desconto}% OFF\n` : ""}
💰 *A partir de:* ${data.parcelas}x R$ ${data.precoParcela?.replace("R$ ", "")}
${data.precoAVista ? `💳 *À vista:* ${data.precoAVista}` : ""}
${data.dataInicio && data.dataFim ? `📅 *Datas:* ${data.dataInicio} a ${data.dataFim}` : ""}
${data.companhiaAerea ? `✈️ *Cia. Aérea:* ${data.companhiaAerea}` : ""}

✅ *Inclui:*
${(data.inclui || []).map((i) => `  • ${i}`).join("\n")}

📲 Acesse: bwtoperadora.com.br
📞 (41) 3888-3499

_Valores por pessoa em apto duplo. Sujeito a disponibilidade._`,
    [data],
  );

  const CopyButton = ({ text, id, label }: { text: string; id: string; label?: string }) => (
    <Button onClick={() => copyText(text, id)} size="sm" variant="outline" className="gap-2 text-xs">
      {copiedId === id ? <Check className="w-3 h-3" style={{ color: "#00b4c8" }} /> : <Copy className="w-3 h-3" />}
      {copiedId === id ? "Copiado!" : label || "Copiar"}
    </Button>
  );

  return (
    <div className="space-y-6">
      {/* Script Reels */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5" style={{ color: "#00b4c8" }} />
          <h2 className="text-2xl font-display font-semibold">Script para Reels / TikTok</h2>
        </div>
        <div className="grid gap-2">
          {scenes.map((scene) => (
            <div key={scene.cena} className="rounded-xl p-4 flex items-start gap-4 glass-card">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
                style={{ background: "#0d1b2a", color: "#00b4c8", border: "1px solid rgba(0,180,200,0.3)" }}
              >
                {scene.cena}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold" style={{ color: "#00b4c8" }}>
                    {scene.tipo}
                  </span>
                  <span className="text-xs text-muted-foreground">{scene.duracao}</span>
                </div>
                <p className="text-sm text-foreground font-medium">{scene.texto}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Caption Instagram */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Instagram className="w-5 h-5" style={{ color: "#00b4c8" }} />
            <h3 className="text-lg font-display font-semibold">Legenda Instagram</h3>
          </div>
          <CopyButton text={captionInstagram} id="instagram" />
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{captionInstagram}</p>
        </div>
      </div>

      {/* Copy WhatsApp */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" style={{ color: "#00b4c8" }} />
            <h3 className="text-lg font-display font-semibold">Mensagem WhatsApp</h3>
          </div>
          <CopyButton text={captionWhatsApp} id="whatsapp" />
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-foreground whitespace-pre-line leading-relaxed font-mono">{captionWhatsApp}</p>
        </div>
      </div>
    </div>
  );
};

export default ScriptGenerator;
