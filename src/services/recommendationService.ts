/**
 * @file recommendationService.ts
 * @description API service for AI-generated weekly recommendations.
 *
 * Each recommendation is generated on-demand by the backend (FastAPI + OpenAI).
 * The backend stores the result so subsequent reads are instant and don't incur
 * additional AI costs.
 */

import { apiClient } from '@/lib/apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

/** A single analytical highlight for the period (positive, negative or neutral). */
export interface RecommendationHighlight {
  type: 'positive' | 'negative' | 'neutral';
  /** Short headline, e.g. "Strong margin growth". */
  title: string;
  /** One-sentence elaboration shown below the title. */
  description: string;
}

/** A single recommended action with a priority level and rationale. */
export interface RecommendationAction {
  priority: 'high' | 'medium' | 'low';
  /** Business area the action targets, e.g. "Marketing", "Costs". */
  area: string;
  /** Concrete action to take. */
  action: string;
  /** Why this action is recommended given the period's data. */
  rationale: string;
}

/**
 * Full structured content of an AI recommendation.
 * Mirrors the JSON schema expected from the backend.
 */
export interface RecommendationContent {
  /** Executive summary of the period (2-4 sentences). */
  summary: string;
  highlights: RecommendationHighlight[];
  /** Ordered action list (the backend already sorts by priority). */
  recommendations: RecommendationAction[];
  /** Short-term outlook for the following week. */
  forecast: string;
}

/** Top-level recommendation record as returned by the API. */
export interface Recommendation {
  id: string;
  period_id: string;
  user_id: string;
  recommendations: RecommendationContent;
  /** Name/version of the model that generated this recommendation. */
  model_used: string;
  /** ISO 8601 timestamp of generation. */
  generated_at: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const recommendationService = {
  /**
   * Fetches all stored recommendations for the authenticated user, newest first.
   * Returns an empty array if none exist.
   */
  async list(): Promise<Recommendation[]> {
    return apiClient.get<Recommendation[]>('/recommendations/');
  },

  /**
   * Fetches the stored recommendation for a specific period.
   * Returns `null` if no recommendation has been generated yet for that period
   * (catches 404 silently so callers can branch on presence without try/catch).
   *
   * @param periodId - UUID of the period
   */
  async getForPeriod(periodId: string): Promise<Recommendation | null> {
    try {
      return await apiClient.get<Recommendation>(`/recommendations/${periodId}`);
    } catch {
      return null;
    }
  },

  /**
   * Triggers AI generation (or regeneration) of a recommendation for the given
   * period. The backend retrieves the period's KPIs, calls the LLM, and persists
   * the result before returning it.
   *
   * @param periodId - UUID of the period to analyse
   * @param language - BCP 47 tag used to prompt the AI in the user's language
   * @returns The freshly generated recommendation
   */
  async generate(periodId: string, language = 'es'): Promise<Recommendation> {
    return apiClient.post<Recommendation>(
      `/recommendations/${periodId}/generate?language=${language}`,
    );
  },

  /**
   * Deletes the stored recommendation for a period.
   * Silently ignores 404 (no recommendation existed) so callers don't need to
   * guard against the absence of a recommendation before calling this.
   *
   * @param periodId - UUID of the period whose recommendation to delete
   */
  async delete(periodId: string): Promise<void> {
    try {
      await apiClient.delete(`/recommendations/${periodId}`);
    } catch {
      // 404 = no recommendation existed; ignore silently
    }
  },
};
