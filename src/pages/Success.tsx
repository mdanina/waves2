import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Grid } from "lucide-react";

export default function Success() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <div className="space-y-8 text-center">
          <div>
            <h1 className="mb-4 text-4xl font-bold text-foreground">
              Вы в списке!
            </h1>
            <p className="text-lg text-muted-foreground">
              А пока вы можете получить доступ к бесплатным оценкам психического здоровья и
              ресурсам для вашей семьи.
            </p>
          </div>

          <div className="space-y-4">
            <Card className="cursor-pointer transition-shadow hover:shadow-lg">
              <CardContent className="flex items-start gap-4 p-6 text-left">
                <div className="rounded-lg bg-secondary p-3">
                  <FileText className="h-6 w-6 text-secondary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-2 text-xl font-semibold text-foreground">
                    Пройдите семейную проверку психического здоровья
                  </h3>
                  <p className="text-muted-foreground">
                    Созданная доктором Хелен Эггер, проверка предлагает научно обоснованный взгляд
                    на психическое здоровье вашей семьи.
                  </p>
                </div>
                <div className="text-muted-foreground">→</div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer transition-shadow hover:shadow-lg">
              <CardContent className="flex items-start gap-4 p-6 text-left">
                <div className="rounded-lg bg-secondary p-3">
                  <Grid className="h-6 w-6 text-secondary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-2 text-xl font-semibold text-foreground">
                    Центр ресурсов
                  </h3>
                  <p className="text-muted-foreground">
                    Balansity предоставляет ресурсы, чтобы узнать, когда беспокоиться и как
                    поддержать психическое здоровье детей и благополучие семьи.
                  </p>
                </div>
                <div className="text-muted-foreground">→</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
