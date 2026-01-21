import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { LandingHeader } from "@/components/LandingHeader";
import { LandingFooter } from "@/components/LandingFooter";
import { useBlogPost } from "@/hooks/useBlogPost";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { useBlogCategories } from "@/hooks/useBlogCategories";
import { formatBlogDate, formatReadingTime } from "@/lib/slug";
import { Badge } from "@/components/ui/badge";
import { BlogBreadcrumbs } from "@/components/blog/BlogBreadcrumbs";
import "@/components/blog/Blog.css";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, isError } = useBlogPost(slug);
  const { data: categories } = useBlogCategories();

  // Похожие статьи: сначала из той же категории (только когда пост загружен)
  const { data: categoryPosts } = useBlogPosts({
    category: post?.category_slug || undefined,
    limit: 4,
    excludeSlug: slug,
    enabled: !!post?.category_slug, // Запрос выполняется только если есть категория
  });

  // Последние статьи для fallback
  const { data: latestPosts } = useBlogPosts({
    limit: 6,
    excludeSlug: slug,
  });

  // Собираем похожие статьи: сначала из категории, потом добиваем последними
  const related = (() => {
    const fromCategory = categoryPosts || [];
    if (fromCategory.length >= 3) {
      return fromCategory.slice(0, 3);
    }
    // Добиваем из последних, избегая дубликатов
    const categoryIds = new Set(fromCategory.map((p) => p.id));
    const fromLatest = (latestPosts || []).filter((p) => !categoryIds.has(p.id));
    return [...fromCategory, ...fromLatest].slice(0, 3);
  })();

  // Находим данные категории для breadcrumbs
  const category = categories?.find((c) => c.slug === post?.category_slug);

  return (
    <div className="blog-article-bg flex min-h-screen flex-col">
      <LandingHeader />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:py-10 lg:py-12">
          {isLoading && (
            <p className="text-sm text-white/60">Загружаем статью…</p>
          )}

          {isError && (
            <p className="text-sm text-red-300">
              Не удалось загрузить статью. Попробуйте позже.
            </p>
          )}

          {!isLoading && !isError && !post && (
            <div className="space-y-4">
              <h1 className="font-display text-2xl font-semibold md:text-3xl">
                Статья не найдена
              </h1>
              <p className="text-sm text-white/70">
                Возможно, ссылка устарела или материал ещё не опубликован.
              </p>
              <Link
                to="/blog"
                className="inline-flex text-sm font-medium text-[hsl(var(--color-honey))] hover:underline"
              >
                ← Вернуться в блог
              </Link>
            </div>
          )}

          {post && (
            <>
              {/* SEO: Мета-теги и JSON-LD в head */}
              <Helmet>
                <title>{post.title} | Блог Waves</title>
                <meta name="description" content={post.subtitle || post.title} />
                <link rel="canonical" href={`https://waves.ru/blog/${post.slug}`} />

                {/* Open Graph */}
                <meta property="og:type" content="article" />
                <meta property="og:title" content={post.title} />
                <meta property="og:description" content={post.subtitle || post.title} />
                <meta property="og:url" content={`https://waves.ru/blog/${post.slug}`} />
                {post.cover_image_url && <meta property="og:image" content={post.cover_image_url} />}
                <meta property="article:published_time" content={post.published_at} />
                {post.updated_at && <meta property="article:modified_time" content={post.updated_at} />}
                {post.category && <meta property="article:section" content={post.category} />}

                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={post.title} />
                <meta name="twitter:description" content={post.subtitle || post.title} />
                {post.cover_image_url && <meta name="twitter:image" content={post.cover_image_url} />}

                {/* JSON-LD Article Schema */}
                <script type="application/ld+json">
                  {JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "Article",
                    headline: post.title,
                    ...(post.subtitle && { description: post.subtitle }),
                    ...(post.cover_image_url && { image: post.cover_image_url }),
                    datePublished: post.published_at,
                    dateModified: post.updated_at || post.published_at,
                    url: `https://waves.ru/blog/${post.slug}`,
                    ...(post.author_name && {
                      author: {
                        "@type": "Person",
                        name: post.author_name,
                      },
                    }),
                    publisher: {
                      "@type": "Organization",
                      name: "Waves",
                      url: "https://waves.ru",
                      logo: {
                        "@type": "ImageObject",
                        url: "https://waves.ru/logo.png",
                      },
                    },
                    ...(post.category && { articleSection: post.category }),
                    mainEntityOfPage: {
                      "@type": "WebPage",
                      "@id": `https://waves.ru/blog/${post.slug}`,
                    },
                  })}
                </script>
              </Helmet>

            <article className="blog-article-shell mx-auto max-w-4xl px-5 py-7 md:px-8 md:py-9 lg:px-10 lg:py-10">
              {/* SEO: Хлебные крошки с микроразметкой */}
              <BlogBreadcrumbs
                items={[
                  { name: "Главная", url: "/" },
                  { name: "Блог", url: "/blog" },
                  ...(category
                    ? [{ name: category.label, url: `/blog/category/${category.slug}` }]
                    : []),
                ]}
                currentTitle={post.title}
                currentUrl={`/blog/${post.slug}`}
              />

              {/* Обложка в стиле split-макета */}
              {post.cover_image_url && (
                <div className="blog-cover-split mb-8 mx-auto overflow-hidden rounded-3xl">
                  <div className="blog-cover-image-section">
                    <img
                      src={post.cover_image_url}
                      alt={post.title}
                      className="blog-cover-image"
                    />
                  </div>
                  <div className="blog-cover-text-section">
                    {post.category && (
                      <div className="blog-cover-category">
                        {post.category}
                      </div>
                    )}
                    <h1 className="blog-cover-title">
                      {post.title}
                    </h1>
                    {post.subtitle && (
                      <p className="blog-cover-subtitle">
                        {post.subtitle}
                      </p>
                    )}
                    <div className="blog-cover-date">
                      {formatBlogDate(post.published_at)}
                    </div>
                  </div>
                </div>
              )}

              {/* Если нет обложки, показываем заголовок как раньше */}
              {!post.cover_image_url && (
                <header className="mb-7 md:mb-8">
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-[hsl(var(--color-ink))]/70">
                    {post.category && (
                      <Badge
                        variant="outline"
                        className="border-[hsl(var(--color-ink))]/20 bg-[hsl(var(--color-ink))]/5 text-[0.65rem] font-semibold uppercase tracking-wide text-[hsl(var(--color-ink))]"
                      >
                        {post.category}
                      </Badge>
                    )}
                    <span>{formatBlogDate(post.published_at)}</span>
                    {post.reading_time_minutes && (
                      <span>• {formatReadingTime(post.reading_time_minutes)}</span>
                    )}
                  </div>
                  <h1 className="mb-3 font-display text-3xl font-bold text-[hsl(var(--color-ink))] md:text-4xl lg:text-5xl">
                    {post.title}
                  </h1>
                  {post.subtitle && (
                    <p className="text-lg text-[hsl(var(--color-ink))]/80 md:text-xl">
                      {post.subtitle}
                    </p>
                  )}
                  {post.author_name && (
                    <p className="mt-4 text-sm text-[hsl(var(--color-ink))]/70">Автор: {post.author_name}</p>
                  )}
                </header>
              )}

              {post.content_html && (
                <div
                  className="prose"
                  dangerouslySetInnerHTML={{ __html: post.content_html }}
                />
              )}

              <div className="mt-10 border-t border-[hsl(var(--color-ink))]/10 pt-4">
                <Link
                  to="/blog"
                  className="inline-flex text-sm font-medium text-[hsl(var(--color-honey))] hover:underline"
                >
                  ← Ко всем статьям
                </Link>
              </div>
            </article>
            </>
          )}
        </div>

        {post && related.length > 0 && (
          <section className="border-t border-white/10 py-8 md:py-10 bg-[hsl(var(--color-ink))]">
            <div className="container mx-auto px-4">
              <h2 className="mb-4 font-display text-2xl font-semibold text-white md:text-3xl">
                Ещё по теме
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                {related.map((p) => (
                  <Link
                    key={p.id}
                    to={`/blog/${p.slug}`}
                    className="group block h-full rounded-2xl border border-white/5 p-4 transition-transform transition-colors hover:-translate-y-0.5 hover:border-white/25 bg-[hsl(var(--color-ink))]"
                  >
                    {p.cover_image_url && (
                      <div className="mb-3 h-32 w-full overflow-hidden rounded-xl bg-[hsl(var(--color-ink)/0.8)]">
                        <img
                          src={p.cover_image_url}
                          alt={p.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      </div>
                    )}
                    <div className="mb-1 flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-white/60">
                      {p.category && (
                        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[0.65rem] font-semibold text-white/80">
                          {p.category}
                        </span>
                      )}
                      <span>{formatBlogDate(p.published_at)}</span>
                      {p.reading_time_minutes && (
                        <span>• {formatReadingTime(p.reading_time_minutes)}</span>
                      )}
                    </div>
                    <h3 className="mb-1 font-display text-base font-semibold text-white/90 group-hover:text-white">
                      {p.title}
                    </h3>
                    {p.subtitle && (
                      <p className="line-clamp-2 text-xs text-white/70">
                        {p.subtitle}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <LandingFooter />
    </div>
  );
}
