// Хуки для работы с пакетами через React Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  getPackages,
  getPackagesWithType,
  getPackage,
  getPackagePurchases,
  getActivePackagePurchases,
  getPackagePurchase,
  getPackagePurchasesWithPackage,
  createPackagePurchase,
  consumePackageSession,
} from '@/lib/packageStorage';
import type { Database } from '@/lib/supabase';
import { toast } from 'sonner';

type Package = Database['public']['Tables']['packages']['Row'];
type PackagePurchase = Database['public']['Tables']['package_purchases']['Row'];

/**
 * Хук для получения всех активных пакетов
 */
export function usePackages() {
  return useQuery<Package[]>({
    queryKey: ['packages'],
    queryFn: getPackages,
    staleTime: 10 * 60 * 1000, // 10 минут - пакеты редко меняются
    gcTime: 30 * 60 * 1000, // 30 минут
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Хук для получения пакетов с информацией о типе консультации
 */
export function usePackagesWithType() {
  return useQuery({
    queryKey: ['packages-with-type'],
    queryFn: getPackagesWithType,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Хук для получения пакета по ID
 */
export function usePackage(packageId: string | null) {
  return useQuery<Package | null>({
    queryKey: ['package', packageId],
    queryFn: () => {
      if (!packageId) return Promise.resolve(null);
      return getPackage(packageId);
    },
    enabled: !!packageId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Хук для получения покупок пакетов пользователя
 */
export function usePackagePurchases() {
  const { user } = useAuth();

  return useQuery<PackagePurchase[]>({
    queryKey: ['package-purchases', user?.id],
    queryFn: getPackagePurchases,
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 минуты
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}

/**
 * Хук для получения активных покупок пакетов
 */
export function useActivePackagePurchases() {
  const { user } = useAuth();

  return useQuery<PackagePurchase[]>({
    queryKey: ['active-package-purchases', user?.id],
    queryFn: getActivePackagePurchases,
    enabled: !!user,
    staleTime: 1 * 60 * 1000, // 1 минута
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}

/**
 * Хук для получения покупок пакетов с информацией о пакете
 */
export function usePackagePurchasesWithPackage() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['package-purchases-with-package', user?.id],
    queryFn: getPackagePurchasesWithPackage,
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}

/**
 * Хук для получения покупки пакета по ID
 */
export function usePackagePurchase(purchaseId: string | null) {
  return useQuery<PackagePurchase | null>({
    queryKey: ['package-purchase', purchaseId],
    queryFn: () => {
      if (!purchaseId) return Promise.resolve(null);
      return getPackagePurchase(purchaseId);
    },
    enabled: !!purchaseId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Хук для покупки пакета
 */
export function usePurchasePackage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({
      packageId,
      paymentId,
      expiresAt,
    }: {
      packageId: string;
      paymentId?: string | null;
      expiresAt?: string | null;
    }) => createPackagePurchase(packageId, paymentId, expiresAt),
    onSuccess: () => {
      // Инвалидируем кеш пакетов групповой инвалидацией
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return key === 'package-purchases' || 
                 key === 'active-package-purchases' ||
                 key === 'package-purchases-with-package';
        }
      });
      toast.success('Пакет успешно приобретен');
    },
    onError: (error: Error) => {
      toast.error(`Ошибка при покупке пакета: ${error.message}`);
    },
  });
}

/**
 * Хук для использования сессии из пакета
 */
export function useUsePackageSession() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (purchaseId: string) => consumePackageSession(purchaseId),
    onSuccess: () => {
      // Инвалидируем кеш пакетов групповой инвалидацией
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return key === 'package-purchases' || 
                 key === 'active-package-purchases' ||
                 key === 'package-purchases-with-package';
        }
      });
      toast.success('Сессия использована');
    },
    onError: (error: Error) => {
      toast.error(`Ошибка при использовании сессии: ${error.message}`);
    },
  });
}

