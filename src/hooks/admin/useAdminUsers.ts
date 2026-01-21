import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface AdminUser {
  id: string;
  email: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  region: string | null;
  marketing_consent: boolean;
  role: 'user' | 'support' | 'admin' | 'super_admin';
  created_at: string;
  updated_at: string;
}

export interface UseAdminUsersOptions {
  page?: number;
  limit?: number;
}

export interface UseAdminUsersResult {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useAdminUsers(options: UseAdminUsersOptions = {}) {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return useQuery<UseAdminUsersResult>({
    queryKey: ['admin-users', page, limit],
    queryFn: async () => {
      // Получаем общее количество пользователей
      const { count, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      // Получаем пользователей с пагинацией
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        users: (data as AdminUser[]) || [],
        total,
        page,
        limit,
        totalPages,
      };
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AdminUser> }) => {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Пользователь обновлен');
    },
    onError: (error: Error) => {
      toast.error(`Ошибка обновления: ${error.message}`);
    },
  });
}

