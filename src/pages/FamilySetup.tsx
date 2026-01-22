import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { StepIndicator } from "@/components/StepIndicator";
import { Button } from "@/components/ui/button";
import { SerifHeading } from "@/components/design-system/SerifHeading";
import familySetupImage from "@/assets/minimalistic-and-friendly-vector-style-illustratio.png";

export default function FamilySetup() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <StepIndicator currentStep={3} totalSteps={4} label="ПРОФИЛЬ СЕМЬИ" />
        
        <div className="space-y-12 text-center">
          <img
            src={familySetupImage}
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
      </div>
    </div>
  );
}
