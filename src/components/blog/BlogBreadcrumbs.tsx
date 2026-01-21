import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BlogBreadcrumbsProps {
  items: BreadcrumbItem[];
  currentTitle: string;
  currentUrl: string;
}

/**
 * Хлебные крошки для блога с Microdata разметкой (Schema.org)
 * Поддерживает SEO для Яндекса (Microdata) и Google (JSON-LD)
 */
export function BlogBreadcrumbs({ items, currentTitle, currentUrl }: BlogBreadcrumbsProps) {
  const baseUrl = "https://waves.ru";

  // Полный список элементов для JSON-LD
  const jsonLdItems = [
    ...items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.url}`,
    })),
    {
      "@type": "ListItem",
      position: items.length + 1,
      name: currentTitle,
      item: `${baseUrl}${currentUrl}`,
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: jsonLdItems,
  };

  return (
    <>
      {/* JSON-LD для Google в head */}
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

      {/* Microdata разметка для Яндекса */}
      <nav
        aria-label="Хлебные крошки"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
        className="blog-breadcrumbs"
      >
        <ol className="blog-breadcrumbs-list">
          {items.map((item, index) => (
            <li
              key={item.url}
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
              className="blog-breadcrumbs-item"
            >
              <Link
                to={item.url}
                itemProp="item"
                className="blog-breadcrumbs-link"
              >
                <span itemProp="name">{item.name}</span>
              </Link>
              <meta itemProp="position" content={String(index + 1)} />
              <span className="blog-breadcrumbs-separator" aria-hidden="true">
                /
              </span>
            </li>
          ))}

          {/* Последний элемент - текущая страница (не ссылка) */}
          <li
            itemProp="itemListElement"
            itemScope
            itemType="https://schema.org/ListItem"
            className="blog-breadcrumbs-item blog-breadcrumbs-item--current"
          >
            <span itemProp="name" className="blog-breadcrumbs-current">
              {currentTitle}
            </span>
            <meta itemProp="item" content={`${baseUrl}${currentUrl}`} />
            <meta itemProp="position" content={String(items.length + 1)} />
          </li>
        </ol>
      </nav>
    </>
  );
}
