import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Edit } from 'lucide-react';
import { toast } from 'sonner';

interface AppointmentType {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  description: string | null;
  is_active: boolean;
}

interface Package {
  id: string;
  name: string;
  session_count: number;
  appointment_type_id: string;
  price: number;
  description: string | null;
  is_active: boolean;
}

const emptyType: Omit<AppointmentType, 'id'> = {
  name: '',
  duration_minutes: 60,
  price: 0,
  description: null,
  is_active: true,
};

const emptyPackage: Omit<Package, 'id'> = {
  name: '',
  session_count: 1,
  appointment_type_id: '',
  price: 0,
  description: null,
  is_active: true,
};

export default function ContentManagement() {
  const [activeTab, setActiveTab] = useState<'types' | 'packages'>('types');
  const [editingType, setEditingType] = useState<AppointmentType | null>(null);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [isCreatingType, setIsCreatingType] = useState(false);
  const [isCreatingPackage, setIsCreatingPackage] = useState(false);
  const [newType, setNewType] = useState<Omit<AppointmentType, 'id'>>(emptyType);
  const [newPackage, setNewPackage] = useState<Omit<Package, 'id'>>(emptyPackage);

  const queryClient = useQueryClient();

  const { data: types, isLoading: typesLoading } = useQuery<AppointmentType[]>({
    queryKey: ['appointment-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointment_types')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: packages, isLoading: packagesLoading } = useQuery<Package[]>({
    queryKey: ['packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const updateType = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AppointmentType> }) => {
      const { error } = await supabase
        .from('appointment_types')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment-types'] });
      toast.success('Тип консультации обновлен');
      setEditingType(null);
    },
  });

  const updatePackage = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Package> }) => {
      const { error } = await supabase
        .from('packages')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast.success('Пакет обновлен');
      setEditingPackage(null);
    },
  });

  const createType = useMutation({
    mutationFn: async (data: Omit<AppointmentType, 'id'>) => {
      const { error } = await supabase
        .from('appointment_types')
        .insert(data);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment-types'] });
      toast.success('Тип консультации создан');
      setIsCreatingType(false);
      setNewType(emptyType);
    },
    onError: (error: Error) => {
      toast.error(`Ошибка создания: ${error.message}`);
    },
  });

  const createPackage = useMutation({
    mutationFn: async (data: Omit<Package, 'id'>) => {
      const { error } = await supabase
        .from('packages')
        .insert(data);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast.success('Пакет создан');
      setIsCreatingPackage(false);
      setNewPackage(emptyPackage);
    },
    onError: (error: Error) => {
      toast.error(`Ошибка создания: ${error.message}`);
    },
  });

  if (typesLoading || packagesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Управление контентом</h1>
        <p className="text-muted-foreground mt-1">
          Управление типами консультаций и пакетами
        </p>
      </div>

      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === 'types' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('types')}
        >
          Типы консультаций
        </Button>
        <Button
          variant={activeTab === 'packages' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('packages')}
        >
          Пакеты
        </Button>
      </div>

      {activeTab === 'types' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Типы консультаций</CardTitle>
              <CardDescription>Управление типами и ценами консультаций</CardDescription>
            </div>
            <Button onClick={() => setIsCreatingType(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Создать тип
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Длительность</TableHead>
                  <TableHead>Цена</TableHead>
                  <TableHead>Активен</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {types?.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell>{type.name}</TableCell>
                    <TableCell>{type.duration_minutes} мин</TableCell>
                    <TableCell>{type.price} ₽</TableCell>
                    <TableCell>{type.is_active ? 'Да' : 'Нет'}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingType(type)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        {editingType && (
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Редактировать тип консультации</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div>
                                <Label>Название</Label>
                                <Input
                                  value={editingType.name}
                                  onChange={(e) =>
                                    setEditingType({ ...editingType, name: e.target.value })
                                  }
                                />
                              </div>
                              <div>
                                <Label>Длительность (минуты)</Label>
                                <Input
                                  type="number"
                                  value={editingType.duration_minutes}
                                  onChange={(e) =>
                                    setEditingType({
                                      ...editingType,
                                      duration_minutes: parseInt(e.target.value) || 0,
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <Label>Цена (₽)</Label>
                                <Input
                                  type="number"
                                  value={editingType.price}
                                  onChange={(e) =>
                                    setEditingType({
                                      ...editingType,
                                      price: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <Label>Описание</Label>
                                <Textarea
                                  value={editingType.description || ''}
                                  onChange={(e) =>
                                    setEditingType({
                                      ...editingType,
                                      description: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={editingType.is_active}
                                  onCheckedChange={(checked) =>
                                    setEditingType({ ...editingType, is_active: checked })
                                  }
                                />
                                <Label>Активен</Label>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setEditingType(null)}
                              >
                                Отмена
                              </Button>
                              <Button
                                onClick={() =>
                                  updateType.mutate({
                                    id: editingType.id,
                                    updates: editingType,
                                  })
                                }
                                disabled={updateType.isPending}
                              >
                                {updateType.isPending ? 'Сохранение...' : 'Сохранить'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        )}
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeTab === 'packages' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Пакеты</CardTitle>
              <CardDescription>Управление пакетами сессий</CardDescription>
            </div>
            <Button onClick={() => setIsCreatingPackage(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Создать пакет
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Количество сессий</TableHead>
                  <TableHead>Цена</TableHead>
                  <TableHead>Активен</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages?.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell>{pkg.name}</TableCell>
                    <TableCell>{pkg.session_count}</TableCell>
                    <TableCell>{pkg.price} ₽</TableCell>
                    <TableCell>{pkg.is_active ? 'Да' : 'Нет'}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingPackage(pkg)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        {editingPackage && (
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Редактировать пакет</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div>
                                <Label>Название</Label>
                                <Input
                                  value={editingPackage.name}
                                  onChange={(e) =>
                                    setEditingPackage({ ...editingPackage, name: e.target.value })
                                  }
                                />
                              </div>
                              <div>
                                <Label>Количество сессий</Label>
                                <Input
                                  type="number"
                                  value={editingPackage.session_count}
                                  onChange={(e) =>
                                    setEditingPackage({
                                      ...editingPackage,
                                      session_count: parseInt(e.target.value) || 0,
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <Label>Цена (₽)</Label>
                                <Input
                                  type="number"
                                  value={editingPackage.price}
                                  onChange={(e) =>
                                    setEditingPackage({
                                      ...editingPackage,
                                      price: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <Label>Описание</Label>
                                <Textarea
                                  value={editingPackage.description || ''}
                                  onChange={(e) =>
                                    setEditingPackage({
                                      ...editingPackage,
                                      description: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={editingPackage.is_active}
                                  onCheckedChange={(checked) =>
                                    setEditingPackage({ ...editingPackage, is_active: checked })
                                  }
                                />
                                <Label>Активен</Label>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setEditingPackage(null)}
                              >
                                Отмена
                              </Button>
                              <Button
                                onClick={() =>
                                  updatePackage.mutate({
                                    id: editingPackage.id,
                                    updates: editingPackage,
                                  })
                                }
                                disabled={updatePackage.isPending}
                              >
                                {updatePackage.isPending ? 'Сохранение...' : 'Сохранить'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        )}
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Диалог создания типа консультации */}
      <Dialog open={isCreatingType} onOpenChange={setIsCreatingType}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать тип консультации</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Название</Label>
              <Input
                value={newType.name}
                onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                placeholder="Например: Первичная консультация"
              />
            </div>
            <div>
              <Label>Длительность (минуты)</Label>
              <Input
                type="number"
                value={newType.duration_minutes}
                onChange={(e) =>
                  setNewType({
                    ...newType,
                    duration_minutes: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <Label>Цена (₽)</Label>
              <Input
                type="number"
                value={newType.price}
                onChange={(e) =>
                  setNewType({
                    ...newType,
                    price: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <Label>Описание</Label>
              <Textarea
                value={newType.description || ''}
                onChange={(e) =>
                  setNewType({
                    ...newType,
                    description: e.target.value || null,
                  })
                }
                placeholder="Описание типа консультации..."
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={newType.is_active}
                onCheckedChange={(checked) => setNewType({ ...newType, is_active: checked })}
              />
              <Label>Активен</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreatingType(false);
                setNewType(emptyType);
              }}
            >
              Отмена
            </Button>
            <Button
              onClick={() => createType.mutate(newType)}
              disabled={createType.isPending || !newType.name}
            >
              {createType.isPending ? 'Создание...' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог создания пакета */}
      <Dialog open={isCreatingPackage} onOpenChange={setIsCreatingPackage}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать пакет</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Название</Label>
              <Input
                value={newPackage.name}
                onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                placeholder="Например: Пакет из 5 консультаций"
              />
            </div>
            <div>
              <Label>Тип консультации</Label>
              <Select
                value={newPackage.appointment_type_id}
                onValueChange={(value) =>
                  setNewPackage({ ...newPackage, appointment_type_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тип консультации" />
                </SelectTrigger>
                <SelectContent>
                  {types?.filter(t => t.is_active).map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Количество сессий</Label>
              <Input
                type="number"
                value={newPackage.session_count}
                onChange={(e) =>
                  setNewPackage({
                    ...newPackage,
                    session_count: parseInt(e.target.value) || 1,
                  })
                }
                min={1}
              />
            </div>
            <div>
              <Label>Цена (₽)</Label>
              <Input
                type="number"
                value={newPackage.price}
                onChange={(e) =>
                  setNewPackage({
                    ...newPackage,
                    price: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <Label>Описание</Label>
              <Textarea
                value={newPackage.description || ''}
                onChange={(e) =>
                  setNewPackage({
                    ...newPackage,
                    description: e.target.value || null,
                  })
                }
                placeholder="Описание пакета..."
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={newPackage.is_active}
                onCheckedChange={(checked) =>
                  setNewPackage({ ...newPackage, is_active: checked })
                }
              />
              <Label>Активен</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreatingPackage(false);
                setNewPackage(emptyPackage);
              }}
            >
              Отмена
            </Button>
            <Button
              onClick={() => createPackage.mutate(newPackage)}
              disabled={createPackage.isPending || !newPackage.name || !newPackage.appointment_type_id}
            >
              {createPackage.isPending ? 'Создание...' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}












