// import testimonialPhoto from "@/assets/testimonial-photo.jpg"; // File not found

export const TestimonialSection = () => {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-primary p-8 text-primary-foreground">
      <div className="max-w-md">
        <div className="relative mb-8 inline-block">
          <div className="h-80 w-80 rounded-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">Фото</span>
          </div>
        </div>
        
        <blockquote className="space-y-6">
          <p className="text-lg leading-relaxed">
            "Waves изменил жизнь моей семьи. Все, с кем я общалась, были очень
            профессиональными, отзывчивыми и добрыми. Оба моих ребенка смогли получить
            качественную психологическую помощь, не выходя из дома, и у них обоих все
            отлично."
          </p>
          <footer className="text-sm opacity-90">
            -Мама, участница программы Waves
          </footer>
        </blockquote>
      </div>
    </div>
  );
};
