import {
  MapPin,
  Hotel,
  DollarSign,
  Moon,
  UtensilsCrossed,
  Pencil,
  Percent,
  Calendar,
  Plane,
  Plus,
  Trash2,
} from "lucide-react";
import { TravelData } from "@/types/travel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DataDashboardProps {
  data: TravelData;
  onChange: (data: TravelData) => void;
}

const FIELDS = [
  { key: "destino" as const, label: "Destino", icon: MapPin },
  { key: "hotel" as const, label: "Hotel", icon: Hotel },
  { key: "quartoTipo" as const, label: "Tipo de Quarto", icon: Hotel },
  { key: "duracao" as const, label: "Duração", icon: Moon },
  { key: "regime" as const, label: "Regime", icon: UtensilsCrossed },
  { key: "companhiaAerea" as const, label: "Cia. Aérea", icon: Plane },
  { key: "tipoProduto" as const, label: "Tipo", icon: Plane },
  { key: "campanha" as const, label: "Campanha", icon: Calendar },
  { key: "desconto" as const, label: "Desconto %", icon: Percent },
];

const DataDashboard = ({ data, onChange }: DataDashboardProps) => {
  const updateField = (key: keyof TravelData, value: string) => {
    const updated = { ...data, [key]: value };

    // Recalcular preço por pessoa e parcela ao mudar precoTotal, parcelas ou numAdultos
    if (key === "precoTotal" || key === "parcelas" || key === "numAdultos") {
      const total = parseFloat(
        (key === "precoTotal" ? value : data.precoTotal).replace(/[^\d,]/g, "").replace(",", "."),
      );
      const nParcelas = parseInt(String(key === "parcelas" ? value : data.parcelas));
      const nAdultos = parseInt(String(key === "numAdultos" ? value : data.numAdultos)) || 2;
      if (!isNaN(total) && !isNaN(nParcelas) && nParcelas > 0 && nAdultos > 0) {
        const pp = total / nAdultos;
        const parcela = pp / nParcelas;
        const descPct = parseInt(data.desconto || "5") / 100;
        updated.precoPorPessoa = `R$ ${pp.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
        updated.precoAVista = `R$ ${(pp * (1 - descPct)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
        updated.precoParcela = `R$ ${parcela.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
        updated.numAdultos = nAdultos;
        if (key !== "parcelas") updated.parcelas = nParcelas;
      }
    }

    onChange(updated);
  };

  const updateInclui = (i: number, value: string) => {
    const newInclui = [...(data.inclui || [])];
    newInclui[i] = value;
    onChange({ ...data, inclui: newInclui });
  };

  const addInclui = () => onChange({ ...data, inclui: [...(data.inclui || []), ""] });

  const removeInclui = (i: number) => {
    const newInclui = [...(data.inclui || [])];
    newInclui.splice(i, 1);
    onChange({ ...data, inclui: newInclui });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Pencil className="w-4 h-4" style={{ color: "#00b4c8" }} />
        <h2 className="text-lg font-display font-semibold">Dados do Orçamento</h2>
      </div>

      {/* Campos principais */}
      <div className="grid grid-cols-1 gap-2">
        {FIELDS.map(({ key, label, icon: Icon }) => (
          <div key={key} className="glass-card rounded-lg p-2.5 flex items-center gap-3">
            <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="text-xs text-muted-foreground font-medium">{label}</label>
              <Input
                value={(data[key] as string) || ""}
                onChange={(e) => updateField(key, e.target.value)}
                className="border-0 bg-transparent p-0 h-6 font-semibold text-sm text-foreground"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Precificação */}
      <div className="glass-card rounded-lg p-3 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5" /> Precificação
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: "precoTotal" as const, label: "Total 2 pax" },
            { key: "parcelas" as const, label: "Parcelas" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs text-muted-foreground">{label}</label>
              <Input
                value={String(data[key] || "")}
                onChange={(e) => updateField(key, e.target.value)}
                className="h-7 text-sm font-semibold mt-0.5"
              />
            </div>
          ))}
        </div>
        <div
          className="rounded-lg p-2 text-xs space-y-0.5"
          style={{ background: "rgba(0,180,200,0.08)", border: "0.5px solid rgba(0,180,200,0.2)" }}
        >
          <div className="flex justify-between">
            <span className="text-muted-foreground">Parcela (÷10)</span>
            <span className="font-semibold" style={{ color: "#00b4c8" }}>
              {data.precoParcela || "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">À vista (÷2)</span>
            <span className="font-semibold">{data.precoAVista || "—"}</span>
          </div>
        </div>
      </div>

      {/* Datas */}
      <div className="glass-card rounded-lg p-3 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" /> Período
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: "dataInicio" as const, label: "Início" },
            { key: "dataFim" as const, label: "Fim" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs text-muted-foreground">{label}</label>
              <Input
                value={(data[key] as string) || ""}
                onChange={(e) => updateField(key, e.target.value)}
                className="h-7 text-sm font-semibold mt-0.5"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Inclui */}
      <div className="glass-card rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">O que inclui</p>
          <Button
            onClick={addInclui}
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs gap-1"
            style={{ color: "#00b4c8" }}
          >
            <Plus className="w-3 h-3" /> Adicionar
          </Button>
        </div>
        {(data.inclui || []).map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "#00b4c8" }}>
              •
            </span>
            <Input
              value={item}
              onChange={(e) => updateInclui(i, e.target.value)}
              className="h-7 text-xs flex-1 bg-muted/50"
              placeholder="Item incluído..."
            />
            <Button
              onClick={() => removeInclui(i)}
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataDashboard;
