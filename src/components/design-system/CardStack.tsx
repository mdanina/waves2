import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

export type GradientType = 'coral' | 'blue' | 'pink' | 'lavender';

export interface CardItem {
  id: number;
  title: string;
  description?: string;
  image?: string;
  gradient?: GradientType;
  tag?: string; // Краткая команда/тег для карточки
}

export interface CardStackSettings {
  springDuration?: number;
  springBounce?: number;
  xSpringDuration?: number;
  xSpringBounce?: number;
  dragElastic?: number;
  swipeConfidenceThreshold?: number;
  zIndexDelay?: number;
}

interface CardStackProps {
  items: CardItem[];
  settings?: CardStackSettings;
  className?: string;
}

const defaultSettings: CardStackSettings = {
  springDuration: 0.3,
  springBounce: 0.3,
  xSpringDuration: 0.5,
  xSpringBounce: 0.1,
  dragElastic: 0.7,
  swipeConfidenceThreshold: 10000,
  zIndexDelay: 0.05,
};

const createCardVariants = (settings: CardStackSettings, containerWidth: number = 343) => ({
  visible: (i: number) => {
    const baseX = containerWidth * 0.093; // ~32px для 343px
    const xOffsets = [0, baseX, baseX * 1.5, baseX * 1.94]; // [0, 32, 48, 62] пропорционально
    return {
      opacity: 1,
      zIndex: [4, 3, 2, 1][i],
      scale: [1, 0.9, 0.85, 0.8][i],
      y: [0, -12, 0, 12][i],
      rotate: [0, 2, 4, 7][i],
      x: xOffsets[i] || 0,
      perspective: 400,
      transition: {
        zIndex: { delay: settings.zIndexDelay },
        scale: { type: "spring", duration: settings.springDuration, bounce: settings.springBounce },
        y: { type: "spring", duration: settings.springDuration, bounce: settings.springBounce },
        x: { type: "spring", duration: settings.xSpringDuration, bounce: settings.xSpringBounce },
      },
    };
  },
  exit: { opacity: 0, scale: 0.5, y: 50 },
});

const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

const gradientClasses: Record<GradientType, string> = {
  coral: 'bg-gradient-to-br from-[#FFE5D9] via-[#FFD7BA] to-[#FFCBB3]',
  blue: 'bg-gradient-to-br from-[#C9E4F5] via-[#B3D9F0] to-[#A8D4EB]',
  pink: 'bg-gradient-to-br from-[#FFD1DC] via-[#FFC9DF] to-[#FFC2D1]',
  lavender: 'bg-gradient-to-br from-[#E8D5F2] via-[#D9C2E8] to-[#D4C5F0]',
};

const defaultGradients: GradientType[] = ['coral', 'blue', 'pink', 'lavender'];

export const CardStack: React.FC<CardStackProps> = ({ 
  items, 
  settings: userSettings,
  className = ""
}) => {
  const settings = { ...defaultSettings, ...userSettings };
  const [[page, direction], setPage] = useState([0, 0]);
  const [indices, setIndices] = useState([0, 1, 2, 3]);
  const [dragElastic, setDragElastic] = useState(settings.dragElastic);

  useEffect(() => {
    setDragElastic(settings.dragElastic || 0.7);
  }, [settings.dragElastic]);

  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(343);

  useEffect(() => {
    if (containerRef) {
      const updateWidth = () => {
        setContainerWidth(containerRef.offsetWidth || 343);
      };
      updateWidth();
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }
  }, [containerRef]);

  const paginate = () => {
    setIndices((prevIndices) => [
      prevIndices[1],
      prevIndices[2],
      prevIndices[3],
      prevIndices[0],
    ]);
  };

  const cardVariants = createCardVariants(settings, containerWidth);
  const cardWidth = containerWidth * 0.94; // ~323px для 343px (94%)
  const cardHeight = containerWidth * 1.41; // ~484px для 343px (сохраняем пропорции)

  return (
    <div 
      ref={setContainerRef}
      className={`relative w-full max-w-[343px] h-[400px] sm:h-[450px] md:h-[484px] ${className}`}
    >
      <AnimatePresence initial={false}>
        {indices.map((index, i) => (
          <motion.div
            key={items[index % items.length].id}
            custom={i}
            variants={cardVariants}
            initial="exit"
            animate="visible"
            exit="exit"
            drag={true}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={dragElastic}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);
              if (
                swipe < -(settings.swipeConfidenceThreshold || 10000) ||
                swipe > (settings.swipeConfidenceThreshold || 10000)
              ) {
                paginate();
              }
            }}
            className="absolute rounded-[24px] bg-white shadow-[0px_35px_14px_rgba(0,0,0,0.01),0px_20px_12px_rgba(0,0,0,0.05),0px_9px_9px_rgba(0,0,0,0.09),0px_2px_5px_rgba(0,0,0,0.1)] cursor-grab active:cursor-grabbing overflow-hidden"
            style={{
              width: `${cardWidth}px`,
              height: `${cardHeight}px`,
            }}
          >
            {(() => {
              const currentItem = items[index % items.length];
              const gradient = currentItem.gradient || defaultGradients[index % defaultGradients.length];
              
              if (currentItem.image) {
                return (
                  <img 
                    src={currentItem.image} 
                    alt={currentItem.title}
                    className="h-full w-full object-cover rounded-[24px]"
                  />
                );
              }
              
              return (
                <div className={`h-full w-full ${gradientClasses[gradient]} rounded-[24px] flex flex-col justify-between p-4 sm:p-5 md:p-6`}>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center px-2 sm:px-3 md:px-4">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-[#2D2D2D] mb-2 sm:mb-2.5 md:mb-3">{currentItem.title}</h3>
                      {currentItem.description && (
                        <p className="text-[#666666] text-xs sm:text-sm leading-relaxed">{currentItem.description}</p>
                      )}
                    </div>
                  </div>
                  {currentItem.tag && (
                    <div className="mt-2 sm:mt-3 md:mt-4 flex justify-start">
                      <span className="bg-white/80 backdrop-blur-sm text-[#2D2D2D] text-[10px] sm:text-xs font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/50">
                        {currentItem.tag}
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default CardStack;

