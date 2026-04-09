import type { TravelData, MarketingContent } from "@/types/travel";
import { parseTravelData } from "./pdfParser";

export async function parseWithGemini(
  pdfText: string,
): Promise<TravelData> {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase.functions.invoke("parse-pdf", {
      body: { pdfText },
    });

    if (error) {
      console.error("[parse-pdf] Edge function error:", error);
      return parseTravelData(pdfText);
    }

    const td = data.travelData;
    const marketing = data.marketing as MarketingContent;

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
