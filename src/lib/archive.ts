import { TravelData } from "@/types/travel";

export interface ArchiveEntry {
  id: string;
  savedAt: number;
  data: TravelData;
  outputs?: string[];
}

export const ARCHIVE_STORAGE_KEY = "bwt-archive";

const makeSignature = (data: TravelData) => `${data.destino}|${data.hotel}|${data.dataInicio || ""}`;

export function loadArchiveEntries(): ArchiveEntry[] {
  try {
    const raw = localStorage.getItem(ARCHIVE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveArchiveEntry(data: TravelData, output?: string): ArchiveEntry[] {
  const list = loadArchiveEntries();
  const signature = makeSignature(data);
  const existingIdx = list.findIndex(
    (entry) => makeSignature(entry.data) === signature,
  );
  const previous = existingIdx >= 0 ? list[existingIdx] : undefined;
  const outputs = Array.from(new Set([...(previous?.outputs ?? []), output].filter(Boolean) as string[]));
  const entry: ArchiveEntry = {
    id: previous?.id ?? crypto.randomUUID(),
    savedAt: Date.now(),
    data,
    outputs,
  };
  if (existingIdx >= 0) list[existingIdx] = entry;
  else list.unshift(entry);
  localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(list));
  void syncArchiveEntry(entry, output);
  return list;
}

async function syncArchiveEntry(entry: ArchiveEntry, output?: string) {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    await supabase.functions.invoke("archive-records", {
      body: { action: "upsert", entry, output },
    });
  } catch {
    // local archive remains available if backend sync is unavailable
  }
}

export async function loadArchiveEntriesFromCloud(): Promise<ArchiveEntry[]> {
  const local = loadArchiveEntries();
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase
      .from("content_archive" as never)
      .select("id, updated_at, data, outputs" as never)
      .order("updated_at" as never, { ascending: false });
    if (error || !Array.isArray(data)) return local;
    const cloudEntries: ArchiveEntry[] = data.map((row: any) => ({
      id: row.id,
      savedAt: new Date(row.updated_at).getTime(),
      data: row.data as TravelData,
      outputs: row.outputs ?? [],
    }));
    // Merge: preserve local-only entries not yet synced to cloud
    const cloudIds = new Set(cloudEntries.map((e) => e.id));
    const localOnly = local.filter((e) => !cloudIds.has(e.id));
    const merged = [...cloudEntries, ...localOnly].sort((a, b) => b.savedAt - a.savedAt);
    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return local;
  }
}

export async function deleteArchiveEntry(id: string) {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    await supabase.functions.invoke("archive-records", { body: { action: "delete", id } });
  } catch {
    // ignore backend delete errors
  }
}

export async function clearArchiveEntries() {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    await supabase.functions.invoke("archive-records", { body: { action: "clear" } });
  } catch {
    // ignore backend clear errors
  }
}