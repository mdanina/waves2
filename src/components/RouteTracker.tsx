import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    ym?: (counterId: number, method: string, ...args: any[]) => void;
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Компонент для отслеживания изменений роутов в SPA
 * Отправляет данные в Яндекс.Метрику и Google Analytics при навигации
 */
export function RouteTracker() {
  const location = useLocation();
  const YANDEX_COUNTER_ID = 103770352;

  useEffect(() => {
    const url = location.pathname + location.search;
    const title = document.title;

    // Яндекс.Метрика - вызываем hit при изменении страницы (SPA navigation)
    if (window.ym) {
      window.ym(YANDEX_COUNTER_ID, 'hit', url, {
        title: title,
        referer: document.referrer || undefined
      });
    }

    // Google Analytics (если будет добавлен)
    if (window.gtag) {
      const googleId = import.meta.env.VITE_GOOGLE_ANALYTICS_ID;
      if (googleId) {
        window.gtag('config', googleId, {
          page_path: url,
          page_title: title,
        });
      }
    }
  }, [location]);

  return null;
}

