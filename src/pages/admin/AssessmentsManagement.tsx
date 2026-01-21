import { useState } from 'react';
import { useAdminAssessments, AdminAssessment } from '@/hooks/admin/useAdminAssessments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Eye } from 'lucide-react';
import { format } from 'date-fns';

// Названия категорий на русском
const categoryNames: Record<string, string> = {
  // Checkup v2 (10 шкал) - новая версия
  emotion_regulation: 'Регуляция эмоций',
  behavior: 'Поведение',
  executive_functions: 'Исполнительные функции',
  sensory_processing: 'Сенсорная обработка',
  communication: 'Коммуникация и речь',
  social_cognition: 'Социальное познание',
  identity: 'Самооценка',
  learning: 'Обучение',
  motivation: 'Мотивация',
  trauma: 'Травматический опыт',
  // Checkup v1 (SDQ) категории - старая версия для обратной совместимости
  emotional: 'Эмоциональные проблемы',
  conduct: 'Проблемы поведения',
  hyperactivity: 'Гиперактивность',
  peer_problems: 'Проблемы со сверстниками',
  prosocial: 'Просоциальное поведение',
  total_difficulties: 'Общие трудности',
  // Parent категории
  anxiety: 'Тревожность',
  depression: 'Депрессия',
  total: 'Общий балл',
  // Family категории
  family_stress: 'Семейный стресс',
  partner_relationship: 'Отношения с партнером',
  coparenting: 'Совместное воспитание',
};

// Цвета статусов
const statusColors: Record<string, string> = {
  typical: 'bg-green-100 text-green-800',
  borderline: 'bg-yellow-100 text-yellow-800',
  concerning: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  typical: 'Норма',
  borderline: 'Пограничный',
  concerning: 'Требует внимания',
};

export default function AssessmentsManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedAssessment, setSelectedAssessment] = useState<AdminAssessment | null>(null);

  const { data: assessments, isLoading } = useAdminAssessments();

  const filteredAssessments = assessments?.filter((assessment) => {
    const matchesSearch =
      assessment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assessment.profile?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assessment.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || assessment.status === statusFilter;
    const matchesType = typeFilter === 'all' || assessment.assessment_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Управление оценками</h1>
        <p className="text-muted-foreground mt-1">
          Всего оценок: {assessments?.length || 0}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Фильтры</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по ID, имени или email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="in_progress">В процессе</SelectItem>
                <SelectItem value="completed">Завершено</SelectItem>
                <SelectItem value="abandoned">Брошено</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                <SelectItem value="checkup">Чекап</SelectItem>
                <SelectItem value="parent">Родитель</SelectItem>
                <SelectItem value="family">Семья</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Список оценок</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Профиль</TableHead>
                <TableHead>Пользователь</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Начато</TableHead>
                <TableHead>Завершено</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssessments?.map((assessment) => (
                <TableRow key={assessment.id}>
                  <TableCell className="font-mono text-xs">
                    {assessment.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{assessment.assessment_type}</Badge>
                  </TableCell>
                  <TableCell>
                    {assessment.profile
                      ? `${assessment.profile.first_name} ${assessment.profile.last_name || ''}`.trim()
                      : '—'}
                  </TableCell>
                  <TableCell>{assessment.user?.email || '—'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        assessment.status === 'completed'
                          ? 'default'
                          : assessment.status === 'in_progress'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {assessment.status === 'completed'
                        ? 'Завершено'
                        : assessment.status === 'in_progress'
                        ? 'В процессе'
                        : 'Брошено'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(assessment.started_at), 'dd.MM.yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    {assessment.completed_at
                      ? format(new Date(assessment.completed_at), 'dd.MM.yyyy HH:mm')
                      : '—'}
                  </TableCell>
                  <TableCell>
                    {assessment.status === 'completed' && assessment.results_summary && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedAssessment(assessment)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Панель с результатами */}
      <Sheet open={!!selectedAssessment} onOpenChange={() => setSelectedAssessment(null)}>
        <SheetContent className="w-[400px] sm:w-[450px]">
          <SheetHeader>
            <SheetTitle>
              Результаты {selectedAssessment?.assessment_type === 'checkup' ? 'чекапа' : 'оценки'}
            </SheetTitle>
          </SheetHeader>

          {selectedAssessment && (
            <div className="mt-6 space-y-4">
              {/* Информация о профиле */}
              <div className="text-sm text-muted-foreground">
                <p><strong>Профиль:</strong> {selectedAssessment.profile?.first_name || '—'}</p>
                <p><strong>Дата:</strong> {selectedAssessment.completed_at
                  ? format(new Date(selectedAssessment.completed_at), 'dd.MM.yyyy HH:mm')
                  : '—'}</p>
                {selectedAssessment.results_summary?.version === 2 && (
                  <p><strong>Версия:</strong> v2 (10 шкал)</p>
                )}
                {selectedAssessment.results_summary?.age_group && (
                  <p><strong>Возрастная группа:</strong> {
                    selectedAssessment.results_summary.age_group === 'preschool' ? 'Дошкольник (3-6)' :
                    selectedAssessment.results_summary.age_group === 'elementary' ? 'Младший школьник (7-11)' :
                    selectedAssessment.results_summary.age_group === 'teenager' ? 'Подросток (12-18)' :
                    selectedAssessment.results_summary.age_group
                  }</p>
                )}
              </div>

              {/* Результаты по категориям */}
              <div className="space-y-2">
                {selectedAssessment.results_summary &&
                  Object.entries(selectedAssessment.results_summary)
                    .filter(([key]) => categoryNames[key] && !['version', 'age_group', 'calculated_at'].includes(key))
                    .map(([key, value]: [string, any]) => (
                      <div key={key} className="flex items-center justify-between p-2 rounded border">
                        <span className="text-sm">{categoryNames[key]}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{value?.score ?? value}</span>
                          {value?.status && (
                            <span className={`text-xs px-2 py-0.5 rounded ${statusColors[value.status] || ''}`}>
                              {statusLabels[value.status] || value.status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                }
              </div>

              {/* Worry tags если есть */}
              {selectedAssessment.results_summary?.worry_tags?.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Теги беспокойства:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedAssessment.results_summary.worry_tags.map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

