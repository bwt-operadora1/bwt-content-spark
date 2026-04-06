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
  const d = destino.toLowerCase().trim();
  for (const dest of DESTINATIONS) {
    if (dest.name.toLowerCase() === d) return { ...dest };
    for (const alias of dest.aliases) {
      if (d.includes(alias) || alias.includes(d)) return { ...dest };
    }
  }
  return { ...DEFAULT_CONTEXT, name: destino };
}

export function getUnsplashUrl(context: DestinationContext, width = 1080, height = 600): string {
  return `https://source.unsplash.com/${context.unsplashId}/${width}x${height}`;
}

// Higher-quality alternative using search
export function getUnsplashSearchUrl(keyword: string, width = 1080, height = 600): string {
  return `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(keyword)}`;
}
