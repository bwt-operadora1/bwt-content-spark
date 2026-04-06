import { MapPin, Hotel, DollarSign, Moon, UtensilsCrossed, Route, Pencil } from "lucide-react";
import { TravelData } from "@/types/travel";
import { Input } from "@/components/ui/input";

interface DataDashboardProps {
  data: TravelData;
  onChange: (data: TravelData) => void;
}

const FIELDS = [
  { key: "destino" as const, label: "Destino", icon: MapPin },
  { key: "hotel" as const, label: "Hotel", icon: Hotel },
  { key: "precoTotal" as const, label: "Preço Total", icon: DollarSign },
  { key: "duracao" as const, label: "Duração", icon: Moon },
  { key: "regime" as const, label: "Regime", icon: UtensilsCrossed },
];

const DataDashboard = ({ data, onChange }: DataDashboardProps) => {
  const updateField = (key: keyof TravelData, value: string) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Pencil className="w-5 h-5 text-accent" />
        <h2 className="text-2xl font-display font-semibold">Dados Extraídos</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FIELDS.map(({ key, label, icon: Icon }) => (
          <div key={key} className="glass-card rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
              <Icon className="w-4 h-4" />
              {label}
            </div>
            <Input
              value={data[key] as string}
              onChange={(e) => updateField(key, e.target.value)}
              className="border-0 bg-muted/50 font-semibold text-foreground"
            />
          </div>
        ))}
      </div>

      <div className="glass-card rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
          <Route className="w-4 h-4" />
          Roteiro
        </div>
        <div className="space-y-2">
          {data.roteiro.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <Input
                value={item}
                onChange={(e) => {
                  const newRoteiro = [...data.roteiro];
                  newRoteiro[i] = e.target.value;
                  onChange({ ...data, roteiro: newRoteiro });
                }}
                className="border-0 bg-muted/50 text-sm"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DataDashboard;
