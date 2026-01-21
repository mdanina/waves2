/**
 * Компонент для отображения и редактирования Case Summary клиента
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  FileText,
  Plus,
  Save,
  RefreshCw,
  Target,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Brain,
  ChevronDown,
  ChevronUp,
  Edit,
  X,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import {
  getCaseSummary,
  createCaseSummary,
  updateCaseSummary,
  refreshCaseSummaryStats,
  generateClientCaseSummary,
  type CaseSummary,
} from '@/lib/supabase-case-summary';
import { Sparkles } from 'lucide-react';

interface CaseSummaryCardProps {
  clientUserId: string;
  specialistUserId: string;
  clientName: string;
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  value: string | null;
  placeholder: string;
  isEditing: boolean;
  onChange: (value: string) => void;
  multiline?: boolean;
}

function SummarySection({
  title,
  icon,
  value,
  placeholder,
  isEditing,
  onChange,
  multiline = true,
}: SectionProps) {
  if (!isEditing && !value) return null;

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {title}
      </Label>
      {isEditing ? (
        multiline ? (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="resize-none"
          />
        ) : (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
        )
      ) : (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap pl-6">
          {value}
        </p>
      )}
    </div>
  );
}

export function CaseSummaryCard({
  clientUserId,
  specialistUserId,
  clientName,
}: CaseSummaryCardProps) {
  const { toast } = useToast();
  const [summary, setSummary] = useState<CaseSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Редактируемые поля
  const [presentingConcerns, setPresentingConcerns] = useState('');
  const [therapyGoals, setTherapyGoals] = useState('');
  const [progressSummary, setProgressSummary] = useState('');
  const [keyThemesInput, setKeyThemesInput] = useState('');
  const [treatmentApproach, setTreatmentApproach] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [riskAssessment, setRiskAssessment] = useState('');

  // Загрузка данных
  const loadSummary = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getCaseSummary(clientUserId);
      setSummary(data);

      if (data) {
        setPresentingConcerns(data.presenting_concerns || '');
        setTherapyGoals(data.therapy_goals || '');
        setProgressSummary(data.progress_summary || '');
        setKeyThemesInput(data.key_themes?.join(', ') || '');
        setTreatmentApproach(data.treatment_approach || '');
        setRecommendations(data.recommendations || '');
        setRiskAssessment(data.risk_assessment || '');
      }
    } catch (error) {
      console.error('Error loading case summary:', error);
    } finally {
      setIsLoading(false);
    }
  }, [clientUserId]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // Создание новой сводки
  const handleCreate = async () => {
    try {
      setIsLoading(true);
      const newSummary = await createCaseSummary({
        clientUserId,
        specialistUserId,
        title: `Case Summary: ${clientName}`,
      });
      setSummary(newSummary);
      setIsEditing(true);
      setIsExpanded(true);

      toast({
        title: 'Сводка создана',
        description: 'Теперь вы можете заполнить информацию о клиенте',
      });
    } catch (error) {
      console.error('Error creating case summary:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать сводку',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Сохранение изменений
  const handleSave = async () => {
    if (!summary) return;

    try {
      setIsSaving(true);

      const keyThemes = keyThemesInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await updateCaseSummary(summary.id, {
        presentingConcerns: presentingConcerns || null,
        therapyGoals: therapyGoals || null,
        progressSummary: progressSummary || null,
        keyThemes: keyThemes.length > 0 ? keyThemes : null,
        treatmentApproach: treatmentApproach || null,
        recommendations: recommendations || null,
        riskAssessment: riskAssessment || null,
      });

      await loadSummary();
      setIsEditing(false);

      toast({
        title: 'Сохранено',
        description: 'Изменения успешно сохранены',
      });
    } catch (error) {
      console.error('Error saving case summary:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить изменения',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Обновление статистики
  const handleRefresh = async () => {
    if (!summary) return;

    try {
      setIsRefreshing(true);
      const updated = await refreshCaseSummaryStats(summary.id);
      setSummary(updated);

      toast({
        title: 'Статистика обновлена',
      });
    } catch (error) {
      console.error('Error refreshing stats:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить статистику',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Отмена редактирования
  const handleCancel = () => {
    if (summary) {
      setPresentingConcerns(summary.presenting_concerns || '');
      setTherapyGoals(summary.therapy_goals || '');
      setProgressSummary(summary.progress_summary || '');
      setKeyThemesInput(summary.key_themes?.join(', ') || '');
      setTreatmentApproach(summary.treatment_approach || '');
      setRecommendations(summary.recommendations || '');
      setRiskAssessment(summary.risk_assessment || '');
    }
    setIsEditing(false);
  };

  // AI-генерация сводки
  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setIsExpanded(true);

      await generateClientCaseSummary(clientUserId);
      await loadSummary();

      toast({
        title: 'Сводка сгенерирована',
        description: 'AI проанализировал данные клиента и создал сводку',
      });
    } catch (error) {
      console.error('Error generating case summary:', error);
      toast({
        title: 'Ошибка генерации',
        description: error instanceof Error ? error.message : 'Не удалось сгенерировать сводку',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Нет сводки - показываем кнопки создания
  if (!summary) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Brain className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Case Summary</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Создайте сводку для систематизации информации о клиенте
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Генерация...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Сгенерировать AI
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleCreate} disabled={isGenerating}>
              <Plus className="mr-2 h-4 w-4" />
              Создать вручную
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Есть ли заполненные данные
  const hasContent =
    summary.presenting_concerns ||
    summary.therapy_goals ||
    summary.progress_summary ||
    summary.key_themes?.length ||
    summary.treatment_approach ||
    summary.recommendations ||
    summary.risk_assessment;

  return (
    <Card>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">Case Summary</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerate}
                    disabled={isGenerating || isRefreshing}
                    title="Перегенерировать AI сводку"
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing || isGenerating}
                    title="Обновить статистику"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditing(true);
                      setIsExpanded(true);
                    }}
                    disabled={isGenerating}
                    title="Редактировать"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </>
              )}
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
          <CardDescription>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
              <span>{summary.sessions_count} сессий</span>
              <span>{summary.notes_count} заметок</span>
              {summary.last_session_date && (
                <span>
                  Последняя:{' '}
                  {new Date(summary.last_session_date).toLocaleDateString('ru-RU')}
                </span>
              )}
              {summary.summary_type === 'auto' && summary.last_generated_at && (
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI {new Date(summary.last_generated_at).toLocaleDateString('ru-RU')}
                </Badge>
              )}
              {isGenerating && (
                <Badge variant="outline" className="text-xs">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Генерация...
                </Badge>
              )}
            </div>
          </CardDescription>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Ключевые темы */}
            {(isEditing || summary.key_themes?.length) && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Tag className="h-4 w-4" />
                  Ключевые темы
                </Label>
                {isEditing ? (
                  <Input
                    value={keyThemesInput}
                    onChange={(e) => setKeyThemesInput(e.target.value)}
                    placeholder="Тревога, отношения, самооценка (через запятую)"
                  />
                ) : (
                  <div className="flex flex-wrap gap-1 pl-6">
                    {summary.key_themes?.map((theme, index) => (
                      <Badge key={index} variant="secondary">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Separator />

            <SummarySection
              title="Первичные обращения"
              icon={<FileText className="h-4 w-4" />}
              value={isEditing ? presentingConcerns : summary.presenting_concerns}
              placeholder="Опишите причины обращения клиента..."
              isEditing={isEditing}
              onChange={setPresentingConcerns}
            />

            <SummarySection
              title="Цели терапии"
              icon={<Target className="h-4 w-4" />}
              value={isEditing ? therapyGoals : summary.therapy_goals}
              placeholder="Какие цели поставлены на терапию..."
              isEditing={isEditing}
              onChange={setTherapyGoals}
            />

            <SummarySection
              title="Прогресс терапии"
              icon={<TrendingUp className="h-4 w-4" />}
              value={isEditing ? progressSummary : summary.progress_summary}
              placeholder="Опишите прогресс клиента..."
              isEditing={isEditing}
              onChange={setProgressSummary}
            />

            <SummarySection
              title="Подход к терапии"
              icon={<Brain className="h-4 w-4" />}
              value={isEditing ? treatmentApproach : summary.treatment_approach}
              placeholder="Какие методы и техники используются..."
              isEditing={isEditing}
              onChange={setTreatmentApproach}
            />

            <SummarySection
              title="Рекомендации"
              icon={<Lightbulb className="h-4 w-4" />}
              value={isEditing ? recommendations : summary.recommendations}
              placeholder="Рекомендации для дальнейшей работы..."
              isEditing={isEditing}
              onChange={setRecommendations}
            />

            <SummarySection
              title="Оценка рисков"
              icon={<AlertTriangle className="h-4 w-4" />}
              value={isEditing ? riskAssessment : summary.risk_assessment}
              placeholder="Оценка потенциальных рисков..."
              isEditing={isEditing}
              onChange={setRiskAssessment}
            />

            {/* Кнопки редактирования */}
            {isEditing && (
              <>
                <Separator />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                    <X className="mr-2 h-4 w-4" />
                    Отмена
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Сохранение...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Сохранить
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}

            {/* Пустое состояние */}
            {!isEditing && !hasContent && (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">Сводка пока пуста</p>
                <Button
                  variant="link"
                  onClick={() => {
                    setIsEditing(true);
                  }}
                  className="mt-2"
                >
                  Заполнить информацию
                </Button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
