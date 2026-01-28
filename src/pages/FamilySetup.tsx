import { useNavigate } from "react-router-dom";
import { StepIndicator } from "@/components/StepIndicator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SerifHeading } from "@/components/design-system/SerifHeading";
import bgImage from '@/assets/bg.png';

export default function FamilySetup() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Card className="rounded-[20px] border-2 bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
          <StepIndicator currentStep={2} totalSteps={3} label="ПРОФИЛЬ СЕМЬИ" />
          
          <div className="space-y-12 text-center mt-8">
          <img
            src="/family.png"
            alt="Семья"
            className="mx-auto h-80 w-80 object-contain"
          />
          
          <div className="space-y-4">
            <SerifHeading size="2xl">
              Теперь давайте настроим вашу семью
            </SerifHeading>
            <p className="text-lg text-muted-foreground">
              Добавьте членов семьи, чтобы все было в одном месте.
            </p>
          </div>

          <Button
            size="lg"
            onClick={() => navigate("/family-members")}
            className="h-14 w-full text-base font-medium"
          >
            Продолжить
          </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
