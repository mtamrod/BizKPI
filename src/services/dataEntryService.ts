/**
 * @file dataEntryService.ts
 * @description Servicio API para las entradas de datos de negocio (las cifras
 * semanales brutas introducidas por el usuario: ingresos, gastos, ventas, clientes, etc.).
 *
 * Flujo para crear una entrada:
 *  1. Encuentra o crea el registro `Period` que abarca el rango de fechas seleccionado.
 *  2. Envía los datos de negocio a `/business-data/` mediante POST.
 *  3. El backend calcula y almacena automáticamente los KPIs para ese periodo.
 */

import { apiClient } from '@/lib/apiClient';
import { periodService } from '@/services/periodService';
import type { CreateEntryInput, DataEntry, PeriodType } from '@/types';
import type { PeriodRead } from './periodService';

// ─── Backend types ────────────────────────────────────────────────────────────

/** Payload enviado a `POST /business-data/`. */
interface BusinessDataCreate {
  period_id: string;
  total_revenue: number;
  total_expenses: number;
  num_sales: number;
  num_customers: number;
  cost_of_goods_sold?: number;
  marketing_expenses?: number;
  new_customers?: number;
  returning_customers?: number;
  top_product_name?: string;
  top_product_revenue?: number;
  notes?: string;
}

/** Estructura de un registro de datos de negocio devuelto por la API. */
interface BusinessDataRead {
  id: string;
  period_id: string;
  user_id: string;
  total_revenue: number;
  total_expenses: number;
  num_sales: number;
  num_customers: number;
  cost_of_goods_sold: number | null;
  marketing_expenses: number | null;
  new_customers: number | null;
  returning_customers: number | null;
  top_product_name: string | null;
  top_product_revenue: number | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// ─── Conversion helpers ───────────────────────────────────────────────────────

/**
 * Transforma un registro bruto `BusinessDataRead` de la API (snake_case) al
 * tipo interno `DataEntry` de la app (camelCase). Usa valores predeterminados
 * sensatos cuando los campos opcionales son null o el registro de periodo no
 * está disponible.
 *
 * @param bd     - Registro bruto de la API
 * @param period - Periodo asociado (puede ser undefined si la carga del periodo falló)
 */
function toDataEntry(bd: BusinessDataRead, period: PeriodRead | undefined): DataEntry {
  const startISO = period?.start_date ?? bd.created_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
  return {
    id: bd.id,
    companyId: bd.user_id,
    periodId: bd.period_id,
    period: (period?.period_type ?? 'day') as PeriodType,
    periodDate: startISO,
    periodEndDate: period?.end_date ?? startISO,
    totalRevenue: Number(bd.total_revenue),
    totalExpenses: Number(bd.total_expenses),
    totalSales: bd.num_sales,
    totalClients: bd.num_customers,
    bestProduct: bd.top_product_name ?? undefined,
    observations: bd.notes ?? undefined,
    source: 'manual',
    createdAt: bd.created_at ?? new Date().toISOString(),
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const dataEntryService = {
  /**
   * Obtiene todas las entradas de datos de negocio del usuario autenticado y
   * enriquece cada registro con los metadatos de su periodo asociado (rango de
   * fechas, tipo). Los periodos y los datos se cargan en paralelo para minimizar
   * la latencia.
   *
   * @param _companyId - No usado actualmente (el backend deduce el usuario del JWT)
   */
  async getEntries(_companyId: string): Promise<DataEntry[]> {
    const [bdataList, periods] = await Promise.all([
      apiClient.get<BusinessDataRead[]>('/business-data/'),
      apiClient.get<PeriodRead[]>('/periods/'),
    ]);

    const periodMap = new Map(periods.map((p) => [p.id, p]));
    return bdataList.map((bd) => toDataEntry(bd, periodMap.get(bd.period_id)));
  },

  /**
   * Crea una nueva entrada de datos de negocio para el rango de fechas indicado.
   *
   * Pasos:
   * 1. Llama a `periodService.findOrCreate` para obtener (o crear) el registro
   *    `Period` correspondiente a la semana/día/mes seleccionado.
   * 2. Envía la entrada a `/business-data/`; el backend calcula los KPIs
   *    automáticamente y los almacena en la tabla `kpis`.
   *
   * @param input - Datos del formulario enviados por el usuario
   * @returns La entrada creada, transformada al tipo `DataEntry` de la app
   */
  async addEntry(input: CreateEntryInput): Promise<DataEntry> {
    // 1. Find or create the period for this date range
    const period = await periodService.findOrCreate(
      input.period,
      input.periodDate,
      input.periodEndDate,
    );

    // 2. Build the payload for business_data
    const payload: BusinessDataCreate = {
      period_id: period.id,
      total_revenue: input.totalRevenue,
      total_expenses: input.totalExpenses,
      num_sales: input.totalSales,
      num_customers: input.totalClients,
    };

    // Optional fields — only sent if the user filled them in
    if (input.bestProduct?.trim()) payload.top_product_name = input.bestProduct.trim();
    if (input.observations?.trim()) payload.notes = input.observations.trim();

    // 3. Create the business_data record (backend auto-calculates KPIs)
    const created = await apiClient.post<BusinessDataRead>('/business-data/', payload);

    return toDataEntry(created, period);
  },

  /**
   * Elimina permanentemente un registro de datos de negocio por su ID.
   * El backend propaga este borrado al registro KPI asociado en cascada.
   * Cualquier recomendación de IA para el mismo periodo debe eliminarse por
   * separado mediante `recommendationService.delete(periodId)`.
   *
   * @param id - `business_data.id` (no el ID del periodo)
   */
  async deleteEntry(id: string): Promise<void> {
    await apiClient.delete(`/business-data/${id}`);
  },
};
