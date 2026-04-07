<template>
  <div class="admin-wrapper">
    <SidebarComponent />
    <div class="main-content">
      <TopbarComponent />
      
      <div class="content-area">
        <div class="header">
          <div>
            <h1 class="title">Tabelão de Vendas (Master)</h1>
            <p class="subtitle">Visão global e unificada de todas as vendas de todos os clientes.</p>
          </div>
          <div class="header-actions">
            <button @click="handleGlobalSync" :disabled="syncState.isSyncing || isFetchingAccounts"
                :class="['btn', 'sync-btn', 'btn-primary']" 
                title="Sincronizar massivamente todas as contas do sistema">
                <svg v-if="syncState.isSyncing" class="sync-spinner"
                    xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                <span v-if="isFetchingAccounts">Buscando contas...</span>
                <span v-else-if="syncState.isSyncing">Sincronizando...</span>
                <span v-else>Sincronizar Tudo</span>
                
                <span v-if="syncState.newSalesCount > 0" class="new-sales-badge">
                    {{ syncState.newSalesCount }}
                </span>
            </button>
          </div>
        </div>

        <div class="table-card">
          <MasterSalesTable ref="masterTableRef" />
        </div>
      </div>
    </div>

    <UniversalModal :open="isSyncResultsModalOpen" :title="syncResults.title" @close="isSyncResultsModalOpen = false" size="lg">
      <div class="sync-results-content">
          <div v-if="syncResults.message" class="sync-message" :class="syncResults.type">
              {{ syncResults.message }}
          </div>
          
          <div v-if="syncResults.accounts.length > 0" class="sync-summary">
              <div class="summary-stats">
                  <div class="stat-item">
                      <span class="stat-label">Total G./Contas</span>
                      <span class="stat-value">{{ syncResults.summary.total }}</span>
                  </div>
                  <div class="stat-item success" v-if="syncResults.summary.successful > 0">
                      <span class="stat-label">Sucesso</span>
                      <span class="stat-value">{{ syncResults.summary.successful }}</span>
                  </div>
                  <div class="stat-item error" v-if="syncResults.summary.failed > 0">
                      <span class="stat-label">Falhas</span>
                      <span class="stat-value">{{ syncResults.summary.failed }}</span>
                  </div>
                  <div class="stat-item" v-if="syncResults.totalNewSales !== undefined">
                      <span class="stat-label">Novas Vendas (Total)</span>
                      <span class="stat-value">{{ syncResults.totalNewSales }}</span>
                  </div>
              </div>
          </div>
          
          <div v-if="syncResults.accounts.length > 0" class="accounts-details">
              <h4 class="modal-subtitle">📊 Detalhes do Processamento Massivo</h4>
              <div class="accounts-list">
                  <div v-for="account in syncResults.accounts" :key="account.userId" class="account-item" :class="account.status">
                      <div class="account-header">
                          <div class="account-info">
                              <span class="account-icon" v-if="account.status === 'success'">✅</span>
                              <span class="account-icon" v-else>❌</span>
                              <div class="account-details">
                                  <span class="account-nickname">{{ account.nickname }}</span>
                                  <small class="account-id">(Client UID: {{ account.uid }} | ML: {{ account.userId }})</small>
                              </div>
                          </div>
                      </div>
                      <div class="account-message" v-if="account.message">
                          {{ account.message }}
                      </div>
                  </div>
              </div>
          </div>
      </div>
      
      <template #footer>
          <button @click="isSyncResultsModalOpen = false" class="btn btn-primary">
              Fechar
          </button>
      </template>
    </UniversalModal>

    <ToastNotification :is-visible="syncState.isVisible" :title="syncState.title"
            :description="syncState.description" :progress="syncState.progress" :type="syncState.type" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import SidebarComponent from '../components/SidebarComponent.vue';
import TopbarComponent from '../components/TopbarComponent.vue';
import MasterSalesTable from '../components/MasterSalesTable.vue';
import UniversalModal from '../components/UniversalModal.vue';
import ToastNotification from '../components/ToastNotification.vue';
import { useApi } from '@/composables/useApi';
import { useSyncManager } from '@/composables/useSyncManager';

const api = useApi();
const { syncState, syncAccount } = useSyncManager();

const masterTableRef = ref(null);
const isFetchingAccounts = ref(false);
const isSyncResultsModalOpen = ref(false);

const syncResults = ref({
    title: '',
    type: 'success',
    accounts: [],
    summary: { total: 0, successful: 0, failed: 0 },
    totalNewSales: 0
});

const handleGlobalSync = async () => {
    isFetchingAccounts.value = true;
    let successCount = 0;
    let errorCount = 0;
    let totalAccounts = 0;
    const accountResults = [];

    try {
        const mlAccountsData = await api.get('/ml/all-accounts');
        const accounts = Array.isArray(mlAccountsData) ? mlAccountsData : [];

        if (accounts.length === 0) {
            syncResults.value = {
                title: 'Atenção', type: 'warning', accounts: [],
                summary: { total: 0, successful: 0, failed: 0 },
                message: 'Nenhuma conta ativa do Mercado Livre no sistema inteiro para sincronizar.'
            };
            isSyncResultsModalOpen.value = true;
            isFetchingAccounts.value = false;
            return;
        }

        totalAccounts = accounts.length;
        let totalNewSalesFound = 0;

        for (const account of accounts) {
            try {
                // Passamos o uid para garantir a sincronização do cliente correto (mesmo sendo master)
                syncState.value.newSalesCount = 0; // zera pro Toast
                await syncAccount(account.user_id, account.nickname, account.uid);
                successCount++;
                
                const foundForThisAccount = syncState.value.newSalesCount || 0;
                totalNewSalesFound += foundForThisAccount;

                await new Promise(resolve => setTimeout(resolve, 1000));
                
                accountResults.push({
                    nickname: account.nickname,
                    userId: account.user_id,
                    uid: account.uid,
                    status: 'success',
                    message: `Sincronizada. Novas vendas nesta conta: ${foundForThisAccount}`
                });
            } catch (err) {
                errorCount++;
                console.error(`Falha ao sincronizar a conta ${account.nickname} globalmente:`, err);
                
                accountResults.push({
                    nickname: account.nickname,
                    userId: account.user_id,
                    uid: account.uid,
                    status: 'error',
                    message: err.message || 'Erro desconhecido'
                });
            }
        }

        if (masterTableRef.value && masterTableRef.value.fetchSales) {
           await masterTableRef.value.fetchSales();
        } else {
           // Força reload caso ref não bata com metodo interno
           window.dispatchEvent(new Event('reload-master-sales'));
        }

        // Exibe modal apenas se processou várias (ou com erro/sucesso)
        syncResults.value = {
            title: errorCount > 0 ? 'Sincronização Global Finalizada com Problemas' : 'Sincronização Global Finalizada',
            type: errorCount > 0 ? 'warning' : 'success',
            accounts: accountResults,
            summary: {
                total: totalAccounts,
                successful: successCount,
                failed: errorCount
            },
            totalNewSales: totalNewSalesFound
        };
        isSyncResultsModalOpen.value = true;

    } catch (err) {
        console.error("Falha geral na sincronização master:", err);
        syncResults.value = {
            title: 'Erro Geral', type: 'error', accounts: [],
            summary: { total: 0, successful: 0, failed: 0 },
            message: err.message
        };
        isSyncResultsModalOpen.value = true;
    } finally {
        isFetchingAccounts.value = false;
        syncState.value.isForced = false;
    }
};

</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.admin-wrapper {
  display: flex;
  min-height: 100vh;
  margin: 0;
  padding: 0;
  font-family: 'Inter', sans-serif;
  background-color: #f3f4f6;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.content-area {
  flex: 1;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.header {
  display: flex; 
  justify-content: space-between; 
  align-items: center;
  margin-bottom: 1rem; 
  flex-wrap: wrap; 
  gap: .75rem;
}

.title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;
  margin-top: 0;
}

.subtitle {
  font-size: 1rem;
  color: #4b5563;
  margin: 0;
}

.table-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.375rem;
  border: 1px solid transparent;
  cursor: pointer;
  transition: background-color 0.2s;
  gap: 0.5rem;
}

.btn-primary { background-color: #3b82f6; color: white; }
.btn-primary:hover { background-color: #2563eb; }
.btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

.sync-spinner { animation: spin 1.2s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }

/* ===== Modal Styles Reused from TabelaVendas ===== */
.sync-results-content { max-height: 70vh; overflow-y: auto; padding-right: 0.5rem; }
.sync-message { padding: 1rem; border-radius: 6px; margin-bottom: 1rem; font-weight: 500; }
.sync-message.warning { background-color: #fffbeb; color: #b45309; border: 1px solid #fef3c7; }
.sync-message.error { background-color: #fef2f2; color: #b91c1c; border: 1px solid #fee2e2; }
.sync-summary { margin-bottom: 1.5rem; }
.summary-stats { display: flex; gap: 1rem; flex-wrap: wrap; }
.stat-item { flex: 1; min-width: 120px; background-color: #f3f4f6; padding: 1rem; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.stat-label { font-size: 0.75rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem; font-weight: 600; }
.stat-value { font-size: 1.5rem; font-weight: 700; color: #111827; }
.stat-item.success .stat-value { color: #10b981; }
.stat-item.error .stat-value { color: #ef4444; }
.modal-subtitle { font-size: 1.1rem; font-weight: 600; color: #374151; margin-bottom: 1rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.5rem; }
.accounts-list { display: flex; flex-direction: column; gap: 0.75rem; }
.account-item { border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; background-color: #f9fafb; transition: all 0.2s; }
.account-item.success { border-left: 4px solid #10b981; }
.account-item.error { border-left: 4px solid #ef4444; }
.account-header { display: flex; justify-content: space-between; align-items: flex-start; }
.account-info { display: flex; align-items: flex-start; gap: 0.5rem; }
.account-icon { font-size: 1.25rem; line-height: 1; }
.account-nickname { font-weight: 600; color: #1f2937; display: block; }
.account-id { color: #6b7280; font-size: 0.75rem; }
.account-message { margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px dashed #e5e7eb; font-size: 0.875rem; color: #4b5563; }
.account-item.error .account-message { color: #b91c1c; font-weight: 500; }

.new-sales-badge {
    background-color: #ef4444;
    color: white;
    font-size: 0.7rem;
    font-weight: bold;
    padding: 0.1rem 0.4rem;
    border-radius: 9999px;
}
</style>
