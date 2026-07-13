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

            <button @click="handleFixShippingModes" :disabled="fixState.running || syncState.isSyncing || isFetchingAccounts"
                class="btn btn-fix" title="Reprocessa vendas marcadas como 'Outros' e corrige a modalidade">
                <svg v-if="fixState.running" class="sync-spinner" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                <span v-if="fixState.running">Corrigindo... {{ fixState.fixed }} corrigidas</span>
                <span v-else>Corrigir modalidades</span>
            </button>
          </div>
        </div>

        <div v-if="fixState.message" class="fix-banner" :class="{ done: !fixState.running }">
            {{ fixState.message }}
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

          <!-- Cartões de resumo -->
          <div v-if="syncResults.accounts.length > 0" class="sr-stats">
              <div class="sr-card">
                  <span class="sr-card-icon is-accounts">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </span>
                  <div class="sr-card-body">
                      <span class="sr-card-value">{{ displayStats.contas }}</span>
                      <span class="sr-card-label">Contas</span>
                  </div>
              </div>
              <div class="sr-card is-new">
                  <span class="sr-card-icon is-new">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </span>
                  <div class="sr-card-body">
                      <span class="sr-card-value">{{ displayStats.novas }}</span>
                      <span class="sr-card-label">Vendas novas</span>
                  </div>
              </div>
              <div class="sr-card is-updated">
                  <span class="sr-card-icon is-updated">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  </span>
                  <div class="sr-card-body">
                      <span class="sr-card-value">{{ displayStats.atualizadas }}</span>
                      <span class="sr-card-label">Atualizadas</span>
                  </div>
              </div>
              <div class="sr-card is-time" v-if="syncResults.totalDurationMs">
                  <span class="sr-card-icon is-time">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </span>
                  <div class="sr-card-body">
                      <span class="sr-card-value sr-card-value-sm">{{ formatDuration(syncResults.totalDurationMs) }}</span>
                      <span class="sr-card-label">Tempo total</span>
                  </div>
              </div>
              <div class="sr-card is-error" v-if="syncResults.summary.failed > 0">
                  <span class="sr-card-icon is-error">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  </span>
                  <div class="sr-card-body">
                      <span class="sr-card-value">{{ displayStats.falhas }}</span>
                      <span class="sr-card-label">Falharam</span>
                  </div>
              </div>
          </div>

          <!-- Detalhes só das contas que tiveram novidade/erro -->
          <div v-if="relevantAccounts.length > 0" class="sr-accounts">
              <h4 class="sr-subtitle">Contas com novidade</h4>
              <div class="sr-account" v-for="account in relevantAccounts" :key="account.userId" :class="account.status">
                  <span class="sr-account-status" :class="account.status">
                      <svg v-if="account.status === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  </span>
                  <div class="sr-account-info">
                      <span class="sr-account-name">{{ account.nickname }}</span>
                      <span class="sr-account-id">ML {{ account.userId }}<span v-if="account.durationMs" class="sr-account-time"> · {{ formatDuration(account.durationMs) }}</span></span>
                  </div>
                  <div class="sr-account-badges" v-if="account.status === 'success'">
                      <span class="sr-badge is-new" v-if="account.newSalesCount > 0">{{ account.newSalesCount }} nova{{ account.newSalesCount > 1 ? 's' : '' }}</span>
                      <span class="sr-badge is-updated" v-if="account.updatedCount > 0">{{ account.updatedCount }} atualizada{{ account.updatedCount > 1 ? 's' : '' }}</span>
                  </div>
                  <div class="sr-account-badges" v-else>
                      <span class="sr-account-error">{{ account.message }}</span>
                  </div>
              </div>
          </div>

          <!-- Quando nada mudou em conta nenhuma -->
          <div v-else-if="syncResults.accounts.length > 0" class="sr-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span>Tudo em dia. Nenhuma conta teve venda nova ou alteração.</span>
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

    <SyncLiveModal :open="isSyncLiveOpen" :accounts="liveAccounts" title="Sincronização global em andamento..." />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import gsap from 'gsap';
import SidebarComponent from '../components/SidebarComponent.vue';
import TopbarComponent from '../components/TopbarComponent.vue';
import MasterSalesTable from '../components/MasterSalesTable.vue';
import UniversalModal from '../components/UniversalModal.vue';
import SyncLiveModal from '../components/SyncLiveModal.vue';
import ToastNotification from '../components/ToastNotification.vue';
import { useApi } from '@/composables/useApi';
import { useSyncManager } from '@/composables/useSyncManager';

const api = useApi();
const { syncState, liveAccounts, syncAccountsBatch } = useSyncManager();

const masterTableRef = ref(null);
const isFetchingAccounts = ref(false);
const isSyncResultsModalOpen = ref(false);
const isSyncLiveOpen = ref(false);

const syncResults = ref({
    title: '',
    type: 'success',
    accounts: [],
    summary: { total: 0, successful: 0, failed: 0 },
    totalNewSales: 0
});

// Só mostra no detalhamento as contas que realmente tiveram algo (venda nova,
// atualização) ou que falharam. Contas sem novidade não poluem o modal.
const relevantAccounts = computed(() =>
    (syncResults.value.accounts || []).filter(a =>
        a.status === 'error' || (a.newSalesCount || 0) > 0 || (a.updatedCount || 0) > 0
    )
);

function formatDuration(ms) {
    if (!ms || ms < 0) return '—';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    const s = ms / 1000;
    if (s < 60) return `${s.toFixed(1).replace('.', ',')}s`;
    const m = Math.floor(s / 60);
    const rem = Math.round(s % 60);
    return `${m}m ${String(rem).padStart(2, '0')}s`;
}

// Contadores animados (count-up) do modal global.
const animatedStats = reactive({ contas: 0, novas: 0, atualizadas: 0, semAlteracao: 0, falhas: 0 });
const displayStats = computed(() => ({
    contas: Math.round(animatedStats.contas),
    novas: Math.round(animatedStats.novas),
    atualizadas: Math.round(animatedStats.atualizadas),
    semAlteracao: Math.round(animatedStats.semAlteracao),
    falhas: Math.round(animatedStats.falhas),
}));

watch(isSyncResultsModalOpen, (open) => {
    if (!open) return;
    animatedStats.contas = 0;
    animatedStats.novas = 0;
    animatedStats.atualizadas = 0;
    animatedStats.semAlteracao = 0;
    animatedStats.falhas = 0;
    gsap.to(animatedStats, {
        contas: syncResults.value.summary?.total || 0,
        novas: syncResults.value.totalNewSales || 0,
        atualizadas: syncResults.value.totalUpdated || 0,
        semAlteracao: syncResults.value.totalSkipped || 0,
        falhas: syncResults.value.summary?.failed || 0,
        duration: 0.9,
        ease: 'power2.out'
    });
});

// Correção de modalidades "Outros": chama o endpoint em lotes (o app manda o
// JWT no header) até não haver mais progresso, mostrando o total corrigido.
const fixState = ref({ running: false, fixed: 0, remaining: null, message: '' });

const handleFixShippingModes = async () => {
    if (fixState.value.running) return;
    fixState.value = { running: true, fixed: 0, remaining: null, message: 'Iniciando correção de modalidades...' };
    try {
        let totalFixed = 0;
        let rounds = 0;
        const maxRounds = 1000; // trava de segurança contra loop infinito
        while (rounds < maxRounds) {
            rounds++;
            const r = await api.get('/sales/fix-shipping-modes?limit=500');
            const fixed = r?.fixed || 0;
            totalFixed += fixed;
            fixState.value.fixed = totalFixed;
            fixState.value.remaining = r?.totalRemaining ?? null;
            fixState.value.message = `Corrigindo... ${totalFixed} corrigida(s). Restam ~${Math.max(0, (r?.totalRemaining || 0))}.`;
            // Para quando não há mais o que processar ou a rodada não avançou.
            if (!r || r.processed === 0 || fixed === 0) break;
        }
        fixState.value.running = false;
        fixState.value.message = totalFixed > 0
            ? `Concluído. ${totalFixed} venda(s) tiveram a modalidade corrigida.`
            : 'Nada para corrigir. Nenhuma venda em "Outros" com modalidade recuperável.';
        // Recarrega a tabela para refletir as modalidades corrigidas.
        if (masterTableRef.value && masterTableRef.value.fetchSales) {
            await masterTableRef.value.fetchSales();
        } else {
            window.dispatchEvent(new Event('reload-master-sales'));
        }
    } catch (e) {
        fixState.value.running = false;
        fixState.value.message = `Erro ao corrigir modalidades: ${e?.message || 'desconhecido'}`;
    }
};

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

        // Abre o painel de progresso ao vivo enquanto sincroniza.
        isSyncLiveOpen.value = true;

        // Sincroniza todas as contas em paralelo controlado (o backend limita
        // globalmente o rate do ML). Sem esperas artificiais e sem recarregar
        // a tabela a cada conta — só uma vez no final.
        const batch = await syncAccountsBatch(
            accounts.map(account => ({
                mlAccountId: account.user_id,
                accountNickname: account.nickname,
                clientUid: account.uid,
                daysToSync: null
            })),
            { concurrency: accounts.length }
        );

        successCount = batch.summary.successful;
        errorCount = batch.summary.failed;
        for (const r of batch.results) {
            accountResults.push({
                nickname: r.accountNickname,
                userId: r.mlAccountId,
                uid: r.clientUid,
                status: r.status,
                newSalesCount: r.newSalesCount || 0,
                updatedCount: r.updatedCount || 0,
                skippedCount: r.skippedCount || 0,
                durationMs: r.durationMs || 0,
                message: r.status === 'error' ? (r.message || 'Erro desconhecido') : ''
            });
        }

        // Fecha o painel ao vivo antes de mostrar o resumo.
        isSyncLiveOpen.value = false;

        if (masterTableRef.value && masterTableRef.value.fetchSales) {
           await masterTableRef.value.fetchSales();
        } else {
           // Força reload caso ref não bata com metodo interno
           window.dispatchEvent(new Event('reload-master-sales'));
        }

        syncResults.value = {
            title: errorCount > 0 ? 'Sincronização global finalizada com problemas' : 'Sincronização global finalizada',
            type: errorCount > 0 ? 'warning' : 'success',
            accounts: accountResults,
            summary: {
                total: totalAccounts,
                successful: successCount,
                failed: errorCount
            },
            totalNewSales: batch.totalNewSales,
            totalUpdated: batch.totalUpdated,
            totalSkipped: batch.totalSkipped,
            totalDurationMs: batch.totalDurationMs
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
        isSyncLiveOpen.value = false;
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

.sync-time-select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: white;
  font-size: 0.875rem;
  color: #374151;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
}

.sync-time-select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.sync-time-select:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
  opacity: 0.7;
}

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

<style scoped>
/* ===== Modal de sincronização global (mesmo padrão profissional) ===== */
.sync-results-content { display: flex; flex-direction: column; gap: 20px; font-family: 'Inter', system-ui, sans-serif; }

.sync-message {
    padding: 12px 16px; border-radius: 10px; font-size: 14px; line-height: 1.5;
    background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0;
}
.sync-message.warning { background: #fffbeb; color: #92400e; border-color: #fde68a; }
.sync-message.error   { background: #fef2f2; color: #991b1b; border-color: #fecaca; }
.sync-message.success { background: #f0fdf4; color: #166534; border-color: #bbf7d0; }

.sr-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; }
.sr-card {
    display: flex; align-items: center; gap: 12px; padding: 16px 14px;
    background: #fff; border: 1px solid #eef0f4; border-radius: 14px;
    box-shadow: 0 1px 2px rgba(16,24,40,0.04);
    transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
    animation: sr-pop .35s ease both;
}
.sr-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(16,24,40,0.08); border-color: #e2e8f0; }
@keyframes sr-pop { from { opacity: 0; transform: translateY(6px);} to { opacity: 1; transform: translateY(0);} }

.sr-card-icon {
    display: inline-flex; align-items: center; justify-content: center;
    width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
    background: #eef2ff; color: #4f46e5;
}
.sr-card-icon svg { width: 20px; height: 20px; }
.sr-card-icon.is-new     { background: #ecfdf5; color: #059669; }
.sr-card-icon.is-updated { background: #eff6ff; color: #2563eb; }
.sr-card-icon.is-muted   { background: #f1f5f9; color: #64748b; }
.sr-card-icon.is-error   { background: #fef2f2; color: #dc2626; }

.sr-card-body { display: flex; flex-direction: column; line-height: 1.1; }
.sr-card-value { font-size: 24px; font-weight: 700; color: #0f172a; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
.sr-card-label { font-size: 12px; color: #64748b; margin-top: 3px; font-weight: 500; }

.sr-subtitle { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: #64748b; margin: 0 0 10px; }
.sr-accounts { max-height: 320px; overflow-y: auto; padding-right: 4px; }
.sr-account {
    display: flex; align-items: center; gap: 12px; padding: 12px 14px;
    border: 1px solid #eef0f4; border-radius: 12px; margin-bottom: 8px; background: #fff;
    transition: background .15s ease, box-shadow .15s ease;
}
.sr-account:hover { box-shadow: 0 4px 14px rgba(16,24,40,0.06); }
.sr-account.success { border-left: 3px solid #10b981; }
.sr-account.error   { border-left: 3px solid #ef4444; background: #fef2f2; }

.sr-account-status { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.sr-account-status svg { width: 22px; height: 22px; }
.sr-account-status.success { color: #10b981; }
.sr-account-status.error   { color: #ef4444; }

.sr-account-info { display: flex; flex-direction: column; min-width: 0; }
.sr-account-name { font-size: 14px; font-weight: 600; color: #0f172a; }
.sr-account-id { font-size: 12px; color: #94a3b8; }

.sr-account-badges { margin-left: auto; display: flex; flex-wrap: wrap; gap: 6px; justify-content: flex-end; }
.sr-badge { font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 999px; white-space: nowrap; }
.sr-badge.is-new     { background: #ecfdf5; color: #059669; }
.sr-badge.is-updated { background: #eff6ff; color: #2563eb; }
.sr-account-error { font-size: 13px; color: #b91c1c; text-align: right; }

.sr-empty {
    display: flex; flex-direction: column; align-items: center; gap: 10px;
    padding: 28px 16px; color: #64748b; text-align: center; font-size: 14px;
}
.sr-empty svg { width: 34px; height: 34px; color: #10b981; }
</style>

<style scoped>
.sr-card-icon.is-time { background: #fef3c7; color: #d97706; }
.sr-card-value-sm { font-size: 19px; }
.sr-account-time { color: #cbd5e1; font-weight: 500; }

/* Botão "Corrigir modalidades" e banner de progresso */
.btn-fix {
    display: inline-flex; align-items: center; gap: 8px;
    background: #fff; color: #b45309; border: 1px solid #fcd34d;
    border-radius: 10px; padding: 0 14px; height: 40px; font-weight: 600;
    cursor: pointer; transition: background .15s ease, box-shadow .15s ease;
}
.btn-fix:hover:not(:disabled) { background: #fffbeb; box-shadow: 0 4px 12px rgba(180,131,9,0.15); }
.btn-fix:disabled { opacity: .6; cursor: default; }
.fix-banner {
    margin: 10px 0 0; padding: 10px 14px; border-radius: 10px;
    background: #fffbeb; color: #92400e; border: 1px solid #fde68a; font-size: 14px;
}
.fix-banner.done { background: #f0fdf4; color: #166534; border-color: #bbf7d0; }
</style>
