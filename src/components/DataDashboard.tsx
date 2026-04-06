import { MapPin, Hotel, DollarSign, Moon, UtensilsCrossed, Pencil, Percent, Calendar, Plane } from "lucide-react";
import { TravelData } from "@/types/travel";
import { Input } from "@/components/ui/input";

interface DataDashboardProps {
  data: TravelData;
  onChange: (data: TravelData) => void;
}

const FIELDS = [
  { key: "destino" as const, label: "Destino", icon: MapPin },
  { key: "hotel" as const, label: "Hotel", icon: Hotel },
  { key: "duracao" as const, label: "Duração", icon: Moon },
  { key: "regime" as const, label: "Regime", icon: UtensilsCrossed },
  { key: "precoTotal" as const, label: "Preço Total", icon: DollarSign },
  { key: "precoParcela" as const, label: "Parcela", icon: DollarSign },
  { key: "precoAVista" as const, label: "À Vista", icon: DollarSign },
  { key: "desconto" as const, label: "Desconto %", icon: Percent },
  { key: "companhiaAerea" as const, label: "Cia Aérea", icon: Plane },
  { key: "tipoProduto" as const, label: "Tipo", icon: Plane },
  { key: "campanha" as const, label: "Campanha", icon: Calendar },
];

const DataDashboard = ({ data, onChange }: DataDashboardProps) => {
  const updateField = (key: keyof TravelData, value: string) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Pencil className="w-5 h-5 text-accent" />
        <h2 className="text-xl font-display font-semibold">Dados Extraídos</h2>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {FIELDS.map(({ key, label, icon: Icon }) => (
          <div key={key} className="glass-card rounded-lg p-3 flex items-center gap-3">
            <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="text-xs text-muted-foreground font-medium">{label}</label>
              <Input
                value={(data[key] as string) || ""}
                onChange={(e) => updateField(key, e.target.value)}
                className="border-0 bg-transparent p-0 h-7 font-semibold text-sm text-foreground"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Inclui */}
      <div className="glass-card rounded-lg p-3 space-y-2">
        <label className="text-xs text-muted-foreground font-medium">Inclui</label>
        {(data.inclui || []).map((item, i) => (
          <Input
            key={i}
            value={item}
            onChange={(e) => {
              const newInclui = [...(data.inclui || [])];
              newInclui[i] = e.target.value;
              onChange({ ...data, inclui: newInclui });
            }}
            className="border-0 bg-muted/50 text-xs h-7"
          />
        ))}
      </div>
    </div>
  );
};

export default DataDashboard;
