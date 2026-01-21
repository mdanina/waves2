import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { generateSlug } from '@/lib/slug';
import type { BlogPost } from '@/hooks/useBlogPosts';
import type { BlogCategoryRow } from '@/lib/blogTypes';
import { useBlogCategories } from '@/hooks/useBlogCategories';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { uploadBlogImage } from '@/lib/storage';

import { BlogEditor } from '@/components/blog/BlogEditor';

interface EditingState {
  post: Partial<BlogPost>;
  isNew: boolean;
}

interface EditingCategoryState {
  category: Partial<BlogCategoryRow>;
  isNew: boolean;
}

const EMOJI_PRESETS = ['🛟', '🧸', '🔥', '🌿', '💬', '🧠', '⭐', '💛'];

export default function BlogManagement() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [editingCategory, setEditingCategory] = useState<EditingCategoryState | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'categories'>('posts');
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [originalPost, setOriginalPost] = useState<Partial<BlogPost> | null>(null);

  // Подавление предупреждений addRange от react-quill (известная проблема библиотеки)
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = (...args: any[]) => {
      if (args[0]?.includes?.('addRange') || args[0]?.includes?.('The given range isn\'t in document')) {
        return; // Подавляем предупреждения addRange
      }
      originalError.apply(console, args);
    };
    
    console.warn = (...args: any[]) => {
      if (args[0]?.includes?.('addRange') || args[0]?.includes?.('The given range isn\'t in document')) {
        return; // Подавляем предупреждения addRange
      }
      originalWarn.apply(console, args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  const { data: posts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ['blog-posts-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as BlogPost[];
    },
  });

  const { data: categories } = useBlogCategories();

  const upsertPost = useMutation({
    mutationFn: async (payload: EditingState['post']) => {
      const body = { ...payload } as any;

      // Нормализуем строковые поля: null -> пустая строка
      if (body.content_html === null || body.content_html === undefined) {
        body.content_html = '';
      }
      if (body.subtitle === null || body.subtitle === undefined) {
        body.subtitle = '';
      }
      if (body.category === null || body.category === undefined) {
        body.category = '';
      }
      if (body.cover_image_url === null || body.cover_image_url === undefined) {
        body.cover_image_url = '';
      }
      if (body.author_name === null || body.author_name === undefined) {
        body.author_name = '';
      }

      if (!body.slug && body.title) {
        body.slug = generateSlug(body.title);
      }

      // Если статья публикуется, устанавливаем published_at
      if (body.status === 'published') {
        // Если published_at не установлен или статья была черновиком, устанавливаем текущую дату
        if (!body.published_at) {
          body.published_at = new Date().toISOString();
        }
        // Если published_at в будущем, оставляем как есть (для планирования публикации)
      } else if (body.status === 'draft') {
        // При переводе в черновик не трогаем published_at (может быть полезно для истории)
      }

      if (!body.id) {
        // Для новой статьи: если устанавливаем is_featured, сначала снимаем с других
        if (body.is_featured === true) {
          const { error: unfeatureError } = await supabase
            .from('blog_posts')
            .update({ is_featured: false })
            .eq('is_featured', true);
          
          if (unfeatureError) {
            console.error('Ошибка при снятии is_featured с других статей:', unfeatureError);
          }
        }
        
        const { data, error } = await supabase.from('blog_posts').insert(body).select('id').single();
        if (error) throw error;
        return data;
      } else {
        // Для существующей статьи: если устанавливаем is_featured, снимаем с других
        if (body.is_featured === true) {
          const { error: unfeatureError } = await supabase
            .from('blog_posts')
            .update({ is_featured: false })
            .eq('is_featured', true)
            .neq('id', body.id);
          
          if (unfeatureError) {
            console.error('Ошибка при снятии is_featured с других статей:', unfeatureError);
          }
        }
        
        const { error } = await supabase.from('blog_posts').update(body).eq('id', body.id);
        if (error) throw error;
        return { id: body.id };
      }
    },
    onSuccess: (data) => {
      toast.success('Статья сохранена');
      // Обновляем originalPost после успешного сохранения
      if (editing) {
        const savedPost = { ...editing.post, ...(data.id ? { id: data.id } : {}) };
        setOriginalPost(savedPost);
        // Обновляем editing.post с актуальным ID, если это новая статья
        if (editing.isNew && data.id) {
          setEditing((prev) => (prev ? { ...prev, post: { ...prev.post, id: data.id }, isNew: false } : null));
        }
      }
      // Не закрываем редактор автоматически - пользователь может продолжить редактирование
      // Агрессивная инвалидация всех вариантов кеша для блога
      queryClient.removeQueries({ queryKey: ['blog-posts'] }); // Полностью удаляем кеш
      queryClient.removeQueries({ queryKey: ['blog-posts-admin'] }); // Полностью удаляем кеш админки
      // Инвалидируем для обновления активных запросов
      queryClient.invalidateQueries({ 
        queryKey: ['blog-posts'],
        refetchType: 'all' // Обновляем все запросы, не только активные
      });
      queryClient.invalidateQueries({ 
        queryKey: ['blog-posts-admin'],
        refetchType: 'all'
      });
      // Принудительно обновляем все запросы блога
      queryClient.refetchQueries({ 
        queryKey: ['blog-posts'],
        type: 'all' // Обновляем все запросы
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Не удалось сохранить статью');
    },
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Статья удалена');
      queryClient.removeQueries({ queryKey: ['blog-posts'] });
      queryClient.removeQueries({ queryKey: ['blog-posts-admin'] });
      queryClient.invalidateQueries({ 
        queryKey: ['blog-posts'],
        refetchType: 'all'
      });
      queryClient.invalidateQueries({ 
        queryKey: ['blog-posts-admin'],
        refetchType: 'all'
      });
      queryClient.refetchQueries({ 
        queryKey: ['blog-posts'],
        type: 'all'
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Не удалось удалить статью');
    },
  });

  const openNew = () => {
    setEditorKey((prev) => prev + 1);
    setIsDialogOpen(true);
    const newPost = {
      title: '',
      slug: '',
      subtitle: '',
      category: '',
      cover_image_url: '',
      content_html: '',
      status: 'draft',
      reading_time_minutes: 5,
      author_name: '',
      is_featured: false,
    } as Partial<BlogPost>;
    setOriginalPost({ ...newPost });
    setEditing({
      isNew: true,
      post: newPost,
    });
  };

  const openEdit = (post: BlogPost) => {
    setEditorKey((prev) => prev + 1);
    setIsDialogOpen(true);
    // Нормализуем данные: заменяем null на пустые строки для ReactQuill
    const normalizedPost = { 
      ...post,
      content_html: post.content_html || '',
      subtitle: post.subtitle || '',
      category: post.category || '',
      cover_image_url: post.cover_image_url || '',
      author_name: post.author_name || '',
    };
    setOriginalPost({ ...normalizedPost });
    setEditing({ 
      isNew: false, 
      post: normalizedPost,
    });
  };

  // Проверка, есть ли несохраненные изменения
  const hasUnsavedChanges = () => {
    if (!editing || !originalPost) return false;
    const current = editing.post;
    return (
      current.title !== originalPost.title ||
      current.subtitle !== originalPost.subtitle ||
      current.content_html !== originalPost.content_html ||
      current.category_slug !== originalPost.category_slug ||
      current.cover_image_url !== originalPost.cover_image_url ||
      current.status !== originalPost.status ||
      current.reading_time_minutes !== originalPost.reading_time_minutes ||
      current.author_name !== originalPost.author_name ||
      current.is_featured !== originalPost.is_featured
    );
  };

  const handleCloseDialog = async (force: boolean = false) => {
    if (!force && hasUnsavedChanges()) {
      const shouldSave = confirm(
        'У вас есть несохраненные изменения. Сохранить как черновик перед закрытием?'
      );
      if (shouldSave) {
        // Сохраняем как черновик
        const draftPost = {
          ...editing!.post,
          status: 'draft',
        };
        await upsertPost.mutateAsync(draftPost);
        setEditing(null);
        setOriginalPost(null);
        setIsDialogOpen(false);
        return;
      }
      // Пользователь отменил - не закрываем
      return;
    }
    setEditing(null);
    setOriginalPost(null);
    setIsDialogOpen(false);
  };

  const setField = <K extends keyof BlogPost>(key: K, value: BlogPost[K]) => {
    setEditing((prev) => (prev ? { ...prev, post: { ...(prev.post as any), [key]: value } } : prev));
  };

  const upsertCategory = useMutation({
    mutationFn: async (payload: EditingCategoryState['category']) => {
      const body = { ...payload } as any;

      if (!body.slug && body.label) {
        body.slug = generateSlug(body.label);
      }

      if (!body.id) {
        const { data, error } = await supabase.from('blog_categories').insert(body).select('id').single();
        if (error) throw error;
        return data;
      } else {
        const { error } = await supabase.from('blog_categories').update(body).eq('id', body.id);
        if (error) throw error;
        return { id: body.id };
      }
    },
    onSuccess: () => {
      toast.success('Категория сохранена');
      setEditingCategory(null);
      queryClient.invalidateQueries({ queryKey: ['blog-categories'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Не удалось сохранить категорию');
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blog_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Категория удалена');
      queryClient.invalidateQueries({ queryKey: ['blog-categories'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Не удалось удалить категорию');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Блог</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Управление статьями и категориями блога.
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === 'posts' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('posts')}
        >
          Статьи
        </Button>
        <Button
          variant={activeTab === 'categories' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('categories')}
        >
          Категории
        </Button>
      </div>

      {activeTab === 'posts' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Статьи</CardTitle>
                <CardDescription>Черновики и опубликованные материалы.</CardDescription>
              </div>
              <Button onClick={openNew}>
                <Plus className="mr-2 h-4 w-4" />
                Новая статья
              </Button>
            </div>
          </CardHeader>
          <CardContent>
          {isLoading && (
            <div className="flex min-h-[240px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {!isLoading && posts && posts.length === 0 && (
            <p className="text-sm text-muted-foreground">Статей пока нет.</p>
          )}

          {!isLoading && posts && posts.length > 0 && (
            <Table>
              <TableHeader>
                  <TableRow>
                    <TableHead>Заголовок</TableHead>
                    <TableHead>Категория</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Hero</TableHead>
                    <TableHead>Опубликовано</TableHead>
                    <TableHead>Обновлено</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">{post.title}</TableCell>
                    <TableCell>{post.category}</TableCell>
                    <TableCell>
                      {post.status === 'published' ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                          Опубликовано
                        </span>
                      ) : (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                          Черновик
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {post.is_featured ? (
                        <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">
                          ⭐ Hero
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {post.published_at
                        ? new Date(post.published_at).toLocaleString('ru-RU')
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {post.updated_at
                        ? new Date(post.updated_at).toLocaleString('ru-RU')
                        : '—'}
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(post)}
                      >
                        <Edit className="mr-1 h-4 w-4" />
                        Редактировать
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm('Удалить статью?')) {
                            deletePost.mutate(post.id);
                          }
                        }}
                      >
                        Удалить
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'categories' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Категории</CardTitle>
                <CardDescription>Список тегов блога, используемых в фильтрах и статьях.</CardDescription>
              </div>
              <Button
                onClick={() =>
                  setEditingCategory({
                    isNew: true,
                    category: {
                      label: '',
                      slug: '',
                      emoji: '',
                      sort_order: 0,
                      is_active: true,
                    } as Partial<BlogCategoryRow>,
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Новая категория
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!categories || categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">Категории ещё не созданы.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Эмодзи</TableHead>
                    <TableHead>Порядок</TableHead>
                    <TableHead>Активна</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.label}</TableCell>
                      <TableCell>{cat.slug}</TableCell>
                      <TableCell>{cat.emoji}</TableCell>
                      <TableCell>{cat.sort_order ?? 0}</TableCell>
                      <TableCell>{cat.is_active ? 'Да' : 'Нет'}</TableCell>
                      <TableCell className="space-x-2 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setEditingCategory({
                              isNew: false,
                              category: { ...cat },
                            })
                          }
                        >
                          <Edit className="mr-1 h-4 w-4" />
                          Редактировать
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm('Удалить категорию?')) {
                              deleteCategory.mutate(cat.id);
                            }
                          }}
                        >
                          Удалить
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog 
        open={!!editing} 
        onOpenChange={async (open) => {
          setIsDialogOpen(open);
          if (!open && !upsertPost.isPending) {
            await handleCloseDialog();
          }
        }}
      >
        <DialogContent 
          className="max-h-[90vh] max-w-3xl overflow-y-auto"
          onOpenAutoFocus={(e) => {
            // Предотвращаем автоматический фокус, чтобы дать время редактору инициализироваться
            e.preventDefault();
          }}
        >
          {editing && (
            <>
              <DialogHeader>
                <DialogTitle>{editing.isNew ? 'Новая статья' : 'Редактировать статью'}</DialogTitle>
                <DialogDescription>
                  Заголовок, содержимое и параметры публикации.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Заголовок *</Label>
                    <Input
                      value={editing.post.title || ''}
                      onChange={(e) => setField('title', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Slug</Label>
                    <Input
                      value={editing.post.slug || ''}
                      placeholder="будет сгенерирован из заголовка"
                      onChange={(e) => setField('slug', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Категория</Label>
                    <Select
                      value={editing.post.category_slug || ''}
                      onValueChange={(value) => {
                        const cat = categories?.find((c) => c.slug === value) || null;
                        setField('category_slug', value);
                        setField('category', cat?.label || '');
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите категорию" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.slug}>
                            {cat.emoji && <span className="mr-1">{cat.emoji}</span>}
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Автор</Label>
                    <Input
                      value={editing.post.author_name || ''}
                      onChange={(e) => setField('author_name', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Подзаголовок / лид</Label>
                  <Textarea
                    rows={3}
                    value={editing.post.subtitle || ''}
                    onChange={(e) => setField('subtitle', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Обложка</Label>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center">
                      <Input
                        value={editing.post.cover_image_url || ''}
                        onChange={(e) => setField('cover_image_url', e.target.value)}
                        placeholder="URL обложки или загрузите файл ниже"
                        className="flex-1"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          id="cover-upload-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              setIsUploadingCover(true);
                              const url = await uploadBlogImage(file, 'covers');
                              setField('cover_image_url', url);
                              toast.success('Обложка загружена');
                            } catch (error: any) {
                              toast.error(error.message || 'Не удалось загрузить обложку');
                            } finally {
                              setIsUploadingCover(false);
                              e.target.value = '';
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('cover-upload-input')?.click()}
                          disabled={isUploadingCover}
                        >
                          {isUploadingCover ? 'Загрузка…' : 'Загрузить файл'}
                        </Button>
                      </div>
                    </div>
                    {/* Превью обложки */}
                    {editing.post.cover_image_url && (
                      <div className="relative w-full overflow-hidden rounded-lg border border-border bg-muted/50">
                        <img
                          src={editing.post.cover_image_url}
                          alt="Превью обложки"
                          className="h-auto w-full max-h-64 object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = '<div class="flex h-32 items-center justify-center text-sm text-muted-foreground">Не удалось загрузить изображение</div>';
                            }
                          }}
                        />
                        <div className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-1 text-xs text-white">
                          Превью
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                  <div className="space-y-1">
                    <Label>Время чтения (мин)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={editing.post.reading_time_minutes ?? ''}
                      onChange={(e) =>
                        setField(
                          'reading_time_minutes',
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={editing.post.status === 'published'}
                        onCheckedChange={(checked) => {
                          setField('status', checked ? 'published' : 'draft');
                          if (checked && !editing.post.published_at) {
                            // Автоматически устанавливаем дату публикации при публикации
                            setField('published_at', new Date().toISOString());
                          }
                        }}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {editing.post.status === 'published'
                            ? 'Опубликовано'
                            : 'Черновик'}
                        </span>
                        {editing.post.status === 'draft' && (
                          <span className="text-xs text-muted-foreground">
                            Статья не будет видна на странице блога
                          </span>
                        )}
                        {editing.post.status === 'published' && !editing.post.published_at && (
                          <span className="text-xs text-amber-600">
                            Дата публикации будет установлена автоматически
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="is_featured" className="text-base">
                      Главный материал (Hero)
                    </Label>
                    <div className="text-sm text-muted-foreground">
                      Показывать эту статью в hero-секции как главный материал
                    </div>
                  </div>
                  <Switch
                    id="is_featured"
                    checked={editing.post.is_featured ?? false}
                    onCheckedChange={(checked) => {
                      setField('is_featured', checked);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Текст статьи</Label>
                  {isDialogOpen && editing && (
                    <BlogEditor
                      key={`editor-${editorKey}-${editing.post.id || 'new'}`}
                      value={editing.post.content_html ?? ''}
                      onChange={(value) => setField('content_html', value || '')}
                      placeholder="Введите текст статьи..."
                    />
                  )}
                </div>
              </div>

              <DialogFooter className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => handleCloseDialog(true)}
                  disabled={upsertPost.isPending}
                >
                  Отмена
                </Button>
                <Button
                  onClick={() => upsertPost.mutate(editing.post)}
                  disabled={upsertPost.isPending || !editing.post.title}
                >
                  {upsertPost.isPending ? 'Сохранение…' : 'Сохранить'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && !upsertCategory.isPending && setEditingCategory(null)}>
        <DialogContent>
          {editingCategory && (
            <>
              <DialogHeader>
                <DialogTitle>{editingCategory.isNew ? 'Новая категория' : 'Редактировать категорию'}</DialogTitle>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Название</Label>
                    <Input
                      value={editingCategory.category.label || ''}
                      onChange={(e) =>
                        setEditingCategory((prev) =>
                          prev ? { ...prev, category: { ...prev.category, label: e.target.value } } : prev,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Slug</Label>
                    <Input
                      value={editingCategory.category.slug || ''}
                      placeholder="будет сгенерирован из названия"
                      onChange={(e) =>
                        setEditingCategory((prev) =>
                          prev ? { ...prev, category: { ...prev.category, slug: e.target.value } } : prev,
                        )
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label>Эмодзи</Label>
                      <Input
                        value={editingCategory.category.emoji || ''}
                        placeholder="Например, 🔥"
                        onChange={(e) =>
                          setEditingCategory((prev) =>
                            prev ? { ...prev, category: { ...prev.category, emoji: e.target.value } } : prev,
                          )
                        }
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {EMOJI_PRESETS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-muted text-lg hover:bg-accent"
                          onClick={() =>
                            setEditingCategory((prev) =>
                              prev ? { ...prev, category: { ...prev.category, emoji } } : prev,
                            )
                          }
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Порядок</Label>
                    <Input
                      type="number"
                      value={editingCategory.category.sort_order ?? 0}
                      onChange={(e) =>
                        setEditingCategory((prev) =>
                          prev
                            ? {
                                ...prev,
                                category: {
                                  ...prev.category,
                                  sort_order: Number(e.target.value) || 0,
                                },
                              }
                            : prev,
                        )
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    checked={editingCategory.category.is_active ?? true}
                    onCheckedChange={(checked) =>
                      setEditingCategory((prev) =>
                        prev ? { ...prev, category: { ...prev.category, is_active: checked } } : prev,
                      )
                    }
                  />
                  <span className="text-sm">Активна</span>
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => !upsertCategory.isPending && setEditingCategory(null)}
                >
                  Отмена
                </Button>
                <Button
                  onClick={() => upsertCategory.mutate(editingCategory.category)}
                  disabled={upsertCategory.isPending || !editingCategory.category.label}
                >
                  {upsertCategory.isPending ? 'Сохранение…' : 'Сохранить'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
