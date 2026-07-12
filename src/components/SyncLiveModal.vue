<template>
    <UniversalModal :open="open" :title="title" :prevent-close="true" :show-close-button="false" :close-on-esc="false" :close-on-overlay="false" :lock-scroll="false" size="lg">
        <div class="live-content">
            <!-- Progresso geral -->
            <div class="live-overall">
                <div class="live-overall-head">
                    <span class="live-overall-label">
                        <span class="live-spinner" v-if="doneCount < accounts.length"></span>
                        {{ doneCount }} de {{ accounts.length }} contas concluídas
                    </span>
                    <span class="live-overall-pct">{{ overallProgress }}%</span>
                </div>
                <div class="live-bar live-bar-lg">
                    <div class="live-bar-fill" :style="{ width: overallProgress + '%' }"></div>
                </div>
            </div>

            <!-- Lista de contas com barra individual -->
            <div class="live-list">
                <div class="live-account" v-for="acc in accounts" :key="acc.mlAccountId" :class="acc.status">
                    <div class="live-account-top">
                        <span class="live-status-icon" :class="acc.status">
                            <!-- pendente -->
                            <svg v-if="acc.status === 'pending'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            <!-- sincronizando -->
                            <span v-else-if="acc.status === 'syncing'" class="live-spinner sm"></span>
                            <!-- concluído -->
                            <svg v-else-if="acc.status === 'done'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            <!-- erro -->
                            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                        </span>
                        <div class="live-account-info">
                            <span class="live-account-name">{{ acc.nickname }}</span>
                            <span class="live-account-msg">
                                {{ acc.message }}
                                <span v-if="(acc.status === 'done' || acc.status === 'error') && acc.durationMs" class="live-account-time"> · {{ fmtDuration(acc.durationMs) }}</span>
                            </span>
                        </div>
                        <div class="live-account-badges" v-if="acc.status === 'done'">
                            <span class="live-badge is-new" v-if="acc.newSalesCount > 0">{{ acc.newSalesCount }} nova{{ acc.newSalesCount > 1 ? 's' : '' }}</span>
                            <span class="live-badge is-updated" v-if="acc.updatedCount > 0">{{ acc.updatedCount }} atualizada{{ acc.updatedCount > 1 ? 's' : '' }}</span>
                            <span class="live-badge is-muted" v-if="!acc.newSalesCount && !acc.updatedCount">Sem novidade</span>
                        </div>
                    </div>
                    <div class="live-bar">
                        <div class="live-bar-fill" :class="acc.status" :style="{ width: (acc.progress || 0) + '%' }"></div>
                    </div>
                </div>
            </div>
        </div>
    </UniversalModal>
</template>

<script setup>
/* global defineProps */
import { computed } from 'vue';
import UniversalModal from './UniversalModal.vue';

const props = defineProps({
    open: { type: Boolean, default: false },
    accounts: { type: Array, default: () => [] },
    title: { type: String, default: 'Sincronizando...' }
});

const doneCount = computed(() =>
    props.accounts.filter(a => a.status === 'done' || a.status === 'error').length
);

const overallProgress = computed(() => {
    if (!props.accounts.length) return 0;
    if (doneCount.value === props.accounts.length) return 100;
    const knownWork = props.accounts.filter(a => Number(a.workTotal) > 0);
    const allDiscovered = knownWork.length === props.accounts.length;
    const total = knownWork.reduce((sum, a) => sum + Number(a.workTotal || 0), 0);
    const completed = knownWork.reduce((sum, a) => sum + Math.min(Number(a.workCompleted || 0), Number(a.workTotal || 0)), 0);
    if (!total) return 0;
    const calculated = Math.round((completed / total) * 100);
    // Until every account reports its workload, never imply the global job is
    // almost done. All accounts are started together, so discovery is brief.
    return allDiscovered ? Math.min(doneCount.value < props.accounts.length ? 99 : 100, calculated) : Math.min(90, calculated);
});

function fmtDuration(ms) {
    if (!ms || ms < 0) return '';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    const s = ms / 1000;
    if (s < 60) return `${s.toFixed(1).replace('.', ',')}s`;
    const m = Math.floor(s / 60);
    return `${m}m ${String(Math.round(s % 60)).padStart(2, '0')}s`;
}
</script>

<style scoped>
.live-content { display: flex; flex-direction: column; gap: 18px; font-family: 'Inter', system-ui, sans-serif; }

.live-overall-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.live-overall-label { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #334155; }
.live-overall-pct { font-size: 14px; font-weight: 700; color: #4f46e5; font-variant-numeric: tabular-nums; }

.live-bar { width: 100%; height: 8px; background: #eef0f4; border-radius: 999px; overflow: hidden; }
.live-bar-lg { height: 12px; }
.live-bar-fill {
    height: 100%; background: linear-gradient(90deg, #6366f1, #4f46e5);
    border-radius: 999px; transition: width 0.4s ease;
}
.live-bar-fill.done  { background: linear-gradient(90deg, #10b981, #059669); }
.live-bar-fill.error { background: linear-gradient(90deg, #f43f5e, #e11d48); }

.live-list { display: flex; flex-direction: column; gap: 10px; max-height: 360px; overflow-y: auto; padding-right: 4px; }
.live-account {
    border: 1px solid #eef0f4; border-radius: 12px; padding: 12px 14px; background: #fff;
    display: flex; flex-direction: column; gap: 10px;
    transition: border-color 0.2s ease;
}
.live-account.syncing { border-color: #c7d2fe; }
.live-account.done    { border-left: 3px solid #10b981; }
.live-account.error   { border-left: 3px solid #ef4444; background: #fef2f2; }

.live-account-top { display: flex; align-items: center; gap: 12px; }
.live-status-icon { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; flex-shrink: 0; color: #94a3b8; }
.live-status-icon svg { width: 22px; height: 22px; }
.live-status-icon.done  { color: #10b981; }
.live-status-icon.error { color: #ef4444; }
.live-status-icon.syncing { color: #4f46e5; }

.live-account-info { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.live-account-name { font-size: 14px; font-weight: 600; color: #0f172a; }
.live-account-msg { font-size: 12px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.live-account-time { color: #cbd5e1; font-weight: 600; }

.live-account-badges { display: flex; gap: 6px; flex-shrink: 0; }
.live-badge { font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 999px; white-space: nowrap; }
.live-badge.is-new     { background: #ecfdf5; color: #059669; }
.live-badge.is-updated { background: #eff6ff; color: #2563eb; }
.live-badge.is-muted   { background: #f1f5f9; color: #64748b; }

/* Spinner */
.live-spinner {
    display: inline-block; width: 16px; height: 16px;
    border: 2px solid #c7d2fe; border-top-color: #4f46e5;
    border-radius: 50%; animation: live-spin 0.7s linear infinite;
}
.live-spinner.sm { width: 18px; height: 18px; }
@keyframes live-spin { to { transform: rotate(360deg); } }
</style>
