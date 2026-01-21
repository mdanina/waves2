import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { BlogPost } from './useBlogPosts';

export function useBlogPost(slug: string | undefined) {
  return useQuery<BlogPost | null>({
    queryKey: ['blog-post', slug],
    enabled: !!slug,
    queryFn: async () => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .lte('published_at', new Date().toISOString())
        .maybeSingle();

      if (error) {
        throw error;
      }

      return (data as BlogPost) || null;
    },
  });
}
