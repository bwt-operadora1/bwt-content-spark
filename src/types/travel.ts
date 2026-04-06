export interface TravelData {
  destino: string;
  hotel: string;
  precoTotal: string;
  precoParcela: string;
  parcelas: number;
  precoAVista: string;
  duracao: string;
  regime: string;
  roteiro: string[];
  imageUrl?: string;
  desconto?: string;
  dataInicio?: string;
  dataFim?: string;
  companhiaAerea?: string;
  inclui?: string[];
  tipoProduto?: string;
  campanha?: string;
}

export interface VideoScene {
  cena: number;
  texto: string;
  duracao: string;
}

export const SAMPLE_DATA: TravelData = {
  destino: "Punta Cana",
  hotel: "Impressive Punta Cana",
  precoTotal: "R$ 6.890,00",
  precoParcela: "R$ 689,",
  parcelas: 10,
  precoAVista: "R$ 6.890, à vista.",
  duracao: "5 Noites",
  regime: "All Inclusive",
  roteiro: [
    "Chegada e check-in no resort",
    "Dia livre no resort All Inclusive",
    "Passeio à Ilha Saona",
    "Dia de praia e esportes aquáticos",
    "Check-out e traslado ao aeroporto",
  ],
  desconto: "33",
  dataInicio: "19/06",
  dataFim: "24/06/2026",
  companhiaAerea: "GOL",
  inclui: [
    "Aéreo CNF / PLU / CNF com Gol Linhas Aéreas em Classe Econômica;",
    "Transfer de chegada e saída;",
    "Seguro Viagem - U.A. – 30k;",
    "5 noites de hospedagem no Impressive Punta Cana;",
    "All Inclusive",
  ],
  tipoProduto: "Aéreo + Hotel",
  campanha: "Operação Caribe",
};
