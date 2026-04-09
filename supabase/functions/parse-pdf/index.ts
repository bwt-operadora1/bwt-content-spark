import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GEMINI_PROMPT = `Você é um especialista em turismo e marketing digital, especializado em analisar orçamentos do sistema Infotera (BWT Operadora, Brasil) e criar conteúdo de marketing personalizado para agências de viagens revendedoras.

Analise o texto do orçamento fornecido e retorne EXCLUSIVAMENTE um JSON válido (sem markdown, sem bloco de código, sem explicações) com exatamente esta estrutura:

{
  "travelData": {
    "destino": "cidade onde fica o HOTEL (cidade de hospedagem, NÃO a cidade de origem/embarque). Ex: hotel em Bariloche → 'Bariloche'; hotel em Fortaleza → 'Fortaleza'",
    "hotel": "nome completo do hotel",
    "quartoTipo": "tipo do quarto exatamente como aparece (ex: Quarto Duplo Standard)",
    "regime": "All Inclusive | Café da Manhã | Meia Pensão | Pensão Completa | Room Only",
    "precoTotal": "valor total para todos os passageiros no formato R$ X.XXX,XX",
    "numAdultos": 2,
    "duracao": "X Noites",
    "dataInicio": "DD/MM/AAAA",
    "dataFim": "DD/MM/AAAA",
    "companhiaAerea": "nome da companhia aérea",
    "bagagem": "resumo das bagagens (ex: Sem mala despachada — apenas bagagem de mão | 1 mala de 23kg por pessoa)",
    "origemVoo": "cidade e código IATA de ORIGEM do primeiro trecho do voo de ida, no formato 'Cidade (CÓDIGO)'. Ex: PVH → 'Porto Velho (PVH)', GRU → 'São Paulo (GRU)', SSA → 'Salvador (SSA)'. NUNCA coloque o destino aqui.",
    "tipoProduto": "Aéreo + Hotel | Aéreo + Hotel + Transfer | Cruzeiro | Hotel | Pacote",
    "campanha": null,
    "agencia": "nome da agência revendedora (quem emitiu o orçamento)",
    "inclui": ["Aéreo com [cia] em Classe Econômica", "Transfer de chegada e saída", "Seguro Viagem", "X Noites de hospedagem no [hotel]", "All Inclusive (Tudo Incluído)"],
    "desconto": "5"
  },
  "marketing": {
    "captionInstagram": "legenda criativa para post no feed do Instagram — mencione atrações únicas do destino, use emojis relevantes, inclua hashtags no final (mínimo 8 hashtags sobre o destino, viagem e turismo). Preço POR PESSOA.",
    "captionWhatsApp": "mensagem de vendas para WhatsApp usando *negrito* para títulos e valores. Preço POR PESSOA. Tom direto e persuasivo.",
    "emailScript": "e-mail de vendas completo com assunto na primeira linha (formato 'Assunto: ...'), saudação, apresentação do produto, detalhes do pacote, preço por pessoa, forma de pagamento e assinatura. Sem HTML.",
    "reelsScript": [
      { "cena": 1, "tipo": "Hook", "duracao": "0–3s", "texto": "frase de impacto que desperta curiosidade sobre o destino" },
      { "cena": 2, "tipo": "Produto", "duracao": "3–7s", "texto": "apresenta o hotel, duração e regime alimentar" },
      { "cena": 3, "tipo": "Oferta", "duracao": "7–11s", "texto": "preço por pessoa parcelado e desconto PIX" },
      { "cena": 4, "tipo": "Inclui", "duracao": "11–14s", "texto": "itens incluídos no pacote de forma resumida" },
      { "cena": 5, "tipo": "CTA", "duracao": "14–15s", "texto": "chamada para ação — cliente deve contatar a agência revendedora" }
    ]
  }
}

REGRAS OBRIGATÓRIAS:
1. O preço nos conteúdos de marketing deve ser SEMPRE POR PESSOA (total ÷ número de adultos)
2. Parcelas = preço por pessoa ÷ 10
3. Desconto à vista = 5% sobre o preço por pessoa
4. Se houver "0x Mala despachada" no orçamento, MENCIONE claramente na bagagem e nos scripts
5. O conteúdo de marketing deve referenciar a AGÊNCIA REVENDEDORA como contato, não a BWT diretamente
6. Contextualize o destino com atrações reais, clima e experiências únicas daquele lugar
7. Para destinos nacionais brasileiros, adapte o tom (praias nordestinas, gastronomia local, etc.)
8. O "destino" é SEMPRE a cidade onde fica o HOTEL (cidade de hospedagem). Use o endereço ou nome do hotel para confirmar. NUNCA use a cidade de origem/embarque do passageiro.
9. O nome do hotel deve ser extraído SEM símbolos de estrelas (☆ ★) ou caracteres especiais
10. Retorne APENAS o JSON puro, sem nenhum texto antes ou depois
11. O "origemVoo" é SEMPRE a cidade de onde o passageiro PARTE, no formato "Cidade (CÓDIGO)".`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfText } = await req.json();
    if (!pdfText || typeof pdfText !== "string") {
      return new Response(JSON.stringify({ error: "pdfText is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(
      "https://ai-gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: GEMINI_PROMPT,
            },
            {
              role: "user",
              content: `--- TEXTO DO ORÇAMENTO INFOTERA ---\n\n${pdfText}`,
            },
          ],
          temperature: 0.3,
          response_format: { type: "json_object" },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", response.status, errText);
      return new Response(JSON.stringify({ error: "Gemini API error", details: errText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const rawText = result.choices?.[0]?.message?.content ?? "";

    const jsonText = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();

    const parsed = JSON.parse(jsonText);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-pdf error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
