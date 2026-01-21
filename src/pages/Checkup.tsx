import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useCurrentProfile } from "@/contexts/ProfileContext";
import otterSchool from "@/assets/otter-school.png";

export default function Checkup() {
  const navigate = useNavigate();
  const params = useParams<{ profileId?: string }>();
  const { currentProfileId } = useCurrentProfile();
  const profileId = params.profileId || currentProfileId;
  const currentQuestion = 1;
  const totalQuestions = 31;

  const handleNext = () => {
    if (profileId) {
      navigate(`/checkup-questions/${profileId}`);
    } else {
      navigate("/checkup-questions");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="border-b border-border bg-muted/30 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <Progress value={(currentQuestion / totalQuestions) * 100} className="flex-1" />
            <span className="text-sm font-medium text-muted-foreground">
              {currentQuestion} / {totalQuestions}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 py-12">
        <div className="space-y-12">
          <div>
            <img
              src={otterSchool}
              alt="Выдра с рюкзаком"
              className="mx-auto mb-8 h-64 w-64 object-contain"
            />
            
            <h1 className="mb-6 text-3xl font-bold text-foreground">
              Сейчас мы будем задавать вопросы об эмоциях и поведении ребенка.
            </h1>
            
            <div className="space-y-4 text-muted-foreground">
              <p className="text-lg">
                Это могут быть сложные вопросы, но знайте, что вы не одиноки. У многих детей есть
                эмоциональные/поведенческие проблемы. Если мы поймем, в чем заключаются эти проблемы,
                мы сможем помочь поддержать вашего ребенка и вашу семью.
              </p>
              <p className="text-lg">
                <strong>31 вопрос • ~8 минут</strong>
              </p>
            </div>
          </div>

          <Button
            size="lg"
            onClick={handleNext}
            className="h-14 w-full text-base font-medium"
          >
            Далее
          </Button>
        </div>
      </div>
    </div>
  );
}
