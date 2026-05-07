export interface DestinationContext {
  name: string;
  aliases: string[];
  country: string;
  description: string;
  highlights: string[];
  imageKeyword: string;
  unsplashId: string; // curated photo ID for reliable images
  palette: {
    sky: string;
    water: string;
    sand: string;
    palm: string;
    accent: string;
  };
  emoji: string;
}

const DESTINATIONS: DestinationContext[] = [
  // ─── Brasil ───────────────────────────────────────────────────────────────
  {
    name: "João Pessoa",
    aliases: ["joão pessoa", "joao pessoa", "jampa", "tambaú", "tambau", "cabo branco", "paraíba", "paraiba"],
    country: "Brasil",
    description: "Praias urbanas, piscinas naturais e o pôr do sol mais famoso da Paraíba",
    highlights: ["Praia de Tambaú", "Cabo Branco", "Piscinas naturais do Seixas", "Pôr do sol do Jacaré"],
    imageKeyword: "Joao Pessoa Paraiba Brazil beach Cabo Branco Tambau",
    unsplashId: "cTFhub2BhaM",
    palette: { sky: "#87d4ea", water: "#20a0b8", sand: "#f0e4b0", palm: "#1a7a30", accent: "#00b4c8" },
    emoji: "🌅",
  },
  {
    name: "Fortaleza",
    aliases: ["fortaleza", "meireles", "praia de iracema", "praia do futuro", "cumbuco"],
    country: "Brasil",
    description: "Sol o ano todo, lagosta grelhada e as praias mais belas do Nordeste",
    highlights: ["Praia do Meireles", "Praia do Futuro", "Jericoacoara", "Gastronomia com lagosta"],
    imageKeyword: "fortaleza beach brazil",
    unsplashId: "cTFhub2BhaM",
    palette: { sky: "#7ec9e8", water: "#1a9ab0", sand: "#f5e6b0", palm: "#1a7a40", accent: "#00b4c8" },
    emoji: "🦞",
  },
  {
    name: "Natal",
    aliases: ["natal", "ponta negra", "genipabu", "rio grande do norte"],
    country: "Brasil",
    description: "Dunas douradas, lagoas e sol quase 300 dias por ano",
    highlights: ["Genipabu", "Ponta Negra", "Dunas de Maracajaú", "Buggy nas dunas"],
    imageKeyword: "natal brazil beach dunes",
    unsplashId: "cTFhub2BhaM",
    palette: { sky: "#87d4ec", water: "#1a9ab0", sand: "#f5e0a0", palm: "#1a7a40", accent: "#00b4c8" },
    emoji: "🏜️",
  },
  {
    name: "Salvador",
    aliases: ["salvador", "porto seguro", "bahia", "morro de são paulo", "arraial d'ajuda"],
    country: "Brasil",
    description: "Axé, cultura afro-brasileira e praias deslumbrantes da Bahia",
    highlights: ["Pelourinho", "Porto Seguro", "Morro de São Paulo", "Carnaval"],
    imageKeyword: "salvador bahia brazil beach",
    unsplashId: "cTFhub2BhaM",
    palette: { sky: "#87ceeb", water: "#1a6e8a", sand: "#d4a870", palm: "#1a6e30", accent: "#d4a030" },
    emoji: "🎭",
  },
  {
    name: "Recife",
    aliases: ["recife", "porto de galinhas", "olinda", "pernambuco", "maragogi"],
    country: "Brasil",
    description: "Piscinas naturais de Porto de Galinhas e o charme histórico de Olinda",
    highlights: ["Porto de Galinhas", "Piscinas naturais", "Olinda", "Carnatal"],
    imageKeyword: "porto de galinhas pernambuco brazil beach",
    unsplashId: "cTFhub2BhaM",
    palette: { sky: "#87ceeb", water: "#1a8a9a", sand: "#d4b890", palm: "#1a6e30", accent: "#00b4c8" },
    emoji: "🐠",
  },
  {
    name: "Maceió",
    aliases: ["maceió", "maceio", "alagoas", "barra de são miguel", "praia do francês"],
    country: "Brasil",
    description: "Águas esverdeadas e piscinas naturais únicas no litoral alagoano",
    highlights: ["Praia de Pajuçara", "Piscinas naturais", "Marechal Deodoro", "Praia do Francês"],
    imageKeyword: "maceio brazil beach",
    unsplashId: "cTFhub2BhaM",
    palette: { sky: "#87d4ea", water: "#20a0b8", sand: "#f0e4b0", palm: "#1a7a30", accent: "#00b4c8" },
    emoji: "🌊",
  },
  {
    name: "Jericoacoara",
    aliases: ["jericoacoara", "jeri", "ceará"],
    country: "Brasil",
    description: "Lagoa do Paraíso, dunas ao pôr do sol e vento para o kitesurf",
    highlights: ["Lagoa do Paraíso", "Duna do Pôr do Sol", "Kitesurf", "Lagoa Azul"],
    imageKeyword: "jericoacoara lagoon dunes",
    unsplashId: "cTFhub2BhaM",
    palette: { sky: "#7ec9e8", water: "#1a9ab0", sand: "#e8d898", palm: "#2a7a30", accent: "#00b4c8" },
    emoji: "🪁",
  },
  {
    name: "Rio de Janeiro",
    aliases: ["rio de janeiro", "rio", "copacabana", "ipanema", "búzios", "angra dos reis"],
    country: "Brasil",
    description: "Cidade maravilhosa — Cristo Redentor, Copacabana e samba",
    highlights: ["Cristo Redentor", "Pão de Açúcar", "Copacabana", "Búzios"],
    imageKeyword: "rio de janeiro copacabana beach",
    unsplashId: "MBkQKiH14ng",
    palette: { sky: "#87ceeb", water: "#1a7ab0", sand: "#d4c890", palm: "#1a7a30", accent: "#009c3b" },
    emoji: "🏖️",
  },
  {
    name: "Florianópolis",
    aliases: ["florianópolis", "florianopolis", "floripa", "santa catarina", "bombinhas", "balneário camboriú"],
    country: "Brasil",
    description: "A ilha da magia com 42 praias e natureza exuberante em Santa Catarina",
    highlights: ["Lagoa da Conceição", "Jurerê Internacional", "Praia da Joaquina", "Balneário Camboriú"],
    imageKeyword: "florianopolis beach brazil",
    unsplashId: "cTFhub2BhaM",
    palette: { sky: "#87ceeb", water: "#2080b0", sand: "#f0e8d0", palm: "#1a7a40", accent: "#00b4c8" },
    emoji: "🌉",
  },
  {
    name: "Foz do Iguaçu",
    aliases: ["foz do iguaçu", "foz do iguacu", "iguazu", "cataratas"],
    country: "Brasil",
    description: "As maiores cataratas do mundo — espetáculo da natureza na tríplice fronteira",
    highlights: ["Cataratas do Iguaçu", "Parque das Aves", "Itaipu", "Lado argentino"],
    imageKeyword: "iguazu falls brazil",
    unsplashId: "3PeSjpLVtLg",
    palette: { sky: "#87a8b0", water: "#2a7a4a", sand: "#c8d8a0", palm: "#1a6a30", accent: "#2a9a50" },
    emoji: "💧",
  },
  {
    name: "Gramado",
    aliases: ["gramado", "canela", "serra gaúcha", "bento gonçalves"],
    country: "Brasil",
    description: "Charme europeu, chocolate artesanal e natureza serrana no Rio Grande do Sul",
    highlights: ["Lago Negro", "Mini Mundo", "Natal Luz", "Festival de Cinema"],
    imageKeyword: "gramado brazil winter",
    unsplashId: "pF1ug8htJJY",
    palette: { sky: "#a0b4c0", water: "#3a6a8a", sand: "#c8d0b0", palm: "#2a6a3a", accent: "#c8a050" },
    emoji: "🍫",
  },
  {
    name: "Fernando de Noronha",
    aliases: ["fernando de noronha", "noronha"],
    country: "Brasil",
    description: "Paraíso ecológico — as águas mais cristalinas do Brasil",
    highlights: ["Baía do Sancho", "Mergulho", "Golfinhos", "Baía dos Porcos"],
    imageKeyword: "fernando de noronha brazil ocean",
    unsplashId: "cTFhub2BhaM",
    palette: { sky: "#87d4f0", water: "#1a9ab0", sand: "#f0e0a0", palm: "#1a7a40", accent: "#00b4c8" },
    emoji: "🐬",
  },
  // ─── Internacional ────────────────────────────────────────────────────────
  {
    name: "Punta Cana",
    aliases: ["punta cana", "puntacana", "bavaro", "bávaro"],
    country: "República Dominicana",
    description: "Praias de areia branca e águas cristalinas no Caribe dominicano",
    highlights: ["Praia de Bávaro", "Isla Saona", "All Inclusive", "Snorkeling"],
    imageKeyword: "punta cana beach",
    unsplashId: "cTFhub2BhaM",
    palette: { sky: "#87d3eb", water: "#20b2aa", sand: "#f5deb3", palm: "#1a7a40", accent: "#00c8b4" },
    emoji: "🌴",
  },
  {
    name: "Cancún",
    aliases: ["cancun", "cancún", "riviera maya", "playa del carmen", "rivieramaya"],
    country: "México",
    description: "O destino mais icônico do Caribe mexicano com ruínas maias e cenotes",
    highlights: ["Chichén Itzá", "Cenotes", "Xcaret", "Isla Mujeres"],
    imageKeyword: "cancun beach caribbean",
    unsplashId: "3PeSjpLVtLg",
    palette: { sky: "#87ceeb", water: "#00bcd4", sand: "#f4d03f", palm: "#1a6e30", accent: "#00b4c8" },
    emoji: "🏛️",
  },
  {
    name: "Orlando",
    aliases: ["orlando", "disney", "walt disney", "universal studios"],
    country: "Estados Unidos",
    description: "Capital mundial dos parques temáticos com magia para toda a família",
    highlights: ["Walt Disney World", "Universal Studios", "SeaWorld", "Outlet Shopping"],
    imageKeyword: "orlando theme park",
    unsplashId: "FkL-V9MR3kA",
    palette: { sky: "#87ceeb", water: "#4169e1", sand: "#e8e8e8", palm: "#2a8a50", accent: "#ff6b35" },
    emoji: "🎢",
  },
  {
    name: "Miami",
    aliases: ["miami", "miami beach", "south beach", "fort lauderdale"],
    country: "Estados Unidos",
    description: "Glamour, praias douradas e vida noturna vibrante na Flórida",
    highlights: ["South Beach", "Art Deco District", "Wynwood Walls", "Key Biscayne"],
    imageKeyword: "miami beach",
    unsplashId: "MBkQKiH14ng",
    palette: { sky: "#87ceeb", water: "#00ced1", sand: "#fffacd", palm: "#20a050", accent: "#ff69b4" },
    emoji: "🌊",
  },
  {
    name: "Maldivas",
    aliases: ["maldivas", "maldives", "male", "malé"],
    country: "Maldivas",
    description: "Bangalôs sobre águas turquesa — o paraíso na terra",
    highlights: ["Overwater Bungalows", "Mergulho", "Snorkeling com Tubarões", "Pôr do sol"],
    imageKeyword: "maldives overwater",
    unsplashId: "GJ8ZQV7eGmU",
    palette: { sky: "#a8d8ea", water: "#00d4aa", sand: "#f0e8d8", palm: "#0a8a6a", accent: "#00d4aa" },
    emoji: "🐚",
  },
  {
    name: "Dubai",
    aliases: ["dubai", "abu dhabi"],
    country: "Emirados Árabes",
    description: "Luxo futurista entre o deserto e o mar Arábico",
    highlights: ["Burj Khalifa", "Palm Jumeirah", "Desert Safari", "Dubai Mall"],
    imageKeyword: "dubai skyline",
    unsplashId: "vIhavtar-kA",
    palette: { sky: "#d4a574", water: "#4682b4", sand: "#deb887", palm: "#8b6914", accent: "#d4af37" },
    emoji: "🏙️",
  },
  {
    name: "Lisboa",
    aliases: ["lisboa", "lisbon", "portugal"],
    country: "Portugal",
    description: "Charme histórico, pastéis de nata e fado às margens do Tejo",
    highlights: ["Torre de Belém", "Alfama", "Sintra", "Pastéis de Belém"],
    imageKeyword: "lisbon portugal",
    unsplashId: "QtJMz2gR6qU",
    palette: { sky: "#b0c4de", water: "#4169e1", sand: "#f5deb3", palm: "#2a3a6e", accent: "#e74c3c" },
    emoji: "🇵🇹",
  },
  {
    name: "Paris",
    aliases: ["paris", "frança", "france"],
    country: "França",
    description: "A cidade luz — romance, arte e gastronomia sem igual",
    highlights: ["Torre Eiffel", "Louvre", "Champs-Élysées", "Versailles"],
    imageKeyword: "paris eiffel tower",
    unsplashId: "R5sBy1u4Q6A",
    palette: { sky: "#b0c4de", water: "#6a7fdb", sand: "#e8e0d4", palm: "#3a4a6e", accent: "#c8a960" },
    emoji: "🗼",
  },
  {
    name: "Roma",
    aliases: ["roma", "rome", "itália", "italia", "italy"],
    country: "Itália",
    description: "Cidade eterna com história milenar, arte e a melhor gastronomia do mundo",
    highlights: ["Coliseu", "Vaticano", "Fontana di Trevi", "Panteão"],
    imageKeyword: "rome colosseum",
    unsplashId: "MKbCCMjfXjc",
    palette: { sky: "#c8b8a0", water: "#5c7a99", sand: "#d4b896", palm: "#5a4a30", accent: "#b8860b" },
    emoji: "🏛️",
  },
  {
    name: "Santiago",
    aliases: ["santiago", "chile"],
    country: "Chile",
    description: "Cordilheira dos Andes, vinhos premiados e gastronomia vibrante",
    highlights: ["Valle Nevado", "Vinícolas", "Cerro San Cristóbal", "Valparaíso"],
    imageKeyword: "santiago chile andes",
    unsplashId: "pF1ug8htJJY",
    palette: { sky: "#87a8d0", water: "#5b8cbf", sand: "#c8b89a", palm: "#4a6a4a", accent: "#7b2d8e" },
    emoji: "🏔️",
  },
  {
    name: "Buenos Aires",
    aliases: ["buenos aires", "argentina"],
    country: "Argentina",
    description: "Tango, carne e a cultura vibrante da capital portenha",
    highlights: ["La Boca", "Recoleta", "San Telmo", "Puerto Madero"],
    imageKeyword: "buenos aires",
    unsplashId: "pF1ug8htJJY",
    palette: { sky: "#87ceeb", water: "#4682b4", sand: "#d2b48c", palm: "#3a5a3a", accent: "#74b4e0" },
    emoji: "💃",
  },
  {
    name: "Cartagena",
    aliases: ["cartagena", "colombia", "colômbia"],
    country: "Colômbia",
    description: "Cidade colonial colorida com praias caribenhas deslumbrantes",
    highlights: ["Cidade Murada", "Islas del Rosario", "Castillo San Felipe", "Praias"],
    imageKeyword: "cartagena colombia",
    unsplashId: "3PeSjpLVtLg",
    palette: { sky: "#87ceeb", water: "#20b2aa", sand: "#f0d8a0", palm: "#2a7a40", accent: "#e67e22" },
    emoji: "🏰",
  },
  {
    name: "Bariloche",
    aliases: ["bariloche", "san carlos de bariloche", "patagonia", "patagônia"],
    country: "Argentina",
    description: "Lagos azuis e montanhas nevadas na Patagônia — a Suíça argentina",
    highlights: ["Cerro Catedral", "Circuito Chico", "Chocolates", "Lago Nahuel Huapi"],
    imageKeyword: "bariloche lake mountains",
    unsplashId: "pF1ug8htJJY",
    palette: { sky: "#87a8d0", water: "#4682b4", sand: "#c0c0c0", palm: "#2a5a3a", accent: "#4a90d9" },
    emoji: "🏔️",
  },
  {
    name: "Cusco",
    aliases: ["cusco", "cuzco", "machu picchu", "peru"],
    country: "Peru",
    description: "Capital do Império Inca com ruínas sagradas e paisagens de tirar o fôlego",
    highlights: ["Machu Picchu", "Vale Sagrado", "Salineras de Maras", "Praça das Armas"],
    imageKeyword: "machu picchu peru",
    unsplashId: "3PeSjpLVtLg",
    palette: { sky: "#87a8b0", water: "#6a8a6a", sand: "#c8a870", palm: "#5a6a3a", accent: "#d4a030" },
    emoji: "🦙",
  },
  {
    name: "Aruba",
    aliases: ["aruba", "oranjestad"],
    country: "Aruba",
    description: "A ilha feliz do Caribe com praias de águas cristalinas",
    highlights: ["Eagle Beach", "Palm Beach", "Natural Pool", "Arikok Park"],
    imageKeyword: "aruba beach",
    unsplashId: "cTFhub2BhaM",
    palette: { sky: "#a8d8ea", water: "#00ced1", sand: "#deb887", palm: "#8b6914", accent: "#00b4c8" },
    emoji: "🏝️",
  },
  {
    name: "Curaçao",
    aliases: ["curacao", "curaçao"],
    country: "Curaçao",
    description: "Casas coloridas e praias paradisíacas no sul do Caribe",
    highlights: ["Willemstad", "Playa Kenepa", "Blue Room", "Shete Boka"],
    imageKeyword: "curacao colorful",
    unsplashId: "cTFhub2BhaM",
    palette: { sky: "#87ceeb", water: "#20b2aa", sand: "#f0e0c0", palm: "#2a7a40", accent: "#e67e22" },
    emoji: "🎨",
  },
];

const DEFAULT_CONTEXT: DestinationContext = {
  name: "Destino",
  aliases: [],
  country: "",
  description: "Um destino incrível espera por você",
  highlights: ["Paisagens únicas", "Cultura local", "Gastronomia", "Aventura"],
  imageKeyword: "travel beach paradise",
  unsplashId: "cTFhub2BhaM",
  palette: { sky: "#87ceeb", water: "#00bcd4", sand: "#f4d03f", palm: "#1a6e30", accent: "#00b4c8" },
  emoji: "✈️",
};

export function getDestinationContext(destino: string): DestinationContext {
  const normalize = (text: string) => text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  const d = normalize(destino);
  for (const dest of DESTINATIONS) {
    if (normalize(dest.name) === d) return { ...dest };
    for (const alias of dest.aliases) {
      const a = normalize(alias);
      if (d.includes(a) || a.includes(d)) return { ...dest };
    }
  }
  const fallbackName = destino.trim() || DEFAULT_CONTEXT.name;
  return { ...DEFAULT_CONTEXT, name: fallbackName, imageKeyword: `${fallbackName} trip` };
}

export function getUnsplashUrl(context: DestinationContext, width = 1080, height = 600): string {
  return `https://source.unsplash.com/${context.unsplashId}/${width}x${height}`;
}

// Higher-quality alternative using search
export function getUnsplashSearchUrl(keyword: string, width = 1080, height = 600): string {
  return `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(keyword)}`;
}
