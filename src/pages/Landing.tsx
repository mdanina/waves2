import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { LandingHeader } from "@/components/LandingHeader";
import { LandingFooter } from "@/components/LandingFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SerifHeading } from "@/components/ui/serif-heading";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ResultIcon } from "@/components/landing/ResultIcon";
import { ServiceIcon, ServiceIconContainer } from "@/components/landing/ServiceIcons";
import { TestimonialCarousel } from "@/components/landing/TestimonialCarousel";
import {
  Clock,
  CheckCircle2,
  Phone,
  Video,
  FileText
} from "lucide-react";
import "@/components/landing/Landing.css";
import familyImage from "@/assets/illustration-of-a-caucasian-family---father--mothe (2).png";
import familyImageAlt from "@/assets/illustration-of-a-caucasian-family---father--mothe (1).png";
import familySetupImage from "@/assets/family-setup.png";
import motherFatherImage from "@/assets/flat-cartoon-illustration-of-a-mother-and-father-h.png";
import flatMinimalCartoonImage from "@/assets/illustration-in-flat-minimal-cartoon-style-showing.png";
import parentsStandingImage from "@/assets/flat-cartoon-style-illustration-of-parents-standin.png";
import happyCaucasianCoImage from "@/assets/cartoon-style-illustration-of-a-happy-caucasian-co.png";
import youngCaucasianCo2Image from "@/assets/cartoon-style-illustration-of-a-young-caucasian-co (2).png";
import expertImage from "@/assets/nv.jpg";
import otterRelaxed from "@/assets/otter-relaxed.png";
import b7d9b091Image from "@/assets/b7d9b091-406e-44ad-a80c-6349c93ba1e3.png";
import chatgptImage4Dec from "@/assets/ChatGPT Image 4 дек. 2025 г., 15_38_13.png";
import chatgptImage4Dec2 from "@/assets/ChatGPT Image 4 дек. 2025 г., 15_41_26.png";
import youngCaucasianCoImage from "@/assets/cartoon-style-illustration-of-a-young-caucasian-co.png";

// Компонент для элемента условия с эффектом наклона
const TiltableCondition = ({ condition }: { condition: string }) => {
  const [tilt, setTilt] = useState({ y: 0, scale: 1 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const centerY = rect.height / 2;
    const translateY = ((y - centerY) / centerY) * 15;
    setTilt({ y: translateY, scale: 1.13 });
  };

  const handleMouseLeave = () => {
    setTilt({ y: 0, scale: 1 });
  };

  return (
    <div
      ref={cardRef}
      className="landing-condition-tag text-center text-sm font-medium"
      style={{
        transform: `translateY(${tilt.y}px) scale(${tilt.scale})`,
        transition: 'transform 0.2s ease-out, background-color 0.2s ease-out',
        backgroundColor: tilt.scale > 1 ? 'hsl(42, 100%, 75%)' : 'hsl(var(--color-honey))',
      } as React.CSSProperties}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {condition}
    </div>
  );
};

export default function Landing() {
  const navigate = useNavigate();
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string | null>(null);

  const testimonials = [
    {
      text: "Наш психолог была такой доброй и понимающей. Я вижу, как мой ребенок стал увереннее, спокойнее. Это просто чудо, честно говоря.",
      author: "Мама 7-летней дочери, завершившей курс"
    },
    {
      text: "Сыну 8 лет, и я вижу огромный прогресс. Мне очень нравится, что через приложение я всегда могу посмотреть, как идут дела, когда у него сессии, пообщаться с психологом. Очень удобно для работающей мамы.",
      author: "Мама 8-летнего сына, проходящего лечение"
    },
    {
      text: "У меня двое детей — 9 и 6 лет. Не всегда есть возможность возить их на очные консультации, особенно когда работаешь. Waves — это спасение. Дети получают помощь дома, а я вижу, как их поддерживают и как они меняются.",
      author: "Мама двоих детей, завершивших курс"
    },
    {
      text: "Мы с Waves уже два года. Оба моих ребенка — подростки, 13 и 11 лет — получают здесь помощь. Я вижу, как они стали справляться со своими проблемами, как изменилась атмосфера в семье. Это действительно изменило нашу жизнь к лучшему.",
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
      text: "Кажется, что как мама ты должна все знать и уметь помочь. Но иногда просто не понимаешь, что происходит с ребенком. Психологи Waves видят то, что я не замечала, и помогают всей семье.",
      author: "Мама 12-летнего ребенка, проходящего лечение"
    },
    {
      text: "Я очень довольна результатами. Воспитание — это сложно, особенно когда не знаешь, как правильно поступить. Здесь я могу просто написать или позвонить, и мне всегда помогут разобраться в ситуации.",
      author: "Мама 6-летнего ребенка, проходящего лечение"
    },
    {
      text: "Waves — это совсем другой подход. Сыну 7 лет, он научился справляться со своей тревогой, и главное — ему нравится. Он даже играет в игры, которые ему дал психолог. Для меня важно, чтобы у ребенка с детства было здоровое отношение к психологической помощи.",
      author: "Мама 7-летнего сына, проходящего лечение"
    },
    {
      text: "Пробовали другие онлайн-сервисы, но здесь совсем другой уровень. Очень удобно, что можно заниматься из дома, в комфортной обстановке. Сын ходил в школьного психолога, но там не всегда было удобно по времени. А здесь все подстраивается под наш график.",
      author: "Мама 11-летнего сына, проходящего лечение"
    }
  ];

  const ageGroups = [
    { 
      age: "0-2", 
      title: "Дети 0-2", 
      description: "Почувствуйте уверенность в уходе за вашим малышом.",
      image: youngCaucasianCoImage
    },
    { 
      age: "3-7", 
      title: "Дети 3-7", 
      description: "Дайте вашим детям то, что им нужно для процветания.",
      image: motherFatherImage
    },
    { 
      age: "8-12", 
      title: "Дети 8-12", 
      description: "Помогите вашим детям жить самыми счастливыми и здоровыми жизнями.",
      image: flatMinimalCartoonImage
    },
    { 
      age: "13-18", 
      title: "Подростки", 
      description: "Поддержите благополучие вашего подростка. Независимо от того, с чем он сталкивается.",
      image: parentsStandingImage
    },
    { 
      age: "Родители", 
      title: "Родители", 
      description: "Поддержка вашего благополучия, не только как родителя и партнера, но и как человека.",
      image: happyCaucasianCoImage
    },
    {
      age: "Планирование, ожидание и послеродовой период",
      title: "Планирование, ожидание и послеродовой период",
      description: "Помогаем вам вырастить здоровую семью.",
      image: youngCaucasianCo2Image
    },
  ];

  // Детализация помощи для каждой возрастной группы
  const ageGroupDetails: Record<string, { subtitle: string; intro: string; challenges: { title: string; description: string }[] }> = {
    "0-2": {
      subtitle: "Почувствуйте уверенность в уходе за вашим малышом",
      intro: "Поддержите благополучие вашего ребенка еще до того, как он научится говорить. Мы можем помочь.",
      challenges: [
        { title: "Питание и кормление", description: "Помогаем вам растить здоровых и счастливых едоков." },
        { title: "Трудности с успокоением", description: "Учим вас ухаживать за младенцами и малышами, которых сложно успокоить." },
        { title: "Ко-регуляция", description: "Обучаем вас поддерживать эмоциональную регуляцию между вами и вашим малышом." },
        { title: "Сон и режим дня", description: "Помогаем вашей семье выработать здоровые привычки сна, чтобы все высыпались." },
        { title: "Укрепление отношений", description: "Поддерживаем развитие здоровых семейных отношений, чтобы ваши дети чувствовали себя в безопасности." },
        { title: "Игра", description: "Учим вас строить отношения и развивать здоровое исследование через творческую игру." },
        { title: "Выражение эмоций", description: "Направляем ваших детей в определении, выражении и управлении чувствами." },
        { title: "Работа с травмой", description: "Помогаем вашему ребенку и семье пережить трудный опыт." }
      ]
    },
    "3-7": {
      subtitle: "Дайте вашим детям то, что им нужно для процветания",
      intro: "Даже маленькие дети сталкиваются с трудными эмоциями и отношениями. Мы можем помочь.",
      challenges: [
        { title: "Сон и режим дня", description: "Помощь в управлении истериками перед сном, трудностями с засыпанием и ночными кошмарами." },
        { title: "Поведенческие вопросы", description: "Учим вас распознавать и управлять как типичным, так и сложным поведением." },
        { title: "Гиперактивность и внимание", description: "Помогаем справляться с трудностями воспитания маленьких детей и особенностями внимания." },
        { title: "Тревога и страхи", description: "Поддержка при тревоге разлуки, социальной тревоге, беспокойстве и страхах." },
        { title: "Грусть", description: "Помогаем вам распознать обычную и более глубокую грусть, и как помочь ребенку почувствовать себя лучше." },
        { title: "Управление большими чувствами", description: "Учим вашего ребенка определять, выражать и управлять сильными эмоциями здоровым способом." }
      ]
    },
    "8-12": {
      subtitle: "Помогите вашим детям жить самыми счастливыми и здоровыми жизнями",
      intro: "Ваш ребенок испытывает трудности в школе или дома? Мы здесь, чтобы помочь.",
      challenges: [
        { title: "Дружба", description: "Помогаем вашему ребенку развить социальные навыки для поиска и поддержания друзей." },
        { title: "Поведенческие вопросы", description: "Работаем с вами и вашим ребенком над развитием навыков понимания и управления сложным поведением." },
        { title: "Внимание и концентрация", description: "Ранняя поддержка при особенностях внимания для помощи в школе, дома и с друзьями." },
        { title: "Тревога и страхи", description: "Поддержка при беспокойстве, страхах, социальной тревоге, тревоге разлуки и навязчивых мыслях." },
        { title: "Грусть", description: "Поддержка при детской грусти и сложных эмоциях." },
        { title: "Регуляция сильных эмоций", description: "Направляем вашего ребенка в определении, выражении и управлении большими чувствами здоровым способом." },
        { title: "Отказ от школы", description: "Работаем с вами, вашим ребенком и школой для поддержки успешного возвращения к учебе." },
        { title: "Работа с травмой", description: "Помогаем вашему ребенку и семье пережить трудный опыт." },
        { title: "Питание", description: "Поддержка при вопросах питания и образа тела." },
        { title: "Гендерная идентичность", description: "Поддержка и принятие гендерной идентичности вашего ребенка." },
        { title: "Буллинг", description: "Поддержка детей, столкнувшихся с травлей." }
      ]
    },
    "13-18": {
      subtitle: "Поддержите благополучие вашего подростка",
      intro: "Подростки часто сталкиваются с трудностями, преодолевая жизненные вызовы. Мы можем помочь.",
      challenges: [
        { title: "Грусть", description: "Помогаем распознать, когда это больше, чем обычная грусть, и получить необходимую поддержку." },
        { title: "Тревожность", description: "Поддержка при различных формах тревоги, включая общую, социальную тревогу, страхи и навязчивые мысли." },
        { title: "Рискованное поведение", description: "Помогаем выявить и управлять поведением, опасным для здоровья и безопасности подростка." },
        { title: "Особенности внимания", description: "Поддержка при особенностях внимания. Обучение социальным и организационным навыкам." },
        { title: "Управление стрессом", description: "Учим вас и вашего подростка справляться со стрессом." },
        { title: "Давление сверстников и буллинг", description: "Направляем подростка в преодолении социальных вызовов и развитии здоровых отношений." },
        { title: "Интернет и соцсети", description: "Помогаем вашей семье выработать здоровые отношения с интернетом и социальными сетями." },
        { title: "Сложные переживания", description: "Поддержка подростков, переживающих сложные эмоциональные состояния." },
        { title: "Работа с травмой", description: "Помогаем вашему ребенку и семье пережить трудный опыт." }
      ]
    },
    "Родители": {
      subtitle: "Поддержка вашего благополучия — как родителя, партнера и человека",
      intro: "Баланс между жизнью, работой, воспитанием и отношениями — непростая задача. Мы здесь для вас.",
      challenges: [
        { title: "Грусть", description: "Поддержка при грусти и других вопросах настроения." },
        { title: "Тревожность", description: "Поддержка при различных формах тревоги." },
        { title: "Особенности внимания у взрослых", description: "Поддержка при особенностях внимания у взрослых." },
        { title: "Сложные переживания", description: "Поддержка при сложных переживаниях, связанных со стрессом и трудными ситуациями." },
        { title: "Конфликты в отношениях", description: "Улучшение качества ваших отношений через семейную поддержку." },
        { title: "Семейные отношения", description: "Улучшение коммуникации и сотрудничества между всеми членами семьи." },
        { title: "Совместное воспитание", description: "Поддержка со-родителей в достижении согласия друг с другом." },
        { title: "Баланс работы и жизни", description: "Помогаем установить здоровые границы и личные ожидания для успеха во всех ролях." }
      ]
    },
    "Планирование, ожидание и послеродовой период": {
      subtitle: "Помогаем вам вырастить здоровую семью",
      intro: "Расширение семьи — это одновременно волнительно и страшно. Мы поможем справиться со всеми большими переменами.",
      challenges: [
        { title: "Лечение бесплодия", description: "Поддержка на вашем пути к зачатию." },
        { title: "Первый раз родители", description: "Направляем вас в этом волнительном и иногда стрессовом переходе." },
        { title: "Пренатальное и послеродовое здоровье", description: "Поддержка при грусти, тревоге и других вопросах от зачатия до первых лет жизни ребенка." },
        { title: "Проблемы партнера", description: "Поддержка благополучия пап и других партнеров." },
        { title: "Потеря беременности", description: "Поддержка в переживании утраты." },
        { title: "Усыновление", description: "Помогаем вашей семье пройти через радости и трудности усыновления ребенка." },
        { title: "Суррогатное материнство", description: "Поддержка вашей семьи на пути суррогатного материнства." }
      ]
    }
  };

  const conditions = [
    "Грусть", "Тревога", "Сложные переживания", "Особенности внимания", "Эмоциональные трудности",
    "Поведенческие вопросы", "Навязчивые мысли", "Перинатальное и послеродовое благополучие",
    "Супружеские конфликты", "Семейные отношения", "Сенсорная чувствительность",
    "Вопросы совместного воспитания", "Конфликты между братьями и сестрами",
    "Вопросы в отношениях", "Отношения родитель-ребенок", "Вопросы воспитания",
    "Коммуникация", "Идентичность", "Буллинг", "Управление стрессом"
  ];

  const services = [
    {
      iconType: "therapy" as const,
      title: "Детский психолог",
      description: "Индивидуальная поддержка для детей и подростков. Помощь с эмоциональными трудностями, поведенческими вопросами, тревогой, грустью и другими вызовами. Специалисты используют проверенные методы, адаптированные под возраст и потребности ребенка."
    },
    {
      iconType: "psychiatry" as const,
      title: "Психиатр",
      description: "Консультации и поддержка для детей и родителей. Специалисты, работающие как с детьми, так и со взрослыми, проводят комплексную оценку и при необходимости разрабатывают индивидуальный план поддержки."
    },
    {
      iconType: "neuropsychology" as const,
      title: "Нейропсихолог",
      description: "Оценка и развитие когнитивных способностей у детей. Работа с вниманием, памятью, мышлением, речью и другими важными функциями. Разработка индивидуальных программ развития и поддержки после сложных ситуаций."
    },
    {
      iconType: "neurology" as const,
      title: "Невролог",
      description: "Консультации детского невролога для оценки и поддержки. Работа с головными болями, вопросами сна, тиками, особенностями речевого и моторного развития, последствиями сложных ситуаций и другими вопросами."
    },
    {
      iconType: "family" as const,
      title: "Семейный психолог",
      description: "Семейная поддержка для улучшения отношений внутри семьи. Работа с конфликтами между родителями и детьми, вопросами в отношениях партнеров, вопросами совместного воспитания. Помощь в создании здоровой семейной атмосферы и налаживании общения."
    },
    {
      iconType: "speech" as const,
      title: "Логопед",
      description: "Развитие речи и коммуникации у детей. Работа с особенностями речевого развития, звукопроизношением, заиканием, вопросами чтения и письма. Развитие артикуляции, слухового восприятия и коммуникативных навыков."
    }
  ];

  const benefits = [
    {
      icon: Clock,
      title: "Быстрый старт",
      description: "Начните оценку благополучия вашей семьи прямо сейчас. Запишитесь на встречу в течение 24 часов. Никогда не в очереди."
    },
    {
      icon: CheckCircle2,
      title: "Команда специалистов",
      description: "Опытные специалисты под руководством всемирно известных экспертов в области детского и семейного благополучия. Все специалисты являются сотрудниками Waves."
    },
    {
      icon: Video,
      title: "Виртуальная модель",
      description: "Видео и телефонные звонки отовсюду. Лучшие специалисты для потребностей вашей семьи, по расписанию вашей семьи."
    },
    {
      icon: FileText,
      title: "Прозрачность",
      description: "Отчеты на основе результатов и прогресс, который вы можете видеть. Доступ к заметкам специалистов и результатам оценки в приложении Waves."
    },
    {
      icon: CheckCircle2,
      title: "Персонализированный подход",
      description: "Проверенные методы поддержки для всей семьи, адаптированные к уникальным потребностям каждой семьи."
    },
    {
      icon: Phone,
      title: "Здесь для вас 24/7",
      description: "Служба поддержки клиентов, когда она вам нужна. Отправляйте сообщения своему специалисту в любое время. Ресурсы под рукой."
    }
  ];

  const faqs = [
    {
      question: "Какие вопросы/вызовы вы решаете?",
      answer: "Наши специалисты имеют опыт работы с широким спектром вопросов. Неполный список тем, с которыми мы можем помочь: тревога, грусть, сложные переживания, вопросы питания, особенности внимания, поведенческие вопросы, навязчивые мысли, горе/потеря. Однако в настоящее время мы не проводим оценку расстройств аутистического спектра."
    },
    {
      question: "Сколько стоят услуги?",
      answer: "Первичная встреча: Бесплатно (30 минут)\n\nКонсультации специалистов: 5000₽ (45 минут)\n• Детский психолог\n• Нейропсихолог\n• Психиатр\n• Невролог\n• Семейный психолог\n• Логопед\n\n*Доступны скидки при покупке пакетов, варианты будут обсуждаться с вашим координатором"
    },
    {
      question: "Вы работаете только онлайн?",
      answer: "Основной формат нашей работы — онлайн-консультации, что позволяет получить помощь из любой точки. При этом у нас есть партнёры, которые принимают очно. Если вам или вашему ребёнку потребуется личная встреча со специалистом, мы подберём подходящего партнёра и поможем организовать приём."
    },
    {
      question: "Как записаться на прием?",
      answer: "Если вы хотите пообщаться с профильным специалистом и начать работу, пожалуйста, запишитесь на бесплатную вводную сессию через ваш аккаунт Waves. Бесплатная сессия открывается после прохождения чекапа."
    }
  ];

  return (
    <div 
      className="flex min-h-screen flex-col"
      style={{
        background: '#fffef7',
        backgroundAttachment: 'fixed'
      }}
    >
      <LandingHeader />
      
      <main>
        {/* Hero Section */}
        <section id="hero" className="landing-hero-new py-12 md:py-16" style={{ background: '#fffef7' }}>
          <div className="px-4 md:grid md:grid-cols-[1fr_minmax(0,1280px)_1fr] relative z-10">
            <div className="max-w-7xl mx-auto md:col-start-2">
              <div className="grid gap-12 md:grid-cols-2 items-center">
              {/* Left side - Text content */}
              <div className="pl-12 md:pl-20 lg:pl-28 pr-8 md:pr-16 lg:pr-24">
                <SerifHeading size="4xl" className="mb-6 text-4xl md:text-5xl lg:text-6xl">
                  Психологическое благополучие для{" "}
                  <span className="text-4xl md:text-5xl lg:text-6xl text-honey">детей и всей семьи</span>
                </SerifHeading>
                <p className="mb-8 text-lg text-muted-foreground md:text-xl">
                  Семьи чувствуют себя лучше, когда работают вместе — так же должна работать и их поддержка.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Button
                    size="lg"
                    variant="default"
                    onClick={() => navigate("/service")}
                    className="h-14 px-8 bg-[#1a1a1a] text-white hover:bg-[#2a2a2a] shadow-[0_2px_10px_rgba(0,0,0,0.08)]"
                  >
                    Получить поддержку
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate("/service")}
                    className="h-14 px-8 bg-transparent border-2 border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white"
                  >
                    Пройти оценку
                  </Button>
                </div>
              </div>

              {/* Right side - Image */}
              <div className="relative">
                {/* Animated Blob Background */}
                <div className="landing-hero-blob">
                  <svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="blob-gradient-hero" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="hsl(42, 100%, 71%)" stopOpacity="1" />
                        <stop offset="50%" stopColor="hsl(42, 100%, 80%)" stopOpacity="0.95" />
                        <stop offset="100%" stopColor="hsl(42, 75%, 63%)" stopOpacity="0.9" />
                      </linearGradient>
                    </defs>
                    <path id="blob-path-hero" fill="url(#blob-gradient-hero)">
                      <animate
                        attributeName="d"
                        dur="20s"
                        repeatCount="indefinite"
                        values="M300,200 Q350,180 400,200 Q450,220 480,270 Q510,320 490,370 Q470,420 420,450 Q370,480 300,470 Q230,460 180,420 Q130,380 120,330 Q110,280 150,240 Q190,200 250,190 Q310,180 300,200 Z;
                             M310,190 Q360,170 410,200 Q460,230 490,280 Q520,330 500,380 Q480,430 430,460 Q380,490 300,480 Q220,470 170,430 Q120,390 110,340 Q100,290 140,250 Q180,210 240,200 Q300,190 310,190 Z;
                             M290,210 Q340,190 390,210 Q440,230 470,280 Q500,330 480,380 Q460,430 410,460 Q360,490 300,480 Q240,470 190,430 Q140,390 130,340 Q120,290 160,250 Q200,210 260,200 Q320,190 290,210 Z;
                             M300,200 Q350,180 400,200 Q450,220 480,270 Q510,320 490,370 Q470,420 420,450 Q370,480 300,470 Q230,460 180,420 Q130,380 120,330 Q110,280 150,240 Q190,200 250,190 Q310,180 300,200 Z"
                      />
                    </path>
                  </svg>
                </div>
                <div className="landing-hero-image-wrapper">
                  <img 
                    src={familyImage} 
                    alt="Семья" 
                    className="landing-hero-image"
                  />
                </div>
              </div>
              </div>
            </div>
          </div>
        </section>

        {/* Who We Serve Section */}
        <section id="families" className="bg-muted py-12 landing-who-we-serve relative overflow-hidden">
          {/* Decorative wave shape */}
          <svg className="landing-wave-bottom" viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden="true">
            <path d="M -200 200 L 1400 200 L 1200 0 Q 1000 150 800 100 Q 600 150 400 100 Q 200 150 0 100 L 0 0 Z" fill="hsl(var(--muted))" opacity="0.95"/>
          </svg>
          <div className="px-4 md:grid md:grid-cols-[1fr_minmax(0,1280px)_1fr] relative z-10">
            <div className="max-w-7xl mx-auto md:col-start-2">
            <div className="mb-12 text-left pl-8 md:pl-16 lg:pl-24">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground">
                КОМУ МЫ ПОМОГАЕМ
              </h2>
              <h3 className="mb-4 text-4xl font-bold leading-tight text-foreground md:text-5xl">
                Для каждой семьи — и каждого члена семьи
              </h3>
              <p className="text-base md:text-lg text-muted-foreground">
                Комплексная поддержка для всей семьи, адаптированная к вашим потребностям.
              </p>
            </div>
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-8 md:px-16 lg:px-24">
              {ageGroups.map((group) => (
                <Card
                  key={group.age}
                  className="hover:shadow-lg transition-shadow flex flex-col items-center p-4 sm:p-6 md:p-8 cursor-pointer"
                  onClick={() => setSelectedAgeGroup(group.age)}
                >
                  <img
                    src={group.image}
                    alt={group.title}
                    className="landing-age-group-image flex-shrink-0 mb-4"
                  />
                  <div className="flex-1 w-full text-center">
                    <CardTitle className="text-lg md:text-xl mb-3">{group.title}</CardTitle>
                    <CardDescription className="mb-4 text-sm md:text-base">{group.description}</CardDescription>
                  </div>
                </Card>
              ))}
            </div>
            </div>
          </div>
        </section>

        {/* What We Treat Section */}
        <section id="conditions" className="py-12 bg-background">
          <div className="px-4 md:grid md:grid-cols-[1fr_minmax(0,1280px)_1fr]">
            <div className="max-w-7xl mx-auto md:col-start-2">
            <div className="mb-12 text-center">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-foreground">
                С ЧЕМ МЫ РАБОТАЕМ
              </h2>
              <h3 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
                Персонализированная поддержка для вас и ваших детей
              </h3>
            </div>
            <div className="landing-conditions-grid-staggered px-8 md:px-16 lg:px-24">
              {conditions.map((condition) => (
                <TiltableCondition key={condition} condition={condition} />
              ))}
            </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-12 landing-testimonials-section relative overflow-hidden bg-golden-hour">
          <div className="px-4 md:grid md:grid-cols-[1fr_minmax(0,1280px)_1fr] relative z-10">
            <div className="max-w-7xl mx-auto md:col-start-2">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
                Нам доверяют более 2 000 семей
              </h2>
            </div>
            <TestimonialCarousel testimonials={testimonials} />
            </div>
          </div>
        </section>

        {/* Results Section */}
        <section id="results" className="py-12 bg-background">
          <div className="px-4 md:grid md:grid-cols-[1fr_minmax(0,1280px)_1fr]">
            <div className="max-w-7xl mx-auto md:col-start-2">
            <div className="mb-12 text-left max-w-4xl pl-8 md:pl-16 lg:pl-24">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-foreground">
                НАШИ РЕЗУЛЬТАТЫ
              </h2>
              <h3 className="mb-4 text-4xl font-bold leading-tight text-foreground md:text-5xl">
                Измеримые результаты, которые чувствует вся ваша семья
              </h3>
              <p className="text-base md:text-lg text-muted-foreground">
                После 12 сессий семьи чувствуют разницу.
              </p>
            </div>
            <div className="grid gap-4 md:gap-6 grid-cols-3 pl-8 md:pl-16 lg:pl-24">
              <Card className="hover:shadow-lg transition-all bg-background/80 backdrop-blur-md border-border/50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="mb-6 flex justify-center">
                      <div className="flex h-24 w-24 sm:h-32 sm:w-32 md:h-40 md:w-40 items-center justify-center rounded-full bg-honey honey-glow">
                        <ResultIcon type="pie" />
                      </div>
                    </div>
                    <div className="mb-4 text-4xl sm:text-5xl font-bold text-foreground">80%</div>
                    <p className="text-sm md:text-base text-muted-foreground">
                      80% детей показывают заметное улучшение за 12 сессий
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-all bg-background/80 backdrop-blur-md border-border/50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="mb-6 flex justify-center">
                      <div className="flex h-24 w-24 sm:h-32 sm:w-32 md:h-40 md:w-40 items-center justify-center rounded-full bg-honey honey-glow">
                        <ResultIcon type="grid" />
                      </div>
                    </div>
                    <div className="mb-4 text-4xl sm:text-5xl font-bold text-foreground">3 из 4</div>
                    <p className="text-sm md:text-base text-muted-foreground">
                      3 из 4 родителей отмечают значительное снижение тревоги и улучшение настроения
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-all bg-background/80 backdrop-blur-md border-border/50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="mb-6 flex justify-center">
                      <div className="flex h-24 w-24 sm:h-32 sm:w-32 md:h-40 md:w-40 items-center justify-center rounded-full bg-honey honey-glow">
                        <ResultIcon type="bar" />
                      </div>
                    </div>
                    <div className="mb-4 text-4xl sm:text-5xl font-bold text-foreground">61%</div>
                    <p className="text-sm md:text-base text-muted-foreground">
                      61% семей сообщают о значительном снижении стресса
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="bg-muted py-12">
          <div className="px-4 md:grid md:grid-cols-[1fr_minmax(0,1280px)_1fr]">
            <div className="max-w-7xl mx-auto md:col-start-2">
            <div className="mb-12 text-center px-8 md:px-16 lg:px-24">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground">
                КАК ЭТО РАБОТАЕТ
              </h2>
              <h3 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
                Чего ожидать, когда вы начинаете работу с Waves
              </h3>
              <p className="mb-8 text-base md:text-lg text-muted-foreground">
                Получите доступ к помощи высочайшего качества, немедленно.
              </p>
            </div>
            <div className="mx-auto max-w-6xl pl-8 md:pl-16 lg:pl-24">
              <div className="grid gap-12 md:grid-cols-2 items-center">
                {/* Left side - Steps */}
                <div>
                  <div className="space-y-8">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-full bg-honey honey-glow text-xl font-bold text-ink">
                        1
                      </div>
                      <div>
                        <h3 className="mb-2 text-lg md:text-xl font-semibold">Расскажите нам, что происходит</h3>
                        <p className="text-sm md:text-base text-muted-foreground">
                          Помогите нам понять ваши потребности, ответив на вопросы о вашей семье.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-full bg-honey honey-glow text-xl font-bold text-ink">
                        2
                      </div>
                      <div>
                        <h3 className="mb-2 text-lg md:text-xl font-semibold">Начните работу с нами без промедлений</h3>
                        <p className="text-sm md:text-base text-muted-foreground">
                          Запишитесь на 30-минутный вводный звонок в течение 24 часов после запроса. Получите подбор лучших специалистов для поддержки вашей семьи.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-full bg-honey honey-glow text-xl font-bold text-ink">
                        3
                      </div>
                      <div>
                        <h3 className="mb-2 text-lg md:text-xl font-semibold">Отслеживайте прогресс</h3>
                        <p className="text-sm md:text-base text-muted-foreground">
                          Персонализированные планы, результаты оценки, отчеты о прогрессе и заметки специалистов. Все в личном кабинете Waves.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right side - Image */}
                <div className="relative">
                  <div className="landing-how-it-works-image relative">
                    <img 
                      src={familyImageAlt} 
                      alt="Семья" 
                      className="max-w-[66.67%] sm:max-w-[66.67%] md:max-w-full h-auto rounded-lg object-contain mx-auto"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-12 text-center px-8 md:px-16 lg:px-24">
                <Button size="lg" variant="default" onClick={() => navigate("/service")} className="h-14 px-8">
                  Получить поддержку
                </Button>
              </div>
            </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-12">
          <div className="px-4 md:grid md:grid-cols-[1fr_minmax(0,1280px)_1fr]">
            <div className="max-w-7xl mx-auto md:col-start-2">
            <div className="mb-12 text-left pl-8 md:pl-16 lg:pl-24">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground">
                НАШИ УСЛУГИ
              </h2>
              <h3 className="mb-4 text-4xl font-bold leading-tight text-foreground md:text-5xl">
                Комплексная поддержка, которая работает
              </h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 px-8 md:px-16 lg:px-24">
              {services.map((service) => (
                <Card key={service.title} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="mb-4">
                      <ServiceIconContainer>
                        <ServiceIcon type={service.iconType} />
                      </ServiceIconContainer>
                    </div>
                    <CardTitle className="text-base md:text-lg">
                      {service.title}
                      {(service.title === "Психиатр" || service.title === "Невролог") && (
                        <sup className="text-xs text-muted-foreground ml-1">*</sup>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-xs md:text-sm">{service.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-8 px-8 md:px-16 lg:px-24">
              <p className="text-xs text-muted-foreground">
                <sup className="text-xs">*</sup> Психиатр и Невролог не являются сотрудниками платформы, консультируют в лицензированных клиниках по направлению.
              </p>
            </div>
            </div>
          </div>
        </section>

        {/* Why Waves Section */}
        <section id="why" className="bg-muted pt-12 pb-16 md:pb-24 lg:pb-32">
          <div className="px-4 md:grid md:grid-cols-[1fr_minmax(0,1280px)_1fr]">
            <div className="max-w-7xl mx-auto md:col-start-2">
            <div className="mb-12 text-left max-w-6xl pl-8 md:pl-16 lg:pl-24">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground">
                ПОЧЕМУ WAVES
              </h2>
              <h3 className="mb-4 text-4xl font-bold leading-tight text-foreground md:text-5xl">
                Что делает Waves особенным
              </h3>
            </div>
            <div className="max-w-6xl pl-8 md:pl-16 lg:pl-24 pr-8 md:pr-16 lg:pr-24">
              <Accordion type="single" collapsible className="w-full">
                {benefits.map((benefit, index) => {
                  const IconComponent = benefit.icon;
                  return (
                    <AccordionItem key={benefit.title} value={`benefit-${index}`} className="border-border/50">
                      <AccordionTrigger className="hover:no-underline py-6">
                        <div className="flex items-center gap-4 w-full">
                          <div className="flex-shrink-0">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-honey honey-glow">
                              <IconComponent className="h-6 w-6 text-ink" />
                            </div>
                          </div>
                          <h4 className="text-left text-xl md:text-2xl font-semibold text-foreground leading-tight flex-1">
                            {benefit.title}
                          </h4>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-6">
                        <div className="pl-16">
                          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                            {benefit.description}
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
            </div>
          </div>
          
        </section>

        {/* Expertise Section */}
        <section id="about" className="relative py-0 overflow-hidden">
          
          {/* Dark blue content section */}
          <div className="landing-expertise-section">
            <div className="px-4 md:grid md:grid-cols-[1fr_minmax(0,1280px)_1fr]">
              <div className="max-w-7xl mx-auto md:col-start-2">
              <div className="grid md:grid-cols-2 gap-2 md:gap-4 py-16 md:py-20">
                {/* Left side - Text content */}
                <div className="pr-4 pl-8 md:pr-0 md:pl-16 lg:pl-24">
                  <Badge className="bg-background text-foreground text-xs font-semibold uppercase tracking-wide mb-4 px-3 py-1 border">
                    наша экспертиза
                  </Badge>
                  <h2 className="mb-6 text-4xl font-bold text-foreground md:text-5xl">
                    Лидер в области детского и семейного благополучия
                  </h2>
                  <div className="space-y-4 mb-6">
                    <p className="text-base text-foreground/90">
                      Наталья Владимировна Кисельникова — ведущий методолог Waves, кандидат психологических наук, психолог-исследователь с более чем 15-летним опытом руководства междисциплинарными проектами в сфере семейного благополучия.
                    </p>
                    <p className="text-base text-foreground/90">
                      Она имеет степень MSc in Psychosocial Studies (Birkbeck, University of London) и специализируется на разработке и внедрении программ благополучия, основанных на данных, включая цифровые инструменты оценки, профилактики и поддержки. Ранее Наталья руководила исследовательскими и прикладными проектами в области B2B-программ ментального здоровья, психологической диагностики и внедрения ИИ-решений для анализа эмоциональных состояний.
                    </p>
                    <p className="text-base text-foreground/90">
                      В Waves Наталья отвечает за стратегическую архитектуру продукта, включая модель оценки семейного благополучия, маршрутизацию поддержки и интеграцию научно обоснованных подходов в масштабируемую цифровую платформу.
                    </p>
                  </div>
                </div>

                {/* Right side - Photo */}
                <div className="flex items-center justify-center px-0">
                  <img 
                    src={expertImage} 
                    alt="Наталья Владимировна Кисельникова"
                    className="landing-expertise-photo"
                    onError={(e) => {
                      // Fallback если изображение не найдено
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs Section */}
        <section id="faq" className="bg-muted pt-12 pb-2">
          <div className="px-4 md:grid md:grid-cols-[1fr_minmax(0,1280px)_1fr]">
            <div className="max-w-7xl mx-auto md:col-start-2">
            <div className="mb-12 text-center px-8 md:px-16 lg:px-24">
              <h2 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
                Часто задаваемые вопросы
              </h2>
            </div>
            <div className="mx-auto max-w-3xl px-8 md:px-16 lg:px-24">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left font-semibold text-lg">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground whitespace-pre-line pt-2">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
            </div>
          </div>
        </section>

        {/* CTA Section with Wave and Otter */}
        <section className="relative overflow-hidden">
          {/* Dark blue top section */}
          <div className="h-24 md:h-32 lg:h-40 relative bg-honey">
            {/* SVG wave curve */}
            <svg 
              className="absolute bottom-0 left-0 right-0 w-full h-24 md:h-32 lg:h-40"
              viewBox="0 0 1200 300" 
              preserveAspectRatio="none" 
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path 
                d="M 0 300 L 0 0 L 1200 0 L 1200 300 Q 1000 180, 800 220 Q 600 160, 400 200 Q 200 140, 0 180 Z" 
                fill="hsl(var(--muted))"
              />
            </svg>
          </div>
          
          {/* Dark blue bottom section with content */}
          <div className="relative pt-4 md:pt-6 lg:pt-8 bg-honey">
            <div className="px-4 md:grid md:grid-cols-[1fr_minmax(0,1280px)_1fr] pb-16 md:pb-20">
              <div className="max-w-7xl mx-auto md:col-start-2">
                <div className="max-w-4xl mx-auto text-center px-8 md:px-16 lg:px-24">
                  <h3 className="mb-8 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
                    Не ждите, чтобы получить помощь, в которой нуждается ваша семья
                  </h3>
                  <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                    <Button
                      size="lg"
                      variant="default"
                      onClick={() => navigate("/service")}
                      className="h-14 px-8"
                    >
                      Получить поддержку
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => navigate("/service")}
                      className="h-14 px-8 border-0 text-foreground hover:bg-foreground hover:text-honey"
                    >
                      Пройти оценку
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Age Group Details Popup */}
        <Dialog open={selectedAgeGroup !== null} onOpenChange={(open) => !open && setSelectedAgeGroup(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedAgeGroup && ageGroupDetails[selectedAgeGroup] && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl md:text-3xl">
                    {ageGroups.find(g => g.age === selectedAgeGroup)?.title}
                  </DialogTitle>
                  <DialogDescription className="text-base pt-2">
                    {ageGroupDetails[selectedAgeGroup].subtitle}
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-4">
                  <p className="text-muted-foreground mb-6">
                    {ageGroupDetails[selectedAgeGroup].intro}
                  </p>

                  <h4 className="text-sm font-semibold uppercase tracking-wide text-foreground mb-4">
                    С чем мы помогаем
                  </h4>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {ageGroupDetails[selectedAgeGroup].challenges.map((challenge, index) => (
                      <div key={index} className="p-4 rounded-lg bg-muted">
                        <h5 className="font-semibold text-foreground mb-1">{challenge.title}</h5>
                        <p className="text-sm text-muted-foreground">{challenge.description}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 flex flex-col sm:flex-row gap-3">
                    <Button
                      size="lg"
                      variant="default"
                      onClick={() => {
                        setSelectedAgeGroup(null);
                        navigate("/service");
                      }}
                      className="h-12 px-6"
                    >
                      Получить поддержку
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => setSelectedAgeGroup(null)}
                      className="h-12 px-6"
                    >
                      Назад
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>

      <LandingFooter />
    </div>
  );
}

