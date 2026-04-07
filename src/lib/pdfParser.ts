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
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const clean = lines.join(" ");
  const lineText = lines.join("\n");

  console.log("[PDF Parser] Text preview:", clean.substring(0, 800));

  // ── Número de adultos ──
  const adultosMatch = clean.match(/(\d+)\s*Adultos?\b/i);
  const numAdultos = adultosMatch ? parseInt(adultosMatch[1]) : 2;

  // ── Destino ──
  const destino = extractDestino(clean, lines);

  // ── Hotel ──
  const hotel = extractHotel(clean, lines);

  // ── Tipo de quarto ──
  const quartoTipo = extractQuartoTipo(clean, lines);

  // ── Regime ──
  const regime = extractRegime(clean);

  // ── Preço Total (Total com taxas) ──
  const precoTotal = extractPrecoTotal(clean);
  const totalNum = parseMoneyToNumber(precoTotal);

  // ── Preço por pessoa ──
  const precoPorPessoa = totalNum > 0
    ? formatMoney(totalNum / numAdultos)
    : precoTotal;

  // ── Parcelas ──
  const parcelasMatch = clean.match(/(?:em\s+até\s+)?(\d{1,2})\s*[xX]\s*(?:iguais|parcelas|de)?/i);
  const parcelas = parcelasMatch ? parseInt(parcelasMatch[1]) : 10;
  const precoParcela = totalNum > 0
    ? formatMoney(totalNum / numAdultos / parcelas)
    : "Consultar";

  // ── Desconto PIX ──
  const descontoMatch = clean.match(/(\d{1,2})\s*%\s*(?:de\s+)?desconto/i);
  const desconto = descontoMatch ? descontoMatch[1] : "5";
  const descontoNum = parseInt(desconto) / 100;
  const precoAVista = totalNum > 0
    ? formatMoney((totalNum / numAdultos) * (1 - descontoNum))
    : precoPorPessoa;

  // ── Duração ──
  const duracaoMatch = clean.match(/(\d+)\s*Noites?/i);
  const duracao = duracaoMatch ? `${duracaoMatch[1]} Noites` : "5 Noites";

  // ── Datas ──
  const { dataInicio, dataFim } = extractDatas(clean, lines);

  // ── Companhia Aérea ──
  const ciaMatch = clean.match(/(?:Voo\s+Operado\s+por|Operado\s+por)\s+([\w\s]+?)(?:\s+Classe|\s+Voo|\s*$)/i);
  const companhiaAerea = ciaMatch
    ? ciaMatch[1].trim()
    : extractField(clean, [
        /(GOL|LATAM|Azul|TAP|American Airlines|Copa Airlines|Avianca|JetBlue|Emirates|Delta|United)/i,
      ]);

  // ── Campanha ──
  const campanhaMatch = clean.match(/Operação\s+([\w\s\-]+?)(?:\s*[-–]|\s+Nº|\s+\d|$)/i);
  const campanha = campanhaMatch
    ? `Operação ${campanhaMatch[1].trim()}`
    : extractField(clean, [/(?:campanha|promoção)[:\s]+([^\n,;]+)/i]);

  // ── Roteiro ──
  const roteiro = extractRoteiro(lines);

  // ── Inclui ──
  const inclui = extractInclui(lines, hotel, companhiaAerea || "", duracao);

  // ── Tipo de produto ──
  const tipoProduto = clean.match(/a[ée]reo/i) && clean.match(/hosp|hotel/i)
    ? "Aéreo + Hotel"
    : clean.match(/cruzeiro/i)
      ? "Cruzeiro"
      : "Pacote";

  return {
    destino,
    hotel,
    quartoTipo: quartoTipo || undefined,
    precoTotal: totalNum > 0 ? formatMoney(totalNum) : "R$ 0,00",
    precoPorPessoa,
    precoParcela,
    parcelas,
    precoAVista,
    numAdultos,
    duracao,
    regime,
    roteiro,
    desconto,
    dataInicio,
    dataFim,
    companhiaAerea: companhiaAerea || undefined,
    inclui: inclui.length > 0 ? inclui : ["Consultar itens inclusos"],
    tipoProduto,
    campanha: campanha || undefined,
  };
}

// ─── Extraction helpers ───

function extractDestino(clean: string, lines: string[]): string {
  // Pattern 1: "Operação Caribe - Cancún" or "Operação Caribe – Punta Cana"
  const opMatch = clean.match(/Operação\s+[\w\s]+[-–]\s*([A-ZÀ-Úa-zà-ú][\w\s]*?)(?:\s+Nº|\s*$)/i);
  if (opMatch) return normalizeDestino(opMatch[1].trim());

  // Pattern 2: Known destination names
  const knownDests = [
    "Cancún", "Cancun", "Punta Cana", "Orlando", "Miami", "Lisboa", "Porto",
    "Paris", "Roma", "Maldivas", "Dubai", "Santiago", "Buenos Aires",
    "Cartagena", "Bariloche", "Cusco", "Riviera Maya", "Playa del Carmen",
    "Aruba", "Curaçao", "Curacao", "Costa Mujeres", "Tulum",
    "New York", "Las Vegas", "Los Angeles", "Londres", "Madrid", "Barcelona",
    "Amsterdã", "Bangkok", "Tóquio", "Bali", "Fernando de Noronha",
    "Gramado", "Florianópolis", "Foz do Iguaçu", "Salvador", "Natal",
    "Fortaleza", "Recife", "Maceió", "Porto Seguro", "Jericoacoara",
  ];
  for (const dest of knownDests) {
    if (clean.includes(dest)) return normalizeDestino(dest);
  }

  // Pattern 3: Airport codes
  const airportDest = extractDestinationFromAirport(clean);
  if (airportDest) return airportDest;

  // Pattern 4: "destino: X"
  const destMatch = clean.match(/destino[:\s]+([A-ZÀ-Ú][\w\s]+?)(?=[,;.\n])/i);
  if (destMatch) return normalizeDestino(destMatch[1].trim());

  return "Destino";
}

function extractHotel(clean: string, lines: string[]): string {
  // Pattern 1: Line after "Hospedagem Total" section — Infotera format
  for (let i = 0; i < lines.length; i++) {
    if (/hospedagem\s+total/i.test(lines[i])) {
      // Next non-empty line that's not a table header
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const line = lines[j];
        if (line.length > 5 && !/check|noites|hóspedes|adultos|\|/i.test(line)) {
          return line.replace(/[,;.]+$/, "").trim();
        }
      }
    }
  }

  // Pattern 2: Known hotel brands
  const brandMatch = clean.match(
    /((?:Grand\s+)?(?:Palladium|Impressive|Iberostar|Barceló|RIU|Hard Rock|Secrets|Dreams|Breathless|Royalton|Sandals|Hyatt|Hilton|Marriott|Sheraton|Meliá|Occidental|Bahia Principe)[\w\s]+?)(?:\s*[-–,;.]|\s+(?:Check|Suite|Tudo|All|Quarto|\d))/i
  );
  if (brandMatch) return brandMatch[1].trim();

  // Pattern 3: "hotel: X"
  const hotelMatch = clean.match(/hotel[:\s]+([^\n,;.]+)/i);
  if (hotelMatch) return hotelMatch[1].trim();

  // Pattern 4: "Resort" or "Hotel" in name
  const resortMatch = clean.match(/([\w\s]+(?:Resort|Hotel|Palace|Suites|Lodge|Beach|Bay|Club|Grand|Plaza|Royal)[\w\s]*?)(?:\s*[-–,;.]|\s+(?:Check|Suite|Tudo|All|\d))/i);
  if (resortMatch) return resortMatch[1].trim();

  return "Hotel";
}

function extractQuartoTipo(clean: string, lines: string[]): string | null {
  // Pattern: "Suite Júnior ao Lado da Piscina 2 Adultos" — line with room type before adults count
  for (const line of lines) {
    const roomMatch = line.match(/((?:Suite|Suíte|Quarto|Room|Studio|Villa|Bungalow|Cabana|Loft)[\w\sÀ-ú]+?)(?:\s*\d+\s*Adultos?|\s*$)/i);
    if (roomMatch && roomMatch[1].trim().length > 5) {
      return roomMatch[1].trim();
    }
  }

  // Pattern: "Standard", "Superior", "Deluxe" etc.
  const catMatch = clean.match(/((?:Standard|Superior|Deluxe|Premium|Master|Luxo|Select|Junior|Sênior)[\w\sÀ-ú]*?)(?:\s*\d|\s*[-,;.])/i);
  if (catMatch) return catMatch[1].trim();

  return null;
}

function extractRegime(clean: string): string {
  if (/tudo\s*inclu[ií]do|all\s*inclusive|all\s*in/i.test(clean)) return "All Inclusive";
  if (/meia\s*pens[ãa]o/i.test(clean)) return "Meia Pensão";
  if (/pens[ãa]o\s*completa/i.test(clean)) return "Pensão Completa";
  if (/caf[ée]\s*da\s*manh[ãa]|bed\s*&?\s*breakfast/i.test(clean)) return "Café da Manhã";
  if (/room\s*only|s[óo]\s*hosp/i.test(clean)) return "Room Only";
  return "Consultar";
}

function extractPrecoTotal(clean: string): string {
  // Pattern 1: "Total com taxas R$ X.XXX,XX" — Infotera standard
  const totalTaxasMatch = clean.match(/Total\s+com\s+taxas\s*[:\s]*R?\$?\s*([\d.]+,\d{2})/i);
  if (totalTaxasMatch) return `R$ ${totalTaxasMatch[1]}`;

  // Pattern 2: "Total: R$ X.XXX,XX"
  const totalMatch = clean.match(/(?:total|valor\s+total|preço\s+total|investimento)[:\s]*R?\$?\s*([\d.]+,\d{2})/i);
  if (totalMatch) return `R$ ${totalMatch[1]}`;

  // Pattern 3: Last/largest R$ value
  const allPrices = [...clean.matchAll(/R\$\s*([\d.]+,\d{2})/g)];
  if (allPrices.length > 0) {
    let max = 0;
    let maxStr = "";
    for (const m of allPrices) {
      const val = parseMoneyToNumber(`R$ ${m[1]}`);
      if (val > max) { max = val; maxStr = m[1]; }
    }
    if (maxStr) return `R$ ${maxStr}`;
  }

  return "R$ 0,00";
}

function extractDatas(clean: string, lines: string[]): { dataInicio?: string; dataFim?: string } {
  // Pattern 1: "01 ago 2026" ... "07 ago 2026" from header table
  const months: Record<string, string> = {
    jan: "01", fev: "02", mar: "03", abr: "04", mai: "05", jun: "06",
    jul: "07", ago: "08", set: "09", out: "10", nov: "11", dez: "12",
  };

  const datePattern = /(\d{1,2})\s+(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\s*(\d{4})?/gi;
  const dates: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = datePattern.exec(clean)) !== null) {
    const day = m[1].padStart(2, "0");
    const month = months[m[2].toLowerCase()] || "01";
    const year = m[3] || new Date().getFullYear().toString();
    dates.push(`${day}/${month}/${year}`);
  }

  if (dates.length >= 2) {
    return { dataInicio: dates[0], dataFim: dates[1] };
  }

  // Pattern 2: dd/mm/yyyy
  const dateSlash = clean.match(/(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s*(?:a|até|à|[-–])\s*(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/);
  if (dateSlash) {
    return { dataInicio: dateSlash[1], dataFim: dateSlash[2] };
  }

  return {};
}

function extractRoteiro(lines: string[]): string[] {
  const roteiro: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const diaMatch = lines[i].match(/^Dia\s+(\d+)\s*[:\-–]/i);
    if (diaMatch) {
      // Grab the next line as description, or the text after the colon
      const afterColon = lines[i].replace(/^Dia\s+\d+\s*[:\-–]\s*/i, "").trim();
      if (afterColon.length > 10) {
        // Shorten to first sentence
        const short = afterColon.split(/[.;]/)[0].trim();
        roteiro.push(short || afterColon.substring(0, 80));
      } else if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        const short = nextLine.split(/[.;]/)[0].trim();
        roteiro.push(short || nextLine.substring(0, 80));
      }
    }
  }

  if (roteiro.length === 0) {
    return ["Consultar roteiro detalhado"];
  }

  return roteiro.slice(0, 8);
}

function extractInclui(lines: string[], hotel: string, cia: string, duracao: string): string[] {
  const inclui: string[] = [];

  // Try to build from what we know
  if (cia) inclui.push(`Aéreo com ${cia} em Classe Econômica`);

  // Look for "Transfer" mentions
  if (lines.some((l) => /transfer/i.test(l))) {
    inclui.push("Transfer de chegada e saída");
  }

  // Look for "Seguro" mentions
  const seguroLine = lines.find((l) => /seguro/i.test(l) && l.length > 10 && l.length < 120);
  if (seguroLine) {
    inclui.push("Seguro Viagem");
  }

  // Hotel + duration
  if (hotel !== "Hotel") {
    inclui.push(`${duracao} de hospedagem no ${hotel}`);
  }

  // Regime
  if (lines.some((l) => /tudo\s*inclu[ií]do|all\s*inclusive/i.test(l))) {
    inclui.push("All Inclusive (Tudo Incluído)");
  }

  return inclui;
}

// ─── Utilities ───

function extractField(text: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  return undefined;
}

function extractDestinationFromAirport(text: string): string | undefined {
  const airportMap: Record<string, string> = {
    // Brasil
    FOR: "Fortaleza", NAT: "Natal", SSA: "Salvador", REC: "Recife",
    MCZ: "Maceió", GIG: "Rio de Janeiro", GRU: "São Paulo", CGH: "São Paulo",
    FLN: "Florianópolis", IGU: "Foz do Iguaçu", PVH: "Porto Velho",
    BSB: "Brasília", MAO: "Manaus", BEL: "Belém", CWB: "Curitiba",
    POA: "Porto Alegre", VCP: "Campinas", JPA: "João Pessoa",
    // Internacional
    PUJ: "Punta Cana", CUN: "Cancún", MCO: "Orlando", MIA: "Miami",
    LIS: "Lisboa", CDG: "Paris", FCO: "Roma", DXB: "Dubai",
    MLE: "Maldivas", SCL: "Santiago", EZE: "Buenos Aires",
    CTG: "Cartagena", CUZ: "Cusco", AUA: "Aruba", CUR: "Curaçao",
    SXM: "St. Maarten", JFK: "New York", LAX: "Los Angeles",
    LAS: "Las Vegas", LHR: "Londres", MAD: "Madrid", BCN: "Barcelona",
    BKK: "Bangkok", NRT: "Tóquio", DPS: "Bali",
  };
  for (const [code, city] of Object.entries(airportMap)) {
    // Match airport codes that appear as standalone (e.g., "CUN" not inside a word)
    if (new RegExp(`\\b${code}\\b`).test(text)) return city;
  }
  return undefined;
}

function normalizeDestino(d: string): string {
  const map: Record<string, string> = {
    cancun: "Cancún", "punta cana": "Punta Cana", puntacana: "Punta Cana",
    curacao: "Curaçao", curaçao: "Curaçao", maldives: "Maldivas",
    lisbon: "Lisboa", rome: "Roma", "buenos aires": "Buenos Aires",
    "costa mujeres": "Cancún",
  };
  return map[d.toLowerCase()] || d;
}

function parseMoneyToNumber(str: string): number {
  const num = parseFloat(str.replace(/[^\d,]/g, "").replace(",", "."));
  return isNaN(num) ? 0 : num;
}

function formatMoney(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
