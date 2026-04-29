import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ARCHIVE_STORAGE_KEY, ArchiveEntry, loadArchiveEntries } from "@/lib/archive";
import { Plane, Hotel, Building2, Trash2, Search, Calendar } from "lucide-react";

const Archive = () => {
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [groupBy, setGroupBy] = useState<"destino" | "hotel" | "agencia">("destino");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setEntries(loadArchiveEntries());
  }, []);

  const handleDelete = (id: string) => {
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(next));
  };

  const handleClearAll = () => {
    if (!confirm("Apagar todo o arquivo? Esta ação não pode ser desfeita.")) return;
    localStorage.removeItem(ARCHIVE_STORAGE_KEY);
    setEntries([]);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => {
      const d = e.data;
      return (
        d.destino?.toLowerCase().includes(q) ||
        d.hotel?.toLowerCase().includes(q) ||
        d.agencia?.toLowerCase().includes(q) ||
        d.campanha?.toLowerCase().includes(q)
      );
    });
  }, [entries, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, ArchiveEntry[]>();
    for (const entry of filtered) {
      const key =
        (groupBy === "destino" && entry.data.destino) ||
        (groupBy === "hotel" && entry.data.hotel) ||
        (groupBy === "agencia" && entry.data.agencia) ||
        "Sem informação";
      const arr = map.get(key) || [];
      arr.push(entry);
      map.set(key, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered, groupBy]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center font-display font-black text-white"
              style={{
                fontSize: 10,
                background: "linear-gradient(135deg, #7C3AED 0%, #6B21A8 100%)",
              }}
            >
              BWT
            </div>
            <div>
              <h1 className="font-display font-black uppercase text-sm tracking-widest leading-none">
                Arquivo
              </h1>
              <p className="text-[10px] text-muted-foreground mt-1">
                {entries.length} {entries.length === 1 ? "orçamento salvo" : "orçamentos salvos"}
              </p>
            </div>
          </div>

          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por destino, hotel, agência..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {(["destino", "hotel", "agencia"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGroupBy(g)}
                className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                  groupBy === g ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {g === "agencia" ? "Agência" : g}
              </button>
            ))}
          </div>

          {entries.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClearAll} className="gap-1.5 text-xs">
              <Trash2 className="w-3.5 h-3.5" />
              Limpar tudo
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {entries.length === 0 ? (
          <div className="text-center py-24">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-muted items-center justify-center mb-4">
              <Plane className="w-7 h-7 text-muted-foreground" />
            </div>
            <h2 className="font-display font-bold text-xl mb-2">Nenhum orçamento salvo ainda</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Os orçamentos são adicionados aqui automaticamente quando você salva no editor.
            </p>
            <Link to="/">
              <Button size="sm">Voltar ao editor</Button>
            </Link>
          </div>
        ) : grouped.length === 0 ? (
          <p className="text-center py-16 text-sm text-muted-foreground">
            Nada encontrado para "{search}".
          </p>
        ) : (
          <div className="space-y-8">
            {grouped.map(([groupKey, items]) => (
              <section key={groupKey}>
                <div className="flex items-center gap-2 mb-3">
                  {groupBy === "destino" && <Plane className="w-4 h-4 text-primary" />}
                  {groupBy === "hotel" && <Hotel className="w-4 h-4 text-primary" />}
                  {groupBy === "agencia" && <Building2 className="w-4 h-4 text-primary" />}
                  <h2 className="font-display font-bold text-base">{groupKey}</h2>
                  <Badge variant="secondary" className="text-[10px]">
                    {items.length}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((entry) => (
                    <Card key={entry.id} className="p-4 hover:shadow-md transition-shadow group">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{entry.data.destino}</p>
                          <p className="text-xs text-muted-foreground truncate">{entry.data.hotel}</p>
                        </div>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                          aria-label="Apagar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        {entry.data.agencia && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Building2 className="w-3 h-3" />
                            <span className="truncate">{entry.data.agencia}</span>
                          </div>
                        )}
                        {entry.data.duracao && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>{entry.data.duracao} • {entry.data.regime}</span>
                          </div>
                        )}
                        {entry.outputs && entry.outputs.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {entry.outputs.map((output) => (
                              <Badge key={output} variant="outline" className="text-[9px] px-1.5 py-0">
                                {output}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-3 border-t flex items-baseline justify-between">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</span>
                        <span className="font-display font-bold text-sm" style={{ color: "#9333EA" }}>
                          {entry.data.precoTotal}
                        </span>
                      </div>

                      <p className="text-[10px] text-muted-foreground mt-2">
                        Salvo em {new Date(entry.savedAt).toLocaleString("pt-BR")}
                      </p>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Archive;