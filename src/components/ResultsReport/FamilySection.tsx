import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MessageCircle, Lightbulb, Minus, Plus } from "lucide-react";
import type { Database } from "@/lib/supabase";
import { getStatusText, getStatusColor, getProgressPercentage } from "@/utils/resultsCalculations";

type Profile = Database['public']['Tables']['profiles']['Row'];
type Assessment = Database['public']['Tables']['assessments']['Row'];

interface FamilyResults {
  family_stress?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
  partner_relationship?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
  coparenting?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
}

const familyWorries = [
  "Разделение/развод",
  "Семейный стресс",
  "Отношения с партнером",
  "Психическое здоровье партнера",
  "Воспитание",
  "Семейный конфликт",
];

interface FamilySectionProps {
  parentProfile: Profile | null;
  partnerProfile: Profile | null;
  familyAssessment: Assessment | null;
  openSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
}

export function FamilySection({ parentProfile, partnerProfile, familyAssessment, openSections, toggleSection }: FamilySectionProps) {
  if (!familyAssessment) {
    return (
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-foreground mb-8">Ментальное здоровье вашей семьи</h2>
        <div className="rounded-lg border border-border bg-white p-6">
          <p className="text-foreground/70">
            Семейная оценка не завершена. Пройдите опрос о семье, чтобы увидеть результаты здесь.
          </p>
        </div>
      </div>
    );
  }

  // Используем теги из assessment (зафиксированные на момент чекапа), если есть, иначе из профилей
  const assessmentWorryTags = familyAssessment?.worry_tags as { child?: string[]; personal?: string[]; family?: string[] } | null;
  const familyWorryTags = assessmentWorryTags?.family || 
                         partnerProfile?.worry_tags?.filter(w => familyWorries.includes(w)) || 
                         parentProfile?.worry_tags?.filter(w => familyWorries.includes(w)) || [];

  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold text-foreground mb-8">Ментальное здоровье вашей семьи</h2>
      <p className="text-foreground/70 mb-4">
        Результаты семейной оценки {familyAssessment.completed_at 
          ? new Date(familyAssessment.completed_at).toLocaleDateString('ru-RU')
          : ''}
      </p>
      
      {/* Worries Section - о семье */}
      {familyWorryTags.length > 0 && (
        <div className="rounded-lg border border-border bg-white p-6 mb-6">
          <h3 className="text-xl font-bold text-foreground mb-4">Беспокойства о семье</h3>
          <p className="mb-4 text-foreground/70">
            Беспокойства, которыми вы поделились о семье
          </p>
          <div className="flex flex-wrap gap-2">
            {familyWorryTags.map((worry, index) => (
              <span key={index} className="rounded-full bg-coral/20 px-4 py-2 text-sm font-medium text-coral">
                {worry}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {familyAssessment.results_summary ? (
        (() => {
          const familyResults = familyAssessment.results_summary as FamilyResults;
          return (
            <div className="space-y-6">
              {familyResults.family_stress && (
                <div className="rounded-lg border border-border bg-white p-6">
                  <h3 className="text-xl font-bold text-foreground mb-4">Семейный стресс</h3>
                  <div className="mb-6">
                    <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(familyResults.family_stress.status)}`}>
                      {getStatusText(familyResults.family_stress.status)}
                    </span>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
                      <div 
                        className={`h-full ${
                          familyResults.family_stress.status === 'concerning' ? 'bg-coral' :
                          familyResults.family_stress.status === 'borderline' ? 'bg-yellow-400' :
                          'bg-secondary'
                        }`}
                        style={{ width: `${getProgressPercentage(familyResults.family_stress.score, 4)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Collapsible open={openSections['family-stress-mean']} onOpenChange={() => toggleSection('family-stress-mean')}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-accent/10 p-4 text-left hover:bg-accent/20">
                        <div className="flex items-center gap-3">
                          <MessageCircle className="h-5 w-5 text-accent" />
                          <span className="font-medium text-foreground">Что это значит?</span>
                        </div>
                        {openSections['family-stress-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                        <p className="text-foreground">
                          {familyResults.family_stress.status === 'concerning'
                            ? <>Ваша семья в настоящее время <strong>испытывает высокий уровень стресса.</strong> Это может быть связано с финансовыми трудностями, проблемами со здоровьем, конфликтами или другими внешними факторами. Высокий семейный стресс влияет на всех членов семьи, включая детей.</>
                            : familyResults.family_stress.status === 'borderline'
                            ? <>Ваша семья <strong>испытывает умеренный уровень стресса.</strong> Это пограничный результат — периодически семья сталкивается с трудностями, но пока справляется с ними. Важно обратить внимание на эту ситуацию.</>
                            : <>Ваша семья <strong>справляется с повседневным стрессом.</strong> Уровень семейного стресса находится в пределах нормы. Вы умеете поддерживать друг друга и решать возникающие проблемы.</>}
                        </p>
                      </CollapsibleContent>
                    </Collapsible>

                    <Collapsible open={openSections['family-stress-do']} onOpenChange={() => toggleSection('family-stress-do')}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-sky-blue/10 p-4 text-left hover:bg-sky-blue/20">
                        <div className="flex items-center gap-3">
                          <Lightbulb className="h-5 w-5 text-sky-blue" />
                          <span className="font-medium text-foreground">Что я могу сделать?</span>
                        </div>
                        {openSections['family-stress-do'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                        {familyResults.family_stress.status === 'concerning' ? (
                          <ul className="list-inside space-y-3 text-foreground">
                            <li>
                              <strong>Обратитесь за профессиональной помощью.</strong> Семейная терапия или консультация специалиста поможет найти выход из сложной ситуации. В Balansity мы можем помочь.
                            </li>
                            <li>
                              <strong>Определите источники стресса.</strong> Постарайтесь понять, какие факторы создают наибольшее напряжение, и подумайте, что можно изменить.
                            </li>
                            <li>
                              <strong>Защитите детей.</strong> Старайтесь не вовлекать детей во взрослые проблемы и создавайте для них островки стабильности.
                            </li>
                          </ul>
                        ) : familyResults.family_stress.status === 'borderline' ? (
                          <ul className="list-inside space-y-3 text-foreground">
                            <li>
                              <strong>Установите приоритеты.</strong> Определите, что действительно важно для семьи, и научитесь отказываться от второстепенного.
                            </li>
                            <li>
                              <strong>Проводите время вместе.</strong> Регулярное семейное время без гаджетов и отвлечений помогает укрепить связи.
                            </li>
                            <li>
                              <strong>Распределяйте обязанности.</strong> Убедитесь, что домашние дела и ответственность распределены справедливо между членами семьи.
                            </li>
                          </ul>
                        ) : (
                          <ul className="list-inside space-y-3 text-foreground">
                            <li>
                              <strong>Поддерживайте семейные традиции.</strong> Регулярные ритуалы и традиции создают чувство стабильности и укрепляют связи.
                            </li>
                            <li>
                              <strong>Сохраняйте открытое общение.</strong> Пусть каждый член семьи знает, что может поделиться своими переживаниями.
                            </li>
                            <li>
                              <strong>Планируйте отдых.</strong> Совместный отдых и развлечения помогают накапливать позитивные семейные воспоминания.
                            </li>
                          </ul>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </div>
              )}
              
              {familyResults.partner_relationship && (
                <div className="rounded-lg border border-border bg-white p-6">
                  <h3 className="text-xl font-bold text-foreground mb-4">Отношения с партнером</h3>
                  <div className="mb-6">
                    <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(familyResults.partner_relationship.status)}`}>
                      {getStatusText(familyResults.partner_relationship.status)}
                    </span>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
                      <div 
                        className={`h-full ${
                          familyResults.partner_relationship.status === 'concerning' ? 'bg-coral' :
                          familyResults.partner_relationship.status === 'borderline' ? 'bg-yellow-400' :
                          'bg-secondary'
                        }`}
                        style={{ width: `${getProgressPercentage(familyResults.partner_relationship.score, 10)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Collapsible open={openSections['family-partner-mean']} onOpenChange={() => toggleSection('family-partner-mean')}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-accent/10 p-4 text-left hover:bg-accent/20">
                        <div className="flex items-center gap-3">
                          <MessageCircle className="h-5 w-5 text-accent" />
                          <span className="font-medium text-foreground">Что это значит?</span>
                        </div>
                        {openSections['family-partner-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                        <p className="text-foreground">
                          {familyResults.partner_relationship.status === 'concerning'
                            ? <>Вы сообщили о <strong>значительных трудностях в отношениях с партнером.</strong> Это может проявляться в частых конфликтах, отсутствии взаимопонимания, эмоциональной дистанции или других проблемах. Напряженные отношения между родителями влияют на всю семью, включая детей.</>
                            : familyResults.partner_relationship.status === 'borderline'
                            ? <>В ваших отношениях с партнером <strong>есть некоторые трудности.</strong> Это пограничный результат — периодически возникают недопонимания или конфликты, но в целом отношения функционируют. Важно обратить внимание на эти аспекты.</>
                            : <>Ваши отношения с партнером <strong>выглядят стабильными и здоровыми.</strong> Вы умеете общаться, поддерживать друг друга и справляться с разногласиями конструктивно.</>}
                        </p>
                      </CollapsibleContent>
                    </Collapsible>

                    <Collapsible open={openSections['family-partner-do']} onOpenChange={() => toggleSection('family-partner-do')}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-sky-blue/10 p-4 text-left hover:bg-sky-blue/20">
                        <div className="flex items-center gap-3">
                          <Lightbulb className="h-5 w-5 text-sky-blue" />
                          <span className="font-medium text-foreground">Что я могу сделать?</span>
                        </div>
                        {openSections['family-partner-do'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                        {familyResults.partner_relationship.status === 'concerning' ? (
                          <ul className="list-inside space-y-3 text-foreground">
                            <li>
                              <strong>Рассмотрите парную терапию.</strong> Работа со специалистом помогает разобраться в проблемах и найти пути их решения. В Balansity мы можем помочь подобрать терапевта.
                            </li>
                            <li>
                              <strong>Защитите детей от конфликтов.</strong> Старайтесь не выяснять отношения при детях и не вовлекать их в разногласия между взрослыми.
                            </li>
                            <li>
                              <strong>Найдите время для диалога.</strong> Выделите время, когда вы можете спокойно обсудить проблемы без отвлечений и обвинений.
                            </li>
                          </ul>
                        ) : familyResults.partner_relationship.status === 'borderline' ? (
                          <ul className="list-inside space-y-3 text-foreground">
                            <li>
                              <strong>Практикуйте активное слушание.</strong> Старайтесь по-настоящему услышать партнера, прежде чем отвечать или защищаться.
                            </li>
                            <li>
                              <strong>Выделяйте время друг для друга.</strong> Регулярные «свидания» помогают поддерживать близость и связь между партнерами.
                            </li>
                            <li>
                              <strong>Ищите компромиссы.</strong> Работайте вместе над решениями, которые учитывают потребности обоих партнеров.
                            </li>
                          </ul>
                        ) : (
                          <ul className="list-inside space-y-3 text-foreground">
                            <li>
                              <strong>Продолжайте инвестировать в отношения.</strong> Даже крепкие отношения требуют внимания и заботы.
                            </li>
                            <li>
                              <strong>Выражайте благодарность.</strong> Регулярно благодарите партнера за то, что он делает для семьи.
                            </li>
                            <li>
                              <strong>Поддерживайте индивидуальность.</strong> Уважайте личное пространство и интересы друг друга — это укрепляет отношения.
                            </li>
                          </ul>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </div>
              )}
              
              {familyResults.coparenting && (
                <div className="rounded-lg border border-border bg-white p-6">
                  <h3 className="text-xl font-bold text-foreground mb-4">Совместное воспитание</h3>
                  <div className="mb-6">
                    <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(familyResults.coparenting.status)}`}>
                      {getStatusText(familyResults.coparenting.status)}
                    </span>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
                      <div 
                        className={`h-full ${
                          familyResults.coparenting.status === 'concerning' ? 'bg-coral' :
                          familyResults.coparenting.status === 'borderline' ? 'bg-yellow-400' :
                          'bg-secondary'
                        }`}
                        style={{ width: `${getProgressPercentage(familyResults.coparenting.score, 10)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Collapsible open={openSections['family-coparenting-mean']} onOpenChange={() => toggleSection('family-coparenting-mean')}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-accent/10 p-4 text-left hover:bg-accent/20">
                        <div className="flex items-center gap-3">
                          <MessageCircle className="h-5 w-5 text-accent" />
                          <span className="font-medium text-foreground">Что это значит?</span>
                        </div>
                        {openSections['family-coparenting-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                        <p className="text-foreground">
                          {familyResults.coparenting.status === 'concerning'
                            ? <>Вы указали на <strong>значительные трудности в совместном воспитании.</strong> Это может проявляться в частых разногласиях о воспитании, подрыве авторитета друг друга или конфликтах при детях. Такая ситуация создает стресс для ребенка и затрудняет последовательное воспитание.</>
                            : familyResults.coparenting.status === 'borderline'
                            ? <>В совместном воспитании <strong>есть некоторые трудности.</strong> Это пограничный результат — иногда возникают разногласия о правилах или подходах к воспитанию, но в целом вы находите общий язык. Важно обратить внимание на эти аспекты.</>
                            : <>Вы <strong>эффективно работаете вместе</strong> в вопросах воспитания. Вы умеете согласовывать правила, поддерживать авторитет друг друга и решать разногласия конструктивно.</>}
                        </p>
                      </CollapsibleContent>
                    </Collapsible>

                    <Collapsible open={openSections['family-coparenting-do']} onOpenChange={() => toggleSection('family-coparenting-do')}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-sky-blue/10 p-4 text-left hover:bg-sky-blue/20">
                        <div className="flex items-center gap-3">
                          <Lightbulb className="h-5 w-5 text-sky-blue" />
                          <span className="font-medium text-foreground">Что я могу сделать?</span>
                        </div>
                        {openSections['family-coparenting-do'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                        {familyResults.coparenting.status === 'concerning' ? (
                          <ul className="list-inside space-y-3 text-foreground">
                            <li>
                              <strong>Обратитесь за помощью.</strong> Семейная терапия или консультация по совместному воспитанию может помочь найти общий подход. В Balansity мы можем помочь.
                            </li>
                            <li>
                              <strong>Не критикуйте партнера при ребенке.</strong> Разногласия обсуждайте наедине, а перед ребенком поддерживайте единую позицию.
                            </li>
                            <li>
                              <strong>Сфокусируйтесь на интересах ребенка.</strong> Когда возникают разногласия, спросите себя: что лучше для ребенка?
                            </li>
                          </ul>
                        ) : familyResults.coparenting.status === 'borderline' ? (
                          <ul className="list-inside space-y-3 text-foreground">
                            <li>
                              <strong>Согласуйте базовые правила.</strong> Договоритесь о ключевых правилах и последствиях, чтобы ребенок получал последовательные сигналы.
                            </li>
                            <li>
                              <strong>Регулярно обсуждайте вопросы воспитания.</strong> Выделяйте время для разговоров о ребенке, когда вы оба спокойны и без присутствия детей.
                            </li>
                            <li>
                              <strong>Признавайте разные стили.</strong> У каждого родителя свой стиль — это нормально, если базовые ценности совпадают.
                            </li>
                          </ul>
                        ) : (
                          <ul className="list-inside space-y-3 text-foreground">
                            <li>
                              <strong>Продолжайте сотрудничать.</strong> Регулярно обсуждайте, как развивается ребенок и какие новые вызовы появляются.
                            </li>
                            <li>
                              <strong>Поддерживайте друг друга.</strong> Хвалите партнера за его вклад в воспитание — это укрепляет команду.
                            </li>
                            <li>
                              <strong>Адаптируйтесь вместе.</strong> По мере роста ребенка его потребности меняются — будьте готовы пересматривать подходы.
                            </li>
                          </ul>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </div>
              )}
            </div>
          );
        })()
      ) : (
        <div className="rounded-lg border border-border bg-white p-6">
          <p className="text-foreground">
            Семейная оценка завершена, но результаты еще не рассчитаны.
          </p>
        </div>
      )}
    </div>
  );
}












