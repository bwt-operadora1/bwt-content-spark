import type { TravelData, MarketingContent } from "@/types/travel";
import { parseTravelData, validateBwtDocument } from "./pdfParser";

const GEMINI_API_KEY = (import.meta.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY) as string | undefined;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function parseWithGemini(pdfText: string): Promise<TravelData> {
  validateBwtDocument(pdfText);

  if (!GEMINI_API_KEY) {
    console.warn("[Gemini] No API key — using local parser");
    return parseTravelData(pdfText);
  }

  try {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(pdfText) }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
      }),
    });

    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);

    const json = await res.json();
    const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error("Empty Gemini response");

    const parsed = JSON.parse(rawText);
    const td = parsed.travelData;
    const marketing = parsed.marketing as MarketingContent;

    const totalNum = parseMoneyToNumber(String(td.precoTotal ?? "0"));
    const numAdultos = Number(td.numAdultos) || 2;
    const parcelas = 10;
    const descontoNum = 0.05;

    const ppRaw = totalNum > 0 ? totalNum / numAdultos : 0;
    const precoPorPessoa = ppRaw > 0 ? formatMoney(ppRaw) : String(td.precoTotal ?? "Consultar");
    const precoParcela = ppRaw > 0 ? formatMoney(ppRaw / parcelas) : "Consultar";
    const precoAVista = ppRaw > 0 ? formatMoney(ppRaw * (1 - descontoNum)) : precoPorPessoa;

    return {
      destino: cleanText(String(td.destino ?? "Destino")),
      hotel: cleanText(String(td.hotel ?? "Hotel")),
      quartoTipo: td.quartoTipo ? cleanText(String(td.quartoTipo)) : undefined,
      regime: cleanText(String(td.regime ?? "Consultar")),
      precoTotal: String(td.precoTotal ?? "R$ 0,00"),
      numAdultos,
      parcelas,
      precoPorPessoa,
      precoParcela,
      precoAVista,
      desconto: String(td.desconto ?? "5"),
      duracao: cleanText(String(td.duracao ?? "Consultar")),
      dataInicio: td.dataInicio ? String(td.dataInicio) : undefined,
      dataFim: td.dataFim ? String(td.dataFim) : undefined,
      companhiaAerea: td.companhiaAerea ? cleanText(String(td.companhiaAerea)) : undefined,
      bagagem: td.bagagem ? cleanText(String(td.bagagem)) : undefined,
      origemVoo: td.origemVoo ? cleanText(String(td.origemVoo)) : undefined,
      agencia: td.agencia ? cleanText(String(td.agencia)) : undefined,
      tipoProduto: cleanText(String(td.tipoProduto ?? "Pacote")),
      campanha: td.campanha ? cleanText(String(td.campanha)) : undefined,
      inclui: Array.isArray(td.inclui) ? (td.inclui as string[]).map(cleanText) : [],
      roteiro: [],
      marketing,
    };
  } catch (err) {
    console.error("[Gemini] Erro — usando parser local como fallback:", err);
    return parseTravelData(pdfText);
  }
}

function buildPrompt(pdfText: string): string {
  return `Você é um especialista em turismo. Analise o orçamento de viagem abaixo (exportado do Infotera) e retorne um JSON com dois campos: "travelData" e "marketing".

TEXTO DO PDF:
---
${pdfText.substring(0, 12000)}
---

Retorne SOMENTE JSON válido, sem markdown, sem explicações, no seguinte formato:

{
  "travelData": {
    "destino": "Nome do destino (cidade/país)",
    "hotel": "Nome completo do hotel",
    "quartoTipo": "Tipo de quarto/suíte ou null",
    "regime": "All Inclusive | Café da Manhã | Meia Pensão | Pensão Completa | Room Only | Consultar",
    "precoTotal": "R$ X.XXX,XX (total com taxas)",
    "numAdultos": 2,
    "desconto": "5",
    "duracao": "X Noites",
    "dataInicio": "DD/MM/AAAA ou null",
    "dataFim": "DD/MM/AAAA ou null",
    "companhiaAerea": "Nome da cia aérea ou null",
    "bagagem": "Descrição da bagagem ou null",
    "origemVoo": "Cidade de origem com código IATA ou null",
    "agencia": "Nome da agência de viagens ou null",
    "tipoProduto": "Aéreo + Hotel + Transfer | Aéreo + Hotel | Hotel | Pacote | Cruzeiro",
    "campanha": "Nome da campanha/operação ou null",
    "inclui": ["item 1", "item 2", "item 3"]
  },
  "marketing": {
    "reelsScript": [
      { "cena": 1, "duracao": "0–3s",  "tipo": "Hook",    "texto": "Frase de gancho impactante sobre o destino ✈️" },
      { "cena": 2, "duracao": "3–7s",  "tipo": "Produto", "texto": "Hotel + duração + regime em destaque" },
      { "cena": 3, "duracao": "7–11s", "tipo": "Oferta",  "texto": "Preço por pessoa em parcelas + desconto" },
      { "cena": 4, "duracao": "11–14s","tipo": "Inclui",  "texto": "3 principais itens inclusos no pacote" },
      { "cena": 5, "duracao": "14–15s","tipo": "CTA",     "texto": "Chamada para ação urgente 👇" }
    ],
    "captionInstagram": "Caption completa para Instagram com emojis, hashtags e CTA (máx 2200 chars)",
    "captionWhatsApp": "Mensagem de vendas formatada para WhatsApp com emojis e negrito (*texto*)",
    "emailScript": "E-mail de vendas completo com assunto na primeira linha (Assunto: ...) seguido do corpo"
  }
}`;
}

// ─── Utilitários ──────────────────────────────────────────────────────────────

function cleanText(text: string): string {
  return text
    .replace(/[^\u0020-\u024F\u1E00-\u1EFF]/g, "")
    .replace(/(\s*\*+)+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function parseMoneyToNumber(str: string): number {
  const num = parseFloat(str.replace(/[^\d,]/g, "").replace(",", "."));
  return isNaN(num) ? 0 : num;
}

function formatMoney(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
