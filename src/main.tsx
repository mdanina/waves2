import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "react-quill/dist/quill.snow.css";
import "@flaticon/flaticon-uicons/css/all/all.rounded.css";

// Optional: Initialize Sentry if available
(async () => {
  try {
    const { initSentry } = await import("./lib/sentry");
    initSentry().catch(() => {
      // Silently fail if Sentry is not installed or not configured
    });
  } catch {
    // Sentry not available, continue without it
  }

  // Optional: Initialize PWA push notifications if available
  try {
    const { initializePushNotifications } = await import("./lib/push-notifications");
    initializePushNotifications().catch(() => {
      // Silently fail if push notifications are not configured
    });
  } catch {
    // Push notifications not available, continue without them
  }
})();

// Утилиты для разработки - доступны в консоли браузера
if (import.meta.env.DEV) {
  (async () => {
    try {
      const { deleteUserByEmail } = await import("./lib/local-db");
      // @ts-ignore
      window.deleteUserByEmail = async (email: string) => {
        const result = await deleteUserByEmail(email);
        console.log("Результат удаления пользователя:", result);
        if (result.success) {
          console.log("✅ Пользователь успешно удален!");
          console.log("Удалено:", result.deleted);
          // Перезагружаем страницу для очистки состояния
          window.location.reload();
        } else {
          console.error("❌ Ошибка:", result.error);
        }
        return result;
      };
      console.log("💡 Утилита deleteUserByEmail доступна. Используйте: window.deleteUserByEmail('email@example.com')");
    } catch (error) {
      // Игнорируем ошибки, если local-db не доступен (например, при использовании реального Supabase)
    }

    // Утилита для очистки данных лицензии и чек-листа
    try {
      const { resetOnboardingData } = await import("./lib/local-db");
      // @ts-ignore
      window.resetOnboardingData = async () => {
        const result = await resetOnboardingData();
        console.log("Результат очистки данных:", result);
        if (result.success) {
          console.log("✅ Данные лицензии и чек-листа успешно очищены!");
          // Перезагружаем страницу для обновления состояния
          window.location.reload();
        } else {
          console.error("❌ Ошибка:", result.error);
        }
        return result;
      };
      console.log("💡 Утилита resetOnboardingData доступна. Используйте: window.resetOnboardingData()");
      
      // Одноразовая очистка данных при загрузке (только если есть флаг)
      const shouldReset = sessionStorage.getItem('reset_onboarding_data_once') === 'true';
      if (shouldReset) {
        sessionStorage.removeItem('reset_onboarding_data_once');
        console.log("🧹 Выполняю одноразовую очистку данных лицензии и чек-листа...");
        const result = await resetOnboardingData();
        if (result.success) {
          console.log("✅ Данные успешно очищены! Перезагружаю страницу...");
          window.location.reload();
          return; // Прерываем выполнение, так как страница перезагрузится
        } else {
          console.log("⚠️ Не удалось очистить данные:", result.error);
        }
      }
    } catch (error) {
      console.log("⚠️ Не удалось загрузить функцию очистки данных");
    }
  })();
  
  // Устанавливаем флаг для одноразовой очистки при следующей загрузке
  if (!sessionStorage.getItem('reset_onboarding_data_once_set')) {
    sessionStorage.setItem('reset_onboarding_data_once', 'true');
    sessionStorage.setItem('reset_onboarding_data_once_set', 'true');
  }
}

createRoot(document.getElementById("root")!).render(<App />);
