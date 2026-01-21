import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { SpecialistApplicationForm } from '@/components/landing/SpecialistApplicationForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function SpecialistApplication() {
  return (
    <>
      <Helmet>
        <title>Стать специалистом Waves | Waves</title>
        <meta
          name="description"
          content="Присоединяйтесь к команде профессионалов платформы Waves. Заполните заявку и станьте частью нашей команды психологов."
        />
      </Helmet>

      <div className="min-h-screen bg-honey">
        <div className="container mx-auto px-4 py-8">
          {/* Кнопка назад */}
          <div className="mb-6">
            <Link to="/">
              <Button variant="ghost" className="text-ink hover:text-ink/80">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Вернуться на главную
              </Button>
            </Link>
          </div>

          {/* Заголовок */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-ink mb-2">
              Стать специалистом Waves
            </h1>
            <p className="text-lg text-ink/70">
              Присоединяйтесь к команде профессионалов платформы
            </p>
          </div>

          {/* Форма */}
          <div className="max-w-3xl mx-auto">
            <SpecialistApplicationForm alwaysExpanded={true} />
          </div>
        </div>
      </div>
    </>
  );
}
