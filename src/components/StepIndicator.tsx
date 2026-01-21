interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  label: string;
}

export const StepIndicator = ({ currentStep, totalSteps, label }: StepIndicatorProps) => {
  return (
    <div className="mb-8 text-center">
      <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="mt-4 flex justify-center gap-2">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            className={`h-2 w-16 rounded-full transition-colors ${
              index < currentStep ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
