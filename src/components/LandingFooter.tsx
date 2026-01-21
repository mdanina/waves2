import { Link } from "react-router-dom";

export const LandingFooter = () => {
  return (
    <footer className="border-t border-honey-dark/20 bg-honey text-ink">
      <div className="container mx-auto px-4 py-12">
        {/* Кнопка для специалистов */}
        <div className="mb-8">
          <Link to="/specialist-application" className="block w-1/2">
            <div className="px-4 py-3 flex items-center justify-between text-left hover:bg-honey-dark/10 transition-colors rounded-lg border border-transparent hover:border-honey-dark/20">
              <div>
                <h3 className="text-base font-medium text-ink/90">Стать специалистом Balansity</h3>
                <p className="text-sm text-ink/60 mt-1">
                  Присоединяйтесь к команде профессионалов платформы
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Основное содержимое футера */}
        <div>
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="text-sm text-ink/80">
              <p className="mb-2">© {new Date().getFullYear()} Balansity. Все права защищены.</p>
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

