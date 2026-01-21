/**
 * Хук для получения назначенных специалистов для типа консультации
 */
import { useQuery } from '@tanstack/react-query';
import { getAllAssignedSpecialists, type AssignedSpecialistOption } from '@/lib/appointmentStorage';

export type { AssignedSpecialistOption };

/**
 * Хук для получения всех назначенных специалистов для типа консультации
 * Используется для отображения выбора, если есть несколько вариантов
 */
export function useAssignedSpecialists(
  appointmentTypeId: string | null,
  profileId?: string | null
) {
  return useQuery<AssignedSpecialistOption[]>({
    queryKey: ['assigned-specialists', appointmentTypeId, profileId],
    queryFn: () => {
      if (!appointmentTypeId) return Promise.resolve([]);
      return getAllAssignedSpecialists(appointmentTypeId, profileId);
    },
    enabled: !!appointmentTypeId,
    staleTime: 5 * 60 * 1000, // 5 минут
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Получить название типа назначения на русском
 */
export function getAssignmentTypeLabel(type: string): string {
  switch (type) {
    case 'primary':
      return 'Основной специалист';
    case 'consultant':
      return 'Консультант';
    case 'temporary':
      return 'Временная замена';
    default:
      return type;
  }
}

/**
 * Получить вариант Badge для типа назначения
 * Используем варианты из дизайн-системы shadcn/ui
 */
export function getAssignmentTypeBadgeVariant(type: string): 'default' | 'secondary' | 'outline' {
  switch (type) {
    case 'primary':
      return 'default'; // Primary/Honey - основной специалист
    case 'consultant':
      return 'secondary'; // Secondary/Lavender - консультант
    case 'temporary':
      return 'outline'; // Outline - временная замена
    default:
      return 'outline';
  }
}
