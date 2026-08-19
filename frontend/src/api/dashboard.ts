import { apiClient } from './client';
import type { DashboardSnapshot } from '../types/dashboard';

/**
 * Único ponto do frontend que sabe o path `/dashboard` — o `dashboardSlice`
 * (via thunk) e o teste do slice mockam este módulo, nunca `api/client.ts`
 * nem `fetch` diretamente.
 */
export function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  return apiClient.get<DashboardSnapshot>('/dashboard');
}
