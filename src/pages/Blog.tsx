import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { LandingHeader } from "@/components/LandingHeader";
import { LandingFooter } from "@/components/LandingFooter";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { useBlogCategories } from "@/hooks/useBlogCategories";
import { formatBlogDate, formatReadingTime } from "@/lib/slug";
import "@/components/blog/Blog.css";

export default function Blog() {
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const navigate = useNavigate();

  // Категория из URL имеет приоритет
  const activeTopic = categorySlug || undefined;
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Функция для изменения категории через URL
  const setActiveTopic = (slug: string | undefined) => {
    if (slug) {
      navigate(`/blog/category/${slug}`);
    } else {
      navigate('/blog');
    }
  };

  const { data: categories } = useBlogCategories();

  // Загружаем ВСЕ посты (для hero-статьи, которая одна на весь блог)
  const { data: allPosts, isLoading: isLoadingAll } = useBlogPosts({});

  // Загружаем посты по категории (если выбрана)
  const { data: categoryPosts, isLoading: isLoadingCategory, isError } = useBlogPosts({
    category: activeTopic,
    enabled: !!activeTopic,
  });

  const isLoading = isLoadingAll || (activeTopic && isLoadingCategory);

  // Hero - всегда featured статья из ВСЕХ постов (одна на весь блог)
  const hero = allPosts?.find(p => p.is_featured) || allPosts?.[0];

  // Посты для отображения: по категории или все (без hero)
  const postsToShow = activeTopic ? categoryPosts : allPosts;

  // Функция для поиска по тексту статей
  const filterPostsBySearch = (postsToFilter: typeof postsToShow) => {
    if (!searchQuery.trim() || !postsToFilter) return postsToFilter;

    const query = searchQuery.toLowerCase().trim();
    return postsToFilter.filter((post) => {
      const titleMatch = post.title?.toLowerCase().includes(query);
      const subtitleMatch = post.subtitle?.toLowerCase().includes(query);
      // Извлекаем текст из HTML для поиска по содержимому
      const contentText = post.content_html
        ? post.content_html.replace(/<[^>]*>/g, '').toLowerCase()
        : '';
      const contentMatch = contentText.includes(query);

      return titleMatch || subtitleMatch || contentMatch;
    });
  };

  // Применяем поиск и исключаем hero
  const filteredPosts = filterPostsBySearch(postsToShow);
  const rest = filteredPosts?.filter(p => p.id !== hero?.id) ?? [];

  return (
    <div className="blog-root flex min-h-screen flex-col">
      <LandingHeader />

      <main className="flex-1">
        {/* Hero band */}
        <section className="blog-hero-band pt-10 md:pt-14 pb-0">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto">
              <div className="blog-hero-card grid gap-8 md:grid-cols-[minmax(0,1.7fr)_minmax(0,1.3fr)] items-center">
                <div className="relative z-10 space-y-4">
                  <div className="blog-hero-pill text-xs font-medium text-[hsl(var(--color-ink))]/70">
                    <span>Журнал Balansity</span>
                    <span className="h-1 w-1 rounded-full bg-white/70" />
                    <span>для тех, кто тащит на себе всё</span>
                  </div>
                  <h1 className="font-display text-3xl font-bold leading-tight text-[hsl(var(--color-ink))] md:text-4xl lg:text-5xl">
                    Как жить, работать и растить детей,
                    <br className="hidden md:block" /> не уходя в эмоциональный выгорание
                  </h1>
                  <p className="max-w-xl text-sm text-[hsl(var(--color-ink))]/80 md:text-base">
                    Длинные тексты, заметки психологов и очень честные истории родителей —
                    о тревоге, отдыхе, границах и том, как не потерять себя в заботе о семье.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2 text-xs font-medium text-[hsl(var(--color-ink))]">
                    {/* Кнопка "Все статьи" */}
                    <button
                      type="button"
                      onClick={() => setActiveTopic(undefined)}
                      className={`blog-top-tag ${
                        !activeTopic ? "blog-top-tag--active" : "blog-top-tag--inactive"
                      }`}
                    >
                      <span>📚</span>
                      <span>Все статьи</span>
                    </button>
                    {/* Фильтры по категориям */}
                    {(categories || []).map((topic) => {
                      const isActive = activeTopic === topic.slug;
                      return (
                        <button
                          key={topic.slug}
                          type="button"
                          onClick={() => setActiveTopic(topic.slug)}
                          className={`blog-top-tag ${
                            isActive ? "blog-top-tag--active" : "blog-top-tag--inactive"
                          }`}
                        >
                          {topic.emoji && <span>{topic.emoji}</span>}
                          <span>{topic.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {hero && (() => {
                  const category = categories?.find((cat) => cat.slug === hero.category_slug);
                  return (
                    <Link
                      to={`/blog/${hero.slug}`}
                      className="relative z-10 flex h-full rounded-3xl overflow-hidden bg-[hsl(var(--color-white))] text-left flex-col shadow-soft"
                    >
                      {/* Обложка */}
                      {hero.cover_image_url ? (
                        <div className="flex-1 min-h-[200px] max-h-[300px] overflow-hidden">
                          <img
                            src={hero.cover_image_url}
                            alt={hero.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex-1 min-h-[200px] max-h-[300px] flex items-center justify-center bg-gradient-to-br from-[hsl(var(--color-cloud))] to-[hsl(var(--border))]">
                          <span className="text-6xl opacity-30">
                            {category?.emoji || '📄'}
                          </span>
                        </div>
                      )}

                      {/* Контент */}
                      <div className="p-4 flex flex-col flex-1">
                        <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--color-ink))]/70">
                          Главный материал сейчас
                        </p>
                        <h2 className="mb-2 line-clamp-3 font-display text-lg font-semibold text-[hsl(var(--color-ink))] md:text-xl">
                          {hero.title}
                        </h2>
                        {hero.subtitle && (
                          <p className="mb-3 line-clamp-3 text-xs text-[hsl(var(--color-ink))]/80">
                            {hero.subtitle}
                          </p>
                        )}
                        <div className="mt-auto flex flex-wrap items-center gap-2 text-[0.7rem] text-[hsl(var(--color-ink))]/80">
                          {category && (
                            <span className="rounded-full bg-[hsl(var(--color-ink))]/8 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide">
                              {category.label}
                            </span>
                          )}
                          <span>{formatBlogDate(hero.published_at)}</span>
                          {hero.reading_time_minutes && (
                            <span>• {formatReadingTime(hero.reading_time_minutes)}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })()}
              </div>
            </div>
          </div>
        </section>

        {/* Search bar */}
        <section className="pt-6 pb-4">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto">
              <div className="blog-search-container">
                <div className="blog-search-input-wrapper">
                  <svg
                    className="blog-search-icon"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4.35-4.35"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="поиск"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                      }
                    }}
                    className="blog-search-input"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    // Поиск уже работает при вводе, но можно добавить дополнительную логику
                  }}
                  className="blog-search-button"
                >
                  найти
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* List of stories */}
        <section className="pt-0 pb-8 md:pb-10">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto">
            {isLoading && (
              <p className="text-sm text-white/60">Загружаем статьи…</p>
            )}
            {isError && (
              <p className="text-sm text-red-300">
                Не удалось загрузить статьи. Попробуйте позже.
              </p>
            )}

            {!isLoading && !isError && allPosts && allPosts.length === 0 && (
              <p className="text-sm text-white/70">
                Пока здесь нет опубликованных материалов. Скоро мы их добавим.
              </p>
            )}

            {(hero || rest.length > 0) && (
              <div className="blog-grid mt-4 lg:mt-6">
                {rest.map((post) => {
                  const category = categories?.find((cat) => cat.slug === post.category_slug);
                  
                  return (
                    <Link
                      key={post.id}
                      to={`/blog/${post.slug}`}
                      className="blog-card-new group"
                    >
                      {/* Верхняя часть - обложка */}
                      <div className="blog-card-cover">
                        {post.cover_image_url ? (
                          <img
                            src={post.cover_image_url}
                            alt={post.title}
                            className="blog-card-cover-image"
                          />
                        ) : (
                          <div className="blog-card-cover-placeholder">
                            <span className="text-4xl opacity-30">
                              {category?.emoji || '📄'}
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Нижняя часть - текст */}
                      <div className="blog-card-content">
                        <h3 className="blog-card-title">
                          {post.title}
                        </h3>
                        {post.subtitle && (
                          <p className="blog-card-subtitle">
                            {post.subtitle}
                          </p>
                        )}
                        {/* Значок рубрики в левом нижнем углу */}
                        {category?.emoji && (
                          <div className="blog-card-rubric-icon">
                            {category.emoji}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
