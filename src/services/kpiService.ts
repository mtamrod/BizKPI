import { MOCK_DASHBOARD } from '@/mocks/kpiMocks';
import type { DashboardData } from '@/types';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const kpiService = {
  async getDashboard(_companyId: string): Promise<DashboardData> {
    await delay(600);
    // When a real backend exists, replace with: return api.get(`/companies/${companyId}/dashboard`)
    return MOCK_DASHBOARD;
  },
};
