import { FileText, Copy, Check, MessageCircle, Instagram, Mail } from "lucide-react";
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

  // Script de Reels: usa conteúdo do Gemini ou fallback template
  const scenes = useMemo(() => {
    if (data.marketing?.reelsScript?.length) {
      return data.marketing.reelsScript;
    }
    // Fallback template
    return [
      { cena: 1, duracao: "0–3s", tipo: "Hook",    texto: `Você já imaginou acordar com essa vista em ${data.destino}? 🌊☀️` },
      { cena: 2, duracao: "3–7s", tipo: "Produto",  texto: `${data.hotel} — ${data.duracao} de puro luxo com ${data.regime}` },
      { cena: 3, duracao: "7–11s", tipo: "Oferta",  texto: `A partir de ${data.parcelas}x R$ ${data.precoParcela?.replace("R$ ", "")} por pessoa${data.desconto ? ` · ${data.desconto}% OFF` : ""}` },
      { cena: 4, duracao: "11–14s", tipo: "Inclui", texto: (data.inclui ?? []).slice(0, 3).join(" · ") || "Aéreo + Hotel + Transfer — tudo incluso ✅" },
      { cena: 5, duracao: "14–15s", tipo: "CTA",    texto: `Chama a ${data.agencia || "agência"} agora e garante sua vaga! 👇` },
    ];
  }, [data]);

  // Caption Instagram
  const captionInstagram = useMemo(() => {
    if (data.marketing?.captionInstagram) return data.marketing.captionInstagram;
    // Fallback
    return `✈️ ${data.destino} te espera! 🌴

🏨 ${data.hotel}
🌙 ${data.duracao} | ${data.regime}
${data.desconto ? `🔥 Até ${data.desconto}% OFF\n` : ""}💰 A partir de ${data.parcelas}x R$ ${data.precoParcela?.replace("R$ ", "")}
${data.precoAVista ? `💳 Ou ${data.precoAVista} à vista` : ""}
${data.dataInicio && data.dataFim ? `📅 ${data.dataInicio} a ${data.dataFim}` : ""}
${data.companhiaAerea ? `✈️ ${data.companhiaAerea}${data.origemVoo ? ` · saída de ${data.origemVoo}` : ""}` : ""}

✅ O que inclui:
${(data.inclui || []).map((i) => `  • ${i}`).join("\n")}

👉 Entre em contato com a ${data.agencia || "sua agência"} para solicitar seu orçamento!

#BWT #BWTOperadora #${data.destino.replace(/\s/g, "")} #Viagem #Turismo #ViagemDeSonho #PacoteDeTurismo #Promocao`;
  }, [data]);

  // Mensagem WhatsApp
  const captionWhatsApp = useMemo(() => {
    if (data.marketing?.captionWhatsApp) return data.marketing.captionWhatsApp;
    // Fallback
    return `🌴 *${data.destino} — Oferta Especial*

🏨 *Hotel:* ${data.hotel}
🌙 *Duração:* ${data.duracao}
🍽️ *Regime:* ${data.regime}
${data.bagagem ? `🧳 *Bagagem:* ${data.bagagem}\n` : ""}${data.desconto ? `🔥 *Desconto:* Até ${data.desconto}% OFF\n` : ""}
💰 *A partir de:* ${data.parcelas}x R$ ${data.precoParcela?.replace("R$ ", "")} /pessoa
${data.precoAVista ? `💳 *À vista:* ${data.precoAVista} /pessoa` : ""}
${data.dataInicio && data.dataFim ? `📅 *Datas:* ${data.dataInicio} a ${data.dataFim}` : ""}
${data.companhiaAerea ? `✈️ *Cia. Aérea:* ${data.companhiaAerea}${data.origemVoo ? ` · saída de ${data.origemVoo}` : ""}` : ""}

✅ *Inclui:*
${(data.inclui || []).map((i) => `  • ${i}`).join("\n")}

_Valores por pessoa em apto duplo. Sujeito a disponibilidade._`;
  }, [data]);

  // Script de Email
  const emailScript = useMemo(() => {
    if (data.marketing?.emailScript) return data.marketing.emailScript;
    // Fallback
    const agencia = data.agencia || "BWT Operadora";
    return `Assunto: ${data.destino} | ${data.duracao} a partir de ${data.parcelas}x R$ ${data.precoParcela?.replace("R$ ", "")} por pessoa

Olá!

Temos uma oferta especial para ${data.destino} que você não pode perder.

📍 DESTINO: ${data.destino}
🏨 HOTEL: ${data.hotel}
${data.quartoTipo ? `🛏️ QUARTO: ${data.quartoTipo}\n` : ""}🍽️ REGIME: ${data.regime}
🌙 DURAÇÃO: ${data.duracao}
${data.dataInicio && data.dataFim ? `📅 PERÍODO: ${data.dataInicio} a ${data.dataFim}\n` : ""}${data.companhiaAerea ? `✈️ VOO: ${data.companhiaAerea}${data.origemVoo ? ` · saída de ${data.origemVoo}` : ""}\n` : ""}${data.bagagem ? `🧳 BAGAGEM: ${data.bagagem}\n` : ""}
O QUE ESTÁ INCLUSO:
${(data.inclui || []).map((i) => `• ${i}`).join("\n")}

💰 INVESTIMENTO:
• ${data.parcelas}x R$ ${data.precoParcela?.replace("R$ ", "")} por pessoa (cartão)
${data.precoAVista ? `• R$ ${data.precoAVista?.replace("R$ ", "")} por pessoa à vista (${data.desconto || 5}% OFF no PIX)\n` : ""}
Entre em contato para garantir sua vaga!

Atenciosamente,
${agencia}`;
  }, [data]);

  const CopyButton = ({ text, id }: { text: string; id: string }) => (
    <Button onClick={() => copyText(text, id)} size="sm" variant="outline" className="gap-2 text-xs">
      {copiedId === id
        ? <Check className="w-3 h-3" style={{ color: "#00b4c8" }} />
        : <Copy className="w-3 h-3" />}
      {copiedId === id ? "Copiado!" : "Copiar"}
    </Button>
  );

  const hasAI = !!data.marketing;

  return (
    <div className="space-y-6">
      {hasAI && (
        <div
          className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
          style={{ background: "rgba(0,180,200,0.08)", border: "0.5px solid rgba(0,180,200,0.3)", color: "#00b4c8" }}
        >
          ✨ Conteúdo gerado com Gemini AI — personalizado para {data.destino}
          {data.agencia ? ` · Agência: ${data.agencia}` : ""}
        </div>
      )}

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
                  <span className="text-xs font-semibold" style={{ color: "#00b4c8" }}>{scene.tipo}</span>
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

      {/* Mensagem WhatsApp */}
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

      {/* Script de Email */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5" style={{ color: "#00b4c8" }} />
            <h3 className="text-lg font-display font-semibold">E-mail de Vendas</h3>
          </div>
          <CopyButton text={emailScript} id="email" />
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-foreground whitespace-pre-line leading-relaxed font-mono">{emailScript}</p>
        </div>
      </div>
    </div>
  );
};

export default ScriptGenerator;
