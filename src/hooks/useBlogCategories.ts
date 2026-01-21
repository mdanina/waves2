import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { BlogCategoryRow } from '@/lib/blogTypes';

export function useBlogCategories() {
  return useQuery<BlogCategoryRow[]>({
    queryKey: ['blog-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return (data || []) as BlogCategoryRow[];
    },
  });
}
