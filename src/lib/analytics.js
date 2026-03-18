export function trackEvent(name, payload = {}) {
  if (import.meta.env.DEV) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent('forge:analytics', {
      detail: { name, payload },
    }),
  );
}
