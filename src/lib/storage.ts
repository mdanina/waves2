import { supabase } from '@/lib/supabase';

// Bucket name для изображений блога. Создай его в Supabase Storage и
// сделай публичным (read) либо через policies, либо через public bucket.
const BLOG_IMAGES_BUCKET = 'blog-images';

function makeFilePath(folder: string, file: File) {
  const ext = file.name.split('.').pop() || 'png';
  const safeName = file.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const stamp = Date.now();
  return `${folder}/${stamp}-${safeName}.${ext}`;
}

/**
 * Загружает файл в Supabase Storage и возвращает публичный URL.
 */
export async function uploadBlogImage(file: File, folder: 'covers' | 'content'): Promise<string> {
  const path = makeFilePath(folder, file);

  const { data, error } = await supabase.storage
    .from(BLOG_IMAGES_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw error;
  }

  const { data: publicUrlData } = supabase.storage.from(BLOG_IMAGES_BUCKET).getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}
