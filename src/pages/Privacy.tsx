import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { LandingFooter } from "@/components/LandingFooter";

const Privacy = () => {
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
        <h1 className="text-3xl font-bold text-foreground mb-8">Политика конфиденциальности</h1>

        <div className="prose prose-gray max-w-none space-y-6">
          <p className="text-muted-foreground">
            Дата вступления в силу: {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">1. Введение</h2>
            <p className="text-foreground/80">
              ООО «Балансити» (далее — «Компания», «мы») серьезно относится к защите персональных данных пользователей платформы Balansity. Настоящая Политика конфиденциальности описывает, какие данные мы собираем, как их используем и защищаем.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">2. Какие данные мы собираем</h2>

            <h3 className="text-lg font-medium text-foreground">2.1. Данные, которые вы предоставляете</h3>
            <ul className="list-disc pl-6 text-foreground/80 space-y-2">
              <li>Контактная информация (email, телефон)</li>
              <li>Данные профиля (имя, регион)</li>
              <li>Информация о членах семьи (имена, даты рождения, пол)</li>
              <li>Ответы на вопросы чекапов</li>
              <li>Информация о записях на консультации</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground">2.2. Данные, собираемые автоматически</h3>
            <ul className="list-disc pl-6 text-foreground/80 space-y-2">
              <li>IP-адрес и данные о местоположении</li>
              <li>Тип устройства и браузера</li>
              <li>Данные об использовании Сервиса</li>
              <li>Файлы cookie и аналогичные технологии</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">3. Как мы используем данные</h2>
            <p className="text-foreground/80">Мы используем собранные данные для:</p>
            <ul className="list-disc pl-6 text-foreground/80 space-y-2">
              <li>Предоставления и улучшения Сервиса</li>
              <li>Формирования персонализированных отчетов и рекомендаций</li>
              <li>Организации консультаций со специалистами</li>
              <li>Связи с вами по вопросам использования Сервиса</li>
              <li>Анализа и улучшения качества услуг</li>
              <li>Соблюдения требований законодательства</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">4. Правовые основания обработки</h2>
            <p className="text-foreground/80">Мы обрабатываем персональные данные на следующих основаниях:</p>
            <ul className="list-disc pl-6 text-foreground/80 space-y-2">
              <li>Ваше согласие</li>
              <li>Исполнение договора с вами</li>
              <li>Соблюдение законодательных требований</li>
              <li>Наши законные интересы (улучшение Сервиса, безопасность)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">5. Передача данных третьим лицам</h2>
            <p className="text-foreground/80">Мы можем передавать данные:</p>
            <ul className="list-disc pl-6 text-foreground/80 space-y-2">
              <li>Специалистам, к которым вы записываетесь на консультацию</li>
              <li>Поставщикам услуг (хостинг, платежные системы)</li>
              <li>По требованию государственных органов в соответствии с законодательством</li>
            </ul>
            <p className="text-foreground/80">
              Мы не продаем персональные данные третьим лицам.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">6. Защита данных</h2>
            <p className="text-foreground/80">
              Мы применяем технические и организационные меры для защиты персональных данных:
            </p>
            <ul className="list-disc pl-6 text-foreground/80 space-y-2">
              <li>Шифрование данных при передаче (SSL/TLS)</li>
              <li>Ограничение доступа к данным</li>
              <li>Регулярный аудит безопасности</li>
              <li>Обучение сотрудников правилам работы с данными</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">7. Хранение данных</h2>
            <p className="text-foreground/80">
              Мы храним персональные данные в течение срока, необходимого для целей обработки, или в соответствии с требованиями законодательства. После удаления учетной записи данные могут храниться в архивах в течение срока, установленного законодательством.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">8. Ваши права</h2>
            <p className="text-foreground/80">Вы имеете право:</p>
            <ul className="list-disc pl-6 text-foreground/80 space-y-2">
              <li>Получить доступ к своим персональным данным</li>
              <li>Исправить неточные данные</li>
              <li>Удалить свои данные</li>
              <li>Ограничить обработку данных</li>
              <li>Отозвать согласие на обработку</li>
              <li>Получить данные в переносимом формате</li>
            </ul>
            <p className="text-foreground/80">
              Для реализации этих прав свяжитесь с нами по указанным ниже контактам.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">9. Данные детей</h2>
            <p className="text-foreground/80">
              Сервис предназначен для использования родителями и законными представителями детей. Мы обрабатываем данные о детях только с согласия их родителей или законных представителей и в соответствии с применимым законодательством о защите детей.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">10. Изменения политики</h2>
            <p className="text-foreground/80">
              Мы можем обновлять настоящую Политику. О существенных изменениях мы уведомим вас по электронной почте или через Сервис. Рекомендуем периодически просматривать эту страницу.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">11. Контактная информация</h2>
            <p className="text-foreground/80">
              По вопросам, связанным с обработкой персональных данных, обращайтесь:
            </p>
            <ul className="list-none text-foreground/80 space-y-1">
              <li>Email: privacy@balansity.ru</li>
              <li>Телефон: +7 (495) 123-45-67</li>
              <li>Адрес: г. Москва, ул. Примерная, д. 1</li>
            </ul>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
};

export default Privacy;
