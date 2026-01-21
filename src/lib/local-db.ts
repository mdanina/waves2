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

  // Supabase API: signUp принимает объект { email, password, options? }
  async signUp(credentials: { email: string; password: string; options?: any }) {
    const { email, password } = credentials;
    
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

  // Supabase API: signInWithPassword принимает объект { email, password, options? }
  async signInWithPassword(credentials: { email: string; password: string; options?: any }) {
    return this.signIn(credentials.email, credentials.password);
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

  resetPasswordForEmail(email: string, options?: { redirectTo?: string }) {
    // Эмуляция - просто возвращаем успех
    return Promise.resolve({ error: null });
  }

  updateUser(updates: { password?: string; email?: string; data?: any }) {
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

  // select() должен возвращать query builder, а не выполнять запрос сразу
  select(columns?: string): LocalQueryBuilder<T> {
    return new LocalQueryBuilder<T>(this.tableName, this.db);
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

  update(updates: any): LocalQueryBuilder<T> {
    const builder = new LocalQueryBuilder<T>(this.tableName, this.db);
    builder.setUpdateData(updates);
    return builder;
  }

  delete(): LocalQueryBuilder<T> {
    const builder = new LocalQueryBuilder<T>(this.tableName, this.db);
    builder.isDelete = true;
    return builder;
  }

  eq(column: string, value: any): LocalQueryBuilder<T> {
    return new LocalQueryBuilder<T>(this.tableName, this.db, { column, operator: 'eq', value });
  }

  filter(column: string, operator: string, value: any): LocalQueryBuilder<T> {
    return new LocalQueryBuilder<T>(this.tableName, this.db, { column, operator, value });
  }
}

class LocalQueryBuilder<T> {
  private filters: Array<{ column: string; operator: string; value: any }> = [];
  private orderBy?: { column: string; ascending: boolean };
  private limitValue?: number;
  private updateData?: any;
  private isDelete = false;
  private isSingle = false;
  private selectOptions?: { count?: 'exact' | 'estimated' | 'planned'; head?: boolean };

  constructor(
    private tableName: keyof LocalDBSchema,
    private db: IDBPDatabase<LocalDBSchema>,
    initialFilter?: { column: string; operator: string; value: any }
  ) {
    if (initialFilter) {
      this.filters.push(initialFilter);
    }
  }

  // Делаем объект thenable (Promise-like), чтобы можно было await
  then(onFulfilled?: (value: any) => any, onRejected?: (reason: any) => any): Promise<any> {
    // Определяем, какой метод выполнить на основе состояния
    if (this.updateData) {
      return this.update().then(onFulfilled, onRejected);
    }
    if (this.isDelete) {
      return this.delete().then(onFulfilled, onRejected);
    }
    return this.select().then(onFulfilled, onRejected);
  }

  setUpdateData(updates: any) {
    this.updateData = updates;
    return this;
  }

  eq(column: string, value: any): LocalQueryBuilder<T> {
    this.filters.push({ column, operator: 'eq', value });
    return this;
  }

  neq(column: string, value: any): LocalQueryBuilder<T> {
    this.filters.push({ column, operator: 'neq', value });
    return this;
  }

  in(column: string, values: any[]): LocalQueryBuilder<T> {
    this.filters.push({ column, operator: 'in', value: values });
    return this;
  }

  gte(column: string, value: any): LocalQueryBuilder<T> {
    this.filters.push({ column, operator: 'gte', value });
    return this;
  }

  lte(column: string, value: any): LocalQueryBuilder<T> {
    this.filters.push({ column, operator: 'lte', value });
    return this;
  }

  gt(column: string, value: any): LocalQueryBuilder<T> {
    this.filters.push({ column, operator: 'gt', value });
    return this;
  }

  lt(column: string, value: any): LocalQueryBuilder<T> {
    this.filters.push({ column, operator: 'lt', value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }): LocalQueryBuilder<T> {
    this.orderBy = { column, ascending: options?.ascending !== false };
    return this;
  }

  limit(count: number): LocalQueryBuilder<T> {
    this.limitValue = count;
    return this;
  }

  single(): LocalQueryBuilder<T> {
    this.isSingle = true;
    return this;
  }

  or(conditions: string): LocalQueryBuilder<T> {
    // Парсим условия вида "and(col1.eq.val1,col2.eq.val2),and(col3.eq.val3,col4.eq.val4)"
    // Пока упрощённая реализация - просто добавляем как отдельные фильтры
    // Для полной поддержки нужен более сложный парсер
    this.filters.push({ column: '__or__', operator: 'or', value: conditions });
    return this;
  }

  async select(columns?: string, options?: { count?: 'exact' | 'estimated' | 'planned'; head?: boolean }) {
    this.selectOptions = options;
    const all = await this.db.getAll(this.tableName);
    let filtered = all;

    // Применяем фильтры
    for (const filter of this.filters) {
      if (filter.operator === 'or') {
        // Упрощённая обработка OR - в реальности нужен парсер
        // Пока пропускаем
        continue;
      }
      
      filtered = filtered.filter((item: any) => {
        const itemValue = item[filter.column];
        switch (filter.operator) {
          case 'eq':
            return itemValue === filter.value;
          case 'neq':
            return itemValue !== filter.value;
          case 'in':
            return Array.isArray(filter.value) && filter.value.includes(itemValue);
          case 'gte':
            return itemValue >= filter.value;
          case 'lte':
            return itemValue <= filter.value;
          case 'gt':
            return itemValue > filter.value;
          case 'lt':
            return itemValue < filter.value;
          default:
            return true;
        }
      });
    }

    // Применяем сортировку
    if (this.orderBy) {
      filtered.sort((a: any, b: any) => {
        const aVal = a[this.orderBy!.column];
        const bVal = b[this.orderBy!.column];
        if (aVal === bVal) return 0;
        const comparison = aVal < bVal ? -1 : 1;
        return this.orderBy!.ascending ? comparison : -comparison;
      });
    }

    // Применяем лимит
    if (this.limitValue !== undefined) {
      filtered = filtered.slice(0, this.limitValue);
    }

    // Если head: true, возвращаем только count без data
    if (this.selectOptions?.head) {
      return {
        data: null,
        count: filtered.length,
        error: null,
      };
    }

    // Если single(), возвращаем один элемент
    if (this.isSingle) {
      if (filtered.length === 0) {
        return {
          data: null,
          error: { message: 'No rows found', code: 'PGRST116' },
        };
      }
      return {
        data: filtered[0] as T,
        error: null,
      };
    }

    // Если count: 'exact', добавляем count в результат
    if (this.selectOptions?.count === 'exact') {
      return {
        data: filtered as T[],
        count: filtered.length,
        error: null,
      };
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

  async update(updates?: any) {
    const updateData = updates || this.updateData;
    if (!updateData) {
      return {
        data: null,
        error: { message: 'No update data provided', code: 'PGRST202' },
      };
    }

    const all = await this.db.getAll(this.tableName);
    let filtered = all;

    // Применяем фильтры
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
          case 'gte':
            return itemValue >= filter.value;
          case 'lte':
            return itemValue <= filter.value;
          case 'gt':
            return itemValue > filter.value;
          case 'lt':
            return itemValue < filter.value;
          default:
            return true;
        }
      });
    }

    const updated = filtered.map((item: any) => ({
      ...item,
      ...updateData,
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

  async delete() {
    const all = await this.db.getAll(this.tableName);
    let filtered = all;

    // Применяем фильтры
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
          case 'gte':
            return itemValue >= filter.value;
          case 'lte':
            return itemValue <= filter.value;
          case 'gt':
            return itemValue > filter.value;
          case 'lt':
            return itemValue < filter.value;
          default:
            return true;
        }
      });
    }

    for (const item of filtered) {
      await this.db.delete(this.tableName, (item as any).id);
    }

    return {
      data: null,
      error: null,
    };
  }
}

// Эмуляция Realtime Channel для локальной БД
class LocalChannel {
  private channelName: string;
  private listeners: Array<{ eventType: string; callback: (payload: any) => void }> = [];

  constructor(channelName: string) {
    this.channelName = channelName;
  }

  on(eventType: string, config: any, callback: (payload: any) => void): LocalChannel {
    // В локальной БД realtime не поддерживается, просто сохраняем listener
    this.listeners.push({ eventType, callback });
    return this;
  }

  subscribe(): { unsubscribe: () => void } {
    // В локальной БД realtime не поддерживается, возвращаем no-op unsubscribe
    return {
      unsubscribe: () => {
        // No-op: очищаем listeners
        this.listeners = [];
      },
    };
  }
}

// Главный класс эмуляции Supabase
export class LocalSupabase {
  auth: LocalAuth;
  private channels: Map<string, LocalChannel> = new Map();

  constructor() {
    this.auth = new LocalAuth();
  }

  from<T = any>(table: keyof LocalDBSchema): LocalTable<T> {
    if (!dbInstance) {
      throw new Error('Database not initialized. Call initLocalDB() first.');
    }
    return new LocalTable<T>(table, dbInstance);
  }

  // Эмуляция Realtime Channel
  channel(channelName: string): LocalChannel {
    if (!this.channels.has(channelName)) {
      this.channels.set(channelName, new LocalChannel(channelName));
    }
    return this.channels.get(channelName)!;
  }

  // Удаление канала
  removeChannel(channel: LocalChannel): void {
    // Находим и удаляем канал из Map
    for (const [name, ch] of this.channels.entries()) {
      if (ch === channel) {
        this.channels.delete(name);
        break;
      }
    }
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
