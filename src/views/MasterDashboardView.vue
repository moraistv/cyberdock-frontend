<template>
  <div class="dashboard-wrapper">
    <SidebarComponent />
    <div class="main-content">
      <TopbarComponent />

      <div class="dashboard-content" ref="rootEl">
        <div class="toolbar">
          <div class="toolbar-text">
            <h1 class="toolbar-title">Dashboard Master</h1>
            <p class="toolbar-desc">
              Operação somada de todos os clientes ativos. Os números de pedidos seguem os filtros;
              o armazenamento é a situação atual.
            </p>
          </div>
          <button class="btn-refresh" @click="reload" :disabled="isBusy" title="Atualizar métricas de todos os clientes">
            <svg :class="{ 'is-spinning': isBusy }" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /><polyline points="21 3 21 9 15 9" /></svg>
            Atualizar
          </button>
        </div>

        <div class="filters">
          <div class="filter-block filter-block--period">
            <span class="filter-label">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              Prazo de despacho
            </span>
            <div class="chip-row">
              <button v-for="p in shipPeriodOptions" :key="p.value"
                      class="chip"
                      :class="{ 'is-active': shipPeriod === p.value, 'chip--danger': p.value === 'overdue' && shipPeriod === 'overdue' }"
                      @click="shipPeriod = p.value">
                {{ p.label }}
              </button>
            </div>
          </div>

          <div class="filter-block filter-block--period">
            <span class="filter-label">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              Data da venda
            </span>
            <div class="chip-row">
              <button v-for="p in periodOptions" :key="p.value"
                      class="chip" :class="{ 'is-active': period === p.value }"
                      @click="period = p.value">
                {{ p.label }}
              </button>
            </div>
          </div>

          <div class="filter-block">
            <span class="filter-label">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
              Canal
            </span>
            <div class="chip-row">
              <button class="chip" :class="{ 'is-active': !selectedMarketplaces.length }"
                      @click="selectedMarketplaces = []">Todos</button>
              <button v-for="mk in marketplaceFacets" :key="mk.value"
                      class="chip" :class="{ 'is-active': selectedMarketplaces.includes(mk.value) }"
                      @click="toggleIn(selectedMarketplaces, mk.value)">
                <img :src="MK_LOGOS[mk.value] || MK_LOGOS.ML" alt="" class="chip__logo" /> {{ mk.label }}
                <span class="chip__count">{{ mk.count }}</span>
              </button>
            </div>
          </div>

          <div class="filter-block">
            <span class="filter-label">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
              Modalidade de envio
            </span>
            <div class="chip-row">
              <button class="chip" :class="{ 'is-active': !selectedModes.length }"
                      @click="selectedModes = []">Todas</button>
              <button v-for="m in modeOptions" :key="m.value"
                      class="chip" :class="{ 'is-active': selectedModes.includes(m.value) }"
                      @click="toggleIn(selectedModes, m.value)">
                {{ m.label }}
                <span v-if="m.count !== null" class="chip__count">{{ m.count }}</span>
              </button>
              <span v-if="!modeOptions.length" class="filter-empty">
                {{ statsLoading ? 'Carregando...' : 'Nenhuma modalidade no recorte' }}
              </span>
            </div>
          </div>

          <div class="filter-block" v-if="userFacets.length">
            <span class="filter-label">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              Cliente
            </span>
            <div class="chip-row">
              <button class="chip" :class="{ 'is-active': !selectedUser }"
                      @click="selectedUser = ''">Todos</button>
              <button v-for="u in userFacets" :key="u.value"
                      class="chip" :class="{ 'is-active': selectedUser === u.value }"
                      @click="selectedUser = selectedUser === u.value ? '' : u.value">
                {{ u.label }} <span class="chip__count">{{ u.count }}</span>
              </button>
            </div>
          </div>

          <details class="filters-advanced">
            <summary>
              <span class="advanced-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3"/><path d="M1 14h6M9 8h6M17 16h6"/></svg>
                Filtros avançados
                <span v-if="advancedFilterCount" class="filter-count">{{ advancedFilterCount }}</span>
              </span>
              <svg class="advanced-chevron" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
            </summary>
            <div class="filters-advanced__body">
              <div class="filter-block" v-if="accountFacets.length">
                <span class="filter-label">Contas</span>
                <div class="chip-row">
                  <button class="chip" :class="{ 'is-active': !selectedAccounts.length }"
                          @click="selectedAccounts = []">Todas</button>
                  <button v-for="acc in accountFacets" :key="acc.value"
                          class="chip" :class="{ 'is-active': selectedAccounts.includes(acc.value) }"
                          @click="toggleIn(selectedAccounts, acc.value)">
                    <img :src="MK_LOGOS[acc.marketplace] || MK_LOGOS.ML" alt="" class="chip__logo" />
                    {{ acc.label }} <span class="chip__count">{{ acc.count }}</span>
                  </button>
                </div>
              </div>

              <div v-if="hasActiveFilters" class="filters-foot">
                <span>{{ advancedFilterCount ? `${advancedFilterCount} filtro(s) avançado(s) ativo(s)` : 'Recorte personalizado ativo' }}</span>
                <button class="chip chip--clear" @click="clearFilters">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  Limpar filtros
                </button>
              </div>
            </div>
          </details>

          <div class="filters-range">
            <span class="filters-range__item">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              Despacho: {{ shipLabel }}
            </span>
            <span class="filters-range__item">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 2v3M16 2v3M3 9h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z" /></svg>
              Venda: {{ periodLabel }}
            </span>
          </div>
        </div>

        <div v-if="statsError" class="data-error" role="alert">{{ statsError }}</div>

        <!-- Cards -->
        <div class="grid grid-4" ref="cardsRow">
          <div class="card card--kpi card--featured" :class="{ skeleton: statsLoading }">
            <div class="card-icon">
              <span class="icon icon--amber">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /><path d="M5 17h-2v-11a1 1 0 0 1 1 -1h9v12m-4 0h6m4 0h2v-6h-8m0 -5h5l3 5" /></svg>
              </span>
            </div>
            <div class="card-title">A despachar</div>
            <div class="card-value">{{ fmt(totals.pending_orders) }} <span class="unit">pedidos</span></div>
            <div class="card-foot muted">De todos os clientes, no recorte acima</div>
            <router-link to="/admin" class="link-like">Abrir no tabelão</router-link>
          </div>

          <div class="card" :class="{ skeleton: statsLoading }">
            <div class="card-icon">
              <span class="icon icon--emerald">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              </span>
            </div>
            <div class="card-title">Já despachadas</div>
            <div class="card-value">{{ fmt(totals.shipped_orders) }} <span class="unit">pedidos</span></div>
            <div class="card-foot muted">Saíram da expedição no mesmo recorte</div>
          </div>

          <div class="card" :class="{ skeleton: storageLoading }">
            <div class="card-icon">
              <span class="icon icon--sky">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 4.5l0 9l-8 4.5l-8 -4.5l0 -9l8 -4.5" /><path d="M12 12l8 -4.5" /><path d="M12 12l0 9" /><path d="M12 12l-8 -4.5" /></svg>
              </span>
            </div>
            <div class="card-title">Armazenamento consumido</div>
            <div class="card-value" :class="{ 'card-value--unavailable': storageUnavailable }">
              {{ storageUnavailable ? 'Indisponível' : consumedFmt }}
              <span v-if="!storageUnavailable" class="unit">m³</span>
            </div>
            <div v-if="storageUnavailable" class="card-foot is-error">Não foi possível somar o armazenamento.</div>
            <div v-else class="card-foot muted">
              Contratado: {{ contractedFmt }} m³
              <span v-if="occupancyPct !== null"> · {{ occupancyPct }}% usado</span>
              · {{ summary.clientsWithVolume }}/{{ summary.clientCount }} clientes com estoque
            </div>
            <div v-if="!storageUnavailable && occupancyPct !== null" class="mini-bar">
              <span class="mini-bar__fill" :class="occupancyTone" :style="{ width: Math.min(occupancyPct, 100) + '%' }"></span>
            </div>
          </div>

          <div class="card" :class="{ skeleton: statsLoading }">
            <div class="card-icon">
              <span class="icon icon--blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19l16 0" /><path d="M4 15l4 -6l4 2l4 -5l4 4" /></svg>
              </span>
            </div>
            <div class="card-title">Pedidos no recorte</div>
            <div class="card-value">
              {{ fmt(totals.orders) }} <span class="unit">pedidos</span>
              <span v-if="ordersTrend" class="trend" :class="ordersTrend.tone">{{ ordersTrend.label }}</span>
            </div>
            <div class="card-foot muted">
              {{ fmt(totals.units) }} unidade(s) · {{ fmt(totals.cancelled_orders) }} cancelado(s)
            </div>
          </div>
        </div>

        <p v-if="windowCapped" class="window-hint">
          Contando vendas dos últimos {{ MASTER_WINDOW_DAYS }} dias. A visão de todos os clientes tem
          teto de data de venda para não varrer o histórico inteiro da base; escolha uma data de venda
          para recortar um período específico.
        </p>

        <!-- Gráficos -->
        <div class="grid grid-2" ref="chartsRow">
          <div class="card chart-card" :class="{ skeleton: statsLoading }">
            <div class="card-title plain">Modalidade de envio</div>
            <VueApexCharts v-if="byShippingMode.length" type="donut" height="300"
                           :options="modeChartOptions" :series="modeSeries" />
            <p v-else class="chart-empty">Sem pedidos no recorte selecionado.</p>
          </div>

          <div class="card chart-card" :class="{ skeleton: statsLoading }">
            <div class="card-title plain">Participação por canal</div>
            <VueApexCharts v-if="byMarketplace.length" type="donut" height="300"
                           :options="marketplaceChartOptions" :series="marketplaceSeries" />
            <p v-else class="chart-empty">Sem pedidos no recorte selecionado.</p>
          </div>
        </div>

        <div class="card chart-card" :class="{ skeleton: statsLoading }">
          <div class="chart-head">
            <div class="card-title plain">Pedidos por conta</div>
            <span class="chart-hint">{{ byAccount.length }} conta(s) de todos os clientes · quantidade e % do total</span>
          </div>
          <VueApexCharts v-if="byAccount.length" type="bar" :height="accountChartHeight"
                         :options="accountChartOptions" :series="accountSeries" />
          <p v-else class="chart-empty">Sem pedidos no recorte selecionado.</p>
        </div>

        <!-- Armazenamento por cliente -->
        <div class="card" :class="{ skeleton: storageLoading }" ref="tableRow">
          <div class="chart-head">
            <div class="card-title plain">Armazenamento por cliente</div>
            <span class="chart-hint">Situação atual, não segue os filtros de período</span>
          </div>
          <div class="table table--storage">
            <div class="thead">
              <div>CLIENTE</div>
              <div class="num">SKUs</div>
              <div class="num">CONSUMIDO (m³)</div>
              <div class="num">CONTRATADO (m³)</div>
              <div class="num">OCUPAÇÃO</div>
            </div>
            <div class="trow" v-for="client in storageClients" :key="client.uid">
              <div class="ellipsis">{{ client.name }}</div>
              <div class="num">{{ client.skuCount }}</div>
              <div class="num strong">{{ client.consumedVolume.toFixed(2) }}</div>
              <div class="num">{{ client.contractedVolume ? client.contractedVolume.toFixed(2) : '—' }}</div>
              <div class="num">
                <span v-if="client.contractedVolume" :class="toneFor(client.occupancyPercent)">
                  {{ Math.round(client.occupancyPercent) }}%
                </span>
                <span v-else class="muted">sem contrato</span>
              </div>
            </div>
            <div v-if="!storageClients.length && !storageLoading" class="empty">
              {{ storageUnavailable ? 'Não foi possível somar o armazenamento dos clientes.' : 'Nenhum cliente com estoque cadastrado.' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Dashboard Master: a operação de todos os clientes numa tela.
 *
 * Os números vêm agregados do banco por /sales/dashboard-stats com `scope=all`,
 * a mesma rota do dashboard do cliente. Reaproveitar em vez de criar outra
 * garante que "a despachar" aqui e "a despachar" na tela do cliente saiam da
 * mesma expressão SQL — se fossem duas contas diferentes, os totais brigariam.
 *
 * O armazenamento tem rota própria (`/storage/master/consumed-summary`) porque
 * não é métrica de período: é a ocupação de agora.
 */
import { ref, computed, watch, onMounted, onActivated, onUnmounted } from 'vue';
import SidebarComponent from '../components/SidebarComponent.vue';
import TopbarComponent from '../components/TopbarComponent.vue';
import VueApexCharts from 'vue3-apexcharts';
import { gsap } from 'gsap';

import { useAuth } from '@/composables/useAuth';
import { useDashboardStats } from '@/composables/useDashboardStats';
import { useSalesFilterFacets } from '@/composables/useSalesFilterFacets';
import { useMasterStorageSummary } from '@/composables/useMasterStorageSummary';

const { isAuthReady, user } = useAuth();

const MK_LOGOS = { ML: '/img/ml-logo.svg', Shopee: '/img/shopee-logo.svg' };
const MK_COLORS = { ML: '#f8d135', Shopee: '#ee4d2d' };

/* Atalhos do prazo de despacho.
 *
 * "Amanhã" só existe aqui: data de venda não tem futuro. Como a pergunta do
 * master é "o que precisa sair", o prazo é o eixo principal e abre em Hoje. */
const shipPeriodOptions = [
  { value: 'overdue', label: 'Atrasados' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'today', label: 'Hoje' },
  { value: 'tomorrow', label: 'Amanhã' },
  { value: '7d', label: 'Próximos 7 dias' },
  { value: 'all', label: 'Todos' },
];
const shipPeriod = ref('today');

const periodOptions = [
  { value: 'all', label: 'Todas' },
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: 'month', label: 'Este mês' },
];
const period = ref('all');

const selectedMarketplaces = ref([]);
const selectedAccounts = ref([]);
const selectedModes = ref([]);
// Cliente é opção única: o backend recorta por um nome (`userNickname`).
const selectedUser = ref('');

function toggleIn(list, value) {
  const i = list.indexOf(value);
  if (i === -1) list.push(value);
  else list.splice(i, 1);
}

const { stats, isLoading: statsLoading, error: statsError, fetchStats, cancelStats } = useDashboardStats();
const { facets, fetchFacets, cancelFacets, pruneSelection } = useSalesFilterFacets();
const {
  summary, isLoading: storageLoading, error: storageError,
  fetchSummary, cancelSummary,
} = useMasterStorageSummary();

const totals = computed(() => stats.value.totals);
const byShippingMode = computed(() => stats.value.byShippingMode);
const byMarketplace = computed(() => stats.value.byMarketplace);
const byAccount = computed(() => stats.value.byAccount);

const marketplaceFacets = computed(() => facets.value.marketplaces);
const accountFacets = computed(() => facets.value.accounts);
const modeFacets = computed(() => facets.value.shippingModes);

/* Opções do filtro de modalidade de envio.
 *
 * A faceta é a fonte preferida: vem cruzada com os outros filtros ativos e
 * traz a contagem de pedidos. Mas o bloco ficava escondido atrás de
 * `v-if="modeFacets.length"`, então quando a chamada de facetas falhava — e ela
 * estava falhando por timeout — o filtro desaparecia da tela e parecia nunca ter
 * existido.
 *
 * Sem faceta, caímos nas modalidades presentes nas próprias métricas do recorte
 * (`byShippingMode`), sem contagem cruzada mas com o filtro visível e usável. E a
 * união com o que está selecionado garante que nunca se fica preso num chip que
 * saiu da lista. */
const modeOptions = computed(() => {
  const options = modeFacets.value.length
    ? modeFacets.value.map((m) => ({ value: m.value, label: m.label, count: m.count }))
    : byShippingMode.value.map((d) => ({ value: d.mode, label: d.mode, count: null }));

  const present = new Set(options.map((o) => o.value));
  for (const value of selectedModes.value) {
    if (!present.has(value)) options.push({ value, label: value, count: null });
  }
  return options;
});
const userFacets = computed(() => facets.value.users);

const isBusy = computed(() => statsLoading.value || storageLoading.value);
const storageUnavailable = computed(() => Boolean(storageError.value));
const storageClients = computed(() => summary.value.clients.filter((c) => c.consumedVolume > 0 || c.contractedVolume > 0));

const fmt = (n) => Number(n || 0).toLocaleString('pt-BR');
const consumedFmt = computed(() => (summary.value.totalConsumedVolume || 0).toFixed(2));
const contractedFmt = computed(() => (summary.value.totalContractedVolume || 0).toFixed(2));
const occupancyPct = computed(() => {
  if (!summary.value.totalContractedVolume) return null;
  return Math.round(summary.value.occupancyPercent);
});
function toneFor(pct) {
  if (pct >= 95) return 'is-danger';
  if (pct >= 75) return 'is-warn';
  return 'is-ok';
}
const occupancyTone = computed(() => toneFor(occupancyPct.value ?? 0));

const ordersTrend = computed(() => {
  const prev = stats.value.previousTotals;
  if (!prev) return null;
  const before = prev.orders || 0;
  const now = totals.value.orders || 0;
  if (!before && !now) return null;
  if (!before) return { tone: 'is-up', label: 'novo' };
  const pct = ((now - before) / before) * 100;
  if (Math.abs(pct) <= 0.5) return { tone: 'is-flat', label: 'estável' };
  return { tone: pct > 0 ? 'is-up' : 'is-down', label: `${pct > 0 ? '+' : ''}${pct.toFixed(0)}%` };
});

/* -------------------- Período -> datas -------------------- */
function toIso(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function shiftDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toIso(d);
}

const dateRange = computed(() => {
  const hoje = toIso(new Date());
  if (period.value === 'today') return { from: hoje, to: hoje };
  if (period.value === 'yesterday') return { from: shiftDays(-1), to: shiftDays(-1) };
  if (period.value === '7d') return { from: shiftDays(-6), to: hoje };
  if (period.value === '30d') return { from: shiftDays(-29), to: hoje };
  if (period.value === 'month') {
    const now = new Date();
    return { from: toIso(new Date(now.getFullYear(), now.getMonth(), 1)), to: hoje };
  }
  return { from: '', to: '' };
});

const shipRange = computed(() => {
  const hoje = toIso(new Date());
  if (shipPeriod.value === 'today') return { from: hoje, to: hoje };
  if (shipPeriod.value === 'yesterday') return { from: shiftDays(-1), to: shiftDays(-1) };
  if (shipPeriod.value === 'tomorrow') return { from: shiftDays(1), to: shiftDays(1) };
  if (shipPeriod.value === '7d') return { from: hoje, to: shiftDays(6) };
  // Atrasado antigo continua atrasado, então não há limite inferior.
  if (shipPeriod.value === 'overdue') return { from: '', to: shiftDays(-1) };
  return { from: '', to: '' };
});

/* Sem data de venda escolhida, o servidor impõe um teto.
 *
 * A primeira versão desta tela mandava `window=all` quando havia recorte de
 * prazo, achando que o prazo limitaria a varredura. Não limita: `shipping_deadline`
 * é expressão sobre JSONB na view unificada e não usa índice, então cada
 * agregação percorria as duas tabelas inteiras de todos os clientes. O resultado
 * em produção foi statement timeout e pool esgotado, derrubando telas de outros
 * usuários.
 *
 * Agora o teto é do backend (MASTER_WINDOW_DAYS) e a tela só informa. Pedir
 * `window=all` não tem mais efeito na visão global. */
const MASTER_WINDOW_DAYS = 90;
const windowCapped = computed(() => !dateRange.value.from);

const periodLabel = computed(() => {
  const { from, to } = dateRange.value;
  if (!from && !to) return 'Todas as vendas';
  return from === to ? from : `${from} — ${to}`;
});
const shipLabel = computed(() =>
  shipPeriodOptions.find((o) => o.value === shipPeriod.value)?.label ?? shipPeriod.value
);

// Modalidade saiu dos avançados e virou filtro principal, então não conta aqui.
const advancedFilterCount = computed(() => selectedAccounts.value.length);
const hasActiveFilters = computed(() =>
  shipPeriod.value !== 'today'
  || period.value !== 'all'
  || selectedMarketplaces.value.length > 0
  || selectedAccounts.value.length > 0
  || selectedModes.value.length > 0
  || Boolean(selectedUser.value)
);

function clearFilters() {
  shipPeriod.value = 'today';
  period.value = 'all';
  selectedMarketplaces.value = [];
  selectedAccounts.value = [];
  selectedModes.value = [];
  selectedUser.value = '';
}

/* -------------------- Gráficos -------------------- */
const BASE_CHART = {
  chart: { toolbar: { show: false }, fontFamily: 'inherit', foreColor: '#64748b' },
  tooltip: { theme: 'light' },
  dataLabels: { enabled: false },
  grid: { borderColor: '#e2e8f0', strokeDashArray: 4 },
};
const MODE_COLORS = ['#2563eb', '#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#64748b', '#a855f7'];

const modeSeries = computed(() => byShippingMode.value.map((d) => d.value));
const modeChartOptions = computed(() => ({
  ...BASE_CHART,
  chart: { ...BASE_CHART.chart, type: 'donut' },
  labels: byShippingMode.value.map((d) => d.mode),
  colors: byShippingMode.value.map((_, i) => MODE_COLORS[i % MODE_COLORS.length]),
  legend: { position: 'bottom', fontSize: '12px' },
  plotOptions: { pie: { donut: { size: '62%' } } },
  dataLabels: { enabled: true, formatter: (val) => `${Number(val).toFixed(0)}%` },
}));

const marketplaceSeries = computed(() => byMarketplace.value.map((d) => d.value));
const marketplaceChartOptions = computed(() => ({
  ...BASE_CHART,
  chart: { ...BASE_CHART.chart, type: 'donut' },
  labels: byMarketplace.value.map((d) => (d.marketplace === 'ML' ? 'Mercado Livre' : d.marketplace)),
  colors: byMarketplace.value.map((d) => MK_COLORS[d.marketplace] || '#94a3b8'),
  legend: { position: 'bottom', fontSize: '12px' },
  plotOptions: { pie: { donut: { size: '62%' } } },
  dataLabels: { enabled: true, formatter: (val) => `${Number(val).toFixed(0)}%` },
}));

/* Barra horizontal, não rosca nem empilhamento.
 *
 * São ~20 contas: numa rosca as fatias ficam ilegíveis e a legenda toma a tela
 * toda. Barra ordenada compara de bater o olho, e o rótulo carrega quantidade e
 * % lado a lado, que é o que a demanda pede. */
const accountTotal = computed(() =>
  totals.value.orders || byAccount.value.reduce((sum, a) => sum + (a.orders || 0), 0)
);
const accountSeries = computed(() => [{
  name: 'Pedidos',
  data: byAccount.value.map((a) => a.orders),
}]);
const accountChartHeight = computed(() => Math.max(300, byAccount.value.length * 30 + 80));
const accountChartOptions = computed(() => ({
  ...BASE_CHART,
  chart: { ...BASE_CHART.chart, type: 'bar' },
  colors: byAccount.value.map((a) => MK_COLORS[a.marketplace] || '#2563eb'),
  plotOptions: { bar: { borderRadius: 5, horizontal: true, barHeight: '68%', distributed: true } },
  legend: { show: false },
  dataLabels: {
    enabled: true,
    textAnchor: 'start',
    offsetX: 6,
    style: { fontSize: '11px', fontWeight: 600, colors: ['#0f172a'] },
    formatter: (val) => {
      const total = accountTotal.value;
      const pct = total ? ((val / total) * 100).toFixed(1).replace('.', ',') : '0';
      return `${Number(val).toLocaleString('pt-BR')} · ${pct}%`;
    },
  },
  xaxis: {
    categories: byAccount.value.map((a) => a.label),
    labels: { formatter: (v) => Math.trunc(v) },
  },
  yaxis: { labels: { maxWidth: 190, style: { fontSize: '11px' } } },
  tooltip: {
    ...BASE_CHART.tooltip,
    y: {
      formatter: (val, opts) => {
        const row = byAccount.value[opts?.dataPointIndex] || {};
        return `${Number(val).toLocaleString('pt-BR')} pedidos · ${row.pending || 0} a despachar · ${row.shipped || 0} despachados`;
      },
    },
  },
}));

/* -------------------- Carga -------------------- */
function currentFilterParams() {
  const { from, to } = dateRange.value;
  const ship = shipRange.value;
  return {
    scope: 'all',
    from,
    to,
    shipFrom: ship.from,
    shipTo: ship.to,
    marketplace: selectedMarketplaces.value,
    account: selectedAccounts.value,
    shippingMode: selectedModes.value,
    userNickname: selectedUser.value,
    // Só as facetas que esta tela mostra: cada uma é uma varredura da base
    // inteira na visão global, e status de envio/pedido não aparecem aqui.
    facets: 'marketplace,account,shippingMode,userNickname',
  };
}

function reloadStats() {
  const params = currentFilterParams();
  // Métricas e opções no mesmo recorte: se divergirem, o contador do chip não
  // bate com o número do card.
  return Promise.all([fetchStats(params), fetchFacets(params)]);
}

async function reload() {
  await Promise.all([reloadStats(), fetchSummary()]);
}

// Valor que deixou de existir nas opções é descartado, senão a tela fica presa
// num filtro que não retorna nada.
watch(accountFacets, (options) => {
  const kept = pruneSelection(selectedAccounts.value, options);
  if (kept !== selectedAccounts.value) selectedAccounts.value = kept;
});
watch(modeFacets, (options) => {
  const kept = pruneSelection(selectedModes.value, options);
  if (kept !== selectedModes.value) selectedModes.value = kept;
});

let filtersDebounceTimer = null;
watch(
  [shipPeriod, period, selectedMarketplaces, selectedAccounts, selectedModes, selectedUser],
  () => {
    if (filtersDebounceTimer) clearTimeout(filtersDebounceTimer);
    filtersDebounceTimer = setTimeout(() => {
      filtersDebounceTimer = null;
      reloadStats();
    }, 220);
  },
  { deep: true }
);

/* -------------------- Animação -------------------- */
const rootEl = ref(null);
const cardsRow = ref(null);
const chartsRow = ref(null);
const tableRow = ref(null);
let gsapCtx = null;

function runEnterAnimations() {
  if (!rootEl.value) return;
  gsapCtx = gsap.context(() => {
    if (cardsRow.value) {
      gsap.from(cardsRow.value.children, { opacity: 0, y: 14, duration: 0.45, stagger: 0.07, ease: 'power2.out' });
    }
    if (chartsRow.value) {
      gsap.from(chartsRow.value.children, { opacity: 0, y: 16, duration: 0.45, stagger: 0.08, ease: 'power2.out', delay: 0.12 });
    }
    if (tableRow.value) {
      gsap.from(tableRow.value, { opacity: 0, y: 16, duration: 0.45, ease: 'power2.out', delay: 0.18 });
    }
  }, rootEl);
}

onMounted(() => {
  if (isAuthReady.value && user.value) reload();
  watch(isAuthReady, (ready) => { if (ready && user.value) reload(); });
  runEnterAnimations();
});

// keep-alive: voltar à tela não dispara onMounted, e os cards ficariam com os
// números da visita anterior. A primeira ativação é ignorada porque acontece
// junto do onMounted, que já buscou.
let activatedOnce = false;
onActivated(() => {
  if (!activatedOnce) {
    activatedOnce = true;
    return;
  }
  if (isAuthReady.value && user.value) reload();
});

onUnmounted(() => {
  if (filtersDebounceTimer) clearTimeout(filtersDebounceTimer);
  cancelStats();
  cancelFacets();
  cancelSummary();
  if (gsapCtx) gsapCtx.revert();
});
</script>

<style scoped>
.dashboard-wrapper {
  display: flex;
  min-height: 100vh;
  background-color: #f3f4f6;
  font-family: var(--font-sans);
  color: #0f172a;
}
.main-content { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.dashboard-content { flex: 1; padding: 1.5rem 2rem 2.5rem; }

.toolbar {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap;
}
.toolbar-title { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.01em; margin: 0; }
.toolbar-desc { margin-top: 0.25rem; font-size: 0.875rem; color: #6b7280; max-width: 62ch; }
.btn-refresh {
  display: inline-flex; align-items: center; gap: 0.45rem;
  height: 38px; padding: 0 0.9rem; border-radius: 0.6rem;
  border: 1px solid #e5e7eb; background: #fff; color: #374151;
  font-size: 0.85rem; font-weight: 600; cursor: pointer;
  transition: border-color 140ms, box-shadow 140ms, background 140ms;
}
.btn-refresh:hover:not(:disabled) { border-color: #a5b4fc; background: #f8fafc; }
.btn-refresh:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-refresh .is-spinning { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Filtros */
.filters {
  display: flex; flex-direction: column; gap: 0.85rem;
  background: #fff; border: 1px solid #e5e7eb; border-radius: 0.75rem;
  padding: 1rem 1.15rem; margin-bottom: 1.25rem;
}
.filter-block { display: flex; align-items: center; gap: 0.85rem; flex-wrap: wrap; }
.filter-label {
  display: inline-flex; align-items: center; gap: 0.35rem;
  min-width: 132px; font-size: 0.75rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af;
}
.chip-row { display: flex; gap: 0.4rem; flex-wrap: wrap; }
.chip {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.4rem 0.75rem; border-radius: 9999px;
  border: 1px solid #e5e7eb; background: #fff; color: #374151;
  font-size: 0.8rem; font-weight: 600; cursor: pointer;
  transition: border-color 140ms, background 140ms, color 140ms;
}
.chip:hover { border-color: #93c5fd; background: #f8fafc; }
.chip.is-active { border-color: #2563eb; background: #eff6ff; color: #1d4ed8; }
.chip--danger.is-active { border-color: #dc2626; background: #fef2f2; color: #b91c1c; }
.chip__logo { width: 15px; height: 15px; object-fit: contain; border-radius: 3px; }
.chip__count {
  font-size: 0.68rem; font-weight: 700; color: #6b7280;
  background: #f3f4f6; border-radius: 9999px; padding: 0.05rem 0.35rem;
}
.chip.is-active .chip__count { background: #dbeafe; color: #1d4ed8; }
.chip--clear { color: #6b7280; }
.chip--clear:hover { border-color: #fca5a5; background: #fef2f2; color: #b91c1c; }

.filters-advanced { border-top: 1px dashed #e5e7eb; padding-top: 0.75rem; }
.filters-advanced summary {
  display: flex; align-items: center; justify-content: space-between;
  cursor: pointer; list-style: none; font-size: 0.8rem; font-weight: 700; color: #4b5563;
}
.filters-advanced summary::-webkit-details-marker { display: none; }
.advanced-title { display: inline-flex; align-items: center; gap: 0.45rem; }
.filter-count {
  font-size: 0.68rem; font-weight: 700; color: #1d4ed8;
  background: #dbeafe; border-radius: 9999px; padding: 0.05rem 0.4rem;
}
.filters-advanced[open] .advanced-chevron { transform: rotate(180deg); }
.advanced-chevron { transition: transform 160ms; }
.filters-advanced__body { display: flex; flex-direction: column; gap: 0.85rem; padding-top: 0.85rem; }
.filters-foot {
  display: flex; align-items: center; justify-content: space-between;
  gap: 0.75rem; flex-wrap: wrap; font-size: 0.78rem; color: #6b7280;
  padding-top: 0.75rem; border-top: 1px dashed #e5e7eb;
}
.filters-range {
  display: flex; gap: 1rem; flex-wrap: wrap;
  padding-top: 0.75rem; border-top: 1px dashed #e5e7eb;
}
.filters-range__item {
  display: inline-flex; align-items: center; gap: 0.35rem;
  font-size: 0.78rem; font-weight: 600; color: #6b7280;
}
/* Mostra que o filtro existe mesmo sem opção para oferecer, em vez de
   desaparecer e dar a impressão de que não foi feito. */
.filter-empty { font-size: 0.78rem; color: #9ca3af; font-style: italic; }

.window-hint {
  margin: -0.35rem 0 1.25rem; padding: 0.6rem 0.85rem;
  background: #fffbeb; border: 1px solid #fde68a; border-radius: 0.6rem;
  font-size: 0.78rem; color: #92400e;
}
.data-error {
  margin-bottom: 1rem; padding: 0.7rem 0.95rem;
  background: #fef2f2; border: 1px solid #fecaca; border-radius: 0.6rem;
  font-size: 0.82rem; color: #b91c1c; font-weight: 600;
}

/* Cards */
.grid { display: grid; gap: 1rem; margin-bottom: 1.25rem; }
.grid-2 { grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); }
.grid-4 { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
.card {
  background: #fff; border: 1px solid #e5e7eb; border-radius: 0.75rem;
  padding: 1.1rem 1.2rem; min-width: 0;
}
.card--featured { border-color: #bfdbfe; box-shadow: 0 1px 3px rgba(37, 99, 235, 0.08); }
.card-icon { margin-bottom: 0.6rem; }
.icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 38px; height: 38px; border-radius: 0.6rem;
}
.icon--blue { background: #eff6ff; color: #2563eb; }
.icon--amber { background: #fffbeb; color: #d97706; }
.icon--emerald { background: #ecfdf5; color: #059669; }
.icon--sky { background: #f0f9ff; color: #0284c7; }
.card-title { font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; }
.card-title.plain { text-transform: none; letter-spacing: 0; font-size: 0.9rem; color: #374151; }
.card-value { margin-top: 0.35rem; font-size: 1.7rem; font-weight: 800; letter-spacing: -0.02em; }
.card-value--unavailable { font-size: 1.1rem; color: #9ca3af; }
.unit { font-size: 0.8rem; font-weight: 600; color: #9ca3af; }
.card-foot { margin-top: 0.45rem; font-size: 0.76rem; color: #4b5563; }
.card-foot.muted { color: #9ca3af; }
.card-foot.is-error { color: #b91c1c; font-weight: 600; }
.trend {
  margin-left: 0.4rem; font-size: 0.72rem; font-weight: 700;
  padding: 0.1rem 0.4rem; border-radius: 9999px; vertical-align: middle;
}
.trend.is-up { background: #ecfdf5; color: #059669; }
.trend.is-down { background: #fef2f2; color: #dc2626; }
.trend.is-flat { background: #f3f4f6; color: #6b7280; }
.link-like {
  display: inline-block; margin-top: 0.5rem;
  font-size: 0.76rem; font-weight: 700; color: #2563eb; text-decoration: none;
}
.link-like:hover { text-decoration: underline; }

.mini-bar { margin-top: 0.6rem; height: 6px; border-radius: 9999px; background: #f3f4f6; overflow: hidden; }
.mini-bar__fill { display: block; height: 100%; border-radius: 9999px; }
.mini-bar__fill.is-ok { background: #10b981; }
.mini-bar__fill.is-warn { background: #f59e0b; }
.mini-bar__fill.is-danger { background: #ef4444; }

/* Gráficos */
.chart-card { display: flex; flex-direction: column; }
.chart-head {
  display: flex; align-items: baseline; justify-content: space-between;
  gap: 0.75rem; flex-wrap: wrap; margin-bottom: 0.35rem;
}
.chart-hint { font-size: 0.74rem; color: #9ca3af; }
.chart-empty { margin: 2rem 0; text-align: center; font-size: 0.85rem; color: #9ca3af; }
:deep(.apexcharts-canvas) { font-family: inherit; }

/* Tabela */
.table { margin-top: 0.5rem; font-size: 0.82rem; }
.thead, .trow {
  display: grid;
  grid-template-columns: minmax(160px, 2.4fr) 0.7fr 1fr 1fr 0.9fr;
  gap: 0.75rem; align-items: center;
}
.thead {
  padding: 0.45rem 0.2rem; font-size: 0.68rem; font-weight: 700;
  letter-spacing: 0.05em; color: #9ca3af; border-bottom: 1px solid #e5e7eb;
}
.trow { padding: 0.55rem 0.2rem; border-bottom: 1px solid #f3f4f6; }
.trow:last-child { border-bottom: none; }
.num { text-align: right; font-variant-numeric: tabular-nums; }
.strong { font-weight: 700; }
.muted { color: #9ca3af; }
.is-ok { color: #059669; font-weight: 700; }
.is-warn { color: #d97706; font-weight: 700; }
.is-danger { color: #dc2626; font-weight: 700; }
.ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.empty { padding: 1.5rem 0; text-align: center; color: #9ca3af; }

/* Esqueleto de carregamento */
.skeleton { position: relative; overflow: hidden; }
.skeleton::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.65), transparent);
  animation: shimmer 1.2s infinite;
}
@keyframes shimmer { from { transform: translateX(-100%); } to { transform: translateX(100%); } }

@media (max-width: 900px) {
  .dashboard-content { padding: 1.25rem 1rem 2rem; }
  .thead, .trow { grid-template-columns: minmax(120px, 2fr) 0.7fr 1fr 1fr; }
  .thead > :nth-child(5), .trow > :nth-child(5) { display: none; }
}
</style>
