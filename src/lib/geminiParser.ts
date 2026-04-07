import { GoogleGenerativeAI } from "@google/generative-ai";
import type { TravelData, MarketingContent } from "@/types/travel";
import { parseTravelData } from "./pdfParser";

const GEMINI_PROMPT = `Você é um especialista em turismo e marketing digital, especializado em analisar orçamentos do sistema Infotera (BWT Operadora, Brasil) e criar conteúdo de marketing personalizado para agências de viagens revendedoras.

Analise o texto do orçamento fornecido e retorne EXCLUSIVAMENTE um JSON válido (sem markdown, sem bloco de código, sem explicações) com exatamente esta estrutura:

{
  "travelData": {
    "destino": "nome da cidade/destino (ex: Fortaleza, Cancún, Punta Cana)",
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
    "origemVoo": "cidade de origem do primeiro voo de ida",
    "tipoProduto": "Aéreo + Hotel | Aéreo + Hotel + Transfer | Cruzeiro | Hotel | Pacote",
    "campanha": null,
    "agencia": "nome da agência revendedora (quem emitiu o orçamento)",
    "inclui": ["item incluído 1", "item incluído 2"],
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
8. Retorne APENAS o JSON puro, sem nenhum texto antes ou depois`;

export async function parseWithGemini(
  pdfText: string,
): Promise<TravelData> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("[Gemini] VITE_GEMINI_API_KEY não configurada — usando parser local");
    return parseTravelData(pdfText);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent(
      `${GEMINI_PROMPT}\n\n--- TEXTO DO ORÇAMENTO INFOTERA ---\n\n${pdfText}`,
    );

    const raw = result.response.text().trim();

    // Remove markdown code fences se estiverem presentes
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

    // Calcula os preços derivados a partir do total extraído pelo Gemini
    const totalNum = parseMoneyToNumber(String(td.precoTotal ?? "0"));
    const numAdultos = Number(td.numAdultos) || 2;
    const parcelas = 10;
    const descontoNum = 0.05;

    const ppRaw = totalNum > 0 ? totalNum / numAdultos : 0;
    const precoPorPessoa = ppRaw > 0 ? formatMoney(ppRaw) : String(td.precoTotal ?? "Consultar");
    const precoParcela = ppRaw > 0 ? formatMoney(ppRaw / parcelas) : "Consultar";
    const precoAVista = ppRaw > 0 ? formatMoney(ppRaw * (1 - descontoNum)) : precoPorPessoa;

    return {
      destino: String(td.destino ?? "Destino"),
      hotel: String(td.hotel ?? "Hotel"),
      quartoTipo: td.quartoTipo ? String(td.quartoTipo) : undefined,
      regime: String(td.regime ?? "Consultar"),
      precoTotal: String(td.precoTotal ?? "R$ 0,00"),
      numAdultos,
      parcelas,
      precoPorPessoa,
      precoParcela,
      precoAVista,
      desconto: String(td.desconto ?? "5"),
      duracao: String(td.duracao ?? "Consultar"),
      dataInicio: td.dataInicio ? String(td.dataInicio) : undefined,
      dataFim: td.dataFim ? String(td.dataFim) : undefined,
      companhiaAerea: td.companhiaAerea ? String(td.companhiaAerea) : undefined,
      bagagem: td.bagagem ? String(td.bagagem) : undefined,
      origemVoo: td.origemVoo ? String(td.origemVoo) : undefined,
      agencia: td.agencia ? String(td.agencia) : undefined,
      tipoProduto: String(td.tipoProduto ?? "Pacote"),
      campanha: td.campanha ? String(td.campanha) : undefined,
      inclui: Array.isArray(td.inclui) ? (td.inclui as string[]) : [],
      roteiro: [],
      marketing,
    };
  } catch (err) {
    console.error("[Gemini] Erro — usando parser local como fallback:", err);
    return parseTravelData(pdfText);
  }
}

// ─── Utilitários ──────────────────────────────────────────────────────────────

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
