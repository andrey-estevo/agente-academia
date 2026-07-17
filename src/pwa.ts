import { registerSW } from "virtual:pwa-register";

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  registerSW({
    immediate: true,
    onRegisterError(error) {
      console.error("Não foi possível registrar o service worker", error);
    },
  });
}
