import { useQuery } from '@tanstack/react-query';
import { getMetrics, type Metrics, type MetricsPeriod } from '@/lib/admin/metrics';

export function useAdminMetrics(period?: MetricsPeriod) {
  return useQuery<Metrics>({
    queryKey: ['admin-metrics', period],
    queryFn: () => getMetrics(period),
    staleTime: 5 * 60 * 1000, // 5 минут
    retry: 1, // Только одна попытка повтора
    retryDelay: 1000, // Задержка 1 секунда
  });
}

