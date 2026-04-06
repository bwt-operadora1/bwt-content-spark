import { Globe, Copy, Check } from "lucide-react";
import { useState, useMemo } from "react";
import { TravelData } from "@/types/travel";
import { Button } from "@/components/ui/button";

interface ProductPageProps {
  data: TravelData;
}

const ProductPage = ({ data }: ProductPageProps) => {
  const [copied, setCopied] = useState(false);

  const htmlCode = useMemo(() => {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.destino} - ${data.hotel} | BWT Operadora</title>
  <meta name="description" content="${data.destino} com ${data.regime} por ${data.precoTotal}. ${data.duracao} no ${data.hotel}. BWT Operadora.">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; color: #1a2a3a; background: #f7f9fc; }
    .hero { position: relative; height: 70vh; overflow: hidden; }
    .hero img { width: 100%; height: 100%; object-fit: cover; }
    .hero-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, transparent 40%, rgba(0,20,50,0.9)); display: flex; align-items: flex-end; padding: 60px; }
    .hero-content h1 { font-family: 'Playfair Display', serif; font-size: 3.5rem; color: white; margin-bottom: 8px; }
    .hero-content p { color: rgba(255,255,255,0.8); font-size: 1.2rem; }
    .container { max-width: 1100px; margin: 0 auto; padding: 60px 24px; }
    .grid { display: grid; grid-template-columns: 2fr 1fr; gap: 48px; }
    .card { background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
    .price-card { background: linear-gradient(135deg, #0a2540, #1a3a5c); color: white; border-radius: 16px; padding: 32px; position: sticky; top: 24px; }
    .badge { background: #00b4d8; color: white; padding: 6px 16px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; display: inline-block; margin-bottom: 16px; }
    .price-big { font-size: 3rem; font-weight: 800; color: #d4a853; }
    .inclui li { padding: 8px 0; border-bottom: 1px solid #eee; font-size: 0.95rem; }
    .cta { display: block; width: 100%; padding: 16px; background: #d4a853; color: #0a2540; font-weight: 700; font-size: 1.1rem; border: none; border-radius: 12px; cursor: pointer; text-align: center; margin-top: 24px; }
    @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } .hero-content h1 { font-size: 2rem; } }
  </style>
</head>
<body>
  <div class="hero">
    <img src="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=80" alt="${data.destino}">
    <div class="hero-overlay">
      <div class="hero-content">
        <span class="badge">${data.tipoProduto || "Pacote Completo"}</span>
        <h1>${data.destino}</h1>
        <p>${data.hotel} · ${data.duracao} · ${data.regime}</p>
      </div>
    </div>
  </div>
  <div class="container">
    <div class="grid">
      <div>
        <div class="card" style="margin-bottom:24px">
          <h2 style="font-family:'Playfair Display',serif;font-size:1.5rem;margin-bottom:16px">O que inclui</h2>
          <ul class="inclui" style="list-style:none">
            ${(data.inclui || []).map(item => `<li>✓ ${item}</li>`).join("\n            ")}
          </ul>
        </div>
        <div class="card">
          <h2 style="font-family:'Playfair Display',serif;font-size:1.5rem;margin-bottom:16px">Roteiro</h2>
          ${data.roteiro.map((item, i) => `<p style="padding:8px 0;border-bottom:1px solid #eee"><strong>Dia ${i + 1}:</strong> ${item}</p>`).join("\n          ")}
        </div>
      </div>
      <div>
        <div class="price-card">
          ${data.desconto ? `<span class="badge">Até ${data.desconto}% OFF</span>` : ""}
          <p style="opacity:0.7;font-size:0.9rem">A partir de</p>
          <p class="price-big">${data.parcelas}x R$ ${data.precoParcela?.replace("R$ ", "")}</p>
          <p style="opacity:0.8;margin-top:4px">Ou ${data.precoAVista}</p>
          <p style="opacity:0.5;font-size:0.8rem;margin-top:4px">por pessoa em apto duplo</p>
          ${data.dataInicio && data.dataFim ? `<p style="margin-top:16px;font-size:0.9rem">📅 ${data.dataInicio} a ${data.dataFim}</p>` : ""}
          ${data.companhiaAerea ? `<p style="font-size:0.9rem">✈️ Cia. Aérea: ${data.companhiaAerea}</p>` : ""}
          <button class="cta">Solicitar Orçamento</button>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
  }, [data]);

  const handleCopy = () => {
    navigator.clipboard.writeText(htmlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-accent" />
          <h2 className="text-2xl font-display font-semibold">Página do Produto</h2>
        </div>
        <Button onClick={handleCopy} size="sm" variant="outline" className="gap-2">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copiado!" : "Copiar HTML"}
        </Button>
      </div>

      {/* Preview */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="bg-muted/50 px-4 py-2 flex items-center gap-2 border-b border-border/50">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive/60" />
            <div className="w-3 h-3 rounded-full bg-accent/60" />
            <div className="w-3 h-3 rounded-full bg-primary/30" />
          </div>
          <span className="text-xs text-muted-foreground ml-2">bwtoperadora.com.br/{data.destino.toLowerCase().replace(/\s/g, "-")}</span>
        </div>
        <iframe
          srcDoc={htmlCode}
          className="w-full border-0"
          style={{ height: 500 }}
          title="Product Page Preview"
          sandbox="allow-same-origin"
        />
      </div>

      <div className="glass-card rounded-xl p-4">
        <details>
          <summary className="text-sm font-medium text-muted-foreground cursor-pointer">Ver código HTML</summary>
          <pre className="mt-3 text-xs text-foreground/80 overflow-x-auto whitespace-pre-wrap bg-muted/50 p-4 rounded-lg max-h-64 overflow-y-auto">
            {htmlCode}
          </pre>
        </details>
      </div>
    </div>
  );
};

export default ProductPage;
