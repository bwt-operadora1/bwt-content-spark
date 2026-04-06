import * as pdfjsLib from "pdfjs-dist";
import type { TravelData } from "@/types/travel";

// Use the bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => item.str)
      .join(" ");
    fullText += pageText + "\n";
  }

  return fullText;
}

export function parseTravelData(text: string): TravelData {
  const clean = text.replace(/\s+/g, " ");

  // Destino - look for common destination patterns
  const destino = extractField(clean, [
    /destino[:\s]+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/i,
    /para[:\s]+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/i,
    /(Cancún|Punta Cana|Orlando|Miami|Lisboa|Porto|Paris|Roma|Maldivas|Dubai|Santiago|Buenos Aires|Cartagena|Bariloche|Cusco|Riviera Maya)/i,
  ]) || "Destino";

  // Hotel
  const hotel = extractField(clean, [
    /hotel[:\s]+([^\n,;]+)/i,
    /hospedagem[:\s]+(?:no|na|em)\s+([^\n,;]+)/i,
    /(Grand\s+\w+(?:\s+\w+){0,3})/i,
    /(Impressive\s+\w+(?:\s+\w+){0,3})/i,
    /(Resort\s+\w+(?:\s+\w+){0,3})/i,
    /(\w+\s+(?:Hotel|Resort|Palace|Suites|Inn)(?:\s+\w+){0,2})/i,
  ]) || "Hotel";

  // Preço Total
  const precoTotal = extractField(clean, [
    /(?:total|valor total|preço total)[:\s]*R?\$?\s*([\d.,]+)/i,
    /R\$\s*([\d.,]+(?:\.\d{3})*(?:,\d{2})?)/,
  ]);
  const precoTotalFmt = precoTotal ? `R$ ${precoTotal}` : "R$ 0,00";

  // Parcelas
  const parcelasMatch = clean.match(/(\d{1,2})\s*x\s*(?:de\s*)?R?\$?\s*([\d.,]+)/i);
  const parcelas = parcelasMatch ? parseInt(parcelasMatch[1]) : 10;
  const precoParcela = parcelasMatch ? `R$ ${parcelasMatch[2]}` : precoTotalFmt;

  // Duração
  const duracao = extractField(clean, [
    /(\d+)\s*(?:noites?|diárias?)/i,
  ]);
  const duracaoFmt = duracao ? `${duracao} Noites` : "5 Noites";

  // Regime
  const regime = extractField(clean, [
    /(all\s*inclusive|meia\s*pens[ãa]o|caf[ée]\s*da\s*manh[ãa]|pensão\s*completa|sem\s*regime)/i,
  ]) || "Consultar";

  // Datas
  const dataMatch = clean.match(/(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)\s*(?:a|até|à)\s*(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)/i);
  const dataInicio = dataMatch ? dataMatch[1] : undefined;
  const dataFim = dataMatch ? dataMatch[2] : undefined;

  // Companhia aérea
  const companhia = extractField(clean, [
    /(GOL|LATAM|Azul|TAP|American Airlines|Delta|United|Copa Airlines|Avianca)/i,
  ]);

  // Desconto
  const descontoMatch = clean.match(/(\d{1,2})\s*%\s*(?:off|desconto|de desconto)/i);
  const desconto = descontoMatch ? descontoMatch[1] : undefined;

  // Inclui - extract bullet items
  const incluiItems: string[] = [];
  const incluiMatch = clean.match(/inclu[ií](?:s[ãa]o|i|)[\s:]+(.+?)(?=(?:n[ãa]o inclu|observa|condi[çc][õo]|valores|pre[çc]o|total|$))/i);
  if (incluiMatch) {
    const items = incluiMatch[1].split(/[;•\-✓✔]+/).filter(s => s.trim().length > 3);
    incluiItems.push(...items.map(s => s.trim()));
  }

  // Tipo de produto
  const tipoProduto = clean.match(/a[ée]reo\s*\+?\s*hotel/i) ? "Aéreo + Hotel"
    : clean.match(/pacote/i) ? "Pacote"
    : clean.match(/cruzeiro/i) ? "Cruzeiro"
    : "Aéreo + Hotel";

  // Roteiro
  const roteiro = incluiItems.length > 0
    ? incluiItems.slice(0, 5)
    : ["Consultar roteiro detalhado"];

  return {
    destino,
    hotel,
    precoTotal: precoTotalFmt,
    precoParcela,
    parcelas,
    precoAVista: `${precoTotalFmt}, à vista.`,
    duracao: duracaoFmt,
    regime,
    roteiro,
    desconto,
    dataInicio,
    dataFim,
    companhiaAerea: companhia || undefined,
    inclui: incluiItems.length > 0 ? incluiItems : ["Consultar itens inclusos"],
    tipoProduto,
    campanha: undefined,
  };
}

function extractField(text: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return undefined;
}
