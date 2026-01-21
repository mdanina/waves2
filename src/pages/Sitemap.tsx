import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { LandingFooter } from "@/components/LandingFooter";

const Sitemap = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-white">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            На главную
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold text-foreground mb-8">Карта сайта</h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Основные страницы */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              Основные страницы
            </h2>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-primary hover:underline">
                  Главная страница
                </Link>
              </li>
              <li>
                <Link to="/service" className="text-primary hover:underline">
                  О сервисе
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-primary hover:underline">
                  Блог
                </Link>
              </li>
            </ul>
          </section>

          {/* Личный кабинет */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              Личный кабинет
            </h2>
            <ul className="space-y-3">
              <li>
                <Link to="/cabinet" className="text-primary hover:underline">
                  Главная кабинета
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-primary hover:underline">
                  Профиль
                </Link>
              </li>
              <li>
                <Link to="/family-members" className="text-primary hover:underline">
                  Члены семьи
                </Link>
              </li>
              <li>
                <Link to="/checkup-history" className="text-primary hover:underline">
                  История чекапов
                </Link>
              </li>
            </ul>
          </section>

          {/* Чекапы */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              Чекапы
            </h2>
            <ul className="space-y-3">
              <li>
                <Link to="/checkup-intro" className="text-primary hover:underline">
                  Начать чекап ребенка
                </Link>
              </li>
              <li>
                <Link to="/parent-intro" className="text-primary hover:underline">
                  Опрос о себе
                </Link>
              </li>
              <li>
                <Link to="/family-intro" className="text-primary hover:underline">
                  Опрос о семье
                </Link>
              </li>
              <li>
                <Link to="/checkup-results" className="text-primary hover:underline">
                  Результаты чекапа
                </Link>
              </li>
            </ul>
          </section>

          {/* Консультации */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              Консультации
            </h2>
            <ul className="space-y-3">
              <li>
                <Link to="/appointments" className="text-primary hover:underline">
                  Мои консультации
                </Link>
              </li>
              <li>
                <Link to="/appointments/booking" className="text-primary hover:underline">
                  Записаться на консультацию
                </Link>
              </li>
              <li>
                <Link to="/packages" className="text-primary hover:underline">
                  Пакеты услуг
                </Link>
              </li>
            </ul>
          </section>

          {/* Авторизация */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              Авторизация
            </h2>
            <ul className="space-y-3">
              <li>
                <Link to="/login" className="text-primary hover:underline">
                  Вход
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-primary hover:underline">
                  Регистрация
                </Link>
              </li>
              <li>
                <Link to="/forgot-password" className="text-primary hover:underline">
                  Восстановление пароля
                </Link>
              </li>
            </ul>
          </section>

          {/* Правовая информация */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              Правовая информация
            </h2>
            <ul className="space-y-3">
              <li>
                <Link to="/terms" className="text-primary hover:underline">
                  Условия использования
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-primary hover:underline">
                  Политика конфиденциальности
                </Link>
              </li>
              <li>
                <Link to="/privacy-notice" className="text-primary hover:underline">
                  Уведомление о конфиденциальности
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
};

export default Sitemap;
