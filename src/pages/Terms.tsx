import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { LandingFooter } from "@/components/LandingFooter";

const Terms = () => {
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
        <h1 className="text-3xl font-bold text-foreground mb-8">Условия использования</h1>

        <div className="prose prose-gray max-w-none space-y-6">
          <p className="text-muted-foreground">
            Дата вступления в силу: {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">1. Общие положения</h2>
            <p className="text-foreground/80">
              Настоящие Условия использования (далее — «Условия») регулируют отношения между ООО «Балансити» (далее — «Компания», «мы», «нас») и пользователями платформы Balansity (далее — «Сервис», «Платформа»).
            </p>
            <p className="text-foreground/80">
              Используя Сервис, вы подтверждаете, что прочитали, поняли и согласны соблюдать настоящие Условия. Если вы не согласны с какими-либо положениями, пожалуйста, прекратите использование Сервиса.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">2. Описание Сервиса</h2>
            <p className="text-foreground/80">
              Balansity — это платформа для оценки ментального здоровья детей и их семей. Сервис предоставляет:
            </p>
            <ul className="list-disc pl-6 text-foreground/80 space-y-2">
              <li>Инструменты для проведения чекапов ментального здоровья</li>
              <li>Персонализированные отчеты и рекомендации</li>
              <li>Возможность записи на консультации к специалистам</li>
              <li>Образовательные материалы о детском развитии</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">3. Регистрация и учетная запись</h2>
            <p className="text-foreground/80">
              Для использования Сервиса вам необходимо создать учетную запись. При регистрации вы обязуетесь:
            </p>
            <ul className="list-disc pl-6 text-foreground/80 space-y-2">
              <li>Предоставить достоверную и актуальную информацию</li>
              <li>Поддерживать актуальность данных учетной записи</li>
              <li>Обеспечить конфиденциальность данных для входа</li>
              <li>Немедленно уведомлять нас о несанкционированном использовании учетной записи</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">4. Ограничение ответственности</h2>
            <p className="text-foreground/80">
              Сервис предоставляет информационные и образовательные материалы, а также инструменты для первичной оценки. Результаты чекапов и рекомендации:
            </p>
            <ul className="list-disc pl-6 text-foreground/80 space-y-2">
              <li>Не являются медицинским диагнозом</li>
              <li>Не заменяют профессиональную консультацию специалиста</li>
              <li>Носят рекомендательный характер</li>
            </ul>
            <p className="text-foreground/80">
              При наличии серьезных опасений относительно здоровья ребенка необходимо обратиться к квалифицированному специалисту.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">5. Интеллектуальная собственность</h2>
            <p className="text-foreground/80">
              Все материалы Сервиса, включая тексты, графику, логотипы, методики оценки и программное обеспечение, являются интеллектуальной собственностью Компании или её лицензиаров и защищены законодательством об авторском праве.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">6. Оплата услуг</h2>
            <p className="text-foreground/80">
              Некоторые функции Сервиса являются платными. Стоимость услуг указана на соответствующих страницах Сервиса. Оплата производится в соответствии с выбранным тарифом. Возврат средств осуществляется согласно действующему законодательству РФ.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">7. Прекращение использования</h2>
            <p className="text-foreground/80">
              Мы оставляем за собой право приостановить или прекратить ваш доступ к Сервису в случае нарушения настоящих Условий. Вы можете в любой момент удалить свою учетную запись, обратившись в службу поддержки.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">8. Изменение Условий</h2>
            <p className="text-foreground/80">
              Мы можем время от времени обновлять настоящие Условия. О существенных изменениях мы уведомим вас по электронной почте или через Сервис. Продолжение использования Сервиса после внесения изменений означает ваше согласие с обновленными Условиями.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">9. Контактная информация</h2>
            <p className="text-foreground/80">
              Если у вас есть вопросы относительно настоящих Условий, свяжитесь с нами:
            </p>
            <ul className="list-none text-foreground/80 space-y-1">
              <li>Email: support@balansity.ru</li>
              <li>Телефон: +7 (495) 123-45-67</li>
            </ul>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
};

export default Terms;
