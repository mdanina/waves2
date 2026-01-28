import { Link } from "react-router-dom";

export const LandingFooter = () => {
  return (
    <footer className="bg-white text-ink">
      <div className="container mx-auto px-4 py-12">
        {/* Основное содержимое футера */}
        <div>
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="text-sm text-ink/80">
              <p className="mb-2">© {new Date().getFullYear()} WavyMind. Все права защищены.</p>
              <p className="font-medium text-ink">Связаться с нами: <a href="tel:+74951234567" className="hover:text-honey-dark transition-colors">+7 (495) 123-45-67</a></p>
            </div>
            <div className="flex flex-col gap-2 text-sm text-ink/80">
              <Link to="/terms" className="hover:text-ink transition-colors">
                Условия использования
              </Link>
              <Link to="/privacy" className="hover:text-ink transition-colors">
                Политика конфиденциальности
              </Link>
              <Link to="/privacy-notice" className="hover:text-ink transition-colors">
                Уведомление о конфиденциальности
              </Link>
              <Link to="/sitemap" className="hover:text-ink transition-colors">
                Карта сайта
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

