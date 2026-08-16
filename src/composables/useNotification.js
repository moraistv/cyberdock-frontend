// src/composables/useNotification.js
//
// Ponto ÚNICO de notificação do sistema.
//
// Antes existiam quatro caminhos concorrentes: AlertService (evento global),
// ToastNotification por props, três `showToast` locais que só faziam
// console.log, e alert() do navegador. Pior: o ToastComponent só estava montado
// na tela de login, então quase todo aviso de sucesso/erro de SKU, estoque e
// kit era descartado em silêncio — inclusive os erros.
//
// Agora tudo passa por aqui e é renderizado pelo ToastComponent montado uma
// única vez em App.vue.

const DEFAULT_DURATION = 3600;

function emit(message, type, duration) {
  if (!message) return;
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  window.dispatchEvent(
    new CustomEvent('show-toast', {
      detail: { id, message: String(message), type, duration },
    })
  );
}

/** Extrai a mensagem mais útil de um erro de API (useApi popula err.data). */
export function describeError(error, fallback = 'Não foi possível concluir a operação.') {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return (
    error?.data?.error ||
    error?.data?.message ||
    error?.message ||
    fallback
  );
}

export function useNotification() {
  return {
    success: (message, duration = DEFAULT_DURATION) => emit(message, 'success', duration),
    error: (message, duration = 6000) => emit(message, 'error', duration),
    warning: (message, duration = 5000) => emit(message, 'warning', duration),
    info: (message, duration = DEFAULT_DURATION) => emit(message, 'info', duration),
    /** Atalho para o padrão `catch (err)` das telas. */
    fromError: (error, fallback) => emit(describeError(error, fallback), 'error', 6000),
  };
}

export default useNotification;
