// src/composables/useSyncManager.js
import { ref } from 'vue';
import { useApi } from './useApi';
import { API_BASE_URL } from '@/config.js';
import { useAuth } from '@/composables/useAuth';

export function useSyncManager() {
  const api = useApi();
  const { token } = useAuth();

  const state = ref({
    isSyncing: false,
    isVisible: false,
    title: 'Sincronização',
    description: 'Iniciando...',
    progress: 0,
    type: 'info',
    newSalesCount: 0
  });

  // Estado ao vivo por conta, para o painel de progresso em tempo real.
  // [{ mlAccountId, nickname, progress, status, message, newSalesCount, updatedCount, skippedCount }]
  const liveAccounts = ref([]);

  const closeToast = (delay = 6000) => {
    if (state.value.progress === 100 || state.value.progress === -1) {
      setTimeout(() => {
        state.value.isVisible = false;
        state.value.progress = 0;
      }, delay);
    }
  };

  // Decide se a sincronização deve ser "completa" (janela longa + backfill).
  // Regra nova: só forçamos backfill/janela ampla quando a conta NUNCA foi
  // sincronizada. Cliques repetidos passam a ser incrementais (rápidos),
  // lendo apenas desde a última venda salva. Isso evita reler 180 dias e
  // disparar milhares de chamadas ao ML a cada clique.
  const shouldForceSync = async (mlAccountId, clientUid = null) => {
    try {
      const endpoint = clientUid
        ? `/sales/last-sync/${mlAccountId}?clientUid=${encodeURIComponent(clientUid)}`
        : `/sales/last-sync/${mlAccountId}`;
      const response = await api.get(endpoint);
      // Sem histórico => primeira sincronização => completa.
      return !response || !response.lastSync;
    } catch (err) {
      console.warn('Erro ao verificar última sincronização, forçando:', err);
      return true;
    }
  };

  // Núcleo de UMA sincronização, isolado e autossuficiente:
  // cria o próprio clientId, abre o próprio EventSource e resolve/rejeita.
  // NÃO mexe no lock global (state.isSyncing) — isso permite rodar várias
  // em paralelo pelo syncAccountsBatch. onProgress recebe (data) por conta.
  const runSingleSync = (mlAccountId, accountNickname, clientUid = null, daysToSync = null, onProgress = null) => {
    return new Promise((resolve, reject) => {
      let es = null;
      shouldForceSync(mlAccountId, clientUid)
        .then((force) => {
          const clientId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          api.post('/sales/sync-account', {
            userId: mlAccountId,
            clientId,
            accountNickname,
            force,
            backfill: force, // backfill só na primeira sincronização
            clientUid,
            daysToSync
          })
            .then(() => {
              const sseUrl = `${API_BASE_URL}/sales/sync-status/${clientId}?token=${encodeURIComponent(token.value)}&mlAccountId=${encodeURIComponent(mlAccountId)}`;
              es = new window.EventSource(sseUrl);
              const metrics = { newSalesCount: 0, updatedCount: 0, skippedCount: 0 };

              es.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.newSalesCount !== undefined) metrics.newSalesCount = data.newSalesCount;
                if (data.updatedCount !== undefined) metrics.updatedCount = data.updatedCount;
                if (data.skippedCount !== undefined) metrics.skippedCount = data.skippedCount;
                if (typeof onProgress === 'function') {
                  onProgress({ ...data, accountNickname, mlAccountId });
                }
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
              reject(new Error(error.message || 'Não foi possível iniciar o processo de sincronização.'));
            });
        })
        .catch((error) => {
          reject(new Error(error.message || 'Erro ao verificar status da sincronização'));
        });
    });
  };

  // Sincronização de UMA conta (mantém a API pública antiga + toast global).
  const syncAccount = async (mlAccountId, accountNickname, clientUid = null, daysToSync = null) => {
    if (state.value.isSyncing) {
      console.warn('A sincronização já está em andamento.');
      throw new Error('Uma sincronização já está em andamento.');
    }

    state.value = {
      isSyncing: true,
      isVisible: true,
      progress: 0,
      title: `Sincronizando: ${accountNickname}`,
      description: 'Verificando atualizações...',
      type: 'info',
      newSalesCount: 0
    };

    try {
      const result = await runSingleSync(mlAccountId, accountNickname, clientUid, daysToSync, (data) => {
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
        type: 'error'
      };
      closeToast(8000);
      throw err;
    }
  };

  // Sincroniza VÁRIAS contas com paralelismo controlado.
  // O rate real de chamadas ao ML é protegido pelo limiter global do backend,
  // então podemos rodar algumas contas ao mesmo tempo com segurança.
  // accounts: [{ mlAccountId, accountNickname, clientUid, daysToSync }]
  const syncAccountsBatch = async (accounts, { concurrency = 3 } = {}) => {
    if (state.value.isSyncing) {
      throw new Error('Uma sincronização já está em andamento.');
    }
    if (!Array.isArray(accounts) || accounts.length === 0) {
      return { results: [], summary: { total: 0, successful: 0, failed: 0 }, totalNewSales: 0 };
    }

    const total = accounts.length;
    let done = 0;
    let successful = 0;
    let failed = 0;
    let totalNewSales = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    const results = new Array(total);

    const batchStartedAt = Date.now();

    // Inicializa o estado ao vivo (uma linha por conta).
    liveAccounts.value = accounts.map((a) => ({
      mlAccountId: a.mlAccountId,
      nickname: a.accountNickname,
      progress: 0,
      status: 'pending',
      message: 'Na fila...',
      newSalesCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      workCompleted: 0,
      workTotal: 0,
      durationMs: 0
    }));

    state.value = {
      isSyncing: true,
      isVisible: true,
      progress: 0,
      title: `Sincronizando ${total} conta(s)...`,
      description: `0/${total} concluídas`,
      type: 'info',
      newSalesCount: 0
    };

    let cursor = 0;
    const worker = async () => {
      while (cursor < total) {
        const idx = cursor++;
        const acc = accounts[idx];
        const live = liveAccounts.value[idx];
        const accStartedAt = Date.now();
        live.status = 'syncing';
        live.message = 'Iniciando...';
        try {
          const r = await runSingleSync(acc.mlAccountId, acc.accountNickname, acc.clientUid ?? null, acc.daysToSync ?? null, (data) => {
            if (typeof data.progress === 'number' && data.progress >= 0) live.progress = data.progress;
            if (data.message) live.message = data.message;
            if (data.newSalesCount !== undefined) live.newSalesCount = data.newSalesCount;
            if (data.updatedCount !== undefined) live.updatedCount = data.updatedCount;
            if (data.skippedCount !== undefined) live.skippedCount = data.skippedCount;
            if (data.workCompleted !== undefined) live.workCompleted = data.workCompleted;
            if (data.workTotal !== undefined) live.workTotal = data.workTotal;
          });
          successful++;
          totalNewSales += r?.newSalesCount || 0;
          totalUpdated += r?.updatedCount || 0;
          totalSkipped += r?.skippedCount || 0;
          const durationMs = Date.now() - accStartedAt;
          live.status = 'done';
          live.progress = 100;
          live.newSalesCount = r?.newSalesCount || 0;
          live.updatedCount = r?.updatedCount || 0;
          live.skippedCount = r?.skippedCount || 0;
          live.durationMs = durationMs;
          results[idx] = {
            ...acc,
            status: 'success',
            newSalesCount: r?.newSalesCount || 0,
            updatedCount: r?.updatedCount || 0,
            skippedCount: r?.skippedCount || 0,
            durationMs
          };
        } catch (err) {
          const durationMs = Date.now() - accStartedAt;
          failed++;
          live.status = 'error';
          live.progress = 100;
          live.message = err.message || 'Erro desconhecido';
          live.durationMs = durationMs;
          results[idx] = { ...acc, status: 'error', message: err.message || 'Erro desconhecido', durationMs };
        } finally {
          done++;
          state.value.progress = Math.floor((done / total) * 100);
          state.value.newSalesCount = totalNewSales;
          state.value.description = `${done}/${total} concluídas`;
        }
      }
    };

    const pool = Array.from({ length: Math.min(concurrency, total) }, () => worker());
    await Promise.all(pool);

    state.value.isSyncing = false;
    state.value.progress = 100;
    state.value.type = failed > 0 ? 'warning' : 'success';
    state.value.title = failed > 0 ? 'Sincronização finalizada com problemas' : 'Sincronização finalizada';
    state.value.description = `${successful} de ${total} concluídas`;
    closeToast(8000);

    return {
      results,
      summary: { total, successful, failed },
      totalNewSales,
      totalUpdated,
      totalSkipped,
      totalDurationMs: Date.now() - batchStartedAt
    };
  };

  const enrichExistingSales = async (mlAccountId, accountNickname, clientUid = null) => {
    return new Promise((resolve, reject) => {
      if (state.value.isSyncing) {
        reject(new Error('Já existe uma operação em andamento'));
        return;
      }

      shouldForceSync(mlAccountId, clientUid)
        .then(() => {
          const clientId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          let es = null;

          state.value = {
            isSyncing: true,
            progress: 0,
            title: `Enriquecendo: ${accountNickname}`,
            description: 'Iniciando enriquecimento de dados...',
            type: 'info',
            isVisible: true,
            newSalesCount: 0
          };

          api.post('/sales/enrich-existing-sales', { userId: mlAccountId, clientId, accountNickname, clientUid })
            .then(() => {
              const sseUrl = `${API_BASE_URL}/sales/sync-status/${clientId}?token=${encodeURIComponent(token.value)}&mlAccountId=${encodeURIComponent(mlAccountId)}`;
              es = new window.EventSource(sseUrl);

              es.onopen = () => {
                state.value.description = 'Conexão estabelecida. Iniciando enriquecimento...';
              };

              es.onmessage = (event) => {
                const data = JSON.parse(event.data);
                state.value.progress = data.progress;
                state.value.description = data.message;
                state.value.type = data.type || 'info';
                if (data.enrichedCount !== undefined) {
                  state.value.newSalesCount = data.enrichedCount;
                }
                if (data.progress === 100) {
                  state.value.isSyncing = false;
                  state.value.title =
                    data.type === 'success' ? `Sucesso: ${accountNickname}` :
                    data.type === 'error'   ? `Erro: ${accountNickname}` :
                                              `Finalizado: ${accountNickname}`;
                  closeToast(8000);
                  if (es) es.close();
                  if (data.type === 'error') reject(new Error(data.message));
                  else resolve();
                }
              };

              es.onerror = () => {
                state.value.isSyncing = false;
                state.value.title = `Erro: ${accountNickname}`;
                state.value.description = 'Erro na conexão com o servidor';
                state.value.type = 'error';
                closeToast(8000);
                if (es) es.close();
                reject(new Error('Erro na conexão com o servidor'));
              };
            })
            .catch((err) => {
              console.error(`[ENRICH ERROR] ${accountNickname}:`, err);
              state.value.isSyncing = false;
              state.value.title = `Erro: ${accountNickname}`;
              state.value.description = err.message || 'Erro desconhecido';
              state.value.type = 'error';
              closeToast(8000);
              reject(err);
            });
        })
        .catch((err) => {
          console.error(`[ENRICH ERROR] ${accountNickname}:`, err);
          state.value.isSyncing = false;
          state.value.title = `Erro: ${accountNickname}`;
          state.value.description = err.message || 'Erro desconhecido';
          state.value.type = 'error';
          closeToast(8000);
          reject(err);
        });
    });
  };

  return {
    syncState: state,
    liveAccounts,
    syncAccount,
    syncAccountsBatch,
    enrichExistingSales,
  };
}
