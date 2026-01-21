import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Testimonial {
  text: string;
  author: string;
}

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
}

const accentColors = ["sage", "honey", "honey-dark", "lavender", "lilac"];

// Функция для получения случайного цвета на основе индекса (детерминированная)
const getAccentColor = (index: number): string => {
  // Используем простое число для более случайного распределения
  return accentColors[(index * 7 + 13) % accentColors.length];
};

export const TestimonialCarousel: React.FC<TestimonialCarouselProps> = ({ testimonials }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 3;

  const totalPages = Math.ceil(testimonials.length / itemsPerPage);
  const currentTestimonials = testimonials.slice(
    currentIndex * itemsPerPage,
    (currentIndex + 1) * itemsPerPage
  );

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % totalPages);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages);
  };

  return (
    <div className="relative">
      {/* Navigation Arrows */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 rounded-full bg-white shadow-lg hover:bg-cloud"
        onClick={prev}
        aria-label="Предыдущие отзывы"
      >
        <ChevronLeft className="h-6 w-6 text-foreground" />
      </Button>

      <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
        {currentTestimonials.map((testimonial, index) => {
          const globalIndex = currentIndex * itemsPerPage + index;
          const accentColor = getAccentColor(globalIndex);
          
          return (
            <Card
              key={globalIndex}
              className="landing-testimonial-card-new"
            >
              <CardContent className="pt-6">
                <div className={`landing-testimonial-accent-new ${accentColor}`}></div>
                <p className="mb-4 text-base leading-relaxed text-foreground">
                  "{testimonial.text}"
                </p>
                <p className="text-sm text-muted-foreground">{testimonial.author}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 rounded-full bg-white shadow-lg hover:bg-cloud"
        onClick={next}
        aria-label="Следующие отзывы"
      >
        <ChevronRight className="h-6 w-6 text-foreground" />
      </Button>

      {/* Pagination Indicators */}
      <div className="flex justify-center gap-2 mt-8">
        {Array.from({ length: totalPages }).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex
                ? "bg-foreground w-8"
                : "bg-muted-foreground/30"
            }`}
            aria-label={`Перейти к странице ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

