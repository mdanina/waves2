// Сервис отправки email уведомлений
// В production заменить на реальную интеграцию (Supabase Edge Functions + Resend/SendGrid)

export interface SendCodeParams {
  email: string;
  code: string;
  deviceName: string;
  type: 'unbind_device' | 'login_verification';
}

export interface SendNotificationParams {
  email: string;
  type: 'device_unbound' | 'device_added' | 'trust_level_upgraded';
  data?: Record<string, string>;
}

// В production это будет вызов к Supabase Edge Function
export async function sendVerificationCode(params: SendCodeParams): Promise<{ success: boolean; error?: string }> {
  const { email, code, deviceName, type } = params;

  // Mock для разработки
  if (import.meta.env.DEV) {
    console.log(`[Email Mock] Отправка кода подтверждения:`);
    console.log(`  Email: ${email}`);
    console.log(`  Код: ${code}`);
    console.log(`  Устройство: ${deviceName}`);
    console.log(`  Тип: ${type}`);

    // Имитация задержки сети
    await new Promise(resolve => setTimeout(resolve, 500));

    return { success: true };
  }

  // Production: вызов Edge Function
  try {
    const response = await fetch('/api/send-verification-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, deviceName, type }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to send verification code:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export async function sendNotification(params: SendNotificationParams): Promise<{ success: boolean }> {
  const { email, type, data } = params;

  // Mock для разработки
  if (import.meta.env.DEV) {
    console.log(`[Email Mock] Отправка уведомления:`);
    console.log(`  Email: ${email}`);
    console.log(`  Тип: ${type}`);
    console.log(`  Данные:`, data);

    return { success: true };
  }

  // Production: вызов Edge Function
  try {
    await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, type, data }),
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send notification:', error);
    return { success: false };
  }
}

// Шаблоны email (для использования в Edge Functions)
export const EMAIL_TEMPLATES = {
  unbind_device: {
    subject: 'Код подтверждения для отвязки устройства',
    getBody: (code: string, deviceName: string) => `
      <h2>Подтверждение отвязки устройства</h2>
      <p>Вы запросили отвязку устройства <strong>${deviceName}</strong> от вашей лицензии Waves.</p>
      <p>Ваш код подтверждения:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px; background: #f5f5f5; border-radius: 8px; text-align: center;">
        ${code}
      </div>
      <p>Код действителен в течение 10 минут.</p>
      <p style="color: #666;">Если вы не запрашивали отвязку устройства, проигнорируйте это письмо или обратитесь в поддержку.</p>
    `,
  },

  login_verification: {
    subject: 'Код для входа в Waves',
    getBody: (code: string, deviceName: string) => `
      <h2>Вход с нового устройства</h2>
      <p>Зафиксирована попытка входа с устройства <strong>${deviceName}</strong>.</p>
      <p>Ваш код подтверждения:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px; background: #f5f5f5; border-radius: 8px; text-align: center;">
        ${code}
      </div>
      <p>Код действителен в течение 10 минут.</p>
      <p style="color: #666;">Если вы не пытались войти, немедленно смените пароль и свяжитесь с поддержкой.</p>
    `,
  },

  device_unbound: {
    subject: 'Устройство отвязано от лицензии',
    getBody: (deviceName: string) => `
      <h2>Устройство отвязано</h2>
      <p>Устройство <strong>${deviceName}</strong> было успешно отвязано от вашей лицензии Waves.</p>
      <p>Теперь вы можете привязать другое устройство.</p>
    `,
  },

  device_added: {
    subject: 'Новое устройство привязано к лицензии',
    getBody: (deviceName: string) => `
      <h2>Новое устройство</h2>
      <p>К вашей лицензии Waves было привязано новое устройство: <strong>${deviceName}</strong>.</p>
      <p style="color: #666;">Если это были не вы, немедленно отвяжите устройство в настройках лицензии.</p>
    `,
  },

  trust_level_upgraded: {
    subject: 'Ваш уровень доверия повышен',
    getBody: (newLevel: string) => `
      <h2>Поздравляем!</h2>
      <p>Ваш уровень доверия повышен до <strong>${newLevel}</strong>.</p>
      <p>Теперь вам доступно больше отвязок устройств в месяц и уменьшен период ожидания.</p>
    `,
  },
};
