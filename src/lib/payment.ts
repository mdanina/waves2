// Утилиты для работы с платежами
import { supabase } from './supabase';
import type { Database } from './supabase';
import { logger } from './logger';
import { getCurrentUser } from './profileStorage';

type Payment = Database['public']['Tables']['payments']['Row'];
type PaymentInsert = Database['public']['Tables']['payments']['Insert'];
type PaymentUpdate = Database['public']['Tables']['payments']['Update'];

export type PaymentMethod = 'yookassa' | 'stripe' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';

export interface CreatePaymentParams {
  amount: number;
  currency?: string;
  paymentMethod: PaymentMethod;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  payment: Payment;
  paymentUrl?: string; // URL для редиректа на страницу оплаты
}

// ============================================
// Работа с платежами
// ============================================

/**
 * Создать платеж
 */
export async function createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const paymentData: PaymentInsert = {
      user_id: user.id,
      amount: params.amount,
      currency: params.currency || 'RUB',
      payment_method: params.paymentMethod,
      status: 'pending',
      metadata: params.metadata || null,
    };

    const { data: payment, error } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (error) throw error;

    // В зависимости от метода оплаты, создаем платеж во внешней системе
    let paymentUrl: string | undefined;

    if (params.paymentMethod === 'yookassa') {
      paymentUrl = await createYooKassaPayment(payment, params);
    } else if (params.paymentMethod === 'stripe') {
      paymentUrl = await createStripePayment(payment, params);
    }

    return {
      payment,
      paymentUrl,
    };
  } catch (error) {
    logger.error('Error creating payment:', error);
    throw error;
  }
}

/**
 * Обновить статус платежа
 */
export async function updatePaymentStatus(
  paymentId: string,
  status: PaymentStatus,
  externalPaymentId?: string
): Promise<Payment> {
  try {
    const updates: PaymentUpdate = {
      status,
      ...(externalPaymentId && { external_payment_id: externalPaymentId }),
    };

    const { data, error } = await supabase
      .from('payments')
      .update(updates)
      .eq('id', paymentId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    logger.error('Error updating payment status:', error);
    throw error;
  }
}

/**
 * Получить платеж по ID
 */
export async function getPayment(paymentId: string): Promise<Payment | null> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Error getting payment:', error);
    return null;
  }
}

/**
 * Получить платежи текущего пользователя
 */
export async function getPayments(): Promise<Payment[]> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    logger.error('Error getting payments:', error);
    throw error;
  }
}

// ============================================
// Интеграция с платежными системами
// ============================================

/**
 * Нормализует API URL - добавляет /api если отсутствует
 * и обрабатывает относительные пути
 */
function normalizeApiUrl(url: string): string {
  let cleanUrl = url.replace(/\/$/, '');

  // Если URL относительный, добавляем origin
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const path = cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
    cleanUrl = `${origin}${path}`;
  }

  // Добавляем /api если не заканчивается на /api
  if (!cleanUrl.endsWith('/api')) {
    return `${cleanUrl}/api`;
  }
  return cleanUrl;
}

/**
 * Создать платеж в ЮKassa через API сервер
 */
async function createYooKassaPayment(
  payment: Payment,
  params: CreatePaymentParams
): Promise<string | undefined> {
  try {
    // VITE_API_URL - базовый URL API сервера (с или без /api)
    const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const apiUrl = normalizeApiUrl(rawApiUrl);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      logger.error('User not authenticated');
      throw new Error('User not authenticated');
    }

    logger.info(`Creating YooKassa payment via API: ${payment.id}`);

    const response = await fetch(`${apiUrl}/payments/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        amount: params.amount,
        currency: params.currency || 'RUB',
        metadata: params.metadata,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      logger.error('Error creating payment via API:', error);
      throw new Error(error.error || 'Failed to create payment');
    }

    const data = await response.json();
    logger.info(`Payment created successfully, confirmation_token received`);
    return data.confirmation_token;
  } catch (error) {
    logger.error('Error creating YooKassa payment:', error);
    throw error;
  }
}

/**
 * Создать платеж в Stripe
 * ВАЖНО: Для работы требуется backend endpoint или Supabase Edge Function
 */
async function createStripePayment(
  payment: Payment,
  params: CreatePaymentParams
): Promise<string | undefined> {
  try {
    // Проверяем наличие переменных окружения
    const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

    if (!stripePublishableKey) {
      logger.warn('Stripe credentials not configured. Payment URL will not be generated.');
      return undefined;
    }

    // ВАЖНО: В реальном приложении создание платежа должно происходить на backend
    // для безопасности (секретный ключ не должен быть в frontend коде)
    // Здесь показана базовая структура, но в продакшене нужен backend endpoint

    // Пример структуры запроса к Stripe API (должен быть на backend)
    // const response = await fetch('/api/payments/stripe/create', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     amount: Math.round(payment.amount * 100), // Stripe использует центы
    //     currency: payment.currency?.toLowerCase() || 'rub',
    //     payment_id: payment.id,
    //     success_url: `${window.location.origin}/payment/success?payment_id=${payment.id}`,
    //     cancel_url: `${window.location.origin}/payment/cancel?payment_id=${payment.id}`,
    //   }),
    // });
    // const { url } = await response.json();
    // return url;

    // Для MVP: возвращаем заглушку
    logger.warn('Stripe integration requires backend endpoint. Using placeholder.');
    // Используем env variable или безопасно строим URL через URL constructor
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const url = new URL('/payment/process', baseUrl);
    url.searchParams.set('payment_id', payment.id);
    return url.toString();
  } catch (error) {
    logger.error('Error creating Stripe payment:', error);
    return undefined;
  }
}

/**
 * Проверить статус платежа во внешней системе
 * Вызывается через webhook или polling
 */
export async function checkPaymentStatus(paymentId: string): Promise<PaymentStatus> {
  try {
    const payment = await getPayment(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    // Если платеж уже завершен, возвращаем его статус
    if (payment.status === 'completed' || payment.status === 'failed' || payment.status === 'cancelled') {
      return payment.status;
    }

    // Для проверки статуса нужен backend endpoint
    // const response = await fetch(`/api/payments/${payment.payment_method}/status`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     payment_id: payment.id,
    //     external_payment_id: payment.external_payment_id,
    //   }),
    // });
    // const { status } = await response.json();
    // await updatePaymentStatus(paymentId, status);
    // return status;

    // Для MVP: возвращаем текущий статус
    return payment.status;
  } catch (error) {
    logger.error('Error checking payment status:', error);
    throw error;
  }
}

/**
 * Проверить статус платежа через API сервер
 */
export async function verifyPaymentWithAPI(paymentId: string): Promise<PaymentStatus> {
  try {
    // VITE_API_URL - базовый URL API сервера (с или без /api)
    const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const apiUrl = normalizeApiUrl(rawApiUrl);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      logger.error('User not authenticated');
      throw new Error('User not authenticated');
    }

    logger.info(`Verifying payment via API: ${paymentId}`);

    const response = await fetch(`${apiUrl}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ payment_id: paymentId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      logger.error('Error verifying payment via API:', error);
      throw new Error(error.error || 'Failed to verify payment');
    }

    const data = await response.json();
    await updatePaymentStatus(paymentId, data.status as PaymentStatus);
    logger.info(`Payment verified, status: ${data.status}`);
    return data.status as PaymentStatus;
  } catch (error) {
    logger.error('Error verifying payment:', error);
    throw error;
  }
}

/**
 * Форматировать сумму для отображения
 */
export function formatAmount(amount: number, currency: string = 'RUB'): string {
  const formatter = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return formatter.format(amount);
}





