// src/composables/useShopeeSyncManager.js
//
// Espelha useSyncManager.js (Mercado Livre), mas para as lojas Shopee:
// mesmo padrão de SSE (EventSource + polling de progresso via clientId).
import { ref } from 'vue';
import { useApi } from './useApi';
import { API_BASE_URL } from '@/config.js';
import { useAuth } from '@/composables/useAuth';

export function useShopeeSyncManager() {
  const api = useApi();
  const { token } = useAuth();

  const state = ref({
    isSyncing: false,
    isVisible: false,
    title: 'Sincronização Shopee',
    description: 'Iniciando...',
    progress: 0,
    type: 'info',
    newSalesCount: 0,
  });

  const closeToast = (delay = 6000) => {
    if (state.value.progress === 100 || state.value.progress === -1) {
      setTimeout(() => {
        state.value.isVisible = false;
        state.value.progress = 0;
      }, delay);
    }
  };

  const runSingleSync = (shopId, accountNickname, clientUid = null, force = false, onProgress = null) => {
    return new Promise((resolve, reject) => {
      let es = null;
      const clientId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      api
        .post('/shopee/sync-account', { shopId, clientId, force, clientUid })
        .then(() => {
          const sseUrl = `${API_BASE_URL}/shopee/sync-status/${clientId}?token=${encodeURIComponent(token.value)}`;
          es = new window.EventSource(sseUrl);
          const metrics = { newSalesCount: 0 };

          es.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.newSalesCount !== undefined) metrics.newSalesCount = data.newSalesCount;
            if (typeof onProgress === 'function') onProgress({ ...data, accountNickname, shopId });
            if (data.progress === 100) {
              if (es) es.close();
              if (data.type === 'error') reject(new Error(data.message));
              else resolve({ ...metrics });
            }
          };

          es.onerror = () => {
            if (es) es.close();
            reject(new Error('A conexão com o servidor foi perdida durante a sincronização.'));
          };
        })
        .catch((error) => {
          if (es) es.close();
          reject(new Error(error.message || 'Não foi possível iniciar a sincronização Shopee.'));
        });
    });
  };

  const syncAccount = async (shopId, accountNickname, clientUid = null, force = false) => {
    if (state.value.isSyncing) {
      throw new Error('Uma sincronização já está em andamento.');
    }

    state.value = {
      isSyncing: true,
      isVisible: true,
      progress: 0,
      title: `Sincronizando Shopee: ${accountNickname}`,
      description: 'Verificando atualizações...',
      type: 'info',
      newSalesCount: 0,
    };

    try {
      const result = await runSingleSync(shopId, accountNickname, clientUid, force, (data) => {
        state.value.progress = data.progress;
        state.value.description = data.message;
        state.value.type = data.type || 'info';
        if (data.newSalesCount !== undefined) state.value.newSalesCount = data.newSalesCount;
      });
      state.value.isSyncing = false;
      state.value.title = `Sucesso: ${accountNickname}`;
      closeToast(8000);
      return result;
    } catch (err) {
      state.value = {
        ...state.value,
        progress: -1,
        isSyncing: false,
        title: `Erro: ${accountNickname}`,
        description: err.message || 'Erro na sincronização.',
        type: 'error',
      };
      closeToast(8000);
      throw err;
    }
  };

  return {
    syncState: state,
    syncAccount,
  };
}
