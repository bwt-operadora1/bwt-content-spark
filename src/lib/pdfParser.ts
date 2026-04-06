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
    
    // Preserve line breaks by detecting Y-position changes
    let lastY: number | null = null;
    let pageText = "";
    for (const item of content.items as any[]) {
      if (item.str === undefined) continue;
      const y = Math.round(item.transform?.[5] || 0);
      if (lastY !== null && Math.abs(y - lastY) > 3) {
        pageText += "\n";
      } else if (lastY !== null) {
        pageText += " ";
      }
      pageText += item.str;
      lastY = y;
    }
    fullText += pageText + "\n\n";
  }

  return fullText;
}

export function parseTravelData(text: string): TravelData {
  // Normalize whitespace but preserve line breaks for context
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const clean = lines.join(" ");
  const lineText = lines.join("\n");

  console.log("[PDF Parser] Extracted text preview:", clean.substring(0, 500));

  // ── Destino ──
  const destino = extractField(clean, [
    /destino[:\s]*([A-ZÀ-Úa-zà-ú][a-zà-ú]+(?:\s+(?:de\s+)?[A-ZÀ-Úa-zà-ú][a-zà-ú]+)*)/i,
    /(?:viagem|pacote|voo)\s+(?:para|a|à)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+(?:de\s+|del\s+)?[A-ZÀ-Ú][a-zà-ú]+)*)/i,
    /(?:ida|chegada)\s+(?:em|a)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+(?:de\s+|del\s+)?[A-ZÀ-Ú][a-zà-ú]+)*)/i,
    // Common destinations - expanded list
    /(Cancún|Cancun|Punta Cana|Orlando|Miami|Lisboa|Porto|Paris|Roma|Maldivas|Dubai|Santiago|Buenos Aires|Cartagena|Bariloche|Cusco|Riviera Maya|Playa del Carmen|Aruba|Curaçao|Curacao|Bahamas|Jamaica|Cuba|Havana|San Andrés|Bonaire|Los Cabos|Acapulco|Cabo San Lucas|Tulum|Nassau|Montego Bay|São Paulo|Rio de Janeiro|Fernando de Noronha|Jericoacoara|Porto Seguro|Gramado|Florianópolis|Foz do Iguaçu|Salvador|Natal|Fortaleza|Recife|Maceió|New York|Nova York|Los Angeles|Las Vegas|San Francisco|Londres|London|Madrid|Barcelona|Amsterdã|Amsterdam|Berlim|Berlin|Praga|Prague|Viena|Vienna|Budapeste|Budapest|Atenas|Athens|Santorini|Mykonos|Cairo|Marrakech|Cape Town|Bangkok|Tóquio|Tokyo|Bali|Seul|Seoul)/i,
    // Airport codes that map to destinations
    /(?:PUJ|CUN|MCO|MIA|LIS|CDG|FCO|DXB|MLE|SCL|EZE|CTG|CUZ|AUA|CUR)\b/i,
  ]) || extractDestinationFromAirport(clean) || "Destino";

  // ── Hotel ──
  const hotel = extractField(clean, [
    /hotel[:\s]+([^\n,;\.]+)/i,
    /hospedagem[:\s]+(?:no|na|em)\s+([^\n,;\.]+)/i,
    /check[\s-]*in[:\s]+(?:no|na|em)\s+([^\n,;\.]+)/i,
    // Common hotel brands / naming patterns
    /(\w+\s+(?:Hotel|Resort|Palace|Suites|Inn|Lodge|Spa|Beach|Bay|Club|Grand|Plaza|Royal)(?:\s+(?:&|e|and)\s+\w+)?(?:\s+\w+){0,3})/i,
    /((?:Grand|Impressive|Iberostar|Barceló|RIU|Hard Rock|Secrets|Dreams|Breathless|Royalton|Sandals|Hyatt|Hilton|Marriott|Sheraton|Meliá|Occidental|Bahia Principe)\s+[\w\s]+?)(?:\s*[-–,;.]|\s+All|\s+com|\s+\d)/i,
  ]) || "Hotel";

  // ── Preço Total ──
  // Try multiple price patterns - Infotera often shows "TOTAL: R$ X.XXX,XX"
  const precoTotal = extractField(clean, [
    /(?:total|valor\s+total|preço\s+total|investimento)[:\s]*R?\$?\s*([\d]+(?:\.[\d]{3})*(?:,\d{2}))/i,
    /R\$\s*([\d]+(?:\.[\d]{3})*(?:,\d{2}))/,
    /(?:total|valor)[:\s]*(\d{1,3}(?:\.\d{3})*,\d{2})/i,
  ]);
  const precoTotalFmt = precoTotal ? `R$ ${precoTotal}` : "R$ 0,00";

  // ── Parcelas ──
  const parcelasMatch = clean.match(/(\d{1,2})\s*[xX]\s*(?:de\s*)?R?\$?\s*([\d.,]+)/i);
  const parcelas = parcelasMatch ? parseInt(parcelasMatch[1]) : 10;
  const precoParcela = parcelasMatch ? `R$ ${parcelasMatch[2]}` : calcParcela(precoTotalFmt, parcelas);

  // ── Duração ──
  const duracao = extractField(clean, [
    /(\d+)\s*(?:noites?|nts?|diárias?)/i,
    /(\d+)\s*(?:dias?)\s*(?:e|\/)\s*(\d+)\s*(?:noites?)/i,
  ]);
  const duracaoFmt = duracao ? `${duracao} Noites` : "5 Noites";

  // ── Regime ──
  const regime = extractField(clean, [
    /(all\s*inclusive|all\s*in|meia\s*pens[ãa]o|caf[ée]\s*da\s*manh[ãa]|pensão\s*completa|sem\s*regime|room\s*only|só\s*hospedagem|bed\s*&?\s*breakfast)/i,
  ]) || "Consultar";

  // ── Datas ──
  const dataPatterns = [
    /(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)\s*(?:a|até|à|[-–])\s*(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)/i,
    /(?:saída|ida|embarque|partida)[:\s]*(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)/i,
  ];
  let dataInicio: string | undefined;
  let dataFim: string | undefined;
  const dataMatch = clean.match(dataPatterns[0]);
  if (dataMatch) {
    dataInicio = dataMatch[1];
    dataFim = dataMatch[2];
  } else {
    const saida = clean.match(dataPatterns[1]);
    if (saida) dataInicio = saida[1];
  }

  // ── Companhia aérea ──
  const companhia = extractField(clean, [
    /(GOL|LATAM|Azul|TAP|American\s*Airlines|Delta|United|Copa\s*Airlines|Avianca|JetBlue|Emirates|Qatar|Turkish|Air\s*France|KLM|Lufthansa|Iberia|British\s*Airways|Swiss|Alitalia|Aeroméxico|Aero\s*Mexico)/i,
  ]);

  // ── Desconto ──
  const descontoMatch = clean.match(/(\d{1,2})\s*%\s*(?:off|desconto|de\s*desconto|de\s*economia)/i);
  const desconto = descontoMatch ? descontoMatch[1] : undefined;

  // ── Inclui ──
  const incluiItems: string[] = [];
  
  // Pattern 1: Explicit "inclui" section
  const incluiMatch = lineText.match(/inclu[ií](?:s[ãa]o|do|i|dos|das|)[\s:]+(.+?)(?=(?:n[ãa]o\s+inclu|observa|condi[çc][õo]|valores|pre[çc]o|total|import|aten[çc]|$))/is);
  if (incluiMatch) {
    const items = incluiMatch[1].split(/[\n;•\-✓✔►▸]+/).filter(s => s.trim().length > 3);
    incluiItems.push(...items.map(s => s.trim().replace(/^[\s,]+|[\s,]+$/g, "")));
  }
  
  // Pattern 2: Look for bullet-like items with travel keywords
  if (incluiItems.length === 0) {
    const travelKeywords = /(?:aéreo|voo|transfer|traslado|seguro|hospedagem|noites?|all\s*inclusive|café|meia|pensão|passeio|city\s*tour|ingresso)/i;
    for (const line of lines) {
      if (travelKeywords.test(line) && line.length > 10 && line.length < 120) {
        const cleaned = line.replace(/^[\s•\-✓►▸\d.]+/, "").trim();
        if (cleaned.length > 5 && !incluiItems.includes(cleaned)) {
          incluiItems.push(cleaned);
        }
      }
    }
  }

  // ── Tipo de produto ──
  const tipoProduto = clean.match(/a[ée]reo\s*\+?\s*hotel/i) ? "Aéreo + Hotel"
    : clean.match(/pacote\s*completo/i) ? "Pacote Completo"
    : clean.match(/pacote/i) ? "Pacote"
    : clean.match(/cruzeiro/i) ? "Cruzeiro"
    : clean.match(/only\s*hotel|só\s*hotel|apenas\s*hotel/i) ? "Só Hotel"
    : incluiItems.some(i => /aéreo|voo/i.test(i)) ? "Aéreo + Hotel"
    : "Aéreo + Hotel";

  // ── Campanha ──
  const campanha = extractField(clean, [
    /(?:campanha|promoção|promo)[:\s]+([^\n,;]+)/i,
    /(operação\s+\w+(?:\s+\w+)?)/i,
    /(super\s+(?:sale|promo|oferta|desconto)(?:\s+\w+)?)/i,
  ]);

  // ── Roteiro ──
  const roteiro = incluiItems.length > 0
    ? incluiItems.slice(0, 5)
    : ["Consultar roteiro detalhado"];

  return {
    destino: normalizeDestino(destino),
    hotel: hotel.trim(),
    precoTotal: precoTotalFmt,
    precoParcela,
    parcelas,
    precoAVista: calcAVista(precoTotalFmt),
    duracao: duracaoFmt,
    regime: normalizeRegime(regime),
    roteiro,
    desconto,
    dataInicio,
    dataFim,
    companhiaAerea: companhia || undefined,
    inclui: incluiItems.length > 0 ? incluiItems : ["Consultar itens inclusos"],
    tipoProduto,
    campanha: campanha || undefined,
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

function extractDestinationFromAirport(text: string): string | undefined {
  const airportMap: Record<string, string> = {
    PUJ: "Punta Cana", CUN: "Cancún", MCO: "Orlando", MIA: "Miami",
    LIS: "Lisboa", CDG: "Paris", FCO: "Roma", DXB: "Dubai",
    MLE: "Maldivas", SCL: "Santiago", EZE: "Buenos Aires",
    CTG: "Cartagena", CUZ: "Cusco", AUA: "Aruba", CUR: "Curaçao",
    NAS: "Bahamas", MBJ: "Jamaica", HAV: "Havana", SXM: "St. Maarten",
    JFK: "New York", LAX: "Los Angeles", LAS: "Las Vegas",
    LHR: "Londres", MAD: "Madrid", BCN: "Barcelona", AMS: "Amsterdã",
    BKK: "Bangkok", NRT: "Tóquio", DPS: "Bali",
  };
  for (const [code, city] of Object.entries(airportMap)) {
    if (text.includes(code)) return city;
  }
  return undefined;
}

function normalizeDestino(d: string): string {
  const map: Record<string, string> = {
    "cancun": "Cancún", "punta cana": "Punta Cana", "puntacana": "Punta Cana",
    "curacao": "Curaçao", "maldives": "Maldivas", "lisbon": "Lisboa",
    "rome": "Roma", "buenos aires": "Buenos Aires",
  };
  return map[d.toLowerCase()] || d;
}

function normalizeRegime(r: string): string {
  const lower = r.toLowerCase().trim();
  if (/all\s*in/i.test(lower)) return "All Inclusive";
  if (/meia/i.test(lower)) return "Meia Pensão";
  if (/pensão\s*completa/i.test(lower)) return "Pensão Completa";
  if (/café|breakfast/i.test(lower)) return "Café da Manhã";
  if (/room\s*only|só\s*hosp/i.test(lower)) return "Room Only";
  return r;
}

function calcParcela(totalStr: string, parcelas: number): string {
  const num = parseFloat(totalStr.replace(/[^\d,]/g, "").replace(",", "."));
  if (isNaN(num) || parcelas <= 0) return totalStr;
  const perPerson = num / 2;
  const parcela = perPerson / parcelas;
  return `R$ ${parcela.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function calcAVista(totalStr: string): string {
  const num = parseFloat(totalStr.replace(/[^\d,]/g, "").replace(",", "."));
  if (isNaN(num)) return totalStr;
  const perPerson = num / 2;
  return `R$ ${perPerson.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}, à vista.`;
}
