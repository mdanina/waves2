import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LandingHeader } from "@/components/LandingHeader";
import { LandingFooter } from "@/components/LandingFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SerifHeading } from "@/components/ui/serif-heading";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import bgImage from '@/assets/bg.png';
import brainImage from '@/assets/brain.png';
import momImage from '@/assets/mom.png';
import headphonesImage from '@/assets/headphones.png';
import julaImage from '@/assets/jula.png';
import emoImage from '@/assets/emo.png';
import knigiImage from '@/assets/knigi.png';
import ytImage from '@/assets/YT.png';
import vkMusicImage from '@/assets/K.png';
import rutubeImage from '@/assets/RT.png';
import card1Image from '@/assets/card1.png';
import card2Image from '@/assets/card2.png';
import card3Image from '@/assets/card3.png';
import card4Image from '@/assets/card4.png';
import { SectionContainer } from "@/components/landing/SectionContainer";
import "@/components/landing/Landing.css";


export default function Landing() {
  const navigate = useNavigate();

  // Ротация слов в заголовке
  const rotatingWords = [
    { word: "внимание", color: "text-coral" },
    { word: "концентрацию", color: "text-lavender" },
    { word: "эмоции", color: "text-white" },
    { word: "усидчивость", color: "text-coral" },
    { word: "самоконтроль", color: "text-white" },
  ];

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Ротация слов в CTA (все слова чёрным)
  const ctaWords = ["внимательнее", "спокойнее", "увереннее", "собраннее", "самостоятельнее"];
  const [ctaWordIndex, setCtaWordIndex] = useState(0);
  const [isCtaAnimating, setIsCtaAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentWordIndex((prev) => (prev + 1) % rotatingWords.length);
        setIsAnimating(false);
      }, 300); // Половина времени анимации для плавного перехода
    }, 3000); // Меняем слово каждые 3 секунды

    return () => clearInterval(interval);
  }, [rotatingWords.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsCtaAnimating(true);
      setTimeout(() => {
        setCtaWordIndex((prev) => (prev + 1) % ctaWords.length);
        setIsCtaAnimating(false);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, [ctaWords.length]);

  const testimonials = [
    {
      text: "«Сын стал спокойнее уже через 3 недели. Раньше учителя звонили каждый день — теперь хвалят за внимательность. И самое главное — ему нравится! Смотрит мультики и даже не понимает, что это тренировка.»",
      author: "Анна К., мама Миши, 9 лет",
      result: "+52% концентрация за 6 недель"
    },
    {
      text: "«Дочка очень тревожная, плохо засыпала. После программы \"Спокойствие\" стала гораздо увереннее, перестала плакать из-за мелочей. Теперь тренируемся всей семьёй — я тоже стала спокойнее.»",
      author: "Елена М., мама Софии, 7 лет",
      result: "Тревожность снизилась на 60%"
    },
    {
      text: "«Боялась, что сыну будет скучно, но он сам просит включить тренировку! Смотрит свои видео на YouTube, а система работает в фоне. Домашка теперь занимает 30 минут вместо двух часов.»",
      author: "Ольга Д., мама Артёма, 11 лет",
      result: "Время на уроки сократилось в 4 раза"
    },
    {
      text: "Наш психолог была такой доброй и понимающей. Я вижу, как мой ребенок стал увереннее, спокойнее. Это просто чудо, честно говоря.",
      author: "Мама 7-летней дочери, завершившей курс"
    },
    {
      text: "Сыну 8 лет, и я вижу огромный прогресс. Мне очень нравится, что через приложение я всегда могу посмотреть, как идут дела, когда у него сессии, пообщаться с психологом. Очень удобно для работающей мамы.",
      author: "Мама 8-летнего сына, проходящего лечение"
    },
    {
      text: "У меня двое детей — 9 и 6 лет. Не всегда есть возможность возить их на очные консультации, особенно когда работаешь. WavyMind — это спасение. Дети получают помощь дома, а я вижу, как их поддерживают и как они меняются.",
      author: "Мама двоих детей, завершивших курс"
    },
    {
      text: "Мы с WavyMind уже два года. Оба моих ребенка — подростки, 13 и 11 лет — получают здесь помощь. Я вижу, как они стали справляться со своими проблемами, как изменилась атмосфера в семье. Это действительно изменило нашу жизнь к лучшему.",
      author: "Мама 13-летнего и 11-летнего ребенка, проходящих лечение"
    },
    {
      text: "Сын очень тревожный был, проблемы в школе, с одноклассниками. Я не знала, что делать. Сейчас вижу, как он раскрывается, как ему комфортно с психологом. Он сам ждет сессий. Это так успокаивает — знать, что он в надежных руках.",
      author: "Мама 10-летнего сына, проходящего лечение"
    },
    {
      text: "Современные дети сталкиваются с такими проблемами, о которых мы в их возрасте даже не думали. Я рада, что есть специалисты, которые понимают это и помогают нашим детям справляться. Вижу, как дочка учится управлять своими эмоциями.",
      author: "Мама 9-летней дочери, проходящей лечение"
    },
    {
      text: "Кажется, что как мама ты должна все знать и уметь помочь. Но иногда просто не понимаешь, что происходит с ребенком. Психологи WavyMind видят то, что я не замечала, и помогают всей семье.",
      author: "Мама 12-летнего ребенка, проходящего лечение"
    },
    {
      text: "Я очень довольна результатами. Воспитание — это сложно, особенно когда не знаешь, как правильно поступить. Здесь я могу просто написать или позвонить, и мне всегда помогут разобраться в ситуации.",
      author: "Мама 6-летнего ребенка, проходящего лечение"
    },
    {
      text: "WavyMind — это совсем другой подход. Сыну 7 лет, он научился справляться со своей тревогой, и главное — ему нравится. Он даже играет в игры, которые ему дал психолог. Для меня важно, чтобы у ребенка с детства было здоровое отношение к психологической помощи.",
      author: "Мама 7-летнего сына, проходящего лечение"
    },
    {
      text: "Пробовали другие онлайн-сервисы, но здесь совсем другой уровень. Очень удобно, что можно заниматься из дома, в комфортной обстановке. Сын ходил в школьного психолога, но там не всегда было удобно по времени. А здесь все подстраивается под наш график.",
      author: "Мама 11-летнего сына, проходящего лечение"
    }
  ];

  const faqs = [
    {
      question: "С какого возраста можно начинать?",
      answer: "Рекомендуем начинать с 6 лет — в этом возрасте ребёнок уже может следовать инструкциям и сидеть спокойно 16 минут. Некоторые дети готовы раньше, но это индивидуально. Верхней границы нет — нейрофидбек эффективен в любом возрасте, включая взрослых."
    },
    {
      question: "Это безопасно? Есть ли побочные эффекты?",
      answer: "Абсолютно безопасно. Устройство только считывает сигналы мозга — никакого излучения. Это как градусник, только для мозговой активности. За 50+ лет исследований не выявлено побочных эффектов. Метод одобрен медицинским сообществом и используется в клиниках по всему миру."
    },
    {
      question: "Когда появятся первые результаты?",
      answer: "Первые изменения обычно заметны через 2-3 недели регулярных тренировок. Устойчивый результат формируется к 6-8 неделе. Ключ к успеху — регулярность: 4-5 тренировок в неделю по 16 минут. Система отслеживает прогресс и подсказывает, если что-то нужно скорректировать."
    },
    {
      question: "Нужен ли диагноз СДВГ?",
      answer: "Нет, диагноз не требуется. WavyMind помогает любому ребёнку с проблемами концентрации, импульсивностью или тревожностью — независимо от наличия официального диагноза. Нейрофидбек тренирует мозг, как спортзал тренирует тело. Это полезно всем, кто хочет улучшить внимание и саморегуляцию."
    },
    {
      question: "Что если ребёнку будет скучно?",
      answer: "Именно поэтому мы сделали тренировки на любимом контенте! Ребёнок смотрит свои мультики, слушает музыку или YouTube — а тренировка идёт в фоне. Он даже не воспринимает это как «занятие». Многие дети сами просят включить тренировку, потому что это время с любимым контентом."
    },
    {
      question: "Нужно ли калибровать устройство?",
      answer: "Нет! Это одно из главных преимуществ WavyMind. Система автоматически подстраивается под индивидуальные особенности мозговой активности ребёнка. Алгоритм адаптируется в реальном времени."
    },
    {
      question: "Сколько времени занимает тренировка?",
      answer: "Одна сессия — 16 минут. Рекомендуем 4-5 тренировок в неделю. Это меньше, чем один мультик! Можно тренироваться во время того, что ребёнок и так смотрит — так тренировка не отнимает дополнительного времени из распорядка дня."
    }
  ];

  const howItWorksSteps = [
    {
      title: "Получите комплект",
      description: "Устройство BrainBit Flex 4 доставляется в течение 3-5 дней по всей России",
      glow: "from-[#ffe8d6] to-[#ffd9e8]",
    },
    {
      title: "Установите приложение",
      description: "Скачайте WavyMind, войдите в аккаунт и подключите устройство по Bluetooth",
      glow: "from-[#f3d4f8] to-[#d4e4fc]",
    },
    {
      title: "Выберите контент",
      description: "Добавьте любимые мультики, музыку и создайте плейлисты для тренировок",
      glow: "from-[#d4f0fc] to-[#e8f4d9]",
    },
    {
      title: "Начните тренировку",
      description: "16 минут в день, 4-5 раз в неделю. Первые результаты через 2-3 недели",
      glow: "from-[#e8f4d9] to-[#d4f0fc]",
    },
  ] as const;

  return (
    <div 
      className="flex min-h-screen flex-col relative"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <LandingHeader />
      
      <main>
        {/* Hero Section */}
        <section id="hero" className="py-12 md:py-16 min-h-screen flex items-center relative">
          <SectionContainer className="relative">
              <div className="grid gap-8 md:gap-10 md:grid-cols-[1.15fr_0.85fr] items-start px-6 sm:px-8 md:px-10 lg:px-12">
              {/* Left side - Text content */}
              <div>
                <Badge variant="outline" className="mb-6 bg-white text-foreground border-0 uppercase tracking-wide text-sm">
                  Научно доказанный метод
                </Badge>
                <SerifHeading size="4xl" className="mb-6 text-4xl md:text-5xl lg:text-6xl">
                  Тренируйте{" "}
                  <span
                    className={`inline-block transition-all duration-300 ${
                      isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
                    } ${rotatingWords[currentWordIndex].color}`}
                  >
                    {rotatingWords[currentWordIndex].word}
                  </span>{" "}
                  ребёнка дома
                </SerifHeading>
                <p className="mb-8 text-lg font-medium">
                  WavyMind — домашние нейрофидбек-тренировки для детей с проблемами концентрации, гиперактивностью и тревожностью. Результат за 8 недель без таблеток.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row mb-8">
                  <Button
                    size="lg"
                    variant="default"
                    onClick={() => navigate("/service")}
                    className="h-14 px-8"
                  >
                    Выбрать программу
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => {
                      const element = document.getElementById("solution");
                      if (element) {
                        element.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }}
                    className="h-14 px-8"
                  >
                    Как это работает
                  </Button>
                </div>
                <div className="flex gap-8 md:gap-12">
                  <div className="min-w-[100px] md:min-w-[120px]">
                    <div className="text-3xl md:text-4xl font-serif font-semibold mb-1">50+</div>
                    <div className="text-lg font-medium leading-tight">лет исследований</div>
                  </div>
                  <div className="min-w-[100px] md:min-w-[120px]">
                    <div className="text-3xl md:text-4xl font-serif font-semibold mb-1">8</div>
                    <div className="text-lg font-medium leading-tight">недель до результата</div>
                  </div>
                  <div className="min-w-[100px] md:min-w-[120px]">
                    <div className="text-3xl md:text-4xl font-serif font-semibold mb-1">16</div>
                    <div className="text-lg font-medium leading-tight">минут в день</div>
                  </div>
                </div>
              </div>

              {/* Right side - App Mockup */}
              <div className="relative z-10 flex justify-center md:justify-center pt-6 md:pt-10">
                {/* Phone Frame - внешняя рамка смартфона */}
                <motion.div 
                  className="relative mx-auto max-w-[193px] sm:max-w-[209px] md:max-w-[258px] w-full"
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1, 
                    y: [0, -6, 0],
                  }}
                  transition={{
                    opacity: { duration: 0.6 },
                    scale: { duration: 0.6 },
                    y: { 
                      duration: 4,
                      repeat: Infinity,
                      ease: [0.4, 0, 0.6, 1],
                      repeatType: "loop"
                    }
                  }}
                  whileHover={{ 
                    scale: 1.02
                  }}
                >
                  {/* Bezel - темная рамка вокруг экрана */}
                  <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] rounded-[22px] md:rounded-[34px] p-1.5 md:p-2 shadow-[0_20px_50px_rgba(0,0,0,0.15)] hover:shadow-[0_25px_60px_rgba(0,0,0,0.2)] transition-shadow duration-300">
                    {/* Notch - вырез для камеры */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[42px] md:w-[56px] h-[14px] md:h-[17px] bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] rounded-b-[8px] md:rounded-b-[11px] z-10"></div>
                    
                    {/* Screen - экран с контентом */}
                    <div className="relative bg-white rounded-[20px] md:rounded-[28px] overflow-hidden">
                      {/* Status Bar - статус бар */}
                      <div className="relative bg-transparent h-[17px] md:h-[22px] flex items-center justify-between px-3 md:px-4 pt-0.5 md:pt-1.5 z-20">
                        <div className="flex items-center gap-1 md:gap-1">
                          <span className="text-[6px] md:text-[7px] font-semibold text-[#1a1a1a]">9:41</span>
                        </div>
                        <div className="flex items-center gap-1 md:gap-1">
                          <div className="w-[8px] md:w-[11px] h-[4px] md:h-[6px] border border-[#1a1a1a] rounded-sm">
                            <div className="w-[6px] md:w-[7px] h-full bg-[#1a1a1a]"></div>
                          </div>
                          <div className="w-[10px] md:w-[13px] h-[6px] md:h-[7px] border border-[#1a1a1a] rounded-full relative">
                            <div className="absolute top-0 left-0 w-[7px] md:w-[8px] h-full bg-[#1a1a1a] rounded-full"></div>
                          </div>
                        </div>
                      </div>

                      {/* Screen Content */}
                      <div 
                        className="rounded-[20px] md:rounded-[28px] p-2 md:p-3 min-h-[336px] md:min-h-[406px] space-y-2 md:space-y-3 -mt-[17px] md:-mt-[22px] pt-4 md:pt-6"
                        style={{
                          backgroundImage: 'url(/bg.png)',
                          backgroundSize: 'cover',
                          backgroundPosition: 'top center',
                          backgroundRepeat: 'no-repeat',
                        }}
                      >
                        {/* Streak Badge */}
                        <div className="flex items-center justify-center pt-0.5 md:pt-1.5">
                          <div className="inline-flex items-center gap-1 md:gap-1 bg-white text-[#1a1a1a] px-1.5 md:px-2 py-0.5 md:py-1 rounded-full shadow-md">
                            <span className="text-[8px] md:text-[10px]">🔥</span>
                            <span className="text-[6px] md:text-[6px] font-medium uppercase tracking-wider">5 ДНЕЙ ПОДРЯД</span>
                          </div>
                        </div>

                        {/* Заголовок */}
                        <div className="flex justify-center text-center">
                          <h1 className="font-serif font-medium leading-tight tracking-tight text-[#1a1a1a]" style={{ fontFamily: 'var(--font-serif)' }}>
                            <span className="text-base md:text-lg lg:text-xl block">Привет, Миша!</span>
                            <span className="text-xs md:text-sm lg:text-base block mt-0.5 md:mt-1">Хороший день для тренировки</span>
                          </h1>
                        </div>

                        {/* Рекомендуемая тренировка */}
                        <div className="bg-white rounded-[11px] md:rounded-[14px] p-2 md:p-3 shadow-[0_3px_14px_rgba(0,0,0,0.06)]">
                          <h2 className="text-[7px] md:text-[8px] font-semibold text-[#1a1a1a] mb-1 md:mb-1">Рекомендуемая тренировка</h2>
                          <p className="text-[6px] md:text-[7px] text-[#1a1a1a]/70 mb-1.5 md:mb-2 leading-relaxed">Концентрация (Theta/Beta 4-7 / 15-20 Hz)</p>
                          <button className="w-full bg-gradient-to-r from-[#ff8a5b] to-[#ff6b6b] text-white rounded-full py-1 md:py-1.5 px-2 md:px-3 flex items-center justify-center gap-1 md:gap-1 text-[7px] md:text-[8px] font-medium hover:opacity-90 transition-opacity">
                            <span className="text-[7px] md:text-[8px]">▶</span>
                            <span>Начать</span>
                          </button>
                        </div>

                        {/* Карточка типа тренировки */}
                        <div className="relative overflow-hidden rounded-[11px] md:rounded-[14px] shadow-[0_3px_14px_rgba(0,0,0,0.06)]">
                          <div 
                            className="absolute inset-0"
                            style={{
                              backgroundImage: 'url(/card1.png)',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              backgroundRepeat: 'no-repeat',
                            }}
                          ></div>
                          <div className="relative p-2 md:p-3">
                            <div className="flex items-start justify-between mb-1.5 md:mb-2">
                              <span className="inline-block bg-white/80 backdrop-blur-sm text-[#1a1a1a] text-[5px] md:text-[6px] font-medium px-1 md:px-1.5 py-0.5 rounded-full">
                                16 МИН
                              </span>
                            </div>
                            <div className="space-y-0.5 md:space-y-0.5">
                              <h3 className="font-serif text-[8px] md:text-[10px] font-medium text-[#1a1a1a] leading-tight">Концентрация</h3>
                              <p className="text-[6px] md:text-[7px] text-[#1a1a1a]/70 leading-relaxed">Theta/Beta (4-7 / 15-20 Hz)</p>
                            </div>
                          </div>
                        </div>

                        {/* Вторая карточка типа тренировки */}
                        <div className="relative overflow-hidden rounded-[11px] md:rounded-[14px] shadow-[0_3px_14px_rgba(0,0,0,0.06)]">
                          <div 
                            className="absolute inset-0"
                            style={{
                              backgroundImage: 'url(/card2.png)',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              backgroundRepeat: 'no-repeat',
                            }}
                          ></div>
                          <div className="relative p-2 md:p-3">
                            <div className="flex items-start justify-between mb-1.5 md:mb-2">
                              <span className="inline-block bg-white/80 backdrop-blur-sm text-[#1a1a1a] text-[5px] md:text-[6px] font-medium px-1 md:px-1.5 py-0.5 rounded-full">
                                16 МИН
                              </span>
                            </div>
                            <div className="space-y-0.5 md:space-y-0.5">
                              <h3 className="font-serif text-[8px] md:text-[10px] font-medium text-[#1a1a1a] leading-tight">Спокойствие</h3>
                              <p className="text-[6px] md:text-[7px] text-[#1a1a1a]/70 leading-relaxed">Alpha (8-12 Hz)</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Side Buttons - боковые кнопки */}
                    <div className="absolute left-0 top-[56px] md:top-[70px] w-[2.5px] md:w-[3.5px] h-[32px] md:h-[40px] bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] rounded-r-full"></div>
                    <div className="absolute left-0 top-[98px] md:top-[119px] w-[2.5px] md:w-[3.5px] h-[32px] md:h-[40px] bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] rounded-r-full"></div>
                    <div className="absolute right-0 top-[77px] md:top-[95px] w-[2.5px] md:w-[3.5px] h-[24px] md:h-[32px] bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] rounded-l-full"></div>
                  </div>
                </motion.div>
              </div>
              </div>
          </SectionContainer>
        </section>

        {/* Problems Section */}
        <section id="problems" className="py-12 md:py-16">
          <SectionContainer>
              <div className="text-center max-w-3xl mx-auto mb-16">
                <Badge variant="outline" className="mb-4 uppercase tracking-wide bg-white text-foreground border-0 text-sm">Знакомые ситуации?</Badge>
                <SerifHeading size="3xl" className="mb-4">
                  Когда обычные методы не работают
                </SerifHeading>
                <p className="text-lg text-muted-foreground">
                  Вы любите своего ребёнка, но иногда кажется, что ничего не помогает
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2 px-6 sm:px-8 md:px-10 lg:px-12">
                <Card className="glass-elegant border-2 p-8 flex flex-col gap-4 transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:shadow-xl cursor-pointer">
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 min-w-[80px] rounded-2xl bg-gradient-to-br from-[#ffe8d6] to-[#ffd9e8] flex items-center justify-center overflow-hidden flex-shrink-0 transition-transform duration-300 hover:scale-110">
                      <img src={headphonesImage} alt="Наушники" className="w-full h-full object-contain p-2" />
                    </div>
                    <h3 className="text-lg font-bold">«Ты меня слышишь?»</h3>
                  </div>
                  <p className="text-lg text-muted-foreground">
                    Приходится повторять по 10 раз. Ребёнок витает в облаках, не может сосредоточиться на простых задачах.
                  </p>
                </Card>
                <Card className="glass-elegant border-2 p-8 flex flex-col gap-4 transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:shadow-xl cursor-pointer">
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 min-w-[80px] rounded-2xl bg-gradient-to-br from-[#f3d4f8] to-[#d4e4fc] flex items-center justify-center overflow-hidden flex-shrink-0 transition-transform duration-300 hover:scale-110">
                      <img src={julaImage} alt="Ветер" className="w-full h-full object-contain p-2" />
                    </div>
                    <h3 className="text-lg font-bold">Не может усидеть на месте</h3>
                  </div>
                  <p className="text-lg text-muted-foreground">
                    Постоянно вертится, отвлекается. Учителя жалуются, что мешает другим детям на уроках.
                  </p>
                </Card>
                <Card className="glass-elegant border-2 p-8 flex flex-col gap-4 transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:shadow-xl cursor-pointer">
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 min-w-[80px] rounded-2xl bg-gradient-to-br from-[#d4f0fc] to-[#e8f4d9] flex items-center justify-center overflow-hidden flex-shrink-0 transition-transform duration-300 hover:scale-110">
                      <img src={emoImage} alt="Эмоции" className="w-full h-full object-contain p-2" />
                    </div>
                    <h3 className="text-lg font-bold">Эмоции захлёстывают</h3>
                  </div>
                  <p className="text-lg text-muted-foreground">
                    Истерики из-за мелочей, резкие перепады настроения. Не может справиться с разочарованием.
                  </p>
                </Card>
                <Card className="glass-elegant border-2 p-8 flex flex-col gap-4 transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:shadow-xl cursor-pointer">
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 min-w-[80px] rounded-2xl bg-gradient-to-br from-[#ffd9e8] to-[#f3d4f8] flex items-center justify-center overflow-hidden flex-shrink-0 transition-transform duration-300 hover:scale-110">
                      <img src={knigiImage} alt="Книги" className="w-full h-full object-contain p-2" />
                    </div>
                    <h3 className="text-lg font-bold">Домашка — это война</h3>
                  </div>
                  <p className="text-lg text-muted-foreground">
                    Задание на 15 минут растягивается на 2 часа. Постоянные конфликты и слёзы.
                  </p>
                </Card>
              </div>
          </SectionContainer>
        </section>

        {/* Solution Section */}
        <section id="solution" className="py-12 md:py-16">
          <SectionContainer>
              <div className="grid gap-16 md:grid-cols-1 items-center px-6 sm:px-8 md:px-10 lg:px-12">
                <div>
                  <Badge variant="outline" className="mb-4 uppercase tracking-wide bg-white text-foreground border-0 text-sm">Как это работает</Badge>
                  <SerifHeading size="3xl" className="mb-6">
                    Мозг учится сам себя регулировать
                  </SerifHeading>
                  <p className="text-lg text-muted-foreground mb-8">
                    Нейрофидбек работает так: мы считываем мозговую активность и даём ребёнку понятную обратную связь в реальном времени. Это персональный способ тренировать мозг и улучшать саморегуляцию — фокус, спокойствие, контроль эмоций.
                    <br />
                    <br />
                    Ребёнок смотрит видео, слушает музыку или проходит тренировки — и система мягко поощряет нужное состояние. При регулярных занятиях мозг закрепляет новые паттерны — поэтому со временем становится легче удерживать внимание и снижать тревожность.
                  </p>
                  <ul className="space-y-5">
                    <li className="flex gap-4 items-start">
                      <div className="w-7 h-7 min-w-[28px] rounded-full bg-foreground text-white flex items-center justify-center text-sm">
                        ✓
                      </div>
                      <span className="text-lg text-muted-foreground"><strong className="text-foreground">Без таблеток</strong> — никаких побочных эффектов, только тренировка</span>
                    </li>
                    <li className="flex gap-4 items-start">
                      <div className="w-7 h-7 min-w-[28px] rounded-full bg-foreground text-white flex items-center justify-center text-sm">
                        ✓
                      </div>
                      <span className="text-lg text-muted-foreground"><strong className="text-foreground">Без калибровки</strong> — система сама подстраивается под особенности мозга ребёнка</span>
                    </li>
                    <li className="flex gap-4 items-start">
                      <div className="w-7 h-7 min-w-[28px] rounded-full bg-foreground text-white flex items-center justify-center text-sm">
                        ✓
                      </div>
                      <span className="text-lg text-muted-foreground"><strong className="text-foreground">Долгосрочный эффект</strong> — навык остаётся, как езда на велосипеде</span>
                    </li>
                    <li className="flex gap-4 items-start">
                      <div className="w-7 h-7 min-w-[28px] rounded-full bg-foreground text-white flex items-center justify-center text-sm">
                        ✓
                      </div>
                      <span className="text-lg text-muted-foreground"><strong className="text-foreground">Одобрено специалистами</strong> — метод используется более 50 лет</span>
                    </li>
                  </ul>
                </div>
              </div>
          </SectionContainer>
        </section>

        {/* Any Content Section */}
        <section id="any-content" className="py-12 md:py-16 bg-white text-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-white"></div>
          <SectionContainer className="relative z-10">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <Badge variant="outline" className="mb-4 uppercase tracking-wide bg-white text-foreground border-0 text-sm">Главное отличие WavyMind</Badge>
                <SerifHeading size="3xl" className="mb-4 text-foreground">
                  Тренируйтесь на любимом контенте
                </SerifHeading>
                <p className="text-lg text-muted-foreground">
                  Забудьте про скучные «развивающие игры». В WavyMind ребёнок смотрит то, что любит
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-3 px-6 sm:px-8 md:px-10 lg:px-12 mb-12">
                <Card className="glass-elegant border-2 p-8 text-center hover:shadow-lg transition-all">
                  <div className="w-18 h-18 mx-auto mb-5 rounded-2xl flex items-center justify-center">
                    <img src={ytImage} alt="YouTube" className="w-full h-full object-contain p-2" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">YouTube</h3>
                  <p className="text-sm text-muted-foreground">Мультфильмы и видео</p>
                </Card>
                <Card className="glass-elegant border-2 p-8 text-center hover:shadow-lg transition-all">
                  <div className="w-18 h-18 mx-auto mb-5 rounded-2xl flex items-center justify-center">
                    <img src={vkMusicImage} alt="VK Музыка" className="w-full h-full object-contain p-2" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">VK Музыка</h3>
                  <p className="text-sm text-muted-foreground">Музыка и подкасты</p>
                </Card>
                <Card className="glass-elegant border-2 p-8 text-center hover:shadow-lg transition-all">
                  <div className="w-18 h-18 mx-auto mb-5 rounded-2xl flex items-center justify-center">
                    <img src={rutubeImage} alt="RUTUBE" className="w-full h-full object-contain p-2" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">RUTUBE</h3>
                  <p className="text-sm text-muted-foreground">Любимый контент</p>
                </Card>
              </div>
              <div className="max-w-3xl mx-auto text-center px-6 sm:px-8 md:px-10 lg:px-12">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Ребёнок смотрит любимый мультик, <strong className="text-coral">а тренировка идёт</strong>. 
                  Громкость и яркость меняются в зависимости от концентрации. 
                  Сосредоточился — видео играет нормально. Отвлёкся — затемняется. 
                  <strong className="text-coral"> Мозг быстро учится держать фокус.</strong>
                </p>
              </div>
          </SectionContainer>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-12 md:py-16">
          <SectionContainer>
              <div className="text-center max-w-3xl mx-auto mb-16">
                <Badge variant="outline" className="mb-4 uppercase tracking-wide bg-white text-foreground border-0 text-sm">Истории семей</Badge>
                <SerifHeading size="3xl" className="mb-4">
                  Что говорят родители
                </SerifHeading>
              </div>
              <div className="grid gap-8 md:grid-cols-2 px-6 sm:px-8 md:px-10 lg:px-12 max-w-4xl mx-auto">
                {testimonials.slice(0, 3).map((testimonial, index) => (
                  <Card key={index} className="glass-elegant border-2 p-8 transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:shadow-xl cursor-pointer">
                    <p className="text-base text-muted-foreground italic leading-relaxed mb-6">
                      {testimonial.text}
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="w-[50px] h-[50px] rounded-full overflow-hidden flex items-center justify-center transition-transform duration-300 hover:scale-110">
                        <img src={momImage} alt="Родитель" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="text-base font-bold text-foreground">{testimonial.author.split(',')[0]}</div>
                        <div className="text-base text-muted-foreground">{testimonial.author.split(',')[1]?.trim()}</div>
                        {testimonial.result && (
                          <div className="mt-2 inline-flex items-center gap-2 bg-soft-blue/30 px-3 py-1 rounded-full text-xs font-semibold text-foreground">
                            {testimonial.result}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
          </SectionContainer>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-12 md:py-16 bg-white text-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-white"></div>
          <SectionContainer className="relative z-10">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <Badge variant="outline" className="mb-4 uppercase tracking-wide bg-white text-foreground border-0 text-sm">Тарифы</Badge>
                <SerifHeading size="3xl" className="mb-4">
                  Выберите свой план
                </SerifHeading>
                <p className="text-lg text-muted-foreground">
                  Устройство BrainBit Flex 4 входит в каждый тариф. Рассрочка 0% на 24 месяца
                </p>
              </div>
              <div className="grid gap-8 md:grid-cols-2 px-6 sm:px-8 md:px-10 lg:px-12 max-w-5xl mx-auto">
                <Card className="glass-elegant border-2 p-10 flex flex-col">
                  <h3 className="text-2xl font-serif font-semibold mb-2">Базовый</h3>
                  <p className="text-sm text-muted-foreground mb-6">Всё необходимое для начала тренировок</p>
                  <div className="mb-6">
                    <div className="text-4xl font-serif font-semibold mb-1">80 000 ₽</div>
                    <div className="text-sm text-muted-foreground mb-2">единоразово</div>
                    <div className="text-sm text-coral">или 3 333 ₽/мес в рассрочку</div>
                  </div>
                  <ul className="space-y-4 mb-8 flex-1">
                    {['Устройство BrainBit Flex 4', 'Тренировки без ограничений', '4 типа тренировок', 'Приложение для iOS и Android', 'Автоподстройка под мозг', 'Поддержка'].map((feature, i) => (
                      <li key={i} className="flex gap-3 items-start">
                        <div className="w-5 h-5 min-w-[20px] rounded-full bg-soft-blue/30 text-foreground flex items-center justify-center text-xs mt-0.5">
                          ✓
                        </div>
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full" onClick={() => navigate("/login")}>Выбрать</Button>
                </Card>
                <Card className="glass-elegant border-2 p-10 flex flex-col">
                  <h3 className="text-2xl font-serif font-semibold mb-2">Семейный</h3>
                  <p className="text-sm text-muted-foreground mb-6">Для родителя и ребёнка вместе</p>
                  <div className="mb-6">
                    <div className="text-4xl font-serif font-semibold mb-1">120 000 ₽</div>
                    <div className="text-sm text-muted-foreground mb-2">единоразово</div>
                    <div className="text-sm text-coral">или 5 000 ₽/мес в рассрочку</div>
                  </div>
                  <ul className="space-y-4 mb-8 flex-1">
                    {['Всё из тарифа «Базовый»', '2 профиля (ребёнок + взрослый)', 'Программы для взрослых', 'Семейная статистика', 'Совместные цели', 'До 3 устройств на аккаунт'].map((feature, i) => (
                      <li key={i} className="flex gap-3 items-start">
                        <div className="w-5 h-5 min-w-[20px] rounded-full bg-soft-blue/30 text-foreground flex items-center justify-center text-xs mt-0.5">
                          ✓
                        </div>
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full" onClick={() => navigate("/login")}>Выбрать</Button>
                </Card>
              </div>
          </SectionContainer>
        </section>

        {/* UTP Section */}
        <section id="why" className="py-12 md:py-16">
          <SectionContainer>
              <div className="text-center max-w-3xl mx-auto mb-16">
                <Badge variant="outline" className="mb-4 uppercase tracking-wide bg-white text-foreground border-0 text-sm">Почему WavyMind</Badge>
                <SerifHeading size="3xl" className="mb-4">
                  Умная система, которая подстраивается под вас
                </SerifHeading>
              </div>
              <div className="grid gap-8 md:grid-cols-3 px-6 sm:px-8 md:px-10 lg:px-12">
                <Card className="glass-elegant border-2 p-10 text-center relative overflow-hidden transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:shadow-xl cursor-pointer">
                  <h3 className="text-xl font-bold mb-3">Автоматическая настройка</h3>
                  <p className="text-muted-foreground">
                    Не нужно калибровать устройство. Система сама определяет индивидуальные особенности мозговой активности ребёнка и подстраивается под них.
                  </p>
                </Card>
                <Card className="glass-elegant border-2 p-10 text-center relative overflow-hidden transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:shadow-xl cursor-pointer">
                  <h3 className="text-xl font-bold mb-3">Персональные рекомендации</h3>
                  <p className="text-muted-foreground">
                    На основе профиля ребёнка и истории тренировок система даёт рекомендации: какой тип тренировки выбрать, когда лучше заниматься, как улучшить результаты.
                  </p>
                </Card>
                <Card className="glass-elegant border-2 p-10 text-center relative overflow-hidden transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:shadow-xl cursor-pointer">
                  <h3 className="text-xl font-bold mb-3">Для всей семьи</h3>
                  <p className="text-muted-foreground">
                    Один аккаунт — несколько профилей. Родители тоже могут тренироваться: для концентрации на работе, снятия стресса или улучшения сна.
                  </p>
                </Card>
              </div>
          </SectionContainer>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-12 md:py-16 bg-white text-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-white"></div>
          <SectionContainer className="relative z-10">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <Badge variant="outline" className="mb-4 uppercase tracking-wide bg-white text-foreground border-0 text-sm">Простой старт</Badge>
                <SerifHeading size="3xl" className="mb-4">
                  4 шага до первой тренировки
                </SerifHeading>
              </div>
              <div className="px-6 sm:px-8 md:px-10 lg:px-12">
                {/* Timeline with "real spheres" on desktop */}
                <div className="hidden md:block relative mb-8">
                  <div className="absolute left-10 right-10 top-7 h-px bg-black/15" />
                  <div className="relative flex items-center justify-between">
                    {howItWorksSteps.map((step, i) => (
                      <div key={step.title} className="relative">
                        <div className="relative w-12 h-12 rounded-full bg-foreground shadow-sm flex items-center justify-center">
                          <span className="font-serif font-semibold text-lg text-white">{i + 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cards */}
                <div className="grid gap-6 md:grid-cols-4">
                  {howItWorksSteps.map((step, i) => (
                    <Card
                      key={step.title}
                      className="glass-elegant border-2 p-7 text-center transition-all duration-300 hover:shadow-lg hover:border-foreground/30 cursor-pointer"
                    >
                      {/* Mobile sphere */}
                      <div className="md:hidden w-12 h-12 mx-auto mb-5 rounded-full bg-foreground shadow-sm flex items-center justify-center">
                        <span className="font-serif font-semibold text-lg text-white">{i + 1}</span>
                      </div>
                      <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </Card>
                  ))}
                </div>
              </div>
          </SectionContainer>
        </section>

        {/* Training Programs Section */}
        <section id="programs" className="py-12 md:py-16">
          <SectionContainer>
              <div className="text-center max-w-3xl mx-auto mb-16">
                <Badge variant="outline" className="mb-4 uppercase tracking-wide bg-white text-foreground border-0 text-sm">Программы тренировок</Badge>
                <SerifHeading size="3xl" className="mb-4">
                  Выберите цель для ребёнка
                </SerifHeading>
                <p className="text-lg text-muted-foreground">
                  Система подберёт оптимальную программу на основе профиля и целей
                </p>
              </div>
              <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 px-6 sm:px-8 md:px-10 lg:px-12">
                <Card className="glass-elegant border-2 overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:shadow-xl">
                  <div
                    className="h-40 relative bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${card1Image})` }}
                  >
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="text-base font-serif font-semibold text-foreground leading-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.85)]">
                        Концентрация
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 drop-shadow-[0_1px_1px_rgba(255,255,255,0.85)]">
                        Theta/Beta • 16 мин • Глаза открыты
                      </div>
                    </div>
                    <Badge variant="outline" className="absolute top-3 right-3 bg-white/95 text-foreground border-0 uppercase tracking-wide text-xs backdrop-blur-sm shadow-sm">Популярное</Badge>
                  </div>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">
                      Для детей с проблемами внимания, СДВГ. Улучшает способность фокусироваться на задачах.
                    </p>
                  </CardContent>
                </Card>
                <Card className="glass-elegant border-2 overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:shadow-xl">
                  <div
                    className="h-40 relative bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${card2Image})` }}
                  >
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="text-base font-serif font-semibold text-foreground leading-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.85)]">
                        Спокойствие
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 drop-shadow-[0_1px_1px_rgba(255,255,255,0.85)]">
                        Alpha • 16 мин • Глаза закрыты
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">
                      При тревожности и стрессе. Помогает расслабиться и справляться с эмоциями.
                    </p>
                  </CardContent>
                </Card>
                <Card className="glass-elegant border-2 overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:shadow-xl">
                  <div
                    className="h-40 relative bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${card3Image})` }}
                  >
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="text-base font-serif font-semibold text-foreground leading-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.85)]">
                        Фокус
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 drop-shadow-[0_1px_1px_rgba(255,255,255,0.85)]">
                        SMR • 16 мин • Глаза открыты
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">
                      Настрой для учёбы и сложных задач. Снижает импульсивность.
                    </p>
                  </CardContent>
                </Card>
                <Card className="glass-elegant border-2 overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:shadow-xl">
                  <div
                    className="h-40 relative bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${card4Image})` }}
                  >
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="text-base font-serif font-semibold text-foreground leading-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.85)]">
                        Дыхание
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 drop-shadow-[0_1px_1px_rgba(255,255,255,0.85)]">
                        Без устройства • 10 мин
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">
                      Дыхательные упражнения для быстрого успокоения. Доступно пока устройство в пути.
                    </p>
                  </CardContent>
                </Card>
              </div>
          </SectionContainer>
        </section>


        {/* FAQs Section */}
        <section id="faq" className="py-12 md:py-16">
          <SectionContainer>
              <div className="text-center max-w-3xl mx-auto mb-16">
                <Badge variant="outline" className="mb-4 uppercase tracking-wide bg-white text-foreground border-0 text-sm">Вопросы и ответы</Badge>
                <SerifHeading size="3xl" className="mb-4">
                  Частые вопросы
                </SerifHeading>
              </div>
              <div className="mx-auto max-w-3xl px-6 sm:px-8 md:px-10 lg:px-12">
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`} className="border-b border-border/50">
                      <AccordionTrigger className="text-left font-semibold text-lg hover:text-coral py-6">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
          </SectionContainer>
        </section>

        {/* CTA Section */}
        <section id="cta" className="py-12 md:py-16 bg-white text-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-white"></div>
          <SectionContainer className="relative z-10">
              <div className="max-w-3xl mx-auto text-center px-6 sm:px-8 md:px-10 lg:px-12">
                <SerifHeading size="3xl" className="mb-4 text-foreground">
                  Помогите ребёнку стать{" "}
                  <span
                    className={`inline-block transition-all duration-300 ${
                      isCtaAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
                    } text-foreground`}
                  >
                    {ctaWords[ctaWordIndex]}
                  </span>
                </SerifHeading>
                <p className="text-lg text-muted-foreground mb-10">
                  Начните 8-недельную программу тренировок. Первые результаты через 2-3 недели или вернём деньги.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-center mb-6">
                  <Button
                    size="lg"
                    variant="default"
                    onClick={() => {
                      const element = document.getElementById("pricing");
                      if (element) {
                        element.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }}
                    className="h-14 px-8"
                  >
                    Выбрать тариф
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate("/login")}
                    className="h-14 px-8"
                  >
                    Подключиться
                  </Button>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <span>🛡️</span>
                  <span>Гарантия возврата 30 дней</span>
                </div>
              </div>
          </SectionContainer>
        </section>

      </main>

      <LandingFooter />
    </div>
  );
}

