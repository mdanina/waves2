// Общие типы, связанные с блогом. Совпадают с колонками таблицы blog_posts.

export type BlogStatus = 'draft' | 'published';

export interface BlogPostRow {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  category: string | null;
  category_slug: string | null;
  cover_image_url: string | null;
  content_html: string | null;
  status: BlogStatus;
  published_at: string | null;
  reading_time_minutes: number | null;
  author_name: string | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlogCategoryRow {
  id: string;
  slug: string;
  label: string;
  emoji: string | null;
  sort_order: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
