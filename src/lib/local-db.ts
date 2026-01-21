// Локальная эмуляция базы данных на основе IndexedDB
// Эмулирует Supabase API для работы без облачного сервера

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import type { Database } from './supabase';

// Схема базы данных IndexedDB
interface LocalDBSchema extends DBSchema {
  users: {
    key: string;
    value: Database['public']['Tables']['users']['Row'];
  };
  profiles: {
    key: string;
    value: Database['public']['Tables']['profiles']['Row'];
  };
  assessments: {
    key: string;
    value: Database['public']['Tables']['assessments']['Row'];
  };
  answers: {
    key: number;
    value: Database['public']['Tables']['answers']['Row'];
  };
  appointments: {
    key: string;
    value: Database['public']['Tables']['appointments']['Row'];
  };
  payments: {
    key: string;
    value: Database['public']['Tables']['payments']['Row'];
  };
  auth: {
    key: string;
    value: {
      user: User | null;
      session: Session | null;
    };
  };
}

let dbInstance: IDBPDatabase<LocalDBSchema> | null = null;

// Инициализация базы данных
export async function initLocalDB(): Promise<IDBPDatabase<LocalDBSchema>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<LocalDBSchema>('waves2-db', 1, {
    upgrade(db) {
      // Создаем хранилища
      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('profiles')) {
        db.createObjectStore('profiles', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('assessments')) {
        db.createObjectStore('assessments', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('answers')) {
        const answersStore = db.createObjectStore('answers', { keyPath: 'id', autoIncrement: true });
        answersStore.createIndex('assessment_id', 'assessment_id');
      }
      if (!db.objectStoreNames.contains('appointments')) {
        db.createObjectStore('appointments', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('payments')) {
        db.createObjectStore('payments', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('auth')) {
        db.createObjectStore('auth', { keyPath: 'key' });
      }
    },
  });

  return dbInstance;
}

// Получить экземпляр БД
export async function getDB(): Promise<IDBPDatabase<LocalDBSchema>> {
  return await initLocalDB();
}

// Генерация UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Эмуляция Supabase Auth
export class LocalAuth {
  private currentUser: User | null = null;
  private currentSession: Session | null = null;
  private listeners: Array<(event: string, session: Session | null) => void> = [];

  constructor() {
    this.loadSession();
  }

  private async loadSession() {
    const db = await getDB();
    const authData = await db.get('auth', 'current');
    if (authData) {
      this.currentUser = authData.user;
      this.currentSession = authData.session;
    }
  }

  private async saveSession(user: User | null, session: Session | null) {
    const db = await getDB();
    await db.put('auth', {
      key: 'current',
      user,
      session,
    });
    this.currentUser = user;
    this.currentSession = session;
  }

  async signUp(email: string, password: string) {
    // Проверяем, существует ли пользователь
    const db = await getDB();
    const allUsers = await db.getAll('users');
    const existingUser = allUsers.find((u) => u.email === email);

    if (existingUser) {
      return {
        data: null,
        error: {
          message: 'User already registered',
          status: 400,
        } as AuthError,
      };
    }

    // Создаем нового пользователя
    const userId = generateUUID();
    const user: User = {
      id: userId,
      email,
      email_confirmed_at: null,
      phone: null,
      confirmed_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: {},
      identities: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_anonymous: false,
    };

    const session: Session = {
      access_token: generateUUID(),
      refresh_token: generateUUID(),
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user,
    };

    // Сохраняем пользователя в БД
    await db.put('users', {
      id: userId,
      email,
      phone: null,
      region: null,
      marketing_consent: false,
      free_consultation_created: false,
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await this.saveSession(user, session);
    this.notifyListeners('SIGNED_IN', session);

    return {
      data: { user, session },
      error: null,
    };
  }

  async signIn(email: string, password: string) {
    const db = await getDB();
    const allUsers = await db.getAll('users');
    const userData = allUsers.find((u) => u.email === email);

    if (!userData) {
      return {
        error: {
          message: 'Invalid login credentials',
          status: 400,
        } as AuthError,
      };
    }

    const user: User = {
      id: userData.id,
      email: userData.email,
      email_confirmed_at: new Date().toISOString(),
      phone: userData.phone,
      confirmed_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: {},
      identities: [],
      created_at: userData.created_at,
      updated_at: new Date().toISOString(),
      is_anonymous: false,
    };

    const session: Session = {
      access_token: generateUUID(),
      refresh_token: generateUUID(),
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user,
    };

    await this.saveSession(user, session);
    this.notifyListeners('SIGNED_IN', session);

    return { error: null };
  }

  async signOut() {
    await this.saveSession(null, null);
    this.notifyListeners('SIGNED_OUT', null);
  }

  async getSession() {
    await this.loadSession();
    return {
      data: {
        session: this.currentSession,
      },
      error: null,
    };
  }

  async getUser() {
    await this.loadSession();
    return {
      data: {
        user: this.currentUser,
      },
      error: null,
    };
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    this.listeners.push(callback);
    
    // Вызываем сразу с текущим состоянием асинхронно
    this.loadSession().then(() => {
      callback('INITIAL_SESSION', this.currentSession);
    });

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners = this.listeners.filter((l) => l !== callback);
          },
        },
      },
    };
  }

  private notifyListeners(event: string, session: Session | null) {
    this.listeners.forEach((listener) => {
      try {
        listener(event, session);
      } catch (error) {
        console.error('Error in auth state change listener:', error);
      }
    });
  }

  resetPasswordForEmail(email: string) {
    // Эмуляция - просто возвращаем успех
    return Promise.resolve({ error: null });
  }

  updateUser(updates: { password?: string }) {
    // Эмуляция - просто возвращаем успех
    return Promise.resolve({ data: { user: this.currentUser }, error: null });
  }
}

// Эмуляция Supabase Table API
export class LocalTable<T> {
  constructor(
    private tableName: keyof LocalDBSchema,
    private db: IDBPDatabase<LocalDBSchema>
  ) {}

  async select(columns?: string) {
    const all = await this.db.getAll(this.tableName);
    return {
      data: all as T[],
      error: null,
    };
  }

  async insert(data: any) {
    const id = data.id || generateUUID();
    const now = new Date().toISOString();
    const record = {
      ...data,
      id,
      created_at: data.created_at || now,
      updated_at: now,
    };
    await this.db.put(this.tableName, record);
    return {
      data: [record] as T[],
      error: null,
    };
  }

  async update(id: string, updates: any) {
    const existing = await this.db.get(this.tableName, id);
    if (!existing) {
      return {
        data: null,
        error: { message: 'Record not found', code: 'PGRST116' },
      };
    }
    const updated = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    await this.db.put(this.tableName, updated);
    return {
      data: [updated] as T[],
      error: null,
    };
  }

  async delete(id: string) {
    await this.db.delete(this.tableName, id);
    return {
      data: null,
      error: null,
    };
  }

  eq(column: string, value: any) {
    return new LocalQueryBuilder<T>(this.tableName, this.db, { column, operator: 'eq', value });
  }

  filter(column: string, operator: string, value: any) {
    return new LocalQueryBuilder<T>(this.tableName, this.db, { column, operator, value });
  }
}

class LocalQueryBuilder<T> {
  private filters: Array<{ column: string; operator: string; value: any }> = [];

  constructor(
    private tableName: keyof LocalDBSchema,
    private db: IDBPDatabase<LocalDBSchema>,
    initialFilter?: { column: string; operator: string; value: any }
  ) {
    if (initialFilter) {
      this.filters.push(initialFilter);
    }
  }

  eq(column: string, value: any) {
    this.filters.push({ column, operator: 'eq', value });
    return this;
  }

  async select(columns?: string) {
    const all = await this.db.getAll(this.tableName);
    let filtered = all;

    for (const filter of this.filters) {
      filtered = filtered.filter((item: any) => {
        const itemValue = item[filter.column];
        switch (filter.operator) {
          case 'eq':
            return itemValue === filter.value;
          case 'neq':
            return itemValue !== filter.value;
          case 'in':
            return Array.isArray(filter.value) && filter.value.includes(itemValue);
          default:
            return true;
        }
      });
    }

    return {
      data: filtered as T[],
      error: null,
    };
  }

  async insert(data: any) {
    const id = data.id || generateUUID();
    const now = new Date().toISOString();
    const record = {
      ...data,
      id,
      created_at: data.created_at || now,
      updated_at: now,
    };
    await this.db.put(this.tableName, record);
    return {
      data: [record] as T[],
      error: null,
    };
  }

  async update(updates: any) {
    const all = await this.db.getAll(this.tableName);
    let filtered = all;

    for (const filter of this.filters) {
      filtered = filtered.filter((item: any) => {
        const itemValue = item[filter.column];
        switch (filter.operator) {
          case 'eq':
            return itemValue === filter.value;
          default:
            return true;
        }
      });
    }

    const updated = filtered.map((item: any) => ({
      ...item,
      ...updates,
      updated_at: new Date().toISOString(),
    }));

    for (const item of updated) {
      await this.db.put(this.tableName, item);
    }

    return {
      data: updated as T[],
      error: null,
    };
  }
}

// Главный класс эмуляции Supabase
export class LocalSupabase {
  auth: LocalAuth;

  constructor() {
    this.auth = new LocalAuth();
  }

  from<T = any>(table: keyof LocalDBSchema): LocalTable<T> {
    if (!dbInstance) {
      throw new Error('Database not initialized. Call initLocalDB() first.');
    }
    return new LocalTable<T>(table, dbInstance);
  }

  // Эмуляция RPC функций
  async rpc(functionName: string, args?: any) {
    const db = await getDB();

    // Эмуляция функций базы данных
    if (functionName === 'get_active_assessment') {
      const { p_profile_id, p_assessment_type } = args;
      const assessments = await db.getAll('assessments');
      const active = assessments.find(
        (a) => a.profile_id === p_profile_id && a.assessment_type === p_assessment_type && a.status === 'in_progress'
      );
      return {
        data: active?.id || null,
        error: null,
      };
    }

    // Другие функции можно добавить по мере необходимости
    return {
      data: null,
      error: { message: `Function ${functionName} not implemented`, code: 'PGRST202' },
    };
  }
}

// Инициализация и экспорт
let localSupabaseInstance: LocalSupabase | null = null;

export async function getLocalSupabase(): Promise<LocalSupabase> {
  await initLocalDB();
  if (!localSupabaseInstance) {
    localSupabaseInstance = new LocalSupabase();
  }
  return localSupabaseInstance;
}
