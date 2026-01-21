import { useMemo } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MessageCircle, Lightbulb, Minus, Plus } from "lucide-react";
import type { ChildCheckupData, ScaleResult } from "@/hooks/useResultsData";
import { isCheckupResultsV2 } from "@/hooks/useResultsData";
import { getStatusText, getStatusColor, getProgressPercentage } from "@/utils/resultsCalculations";
import type { ScaleType } from "@/data/checkupQuestions";

// Категории worry tags (должны совпадать с Worries.tsx)
const childWorries = [
  "Фокус и внимание",
  "Грусть и плач",
  "Тревоги и беспокойства",
  "Питание",
  "Сон и режим",
  "Туалет",
  "Сенсорная чувствительность",
  "Гнев и агрессия",
  "Импульсивность",
  "Травма",
  "Горе и потеря",
  "Буллинг",
  "Самооценка",
  "Школа/детский сад",
  "Удары, укусы или пинки",
  "Гендерная или сексуальная идентичность",
  "Сотрудничество",
];

// Конфигурация шкал для отображения
interface ScaleDisplayConfig {
  key: ScaleType;
  title: string;
  shortTitle: string;
  maxScore: number;
  meanings: {
    concerning: string;
    borderline: string;
    typical: string;
  };
  recommendations: {
    concerning: string[];
    borderline: string[];
    typical: string[];
  };
}

const scaleConfigs: ScaleDisplayConfig[] = [
  {
    key: 'emotion_regulation',
    title: 'Регуляция эмоций',
    shortTitle: 'Эмоции',
    maxScore: 24,
    meanings: {
      concerning: 'В разделе, касающемся эмоционального состояния {NAME}, мы видим достаточно высокие показатели. Баллы находятся в зоне «красного кода». Это указывает на более выраженные эмоциональные сложности, которые, вероятно, значительно влияют на повседневную жизнь ребенка и жизнь вашей семьи. <strong>Очень важно не откладывать обращение к специалисту</strong>, чтобы получить квалифицированную помощь и поддержку.',
      borderline: 'Здесь видно, что в разделе, который касается эмоционального состояния {NAME} (это вопросы о грусти, тревоге, страхах, трудностях с самообладанием), есть показатели, на которые стоит обратить внимание. Баллы находятся в «тревожной» зоне. <strong>Это не диагноз, а скорее сигнал</strong> о том, что ребенок, возможно, испытывает определенные эмоциональные трудности. Они пока не критичны, но могут влиять на его самочувствие и поведение. Важно разобраться в их причинах, чтобы подобрать подходящую поддержку.',
      typical: 'Судя по ответам в опроснике, в сфере эмоциональной регуляции у {NAME} всё благополучно, и это очень хорошо! Мы не видим высоких баллов по пунктам, касающимся тревоги, грусти, страхов или сложностей с самообладанием. <strong>Это значит, что с эмоциональным фоном ребенка всё в порядке</strong>, и мы можем сфокусироваться на других областях.',
    },
    recommendations: {
      concerning: [
        '<strong>Запишитесь на бесплатную консультацию в Waves.</strong> Мы поможем подобрать подходящего специалиста, который разберется в ситуации и предложит план поддержки.',
        '<strong>Создайте безопасное пространство для выражения чувств.</strong> Позвольте ребенку говорить о своих переживаниях без осуждения. Покажите, что вы рядом и готовы выслушать.',
        '<strong>Следите за режимом дня.</strong> Регулярный сон, питание и физическая активность помогают стабилизировать эмоциональное состояние.',
      ],
      borderline: [
        '<strong>Уделяйте больше времени разговорам о чувствах.</strong> Спрашивайте ребенка, как прошел его день, что его порадовало или расстроило. Это поможет ему лучше понимать свои эмоции.',
        '<strong>Обучайте способам справляться с переживаниями.</strong> Дыхательные упражнения, рисование, физическая активность — найдите то, что помогает вашему ребенку успокоиться.',
        '<strong>Наблюдайте за динамикой.</strong> Если вы заметите ухудшение состояния, запишитесь на бесплатную консультацию в Waves — мы поможем подобрать специалиста.',
      ],
      typical: [
        '<strong>Продолжайте поддерживать эмоциональную связь.</strong> Регулярно разговаривайте с ребенком о его чувствах и переживаниях — это укрепляет доверие.',
        '<strong>Моделируйте здоровое отношение к эмоциям.</strong> Показывайте на своем примере, как можно справляться с трудными чувствами.',
        '<strong>Отмечайте успехи.</strong> Хвалите ребенка, когда он справляется с трудными ситуациями — это укрепляет его уверенность в себе.',
      ],
    },
  },
  {
    key: 'behavior',
    title: 'Поведение',
    shortTitle: 'Поведение',
    maxScore: 16,
    meanings: {
      concerning: 'В разделе, касающемся поведения {NAME}, мы видим достаточно высокие показатели. Баллы находятся в зоне «красного кода». Это указывает на более выраженные и, возможно, систематические трудности в поведении, которые, вероятно, значительно влияют на адаптацию ребенка в социуме, на отношения в семье, в школе или детском саду. <strong>Эти проявления требуют пристального внимания и квалифицированной помощи.</strong>',
      borderline: 'В разделе, касающемся поведения {NAME}, есть показатели, которые говорят о некоторых трудностях. Баллы находятся в «тревожной» зоне. <strong>Это не обязательно означает серьезные проблемы</strong>, но это сигнал, что определенные модели поведения могут быть дезадаптивными или вызывать сложности у ребенка и в его окружении. Важно разобраться, почему они проявляются, и как можно скорректировать их для благополучия ребенка.',
      typical: 'В вопросах, касающихся поведения {NAME}, судя по ответам, всё достаточно благополучно! Мы не видим высоких баллов по пунктам, связанным с агрессией, обманом или нарушением правил. <strong>Это очень хороший показатель.</strong> Если у вас есть конкретные вопросы по поведенческим аспектам, вы можете их задать, но в целом по опроснику эта сфера не является проблемной.',
    },
    recommendations: {
      concerning: [
        '<strong>Запишитесь на бесплатную консультацию в Waves.</strong> При значительных поведенческих трудностях важно понять их причину. Мы поможем подобрать специалиста, который разберется в ситуации.',
        '<strong>Сохраняйте спокойствие в сложных ситуациях.</strong> Ваше спокойствие помогает ребенку регулировать свои эмоции. Избегайте криков и наказаний в момент вспышки.',
        '<strong>Устанавливайте четкие и последовательные правила.</strong> Ребенку важно понимать границы и ожидания.',
      ],
      borderline: [
        '<strong>Обратите внимание на триггеры.</strong> Постарайтесь понять, в каких ситуациях ребенку сложнее всего контролировать поведение.',
        '<strong>Хвалите желаемое поведение.</strong> Положительное подкрепление работает лучше, чем наказания.',
        '<strong>Учите альтернативным способам выражения чувств.</strong> Помогите ребенку находить слова для своих эмоций вместо действий.',
      ],
      typical: [
        '<strong>Продолжайте поддерживать позитивную дисциплину.</strong> Четкие правила в сочетании с теплом и поддержкой помогают ребенку развивать самоконтроль.',
        '<strong>Поощряйте самостоятельность.</strong> Давайте ребенку возможность принимать решения в соответствии с возрастом.',
        '<strong>Будьте примером.</strong> Дети учатся справляться с трудностями, наблюдая за взрослыми.',
      ],
    },
  },
  {
    key: 'executive_functions',
    title: 'Исполнительные функции',
    shortTitle: 'Внимание',
    maxScore: 28,
    meanings: {
      concerning: 'В разделе, касающемся исполнительных функций {NAME} (внимание, импульсивность, способность доводить дела до конца), мы видим достаточно высокие показатели. Баллы находятся в зоне «красного кода». Это указывает на выраженные трудности с концентрацией, контролем импульсов или организацией деятельности, которые, вероятно, значительно влияют на обучение и повседневную жизнь. <strong>Рекомендуется консультация специалиста</strong> для точной оценки ситуации.',
      borderline: 'В разделе, касающемся исполнительных функций {NAME} (внимание, усидчивость, импульсивность), есть показатели, на которые стоит обратить внимание. Баллы находятся в «тревожной» зоне. <strong>Это не диагноз</strong>, но сигнал о том, что ребенок может быть более подвижным или отвлекаемым, чем сверстники. Важно понаблюдать за ситуацией и при необходимости обратиться за консультацией.',
      typical: 'Судя по ответам в опроснике, в сфере исполнительных функций у {NAME} всё благополучно! Мы не видим высоких баллов по пунктам, касающимся внимания, импульсивности или трудностей с организацией деятельности. <strong>Ребенок способен концентрироваться на задачах</strong> и контролировать свою активность в соответствии с возрастом.',
    },
    recommendations: {
      concerning: [
        '<strong>Запишитесь на бесплатную консультацию в Waves.</strong> Для точной оценки ситуации важно пройти диагностику у специалиста. Мы поможем подобрать подходящего.',
        '<strong>Структурируйте среду.</strong> Четкий распорядок дня, минимум отвлекающих факторов и разбивка задач на небольшие шаги помогают ребенку справляться.',
        '<strong>Обеспечьте физическую активность.</strong> Регулярные физические упражнения помогают направить энергию в позитивное русло.',
      ],
      borderline: [
        '<strong>Наблюдайте за ситуацией.</strong> Отслеживайте, в каких условиях ребенку легче сосредоточиться.',
        '<strong>Используйте таймеры и визуальные подсказки.</strong> Они помогают ребенку организовать время и структурировать задачи.',
        '<strong>Делайте перерывы.</strong> Короткие паузы между заданиями помогают ребенку перезагрузиться.',
      ],
      typical: [
        '<strong>Поддерживайте здоровый режим.</strong> Достаточный сон, сбалансированное питание и регулярная физическая активность способствуют хорошей концентрации.',
        '<strong>Развивайте навыки планирования.</strong> Помогайте ребенку учиться организовывать свои дела.',
        '<strong>Поощряйте увлечения.</strong> Занятия, которые увлекают ребенка, развивают способность к длительной концентрации.',
      ],
    },
  },
  {
    key: 'sensory_processing',
    title: 'Сенсорная обработка',
    shortTitle: 'Сенсорика',
    maxScore: 20,
    meanings: {
      concerning: 'В разделе, касающемся сенсорной обработки {NAME} (реакции на звуки, свет, прикосновения, координация), мы видим достаточно высокие показатели. Баллы находятся в зоне «красного кода». Это указывает на значительные особенности сенсорного восприятия, которые могут существенно влиять на повседневную жизнь и обучение. <strong>Важно обратиться к специалисту</strong> для оценки ситуации и подбора поддержки.',
      borderline: 'В разделе, касающемся сенсорной обработки {NAME}, есть показатели, на которые стоит обратить внимание. Баллы находятся в «тревожной» зоне. <strong>Это не обязательно говорит о серьезных проблемах</strong>, но указывает на некоторые особенности восприятия сенсорной информации. Ребенок может быть более чувствителен к определенным стимулам или иметь небольшие трудности с координацией.',
      typical: 'Судя по ответам в опроснике, в сфере сенсорной обработки у {NAME} всё благополучно! Мы не видим высоких баллов по пунктам, касающимся чувствительности к звукам, свету или прикосновениям, а также координации движений. <strong>Ребенок адекватно воспринимает сенсорную информацию</strong> и не испытывает значительного дискомфорта.',
    },
    recommendations: {
      concerning: [
        '<strong>Запишитесь на бесплатную консультацию в Waves.</strong> Мы поможем подобрать специалиста, который оценит сенсорные особенности ребенка и разработает программу поддержки.',
        '<strong>Создайте комфортную сенсорную среду.</strong> Учитывайте чувствительность ребенка при выборе одежды, освещения, уровня шума.',
        '<strong>Предупреждайте о сенсорных изменениях.</strong> Готовьте ребенка к новым сенсорным впечатлениям заранее.',
      ],
      borderline: [
        '<strong>Наблюдайте за паттернами.</strong> Отмечайте, какие сенсорные стимулы вызывают дискомфорт или, наоборот, приносят удовольствие.',
        '<strong>Предлагайте «сенсорные паузы».</strong> Если ребенок перегружен, дайте ему время в тихом, спокойном месте.',
        '<strong>Развивайте моторные навыки.</strong> Занятия спортом, танцами, плаванием помогают улучшить координацию.',
      ],
      typical: [
        '<strong>Продолжайте разнообразить сенсорный опыт.</strong> Разные текстуры, звуки, активности способствуют развитию.',
        '<strong>Поддерживайте физическую активность.</strong> Это помогает развивать координацию и чувство тела в пространстве.',
        '<strong>Будьте внимательны к изменениям.</strong> Иногда сенсорные особенности проявляются в определенные периоды развития.',
      ],
    },
  },
  {
    key: 'communication',
    title: 'Коммуникация и речь',
    shortTitle: 'Речь',
    maxScore: 20,
    meanings: {
      concerning: 'В разделе, касающемся коммуникации и речи {NAME}, мы видим достаточно высокие показатели. Баллы находятся в зоне «красного кода». Это указывает на значительные трудности с пониманием речи, выражением мыслей, произношением или невербальным общением. <strong>Раннее обращение к специалисту очень важно</strong> для эффективной помощи.',
      borderline: 'В разделе, касающемся коммуникации и речи {NAME}, есть показатели, на которые стоит обратить внимание. Баллы находятся в «тревожной» зоне. <strong>Это не критичная ситуация</strong>, но возможны небольшие трудности с произношением, словарным запасом или умением вести диалог. Стоит понаблюдать и при необходимости проконсультироваться со специалистом.',
      typical: 'Судя по ответам в опроснике, в сфере коммуникации и речи у {NAME} всё благополучно! Мы не видим высоких баллов по пунктам, касающимся понимания речи, выражения мыслей или произношения. <strong>Коммуникативные навыки ребенка соответствуют возрасту.</strong>',
    },
    recommendations: {
      concerning: [
        '<strong>Запишитесь на бесплатную консультацию в Waves.</strong> Мы поможем подобрать специалиста, который оценит речевое развитие и при необходимости составит программу поддержки.',
        '<strong>Создавайте возможности для общения.</strong> Много разговаривайте с ребенком, читайте книги, обсуждайте события.',
        '<strong>Используйте визуальные подсказки.</strong> Картинки и жесты могут помочь ребенку лучше понимать и выражать мысли.',
      ],
      borderline: [
        '<strong>Развивайте речь через игру.</strong> Игры со словами, рассказывание историй, пение песен — всё это помогает.',
        '<strong>Моделируйте правильную речь.</strong> Повторяйте за ребенком его мысли правильно, не критикуя его способ выражения.',
        '<strong>При сомнениях — консультация.</strong> Даже при небольших трудностях специалист может дать полезные рекомендации. Запишитесь на бесплатную консультацию в Waves.',
      ],
      typical: [
        '<strong>Продолжайте развивать речь.</strong> Чтение, обсуждение, новые слова — всё это обогащает словарный запас.',
        '<strong>Учите выражать эмоции словами.</strong> Это важный навык для социального развития.',
        '<strong>Поощряйте общение со сверстниками.</strong> Это развивает диалогические навыки.',
      ],
    },
  },
  {
    key: 'social_cognition',
    title: 'Социальное познание',
    shortTitle: 'Социальное',
    maxScore: 24,
    meanings: {
      concerning: 'В разделе, касающемся социального познания {NAME} (отношения с другими детьми, эмпатия, понимание социальных ситуаций), мы видим достаточно высокие показатели. Баллы находятся в зоне «красного кода». Это указывает на значительные трудности в социальном взаимодействии, которые могут влиять на отношения со сверстниками и взрослыми. <strong>Важно обратиться к специалисту</strong> для понимания причин и подбора помощи.',
      borderline: 'В разделе, касающемся социального познания {NAME}, есть показатели, на которые стоит обратить внимание. Баллы находятся в «тревожной» зоне. <strong>Это не означает серьезных проблем</strong>, но ребенок может иногда неверно понимать социальные ситуации или испытывать сложности в общении со сверстниками. Стоит обратить внимание на эту сферу.',
      typical: 'Судя по ответам в опроснике, в сфере социального познания у {NAME} всё благополучно! Мы не видим высоких баллов по пунктам, касающимся отношений с другими детьми, эмпатии и понимания социальных правил. <strong>Ребенок умеет дружить и успешно взаимодействует с окружающими.</strong>',
    },
    recommendations: {
      concerning: [
        '<strong>Запишитесь на бесплатную консультацию в Waves.</strong> Мы поможем подобрать специалиста, который разберется в ситуации и предложит программу развития социальных навыков.',
        '<strong>Создавайте безопасные социальные ситуации.</strong> Маленькие группы, знакомая обстановка помогут ребенку практиковаться в общении.',
        '<strong>Объясняйте социальные правила.</strong> То, что кажется очевидным взрослым, может быть непонятно ребенку.',
      ],
      borderline: [
        '<strong>Помогите найти подходящий круг общения.</strong> Кружки по интересам, где ребенку легче общаться с единомышленниками.',
        '<strong>Обсуждайте социальные ситуации.</strong> Разбирайте сложные случаи и вместе ищите решения.',
        '<strong>Развивайте эмпатию.</strong> Обсуждайте чувства персонажей книг и фильмов.',
      ],
      typical: [
        '<strong>Поддерживайте дружеские связи.</strong> Помогайте ребенку поддерживать контакт с друзьями.',
        '<strong>Учите разрешать конфликты.</strong> Это важный социальный навык для жизни.',
        '<strong>Расширяйте социальный опыт.</strong> Новые ситуации развивают гибкость в общении.',
      ],
    },
  },
  {
    key: 'identity',
    title: 'Идентичность и самооценка',
    shortTitle: 'Самооценка',
    maxScore: 12,
    meanings: {
      concerning: 'В разделе, касающемся самооценки и идентичности {NAME}, мы видим достаточно высокие показатели. Баллы находятся в зоне «красного кода». Это указывает на выраженные трудности — ребенок может сильно сомневаться в себе, негативно отзываться о себе или испытывать сложности с ощущением своего места в мире. <strong>Важно обратиться к специалисту</strong> для поддержки.',
      borderline: 'В разделе, касающемся самооценки и идентичности {NAME}, есть показатели, на которые стоит обратить внимание. Баллы находятся в «тревожной» зоне. <strong>Это не критично</strong>, но ребенок может иногда сомневаться в себе или сравнивать себя с другими не в свою пользу. Стоит уделить внимание укреплению его уверенности.',
      typical: 'Судя по ответам в опроснике, в сфере самооценки и идентичности у {NAME} всё благополучно! Мы не видим высоких баллов по пунктам, касающимся неуверенности в себе или негативного отношения к себе. <strong>Ребенок в целом позитивно относится к себе</strong> и уверен в своих способностях.',
    },
    recommendations: {
      concerning: [
        '<strong>Запишитесь на бесплатную консультацию в Waves.</strong> Специалист поможет ребенку сформировать более позитивное отношение к себе.',
        '<strong>Безусловное принятие.</strong> Показывайте ребенку, что любите его таким, какой он есть, вне зависимости от достижений.',
        '<strong>Помогите найти сильные стороны.</strong> Каждый ребенок в чем-то уникален — помогите это увидеть и развить.',
      ],
      borderline: [
        '<strong>Хвалите усилия, а не результат.</strong> Это помогает формировать здоровое отношение к себе и к неудачам.',
        '<strong>Избегайте сравнений.</strong> Сравнивайте ребенка только с ним самим в прошлом, отмечая прогресс.',
        '<strong>Давайте посильные задачи.</strong> Успех в выполнимых делах укрепляет уверенность.',
      ],
      typical: [
        '<strong>Продолжайте поддерживать.</strong> Ваша вера в ребенка укрепляет его уверенность в себе.',
        '<strong>Учите справляться с неудачами.</strong> Это часть жизни, и важно уметь их принимать и идти дальше.',
        '<strong>Поощряйте самовыражение.</strong> Пусть ребенок развивает свои уникальные интересы и таланты.',
      ],
    },
  },
  {
    key: 'learning',
    title: 'Обучение',
    shortTitle: 'Обучение',
    maxScore: 12,
    meanings: {
      concerning: 'В разделе, касающемся обучения {NAME}, мы видим достаточно высокие показатели. Баллы находятся в зоне «красного кода». Это указывает на значительные трудности с усвоением нового материала, запоминанием информации или выполнением учебных заданий. <strong>Важно обратиться к специалисту</strong> для диагностики и подбора подходящей поддержки.',
      borderline: 'В разделе, касающемся обучения {NAME}, есть показатели, на которые стоит обратить внимание. Баллы находятся в «тревожной» зоне. <strong>Это не означает серьезных нарушений</strong>, но ребенок может медленнее усваивать материал или испытывать сложности в определенных областях. Стоит понаблюдать и при необходимости проконсультироваться.',
      typical: 'Судя по ответам в опроснике, в сфере обучения у {NAME} всё благополучно! Мы не видим высоких баллов по пунктам, касающимся трудностей с усвоением материала или сопротивления учебе. <strong>Ребенок успешно усваивает новые знания и навыки</strong> в соответствии с возрастом.',
    },
    recommendations: {
      concerning: [
        '<strong>Запишитесь на бесплатную консультацию в Waves.</strong> Мы поможем подобрать специалиста, который выявит конкретные трудности и составит план поддержки.',
        '<strong>Адаптируйте подход к обучению.</strong> Разные дети учатся по-разному — найдите подходящий метод для вашего ребенка.',
        '<strong>Взаимодействуйте с педагогами.</strong> Расскажите о трудностях ребенка, чтобы получить поддержку в учреждении.',
      ],
      borderline: [
        '<strong>Разбивайте материал на части.</strong> Небольшие порции информации легче усваиваются.',
        '<strong>Используйте разные каналы обучения.</strong> Визуальные, слуховые, практические материалы — найдите, что лучше работает.',
        '<strong>Хвалите за усилия.</strong> Поддержка мотивирует продолжать учиться несмотря на трудности.',
      ],
      typical: [
        '<strong>Поддерживайте любознательность.</strong> Отвечайте на вопросы, исследуйте вместе, поощряйте интерес к новому.',
        '<strong>Развивайте разные навыки.</strong> Не только академические, но и практические, творческие.',
        '<strong>Учите учиться.</strong> Навыки самоорганизации и планирования пригодятся в будущем.',
      ],
    },
  },
  {
    key: 'motivation',
    title: 'Мотивация',
    shortTitle: 'Мотивация',
    maxScore: 16,
    meanings: {
      concerning: 'В разделе, касающемся мотивации {NAME}, мы видим достаточно высокие показатели. Баллы находятся в зоне «красного кода». Это указывает на выраженные трудности — ребенку сложно заинтересоваться чем-либо, он быстро сдается при трудностях и редко проявляет настойчивость. <strong>Такое состояние может быть связано с эмоциональными проблемами</strong> и требует внимания специалиста.',
      borderline: 'В разделе, касающемся мотивации {NAME}, есть показатели, на которые стоит обратить внимание. Баллы находятся в «тревожной» зоне. <strong>Это не критичная ситуация</strong>, но ребенок может терять интерес к начатому делу или избегать сложных задач. Стоит обратить внимание на то, что помогает ребенку оставаться вовлеченным.',
      typical: 'Судя по ответам в опроснике, в сфере мотивации у {NAME} всё благополучно! Мы не видим высоких баллов по пунктам, касающимся потери интереса или отказа от сложных задач. <strong>Ребенок проявляет интерес к занятиям</strong> и умеет преодолевать трудности.',
    },
    recommendations: {
      concerning: [
        '<strong>Запишитесь на бесплатную консультацию в Waves.</strong> Низкая мотивация может быть симптомом эмоциональных проблем — важно разобраться в причинах со специалистом.',
        '<strong>Найдите искру.</strong> Попробуйте разные занятия — что-то должно зажечь интерес ребенка.',
        '<strong>Ставьте маленькие цели.</strong> Успех в маленьком деле мотивирует на большее.',
      ],
      borderline: [
        '<strong>Связывайте задачи с интересами.</strong> Если ребенок любит динозавров — используйте эту тему для обучения.',
        '<strong>Разбивайте большие задачи.</strong> Маленькие шаги не так пугают и дают ощущение прогресса.',
        '<strong>Празднуйте достижения.</strong> Даже маленькие успехи заслуживают признания и похвалы.',
      ],
      typical: [
        '<strong>Поддерживайте увлечения.</strong> Интересы ребенка — основа его мотивации.',
        '<strong>Учите ставить цели.</strong> Это навык, который пригодится всю жизнь.',
        '<strong>Показывайте связь усилий и результата.</strong> Это формирует здоровое отношение к труду.',
      ],
    },
  },
  {
    key: 'trauma',
    title: 'Травматический опыт',
    shortTitle: 'Травма',
    maxScore: 12,
    meanings: {
      concerning: 'В разделе, касающемся травматического опыта {NAME}, мы видим достаточно высокие показатели. Баллы находятся в зоне «красного кода». Это указывает на вероятное наличие травматического опыта, который влияет на ребенка — это могут быть ночные кошмары, навязчивые мысли, избегание определенных ситуаций или другие признаки. <strong>Очень важно обратиться к специалисту</strong> для получения квалифицированной помощи.',
      borderline: 'В разделе, касающемся травматического опыта {NAME}, есть показатели, на которые стоит обратить внимание. Баллы находятся в «тревожной» зоне. <strong>Это не означает обязательного наличия травмы</strong>, но есть признаки возможного влияния стрессовых событий на ребенка. Ситуация требует внимания и наблюдения.',
      typical: 'Судя по ответам в опроснике, {NAME} не демонстрирует признаков травматического стресса. Если были стрессовые события в прошлом, ребенок успешно с ними справился. <strong>Это хороший показатель устойчивости.</strong>',
    },
    recommendations: {
      concerning: [
        '<strong>Запишитесь на бесплатную консультацию в Waves.</strong> Мы поможем подобрать специалиста, который работает с травмой и поможет ребенку переработать опыт.',
        '<strong>Создайте безопасную среду.</strong> Предсказуемость и стабильность очень важны для восстановления.',
        '<strong>Не заставляйте говорить.</strong> Дайте ребенку время и пространство для переработки опыта в своем темпе.',
      ],
      borderline: [
        '<strong>Будьте рядом.</strong> Ваша поддержка — главный ресурс для ребенка.',
        '<strong>Наблюдайте за изменениями.</strong> Если симптомы усиливаются — запишитесь на консультацию в Waves.',
        '<strong>Поддерживайте рутину.</strong> Привычный распорядок дает ощущение безопасности.',
      ],
      typical: [
        '<strong>Поддерживайте открытый диалог.</strong> Пусть ребенок знает, что может рассказать вам о любых переживаниях.',
        '<strong>Обсуждайте эмоции.</strong> Это помогает справляться с трудными ситуациями.',
        '<strong>Будьте внимательны к изменениям.</strong> Реакция на стресс может проявиться не сразу.',
      ],
    },
  },
];

interface ChildCheckupSectionProps {
  childData: ChildCheckupData;
  openSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
}

export function ChildCheckupSection({ childData, openSections, toggleSection }: ChildCheckupSectionProps) {
  const childProfile = childData.profile;
  const childResults = childData.results;

  // Генерируем уникальные ключи для секций на основе ID ребенка
  const sectionPrefix = `child-${childProfile.id}`;

  // Мемоизируем вычисление worry tags
  const childWorryTags = useMemo(() => {
    const assessmentWorryTags = childData.assessment?.worry_tags as { child?: string[]; personal?: string[]; family?: string[] } | null;
    return assessmentWorryTags?.child || childProfile.worry_tags?.filter(w => childWorries.includes(w)) || [];
  }, [childData.assessment?.worry_tags, childProfile.worry_tags]);

  // Проверяем версию результатов
  const isV2 = isCheckupResultsV2(childResults);

  // Функция для замены {NAME} на имя ребенка
  const replaceNamePlaceholder = (text: string) => {
    return text.replace(/\{NAME\}/g, childProfile.first_name);
  };

  // Компонент для отображения одной шкалы (формат как в ParentSection)
  const renderScale = (config: ScaleDisplayConfig, result: ScaleResult | undefined) => {
    if (!result) return null;

    const maxScore = result.max_score || config.maxScore;
    const meaningText = replaceNamePlaceholder(config.meanings[result.status]);

    return (
      <div key={config.key} className="rounded-lg border border-border bg-white p-6 mb-6">
        <h3 className="text-xl font-bold text-foreground mb-4">{config.title}</h3>

        <div className="mb-6">
          <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(result.status)}`}>
            {getStatusText(result.status)}
          </span>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
            <div
              className={`h-full ${
                result.status === 'concerning' ? 'bg-coral' :
                result.status === 'borderline' ? 'bg-yellow-400' :
                'bg-secondary'
              }`}
              style={{ width: `${getProgressPercentage(result.score, maxScore)}%` }}
            ></div>
          </div>
        </div>

        <div className="space-y-3">
          <Collapsible open={openSections[`${sectionPrefix}-${config.key}-mean`]} onOpenChange={() => toggleSection(`${sectionPrefix}-${config.key}-mean`)}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-accent/10 p-4 text-left hover:bg-accent/20">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-accent" />
                <span className="font-medium text-foreground">Что это значит?</span>
              </div>
              {openSections[`${sectionPrefix}-${config.key}-mean`] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
              <p className="text-foreground" dangerouslySetInnerHTML={{ __html: meaningText }} />
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={openSections[`${sectionPrefix}-${config.key}-do`]} onOpenChange={() => toggleSection(`${sectionPrefix}-${config.key}-do`)}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-sky-blue/10 p-4 text-left hover:bg-sky-blue/20">
              <div className="flex items-center gap-3">
                <Lightbulb className="h-5 w-5 text-sky-blue" />
                <span className="font-medium text-foreground">Что я могу сделать?</span>
              </div>
              {openSections[`${sectionPrefix}-${config.key}-do`] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
              <ul className="list-inside space-y-3 text-foreground">
                {config.recommendations[result.status].map((rec, idx) => (
                  <li key={idx} dangerouslySetInnerHTML={{ __html: replaceNamePlaceholder(rec) }} />
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    );
  };

  // Компонент итоговой карточки для одной шкалы
  const renderSummaryScale = (config: ScaleDisplayConfig, result: ScaleResult | undefined) => {
    if (!result) return null;

    const maxScore = result.max_score || config.maxScore;

    return (
      <div key={config.key}>
        <div className="mb-2 flex items-center gap-2">
          <span className="font-medium text-foreground">{config.shortTitle}</span>
          <span className={`text-sm ${
            result.status === 'concerning' ? 'text-coral' :
            result.status === 'borderline' ? 'text-yellow-500' :
            'text-secondary'
          }`}>
            • {getStatusText(result.status)}
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-muted/50">
          <div
            className={`h-full ${
              result.status === 'concerning' ? 'bg-coral' :
              result.status === 'borderline' ? 'bg-yellow-400' :
              'bg-secondary'
            }`}
            style={{ width: `${getProgressPercentage(result.score, maxScore)}%` }}
          ></div>
        </div>
      </div>
    );
  };

  // Рендерим V2 результаты (10 новых шкал)
  if (isV2) {
    const v2Results = childResults;

    return (
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-foreground mb-8">
          Ментальное здоровье {childProfile.first_name}
        </h2>

        {/* Worries Section */}
        {childWorryTags.length > 0 && (
          <div className="rounded-lg border border-border bg-white p-6 mb-6">
            <h3 className="text-xl font-bold text-foreground mb-4">Беспокойства о {childProfile.first_name}</h3>
            <p className="mb-4 text-foreground/70">
              Беспокойства, которыми вы поделились о {childProfile.first_name}
            </p>
            <div className="flex flex-wrap gap-2">
              {childWorryTags.map((worry, index) => (
                <span key={index} className="rounded-full bg-coral/20 px-4 py-2 text-sm font-medium text-coral">
                  {worry}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Все 10 шкал */}
        {scaleConfigs.map(config => {
          const result = v2Results[config.key] as ScaleResult | undefined;
          return renderScale(config, result);
        })}

        {/* Child's Recap */}
        <div className="mb-8 overflow-hidden rounded-lg bg-white border border-border/50">
          <div className="flex items-center justify-between p-6">
            <h3 className="text-2xl font-bold text-foreground">Итоги {childProfile.first_name}</h3>
          </div>
          <div className="space-y-4 bg-white p-6">
            {scaleConfigs.map(config => {
              const result = v2Results[config.key] as ScaleResult | undefined;
              return renderSummaryScale(config, result);
            })}
          </div>
        </div>
      </div>
    );
  }

  // Рендерим V1 результаты (старые 5 шкал) для обратной совместимости
  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold text-foreground mb-8">
        Ментальное здоровье {childProfile.first_name}
      </h2>

      {/* Worries Section */}
      {childWorryTags.length > 0 && (
        <div className="rounded-lg border border-border bg-white p-6 mb-6">
          <h3 className="text-xl font-bold text-foreground mb-4">Беспокойства о {childProfile.first_name}</h3>
          <p className="mb-4 text-foreground/70">
            Беспокойства, которыми вы поделились о {childProfile.first_name}
          </p>
          <div className="flex flex-wrap gap-2">
            {childWorryTags.map((worry, index) => (
              <span key={index} className="rounded-full bg-coral/20 px-4 py-2 text-sm font-medium text-coral">
                {worry}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* V1: Emotional */}
      {childResults.emotional && (
        <div className="rounded-lg border border-border bg-white p-6 mb-6">
          <h3 className="text-xl font-bold text-foreground mb-4">Эмоциональные трудности</h3>
          <div className="mb-6">
            <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(childResults.emotional.status)}`}>
              {getStatusText(childResults.emotional.status)}
            </span>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
              <div
                className={`h-full ${
                  childResults.emotional.status === 'concerning' ? 'bg-coral' :
                  childResults.emotional.status === 'borderline' ? 'bg-yellow-400' :
                  'bg-secondary'
                }`}
                style={{ width: `${getProgressPercentage(childResults.emotional.score, 20)}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* V1: Conduct */}
      {childResults.conduct && (
        <div className="rounded-lg border border-border bg-white p-6 mb-6">
          <h3 className="text-xl font-bold text-foreground mb-4">Поведенческие трудности</h3>
          <div className="mb-6">
            <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(childResults.conduct.status)}`}>
              {getStatusText(childResults.conduct.status)}
            </span>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
              <div
                className={`h-full ${
                  childResults.conduct.status === 'concerning' ? 'bg-coral' :
                  childResults.conduct.status === 'borderline' ? 'bg-yellow-400' :
                  'bg-secondary'
                }`}
                style={{ width: `${getProgressPercentage(childResults.conduct.score, 20)}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* V1: Hyperactivity */}
      {childResults.hyperactivity && (
        <div className="rounded-lg border border-border bg-white p-6 mb-6">
          <h3 className="text-xl font-bold text-foreground mb-4">Трудности с активностью</h3>
          <div className="mb-6">
            <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(childResults.hyperactivity.status)}`}>
              {getStatusText(childResults.hyperactivity.status)}
            </span>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
              <div
                className={`h-full ${
                  childResults.hyperactivity.status === 'concerning' ? 'bg-coral' :
                  childResults.hyperactivity.status === 'borderline' ? 'bg-yellow-400' :
                  'bg-secondary'
                }`}
                style={{ width: `${getProgressPercentage(childResults.hyperactivity.score, 20)}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* V1: Peer Problems */}
      {childResults.peer_problems && (
        <div className="rounded-lg border border-border bg-white p-6 mb-6">
          <h3 className="text-xl font-bold text-foreground mb-4">Социальные трудности</h3>
          <div className="mb-6">
            <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(childResults.peer_problems.status)}`}>
              {getStatusText(childResults.peer_problems.status)}
            </span>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
              <div
                className={`h-full ${
                  childResults.peer_problems.status === 'concerning' ? 'bg-coral' :
                  childResults.peer_problems.status === 'borderline' ? 'bg-yellow-400' :
                  'bg-secondary'
                }`}
                style={{ width: `${getProgressPercentage(childResults.peer_problems.score, 24)}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* V1: Child's Recap */}
      <div className="mb-8 overflow-hidden rounded-lg bg-white border border-border/50">
        <div className="flex items-center justify-between p-6">
          <h3 className="text-2xl font-bold text-foreground">Итоги {childProfile.first_name}</h3>
        </div>
        <div className="space-y-4 bg-white p-6">
          {childResults.emotional && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="font-medium text-foreground">Эмоции</span>
                <span className={`text-sm ${
                  childResults.emotional.status === 'concerning' ? 'text-coral' :
                  childResults.emotional.status === 'borderline' ? 'text-yellow-500' :
                  'text-secondary'
                }`}>
                  • {getStatusText(childResults.emotional.status)}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted/50">
                <div
                  className={`h-full ${
                    childResults.emotional.status === 'concerning' ? 'bg-coral' :
                    childResults.emotional.status === 'borderline' ? 'bg-yellow-400' :
                    'bg-secondary'
                  }`}
                  style={{ width: `${getProgressPercentage(childResults.emotional.score, 20)}%` }}
                ></div>
              </div>
            </div>
          )}

          {childResults.conduct && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="font-medium text-foreground">Поведение</span>
                <span className={`text-sm ${
                  childResults.conduct.status === 'concerning' ? 'text-coral' :
                  childResults.conduct.status === 'borderline' ? 'text-yellow-500' :
                  'text-secondary'
                }`}>
                  • {getStatusText(childResults.conduct.status)}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted/50">
                <div
                  className={`h-full ${
                    childResults.conduct.status === 'concerning' ? 'bg-coral' :
                    childResults.conduct.status === 'borderline' ? 'bg-yellow-400' :
                    'bg-secondary'
                  }`}
                  style={{ width: `${getProgressPercentage(childResults.conduct.score, 20)}%` }}
                ></div>
              </div>
            </div>
          )}

          {childResults.hyperactivity && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="font-medium text-foreground">Активность</span>
                <span className={`text-sm ${
                  childResults.hyperactivity.status === 'concerning' ? 'text-coral' :
                  childResults.hyperactivity.status === 'borderline' ? 'text-yellow-500' :
                  'text-secondary'
                }`}>
                  • {getStatusText(childResults.hyperactivity.status)}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted/50">
                <div
                  className={`h-full ${
                    childResults.hyperactivity.status === 'concerning' ? 'bg-coral' :
                    childResults.hyperactivity.status === 'borderline' ? 'bg-yellow-400' :
                    'bg-secondary'
                  }`}
                  style={{ width: `${getProgressPercentage(childResults.hyperactivity.score, 20)}%` }}
                ></div>
              </div>
            </div>
          )}

          {childResults.peer_problems && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="font-medium text-foreground">Социальное</span>
                <span className={`text-sm ${
                  childResults.peer_problems.status === 'concerning' ? 'text-coral' :
                  childResults.peer_problems.status === 'borderline' ? 'text-yellow-500' :
                  'text-secondary'
                }`}>
                  • {getStatusText(childResults.peer_problems.status)}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted/50">
                <div
                  className={`h-full ${
                    childResults.peer_problems.status === 'concerning' ? 'bg-coral' :
                    childResults.peer_problems.status === 'borderline' ? 'bg-yellow-400' :
                    'bg-secondary'
                  }`}
                  style={{ width: `${getProgressPercentage(childResults.peer_problems.score, 24)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
