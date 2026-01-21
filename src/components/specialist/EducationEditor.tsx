/**
 * Компонент для редактирования образования специалиста
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  GraduationCap,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Building2,
  Calendar,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { SpecialistEducation } from '@/contexts/SpecialistAuthContext';

const EDUCATION_TYPES = [
  { value: 'higher', label: 'Высшее образование' },
  { value: 'additional', label: 'Дополнительное образование' },
  { value: 'certification', label: 'Сертификация' },
  { value: 'course', label: 'Курс / Повышение квалификации' },
];

const DEGREES = [
  { value: 'bachelor', label: 'Бакалавр' },
  { value: 'specialist', label: 'Специалист' },
  { value: 'master', label: 'Магистр' },
  { value: 'candidate', label: 'Кандидат наук' },
  { value: 'doctor', label: 'Доктор наук' },
  { value: 'certificate', label: 'Сертификат' },
  { value: 'diploma', label: 'Диплом' },
];

interface EducationEditorProps {
  specialistId: string;
}

interface EducationFormData {
  institution: string;
  specialty: string;
  degree: string;
  year_start: string;
  year_end: string;
  education_type: 'higher' | 'additional' | 'certification' | 'course';
}

const emptyFormData: EducationFormData = {
  institution: '',
  specialty: '',
  degree: '',
  year_start: '',
  year_end: '',
  education_type: 'higher',
};

export default function EducationEditor({ specialistId }: EducationEditorProps) {
  const { toast } = useToast();
  const [education, setEducation] = useState<SpecialistEducation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Диалог редактирования
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EducationFormData>(emptyFormData);

  // Загрузка образования
  useEffect(() => {
    loadEducation();
  }, [specialistId]);

  const loadEducation = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('specialist_education')
        .select('*')
        .eq('specialist_id', specialistId)
        .order('display_order', { ascending: true })
        .order('year_end', { ascending: false, nullsFirst: false });

      if (error) throw error;
      setEducation(data || []);
    } catch (error) {
      console.error('Error loading education:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные об образовании',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Открыть диалог для добавления
  const handleAdd = () => {
    setEditingId(null);
    setFormData(emptyFormData);
    setIsDialogOpen(true);
  };

  // Открыть диалог для редактирования
  const handleEdit = (item: SpecialistEducation) => {
    setEditingId(item.id);
    setFormData({
      institution: item.institution,
      specialty: item.specialty || '',
      degree: item.degree || '',
      year_start: item.year_start?.toString() || '',
      year_end: item.year_end?.toString() || '',
      education_type: item.education_type,
    });
    setIsDialogOpen(true);
  };

  // Сохранить образование
  const handleSave = async () => {
    if (!formData.institution.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Укажите учебное заведение',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);

      const educationData = {
        specialist_id: specialistId,
        institution: formData.institution.trim(),
        specialty: formData.specialty.trim() || null,
        degree: formData.degree || null,
        year_start: formData.year_start ? parseInt(formData.year_start) : null,
        year_end: formData.year_end ? parseInt(formData.year_end) : null,
        education_type: formData.education_type,
      };

      if (editingId) {
        // Обновление
        const { error } = await supabase
          .from('specialist_education')
          .update(educationData)
          .eq('id', editingId);

        if (error) throw error;

        toast({
          title: 'Сохранено',
          description: 'Образование обновлено',
        });
      } else {
        // Создание
        const { error } = await supabase
          .from('specialist_education')
          .insert(educationData);

        if (error) throw error;

        toast({
          title: 'Добавлено',
          description: 'Образование добавлено в профиль',
        });
      }

      setIsDialogOpen(false);
      loadEducation();
    } catch (error) {
      console.error('Error saving education:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить данные',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Удалить образование
  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(id);
      const { error } = await supabase
        .from('specialist_education')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Удалено',
        description: 'Запись об образовании удалена',
      });

      loadEducation();
    } catch (error) {
      console.error('Error deleting education:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить запись',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  // Получить название типа образования
  const getEducationTypeLabel = (type: string) => {
    return EDUCATION_TYPES.find(t => t.value === type)?.label || type;
  };

  // Получить название степени
  const getDegreeLabel = (degree: string | null) => {
    if (!degree) return null;
    return DEGREES.find(d => d.value === degree)?.label || degree;
  };

  // Форматировать годы
  const formatYears = (start: number | null, end: number | null) => {
    if (start && end) return `${start} - ${end}`;
    if (end) return `${end}`;
    if (start) return `с ${start}`;
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Образование
          </CardTitle>
          <Button size="sm" onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить
          </Button>
        </CardHeader>
        <CardContent>
          {education.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Нет данных об образовании. Добавьте информацию о вашем образовании,
              чтобы клиенты могли лучше вас узнать.
            </p>
          ) : (
            <div className="space-y-4">
              {education.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{item.institution}</span>
                    </div>
                    {item.specialty && (
                      <p className="text-sm text-muted-foreground pl-6">
                        {item.specialty}
                        {getDegreeLabel(item.degree) && ` • ${getDegreeLabel(item.degree)}`}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground pl-6">
                      {formatYears(item.year_start, item.year_end) && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatYears(item.year_start, item.year_end)}
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-muted rounded text-xs">
                        {getEducationTypeLabel(item.education_type)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                      disabled={isDeleting === item.id}
                    >
                      {isDeleting === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Диалог редактирования */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Редактировать образование' : 'Добавить образование'}
            </DialogTitle>
            <DialogDescription>
              Укажите информацию о вашем образовании
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="education_type">Тип образования</Label>
              <Select
                value={formData.education_type}
                onValueChange={(value: EducationFormData['education_type']) =>
                  setFormData({ ...formData, education_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EDUCATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="institution">Учебное заведение *</Label>
              <Input
                id="institution"
                value={formData.institution}
                onChange={(e) =>
                  setFormData({ ...formData, institution: e.target.value })
                }
                placeholder="Название учебного заведения"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialty">Специальность / Направление</Label>
              <Input
                id="specialty"
                value={formData.specialty}
                onChange={(e) =>
                  setFormData({ ...formData, specialty: e.target.value })
                }
                placeholder="Например: Клиническая психология"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="degree">Степень / Квалификация</Label>
              <Select
                value={formData.degree}
                onValueChange={(value) =>
                  setFormData({ ...formData, degree: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите степень" />
                </SelectTrigger>
                <SelectContent>
                  {DEGREES.map((degree) => (
                    <SelectItem key={degree.value} value={degree.value}>
                      {degree.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year_start">Год начала</Label>
                <Input
                  id="year_start"
                  type="number"
                  min="1950"
                  max={new Date().getFullYear()}
                  value={formData.year_start}
                  onChange={(e) =>
                    setFormData({ ...formData, year_start: e.target.value })
                  }
                  placeholder="2015"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year_end">Год окончания</Label>
                <Input
                  id="year_end"
                  type="number"
                  min="1950"
                  max={new Date().getFullYear() + 10}
                  value={formData.year_end}
                  onChange={(e) =>
                    setFormData({ ...formData, year_end: e.target.value })
                  }
                  placeholder="2020"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
            >
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                'Сохранить'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
