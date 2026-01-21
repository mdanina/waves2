import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { LandingFooter } from "@/components/LandingFooter";

const PrivacyNotice = () => {
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
        <h1 className="text-3xl font-bold text-foreground mb-8">Уведомление о конфиденциальности</h1>

        <div className="prose prose-gray max-w-none space-y-6">
          <div className="bg-sky-blue/10 border border-sky-blue/20 rounded-lg p-6">
            <p className="text-foreground/80 m-0">
              Это краткое уведомление содержит ключевую информацию о том, как мы обрабатываем ваши персональные данные. Полную информацию вы найдете в нашей <Link to="/privacy" className="text-primary hover:underline">Политике конфиденциальности</Link>.
            </p>
          </div>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Кто мы</h2>
            <p className="text-foreground/80">
              ООО «Балансити» — оператор платформы Balansity для оценки ментального здоровья детей и их семей. Мы являемся оператором персональных данных и несем ответственность за их защиту.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Какие данные мы собираем</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-muted/30 rounded-lg p-4">
                <h3 className="font-medium text-foreground mb-2">Данные о вас</h3>
                <ul className="list-disc pl-4 text-foreground/80 text-sm space-y-1">
                  <li>Email и телефон</li>
                  <li>Имя и регион</li>
                  <li>Ответы на опросы</li>
                </ul>
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <h3 className="font-medium text-foreground mb-2">Данные о вашей семье</h3>
                <ul className="list-disc pl-4 text-foreground/80 text-sm space-y-1">
                  <li>Имена детей</li>
                  <li>Даты рождения</li>
                  <li>Результаты чекапов</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Зачем нам ваши данные</h2>
            <ul className="list-disc pl-6 text-foreground/80 space-y-2">
              <li><strong>Для работы Сервиса</strong> — чтобы вы могли проходить чекапы и получать рекомендации</li>
              <li><strong>Для персонализации</strong> — чтобы отчеты были релевантны именно вашей семье</li>
              <li><strong>Для консультаций</strong> — чтобы специалисты могли подготовиться к встрече с вами</li>
              <li><strong>Для связи</strong> — чтобы уведомлять вас о важных событиях</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Как мы защищаем данные</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🔒</span>
                </div>
                <p className="text-sm text-foreground/80">Шифрование при передаче</p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🛡️</span>
                </div>
                <p className="text-sm text-foreground/80">Защищенные серверы</p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">👥</span>
                </div>
                <p className="text-sm text-foreground/80">Ограниченный доступ</p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Ваши права</h2>
            <p className="text-foreground/80">
              Вы можете в любой момент:
            </p>
            <ul className="list-disc pl-6 text-foreground/80 space-y-2">
              <li>Запросить копию своих данных</li>
              <li>Исправить неточную информацию</li>
              <li>Удалить свою учетную запись и данные</li>
              <li>Отозвать согласие на обработку</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Файлы cookie</h2>
            <p className="text-foreground/80">
              Мы используем cookie для:
            </p>
            <ul className="list-disc pl-6 text-foreground/80 space-y-2">
              <li><strong>Необходимые</strong> — для работы авторизации и безопасности</li>
              <li><strong>Функциональные</strong> — для сохранения ваших настроек</li>
              <li><strong>Аналитические</strong> — для улучшения Сервиса (только с вашего согласия)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Контакты</h2>
            <p className="text-foreground/80">
              По вопросам конфиденциальности:
            </p>
            <ul className="list-none text-foreground/80 space-y-1">
              <li>Email: privacy@balansity.ru</li>
              <li>Телефон: +7 (495) 123-45-67</li>
            </ul>
          </section>

          <div className="bg-muted/30 rounded-lg p-6 mt-8">
            <p className="text-foreground/80 text-sm m-0">
              Подробная информация об обработке персональных данных содержится в <Link to="/privacy" className="text-primary hover:underline">Политике конфиденциальности</Link> и <Link to="/terms" className="text-primary hover:underline">Условиях использования</Link>.
            </p>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
};

export default PrivacyNotice;
