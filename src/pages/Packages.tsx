import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePackagesWithType } from "@/hooks/usePackages";
import { formatAmount } from "@/lib/payment";
import { Loader2, Info } from "lucide-react";
import otterHearts from "@/assets/otter-hearts.png";

export default function Packages() {
  const navigate = useNavigate();
  const { data: packages, isLoading } = usePackagesWithType();

  const handleLearnMore = (packageId: string) => {
    navigate(`/payment?package_id=${packageId}&type=package`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Группируем пакеты по типу консультации
  const packagesByType = packages?.reduce((acc, pkg) => {
    const typeName = pkg.appointment_type.name;
    if (!acc[typeName]) {
      acc[typeName] = [];
    }
    acc[typeName].push(pkg);
    return acc;
  }, {} as Record<string, typeof packages>) || {};

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Пакеты</h1>
          <p className="text-muted-foreground">
            Выберите пакет сессий для более выгодной цены
          </p>
        </div>

        {Object.keys(packagesByType).length > 0 ? (
          <div className="space-y-12">
            {Object.entries(packagesByType).map(([typeName, typePackages]) => (
              <div key={typeName}>
                <h2 className="text-2xl font-semibold text-foreground mb-6">
                  {typeName}
                </h2>
                <div className="grid gap-6 md:grid-cols-3">
                  {typePackages.map((pkg) => (
                    <Card
                      key={pkg.id}
                      className="overflow-hidden border-2 hover:border-primary/50 transition-all"
                    >
                      <div className="p-6">
                        {/* Иконка */}
                        <div className="mb-4 flex justify-center">
                          <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                            <img
                              src={otterHearts}
                              alt={typeName}
                              className="h-20 w-20 object-contain"
                            />
                          </div>
                        </div>

                        {/* Название */}
                        <h3 className="text-xl font-bold text-foreground mb-2 text-center">
                          {pkg.name}
                        </h3>

                        {/* Цена */}
                        <div className="mb-4 text-center">
                          <span className="text-3xl font-bold text-primary">
                            {formatAmount(pkg.price)}
                          </span>
                        </div>

                        {/* Детали */}
                        <div className="mb-6 space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Info className="h-4 w-4" />
                            <span>{pkg.session_count} сессий</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Info className="h-4 w-4" />
                            <span>
                              {pkg.appointment_type.name} ({pkg.appointment_type.duration_minutes} мин)
                            </span>
                          </div>
                          {pkg.description && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {pkg.description}
                            </p>
                          )}
                        </div>

                        {/* Кнопка */}
                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={() => handleLearnMore(pkg.id)}
                        >
                          Узнать больше
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              Нет доступных пакетов. Пожалуйста, обратитесь к администратору.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

