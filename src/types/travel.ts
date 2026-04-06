export interface TravelData {
  destino: string;
  hotel: string;
  precoTotal: string;
  duracao: string;
  regime: string;
  roteiro: string[];
  imageUrl?: string;
}

export interface VideoScene {
  cena: number;
  texto: string;
  duracao: string;
}

export const SAMPLE_DATA: TravelData = {
  destino: "Cancún",
  hotel: "Grand Palladium Select Costa Mujeres",
  precoTotal: "R$ 18.616,97",
  duracao: "6 Noites",
  regime: "Tudo Incluído",
  roteiro: [
    "Chegada e check-in no resort",
    "Chichén Itzá - Maravilha do Mundo",
    "Isla Mujeres - Praias paradisíacas",
    "Dia livre no resort All Inclusive",
    "Xcaret - Parque eco-arqueológico",
    "Check-out e traslado ao aeroporto",
  ],
};
