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

  // ── Destino — derive from hotel address/name first, then airport arrival ──
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

  // ── Parcelas — look only at credit card line, default 10 ──
  const cartaoMatch = clean.match(/cart[ãa]o[^.]*?(\d{1,2})\s*[xX]/i) ||
    clean.match(/(\d{1,2})\s*[xX]\s+iguais/i);
  const parcelas = cartaoMatch ? parseInt(cartaoMatch[1]) : 10;
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

  // ── Agência ──
  const agencia = extractAgencia(clean, lines);

  // ── Bagagem ──
  const bagagem = extractBagagem(clean);

  // ── Origem do voo ──
  const origemVoo = extractOrigemVoo(clean);

  // ── Inclui ──
  const inclui = extractInclui(lines, hotel, companhiaAerea || "", duracao, bagagem);

  // ── Tipo de produto ──
  const hasAereo = /a[ée]reo/i.test(clean);
  const hasHotel = /hosp|hotel/i.test(clean);
  const hasTransfer = /transfer|traslado/i.test(clean);
  const tipoProduto = hasAereo && hasHotel && hasTransfer
    ? "Aéreo + Hotel + Transfer"
    : hasAereo && hasHotel
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
    bagagem: bagagem || undefined,
    origemVoo: origemVoo || undefined,
    agencia: agencia || undefined,
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

  // Pattern 2: Airport arrival codes — most reliable, derived from last arrival in Ida section
  // Run BEFORE knownDests so origin cities (GRU=São Paulo, PVH=Porto Velho) are never picked
  const airportDest = extractDestinationFromAirport(clean);
  if (airportDest) return airportDest;

  // Pattern 3: Known destination names found in hotel address/name context only
  // Restrict search to the hotel block (after "Hospedagem") to avoid matching origin cities
  const hotelBlock = (() => {
    const idx = clean.search(/hospedagem/i);
    return idx >= 0 ? clean.slice(idx, idx + 600) : "";
  })();
  const knownDests = [
    "Fortaleza", "Jericoacoara", "Fernando de Noronha",
    "Porto Seguro", "Porto Velho", "Porto Alegre",
    "Foz do Iguaçu", "Foz do Iguacu",
    "Rio de Janeiro", "São Paulo",
    "Florianópolis", "Florianopolis", "Balneário Camboriú",
    "Salvador", "Recife", "Natal", "Maceió", "Maceio",
    "Porto de Galinhas", "Morro de São Paulo",
    "Gramado", "Canela", "Bonito",
    "Manaus", "Belém", "Brasília", "Curitiba",
    "Punta Cana", "Riviera Maya", "Playa del Carmen", "Costa Mujeres",
    "Buenos Aires", "Bariloche", "Mendoza", "Córdoba",
    "New York", "Los Angeles", "Las Vegas",
    "Cancún", "Cancun", "Orlando", "Miami",
    "Lisboa", "Porto",
    "Paris", "Roma", "Londres", "Madrid", "Barcelona", "Amsterdã",
    "Maldivas", "Dubai", "Bangkok", "Tóquio", "Bali",
    "Santiago", "Cartagena", "Cusco", "Tulum",
    "Aruba", "Curaçao", "Curacao",
  ];
  for (const dest of knownDests) {
    if (hotelBlock.includes(dest)) return normalizeDestino(dest);
  }

  // Pattern 4: "destino: X"
  const destMatch = clean.match(/destino[:\s]+([A-ZÀ-Ú][\w\s]+?)(?=[,;.\n])/i);
  if (destMatch) return normalizeDestino(destMatch[1].trim());

  return "Destino";
}

function extractHotel(clean: string, lines: string[]): string {
  // Pattern 1: Infotera format — hotel name is the first substantive line after
  // the "Hospedagem" section header. "Hospedagem" and "Total" may be on separate
  // lines due to left/right PDF layout, so we find any "Hospedagem" section header
  // (not a reference to room-only or baggage) and scan subsequent lines.
  const HOTEL_SKIP = /^(total|check|noites|hóspedes|adultos|serviços|aéreo|incluso|datas|valores|powered|telefone|rua |av\. |bairro|\d+x\s*|\(|\d{2}\s)/i;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/hospedagem/i.test(line) && !/serviços|aéreo|sem\s+mala|quarto|check/i.test(line)) {
      // Confirm this is the hotel section (not the "Incluso" checklist) by
      // requiring "Total" to appear in the next 2 lines (Infotera always shows
      // "Hospedagem  Total ( N Adultos )" — possibly split across lines)
      const nearby = lines.slice(i, i + 3).join(" ");
      if (!/total/i.test(nearby)) continue;
      // Also accept the very next line being "Total ( N Adultos )" — skip it
      for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
        const candidate = lines[j];
        if (candidate.length < 4) continue;
        if (/total\s*\(/i.test(candidate)) continue;      // "Total ( 2 Adultos )"
        if (HOTEL_SKIP.test(candidate)) continue;
        if (/@|financeiro|telefone/i.test(candidate)) break; // hit agency info block
        return cleanHotelName(candidate);
      }
    }
  }

  // Pattern 2: Known hotel brands
  const brandMatch = clean.match(
    /((?:Grand\s+)?(?:Palladium|Impressive|Iberostar|Barceló|RIU|Hard Rock|Secrets|Dreams|Breathless|Royalton|Sandals|Hyatt|Hilton|Marriott|Sheraton|Meliá|Occidental|Bahia Principe)[\w\s]+?)(?:\s*[-–,;.]|\s+(?:Check|Suite|Tudo|All|Quarto|\d))/i
  );
  if (brandMatch) return cleanHotelName(brandMatch[1]);

  // Pattern 3: Standalone "Hotel XYZ" line (hotel name starts with "Hotel")
  for (const line of lines) {
    if (/^Hotel\s+\w/i.test(line) && line.length > 8 && !/Total|Telefone|^Hotel\s*$/.test(line)) {
      return cleanHotelName(line);
    }
  }

  // Pattern 4: "hotel: X" or inline mention
  const hotelMatch = clean.match(/hotel[:\s]+([A-ZÀ-Ú][\w\s,]+?)(?:\s*[-–,;.]|\s+(?:Check|Suite|Tudo|All|\d{2}\/\d{2}))/i);
  if (hotelMatch) return cleanHotelName(hotelMatch[1]);

  // Pattern 5: Resort/Palace/Suites etc. in name
  const resortMatch = clean.match(/((?:[\w\s]+\s)?(?:Resort|Palace|Suites|Lodge|Beach|Bay|Club|Grand|Plaza|Royal)[\w\s]*?)(?:\s*[-–,;.]|\s+(?:Check|Suite|Tudo|All|\d))/i);
  if (resortMatch) return cleanHotelName(resortMatch[1]);

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

function extractAgencia(clean: string, lines: string[]): string | undefined {
  // Pattern 1: "Powered by infotera [AGÊNCIA] - Orcamento:" — most reliable
  const poweredBy = clean.match(/Powered\s+by\s+infotera\s+([\w\sÀ-ú&.,'-]+?)\s*[-–]\s*Orcamento/i);
  if (poweredBy) return poweredBy[1].trim();

  // Pattern 2: Agency name in header — look for travel-agency-looking lines in first 25 lines
  for (let i = 0; i < Math.min(25, lines.length); i++) {
    const line = lines[i].trim();
    if (
      line.length > 4 && line.length < 70 &&
      /viagens?|turismo|travel|tours?|agência|agencia|receptivo/i.test(line) &&
      !/@|Telefone|BWT|infotera|Orcamento/i.test(line)
    ) {
      return line;
    }
  }
  return undefined;
}

function extractBagagem(clean: string): string | undefined {
  const re = /(\d+)x\s*Mala\s*despachada/gi;
  const counts: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(clean)) !== null) counts.push(parseInt(m[1], 10));
  if (counts.length === 0) return undefined;
  if (counts.every(n => n === 0)) return "Sem mala despachada — apenas bagagem de mão";
  const max = Math.max(...counts);
  return max > 0 ? `${max} mala(s) despachada(s) por pessoa` : undefined;
}

function extractOrigemVoo(clean: string): string | undefined {
  // Find the first time-code pattern in the "Ida" section: "HH:MM CODE"
  const idaSection = clean.match(/\bIda\b([\s\S]{0,600}?)(?:\bVolta\b|$)/i);
  if (idaSection) {
    const timeCode = idaSection[1].match(/\d{1,2}:\d{2}\s+([A-Z]{3})\b/);
    if (timeCode) {
      const code = timeCode[1];
      const city = airportCodeToCity(code);
      if (city) return `${city} (${code})`;
    }
  }
  return undefined;
}

function extractInclui(lines: string[], hotel: string, cia: string, duracao: string, bagagem?: string): string[] {
  const inclui: string[] = [];

  if (cia) {
    const bagNote = bagagem && /sem mala despachada/i.test(bagagem) ? " (sem mala despachada)" : "";
    inclui.push(`Aéreo com ${cia} em Classe Econômica${bagNote}`);
  }

  if (lines.some((l) => /transfer|traslado/i.test(l))) {
    inclui.push("Transfer de chegada e saída");
  }

  const seguroLine = lines.find((l) => /seguro/i.test(l) && l.length > 10 && l.length < 120);
  if (seguroLine) inclui.push("Seguro Viagem");

  if (hotel !== "Hotel") inclui.push(`${duracao} de hospedagem no ${hotel}`);

  if (lines.some((l) => /tudo\s*inclu[ií]do|all\s*inclusive/i.test(l))) {
    inclui.push("All Inclusive (Tudo Incluído)");
  } else if (lines.some((l) => /caf[ée]\s*da\s*manh[ãa]/i.test(l))) {
    inclui.push("Café da manhã");
  }

  return inclui;
}

function airportCodeToCity(code: string): string | undefined {
  const map: Record<string, string> = {
    FOR: "Fortaleza", NAT: "Natal", SSA: "Salvador", REC: "Recife",
    MCZ: "Maceió", GIG: "Rio de Janeiro", GRU: "São Paulo", CGH: "São Paulo",
    FLN: "Florianópolis", IGU: "Foz do Iguaçu", PVH: "Porto Velho",
    BSB: "Brasília", MAO: "Manaus", BEL: "Belém", CWB: "Curitiba",
    POA: "Porto Alegre", VCP: "Campinas", JPA: "João Pessoa",
    PUJ: "Punta Cana", CUN: "Cancún", MCO: "Orlando", MIA: "Miami",
    LIS: "Lisboa", CDG: "Paris", FCO: "Roma", DXB: "Dubai",
    MLE: "Maldivas", SCL: "Santiago", EZE: "Buenos Aires",
    CTG: "Cartagena", CUZ: "Cusco", AUA: "Aruba", CUR: "Curaçao",
    JFK: "New York", LAX: "Los Angeles", LAS: "Las Vegas",
    LHR: "Londres", MAD: "Madrid", BCN: "Barcelona",
  };
  return map[code];
}

// ─── Utilities ───

/** Strips star/rating symbols and non-printable characters from hotel names */
function cleanHotelName(name: string): string {
  return name
    // All Unicode symbol/emoji blocks
    .replace(/[^\u0020-\u024F\u1E00-\u1EFF]/g, "")
    // ASCII asterisks used as ratings
    .replace(/(\s*\*+)+/g, "")
    // Trailing punctuation and excess whitespace
    .replace(/[,;.]+$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function extractField(text: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  return undefined;
}

function extractDestinationFromAirport(text: string): string | undefined {
  const airportMap: Record<string, string> = {
    FOR: "Fortaleza", NAT: "Natal", SSA: "Salvador", REC: "Recife",
    MCZ: "Maceió", GIG: "Rio de Janeiro", GRU: "São Paulo", CGH: "São Paulo",
    FLN: "Florianópolis", IGU: "Foz do Iguaçu", PVH: "Porto Velho",
    BSB: "Brasília", MAO: "Manaus", BEL: "Belém", CWB: "Curitiba",
    POA: "Porto Alegre", VCP: "Campinas", JPA: "João Pessoa",
    PUJ: "Punta Cana", CUN: "Cancún", MCO: "Orlando", MIA: "Miami",
    LIS: "Lisboa", CDG: "Paris", FCO: "Roma", DXB: "Dubai",
    MLE: "Maldivas", SCL: "Santiago", EZE: "Buenos Aires",
    CTG: "Cartagena", CUZ: "Cusco", AUA: "Aruba", CUR: "Curaçao",
    BRC: "Bariloche", MDZ: "Mendoza", COR: "Córdoba",
    SXM: "St. Maarten", JFK: "New York", LAX: "Los Angeles",
    LAS: "Las Vegas", LHR: "Londres", MAD: "Madrid", BCN: "Barcelona",
    BKK: "Bangkok", NRT: "Tóquio", DPS: "Bali",
  };

  // Extract only the "Ida" section (before "Volta") to avoid picking up origin
  const idaSection = text.match(/\bIda\b([\s\S]*?)(?:\bVolta\b)/i)?.[1] ?? text;

  // Find all "HH:MM CODE" patterns in the Ida section — last arrival is the destination
  const timeCodeRe = /\d{1,2}:\d{2}\s+([A-Z]{3})\b/g;
  let last: string | undefined;
  let m: RegExpExecArray | null;
  while ((m = timeCodeRe.exec(idaSection)) !== null) {
    if (airportMap[m[1]]) last = m[1];
  }
  if (last) return airportMap[last];

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
