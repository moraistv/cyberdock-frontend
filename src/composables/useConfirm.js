// src/composables/useConfirm.js
//
// Confirmação em modal próprio, no lugar do confirm() do navegador.
//
// O confirm() nativo trava a aba inteira, ignora a identidade visual do
// sistema, não permite descrição formatada e some do fluxo em navegador mobile.
// Aqui o pedido é registrado num estado global e resolvido por promessa, então
// a chamada continua tão simples quanto era:
//
//   if (!(await confirm({ title: '...', message: '...' }))) return;

import { ref } from 'vue';

const state = ref(null);

/** Usado pelo ConfirmDialog montado em App.vue. */
export function useConfirmState() {
  const resolveWith = (value) => {
    const pending = state.value;
    state.value = null;
    pending?.resolve(Boolean(value));
  };

  return {
    request: state,
    accept: () => resolveWith(true),
    cancel: () => resolveWith(false),
  };
}

export function useConfirm() {
  /**
   * @param {object} options
   * @param {string} options.title
   * @param {string} options.message
   * @param {string} [options.detail]      linha secundária, ex.: aviso de irreversibilidade
   * @param {string} [options.confirmText]
   * @param {string} [options.cancelText]
   * @param {'danger'|'primary'} [options.tone]
   * @returns {Promise<boolean>}
   */
  const confirm = (options = {}) => {
    // Uma confirmação por vez: a anterior é resolvida como cancelada para não
    // deixar promessa pendurada.
    if (state.value) state.value.resolve(false);

    return new Promise((resolve) => {
      state.value = {
        title: options.title || 'Confirmar ação',
        message: options.message || '',
        detail: options.detail || '',
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
        tone: options.tone === 'primary' ? 'primary' : 'danger',
        resolve,
      };
    });
  };

  return { confirm };
}

export default useConfirm;
