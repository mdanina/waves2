import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { FREE_CONSULTATION_EXPIRY_DAYS } from "@/hooks/useAppointments";

export default function CheckupResults() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-8">
        <div className="space-y-12">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/20">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <h1 className="mb-4 text-4xl font-bold text-foreground">
              Спасибо за завершение опроса!
            </h1>
            <p className="text-lg text-muted-foreground">
              Мы проанализировали ваши ответы и готовы предоставить персонализированные рекомендации
              для вашей семьи.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">Следующие шаги</h3>
            
            <div className="space-y-3">
              <Card>
                <CardContent className="flex items-start gap-4 p-6">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    1
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-foreground">
                      Просмотрите свои результаты
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Ознакомьтесь с подробным анализом ответов в вашем личном кабинете
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-start gap-4 p-6">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-1 font-semibold text-foreground">
                      Запланируйте бесплатную консультацию
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Обсудите результаты с личным координатором бесплатно (30 минут).
                      Консультация доступна в течение {FREE_CONSULTATION_EXPIRY_DAYS} дней после завершения чекапа.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-start gap-4 p-6">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    3
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-foreground">
                      Начните решать проблемы с нашими специалистами
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Получите индивидуальный план работы от нашей команды высококлассных специалистов
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/cabinet")}
              className="flex-1 text-base"
            >
              Вернуться на главную
            </Button>
            <Button
              size="lg"
              onClick={() => navigate("/results-report")}
              className="flex-1 text-base"
            >
              Перейти к результатам
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
