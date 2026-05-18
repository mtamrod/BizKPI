import { apiClient } from '@/lib/apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RecommendationHighlight {
  type: 'positive' | 'negative' | 'neutral';
  title: string;
  description: string;
}

export interface RecommendationAction {
  priority: 'high' | 'medium' | 'low';
  area: string;
  action: string;
  rationale: string;
}

export interface RecommendationContent {
  summary: string;
  highlights: RecommendationHighlight[];
  recommendations: RecommendationAction[];
  forecast: string;
}

export interface Recommendation {
  id: string;
  period_id: string;
  user_id: string;
  recommendations: RecommendationContent;
  model_used: string;
  generated_at: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const recommendationService = {
  /** Returns all recommendations for the current user, newest first. */
  async list(): Promise<Recommendation[]> {
    return apiClient.get<Recommendation[]>('/recommendations/');
  },

  /** Returns the recommendation for a specific period, or null if none. */
  async getForPeriod(periodId: string): Promise<Recommendation | null> {
    try {
      return await apiClient.get<Recommendation>(`/recommendations/${periodId}`);
    } catch {
      return null;
    }
  },

  /** Generates (or regenerates) recommendations for a period via the AI. */
  async generate(periodId: string): Promise<Recommendation> {
    return apiClient.post<Recommendation>(`/recommendations/${periodId}/generate`);
  },

  /** Deletes the stored recommendation for a period (silent — ignores 404). */
  async delete(periodId: string): Promise<void> {
    try {
      await apiClient.delete(`/recommendations/${periodId}`);
    } catch {
      // 404 = no recommendation existed; ignore silently
    }
  },
};
