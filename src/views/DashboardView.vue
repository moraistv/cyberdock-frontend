<template>
  <div class="dashboard-wrapper">
    <SidebarComponent />
    <div class="main-content">
      <TopbarComponent />

      <div class="dashboard-content" ref="rootEl">
        <!-- Toolbar -->
        <div class="toolbar">
          <div class="toolbar-text">
            <h1 class="toolbar-title">Dashboard</h1>
            <p class="toolbar-desc">Visão geral das vendas, armazenagem e faturamento do período selecionado.</p>
          </div>
          <button class="btn-refresh" @click="reload" :disabled="statsLoading" title="Atualizar métricas">
            <svg :class="{ 'is-spinning': statsLoading }" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /><polyline points="21 3 21 9 15 9" /></svg>
            Atualizar
          </button>
        </div>

        <!-- Filtros -->
        <div class="filters">
          <div class="filter-block">
            <span class="filter-label">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              Período
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
              <button class="chip" :class="{ 'is-active': selectedMarketplaces.includes('ML') }"
                      @click="toggleMarketplace('ML')">
                <img src="/img/ml-logo.svg" alt="" class="chip__logo" /> Mercado Livre
              </button>
              <button class="chip" :class="{ 'is-active': selectedMarketplaces.includes('Shopee') }"
                      @click="toggleMarketplace('Shopee')">
                <img src="/img/shopee-logo.svg" alt="" class="chip__logo" /> Shopee
              </button>
            </div>
          </div>

          <div class="filter-block" v-if="allAccounts.length">
            <span class="filter-label">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              Contas
            </span>
            <div class="chip-row">
              <button class="chip" :class="{ 'is-active': !selectedAccounts.length }"
                      @click="selectedAccounts = []">Todas</button>
              <button v-for="acc in allAccounts" :key="acc.value"
                      class="chip" :class="{ 'is-active': selectedAccounts.includes(acc.value) }"
                      @click="toggleAccount(acc.value)">
                <img :src="acc.logo" alt="" class="chip__logo" /> {{ acc.label }}
              </button>
            </div>
          </div>

          <div class="filter-block" v-if="knownStatuses.length">
            <span class="filter-label">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
              Status
            </span>
            <div class="chip-row">
              <button class="chip" :class="{ 'is-active': !selectedStatuses.length }"
                      @click="selectedStatuses = []">Todos</button>
              <button v-for="st in knownStatuses" :key="st"
                      class="chip" :class="{ 'is-active': selectedStatuses.includes(st) }"
                      @click="toggleIn(selectedStatuses, st)">{{ st }}</button>
            </div>
          </div>

          <div class="filter-block" v-if="knownModes.length">
            <span class="filter-label">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
              Envio
            </span>
            <div class="chip-row">
              <button class="chip" :class="{ 'is-active': !selectedModes.length }"
                      @click="selectedModes = []">Todos</button>
              <button v-for="m in knownModes" :key="m"
                      class="chip" :class="{ 'is-active': selectedModes.includes(m) }"
                      @click="toggleIn(selectedModes, m)">{{ m }}</button>
            </div>
          </div>

          <div v-if="hasActiveFilters" class="filters-foot">
            <span class="filters-range">{{ dateRange.from }} → {{ dateRange.to }}</span>
            <button class="chip chip--clear" @click="clearFilters">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              Limpar filtros
            </button>
          </div>
        </div>

        <!-- Cards Topo -->
        <div class="grid grid-4" ref="cardsRow">
          <div class="card" :class="{ skeleton: statsLoading }">
            <div class="card-icon">
              <span class="icon icon--indigo">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19l16 0" /><path d="M4 15l4 -6l4 2l4 -5l4 4" /></svg>
              </span>
            </div>
            <div class="card-title">Vendas no Período</div>
            <div class="card-value">
              {{ totals.sales }} <span class="unit">vendas</span>
              <span v-if="salesTrend" class="trend" :class="salesTrend.tone">
                <svg v-if="salesTrend.dir === 'up'" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 15 12 9 18 15" /></svg>
                <svg v-else-if="salesTrend.dir === 'down'" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                {{ salesTrend.label }}
              </span>
            </div>
            <div class="card-foot">{{ totals.units }} unidade(s) · {{ totals.distinct_skus }} SKU(s)</div>
            <div v-if="salesTrend" class="card-foot muted">
              Período anterior: {{ stats.previousTotals.sales }} venda(s)
            </div>
          </div>

          <div class="card" :class="{ skeleton: statsLoading }">
            <div class="card-icon">
              <span class="icon icon--amber">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /><path d="M5 17h-2v-11a1 1 0 0 1 1 -1h9v12m-4 0h6m4 0h2v-6h-8m0 -5h5l3 5" /></svg>
              </span>
            </div>
            <div class="card-title">A Despachar</div>
            <div class="card-value">{{ totals.pending }} <span class="unit">pendentes</span></div>
            <router-link to="/tabela-vendas" class="link-like">Ver na tabela de vendas</router-link>
          </div>

          <div class="card" :class="{ skeleton: storageLoading }">
            <div class="card-icon">
              <span class="icon icon--sky">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 4.5l0 9l-8 4.5l-8 -4.5l0 -9l8 -4.5" /><path d="M12 12l8 -4.5" /><path d="M12 12l0 9" /><path d="M12 12l-8 -4.5" /></svg>
              </span>
            </div>
            <div class="card-title">Armazenamento</div>
            <div class="card-value">{{ volumeConsumidoFmt }} <span class="unit">m³</span></div>
            <div class="card-foot muted">
              Contratado: {{ volumeContratadoFmt }} m³
              <span v-if="ocupacaoPct !== null"> · {{ ocupacaoPct }}% usado</span>
            </div>
            <div v-if="ocupacaoPct !== null" class="mini-bar">
              <span class="mini-bar__fill" :class="ocupacaoTone" :style="{ width: Math.min(ocupacaoPct, 100) + '%' }"></span>
            </div>
          </div>

          <div class="card" :class="{ skeleton: storageLoading }">
            <div class="card-icon">
              <span class="icon icon--emerald">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
              </span>
            </div>
            <div class="card-title">Fatura Atual</div>
            <div class="card-value card-value--sm">{{ faturaTotalFmt }}</div>
            <router-link to="/resumo-cobranca" class="link-like">Ver resumo de cobrança</router-link>
          </div>
        </div>

        <!-- Cards secundários -->
        <div class="grid grid-3" ref="miniRow">
          <div class="card card--mini" :class="{ skeleton: statsLoading }">
            <span class="icon icon--emerald sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </span>
            <div>
              <div class="card-value card-value--sm">{{ totals.processed }}</div>
              <div class="card-title plain">Processadas (estoque abatido)</div>
            </div>
          </div>
          <div class="card card--mini" :class="{ skeleton: statsLoading }">
            <span class="icon icon--rose sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
            </span>
            <div>
              <div class="card-value card-value--sm">{{ totals.cancelled }}</div>
              <div class="card-title plain">Canceladas no período</div>
            </div>
          </div>
          <div class="card card--mini" :class="{ skeleton: statsLoading }">
            <span class="icon icon--indigo sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>
            </span>
            <div>
              <div class="card-value card-value--sm">{{ mediaDiaria }}</div>
              <div class="card-title plain">Média de vendas por dia</div>
            </div>
          </div>
        </div>

        <!-- Gráficos -->
        <div class="grid grid-2" ref="chartsRow">
          <div class="card chart-card" :class="{ skeleton: statsLoading }">
            <div class="card-title plain">Vendas por Dia</div>
            <VueApexCharts v-if="byDay.length" type="area" height="260" :options="dailyChartOptions" :series="dailySeries" />
            <p v-else class="chart-empty">Sem vendas no período selecionado.</p>
          </div>

          <div class="card chart-card" :class="{ skeleton: statsLoading }">
            <div class="card-title plain">Vendas por Status de Expedição</div>
            <VueApexCharts v-if="byStatus.length" type="bar" height="260" :options="statusChartOptions" :series="statusSeries" />
            <p v-else class="chart-empty">Sem vendas no período selecionado.</p>
          </div>
        </div>

        <div class="grid grid-2">
          <div class="card chart-card" :class="{ skeleton: statsLoading }">
            <div class="card-title plain">Participação por Canal</div>
            <VueApexCharts v-if="byMarketplace.length" type="donut" height="250" :options="marketplaceChartOptions" :series="marketplaceSeries" />
            <p v-else class="chart-empty">Sem vendas no período selecionado.</p>
          </div>

          <div class="card chart-card" :class="{ skeleton: statsLoading }">
            <div class="card-title plain">Modalidade de Envio</div>
            <VueApexCharts v-if="byShippingMode.length" type="bar" height="250" :options="shippingChartOptions" :series="shippingSeries" />
            <p v-else class="chart-empty">Sem vendas no período selecionado.</p>
          </div>
        </div>

        <!-- Top SKUs -->
        <div class="card" :class="{ skeleton: statsLoading }">
          <div class="card-title plain">SKUs mais vendidos no período</div>
          <div class="table table--top">
            <div class="thead">
              <div>SKU</div>
              <div>PRODUTO</div>
              <div class="num">PEDIDOS</div>
              <div class="num">UNIDADES</div>
            </div>
            <div class="trow" v-for="item in topSkus" :key="item.sku">
              <div class="mono">{{ item.sku }}</div>
              <div class="ellipsis">{{ item.title || '—' }}</div>
              <div class="num">{{ item.orders }}</div>
              <div class="num strong">{{ item.units }}</div>
            </div>
            <div v-if="!topSkus.length && !statsLoading" class="empty">Sem vendas no período selecionado.</div>
          </div>
        </div>

        <!-- Produtos em estoque -->
        <div class="card" :class="{ skeleton: storageLoading }" ref="tableRow">
          <div class="card-title plain">Produtos em Estoque</div>
          <div class="table">
            <div class="thead">
              <div>SKU</div>
              <div>DESCRIÇÃO DO PRODUTO</div>
              <div>DIMENSÕES (cm)</div>
              <div class="num">QTDE. EM ESTOQUE</div>
              <div class="num">VOLUME TOTAL (m³)</div>
            </div>

            <div class="trow" v-for="(p, i) in skus" :key="i">
              <div class="mono">{{ p.sku }}</div>
              <div class="ellipsis">{{ p.descricao }}</div>
              <div>
                <template v-if="p.dimensoes">
                  {{ p.dimensoes.comprimento }} × {{ p.dimensoes.largura }} × {{ p.dimensoes.altura }}
                </template>
                <template v-else>—</template>
              </div>
              <div class="num">{{ p.quantidade }}</div>
              <div class="num">{{ (calcVol(p)).toFixed(2) }}</div>
            </div>

            <div v-if="!skus.length && !storageLoading" class="empty">Nenhum produto cadastrado.</div>
          </div>
        </div>
      </div> <!-- /dashboard-content -->
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import SidebarComponent from '../components/SidebarComponent.vue'
import TopbarComponent from '../components/TopbarComponent.vue'
import VueApexCharts from 'vue3-apexcharts'
import { gsap } from 'gsap'

import { useAuth } from '@/composables/useAuth'
import { useUserStorage } from '@/composables/useUserStorage'
import { useDashboardStats } from '@/composables/useDashboardStats'

/* -------------------- Estado / dados -------------------- */
const { user, isAuthReady, mlAccounts, shopeeAccounts } = useAuth()

const MK_LOGOS = { ML: '/img/ml-logo.svg', Shopee: '/img/shopee-logo.svg' }

const periodOptions = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: 'month', label: 'Este mês' },
  { value: '90d', label: 'Últimos 90 dias' },
]
const period = ref('month')
const selectedMarketplaces = ref([])
const selectedAccounts = ref([])
const selectedStatuses = ref([])
const selectedModes = ref([])

function toggleIn(list, value) {
  const i = list.indexOf(value)
  if (i === -1) list.push(value); else list.splice(i, 1)
}

const { stats, isLoading: statsLoading, fetchStats } = useDashboardStats()

const totals = computed(() => stats.value.totals)
const byStatus = computed(() => stats.value.byStatus)
const byDay = computed(() => stats.value.byDay)
const byMarketplace = computed(() => stats.value.byMarketplace)
const byShippingMode = computed(() => stats.value.byShippingMode)
const topSkus = computed(() => stats.value.topSkus)

// As opções de status e de modalidade saem das próprias agregações. Como a
// consulta já vem filtrada, derivar só da resposta atual faria as opções
// desaparecerem ao marcá-las — então os valores vistos são acumulados.
const knownStatuses = ref([])
const knownModes = ref([])
watch(byStatus, (rows) => {
  const set = new Set([...knownStatuses.value, ...(rows || []).map((r) => r.label).filter(Boolean)])
  if (set.size !== knownStatuses.value.length) knownStatuses.value = [...set].sort()
})
watch(byShippingMode, (rows) => {
  const set = new Set([...knownModes.value, ...(rows || []).map((r) => r.mode).filter(Boolean)])
  if (set.size !== knownModes.value.length) knownModes.value = [...set].sort()
})

// Variação contra o período anterior de mesma duração (vem do backend).
const salesTrend = computed(() => {
  const prev = stats.value.previousTotals
  if (!prev) return null
  const before = prev.sales || 0
  const now = totals.value.sales || 0
  if (!before && !now) return null
  if (!before) return { dir: 'up', tone: 'is-up', label: 'novo' }
  const pct = ((now - before) / before) * 100
  const dir = pct > 0.5 ? 'up' : pct < -0.5 ? 'down' : 'flat'
  const tone = dir === 'up' ? 'is-up' : dir === 'down' ? 'is-down' : 'is-flat'
  const label = dir === 'flat' ? 'estável' : `${pct > 0 ? '+' : ''}${pct.toFixed(0)}%`
  return { dir, tone, label }
})

// storage/billing reais
const userId = computed(() => user.value?.uid || null)
const {
  skus,
  volumeConsumido,
  volumeContratado,
  billingSummary,
  isLoading: storageLoadingRaw,
  calcularVolumePorSku
} = useUserStorage(userId, null, { withMovements: false })

const storageLoading = computed(() => storageLoadingRaw.value || billingSummary.value.isLoading)

const volumeConsumidoFmt = computed(() => (volumeConsumido.value || 0).toFixed(2))
const volumeContratadoFmt = computed(() => (volumeContratado.value || 0).toFixed(2))
const ocupacaoPct = computed(() => {
  const contratado = volumeContratado.value || 0
  if (!contratado) return null
  return Math.round(((volumeConsumido.value || 0) / contratado) * 100)
})
const ocupacaoTone = computed(() => {
  const pct = ocupacaoPct.value ?? 0
  if (pct >= 95) return 'is-danger'
  if (pct >= 75) return 'is-warn'
  return 'is-ok'
})
const faturaTotalFmt = computed(() => {
  const total = billingSummary.value?.data?.totalCost || 0
  return total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
})

const allAccounts = computed(() => [
  ...(mlAccounts.value || []).map((a) => ({
    value: String(a.user_id),
    label: a.nickname || String(a.user_id),
    logo: MK_LOGOS.ML,
  })),
  ...(shopeeAccounts.value || []).map((a) => ({
    value: String(a.shop_id),
    label: a.shop_name || String(a.shop_id),
    logo: MK_LOGOS.Shopee,
  })),
])

/* -------------------- Período -> datas -------------------- */
function toIso(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const dateRange = computed(() => {
  const now = new Date()
  const to = toIso(now)
  if (period.value === '7d') {
    const d = new Date(now); d.setDate(d.getDate() - 6); return { from: toIso(d), to }
  }
  if (period.value === '30d') {
    const d = new Date(now); d.setDate(d.getDate() - 29); return { from: toIso(d), to }
  }
  if (period.value === '90d') {
    const d = new Date(now); d.setDate(d.getDate() - 89); return { from: toIso(d), to }
  }
  const d = new Date(now.getFullYear(), now.getMonth(), 1)
  return { from: toIso(d), to }
})

const diasNoPeriodo = computed(() => {
  const { from, to } = dateRange.value
  const ms = new Date(`${to}T00:00:00`) - new Date(`${from}T00:00:00`)
  return Math.max(1, Math.round(ms / 86400000) + 1)
})
const mediaDiaria = computed(() => {
  const media = (totals.value.sales || 0) / diasNoPeriodo.value
  return media >= 10 ? Math.round(media) : media.toFixed(1).replace('.', ',')
})

function toggleMarketplace(mk) {
  const list = [...selectedMarketplaces.value]
  const i = list.indexOf(mk)
  if (i === -1) list.push(mk); else list.splice(i, 1)
  selectedMarketplaces.value = list
}
function toggleAccount(value) {
  const list = [...selectedAccounts.value]
  const i = list.indexOf(value)
  if (i === -1) list.push(value); else list.splice(i, 1)
  selectedAccounts.value = list
}

const hasActiveFilters = computed(() =>
  selectedMarketplaces.value.length > 0 ||
  selectedAccounts.value.length > 0 ||
  selectedStatuses.value.length > 0 ||
  selectedModes.value.length > 0
)

function clearFilters() {
  selectedMarketplaces.value = []
  selectedAccounts.value = []
  selectedStatuses.value = []
  selectedModes.value = []
}

function reload() {
  const { from, to } = dateRange.value
  fetchStats({
    from,
    to,
    marketplace: selectedMarketplaces.value,
    account: selectedAccounts.value,
    shippingStatus: selectedStatuses.value,
    shippingMode: selectedModes.value,
  })
}

/* -------------------- Helpers -------------------- */
const calcVol = (p) => calcularVolumePorSku(p)

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
function dayLabel(iso) {
  const [, m, d] = String(iso).split('-')
  return `${d} ${MONTHS[Number(m) - 1]}`
}

const BASE_CHART = {
  chart: { toolbar: { show: false }, fontFamily: 'Inter, system-ui, sans-serif' },
  tooltip: { theme: 'light' },
  dataLabels: { enabled: false },
  grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
}

/* -------------------- Gráficos -------------------- */
const dailySeries = computed(() => [{ name: 'Vendas', data: byDay.value.map((d) => d.value) }])
const dailyChartOptions = computed(() => ({
  ...BASE_CHART,
  chart: { ...BASE_CHART.chart, type: 'area' },
  colors: ['#4f46e5'],
  stroke: { curve: 'smooth', width: 2.5 },
  fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05, stops: [0, 100] } },
  xaxis: {
    categories: byDay.value.map((d) => dayLabel(d.day)),
    labels: { rotate: -45, hideOverlappingLabels: true, style: { fontSize: '11px' } },
    tooltip: { enabled: false },
  },
  yaxis: { labels: { formatter: (v) => Math.trunc(v) } },
}))

const statusSeries = computed(() => [{ name: 'Vendas', data: byStatus.value.map((d) => d.value) }])
const statusChartOptions = computed(() => ({
  ...BASE_CHART,
  chart: { ...BASE_CHART.chart, type: 'bar' },
  colors: ['#6366f1'],
  plotOptions: { bar: { borderRadius: 6, columnWidth: '48%', distributed: false } },
  xaxis: {
    categories: byStatus.value.map((d) => d.label),
    labels: { trim: true, hideOverlappingLabels: true, style: { fontSize: '11px' } },
  },
  yaxis: { labels: { formatter: (v) => Math.trunc(v) } },
}))

// Cores fixas por canal, para o gráfico casar com os logos da interface.
const MK_COLORS = { ML: '#f8d135', Shopee: '#ee4d2d' }
const marketplaceSeries = computed(() => byMarketplace.value.map((d) => d.value))
const marketplaceChartOptions = computed(() => ({
  ...BASE_CHART,
  chart: { ...BASE_CHART.chart, type: 'donut' },
  labels: byMarketplace.value.map((d) => (d.marketplace === 'ML' ? 'Mercado Livre' : d.marketplace)),
  colors: byMarketplace.value.map((d) => MK_COLORS[d.marketplace] || '#94a3b8'),
  legend: { position: 'bottom', fontSize: '12px' },
  plotOptions: { pie: { donut: { size: '62%' } } },
}))

const shippingSeries = computed(() => [{ name: 'Vendas', data: byShippingMode.value.map((d) => d.value) }])
const shippingChartOptions = computed(() => ({
  ...BASE_CHART,
  chart: { ...BASE_CHART.chart, type: 'bar' },
  colors: ['#0ea5e9'],
  plotOptions: { bar: { borderRadius: 6, horizontal: true, barHeight: '55%' } },
  xaxis: { categories: byShippingMode.value.map((d) => d.mode), labels: { formatter: (v) => Math.trunc(v) } },
}))

/* -------------------- GSAP -------------------- */
const rootEl = ref(null)
const cardsRow = ref(null)
const miniRow = ref(null)
const chartsRow = ref(null)
const tableRow = ref(null)
let gsapCtx = null

function runEnterAnimations() {
  if (!rootEl.value) return
  gsapCtx = gsap.context(() => {
    if (cardsRow.value) {
      gsap.from(cardsRow.value.children, { opacity: 0, y: 14, duration: 0.45, stagger: 0.07, ease: 'power2.out' })
    }
    if (miniRow.value) {
      gsap.from(miniRow.value.children, { opacity: 0, y: 12, duration: 0.4, stagger: 0.06, ease: 'power2.out', delay: 0.1 })
    }
    if (chartsRow.value) {
      gsap.from(chartsRow.value.children, { opacity: 0, y: 16, duration: 0.45, stagger: 0.08, ease: 'power2.out', delay: 0.15 })
    }
    if (tableRow.value) {
      gsap.from(tableRow.value, { opacity: 0, y: 16, duration: 0.45, ease: 'power2.out', delay: 0.2 })
    }
  }, rootEl)
}

/* -------------------- Ciclo de vida -------------------- */
// Recarrega ao mudar qualquer filtro.
watch(
  [period, selectedMarketplaces, selectedAccounts, selectedStatuses, selectedModes],
  () => reload(),
  { deep: true }
)

onMounted(async () => {
  if (isAuthReady.value && user.value) reload()
  watch(isAuthReady, (ready) => { if (ready && user.value) reload() })
  runEnterAnimations()
})

onUnmounted(() => {
  if (gsapCtx) gsapCtx.revert()
})
</script>

<style scoped>
.dashboard-wrapper {
  display: flex;
  min-height: 100vh;
  background-color: #f3f4f6;
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  color: #0f172a;
}
.main-content { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.dashboard-content { flex: 1; padding: 1.5rem 2rem 2.5rem; }

/* Toolbar */
.toolbar {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap;
}
.toolbar-title { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.01em; margin: 0; }
.toolbar-desc { margin-top: 0.25rem; font-size: 0.875rem; color: #6b7280; }
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
  padding: 1rem 1.15rem; margin-bottom: 1.5rem;
}
.filter-block { display: flex; align-items: center; gap: 0.85rem; flex-wrap: wrap; }
.filter-label {
  display: inline-flex; align-items: center; gap: 0.35rem;
  min-width: 92px; font-size: 0.75rem; font-weight: 700;
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
.chip:hover { border-color: #a5b4fc; background: #f8fafc; }
.chip.is-active { border-color: #4f46e5; background: #eef2ff; color: #4338ca; }
.chip__logo { width: 15px; height: 15px; object-fit: contain; border-radius: 3px; }

.chip--clear { color: #6b7280; }
.chip--clear:hover { border-color: #fca5a5; background: #fef2f2; color: #b91c1c; }

/* Rodapé do painel de filtros: mostra o recorte de datas efetivo e o atalho
   para zerar a seleção. */
.filters-foot {
  display: flex; align-items: center; justify-content: space-between;
  gap: 0.75rem; flex-wrap: wrap;
  padding-top: 0.75rem; border-top: 1px dashed #e5e7eb;
}
.filters-range { font-size: 0.75rem; color: #9ca3af; font-variant-numeric: tabular-nums; }

/* Variação contra o período anterior. */
.trend {
  display: inline-flex; align-items: center; gap: 0.15rem;
  margin-left: 0.4rem; padding: 0.1rem 0.4rem;
  border-radius: 9999px; font-size: 0.7rem; font-weight: 700;
  vertical-align: middle;
}
.trend.is-up { background: #ecfdf5; color: #047857; }
.trend.is-down { background: #fef2f2; color: #b91c1c; }
.trend.is-flat { background: #f3f4f6; color: #6b7280; }

/* Grid + cards */
.grid { display: grid; gap: 1rem; margin-bottom: 1.5rem; }
.grid-4 { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.grid-3 { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
.grid-2 { grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); }

.card {
  background: #fff; border: 1px solid #e5e7eb; border-radius: 0.75rem;
  padding: 1.15rem; box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
}
.card--mini { display: flex; align-items: center; gap: 0.85rem; }
.card-icon { margin-bottom: 0.75rem; }
.icon {
  display: grid; place-items: center; width: 38px; height: 38px;
  border-radius: 10px; background: #f3f4f6; color: #4b5563;
}
.icon.sm { width: 34px; height: 34px; flex-shrink: 0; }
.icon--indigo { background: #eef2ff; color: #4f46e5; }
.icon--amber { background: #fffbeb; color: #b45309; }
.icon--sky { background: #f0f9ff; color: #0284c7; }
.icon--emerald { background: #ecfdf5; color: #059669; }
.icon--rose { background: #fef2f2; color: #dc2626; }

.card-title { font-size: 0.8rem; font-weight: 600; color: #6b7280; line-height: 1.35; }
.card-title.plain { margin-bottom: 0.85rem; font-size: 0.9rem; color: #111827; font-weight: 700; }
.card--mini .card-title.plain { margin-bottom: 0; font-size: 0.78rem; font-weight: 600; color: #6b7280; }
.card-value {
  margin-top: 0.35rem; font-size: 1.6rem; font-weight: 700;
  color: #0f172a; line-height: 1.15; font-variant-numeric: tabular-nums;
}
.card-value--sm { font-size: 1.25rem; }
.unit { font-size: 0.8rem; font-weight: 600; color: #9ca3af; }
.card-foot { margin-top: 0.4rem; font-size: 0.75rem; color: #6b7280; }
.card-foot.muted { color: #9ca3af; }
.link-like {
  display: inline-block; margin-top: 0.5rem; padding: 0;
  background: none; border: none; color: #4f46e5;
  font-size: 0.78rem; font-weight: 600; cursor: pointer; text-decoration: none;
}
.link-like:hover { text-decoration: underline; }

.mini-bar { margin-top: 0.6rem; height: 6px; border-radius: 999px; background: #f1f5f9; overflow: hidden; }
.mini-bar__fill { display: block; height: 100%; border-radius: 999px; transition: width 0.4s ease; }
.mini-bar__fill.is-ok { background: #10b981; }
.mini-bar__fill.is-warn { background: #f59e0b; }
.mini-bar__fill.is-danger { background: #ef4444; }

.chart-card { min-width: 0; }
.chart-empty { margin: 2.5rem 0; text-align: center; font-size: 0.85rem; color: #9ca3af; }

/* Tabelas */
.table { width: 100%; font-size: 0.82rem; }
.thead, .trow {
  display: grid; grid-template-columns: 1.1fr 2.4fr 1.4fr 1fr 1fr;
  gap: 0.75rem; align-items: center;
}
.table--top .thead, .table--top .trow { grid-template-columns: 1.1fr 3fr 1fr 1fr; }
.thead {
  font-size: 0.68rem; font-weight: 700; letter-spacing: 0.05em;
  text-transform: uppercase; color: #9ca3af;
  padding-bottom: 0.6rem; border-bottom: 1px solid #e5e7eb;
}
.trow { padding: 0.65rem 0; border-bottom: 1px solid #f3f4f6; color: #374151; }
.trow:last-child { border-bottom: none; }
.num { text-align: right; font-variant-numeric: tabular-nums; }
.strong { font-weight: 700; color: #0f172a; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.78rem; }
.ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.empty { padding: 2rem 0; text-align: center; color: #9ca3af; }

/* Skeleton */
.card.skeleton { position: relative; overflow: hidden; }
.card.skeleton::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(90deg, rgba(238,240,243,0) 0%, rgba(238,240,243,0.65) 50%, rgba(238,240,243,0) 100%);
  background-size: 200% 100%; animation: skeleton-shimmer 1.3s ease infinite;
}
@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .btn-refresh .is-spinning, .card.skeleton::after { animation: none; }
}

@media (max-width: 720px) {
  .dashboard-content { padding: 1.25rem 1rem 2rem; }
  .thead, .trow { grid-template-columns: 1fr 1.6fr 1fr; }
  .thead > :nth-child(n+4), .trow > :nth-child(n+4) { display: none; }
}
</style>
