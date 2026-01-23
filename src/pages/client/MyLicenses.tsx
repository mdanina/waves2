import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SerifHeading } from '@/components/design-system/SerifHeading';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users,
  Plus,
  Check,
  Smartphone,
  Calendar,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Crown,
  User,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useProfiles } from '@/hooks/useProfiles';
import { useDevice } from '@/hooks/useDevice';
import { SeatDevicesManager } from '@/components/client/SeatDevicesManager';
import {
  License,
  LicenseSeat,
  LICENSE_PLANS,
  LICENSE_STATUS_LABELS,
  LICENSE_STATUS_COLORS,
  getLicensePlan,
  formatPrice,
  isLicenseExpiringSoon,
} from '@/types/license';

// Mock hook for licenses (to be replaced with real API)
function useLicenses() {
  const { user } = useAuth();

  // Mock: no licenses by default
  // Change this for testing different states
  const [licenses, setLicenses] = useState<License[]>([]);
  const [seats, setSeats] = useState<LicenseSeat[]>([]);

  const loading = false;
  const error = null;

  const purchaseLicense = async (planType: License['plan_type']) => {
    // Mock purchase
    await new Promise(resolve => setTimeout(resolve, 1000));

    const plan = getLicensePlan(planType);
    if (!plan) throw new Error('Invalid plan');

    const newLicense: License = {
      id: `license_${Date.now()}`,
      user_id: user?.id || '',
      plan_type: planType,
      status: 'active',
      starts_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 days
      auto_renew: true,
      max_seats: plan.maxSeats,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setLicenses(prev => [...prev, newLicense]);
    return newLicense;
  };

  const assignSeat = async (licenseId: string, profileId: string, profile: LicenseSeat['profile']) => {
    const license = licenses.find(l => l.id === licenseId);
    if (!license) throw new Error('License not found');

    const existingSeats = seats.filter(s => s.license_id === licenseId);
    if (existingSeats.length >= license.max_seats) {
      throw new Error('No available seats');
    }

    const newSeat: LicenseSeat = {
      id: `seat_${Date.now()}`,
      license_id: licenseId,
      profile_id: profileId,
      profile,
      assigned_at: new Date().toISOString(),
    };

    setSeats(prev => [...prev, newSeat]);
    return newSeat;
  };

  const removeSeat = async (seatId: string) => {
    setSeats(prev => prev.filter(s => s.id !== seatId));
  };

  const linkDevice = async (licenseId: string, deviceId: string) => {
    setLicenses(prev => prev.map(l => 
      l.id === licenseId ? { ...l, device_id: deviceId, updated_at: new Date().toISOString() } : l
    ));
  };

  return {
    licenses,
    seats,
    loading,
    error,
    purchaseLicense,
    assignSeat,
    removeSeat,
    linkDevice,
    hasLicense: licenses.length > 0,
  };
}

export default function MyLicenses() {
  const navigate = useNavigate();
  const { data: profiles } = useProfiles();
  const {
    licenses,
    seats,
    loading,
    purchaseLicense,
    assignSeat,
    removeSeat,
    linkDevice,
    hasLicense,
  } = useLicenses();
  
  const { device, hasDevice } = useDevice();

  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'individual' | 'family' | null>(null);

  const handlePurchase = async (planType: 'individual' | 'family') => {
    setIsPurchasing(true);
    try {
      await purchaseLicense(planType);
      // Устанавливаем флаг, что лицензия куплена
      sessionStorage.setItem('license_purchased', 'true');
      toast.success('Лицензия успешно приобретена!');
      setShowPurchaseDialog(false);
      setSelectedPlan(null);
    } catch (error) {
      toast.error('Ошибка при покупке лицензии');
    } finally {
      setIsPurchasing(false);
    }
  };

  const getSeatsForLicense = (licenseId: string) => {
    return seats.filter(s => s.license_id === licenseId);
  };

  const getAvailableProfiles = (licenseId: string) => {
    const assignedProfileIds = seats
      .filter(s => s.license_id === licenseId)
      .map(s => s.profile_id);

    return (profiles || []).filter(p => !assignedProfileIds.includes(p.id));
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Заголовок */}
      <div className="mb-8">
        <SerifHeading size="2xl" className="mb-2">
          Мои лицензии
        </SerifHeading>
      </div>

      {/* Нет лицензий - показываем планы */}
      {!hasLicense && (
        <div className="space-y-6">
          <Card className="glass-elegant border-0 p-6 sm:p-8">
            <div className="text-center max-w-md mx-auto mb-8">
              <SerifHeading size="xl" className="mb-3">
                У вас нет активных лицензий
              </SerifHeading>
              <p className="text-muted-foreground">
                Выберите подходящий план, чтобы начать использовать Waves
              </p>
            </div>

            {/* Планы */}
            <div className="grid gap-6 md:grid-cols-2">
              {LICENSE_PLANS.map((plan) => (
                <Card
                  key={plan.id}
                  className={cn(
                    'relative p-6 transition-all cursor-pointer hover:shadow-lg bg-white border-0',
                    selectedPlan === plan.id
                      ? 'bg-coral/5'
                      : 'hover:bg-coral/5'
                  )}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.id === 'family' && (
                    <Badge className="absolute -top-2 -right-2 bg-honey text-ink">
                      <Crown className="h-3 w-3 mr-1" />
                      Популярный
                    </Badge>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    {plan.id === 'individual' ? (
                      <User className="h-8 w-8 text-coral" />
                    ) : (
                      <Users className="h-8 w-8 text-coral" />
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-3xl font-bold">{formatPrice(plan.price)}</span>
                      {plan.id === 'individual' && (
                        <span className="text-sm text-muted-foreground">или 3 333 ₽/мес</span>
                      )}
                      {plan.id === 'family' && (
                        <span className="text-sm text-muted-foreground">или 5 000 ₽/мес</span>
                      )}
                    </div>
                    {(plan.id === 'individual' || plan.id === 'family') && (
                      <p className="text-xs text-muted-foreground">Рассрочка на 24 месяца без переплаты</p>
                    )}
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-coral flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={cn(
                      'w-full',
                      selectedPlan === plan.id
                        ? 'bg-gradient-to-r from-coral to-coral-light'
                        : ''
                    )}
                    variant={selectedPlan === plan.id ? 'default' : 'outline'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePurchase(plan.id);
                    }}
                    disabled={isPurchasing}
                  >
                    {isPurchasing && selectedPlan === plan.id
                      ? 'Оформление...'
                      : 'Выбрать план'
                    }
                  </Button>
                </Card>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Есть лицензии - показываем список */}
      {hasLicense && (
        <div className="space-y-6">
          {licenses.map((license) => {
            const plan = getLicensePlan(license.plan_type);
            const licenseSeats = getSeatsForLicense(license.id);
            const availableProfiles = getAvailableProfiles(license.id);
            const availableSlotsCount = license.max_seats - licenseSeats.length;
            const isExpiring = isLicenseExpiringSoon(license);

            return (
              <Card key={license.id} className="bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] border-0 p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral/20 to-coral/10 flex items-center justify-center">
                      {license.plan_type === 'individual' ? (
                        <User className="h-6 w-6 text-coral" />
                      ) : (
                        <Users className="h-6 w-6 text-coral" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{plan?.name || 'Лицензия'}</h3>
                      <p className="text-sm text-muted-foreground">{plan?.description}</p>
                    </div>
                  </div>
                  <Badge 
                    className={cn(LICENSE_STATUS_COLORS[license.status], 'border-0 !from-transparent !to-transparent')}
                    style={license.status === 'active' ? {
                      background: 'white',
                      backgroundImage: 'none',
                      border: '1px solid rgba(34, 197, 94, 0.3)'
                    } : { backgroundImage: 'none' }}
                  >
                    {LICENSE_STATUS_LABELS[license.status]}
                  </Badge>
                </div>

                {/* Warning if expiring */}
                {isExpiring && (
                  <div className="mb-6 flex items-center gap-2 p-3 bg-honey/10 border border-honey/30 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-honey" />
                    <span className="text-sm">
                      Лицензия истекает{' '}
                      {new Date(license.expires_at).toLocaleDateString('ru-RU')}
                    </span>
                    <Button variant="link" size="sm" className="ml-auto h-auto p-0">
                      Продлить
                    </Button>
                  </div>
                )}

                {/* Info */}
                <div className="grid gap-4 sm:grid-cols-3 mb-6">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Действует до</p>
                    <p className="font-medium">
                      {new Date(license.expires_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Участники</p>
                    <p className="font-medium">
                      {licenseSeats.length} из {license.max_seats}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Устройство</p>
                    <p className="font-medium">
                      {license.device_id ? 'Подключено' : 'Не привязано'}
                    </p>
                  </div>
                </div>

                {/* Participants */}
                <div className="border-t border-border/50 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Участники</h4>
                    {availableSlotsCount > 0 && availableProfiles.length > 0 && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-1" />
                            Добавить
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Добавить участника</DialogTitle>
                            <DialogDescription>
                              Выберите профиль для добавления в лицензию
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-2 mt-4">
                            {availableProfiles.map((profile) => (
                              <div
                                key={profile.id}
                                className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={async () => {
                                  try {
                                    await assignSeat(license.id, profile.id, {
                                      id: profile.id,
                                      first_name: profile.first_name,
                                      last_name: profile.last_name || undefined,
                                      type: profile.type as 'parent' | 'child',
                                    });
                                    toast.success(`${profile.first_name} добавлен в лицензию`);
                                  } catch (error) {
                                    toast.error('Ошибка при добавлении участника');
                                  }
                                }}
                              >
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback>
                                    {profile.first_name[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <p className="font-medium">
                                    {profile.first_name} {profile.last_name || ''}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {profile.type === 'parent' ? 'Родитель' : 'Ребёнок'}
                                  </p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>

                  {licenseSeats.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Нет добавленных участников
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {licenseSeats.map((seat) => (
                        <div
                          key={seat.id}
                          className="p-4 bg-muted/30 rounded-xl space-y-4"
                        >
                          {/* Информация об участнике */}
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {seat.profile?.first_name?.[0] || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium">
                                {seat.profile?.first_name} {seat.profile?.last_name || ''}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {seat.profile?.type === 'parent' ? 'Родитель' : 'Ребёнок'} · Добавлен {new Date(seat.assigned_at).toLocaleDateString('ru-RU')}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => {
                                removeSeat(seat.id);
                                toast.success('Участник удалён');
                              }}
                            >
                              Удалить
                            </Button>
                          </div>

                          {/* Устройства этого участника */}
                          <div className="pl-13">
                            <SeatDevicesManager
                              seatId={seat.id}
                              profileName={seat.profile?.first_name}
                              profileType={seat.profile?.type}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {availableSlotsCount > 0 && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Доступно ещё {availableSlotsCount}{' '}
                      {availableSlotsCount === 1 ? 'место' : 'места'}
                    </p>
                  )}
                </div>

                {/* Физическое устройство */}
                <div className="mt-6 pt-6 border-t border-border/50">
                  <h4 className="font-medium mb-4">Физическое устройство</h4>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={async () => {
                      // Если устройство не привязано и есть устройство у пользователя
                      if (!license.device_id && hasDevice && device) {
                        try {
                          await linkDevice(license.id, device.id);
                          toast.success('Устройство успешно привязано к лицензии');
                        } catch (error) {
                          toast.error('Ошибка при привязке устройства');
                        }
                      }
                      navigate('/cabinet/device');
                    }}
                  >
                    <Smartphone className="h-4 w-4 mr-2" />
                    {license.device_id ? 'Управление устройством' : 'Привязать устройство'}
                  </Button>
                </div>
              </Card>
            );
          })}

          {/* Add new license button */}
          <Card
            className="bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] border-0 p-6 text-center cursor-pointer hover:bg-coral/5 transition-colors"
            onClick={() => setShowPurchaseDialog(true)}
          >
            <Plus className="h-8 w-8 text-coral mx-auto mb-2" />
            <p className="text-foreground">Приобрести ещё одну лицензию</p>
          </Card>
        </div>
      )}

      {/* Purchase dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Выбор лицензии</DialogTitle>
            <DialogDescription>
              Выберите план, который подходит вам
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2 mt-4">
            {LICENSE_PLANS.map((plan) => (
              <Card
                key={plan.id}
                className={cn(
                  'relative p-4 border-2 cursor-pointer transition-all',
                  selectedPlan === plan.id
                    ? 'border-coral bg-coral/5'
                    : 'border-border/50 hover:border-coral/50'
                )}
                onClick={() => setSelectedPlan(plan.id)}
              >
                <h4 className="font-semibold">{plan.name}</h4>
                <p className="text-sm text-muted-foreground mb-2">{plan.description}</p>
                <p className="text-xl font-bold">
                  {formatPrice(plan.price)}
                  <span className="text-sm font-normal text-muted-foreground"> / мес</span>
                </p>
              </Card>
            ))}
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowPurchaseDialog(false)}>
              Отмена
            </Button>
            <Button
              onClick={() => selectedPlan && handlePurchase(selectedPlan)}
              disabled={!selectedPlan || isPurchasing}
              className="bg-gradient-to-r from-coral to-coral-light"
            >
              {isPurchasing ? 'Оформление...' : 'Оформить'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
