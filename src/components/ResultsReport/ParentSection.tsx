import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MessageCircle, Lightbulb, Minus, Plus } from "lucide-react";
import type { Database } from "@/lib/supabase";
import { getStatusText, getStatusColor, getProgressPercentage } from "@/utils/resultsCalculations";

type Profile = Database['public']['Tables']['profiles']['Row'];
type Assessment = Database['public']['Tables']['assessments']['Row'];

interface ParentResults {
  anxiety?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
  depression?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
  total?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
}

const personalWorries = [
  "Выгорание",
  "Тревожность",
  "Пониженное настроение",
  "Трудности с концентрацией внимания",
  "Общий стресс",
];

interface ParentSectionProps {
  parentProfile: Profile | null;
  parentAssessment: Assessment | null;
  openSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
}

export function ParentSection({ parentProfile, parentAssessment, openSections, toggleSection }: ParentSectionProps) {
  if (!parentAssessment) {
    return null;
  }

  // Используем теги из assessment (зафиксированные на момент чекапа), если есть, иначе из профиля
  const assessmentWorryTags = parentAssessment?.worry_tags as { child?: string[]; personal?: string[]; family?: string[] } | null;
  const personalWorryTags = assessmentWorryTags?.personal || parentProfile?.worry_tags?.filter(w => personalWorries.includes(w)) || [];

  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold text-foreground mb-8">Ваше ментальное здоровье</h2>
      
      {/* Worries Section - о себе */}
      {personalWorryTags.length > 0 && (
        <div className="rounded-lg border border-border bg-white p-6 mb-6">
          <h3 className="text-xl font-bold text-foreground mb-4">Беспокойства о себе</h3>
          <p className="mb-4 text-foreground/70">
            Беспокойства, которыми вы поделились о себе
          </p>
          <div className="flex flex-wrap gap-2">
            {personalWorryTags.map((worry, index) => (
              <span key={index} className="rounded-full bg-coral/20 px-4 py-2 text-sm font-medium text-coral">
                {worry}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {parentAssessment.results_summary ? (
        (() => {
          const parentResults = parentAssessment.results_summary as ParentResults;
          return (
            <div className="space-y-6">
              <p className="text-foreground/70 mb-4">
                Результаты родительской оценки {parentAssessment.completed_at 
                  ? new Date(parentAssessment.completed_at).toLocaleDateString('ru-RU')
                  : ''}
              </p>

              {parentResults.anxiety && (
                <div className="rounded-lg border border-border bg-white p-6">
                  <h3 className="text-xl font-bold text-foreground mb-4">Тревожность</h3>
                  <div className="mb-6">
                    <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(parentResults.anxiety.status)}`}>
                      {getStatusText(parentResults.anxiety.status)}
                    </span>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
                      <div 
                        className={`h-full ${
                          parentResults.anxiety.status === 'concerning' ? 'bg-coral' :
                          parentResults.anxiety.status === 'borderline' ? 'bg-yellow-400' :
                          'bg-secondary'
                        }`}
                        style={{ width: `${getProgressPercentage(parentResults.anxiety.score, 6)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Collapsible open={openSections['parent-anxiety-mean']} onOpenChange={() => toggleSection('parent-anxiety-mean')}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-accent/10 p-4 text-left hover:bg-accent/20">
                        <div className="flex items-center gap-3">
                          <MessageCircle className="h-5 w-5 text-accent" />
                          <span className="font-medium text-foreground">Что это значит?</span>
                        </div>
                        {openSections['parent-anxiety-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                        <p className="text-foreground">
                          {parentResults.anxiety.status === 'concerning'
                            ? <>Эти результаты показывают, что вы <strong>испытываете значительные симптомы тревожности.</strong> Это может проявляться в постоянном беспокойстве, напряжении, трудностях с расслаблением или физических симптомах (учащенное сердцебиение, потливость). Высокий уровень тревожности влияет на вашу способность заботиться о себе и семье.</>
                            : parentResults.anxiety.status === 'borderline'
                            ? <>Эти результаты показывают, что вы <strong>можете испытывать некоторые симптомы тревожности.</strong> Это пограничный уровень — вы периодически чувствуете беспокойство или напряжение, но это еще не достигло критического уровня. Важно обратить внимание на свое состояние.</>
                            : <>Эти результаты показывают, что вы <strong>не испытываете значительных симптомов тревожности.</strong> Вы в целом справляетесь со стрессом и умеете расслабляться. Продолжайте поддерживать баланс и заботиться о своем эмоциональном благополучии.</>}
                        </p>
                      </CollapsibleContent>
                    </Collapsible>

                    <Collapsible open={openSections['parent-anxiety-do']} onOpenChange={() => toggleSection('parent-anxiety-do')}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-sky-blue/10 p-4 text-left hover:bg-sky-blue/20">
                        <div className="flex items-center gap-3">
                          <Lightbulb className="h-5 w-5 text-sky-blue" />
                          <span className="font-medium text-foreground">Что я могу сделать?</span>
                        </div>
                        {openSections['parent-anxiety-do'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                        {parentResults.anxiety.status === 'concerning' ? (
                          <ul className="list-inside space-y-3 text-foreground">
                            <li>
                              <strong>Обратитесь к специалисту.</strong> При значительном уровне тревожности рекомендуется консультация психолога или психотерапевта. В Balansity мы можем помочь подобрать подходящего специалиста.
                            </li>
                            <li>
                              <strong>Практикуйте техники релаксации.</strong> Дыхательные упражнения, медитация, прогрессивная мышечная релаксация — найдите то, что помогает вам успокоиться.
                            </li>
                            <li>
                              <strong>Ограничьте триггеры.</strong> Определите, что усиливает вашу тревогу (новости, социальные сети, кофеин) и по возможности снизьте их влияние.
                            </li>
                          </ul>
                        ) : parentResults.anxiety.status === 'borderline' ? (
                          <ul className="list-inside space-y-3 text-foreground">
                            <li>
                              <strong>Уделите внимание самопомощи.</strong> Регулярные физические упражнения, достаточный сон и здоровое питание помогают снизить уровень тревожности.
                            </li>
                            <li>
                              <strong>Найдите время для себя.</strong> Даже 15-20 минут в день на занятие, которое приносит радость, могут существенно улучшить самочувствие.
                            </li>
                            <li>
                              <strong>Делитесь переживаниями.</strong> Разговор с близкими или друзьями о своих чувствах помогает снизить внутреннее напряжение.
                            </li>
                          </ul>
                        ) : (
                          <ul className="list-inside space-y-3 text-foreground">
                            <li>
                              <strong>Поддерживайте здоровые привычки.</strong> Продолжайте заботиться о сне, питании и физической активности — это основа эмоционального благополучия.
                            </li>
                            <li>
                              <strong>Развивайте устойчивость к стрессу.</strong> Практики осознанности и благодарности помогают укреплять психологическую устойчивость.
                            </li>
                            <li>
                              <strong>Создавайте баланс.</strong> Находите время и для работы/семьи, и для отдыха и собственных интересов.
                            </li>
                          </ul>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </div>
              )}

              {parentResults.depression && (
                <div className="rounded-lg border border-border bg-white p-6">
                  <h3 className="text-xl font-bold text-foreground mb-4">Депрессия</h3>
                  <div className="mb-6">
                    <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(parentResults.depression.status)}`}>
                      {getStatusText(parentResults.depression.status)}
                    </span>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
                      <div 
                        className={`h-full ${
                          parentResults.depression.status === 'concerning' ? 'bg-coral' :
                          parentResults.depression.status === 'borderline' ? 'bg-yellow-400' :
                          'bg-secondary'
                        }`}
                        style={{ width: `${getProgressPercentage(parentResults.depression.score, 6)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Collapsible open={openSections['parent-depression-mean']} onOpenChange={() => toggleSection('parent-depression-mean')}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-accent/10 p-4 text-left hover:bg-accent/20">
                        <div className="flex items-center gap-3">
                          <MessageCircle className="h-5 w-5 text-accent" />
                          <span className="font-medium text-foreground">Что это значит?</span>
                        </div>
                        {openSections['parent-depression-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                        <p className="text-foreground">
                          {parentResults.depression.status === 'concerning'
                            ? <>Эти результаты показывают, что вы <strong>испытываете значительные депрессивные симптомы.</strong> Это может проявляться в подавленном настроении, потере интереса к занятиям, усталости, нарушениях сна или аппетита. Такое состояние влияет на вашу способность заботиться о себе и семье.</>
                            : parentResults.depression.status === 'borderline'
                            ? <>Эти результаты показывают, что вы <strong>можете испытывать некоторые депрессивные симптомы.</strong> Это пограничный уровень — вы можете периодически чувствовать подавленность или потерю энергии, но это еще не достигло критического уровня. Важно обратить внимание на свое состояние.</>
                            : <>Эти результаты показывают, что вы <strong>не испытываете значительных депрессивных симптомов.</strong> Ваше настроение и уровень энергии в целом стабильны. Продолжайте заботиться о себе и поддерживать эмоциональное благополучие.</>}
                        </p>
                      </CollapsibleContent>
                    </Collapsible>

                    <Collapsible open={openSections['parent-depression-do']} onOpenChange={() => toggleSection('parent-depression-do')}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-sky-blue/10 p-4 text-left hover:bg-sky-blue/20">
                        <div className="flex items-center gap-3">
                          <Lightbulb className="h-5 w-5 text-sky-blue" />
                          <span className="font-medium text-foreground">Что я могу сделать?</span>
                        </div>
                        {openSections['parent-depression-do'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                        {parentResults.depression.status === 'concerning' ? (
                          <ul className="list-inside space-y-3 text-foreground">
                            <li>
                              <strong>Обратитесь к специалисту.</strong> При значительных депрессивных симптомах важно получить профессиональную помощь. В Balansity мы можем помочь подобрать подходящего специалиста.
                            </li>
                            <li>
                              <strong>Не изолируйтесь.</strong> Даже если нет сил на общение, старайтесь поддерживать контакт с близкими. Расскажите им о своем состоянии.
                            </li>
                            <li>
                              <strong>Начните с малого.</strong> Не требуйте от себя многого. Небольшие шаги — короткая прогулка, один звонок другу — уже помогают.
                            </li>
                          </ul>
                        ) : parentResults.depression.status === 'borderline' ? (
                          <ul className="list-inside space-y-3 text-foreground">
                            <li>
                              <strong>Следите за режимом.</strong> Регулярный сон, питание и физическая активность — базовые факторы, влияющие на настроение.
                            </li>
                            <li>
                              <strong>Планируйте приятные занятия.</strong> Даже если нет особого желания, включайте в день хотя бы одно занятие, которое раньше приносило радость.
                            </li>
                            <li>
                              <strong>Делитесь чувствами.</strong> Разговор с близким человеком или специалистом помогает не накапливать негативные эмоции.
                            </li>
                          </ul>
                        ) : (
                          <ul className="list-inside space-y-3 text-foreground">
                            <li>
                              <strong>Поддерживайте социальные связи.</strong> Общение с друзьями и близкими — важный фактор эмоционального благополучия.
                            </li>
                            <li>
                              <strong>Находите смысл и радость.</strong> Занятия, которые вас увлекают и наполняют, помогают поддерживать хорошее настроение.
                            </li>
                            <li>
                              <strong>Заботьтесь о теле.</strong> Физическая активность, свежий воздух и здоровый сон — естественные антидепрессанты.
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
            Родительская оценка завершена, но результаты еще не рассчитаны.
          </p>
        </div>
      )}
    </div>
  );
}












