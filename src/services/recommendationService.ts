/**
 * @file recommendationService.ts
 * @description Servicio API para las recomendaciones semanales generadas por IA.
 *
 * Cada recomendación se genera bajo demanda en el backend (FastAPI + OpenAI).
 * El backend almacena el resultado para que las lecturas posteriores sean
 * instantáneas y no generen coste adicional de IA.
 */

import { apiClient } from '@/lib/apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Un único punto destacado analítico del periodo (positivo, negativo o neutro). */
export interface RecommendationHighlight {
  type: 'positive' | 'negative' | 'neutral';
  /** Titular breve, p. ej. "Fuerte crecimiento del margen". */
  title: string;
  /** Elaboración de una frase que se muestra bajo el título. */
  description: string;
}

/** Una única acción recomendada con nivel de prioridad y justificación. */
export interface RecommendationAction {
  priority: 'high' | 'medium' | 'low';
  /** Área de negocio a la que se dirige la acción, p. ej. "Marketing", "Costes". */
  area: string;
  /** Acción concreta a llevar a cabo. */
  action: string;
  /** Por qué se recomienda esta acción en base a los datos del periodo. */
  rationale: string;
}

/**
 * Contenido estructurado completo de una recomendación de IA.
 * Refleja el esquema JSON esperado del backend.
 */
export interface RecommendationContent {
  /** Resumen ejecutivo del periodo (2-4 frases). */
  summary: string;
  highlights: RecommendationHighlight[];
  /** Lista de acciones ordenada (el backend ya las ordena por prioridad). */
  recommendations: RecommendationAction[];
  /** Perspectiva a corto plazo para la semana siguiente. */
  forecast: string;
}

/** Registro de recomendación de nivel superior tal como lo devuelve la API. */
export interface Recommendation {
  id: string;
  period_id: string;
  user_id: string;
  recommendations: RecommendationContent;
  /** Nombre/versión del modelo que generó esta recomendación. */
  model_used: string;
  /** Marca de tiempo ISO 8601 de la generación. */
  generated_at: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const recommendationService = {
  /**
   * Obtiene todas las recomendaciones almacenadas del usuario autenticado,
   * de más reciente a más antigua. Devuelve un array vacío si no hay ninguna.
   */
  async list(): Promise<Recommendation[]> {
    return apiClient.get<Recommendation[]>('/recommendations/');
  },

  /**
   * Obtiene la recomendación almacenada para un periodo concreto.
   * Devuelve `null` si todavía no se ha generado ninguna para ese periodo
   * (captura el 404 silenciosamente para que los llamantes puedan ramificar
   * sin necesidad de try/catch).
   *
   * @param periodId - UUID del periodo
   */
  async getForPeriod(periodId: string): Promise<Recommendation | null> {
    try {
      return await apiClient.get<Recommendation>(`/recommendations/${periodId}`);
    } catch {
      return null;
    }
  },

  /**
   * Activa la generación (o regeneración) de IA de una recomendación para el
   * periodo indicado. El backend recupera los KPIs del periodo, llama al LLM
   * y persiste el resultado antes de devolverlo.
   *
   * @param periodId - UUID del periodo a analizar
   * @param language - Etiqueta BCP 47 usada para pedir la IA en el idioma del usuario
   * @returns La recomendación recién generada
   */
  async generate(periodId: string, language = 'es'): Promise<Recommendation> {
    return apiClient.post<Recommendation>(
      `/recommendations/${periodId}/generate?language=${language}`,
    );
  },

  /**
   * Elimina la recomendación almacenada para un periodo.
   * Ignora silenciosamente el 404 (no existía recomendación) para que los
   * llamantes no necesiten comprobar la existencia antes de llamar.
   *
   * @param periodId - UUID del periodo cuya recomendación se quiere eliminar
   */
  async delete(periodId: string): Promise<void> {
    try {
      await apiClient.delete(`/recommendations/${periodId}`);
    } catch {
      // 404 = no existía recomendación; ignorar silenciosamente
    }
  },
};
