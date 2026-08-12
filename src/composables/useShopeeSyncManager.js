// src/composables/useShopeeSyncManager.js
// Gerencia sincronização Shopee por SSE, incluindo lote multi-loja e métricas
// compatíveis com o fluxo do Mercado Livre.
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
  const liveAccounts = ref([]);

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
      const clientId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

      api.post('/shopee/sync-account', { shopId, clientId, force, clientUid })
        .then(() => {
          const sseUrl = `${API_BASE_URL}/shopee/sync-status/${clientId}?token=${encodeURIComponent(token.value)}`;
          es = new window.EventSource(sseUrl);
          const metrics = { newSalesCount: 0, updatedCount: 0, skippedCount: 0 };

          es.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.newSalesCount !== undefined) metrics.newSalesCount = data.newSalesCount;
            if (data.updatedCount !== undefined) metrics.updatedCount = data.updatedCount;
            if (data.skippedCount !== undefined) metrics.skippedCount = data.skippedCount;
            if (typeof onProgress === 'function') onProgress({ ...data, accountNickname, shopId });

            if (data.progress === 100) {
              if (es) es.close();
              if (data.type === 'error') reject(new Error(data.message));
              else resolve({ ...metrics });
            }
          };

          es.onerror = () => {
            if (es) es.close();
            reject(new Error('A conexão com o servidor foi perdida durante a sincronização Shopee.'));
          };
        })
        .catch((error) => {
          if (es) es.close();
          reject(new Error(error.message || 'Não foi possível iniciar a sincronização Shopee.'));
        });
    });
  };

  const syncAccount = async (shopId, accountNickname, clientUid = null, force = false) => {
    if (state.value.isSyncing) throw new Error('Uma sincronização Shopee já está em andamento.');

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
    } catch (error) {
      state.value = {
        ...state.value,
        progress: -1,
        isSyncing: false,
        title: `Erro: ${accountNickname}`,
        description: error.message || 'Erro na sincronização Shopee.',
        type: 'error',
      };
      closeToast(8000);
      throw error;
    }
  };

  const syncAccountsBatch = async (accounts, { concurrency = 2 } = {}) => {
    if (state.value.isSyncing) throw new Error('Uma sincronização Shopee já está em andamento.');
    if (!Array.isArray(accounts) || accounts.length === 0) {
      return {
        results: [],
        summary: { total: 0, successful: 0, failed: 0 },
        totalNewSales: 0,
        totalUpdated: 0,
        totalSkipped: 0,
        totalDurationMs: 0,
      };
    }

    const total = accounts.length;
    const results = new Array(total);
    const startedAt = Date.now();
    let cursor = 0;
    let done = 0;
    let successful = 0;
    let failed = 0;
    let totalNewSales = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    liveAccounts.value = accounts.map((account) => ({
      shopId: account.shopId,
      nickname: account.accountNickname,
      marketplace: 'Shopee',
      progress: 0,
      status: 'pending',
      message: 'Na fila...',
      newSalesCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      durationMs: 0,
    }));

    state.value = {
      isSyncing: true,
      isVisible: true,
      progress: 0,
      title: `Sincronizando ${total} loja(s) Shopee...`,
      description: `0/${total} concluídas`,
      type: 'info',
      newSalesCount: 0,
    };

    const worker = async () => {
      while (cursor < total) {
        const index = cursor++;
        const account = accounts[index];
        const live = liveAccounts.value[index];
        const accountStartedAt = Date.now();
        live.status = 'syncing';
        live.message = 'Iniciando...';

        try {
          const metrics = await runSingleSync(
            account.shopId,
            account.accountNickname,
            account.clientUid ?? null,
            account.force ?? false,
            (data) => {
              if (typeof data.progress === 'number' && data.progress >= 0) live.progress = data.progress;
              if (data.message) live.message = data.message;
              if (data.newSalesCount !== undefined) live.newSalesCount = data.newSalesCount;
              if (data.updatedCount !== undefined) live.updatedCount = data.updatedCount;
              if (data.skippedCount !== undefined) live.skippedCount = data.skippedCount;
            }
          );

          successful += 1;
          totalNewSales += metrics.newSalesCount || 0;
          totalUpdated += metrics.updatedCount || 0;
          totalSkipped += metrics.skippedCount || 0;
          live.status = 'done';
          live.progress = 100;
          live.newSalesCount = metrics.newSalesCount || 0;
          live.updatedCount = metrics.updatedCount || 0;
          live.skippedCount = metrics.skippedCount || 0;
          live.durationMs = Date.now() - accountStartedAt;
          results[index] = {
            ...account,
            marketplace: 'Shopee',
            status: 'success',
            ...metrics,
            durationMs: live.durationMs,
          };
        } catch (error) {
          failed += 1;
          live.status = 'error';
          live.progress = 100;
          live.message = error.message || 'Erro desconhecido';
          live.durationMs = Date.now() - accountStartedAt;
          results[index] = {
            ...account,
            marketplace: 'Shopee',
            status: 'error',
            message: live.message,
            durationMs: live.durationMs,
          };
        } finally {
          done += 1;
          state.value.progress = Math.floor((done / total) * 100);
          state.value.newSalesCount = totalNewSales;
          state.value.description = `${done}/${total} concluídas`;
        }
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(Math.max(1, concurrency), total) }, () => worker())
    );

    state.value.isSyncing = false;
    state.value.progress = 100;
    state.value.type = failed > 0 ? 'warning' : 'success';
    state.value.title = failed > 0 ? 'Sincronização Shopee finalizada com problemas' : 'Sincronização Shopee finalizada';
    state.value.description = `${successful} de ${total} concluídas`;
    closeToast(8000);

    return {
      results,
      summary: { total, successful, failed },
      totalNewSales,
      totalUpdated,
      totalSkipped,
      totalDurationMs: Date.now() - startedAt,
    };
  };

  return {
    syncState: state,
    liveAccounts,
    syncAccount,
    syncAccountsBatch,
  };
}
