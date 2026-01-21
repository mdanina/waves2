import { useNavigate } from "react-router-dom";
import { TestimonialSection } from "@/components/TestimonialSection";
import { Button } from "@/components/ui/button";
// import logo from "@/assets/noroot (2).png";
const logo = "/logo.png"; // Новый логотип из public

export default function ServiceIntro() {
  const navigate = useNavigate();

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <TestimonialSection />
      
      <div className="flex items-center justify-center bg-background p-8">
        <div className="w-full max-w-2xl space-y-12">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Waves" className="h-10 w-auto" />
          </div>

          <div>
            <h1 className="mb-6 font-serif text-5xl font-bold leading-tight text-foreground">
              Получите необходимую помощь, сделав три простых шага
            </h1>
            <p className="text-xl text-muted-foreground">
              Мы вместе с вами на всем пути. Waves здесь, чтобы предоставить вашему ребенку и семье комплексный, персонализированный подход к психическому здоровью, независимо
              от того, на каком этапе вы находитесь.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
                1
              </div>
              <div>
                <h3 className="mb-2 font-serif text-xl font-semibold text-foreground">
                  Создайте учетную запись
                </h3>
                <p className="text-muted-foreground">
                  Расскажите нам о своей семье.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
                2
              </div>
              <div>
                <h3 className="mb-2 font-serif text-xl font-semibold text-foreground">
                  Запланируйте вводный звонок
                </h3>
                <p className="text-muted-foreground">
                  Обсудите потребности вашей семьи с вашим персональным координатором. Бесплатно.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
                3
              </div>
              <div>
                <h3 className="mb-2 font-serif text-xl font-semibold text-foreground">
                  Начните работу со специалистом
                </h3>
                <p className="text-muted-foreground">
                  Получите индивидуальный план решения проблемы и начните работать с нашей командой специалистов.
                </p>
              </div>
            </div>
          </div>

          <Button
            size="lg"
            onClick={() => navigate("/login")}
            className="h-14 w-full text-base font-medium sm:w-auto sm:px-12"
          >
            Начать
          </Button>
        </div>
      </div>
    </div>
  );
}

