import { SEED_ENTRIES } from '@/mocks/dataEntryMocks';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import type { CreateEntryInput, DataEntry } from '@/types';

async function loadEntries(): Promise<DataEntry[]> {
  const stored = await storage.get<DataEntry[]>(STORAGE_KEYS.DATA_ENTRIES);
  if (stored && stored.length > 0) {
    // Schema migration: old entries had `metricName` instead of `period`/`totalRevenue`.
    // If any entry is missing `period`, the cache is stale → wipe and re-seed.
    const isNewSchema = stored.every((e) => 'period' in e && 'totalRevenue' in e);
    if (isNewSchema) return stored;
    await storage.remove(STORAGE_KEYS.DATA_ENTRIES);
  }
  await storage.set(STORAGE_KEYS.DATA_ENTRIES, SEED_ENTRIES);
  return SEED_ENTRIES;
}

export const dataEntryService = {
  async getEntries(companyId: string): Promise<DataEntry[]> {
    const all = await loadEntries();
    return all
      .filter((e) => e.companyId === companyId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },

  async addEntry(input: CreateEntryInput): Promise<DataEntry> {
    const all = await loadEntries();
    const entry: DataEntry = {
      id: `entry_${Date.now()}`,
      companyId: input.companyId,
      period:        input.period,
      periodDate:    input.periodDate,
      totalRevenue:  input.totalRevenue,
      totalExpenses: input.totalExpenses,
      totalSales:    input.totalSales,
      totalClients:  input.totalClients,
      bestProduct:   input.bestProduct?.trim() || undefined,
      bestDay:       input.bestDay?.trim()     || undefined,
      worstDay:      input.worstDay?.trim()    || undefined,
      observations:  input.observations?.trim() || undefined,
      source: 'manual',
      createdAt: new Date().toISOString(),
    };
    await storage.set(STORAGE_KEYS.DATA_ENTRIES, [entry, ...all]);
    return entry;
  },

  /** Limpia el storage para forzar re-seed (útil en desarrollo) */
  async resetEntries(): Promise<void> {
    await storage.remove(STORAGE_KEYS.DATA_ENTRIES);
  },
};
