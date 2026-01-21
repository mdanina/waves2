import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "react-quill/dist/quill.snow.css";

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

createRoot(document.getElementById("root")!).render(<App />);
