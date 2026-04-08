import { GoogleGenerativeAI } from "@google/generative-ai";
import type { TravelData, MarketingContent } from "@/types/travel";
import { parseTravelData } from "./pdfParser";

// ─── Prompt ──────────────────────────────────────────────────────────────────
//
// Formato imperativo — diz ao Gemini para EXTRAIR valores reais, não gerar descrições.

const buildPrompt = (pdfText: string) => `Você é um sistema especializado em extrair dados de orçamentos de viagem do sistema Infotera (BWT Operadora, Brasil) e gerar conteúdo de marketing para agências.

Analise o orçamento abaixo e retorne SOMENTE um JSON válido — sem explicações, sem markdown, sem blocos de código.

ORÇAMENTO:
---
${pdfText}
---

Extraia os valores REAIS do texto acima e preencha este JSON:

{
  "travelData": {
    "destino": "nome da cidade de DESTINO (onde o cliente vai ficar hospedado)",
    "hotel": "nome completo do hotel como aparece no documento",
    "quartoTipo": "tipo do quarto como aparece no documento, ou null se não houver",
    "regime": "regime alimentar exato: All Inclusive, Café da Manhã, Meia Pensão, Pensão Completa, ou Room Only",
    "precoTotal": "valor do campo Total com taxas, formato R$ X.XXX,XX",
    "numAdultos": 2,
    "duracao": "X Noites",
    "dataInicio": "data de check-in ou embarque no formato DD/MM/AAAA",
    "dataFim": "data de check-out ou retorno no formato DD/MM/AAAA",
    "companhiaAerea": "nome da companhia aérea ou null se não houver voo",
    "bagagem": "resumo da bagagem por adulto (ex: Sem mala despachada — mala de mão inclusa, ou 1 mala de 23kg por pessoa)",
    "origemVoo": "cidade de origem do primeiro voo de ida, ou null",
    "tipoProduto": "Aéreo + Hotel + Transfer se tiver traslado, Aéreo + Hotel se não tiver, ou Hotel se for só hospedagem",
    "campanha": null,
    "agencia": "nome da agência revendedora que aparece no cabeçalho do documento",
    "inclui": ["liste aqui cada serviço incluído no pacote separadamente"],
    "desconto": "5"
  },
  "marketing": {
    "captionInstagram": "escreva uma legenda criativa para Instagram sobre este pacote para ${data => data.destino}. Mencione o hotel, duração, regime, preço POR PESSOA (total dividido pelo número de adultos) parcelado em 10x, desconto de 5% PIX. Use emojis e inclua hashtags relevantes ao destino no final.",
    "captionWhatsApp": "escreva uma mensagem de vendas para WhatsApp sobre este pacote. Use *negrito* para destaques. Preço POR PESSOA. Mencione a agência como contato.",
    "emailScript": "escreva um e-mail de vendas completo. Primeira linha: Assunto: [assunto aqui]. Depois o corpo do e-mail com apresentação, detalhes do pacote, preço POR PESSOA, formas de pagamento e assinatura da agência.",
    "reelsScript": [
      { "cena": 1, "tipo": "Hook", "duracao": "0–3s", "texto": "frase de impacto para abrir o vídeo sobre o destino" },
      { "cena": 2, "tipo": "Produto", "duracao": "3–7s", "texto": "apresenta hotel, duração e regime" },
      { "cena": 3, "tipo": "Oferta", "duracao": "7–11s", "texto": "preço por pessoa parcelado e opção PIX" },
      { "cena": 4, "tipo": "Inclui", "duracao": "11–14s", "texto": "serviços incluídos resumidamente" },
      { "cena": 5, "tipo": "CTA", "duracao": "14–15s", "texto": "chamada para ação contatando a agência" }
    ]
  }
}

IMPORTANTE:
- Preencha os campos com os VALORES REAIS extraídos do texto acima
- Preço no marketing = total ÷ adultos (por pessoa)
- Se o documento mostra "0x Mala despachada", a bagagem NÃO inclui mala de porão
- Retorne APENAS o JSON puro, sem nenhum caractere antes ou depois`;

// ─── Parser ───────────────────────────────────────────────────────────────────

export async function parseWithGemini(pdfText: string): Promise<TravelData> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("[Gemini] VITE_GEMINI_API_KEY não configurada — usando parser local");
    return parseTravelData(pdfText);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { temperature: 0.1 },
    });

    const result = await model.generateContent(buildPrompt(pdfText));
    const raw = result.response.text().trim();

    console.log("[Gemini] Resposta bruta (primeiros 500 chars):", raw.substring(0, 500));

    // Remove markdown code fences se presentes
    const jsonText = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();

    const parsed = JSON.parse(jsonText) as {
      travelData: Record<string, unknown>;
      marketing: MarketingContent;
    };

    const td = parsed.travelData;
    const marketing = parsed.marketing;

    console.log("[Gemini] travelData extraído:", td);

    // Calcula preços derivados a partir do total extraído
    const totalNum = parseMoneyToNumber(String(td.precoTotal ?? "0"));
    const numAdultos = Number(td.numAdultos) || 2;
    const parcelas = 10;

    const ppRaw = totalNum > 0 ? totalNum / numAdultos : 0;
    const precoPorPessoa = ppRaw > 0 ? formatMoney(ppRaw) : "Consultar";
    const precoParcela = ppRaw > 0 ? formatMoney(ppRaw / parcelas) : "Consultar";
    const precoAVista = ppRaw > 0 ? formatMoney(ppRaw * 0.95) : "Consultar";

    // Garante que destino e hotel são strings reais, não descrições
    const destino = cleanField(td.destino);
    const hotel = cleanField(td.hotel);

    return {
      destino: destino || "Destino",
      hotel: hotel || "Hotel",
      quartoTipo: td.quartoTipo && td.quartoTipo !== "null" ? cleanField(td.quartoTipo) : undefined,
      regime: cleanField(td.regime) || "Consultar",
      precoTotal: cleanField(td.precoTotal) || "R$ 0,00",
      numAdultos,
      parcelas,
      precoPorPessoa,
      precoParcela,
      precoAVista,
      desconto: "5",
      duracao: cleanField(td.duracao) || "Consultar",
      dataInicio: td.dataInicio && td.dataInicio !== "null" ? cleanField(td.dataInicio) : undefined,
      dataFim: td.dataFim && td.dataFim !== "null" ? cleanField(td.dataFim) : undefined,
      companhiaAerea: td.companhiaAerea && td.companhiaAerea !== "null" ? cleanField(td.companhiaAerea) : undefined,
      bagagem: td.bagagem && td.bagagem !== "null" ? cleanField(td.bagagem) : undefined,
      origemVoo: td.origemVoo && td.origemVoo !== "null" ? cleanField(td.origemVoo) : undefined,
      agencia: td.agencia && td.agencia !== "null" ? cleanField(td.agencia) : undefined,
      tipoProduto: cleanField(td.tipoProduto) || "Pacote",
      campanha: td.campanha && td.campanha !== "null" ? cleanField(td.campanha) : undefined,
      inclui: Array.isArray(td.inclui) ? (td.inclui as string[]).filter(Boolean) : [],
      roteiro: [],
      marketing,
    };
  } catch (err) {
    console.error("[Gemini] Erro:", err);
    console.warn("[Gemini] Usando parser local como fallback");
    return parseTravelData(pdfText);
  }
}

// ─── Utilitários ──────────────────────────────────────────────────────────────

function cleanField(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

function parseMoneyToNumber(str: string): number {
  // Aceita "R$ 5.864,74" → 5864.74
  const clean = str.replace(/[^\d,]/g, "").replace(",", ".");
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

function formatMoney(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
