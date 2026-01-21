import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  category: string | null;
  category_slug: string | null;
  cover_image_url: string | null;
  content_html: string | null;
  status: 'draft' | 'published';
  published_at: string | null;
  reading_time_minutes: number | null;
  author_name: string | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

interface UseBlogPostsOptions {
  category?: string; // slug категории
  limit?: number;
  excludeSlug?: string; // исключить статью по slug (для "похожих статей")
  enabled?: boolean; // включить/выключить запрос (для условных запросов)
}

export function useBlogPosts(options: UseBlogPostsOptions = {}) {
  const { category, limit, excludeSlug, enabled = true } = options;

  return useQuery<BlogPost[]>({
    queryKey: ['blog-posts', { category, limit, excludeSlug }],
    enabled,
    staleTime: 0, // Данные сразу считаются устаревшими, чтобы всегда обновлялись
    gcTime: 0, // Не хранить в кеше после unmount (было cacheTime)
    refetchOnMount: 'always', // Всегда обновлять при монтировании
    refetchOnWindowFocus: true, // Обновлять при фокусе окна
    queryFn: async () => {
      let query = supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .lte('published_at', new Date().toISOString())
        .order('published_at', { ascending: false });

      if (category) {
        query = query.eq('category_slug', category);
      }

      if (excludeSlug) {
        query = query.neq('slug', excludeSlug);
      }

      if (limit && limit > 0) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data || []) as BlogPost[];
    },
  });
}
