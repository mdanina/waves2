import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAdminUsers, useUpdateUser } from '@/hooks/admin/useAdminUsers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2, Search, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { editUserSchema, type EditUserInput } from '@/lib/validation/adminSchemas';
import type { AdminUser } from '@/hooks/admin/useAdminUsers';

export default function UsersManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, isLoading } = useAdminUsers({ page, limit });
  const updateUser = useUpdateUser();

  const form = useForm<EditUserInput>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      email: '',
      phone: '',
      region: '',
      role: 'user',
      marketing_consent: false,
    },
  });

  const users = data?.users || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.includes(searchQuery) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: newPage.toString(), limit: limit.toString() });
  };

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user.id);
    form.reset({
      email: user.email || '',
      phone: user.phone || '',
      region: user.region || '',
      role: user.role || 'user',
      marketing_consent: user.marketing_consent || false,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async (data: EditUserInput) => {
    if (!editingUser) return;

    await updateUser.mutateAsync({
      id: editingUser,
      updates: {
        email: data.email || null,
        phone: data.phone || null,
        region: data.region || null,
        role: data.role,
        marketing_consent: data.marketing_consent,
      },
    });

    setEditingUser(null);
    setIsDialogOpen(false);
    form.reset();
  };

  const handleCancel = () => {
    setEditingUser(null);
    setIsDialogOpen(false);
    form.reset();
  };

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
        <h1 className="text-3xl font-bold">Управление пользователями</h1>
        <p className="text-muted-foreground mt-1">
          Всего пользователей: {total} | Страница {page} из {totalPages}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Поиск пользователей</CardTitle>
          <CardDescription>Найдите пользователя по email, телефону, ФИО или ID</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по email, телефону или ФИО..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Список пользователей</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ФИО</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Регион</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead>Маркетинг</TableHead>
                <TableHead>Дата регистрации</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    {user.first_name || user.last_name
                      ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                      : '—'}
                  </TableCell>
                  <TableCell>{user.email || '—'}</TableCell>
                  <TableCell>{user.phone || '—'}</TableCell>
                  <TableCell>{user.region || '—'}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        user.role === 'super_admin'
                          ? 'bg-purple-100 text-purple-800'
                          : user.role === 'admin'
                          ? 'bg-red-100 text-red-800'
                          : user.role === 'support'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>{user.marketing_consent ? 'Да' : 'Нет'}</TableCell>
                  <TableCell>
                    {format(new Date(user.created_at), 'dd.MM.yyyy')}
                  </TableCell>
                  <TableCell>
                    <Dialog open={isDialogOpen && editingUser === user.id} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Редактировать пользователя</DialogTitle>
                          <DialogDescription>
                            Измените данные пользователя
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 py-4">
                            <FormField
                              control={form.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="user@example.com" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Телефон</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="+79991234567" />
                                  </FormControl>
                                  <FormDescription>
                                    Формат: +7XXXXXXXXXX
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="region"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Регион</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Москва" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="role"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Роль</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="user">Пользователь</SelectItem>
                                      <SelectItem value="support">Поддержка</SelectItem>
                                      <SelectItem value="admin">Администратор</SelectItem>
                                      <SelectItem value="super_admin">Супер-администратор</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="marketing_consent"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <input
                                      type="checkbox"
                                      checked={field.value}
                                      onChange={field.onChange}
                                      className="mt-1"
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel>Согласие на маркетинг</FormLabel>
                                  </div>
                                </FormItem>
                              )}
                            />
                            <DialogFooter>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                              >
                                Отмена
                              </Button>
                              <Button type="submit" disabled={updateUser.isPending}>
                                {updateUser.isPending ? 'Сохранение...' : 'Сохранить'}
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Пагинация */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div className="text-sm text-muted-foreground">
              Показано {(page - 1) * limit + 1} - {Math.min(page * limit, total)} из {total}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
                Предыдущая
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      disabled={isLoading}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages || isLoading}
              >
                Следующая
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

