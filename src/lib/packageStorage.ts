// Утилиты для работы с пакетами (packages) в Supabase
import { supabase } from './supabase';
import type { Database } from './supabase';
import { logger } from './logger';
import { getCurrentUser } from './profileStorage';

type Package = Database['public']['Tables']['packages']['Row'];
type PackageInsert = Database['public']['Tables']['packages']['Insert'];
type PackagePurchase = Database['public']['Tables']['package_purchases']['Row'];
type PackagePurchaseInsert = Database['public']['Tables']['package_purchases']['Insert'];
type PackagePurchaseUpdate = Database['public']['Tables']['package_purchases']['Update'];
type AppointmentType = Database['public']['Tables']['appointment_types']['Row'];

// ============================================
// Работа с пакетами
// ============================================

/**
 * Получить все активные пакеты
 */
export async function getPackages(): Promise<Package[]> {
  try {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('is_active', true)
      .order('session_count', { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    logger.error('Error getting packages:', error);
    throw error;
  }
}

/**
 * Получить пакеты с информацией о типе консультации
 */
export async function getPackagesWithType(): Promise<(Package & { appointment_type: AppointmentType })[]> {
  try {
    const { data, error } = await supabase
      .from('packages')
      .select(`
        *,
        appointment_type:appointment_types(*)
      `)
      .eq('is_active', true)
      .order('session_count', { ascending: true });

    if (error) throw error;

    // Преобразуем данные для удобства
    return (data || []).map((pkg: any) => ({
      ...pkg,
      appointment_type: pkg.appointment_type as AppointmentType,
    }));
  } catch (error) {
    logger.error('Error getting packages with type:', error);
    throw error;
  }
}

/**
 * Получить пакет по ID
 */
export async function getPackage(packageId: string): Promise<Package | null> {
  try {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('id', packageId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Error getting package:', error);
    return null;
  }
}

// ============================================
// Работа с покупками пакетов
// ============================================

/**
 * Получить все покупки пакетов текущего пользователя
 */
export async function getPackagePurchases(): Promise<PackagePurchase[]> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('package_purchases')
      .select('*')
      .eq('user_id', user.id)
      .order('purchased_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    logger.error('Error getting package purchases:', error);
    throw error;
  }
}

/**
 * Получить активные покупки пакетов (с оставшимися сессиями)
 */
export async function getActivePackagePurchases(): Promise<PackagePurchase[]> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('package_purchases')
      .select('*')
      .eq('user_id', user.id)
      .gt('sessions_remaining', 0)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('purchased_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    logger.error('Error getting active package purchases:', error);
    throw error;
  }
}

/**
 * Получить покупку пакета по ID
 */
export async function getPackagePurchase(purchaseId: string): Promise<PackagePurchase | null> {
  try {
    const { data, error } = await supabase
      .from('package_purchases')
      .select('*')
      .eq('id', purchaseId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Error getting package purchase:', error);
    return null;
  }
}

/**
 * Создать покупку пакета
 */
export async function createPackagePurchase(
  packageId: string,
  paymentId?: string | null,
  expiresAt?: string | null
): Promise<PackagePurchase> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Получаем информацию о пакете
    const pkg = await getPackage(packageId);
    if (!pkg) {
      throw new Error('Package not found');
    }

    const purchaseData: PackagePurchaseInsert = {
      user_id: user.id,
      package_id: packageId,
      sessions_remaining: pkg.session_count,
      payment_id: paymentId || null,
      expires_at: expiresAt || null,
    };

    const { data, error } = await supabase
      .from('package_purchases')
      .insert(purchaseData)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    logger.error('Error creating package purchase:', error);
    throw error;
  }
}

/**
 * Использовать сессию из пакета (уменьшить sessions_remaining)
 */
export async function consumePackageSession(purchaseId: string): Promise<PackagePurchase> {
  try {
    const purchase = await getPackagePurchase(purchaseId);
    if (!purchase) {
      throw new Error('Package purchase not found');
    }

    if (purchase.sessions_remaining <= 0) {
      throw new Error('No sessions remaining in this package');
    }

    const updates: PackagePurchaseUpdate = {
      sessions_remaining: purchase.sessions_remaining - 1,
    };

    const { data, error } = await supabase
      .from('package_purchases')
      .update(updates)
      .eq('id', purchaseId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    logger.error('Error using package session:', error);
    throw error;
  }
}

/**
 * Получить покупки пакетов с информацией о пакете
 */
export async function getPackagePurchasesWithPackage(): Promise<(PackagePurchase & { package: Package })[]> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('package_purchases')
      .select(`
        *,
        package:packages(*)
      `)
      .eq('user_id', user.id)
      .order('purchased_at', { ascending: false });

    if (error) throw error;

    // Преобразуем данные для удобства
    return (data || []).map((purchase: any) => ({
      ...purchase,
      package: purchase.package as Package,
    }));
  } catch (error) {
    logger.error('Error getting package purchases with package:', error);
    throw error;
  }
}













