import * as pdfjsLib from "pdfjs-dist";
import type { TravelData } from "@/types/travel";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    let lastY: number | null = null;
    let pageText = "";
    for (const item of content.items as any[]) {
      if (item.str === undefined) continue;
      const y = Math.round(item.transform?.[5] || 0);
      if (lastY !== null && Math.abs(y - lastY) > 3) pageText += "\n";
      else if (lastY !== null) pageText += " ";
      pageText += item.str;
      lastY = y;
    }
    fullText += pageText + "\n\n";
  }
  return fullText;
}

function fmtBRL(v: number): string {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function parseTravelData(text: string): TravelData {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const flat = lines.join(" ");

  // 1. TOTAL COM TAXAS — formato exato Infotera
  const totalMatch = flat.match(/Total com taxas\s+R\$\s*([\d.]+,\d{2})/i);
  const total2pax = totalMatch ? parseFloat(totalMatch[1].replace(/\./g, "").replace(",", ".")) : 0;
  const pp = total2pax > 0 ? total2pax / 2 : 0;
  const parcela10 = pp > 0 ? pp / 10 : 0;

  // 2. CAMPANHA + DESTINO — "Operação Caribe - Cancún"
  // FIX: não usar /destino[:\s]/ que captura descrição de marketing
  const campMatch = flat.match(/Operação\s+(\w+(?:\s+\w+)?)\s*[-–]\s*([^\n]+?)(?:\s+N[ºo°]|\s+\d{1,2}\s+(?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)|\s{3,}|$)/i);
  const campanha = campMatch ? `Operação ${campMatch[1].trim()}` : undefined;
  let destino = campMatch ? campMatch[2].trim().replace(/\s+N[ºo°].*$/, "").trim() : "";

  if (!destino || destino.length > 20) {
    const known = ["Cancún","Cancun","Punta Cana","Aruba","Jamaica","Bahamas","Cuba","St. Martin",
      "Curaçao","Costa Rica","Miami","Orlando","Lisboa","Paris","Roma","Dubai","Maldivas",
      "Buenos Aires","Cartagena","Bariloche","Cusco","Riviera Maya","Los Cabos","Tulum","Santiago"];
    for (const d of known) {
      if (flat.toLowerCase().includes(d.toLowerCase())) { destino = d; break; }
    }
  }
  if (!destino) {
    const iata: Record<string,string> = {CUN:"Cancún",PUJ:"Punta Cana",MCO:"Orlando",MIA:"Miami",
      LIS:"Lisboa",CDG:"Paris",FCO:"Roma",DXB:"Dubai",MLE:"Maldivas",SCL:"Santiago",
      EZE:"Buenos Aires",CTG:"Cartagena",CUZ:"Cusco",AUA:"Aruba",CUR:"Curaçao",NAS:"Bahamas",MBJ:"Jamaica"};
    const codes = [...flat.matchAll(/\d{2}:\d{2}\s+([A-Z]{3})/g)].map(m => m[1]);
    for (const c of codes) { if (iata[c]) { destino = iata[c]; break; } }
  }
  if (!destino) destino = "Destino";

  // 3. HOTEL — "Hospedagem Total ( 2 Adultos ) Grand Palladium..."
  // FIX: usar a seção de Hospedagem, não /hotel[:\s]/
  let hotel = "";
  const hotelM = flat.match(/Hospedagem\s+Total\s*\(\s*\d+\s*Adultos?\s*\)\s+([^\n]+?)(?:\s+Vialidad|\s+Rua\s|\s+Av\s|\s+Check|\s{3,}|,\s+\w+\s+MX)/i);
  if (hotelM) {
    hotel = hotelM[1].trim();
  } else {
    const brands = [/Grand\s+Palladium\s+[\w\s]+?(?=\s{2,}|Check|Vialidad)/i,/Impressive\s+[\w\s]+?(?=\s{2,}|Check)/i,
      /Iberostar\s+[\w\s]+?(?=\s{2,}|Check)/i,/Hard\s+Rock\s+[\w\s]+?(?=\s{2,}|Check)/i,
      /RIU\s+[\w\s]+?(?=\s{2,}|Check)/i,/Royalton\s+[\w\s]+?(?=\s{2,}|Check)/i,
      /Hyatt\s+[\w\s]+?(?=\s{2,}|Check)/i,/Hilton\s+[\w\s]+?(?=\s{2,}|Check)/i,
      /Barceló\s+[\w\s]+?(?=\s{2,}|Check)/i,/Meliá\s+[\w\s]+?(?=\s{2,}|Check)/i,
      /Dreams?\s+[\w\s]+?(?=\s{2,}|Check)/i,/Secrets?\s+[\w\s]+?(?=\s{2,}|Check)/i];
    for (const p of brands) { const m = flat.match(p); if (m) { hotel = m[0].trim(); break; } }
  }
  if (!hotel) hotel = "Hotel";

  // 4. DURAÇÃO
  const durM = flat.match(/\((\d+)\s*Noites?\)/i) ?? flat.match(/(\d+)\s*Noites?/i);
  const duracao = durM ? `${durM[1]} Noites` : "5 Noites";

  // 5. REGIME
  const regime = /Tudo\s+inclu[íi]do/i.test(flat) || /All\s+Inclusive/i.test(flat) ? "All Inclusive"
    : /Meia\s+pens[ãa]o/i.test(flat) ? "Meia Pensão"
    : /Caf[ée]\s+da\s+manh[ãa]/i.test(flat) ? "Café da Manhã"
    : "All Inclusive";

  // 6. DATAS — "01 ago 2026" "07 ago 2026"
  const dataAll = flat.match(/(\d{1,2}\s+(?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\w*\s+\d{4})/gi);
  const dataInicio = dataAll?.[0];
  const dataFim = dataAll?.[1];

  // 7. CIA AÉREA
  const ciaM = flat.match(/Voo\s+Operado\s+por\s+([\w]+(?:\s+[\w]+)?)/i)
    ?? flat.match(/(LATAM|GOL|Azul|TAP|American\s*Airlines|Copa\s*Airlines|Avianca|United|Delta)/i);
  const companhiaAerea = ciaM?.[1]?.trim();

  // 8. ROTA
  const rotaCodes = [...flat.matchAll(/\d{2}:\d{2}\s+([A-Z]{3})/g)].map(m => m[1]);
  const rOrig = rotaCodes[0];
  const rDest = rotaCodes.find(c => c !== rOrig);

  // 9. TIPO
  const tipoProduto = /cruzeiro/i.test(flat) ? "Cruzeiro" : "Aéreo + Hotel";

  // 10. DESCONTO
  const descM = flat.match(/(\d{1,2})\s*%\s*(?:OFF|desconto)/i);
  const desconto = descM?.[1];

  // 11. INCLUI — construção inteligente a partir das seções do PDF
  const inclui: string[] = [];
  if (companhiaAerea) {
    const rota = rOrig && rDest ? `${rOrig} / ${rDest} / ${rOrig}` : "";
    inclui.push(`Aéreo ${rota} com ${companhiaAerea} — Classe Econômica`.replace(/\s{2,}/g, " ").trim());
  }
  if (/Transfer\s+de\s+Chegada/i.test(flat)) inclui.push("Transfer de chegada e saída");
  const segM = flat.match(/(UA\s+\d+K\s+[\w]+(?:\s+[\w]+)?)/i);
  if (segM) inclui.push(`Seguro Viagem ${segM[1]}`);
  if (hotel !== "Hotel") {
    const hotelN = flat.match(/Check-in.+?Noites\s+(\d+)\s+Noites/is)?.[1] ?? durM?.[1] ?? "5";
    inclui.push(`${hotelN} noites no ${hotel.split(" ").slice(0, 5).join(" ")}`);
  }
  if (/Tudo\s+inclu[íi]do|All\s+Inclusive/i.test(flat)) inclui.push("All Inclusive");
  if (inclui.length === 0) inclui.push("Consultar itens inclusos com a BWT");

  return {
    destino,
    hotel: hotel.trim().replace(/\s+/g, " "),
    precoTotal: total2pax > 0 ? `R$ ${fmtBRL(total2pax)}` : "R$ 0,00",
    precoParcela: parcela10 > 0 ? `R$ ${fmtBRL(parcela10)}` : "",
    parcelas: 10,
    precoAVista: pp > 0 ? `R$ ${fmtBRL(pp)}, à vista.` : "",
    duracao,
    regime,
    roteiro: inclui,
    desconto,
    dataInicio,
    dataFim,
    companhiaAerea: companhiaAerea ?? undefined,
    inclui,
    tipoProduto,
    campanha,
  };
}
