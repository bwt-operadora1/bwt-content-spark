import { TravelData } from "@/types/travel";

export interface ArchiveEntry {
  id: string;
  savedAt: number;
  data: TravelData;
  outputs?: string[];
}

export const ARCHIVE_STORAGE_KEY = "bwt-archive";

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
  const signature = `${data.destino}|${data.hotel}|${data.dataInicio || ""}`;
  const existingIdx = list.findIndex(
    (entry) => `${entry.data.destino}|${entry.data.hotel}|${entry.data.dataInicio || ""}` === signature,
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
  return list;
}