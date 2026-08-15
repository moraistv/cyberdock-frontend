<template>
    <div class="dashboard-wrapper" :class="{ 'is-modal-view': isModalView }">
        <SidebarComponent v-if="!isModalView" />
        <div class="main-content">
            <TopbarComponent v-if="!isModalView" />
            <main class="dashboard-content" ref="contentArea">
                <header v-if="!isModalView" class="billing-header">
                    <div class="header-copy">
                        <span class="header-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none"><path d="M7 3h10a2 2 0 0 1 2 2v16l-3-2-4 2-4-2-3 2V5a2 2 0 0 1 2-2Z"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>
                        </span>
                        <div>
                            <h1 class="dashboard-title">Resumo de Cobrança</h1>
                            <p class="dashboard-subtitle">Acompanhe competências, serviços e faturas em um só lugar.</p>
                        </div>
                    </div>
                </header>

                <div v-if="isLoading" class="skeleton-loader">
                    <div class="sk-header"></div>
                    <div class="sk-filters"><div class="sk-filter-group"></div></div>
                    <div class="sk-grid-5">
                        <div class="sk-card" v-for="n in 5" :key="n">
                            <div class="sk-card-title"></div>
                            <div class="sk-card-value"></div>
                            <div class="sk-card-description"></div>
                        </div>
                    </div>
                    <div class="sk-composition"></div>
                    <div class="sk-table-header"><div class="sk-table-title"></div></div>
                    <div class="sk-table">
                        <div class="sk-table-head"><div class="sk-head-cell" v-for="m in 5" :key="m"></div></div>
                        <div class="sk-row" v-for="n in 5" :key="n"><div class="sk-cell" v-for="m in 5" :key="m"></div></div>
                    </div>
                </div>

                <div v-else-if="error" class="error-state">
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.5"/></svg>
                    <span>{{ error }}</span>
                </div>

                <template v-else-if="invoices.length > 0">
                    <section class="period-panel" aria-label="Seleção de competência">
                        <div class="period-summary">
                            <span class="period-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>
                            </span>
                            <div>
                                <span class="period-eyebrow">Competência ativa</span>
                                <strong>{{ selectedPeriod }}</strong>
                            </div>
                        </div>
                        <div class="filter-group">
                            <label for="period-filter">Alterar competência</label>
                            <div class="select-shell">
                                <select id="period-filter" v-model="selectedPeriod" @change="handlePeriodChange" class="filter-select">
                                    <option v-for="invoice in invoices" :key="invoice.id" :value="invoice.period">{{ invoice.period }}</option>
                                </select>
                                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m6 8 4 4 4-4"/></svg>
                            </div>
                        </div>
                    </section>

                    <template v-if="currentInvoice">
                        <section class="stats-cards-grid-5" aria-label="Indicadores da fatura">
                            <article class="stat-card stat-card-primary">
                                <div class="card-heading">
                                    <span class="kpi-icon" aria-hidden="true">
                                        <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/></svg>
                                    </span>
                                    <h2 class="card-title">Valor da Fatura</h2>
                                </div>
                                <p class="metric-value">{{ formattedAnimatedTotalAmount }}</p>
                                <p class="card-description">Vencimento: {{ currentInvoice.dueDate }}</p>
                            </article>

                            <article class="stat-card">
                                <div class="card-heading">
                                    <span class="kpi-icon" aria-hidden="true">
                                        <svg viewBox="0 0 24 24" fill="none"><path d="M12 3 4.5 6v5c0 4.6 3.2 8.9 7.5 10 4.3-1.1 7.5-5.4 7.5-10V6L12 3Z"/><path d="m9 12 2 2 4-4"/></svg>
                                    </span>
                                    <h2 class="card-title">Status da Fatura</h2>
                                </div>
                                <p class="metric-value status-text">
                                    <span :class="['status-badge', currentInvoice.status === 'paid' ? 'status-paid' : 'status-open']">{{ currentInvoice.status === 'paid' ? 'Pago' : 'Em Aberto' }}</span>
                                </p>
                                <p v-if="currentInvoice.paymentDate" class="card-description">Pago em: {{ currentInvoice.paymentDate }}</p>
                                <p v-else class="card-description">Aguardando pagamento.</p>
                            </article>

                            <article class="stat-card">
                                <div class="card-heading">
                                    <span class="kpi-icon" aria-hidden="true">
                                        <svg viewBox="0 0 24 24" fill="none"><path d="m12 3 9 4.5-9 4.5-9-4.5L12 3Z"/><path d="m3 12 9 4.5 9-4.5M3 16.5 12 21l9-4.5"/></svg>
                                    </span>
                                    <h2 class="card-title">Armazenamento</h2>
                                </div>
                                <p class="metric-value">{{ animatedStorage.toFixed(0) }} <span class="metric-unit">item(s)</span></p>
                                <p class="card-description">Itens de armazenamento cobrados.</p>
                            </article>

                            <article class="stat-card">
                                <div class="card-heading">
                                    <span class="kpi-icon" aria-hidden="true">
                                        <svg viewBox="0 0 24 24" fill="none"><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z"/><circle cx="7" cy="19" r="2"/><circle cx="17" cy="19" r="2"/></svg>
                                    </span>
                                    <h2 class="card-title">Expedição Comum</h2>
                                </div>
                                <p class="metric-value">{{ animatedCommonShipments.toFixed(0) }}</p>
                                <p class="card-description">Unidades expedidas.</p>
                            </article>

                            <article class="stat-card">
                                <div class="card-heading">
                                    <span class="kpi-icon" aria-hidden="true">
                                        <svg viewBox="0 0 24 24" fill="none"><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z"/><circle cx="7" cy="19" r="2"/><circle cx="17" cy="19" r="2"/><path d="M6 3h7"/></svg>
                                    </span>
                                    <h2 class="card-title">Expedição Premium</h2>
                                </div>
                                <p class="metric-value">{{ animatedPremiumShipments.toFixed(0) }}</p>
                                <p class="card-description">Unidades expedidas.</p>
                            </article>
                        </section>

                        <section class="composition-card">
                            <div class="section-heading">
                                <div>
                                    <span class="section-eyebrow">Detalhamento financeiro</span>
                                    <h2>Composição da fatura</h2>
                                    <p>Participação proporcional de cada serviço no período.</p>
                                </div>
                                <div class="composition-total">
                                    <span>Total da competência</span>
                                    <strong>{{ formattedAnimatedTotalAmount }}</strong>
                                </div>
                            </div>
                            <div v-if="invoiceComposition.length" class="composition-list">
                                <article v-for="item in invoiceComposition" :key="`${item.type}-${item.description}`" class="composition-item">
                                    <div class="composition-meta">
                                        <div class="composition-name">
                                            <span class="composition-dot"></span>
                                            <div>
                                                <strong>{{ item.description }}</strong>
                                                <span>{{ item.quantity }} x {{ formatCurrency(item.unit_price) }}</span>
                                            </div>
                                        </div>
                                        <div class="composition-amount">
                                            <strong>{{ formatCurrency(item.total_price) }}</strong>
                                            <span>{{ item.percentage.toFixed(1) }}%</span>
                                        </div>
                                    </div>
                                    <div class="composition-track" aria-hidden="true">
                                        <span :style="{ width: `${item.percentage}%` }"></span>
                                    </div>
                                </article>
                            </div>
                            <p v-else class="composition-empty">Não há itens detalhados para esta competência.</p>
                        </section>

                        <!-- Serviços pontuais em cards. Antes só existiam como
                             linha crua dentro do modal de detalhes. -->
                        <section v-if="manualItems.length" class="composition-card">
                            <div class="section-heading">
                                <div>
                                    <span class="section-eyebrow">Fora da mensalidade</span>
                                    <h2>Serviços pontuais</h2>
                                </div>
                                <span class="invoice-count">{{ manualItems.length }} lançamento(s) · {{ formatCurrency(manualTotal) }}</span>
                            </div>
                            <div class="punctual-grid">
                                <article v-for="item in manualItems" :key="item.id || item.description" class="punctual-card">
                                    <h4>{{ item.description }}</h4>
                                    <p class="punctual-card__value">{{ formatCurrency(item.total_price) }}</p>
                                    <p class="punctual-card__detail">{{ item.quantity }} {{ unitLabel(item.unit, item.quantity) || 'un.' }} × {{ formatCurrency(item.unit_price) }}</p>
                                    <p v-if="item.service_date" class="punctual-card__date">Realizado em {{ formatDate(item.service_date) }}</p>
                                </article>
                            </div>
                        </section>
                    </template>

                    <section class="table-container">
                        <div class="table-header">
                            <div>
                                <span class="section-eyebrow">Visão consolidada</span>
                                <h2 class="table-title">Histórico de Faturas</h2>
                            </div>
                            <span class="invoice-count">{{ invoices.length }} {{ invoices.length === 1 ? 'fatura' : 'faturas' }}</span>
                        </div>
                        <div class="table-scroll">
                            <table class="history-table">
                                <thead>
                                    <tr>
                                        <th>Competência</th>
                                        <th>Valor Total</th>
                                        <th>Vencimento</th>
                                        <th>Status</th>
                                        <th><span class="sr-only">Ações</span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="invoice in invoices" :key="invoice.id" class="invoice-row">
                                        <td><span class="period-code">{{ invoice.period }}</span></td>
                                        <td class="invoice-value">{{ formatCurrency(invoice.totalAmount) }}</td>
                                        <td>{{ invoice.dueDate }}</td>
                                        <td>
                                            <span :class="['status-badge', invoice.status === 'paid' ? 'status-paid' : 'status-open']">{{ invoice.status === 'paid' ? 'Pago' : 'Em Aberto' }}</span>
                                        </td>
                                        <td class="action-cell">
                                            <button @click="openDetailsModal(invoice)" class="details-button">
                                                <span>Ver Detalhes</span>
                                                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m8 5 5 5-5 5"/></svg>
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>
                </template>

                <div v-else class="empty-state-full-page">
                    <span class="empty-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none"><path d="M7 3h10a2 2 0 0 1 2 2v16l-3-2-4 2-4-2-3 2V5a2 2 0 0 1 2-2Z"/><path d="M9 9h6M9 13h4"/></svg>
                    </span>
                    <h3>Nenhuma fatura encontrada</h3>
                    <p>Este usuário ainda não possui faturas.</p>
                </div>

                <UniversalModal
                    :is-open="isDetailsModalOpen"
                    @close="closeDetailsModal"
                    :title="`Detalhes da Fatura - ${selectedInvoiceForModal?.period}`"
                    size="lg"
                >
                    <div v-if="isLoading" class="skeleton-loader invoice-details-skeleton">
                        <div class="detail-block-wrapper">
                            <div v-for="n in 3" :key="n" class="detail-block sk-detail-block">
                                <div class="sk-detail-title"></div>
                                <div class="sk-detail-item" v-for="m in 2" :key="m"></div>
                            </div>
                        </div>
                    </div>
                    <div v-else-if="selectedInvoiceForModal" class="invoice-details-content">
                        <div class="invoice-meta">
                            <div><span>Competência</span><strong>{{ selectedInvoiceForModal.period }}</strong></div>
                            <div><span>Vencimento</span><strong>{{ selectedInvoiceForModal.dueDate }}</strong></div>
                            <div>
                                <span>Status</span>
                                <strong :class="['status-badge', getStatusClass(selectedInvoiceForModal.status)]">{{ getStatusLabel(selectedInvoiceForModal.status) }}</strong>
                            </div>
                            <div v-if="selectedInvoiceForModal.paymentDate"><span>Pago em</span><strong>{{ selectedInvoiceForModal.paymentDate }}</strong></div>
                        </div>

                        <!-- Agrupado por categoria com subtotal, no lugar de um
                             bloco por item com o tipo cru em inglês. -->
                        <section v-for="group in groupedItems(selectedInvoiceForModal)" :key="group.key" class="detail-group">
                            <header class="detail-group__head">
                                <h5>{{ group.label }}</h5>
                                <strong>{{ formatCurrency(group.subtotal) }}</strong>
                            </header>
                            <table class="detail-table">
                                <tbody>
                                    <tr v-for="item in group.items" :key="item.id || item.description">
                                        <td class="detail-table__desc">
                                            {{ item.description }}
                                            <small v-if="item.service_date">Realizado em {{ formatDate(item.service_date) }}</small>
                                        </td>
                                        <td class="detail-table__qty">{{ item.quantity }} {{ unitLabel(item.unit, item.quantity) }}</td>
                                        <td class="detail-table__unit">{{ formatCurrency(item.unit_price) }}</td>
                                        <td class="detail-table__total">{{ formatCurrency(item.total_price) }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>

                        <footer class="detail-total">
                            <span>Total da fatura</span>
                            <strong>{{ formatCurrency(selectedInvoiceForModal.totalAmount) }}</strong>
                        </footer>
                    </div>
                </UniversalModal>
            </main>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, defineProps } from 'vue';
import { useBilling } from '@/composables/useBilling';
import { useAuth } from '@/composables/useAuth';
import gsap from 'gsap';
import UniversalModal from '@/components/UniversalModal.vue';
import SidebarComponent from '@/components/SidebarComponent.vue';
import TopbarComponent from '@/components/TopbarComponent.vue';

const props = defineProps({
    userId: {
        type: String,
        default: null
    }
});

const { user } = useAuth();
const { invoices, isLoading, error, fetchInvoices } = useBilling();

const selectedPeriod = ref('');
const contentArea = ref(null);
const isDetailsModalOpen = ref(false);
const selectedInvoiceForModal = ref(null);

const animatedTotalAmount = ref(0);
const animatedStorage = ref(0);
const animatedCommonShipments = ref(0);
const animatedPremiumShipments = ref(0);

const isModalView = computed(() => !!props.userId);
const targetUserId = computed(() => props.userId || user.value?.uid);
const currentInvoice = computed(() => invoices.value.find(inv => inv.period === selectedPeriod.value) || null);
const formattedAnimatedTotalAmount = computed(() => formatCurrency(animatedTotalAmount.value));
const invoiceComposition = computed(() => {
    const items = currentInvoice.value?.items || [];
    const compositionTotal = items.reduce((total, item) => total + (Number(item.total_price) || 0), 0);

    return items.map(item => {
        const itemTotal = Number(item.total_price) || 0;
        const percentage = compositionTotal > 0 ? (itemTotal / compositionTotal) * 100 : 0;

        return {
            ...item,
            percentage: Math.max(0, Math.min(100, percentage))
        };
    });
});

const formatCurrency = (value) => {
    if (typeof value !== 'number') value = parseFloat(value || 0);
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return date.toLocaleDateString('pt-BR');
};

/** Rótulos das seções da fatura, no lugar de "Storage"/"Shipment"/"Manual". */
const ITEM_GROUPS = [
    { key: 'storage', label: 'Armazenamento' },
    { key: 'shipment', label: 'Expedição' },
    { key: 'manual', label: 'Serviços pontuais' },
];

const UNIT_LABELS = { m3: 'm³', pacote: 'pacote', viagem: 'viagem', venda: 'venda', unidade: 'unidade' };

function unitLabel(unit, quantity = 1) {
    const label = UNIT_LABELS[unit] || unit || '';
    if (!label || label === 'm³') return label;
    return Number(quantity) > 1 ? `${label}s` : label;
}

/** Agrupa os itens por categoria, com subtotal por seção. */
function groupedItems(invoice) {
    const items = invoice?.items || [];
    const groups = ITEM_GROUPS.map(({ key, label }) => {
        const groupItems = items.filter((i) => i.type === key);
        return {
            key,
            label,
            items: groupItems,
            subtotal: groupItems.reduce((sum, i) => sum + parseFloat(i.total_price || 0), 0),
        };
    }).filter((g) => g.items.length);

    // Tipo desconhecido não pode desaparecer da fatura por não estar mapeado.
    const known = ITEM_GROUPS.map((g) => g.key);
    const others = items.filter((i) => !known.includes(i.type));
    if (others.length) {
        groups.push({
            key: 'outros',
            label: 'Outros lançamentos',
            items: others,
            subtotal: others.reduce((sum, i) => sum + parseFloat(i.total_price || 0), 0),
        });
    }
    return groups;
}

// Serviços pontuais da competência selecionada, exibidos em cards próprios.
const manualItems = computed(() => (currentInvoice.value?.items || []).filter((i) => i.type === 'manual'));
const manualTotal = computed(() => manualItems.value.reduce((sum, i) => sum + parseFloat(i.total_price || 0), 0));

const handlePeriodChange = () => {
    if (targetUserId.value) {
        fetchInvoices(targetUserId.value, selectedPeriod.value);
    }
};

const openDetailsModal = (invoice) => {
  selectedInvoiceForModal.value = invoice;
  isDetailsModalOpen.value = true;
};

const closeDetailsModal = () => {
  isDetailsModalOpen.value = false;
  selectedInvoiceForModal.value = null;
};

const animateContentIn = () => {
    nextTick(() => {
        if (!contentArea.value) return;

        const header = contentArea.value.querySelector('.billing-header');
        const sections = contentArea.value.querySelectorAll('.period-panel, .stats-cards-grid-5 .stat-card, .composition-card, .table-container');
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        if (header) {
            tl.from(header, { opacity: 0, y: -16, duration: 0.4, clearProps: 'all' });
        }

        if (sections.length) {
            tl.from(sections, { opacity: 0, y: 18, stagger: 0.06, duration: 0.45, clearProps: 'all' }, header ? '-=0.15' : 0);
        }
    });
};

watch(currentInvoice, (newInvoice) => {
    if (!newInvoice || !newInvoice.items) {
        gsap.to(animatedTotalAmount, { duration: 0.5, value: 0 });
        gsap.to(animatedStorage, { duration: 0.5, value: 0 });
        gsap.to(animatedCommonShipments, { duration: 0.5, value: 0 });
        gsap.to(animatedPremiumShipments, { duration: 0.5, value: 0 });
        return;
    }

    const duration = 0.8;
    const ease = 'power2.out';

    gsap.to(animatedTotalAmount, { duration, value: newInvoice.totalAmount, ease });

    const totalStorageUnits = newInvoice.items
        .filter(i => i.type === 'storage')
        .reduce((acc, item) => acc + item.quantity, 0);
    gsap.to(animatedStorage, { duration, value: totalStorageUnits, ease });

    const commonShipmentItem = newInvoice.items.find(i => i.description === 'Expedição Comum');
    gsap.to(animatedCommonShipments, { duration, value: commonShipmentItem?.quantity || 0, ease });

    const premiumShipmentItem = newInvoice.items.find(i => i.description === 'Expedição Premium');
    gsap.to(animatedPremiumShipments, { duration, value: premiumShipmentItem?.quantity || 0, ease });

}, { immediate: true, deep: true });

watch(isLoading, (loading) => {
    if (!loading && !error.value && invoices.value.length > 0) {
        animateContentIn();
    }
});

const loadInitialData = async () => {
    if (targetUserId.value) {
        const currentPeriod = new Date().toISOString().slice(0, 7);
        await fetchInvoices(targetUserId.value, currentPeriod);
        if (invoices.value.length > 0 && !selectedPeriod.value) {
            selectedPeriod.value = invoices.value[0].period;
        }
    }
};

watch(targetUserId, (newId) => {
    if (newId) {
        loadInitialData();
    }
}, { immediate: true });
</script>

<style scoped>
.dashboard-wrapper {
    --billing-blue-950: #082f49;
    --billing-blue-900: #0c3f68;
    --billing-blue-800: #075985;
    --billing-blue-700: #0369a1;
    --billing-blue-600: #0284c7;
    --billing-blue-500: #0ea5e9;
    --billing-blue-100: #e0f2fe;
    --billing-blue-50: #f0f9ff;
    --billing-ink: #0f172a;
    --billing-muted: #64748b;
    --billing-line: #dbe7f0;
    display: flex;
    min-height: 100vh;
    font-family: var(--font-sans);
    color: var(--billing-ink);
    background: #f4f8fb;
}

.dashboard-wrapper.is-modal-view { min-height: auto; background: #f8fbfd; }
.main-content { min-width: 0; flex: 1; display: flex; flex-direction: column; }
.dashboard-content { width: 100%; max-width: 1640px; margin: 0 auto; padding: 1.25rem 1.75rem 2.5rem; box-sizing: border-box; }
.is-modal-view .dashboard-content { max-width: none; padding: 1rem; }
button, select { font-family: var(--font-sans); }

.billing-header { display: flex; align-items: center; min-height: 3.5rem; margin-bottom: 1rem; }
.header-copy { display: flex; align-items: center; gap: 0.8rem; }
.header-icon, .period-icon, .kpi-icon, .empty-icon { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; }
.header-icon { width: 2.5rem; height: 2.5rem; color: #fff; border-radius: 0.75rem; background: var(--billing-blue-800); box-shadow: 0 8px 20px rgba(7, 89, 133, 0.2); }
.header-icon svg { width: 1.35rem; height: 1.35rem; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.dashboard-title { margin: 0; color: var(--billing-blue-950); font-size: clamp(1.35rem, 2vw, 1.7rem); font-weight: 750; line-height: 1.15; letter-spacing: -0.025em; }
.dashboard-subtitle { margin: 0.2rem 0 0; color: var(--billing-muted); font-size: 0.82rem; line-height: 1.4; }

.period-panel { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; padding: 0.75rem 0.9rem; border: 1px solid #cfe2ef; border-radius: 0.85rem; background: #fff; box-shadow: 0 3px 14px rgba(15, 71, 105, 0.05); }
.period-summary { display: flex; align-items: center; gap: 0.7rem; min-width: 0; }
.period-icon { width: 2.15rem; height: 2.15rem; color: var(--billing-blue-700); border-radius: 0.65rem; background: var(--billing-blue-50); }
.period-icon svg { width: 1.15rem; height: 1.15rem; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.period-summary div, .period-summary strong { display: block; }
.period-eyebrow, .section-eyebrow { color: var(--billing-blue-700); font-size: 0.68rem; font-weight: 750; line-height: 1.2; letter-spacing: 0.08em; text-transform: uppercase; }
.period-summary strong { margin-top: 0.12rem; color: var(--billing-blue-950); font-size: 1rem; }
.filter-group { display: flex; align-items: center; gap: 0.65rem; }
.filter-group label { color: #526779; font-size: 0.76rem; font-weight: 650; white-space: nowrap; }
.select-shell { position: relative; min-width: 9.5rem; }
.filter-select { width: 100%; min-height: 2.35rem; padding: 0.45rem 2.2rem 0.45rem 0.75rem; appearance: none; color: var(--billing-blue-950); border: 1px solid #b9d3e3; border-radius: 0.6rem; outline: none; background: #fafdff; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: border-color 0.2s, box-shadow 0.2s; }
.select-shell svg { position: absolute; top: 50%; right: 0.7rem; width: 1rem; height: 1rem; color: var(--billing-blue-700); stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; pointer-events: none; transform: translateY(-50%); }
.filter-select:focus { border-color: var(--billing-blue-600); box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.13); }

.stats-cards-grid-5 { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 0.8rem; margin-bottom: 1rem; }
.stat-card { position: relative; min-width: 0; min-height: 9.5rem; padding: 1rem; overflow: hidden; border: 1px solid var(--billing-line); border-radius: 0.9rem; background: #fff; box-shadow: 0 5px 18px rgba(15, 71, 105, 0.055); box-sizing: border-box; }
.stat-card::after { position: absolute; top: 0; right: 0; width: 3.5rem; height: 3.5rem; border-radius: 0 0 0 100%; background: var(--billing-blue-50); content: ''; pointer-events: none; }
.stat-card-primary { border-color: transparent; background: linear-gradient(140deg, var(--billing-blue-900), var(--billing-blue-700)); box-shadow: 0 10px 24px rgba(7, 89, 133, 0.22); }
.stat-card-primary::after { background: rgba(255, 255, 255, 0.08); }
.card-heading { position: relative; z-index: 1; display: flex; align-items: center; gap: 0.55rem; min-width: 0; }
.kpi-icon { width: 2rem; height: 2rem; color: var(--billing-blue-700); border-radius: 0.6rem; background: var(--billing-blue-50); }
.kpi-icon svg { width: 1.05rem; height: 1.05rem; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.stat-card-primary .kpi-icon { color: #fff; background: rgba(255, 255, 255, 0.14); }
.card-title { min-width: 0; margin: 0; color: #4e6475; font-size: 0.75rem; font-weight: 700; line-height: 1.3; }
.stat-card-primary .card-title { color: #d9f0fc; }
.metric-value { position: relative; z-index: 1; margin: 1rem 0 0; overflow-wrap: anywhere; color: var(--billing-blue-950); font-size: clamp(1.65rem, 2.2vw, 2.15rem); font-weight: 780; line-height: 1; letter-spacing: -0.045em; }
.stat-card-primary .metric-value { color: #fff; }
.metric-unit { color: #668093; font-size: 0.82rem; font-weight: 650; letter-spacing: 0; white-space: nowrap; }
.card-description { position: relative; z-index: 1; margin: 0.65rem 0 0; color: #718697; font-size: 0.72rem; line-height: 1.35; }
.stat-card-primary .card-description { color: #cbe9f8; }
.metric-value.status-text { margin-top: 1.1rem; font-size: 1rem; font-weight: 650; letter-spacing: 0; }

.status-badge { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.32rem 0.65rem; border-radius: 999px; font-size: 0.72rem; font-weight: 750; line-height: 1; white-space: nowrap; }
.status-badge::before { width: 0.4rem; height: 0.4rem; border-radius: 50%; background: currentColor; content: ''; }
.status-paid { color: #166534; background: #dcfce7; }
.status-open { color: #9a5700; background: #fff3cd; }

.composition-card { margin-bottom: 1rem; padding: 1.15rem; border: 1px solid var(--billing-line); border-radius: 0.95rem; background: #fff; box-shadow: 0 5px 18px rgba(15, 71, 105, 0.055); }
.section-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #e6eef4; }
.section-heading h2, .table-title { margin: 0.2rem 0 0; color: var(--billing-blue-950); font-size: 1.12rem; font-weight: 750; line-height: 1.25; letter-spacing: -0.015em; }
.section-heading p { margin: 0.25rem 0 0; color: var(--billing-muted); font-size: 0.77rem; }
.composition-total { flex: 0 0 auto; text-align: right; }
.composition-total span, .composition-total strong { display: block; }
.composition-total span { color: var(--billing-muted); font-size: 0.68rem; }
.composition-total strong { margin-top: 0.2rem; color: var(--billing-blue-800); font-size: 1.15rem; }
.composition-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem 1.4rem; padding-top: 1rem; }
.composition-item { min-width: 0; }
.composition-meta { display: flex; align-items: flex-end; justify-content: space-between; gap: 0.8rem; margin-bottom: 0.5rem; }
.composition-name { display: flex; align-items: flex-start; gap: 0.5rem; min-width: 0; }
.composition-dot { width: 0.45rem; height: 0.45rem; margin-top: 0.27rem; flex: 0 0 auto; border-radius: 50%; background: var(--billing-blue-500); box-shadow: 0 0 0 3px var(--billing-blue-100); }
.composition-name div { min-width: 0; }
.composition-name strong, .composition-name span, .composition-amount strong, .composition-amount span { display: block; }
.composition-name strong { overflow: hidden; color: #263f52; font-size: 0.78rem; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.composition-name span { margin-top: 0.12rem; color: #7b8d9c; font-size: 0.67rem; }
.composition-amount { flex: 0 0 auto; text-align: right; }
.composition-amount strong { color: var(--billing-blue-950); font-size: 0.77rem; }
.composition-amount span { margin-top: 0.1rem; color: var(--billing-blue-700); font-size: 0.65rem; font-weight: 700; }
.composition-track { width: 100%; height: 0.42rem; overflow: hidden; border-radius: 999px; background: #e8f2f8; }
.composition-track span { display: block; min-width: 0.2rem; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--billing-blue-700), var(--billing-blue-500)); transition: width 0.5s ease; }
.composition-empty { margin: 1rem 0 0; color: var(--billing-muted); font-size: 0.8rem; }

/* Cards de serviços pontuais */
.punctual-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr)); gap: 0.75rem; margin-top: 1rem; }
.punctual-card { padding: 0.85rem; border: 1px solid var(--billing-line); border-radius: 0.7rem; background: #fbfdff; }
.punctual-card h4 { margin: 0; color: var(--billing-blue-950); font-size: 0.84rem; font-weight: 700; line-height: 1.35; }
.punctual-card__value { margin: 0.5rem 0 0; color: var(--billing-blue-700); font-size: 1.2rem; font-weight: 780; font-variant-numeric: tabular-nums; }
.punctual-card__detail { margin: 0.15rem 0 0; color: var(--billing-muted); font-size: 0.78rem; }
.punctual-card__date { margin: 0.35rem 0 0; color: #94a3b8; font-size: 0.73rem; }

/* Detalhes da fatura: seções por categoria, com subtotal */
.invoice-meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); gap: 0.75rem; margin-bottom: 1.25rem; padding-bottom: 1rem; border-bottom: 1px solid var(--billing-line); }
.invoice-meta div { display: flex; flex-direction: column; gap: 0.25rem; min-width: 0; }
.invoice-meta span { color: var(--billing-muted); font-size: 0.7rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
.invoice-meta strong { color: var(--billing-ink); font-size: 0.9rem; }
.invoice-meta .status-badge { align-self: flex-start; }
.detail-group { margin-bottom: 1rem; overflow: hidden; border: 1px solid var(--billing-line); border-radius: 0.6rem; background: #fff; }
.detail-group__head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.6rem 0.85rem; background: var(--billing-blue-50); }
.detail-group__head h5 { margin: 0; color: var(--billing-blue-800); font-size: 0.85rem; font-weight: 750; }
.detail-group__head strong { color: var(--billing-blue-900); font-size: 0.9rem; font-variant-numeric: tabular-nums; }
.detail-table { width: 100%; border-collapse: collapse; }
.detail-table td { padding: 0.55rem 0.85rem; border-top: 1px solid #f1f5f9; color: #4b5563; font-size: 0.83rem; vertical-align: top; }
.detail-table__desc { width: 50%; color: var(--billing-ink); font-weight: 600; }
.detail-table__desc small { display: block; margin-top: 0.15rem; color: #94a3b8; font-weight: 500; }
.detail-table__qty, .detail-table__unit { white-space: nowrap; text-align: right; font-variant-numeric: tabular-nums; }
.detail-table__total { white-space: nowrap; text-align: right; color: var(--billing-ink); font-weight: 750; font-variant-numeric: tabular-nums; }
.detail-total { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.85rem 1rem; border-radius: 0.6rem; background: linear-gradient(140deg, var(--billing-blue-900), var(--billing-blue-700)); box-shadow: 0 10px 24px rgba(7, 89, 133, 0.22); color: #fff; }
.detail-total span { font-size: 0.8rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
.detail-total strong { font-size: 1.15rem; font-variant-numeric: tabular-nums; }

.table-container { overflow: hidden; border: 1px solid var(--billing-line); border-radius: 0.95rem; background: #fff; box-shadow: 0 5px 18px rgba(15, 71, 105, 0.055); }
.table-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.15rem; border-bottom: 1px solid #e6eef4; }
.invoice-count { padding: 0.32rem 0.65rem; color: var(--billing-blue-800); border: 1px solid #c8e2f0; border-radius: 999px; background: var(--billing-blue-50); font-size: 0.68rem; font-weight: 700; white-space: nowrap; }
.table-scroll { overflow-x: auto; }
.history-table { width: 100%; min-width: 720px; border-collapse: collapse; text-align: left; }
.history-table th, .history-table td { padding: 0.78rem 1.15rem; border-bottom: 1px solid #e9f0f5; vertical-align: middle; white-space: nowrap; }
.history-table thead th { color: #6d8292; background: #f7fafc; font-size: 0.65rem; font-weight: 750; letter-spacing: 0.07em; text-transform: uppercase; }
.history-table tbody td { color: #526779; font-size: 0.78rem; }
.history-table tbody tr:last-child td { border-bottom: none; }
.invoice-row { transition: background-color 0.18s; }
.invoice-row:hover { background: var(--billing-blue-50); }
.period-code { display: inline-flex; padding: 0.3rem 0.52rem; color: var(--billing-blue-800); border-radius: 0.45rem; background: #e8f4fa; font-weight: 750; }
.invoice-value { color: var(--billing-blue-950) !important; font-weight: 750; }
.action-cell { text-align: right; }
.details-button { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.42rem 0.65rem; color: var(--billing-blue-700); border: 1px solid #bad9e9; border-radius: 0.5rem; background: #fff; font-size: 0.7rem; font-weight: 750; cursor: pointer; transition: color 0.2s, border-color 0.2s, background-color 0.2s; }
.details-button svg { width: 0.85rem; height: 0.85rem; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.details-button:hover { color: #fff; border-color: var(--billing-blue-700); background: var(--billing-blue-700); }
.details-button:focus-visible { outline: 3px solid rgba(2, 132, 199, 0.25); outline-offset: 2px; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }

.error-state { display: flex; align-items: center; justify-content: center; gap: 0.65rem; padding: 1.2rem; color: #b42318; border: 1px solid #f4c7c3; border-radius: 0.8rem; background: #fff5f4; font-size: 0.85rem; font-weight: 650; }
.error-state svg { width: 1.2rem; height: 1.2rem; flex: 0 0 auto; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.empty-state-full-page { display: flex; min-height: 18rem; align-items: center; justify-content: center; flex-direction: column; padding: 2rem; text-align: center; color: var(--billing-muted); border: 1px dashed #bcd6e5; border-radius: 1rem; background: #fff; }
.empty-icon { width: 3.5rem; height: 3.5rem; color: var(--billing-blue-700); border-radius: 1rem; background: var(--billing-blue-50); }
.empty-icon svg { width: 1.65rem; height: 1.65rem; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.empty-state-full-page h3 { margin: 0.9rem 0 0; color: var(--billing-blue-950); font-size: 1.05rem; font-weight: 750; }
.empty-state-full-page p { margin: 0.35rem 0 0; font-size: 0.82rem; }

.invoice-details-content { padding: 1.25rem; background: #f7fafc; }
.detail-block-wrapper { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; }
.detail-block { padding: 1rem; border: 1px solid var(--billing-line); border-radius: 0.75rem; background: #fff; }
.detail-block h5 { margin: 0 0 0.75rem; padding-bottom: 0.55rem; color: var(--billing-blue-800); border-bottom: 1px solid #e5edf3; font-size: 0.82rem; font-weight: 750; text-transform: capitalize; }
.detail-block ul { margin: 0; padding: 0; list-style: none; }
.detail-block li { padding: 0.2rem 0; color: #566b7b; font-size: 0.78rem; }
.detail-block li strong { color: var(--billing-ink); }

@keyframes pulse { 50% { opacity: 0.55; } }
.skeleton-loader { padding: 0; }
.sk-header, .sk-card, .sk-row, .sk-filters, .sk-table-header, .sk-card-title, .sk-card-value, .sk-card-description, .sk-cell,
.sk-detail-block, .sk-detail-title, .sk-detail-item, .sk-filter-group, .sk-table-title, .sk-table-head, .sk-head-cell, .sk-composition {
    border-radius: 0.6rem;
    background: #dce9f1;
    animation: pulse 1.8s ease-in-out infinite;
}
.sk-header { width: 35%; height: 2.5rem; margin-bottom: 1rem; }
.sk-filters { display: flex; height: 3.7rem; margin-bottom: 1rem; align-items: center; justify-content: flex-end; padding: 0.7rem; }
.sk-filter-group { width: 12rem; height: 2.2rem; }
.sk-grid-5 { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 0.8rem; margin-bottom: 1rem; }
.sk-card { display: flex; height: 9.5rem; padding: 1rem; flex-direction: column; box-sizing: border-box; }
.sk-card-title { width: 65%; height: 0.85rem; margin-bottom: 1.2rem; }
.sk-card-value { width: 72%; height: 2rem; margin-bottom: 0.8rem; }
.sk-card-description { width: 80%; height: 0.7rem; }
.sk-composition { height: 12rem; margin-bottom: 1rem; }
.sk-table-header { display: flex; height: 4.5rem; flex-direction: column; border-radius: 0.8rem 0.8rem 0 0; }
.sk-table-title { width: 25%; height: 1.2rem; margin: 1rem; }
.sk-table-head { display: flex; height: 2.5rem; padding: 0 1rem; gap: 1rem; }
.sk-head-cell { height: 1rem; flex: 1; }
.sk-table { width: 100%; }
.sk-row { display: flex; height: 3rem; margin-bottom: 0.35rem; padding: 0 1rem; align-items: center; gap: 1rem; }
.sk-cell { height: 0.9rem; flex: 1; }
.sk-row:last-child { margin-bottom: 0; }
.invoice-details-skeleton { padding: 0; }
.sk-detail-block { padding: 1rem; margin-bottom: 1rem; }
.sk-detail-title { width: 40%; height: 1.1rem; margin-bottom: 1rem; }
.sk-detail-item { width: 80%; height: 0.85rem; margin-bottom: 0.5rem; }
.sk-detail-item:last-child { margin-bottom: 0; }

@media (max-width: 1280px) {
    .stats-cards-grid-5, .sk-grid-5 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (max-width: 860px) {
    .dashboard-content { padding: 1rem; }
    .stats-cards-grid-5, .sk-grid-5 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .composition-list { grid-template-columns: 1fr; }
}

@media (max-width: 600px) {
    .dashboard-content, .is-modal-view .dashboard-content { padding: 0.75rem; }
    .dashboard-subtitle { display: none; }
    .billing-header { min-height: 3rem; margin-bottom: 0.75rem; }
    .header-icon { width: 2.25rem; height: 2.25rem; }
    .period-panel { align-items: stretch; flex-direction: column; padding: 0.75rem; }
    .filter-group { align-items: stretch; flex-direction: column; gap: 0.35rem; }
    .select-shell { width: 100%; }
    .stats-cards-grid-5, .sk-grid-5 { grid-template-columns: 1fr; }
    .stat-card { min-height: 8.8rem; }
    .section-heading { flex-direction: column; gap: 0.75rem; }
    .composition-total { text-align: left; }
    .composition-meta { align-items: flex-start; }
    .composition-name strong { white-space: normal; }
    .table-header { align-items: flex-start; }
    .details-button span { display: none; }
    .details-button { padding: 0.45rem; }
    .history-table th, .history-table td { padding-right: 0.8rem; padding-left: 0.8rem; }
    .detail-block-wrapper { grid-template-columns: 1fr; }
}
</style>
