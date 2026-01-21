// Локальная эмуляция Supabase или реальный Supabase клиент
// Использует локальную БД если переменные окружения не установлены

import { getLocalSupabase, LocalSupabase } from './local-db';
import { logger } from './logger';

// Проверяем, есть ли переменные окружения для Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseInstance: any = null;
let useLocalDB = false;
let initPromise: Promise<any> | null = null;

// Инициализация: используем локальную БД если нет переменных окружения
async function initializeSupabase() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    logger.log('Using local database emulation (no Supabase credentials found)');
    useLocalDB = true;
    supabaseInstance = await getLocalSupabase();
    return supabaseInstance;
  }

  // Используем реальный Supabase
  try {
    const { createClient } = await import('@supabase/supabase-js');
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return supabaseInstance;
  } catch (error) {
    logger.error('Failed to initialize Supabase, falling back to local DB:', error);
    useLocalDB = true;
    supabaseInstance = await getLocalSupabase();
    return supabaseInstance;
  }
}

// Инициализируем при первом импорте
initPromise = initializeSupabase();

// Создаем прокси для асинхронной инициализации
function createAsyncProxy() {
  return new Proxy({} as any, {
    get(target, prop: string | symbol) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        return undefined;
      }

      // Если это свойство (например, auth, from, channel), возвращаем прокси
      if (typeof prop === 'string') {
        // Если экземпляр уже инициализирован, возвращаем значение синхронно
        if (supabaseInstance) {
          const instance = supabaseInstance;
          if (instance && typeof instance[prop] === 'function') {
            // Возвращаем функцию, которая вызывает метод напрямую
            return (...args: any[]) => instance[prop](...args);
          }
          if (instance && instance[prop]) {
            // Если это объект (например, auth), возвращаем его напрямую
            return instance[prop];
          }
        }

        // Если не инициализирован, возвращаем прокси для свойства (например, auth)
        // Этот прокси будет ждать инициализации при доступе к вложенным свойствам/методам
        return new Proxy({} as any, {
          get: (target, subProp: string | symbol) => {
            if (subProp === 'then' || subProp === 'catch' || subProp === 'finally') {
              return undefined;
            }
            
            // Возвращаем функцию, которая будет вызвана асинхронно
            return async (...args: any[]) => {
              if (!supabaseInstance && initPromise) {
                supabaseInstance = await initPromise;
              } else if (!supabaseInstance) {
                supabaseInstance = await initializeSupabase();
              }

              const instance = supabaseInstance;
              if (instance && instance[prop]) {
                const value = instance[prop];
                if (value && typeof value[subProp] === 'function') {
                  return value[subProp](...args);
                }
                return value[subProp];
              }
              // Если метод не найден, возвращаем ошибку вместо undefined
              throw new Error(`Method ${String(subProp)} not found on ${String(prop)}`);
            };
          },
          apply: async (target, thisArg, args) => {
            // Это не должно вызываться для свойств, только для функций
            return undefined;
          },
        });
      }

      return undefined;
    },
  });
}

// Экспортируем экземпляр
export const supabase = createAsyncProxy();

// Типы для базы данных
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          phone: string | null;
          region: string | null;
          marketing_consent: boolean;
          free_consultation_created: boolean;
          role: 'user' | 'support' | 'admin' | 'super_admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          phone?: string | null;
          region?: string | null;
          marketing_consent?: boolean;
          free_consultation_created?: boolean;
          role?: 'user' | 'support' | 'admin' | 'super_admin';
        };
        Update: {
          email?: string | null;
          phone?: string | null;
          region?: string | null;
          marketing_consent?: boolean;
          free_consultation_created?: boolean;
          role?: 'user' | 'support' | 'admin' | 'super_admin';
        };
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          type: 'parent' | 'child' | 'partner' | 'sibling' | 'caregiver' | 'other';
          first_name: string;
          last_name: string | null;
          dob: string | null;
          gender: 'male' | 'female' | 'other' | null;
          pronouns: string | null;
          worry_tags: string[] | null;
          referral: string | null;
          seeking_care: 'yes' | 'no' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'parent' | 'child' | 'partner' | 'sibling' | 'caregiver' | 'other';
          first_name: string;
          last_name?: string | null;
          dob?: string | null;
          gender?: 'male' | 'female' | 'other' | null;
          pronouns?: string | null;
          worry_tags?: string[] | null;
          referral?: string | null;
          seeking_care?: 'yes' | 'no' | null;
        };
        Update: {
          type?: 'parent' | 'child' | 'partner' | 'sibling' | 'caregiver' | 'other';
          first_name?: string;
          last_name?: string | null;
          dob?: string | null;
          gender?: 'male' | 'female' | 'other' | null;
          pronouns?: string | null;
          worry_tags?: string[] | null;
          referral?: string | null;
          seeking_care?: 'yes' | 'no' | null;
        };
      };
      assessments: {
        Row: {
          id: string;
          profile_id: string | null;
          assessment_type: 'checkup' | 'parent' | 'family';
          status: 'in_progress' | 'completed' | 'abandoned';
          current_step: number;
          total_steps: number | null;
          is_paid: boolean;
          payment_id: string | null;
          results_summary: Record<string, any> | null;
          worry_tags: { child?: string[]; personal?: string[]; family?: string[] } | null;
          started_at: string;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string | null;
          assessment_type: 'checkup' | 'parent' | 'family';
          status?: 'in_progress' | 'completed' | 'abandoned';
          current_step?: number;
          total_steps?: number | null;
          is_paid?: boolean;
          payment_id?: string | null;
          results_summary?: Record<string, any> | null;
          worry_tags?: { child?: string[]; personal?: string[]; family?: string[] } | null;
        };
        Update: {
          status?: 'in_progress' | 'completed' | 'abandoned';
          current_step?: number;
          total_steps?: number | null;
          is_paid?: boolean;
          payment_id?: string | null;
          results_summary?: Record<string, any> | null;
          worry_tags?: { child?: string[]; personal?: string[]; family?: string[] } | null;
        };
      };
      answers: {
        Row: {
          id: number;
          assessment_id: string;
          question_code: string;
          question_id: number;
          category: string | null;
          value: number;
          answer_type: string | null;
          step_number: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          assessment_id: string;
          question_code: string;
          question_id: number;
          category?: string | null;
          value: number;
          answer_type?: string | null;
          step_number?: number | null;
        };
        Update: {
          question_code?: string;
          question_id?: number;
          category?: string | null;
          value?: number;
          answer_type?: string | null;
          step_number?: number | null;
        };
      };
      appointment_types: {
        Row: {
          id: string;
          name: string;
          duration_minutes: number;
          price: number;
          description: string | null;
          is_active: boolean;
          admin_only: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          duration_minutes: number;
          price: number;
          description?: string | null;
          is_active?: boolean;
          admin_only?: boolean;
        };
        Update: {
          name?: string;
          duration_minutes?: number;
          price?: number;
          description?: string | null;
          is_active?: boolean;
          admin_only?: boolean;
        };
      };
      appointments: {
        Row: {
          id: string;
          user_id: string;
          profile_id: string | null;
          appointment_type_id: string;
          scheduled_at: string;
          status: 'payment_pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
          payment_id: string | null;
          payment_expires_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          profile_id?: string | null;
          appointment_type_id: string;
          scheduled_at: string;
          status?: 'payment_pending' | 'scheduled' | 'completed' | 'cancelled' | 'no_show';
          payment_id?: string | null;
          payment_expires_at?: string | null;
          notes?: string | null;
        };
        Update: {
          user_id?: string;
          profile_id?: string | null;
          appointment_type_id?: string;
          scheduled_at?: string;
          status?: 'payment_pending' | 'scheduled' | 'completed' | 'cancelled' | 'no_show';
          payment_id?: string | null;
          payment_expires_at?: string | null;
          notes?: string | null;
        };
      };
      packages: {
        Row: {
          id: string;
          name: string;
          session_count: number;
          appointment_type_id: string;
          price: number;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          session_count: number;
          appointment_type_id: string;
          price: number;
          description?: string | null;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          session_count?: number;
          appointment_type_id?: string;
          price?: number;
          description?: string | null;
          is_active?: boolean;
        };
      };
      package_purchases: {
        Row: {
          id: string;
          user_id: string;
          package_id: string;
          sessions_remaining: number;
          payment_id: string | null;
          purchased_at: string;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          package_id: string;
          sessions_remaining: number;
          payment_id?: string | null;
          purchased_at?: string;
          expires_at?: string | null;
        };
        Update: {
          user_id?: string;
          package_id?: string;
          sessions_remaining?: number;
          payment_id?: string | null;
          purchased_at?: string;
          expires_at?: string | null;
        };
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          currency: string;
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
          payment_method: string | null;
          external_payment_id: string | null;
          metadata: Record<string, any> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          currency?: string;
          payment_method?: string | null;
          external_payment_id?: string | null;
          metadata?: Record<string, any> | null;
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
        };
        Update: {
          user_id?: string;
          amount?: number;
          currency?: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
          payment_method?: string | null;
          external_payment_id?: string | null;
          metadata?: Record<string, any> | null;
        };
      };
    };
    Functions: {
      get_active_assessment: {
        Args: {
          p_profile_id: string;
          p_assessment_type: string;
        };
        Returns: string;
      };
      complete_assessment: {
        Args: {
          assessment_uuid: string;
        };
        Returns: Record<string, any>;
      };
      calculate_checkup_scores: {
        Args: {
          assessment_uuid: string;
        };
        Returns: Record<string, any>;
      };
      calculate_parent_scores: {
        Args: {
          assessment_uuid: string;
        };
        Returns: Record<string, any>;
      };
      calculate_family_scores: {
        Args: {
          assessment_uuid: string;
        };
        Returns: Record<string, any>;
      };
    };
  };
}
