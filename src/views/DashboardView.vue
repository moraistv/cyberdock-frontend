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
          <button class="btn-refresh" @click="reload" :disabled="statsLoading || storageLoading" title="Atualizar vendas, armazenamento e cobrança">
            <svg :class="{ 'is-spinning': statsLoading || storageLoading }" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /><polyline points="21 3 21 9 15 9" /></svg>
            Atualizar
          </button>
        </div>

        <!-- Filtros -->
        <div class="filters">
          <div class="filters-primary">
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

          <div class="filter-block filter-block--period">
            <span class="filter-label">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              Prazo de envio
            </span>
            <div class="chip-row">
              <button v-for="p in shipPeriodOptions" :key="p.value"
                      class="chip" :class="{ 'is-active': shipPeriod === p.value, 'chip--danger': p.value === 'overdue' && shipPeriod === 'overdue' }"
                      @click="shipPeriod = p.value">
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
                      @click="toggleMarketplace(mk.value)">
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
                      @click="selectedModes = []">Todos</button>
              <button v-for="m in modeOptions" :key="m.value"
                      class="chip" :class="{ 'is-active': selectedModes.includes(m.value) }"
                      @click="toggleIn(selectedModes, m.value)">
                {{ m.label }}
                <span v-if="m.count !== null" class="chip__count">{{ m.count }}</span>
              </button>
              <span v-if="!modeOptions.length" class="filter-empty">
                {{ statsLoading ? 'Carregando...' : 'Nenhuma modalidade no período' }}
              </span>
            </div>
          </div>

          <div class="filters-range" aria-label="Intervalo efetivo">
            <span class="filters-range__item">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 2v3M16 2v3M3 9h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z" /></svg>
              Venda: {{ periodLabel }}
            </span>
            <span class="filters-range__item">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              Envio: {{ shipLabel }}
            </span>
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
                <span class="chip__count">{{ acc.count }}</span>
              </button>
            </div>
          </div>

          <div class="filter-block" v-if="statusFacets.length">
            <span class="filter-label">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
              Status de envio
            </span>
            <div class="chip-row">
              <button class="chip" :class="{ 'is-active': !selectedStatuses.length }"
                      @click="selectedStatuses = []">Todos</button>
              <button v-for="st in statusFacets" :key="st.value"
                      class="chip" :class="{ 'is-active': selectedStatuses.includes(st.value) }"
                      @click="toggleIn(selectedStatuses, st.value)">
                {{ st.label }} <span class="chip__count">{{ st.count }}</span>
              </button>
            </div>
          </div>

          <div class="operational-filter-grid">
            <div class="filter-block">
              <span class="filter-label">Fila operacional</span>
              <div class="chip-row">
                <button class="chip" :class="{ 'is-active': !selectedQueue }"
                        @click="selectedQueue = ''">Todos</button>
                <button v-for="option in queueOptions" :key="option.value"
                        class="chip" :class="{ 'is-active': selectedQueue === option.value }"
                        @click="selectedQueue = toggleSingle(selectedQueue, option.value)">
                  {{ option.label }}
                </button>
              </div>
            </div>

            <div class="filter-block">
              <span class="filter-label">Processamento de estoque</span>
              <div class="chip-row">
                <button class="chip" :class="{ 'is-active': !selectedProcessed }"
                        @click="selectedProcessed = ''">Todos</button>
                <button v-for="option in processedOptions" :key="option.value"
                        class="chip" :class="{ 'is-active': selectedProcessed === option.value }"
                        @click="selectedProcessed = toggleSingle(selectedProcessed, option.value)">
                  {{ option.label }}
                </button>
              </div>
            </div>

            <div class="filter-block">
              <span class="filter-label">Cadastro do SKU</span>
              <div class="chip-row">
                <button class="chip" :class="{ 'is-active': !selectedSkuMapped }"
                        @click="selectedSkuMapped = ''">Todos</button>
                <button v-for="option in skuMappedOptions" :key="option.value"
                        class="chip" :class="{ 'is-active': selectedSkuMapped === option.value }"
                        @click="selectedSkuMapped = toggleSingle(selectedSkuMapped, option.value)">
                  {{ option.label }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="hasActiveFilters" class="filters-foot">
            <span>{{ advancedFilterCount ? `${advancedFilterCount} filtro(s) avançado(s) ativo(s)` : 'Canal personalizado ativo' }}</span>
            <button class="chip chip--clear" @click="clearFilters">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              Limpar filtros
            </button>
          </div>
            </div>
          </details>
        </div>

        <div v-if="statsError" class="data-error" role="alert">
          Não foi possível carregar os indicadores de pedidos. Tente atualizar novamente.
        </div>

        <div class="section-heading">
          <div>
            <h2>Indicadores do período</h2>
            <p>Todos os números abaixo respeitam o período e os filtros selecionados.</p>
          </div>
        </div>

        <!-- Cards do período -->
        <div class="grid grid-4" ref="cardsRow">
          <div class="card card--kpi card--featured" :class="{ skeleton: statsLoading }">
            <div class="card-icon">
              <span class="icon icon--blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19l16 0" /><path d="M4 15l4 -6l4 2l4 -5l4 4" /></svg>
              </span>
            </div>
            <div class="card-title">Pedidos no período</div>
            <div class="card-value">
              {{ totals.orders }} <span class="unit">pedidos</span>
              <span v-if="salesTrend" class="trend" :class="salesTrend.tone">
                <svg v-if="salesTrend.dir === 'up'" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 15 12 9 18 15" /></svg>
                <svg v-else-if="salesTrend.dir === 'down'" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                {{ salesTrend.label }}
              </span>
            </div>
            <div class="card-foot">{{ totals.units }} unidade(s) · {{ totals.distinct_skus }} SKU(s)</div>
            <div v-if="salesTrend" class="card-foot muted">
              Período anterior: {{ stats.previousTotals.orders }} pedido(s)
            </div>
          </div>

          <div class="card" :class="{ skeleton: statsLoading }">
            <div class="card-icon">
              <span class="icon icon--amber">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /><path d="M5 17h-2v-11a1 1 0 0 1 1 -1h9v12m-4 0h6m4 0h2v-6h-8m0 -5h5l3 5" /></svg>
              </span>
            </div>
            <div class="card-title">A Despachar</div>
            <div class="card-value">{{ totals.pending_orders }} <span class="unit">pedidos</span></div>
            <router-link to="/tabela-vendas" class="link-like">Ver na tabela de vendas</router-link>
          </div>

          <div class="card" :class="{ skeleton: statsLoading }">
            <div class="card-icon">
              <span class="icon icon--emerald">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              </span>
            </div>
            <div class="card-title">Pedidos válidos</div>
            <div class="card-value">{{ totals.valid_orders }} <span class="unit">pedidos</span></div>
            <div class="card-foot muted">Exclui pedidos cancelados no período</div>
          </div>

          <div class="card" :class="{ skeleton: statsLoading }">
            <div class="card-icon">
              <span class="icon icon--rose">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
              </span>
            </div>
            <div class="card-title">Pedidos cancelados</div>
            <div class="card-value">{{ totals.cancelled_orders }} <span class="unit">pedidos</span></div>
            <div class="card-foot muted">Cancelamentos identificados no período</div>
          </div>
        </div>

        <!-- Indicadores derivados do mesmo período -->
        <div class="grid grid-3" ref="miniRow">
          <div class="card card--mini" :class="{ skeleton: statsLoading }">
            <span class="icon icon--emerald sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </span>
            <div>
              <div class="card-value card-value--sm">{{ totals.processed_orders }}</div>
              <div class="card-title plain">Processadas (estoque abatido)</div>
            </div>
          </div>
          <div class="card card--mini" :class="{ skeleton: statsLoading }">
            <span class="icon icon--blue sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>
            </span>
            <div>
              <div class="card-value card-value--sm">{{ mediaDiaria }}</div>
              <div class="card-title plain">Média de pedidos por dia</div>
            </div>
          </div>
          <div class="card card--mini card--derived" :class="{ skeleton: statsLoading }">
            <span class="icon icon--blue sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7 12 3l8 4-8 4-8-4Z"/><path d="m4 12 8 4 8-4M4 17l8 4 8-4"/></svg>
            </span>
            <div>
              <div class="card-value card-value--sm">{{ unidadesPorPedido }}</div>
              <div class="card-title plain">Unidades por pedido</div>
            </div>
          </div>
        </div>

        <div class="section-heading section-heading--snapshot">
          <div>
            <h2>Situação atual</h2>
            <p>Snapshots de armazenamento e cobrança; estes valores não seguem os filtros do período.</p>
          </div>
        </div>

        <div class="grid grid-2 current-grid">
          <div class="card" :class="{ skeleton: storageLoading }">
            <div class="card-icon">
              <span class="icon icon--sky">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 4.5l0 9l-8 4.5l-8 -4.5l0 -9l8 -4.5" /><path d="M12 12l8 -4.5" /><path d="M12 12l0 9" /><path d="M12 12l-8 -4.5" /></svg>
              </span>
            </div>
            <div class="card-title">Armazenamento atual</div>
            <div class="card-value" :class="{ 'card-value--unavailable': storageUnavailable }">
              {{ volumeConsumidoFmt }} <span v-if="!storageUnavailable" class="unit">m³</span>
            </div>
            <div v-if="!storageUnavailable" class="card-foot muted">
              Contratado: {{ volumeContratadoFmt }} m³
              <span v-if="ocupacaoPct !== null"> · {{ ocupacaoPct }}% usado</span>
            </div>
            <div v-else class="card-foot is-error">Não foi possível consultar o armazenamento.</div>
            <div v-if="!storageUnavailable && ocupacaoPct !== null" class="mini-bar">
              <span class="mini-bar__fill" :class="ocupacaoTone" :style="{ width: Math.min(ocupacaoPct, 100) + '%' }"></span>
            </div>
          </div>

          <div class="card" :class="{ skeleton: storageLoading }">
            <div class="card-icon">
              <span class="icon icon--emerald">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
              </span>
            </div>
            <div class="card-title">Fatura atual</div>
            <div class="card-value card-value--sm" :class="{ 'card-value--unavailable': billingUnavailable }">{{ faturaTotalFmt }}</div>
            <div v-if="billingUnavailable" class="card-foot is-error">Não foi possível consultar a cobrança.</div>
            <router-link v-else to="/resumo-cobranca" class="link-like">Ver resumo de cobrança</router-link>
          </div>
        </div>

        <!-- Gráficos do período -->
        <div class="grid grid-2" ref="chartsRow">
          <div class="card chart-card" :class="{ skeleton: statsLoading }">
            <div class="card-title plain">Pedidos por dia</div>
            <VueApexCharts v-if="byDay.length" type="area" height="260" :options="dailyChartOptions" :series="dailySeries" />
            <p v-else class="chart-empty">Sem vendas no período selecionado.</p>
          </div>

          <div class="card chart-card" :class="{ skeleton: statsLoading }">
            <div class="card-title plain">Pedidos por status de expedição</div>
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

            <div v-if="storageUnavailable && !storageLoading" class="empty">Dados de estoque indisponíveis no momento.</div>
            <div v-else-if="!skus.length && !storageLoading" class="empty">Nenhum produto cadastrado.</div>
          </div>
        </div>
      </div> <!-- /dashboard-content -->
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, onActivated, computed, watch } from 'vue'
import SidebarComponent from '../components/SidebarComponent.vue'
import TopbarComponent from '../components/TopbarComponent.vue'
import VueApexCharts from 'vue3-apexcharts'
import { gsap } from 'gsap'

import { useAuth } from '@/composables/useAuth'
import { useUserStorage } from '@/composables/useUserStorage'
import { useDashboardStats } from '@/composables/useDashboardStats'
import { useSalesFilterFacets } from '@/composables/useSalesFilterFacets'

/* -------------------- Estado / dados -------------------- */
const { user, isAuthReady, mlAccounts, shopeeAccounts } = useAuth()

const MK_LOGOS = { ML: '/img/ml-logo.svg', Shopee: '/img/shopee-logo.svg' }

const periodOptions = [
  { value: 'all', label: 'Todas' },
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: 'month', label: 'Este mês' },
  { value: '90d', label: 'Últimos 90 dias' },
]
// Data da venda começa sem recorte para não brigar com o prazo de envio: um
// pedido vendido semana passada pode ter despacho hoje e precisa aparecer.
const period = ref('all')

// Prazo de ENVIO é a janela operacional (o que precisa sair da casa). Começa em
// "Hoje", que é a fila com que o cliente abre o dia.
const shipPeriodOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'overdue', label: 'Atrasados' },
  { value: 'today', label: 'Hoje' },
  { value: 'tomorrow', label: 'Amanhã' },
  { value: '7d', label: 'Próximos 7 dias' },
]
const shipPeriod = ref('today')
const selectedMarketplaces = ref([])
const selectedAccounts = ref([])
const selectedStatuses = ref([])
const selectedModes = ref([])
// Combinações operacionais: uma opção por grupo, sempre com "Todos" (vazio).
const selectedQueue = ref('')
const selectedProcessed = ref('')
const selectedSkuMapped = ref('')

const queueOptions = [
  { value: 'pending', label: 'A despachar' },
  { value: 'valid', label: 'Não cancelados' },
  { value: 'cancelled', label: 'Cancelados' },
]
const processedOptions = [
  { value: 'yes', label: 'Estoque abatido' },
  { value: 'no', label: 'Sem abatimento' },
]
const skuMappedOptions = [
  { value: 'yes', label: 'SKU cadastrado' },
  { value: 'no', label: 'SKU ausente' },
]

function toggleIn(list, value) {
  const i = list.indexOf(value)
  if (i === -1) list.push(value); else list.splice(i, 1)
}

/** Grupos de opção única alternam entre o valor e "Todos". */
function toggleSingle(current, value) {
  return current === value ? '' : value
}

const {
  stats,
  isLoading: statsLoading,
  error: statsError,
  fetchStats,
  cancelStats,
} = useDashboardStats()

const totals = computed(() => stats.value.totals)
const byStatus = computed(() => stats.value.byStatus)
const byDay = computed(() => stats.value.byDay)
const byMarketplace = computed(() => stats.value.byMarketplace)
const byShippingMode = computed(() => stats.value.byShippingMode)
const topSkus = computed(() => stats.value.topSkus)

// As opções de filtro vêm do backend já cruzadas entre si: cada lista aplica
// os outros filtros ativos e ignora apenas a própria. É o que faz as
// modalidades do Mercado Livre desaparecerem quando só há conta Shopee
// selecionada, em vez de oferecer uma combinação que retorna lista vazia.
const { facets, fetchFacets, cancelFacets, pruneSelection } = useSalesFilterFacets()

const marketplaceFacets = computed(() => facets.value.marketplaces)
const accountFacets = computed(() => facets.value.accounts)
const statusFacets = computed(() => facets.value.shippingStatuses)
const modeFacets = computed(() => facets.value.shippingModes)

/* Opções do filtro de modalidade de envio.
 *
 * A faceta é a fonte preferida: vem cruzada com os outros filtros ativos e traz
 * a contagem. Mas o bloco ficava atrás de `v-if="modeFacets.length"`, então
 * qualquer falha na chamada de facetas apagava o filtro da tela inteira.
 *
 * Sem faceta, caímos nas modalidades presentes nas próprias métricas do período
 * (`byShippingMode`) — sem contagem cruzada, mas com o filtro visível e usável. A
 * união com o que está selecionado evita ficar preso num chip que saiu da lista. */
const modeOptions = computed(() => {
  const options = modeFacets.value.length
    ? modeFacets.value.map((m) => ({ value: m.value, label: m.label, count: m.count }))
    : byShippingMode.value.map((d) => ({ value: d.mode, label: d.mode, count: null }))

  const present = new Set(options.map((o) => o.value))
  for (const value of selectedModes.value) {
    if (!present.has(value)) options.push({ value, label: value, count: null })
  }
  return options
})

// Variação contra o período anterior de mesma duração (vem do backend).
const salesTrend = computed(() => {
  const prev = stats.value.previousTotals
  if (!prev) return null
  const before = prev.orders || 0
  const now = totals.value.orders || 0
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
  error: storageError,
  loadStorageData,
  calcularVolumePorSku
} = useUserStorage(userId, null, { withMovements: false, withPackageTypes: false })

const storageLoading = computed(() => storageLoadingRaw.value || billingSummary.value.isLoading)
const storageUnavailable = computed(() => Boolean(storageError.value))
const billingUnavailable = computed(() => Boolean(billingSummary.value?.error))

const volumeConsumidoFmt = computed(() =>
  storageUnavailable.value ? 'Indisponível' : (volumeConsumido.value || 0).toFixed(2)
)
const volumeContratadoFmt = computed(() =>
  storageUnavailable.value ? 'Indisponível' : (volumeContratado.value || 0).toFixed(2)
)
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
  if (billingUnavailable.value) return 'Indisponível'
  const total = billingSummary.value?.data?.totalCost
  if (total === null || total === undefined) return '—'
  return Number(total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
})

// Contas conectadas servem de rótulo/logo; quem define quais aparecem é a
// faceta, que só lista contas com venda no recorte atual.
const accountLabels = computed(() => {
  const map = new Map()
  for (const account of mlAccounts.value || []) {
    map.set(`ML:${account.user_id}`, account.nickname || String(account.user_id))
  }
  for (const account of shopeeAccounts.value || []) {
    map.set(`Shopee:${account.shop_id}`, account.shop_name || String(account.shop_id))
  }
  return map
})

const allAccounts = computed(() =>
  accountFacets.value.map((facet) => ({
    value: facet.value,
    label: accountLabels.value.get(facet.value) || facet.label || facet.value,
    logo: MK_LOGOS[facet.marketplace] || MK_LOGOS.ML,
    count: facet.count,
  }))
)

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
  if (period.value === 'all') return { from: '', to: '' }
  if (period.value === 'today') return { from: to, to }
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

/** Janela do prazo de envio (independente da data da venda). */
const shipRange = computed(() => {
  const now = new Date()
  const hoje = toIso(now)
  if (shipPeriod.value === 'all') return { from: '', to: '' }
  if (shipPeriod.value === 'today') return { from: hoje, to: hoje }
  if (shipPeriod.value === 'tomorrow') {
    const d = new Date(now); d.setDate(d.getDate() + 1)
    return { from: toIso(d), to: toIso(d) }
  }
  if (shipPeriod.value === '7d') {
    const d = new Date(now); d.setDate(d.getDate() + 6)
    return { from: hoje, to: toIso(d) }
  }
  // Atrasados: tudo com prazo até ontem. Sem limite inferior, porque atraso
  // antigo continua sendo atraso.
  const ontem = new Date(now); ontem.setDate(ontem.getDate() - 1)
  return { from: '', to: toIso(ontem) }
})

const periodLabel = computed(() => {
  const { from, to } = dateRange.value
  if (!from && !to) return 'Todas as vendas'
  return `${from} — ${to}`
})

const shipLabel = computed(() => {
  const option = shipPeriodOptions.find((o) => o.value === shipPeriod.value)
  if (shipPeriod.value === 'all') return 'Qualquer prazo'
  return option?.label ?? shipPeriod.value
})

const diasNoPeriodo = computed(() => {
  const { from, to } = dateRange.value
  // Sem recorte de data da venda, a média por dia usa os dias realmente
  // presentes nos dados, senão dividiríamos por um intervalo inexistente.
  if (!from || !to) return Math.max(1, byDay.value.length)
  const ms = new Date(`${to}T00:00:00`) - new Date(`${from}T00:00:00`)
  return Math.max(1, Math.round(ms / 86400000) + 1)
})
const mediaDiaria = computed(() => {
  const media = (totals.value.orders || 0) / diasNoPeriodo.value
  return media >= 10 ? Math.round(media) : media.toFixed(1).replace('.', ',')
})
const unidadesPorPedido = computed(() => {
  const pedidos = totals.value.orders || 0
  if (!pedidos) return '0,00'
  return ((totals.value.units || 0) / pedidos).toFixed(2).replace('.', ',')
})
// Modalidade saiu dos avançados e virou filtro principal, então não conta aqui.
const advancedFilterCount = computed(() =>
  selectedAccounts.value.length +
  selectedStatuses.value.length +
  (selectedQueue.value ? 1 : 0) +
  (selectedProcessed.value ? 1 : 0) +
  (selectedSkuMapped.value ? 1 : 0)
)

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
  period.value !== 'all' ||
  shipPeriod.value !== 'today' ||
  selectedMarketplaces.value.length > 0 ||
  selectedAccounts.value.length > 0 ||
  selectedStatuses.value.length > 0 ||
  selectedModes.value.length > 0 ||
  Boolean(selectedQueue.value) ||
  Boolean(selectedProcessed.value) ||
  Boolean(selectedSkuMapped.value)
)

function clearFilters() {
  // Volta ao estado com que a tela abre, não a "sem filtro nenhum": o padrão
  // operacional é o prazo de envio de hoje.
  period.value = 'all'
  shipPeriod.value = 'today'
  selectedMarketplaces.value = []
  selectedAccounts.value = []
  selectedStatuses.value = []
  selectedModes.value = []
  selectedQueue.value = ''
  selectedProcessed.value = ''
  selectedSkuMapped.value = ''
}

/** Filtros atuais no formato aceito pelo backend. */
function currentFilterParams() {
  const { from, to } = dateRange.value
  const ship = shipRange.value
  return {
    from,
    to,
    shipFrom: ship.from,
    shipTo: ship.to,
    marketplace: selectedMarketplaces.value,
    account: selectedAccounts.value,
    shippingStatus: selectedStatuses.value,
    shippingMode: selectedModes.value,
    queue: selectedQueue.value,
    processed: selectedProcessed.value,
    skuMapped: selectedSkuMapped.value,
  }
}

function reloadStats() {
  const params = currentFilterParams()
  // Métricas e opções andam juntas: as opções precisam refletir o mesmo
  // recorte que gerou os números na tela.
  return Promise.all([fetchStats(params), fetchFacets(params)])
}

async function reload() {
  await Promise.all([reloadStats(), loadStorageData()])
}

// Se um valor selecionado deixa de existir nas opções (ex.: modalidade só do
// ML depois de escolher uma loja Shopee), ele é descartado em vez de manter a
// tela num filtro impossível. A comparação por tamanho impede laço infinito.
watch(accountFacets, (options) => {
  const kept = pruneSelection(selectedAccounts.value, options)
  if (kept !== selectedAccounts.value) selectedAccounts.value = kept
})
watch(statusFacets, (options) => {
  const kept = pruneSelection(selectedStatuses.value, options)
  if (kept !== selectedStatuses.value) selectedStatuses.value = kept
})
watch(modeFacets, (options) => {
  const kept = pruneSelection(selectedModes.value, options)
  if (kept !== selectedModes.value) selectedModes.value = kept
})

/* -------------------- Helpers -------------------- */
const calcVol = (p) => calcularVolumePorSku(p)

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
function dayLabel(iso) {
  const [, m, d] = String(iso).split('-')
  return `${d} ${MONTHS[Number(m) - 1]}`
}

const BASE_CHART = {
  chart: { toolbar: { show: false }, fontFamily: 'inherit', foreColor: '#64748b' },
  tooltip: { theme: 'light' },
  dataLabels: { enabled: false },
  grid: { borderColor: '#e2e8f0', strokeDashArray: 4 },
}

/* -------------------- Gráficos -------------------- */
const dailySeries = computed(() => [{ name: 'Pedidos', data: byDay.value.map((d) => d.value) }])
const dailyChartOptions = computed(() => ({
  ...BASE_CHART,
  chart: { ...BASE_CHART.chart, type: 'area' },
  colors: ['#2563eb'],
  stroke: { curve: 'smooth', width: 2.5 },
  fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05, stops: [0, 100] } },
  xaxis: {
    categories: byDay.value.map((d) => dayLabel(d.day)),
    labels: { rotate: -45, hideOverlappingLabels: true, style: { fontSize: '11px' } },
    tooltip: { enabled: false },
  },
  yaxis: { labels: { formatter: (v) => Math.trunc(v) } },
}))

const statusSeries = computed(() => [{ name: 'Pedidos', data: byStatus.value.map((d) => d.value) }])
const statusChartOptions = computed(() => ({
  ...BASE_CHART,
  chart: { ...BASE_CHART.chart, type: 'bar' },
  colors: ['#1d4ed8'],
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

const shippingSeries = computed(() => [{ name: 'Pedidos', data: byShippingMode.value.map((d) => d.value) }])
const shippingChartOptions = computed(() => ({
  ...BASE_CHART,
  chart: { ...BASE_CHART.chart, type: 'bar' },
  colors: ['#2563eb'],
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
// Agrupa mudanças rápidas de chips antes de consultar novamente o backend.
let filtersDebounceTimer = null
watch(
  [
    period, shipPeriod, selectedMarketplaces, selectedAccounts, selectedStatuses, selectedModes,
    selectedQueue, selectedProcessed, selectedSkuMapped,
  ],
  () => {
    if (filtersDebounceTimer) clearTimeout(filtersDebounceTimer)
    filtersDebounceTimer = setTimeout(() => {
      filtersDebounceTimer = null
      reloadStats()
    }, 220)
  },
  { deep: true }
)

onMounted(async () => {
  if (isAuthReady.value && user.value) reload()
  watch(isAuthReady, (ready) => { if (ready && user.value) reload() })
  runEnterAnimations()
})

/* A tela fica em memória (keep-alive em App.vue), então voltar ao painel não
 * dispara onMounted: os cards continuavam mostrando os números da última
 * visita como se fossem atuais. A primeira ativação é ignorada porque acontece
 * junto com o onMounted, que já buscou os dados.
 *
 * O custo é baixo: /dashboard-stats e /filter-facets respondem do cache do
 * servidor dentro da janela de 60s. */
let dashboardActivated = false
onActivated(() => {
  if (!dashboardActivated) {
    dashboardActivated = true
    return
  }
  if (isAuthReady.value && user.value) reload()
})

onUnmounted(() => {
  if (filtersDebounceTimer) clearTimeout(filtersDebounceTimer)
  cancelStats()
  cancelFacets()
  if (gsapCtx) gsapCtx.revert()
})
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
.chip:hover { border-color: #93c5fd; background: #f8fafc; }
.chip.is-active { border-color: #2563eb; background: #eff6ff; color: #1d4ed8; }
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

.section-heading {
  display: flex; align-items: flex-end; justify-content: space-between;
  gap: 1rem; margin: 0 0 0.8rem;
}
.section-heading--snapshot { margin-top: 0.35rem; }
.section-heading h2 { margin: 0; font-size: 1rem; font-weight: 750; color: #0f172a; }
.section-heading p { margin: 0.2rem 0 0; font-size: 0.78rem; color: #64748b; }
.data-error {
  margin: 0 0 1rem; padding: 0.75rem 0.9rem; border: 1px solid #fecaca;
  border-radius: 0.65rem; background: #fef2f2; color: #b91c1c;
  font-size: 0.82rem; font-weight: 600;
}
.card-value--unavailable { font-size: 1.05rem !important; letter-spacing: 0 !important; color: #b91c1c !important; }
.card-foot.is-error { color: #b91c1c; }
.current-grid .card { min-height: 150px; }

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
.icon--blue { background: #eff6ff; color: #2563eb; }
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
  background: none; border: none; color: #2563eb;
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

/* Redesign denso — identidade visual azul */
.dashboard-wrapper {
  --dash-blue: #2563eb;
  --dash-blue-dark: #1d4ed8;
  --dash-blue-soft: #eff6ff;
  --dash-border: #dbe3ef;
  --dash-muted: #64748b;
  background: #f8fafc;
  font-family: var(--font-sans);
}
.dashboard-wrapper button,
.dashboard-wrapper summary { font-family: var(--font-sans); }
/* border-box é obrigatório aqui: o reset global do projeto zera margin/padding
   mas não troca o box model. Com content-box, `width: 100%` somava os 3rem de
   padding lateral e empurrava a página 48px além da viewport, criando scroll
   horizontal. max-width/margin alinham o Dashboard às outras telas. */
.dashboard-content {
  width: 100%; max-width: 1640px; margin: 0 auto;
  padding: 1.25rem 1.5rem 2rem; box-sizing: border-box;
}
.toolbar { align-items: center; margin-bottom: 1rem; }
.toolbar-title { font-size: 1.8rem; font-weight: 800; letter-spacing: -0.035em; color: #0f172a; }
.toolbar-desc { margin: 0.2rem 0 0; color: var(--dash-muted); }
.btn-refresh {
  height: 36px; border-color: #bfdbfe; border-radius: 8px;
  color: var(--dash-blue-dark); background: #fff;
}
.btn-refresh:hover:not(:disabled) { border-color: var(--dash-blue); background: var(--dash-blue-soft); box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08); }

.filters {
  display: block; padding: 0; margin-bottom: 1rem; overflow: hidden;
  border: 1px solid var(--dash-border); border-radius: 12px; background: #fff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}
/* Com dois grupos de data + canal a linha não cabe mais na largura útil, e o
   `overflow-x: auto` de antes virava uma barra de rolagem horizontal atravessada
   no meio dos filtros. Agora os grupos quebram para a linha de baixo. */
.filters-primary {
  display: flex; align-items: center; flex-wrap: wrap; gap: 0.55rem 1.1rem;
  min-width: 0; padding: 0.7rem 0.85rem; overflow: visible;
}
.filter-block { display: flex; align-items: center; flex-wrap: wrap; gap: 0.55rem; min-width: 0; }
.filter-label {
  min-width: 0; color: #475569; font-size: 0.68rem; font-weight: 800;
  letter-spacing: 0.055em; white-space: nowrap;
}
.filter-label svg { color: var(--dash-blue); }
.chip-row { flex-wrap: wrap; gap: 0.3rem; }
.chip {
  min-height: 30px; padding: 0.32rem 0.62rem; border-color: #dbe3ef;
  border-radius: 7px; color: #475569; font-size: 0.75rem; white-space: nowrap;
}
.chip:hover { border-color: #93c5fd; background: #f8fbff; color: var(--dash-blue-dark); }
.chip.is-active { border-color: #93c5fd; background: var(--dash-blue-soft); color: var(--dash-blue-dark); box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.05); }
.chip__logo { width: 16px; height: 16px; }
.chip__count {
  min-width: 18px; padding: 1px 5px; border-radius: 999px;
  background: #e2e8f0; color: #475569; font-size: 0.62rem; font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.chip.is-active .chip__count { background: #bfdbfe; color: #1d4ed8; }
/* Mostra que o filtro existe mesmo sem opção para oferecer, em vez de
   desaparecer e dar a impressão de que não foi feito. */
.filter-empty { font-size: 0.78rem; color: #94a3b8; font-style: italic; }
/* O resumo do intervalo vai para a linha inteira de baixo: disputando espaço na
   mesma linha dos chips, era ele que estourava a largura. */
.filters-range {
  display: flex; align-items: center; gap: 0.85rem; flex-wrap: wrap;
  width: 100%; margin-left: 0; padding-top: 0.5rem;
  border-top: 1px dashed #e2e8f0; color: #475569;
  font-size: 0.72rem; font-weight: 650; font-variant-numeric: tabular-nums;
}
.filters-range svg { color: var(--dash-blue); }
.filters-range__item { display: inline-flex; align-items: center; gap: 0.35rem; }
.chip--danger.is-active { border-color: #fca5a5; background: #fef2f2; color: #b91c1c; }
.filters-advanced { border-top: 1px solid #e2e8f0; }
.filters-advanced > summary {
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  min-height: 36px; padding: 0 0.85rem; color: #475569; cursor: pointer;
  font-size: 0.75rem; font-weight: 700; list-style: none; user-select: none;
}
.filters-advanced > summary::-webkit-details-marker { display: none; }
.filters-advanced > summary:hover { background: #f8fbff; color: var(--dash-blue-dark); }
.advanced-title { display: inline-flex; align-items: center; gap: 0.45rem; }
.advanced-title > svg { color: var(--dash-blue); }
.filter-count {
  display: grid; place-items: center; min-width: 19px; height: 19px; padding: 0 5px;
  border-radius: 999px; background: var(--dash-blue); color: #fff; font-size: 0.65rem;
}
.advanced-chevron { transition: transform 180ms ease; }
.filters-advanced[open] .advanced-chevron { transform: rotate(180deg); }
.filters-advanced__body {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.75rem 1.25rem;
  padding: 0.8rem 0.85rem; border-top: 1px solid #eef2f7; background: #fbfdff;
}
.filters-advanced__body .filter-block { align-items: flex-start; flex-direction: column; min-width: 0; gap: 0.45rem; }
.filters-advanced__body .chip-row { flex-wrap: wrap; }
.operational-filter-grid {
  grid-column: 1 / -1; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem 1.25rem; padding-top: 0.75rem; border-top: 1px solid #e2e8f0;
}
.operational-filter-grid .filter-block { min-width: 0; }
.filters-foot {
  grid-column: 1 / -1; padding-top: 0.7rem; border-top-color: #dbe3ef;
  color: var(--dash-muted); font-size: 0.72rem;
}
.chip--clear { color: #b91c1c; }
.chip--clear:hover { border-color: #fca5a5; color: #b91c1c; background: #fef2f2; }

.grid { gap: 0.8rem; margin-bottom: 0.9rem; }
.grid-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.card {
  border-color: var(--dash-border); border-radius: 12px; padding: 1rem;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.045), 0 8px 24px rgba(15, 23, 42, 0.025);
}
.grid-4 > .card { position: relative; min-height: 168px; padding: 1.05rem; }
.card--featured { border-color: #bfdbfe; background: linear-gradient(145deg, #fff 35%, var(--dash-blue-soft)); }
.card--featured::before {
  content: ''; position: absolute; inset: 0 auto 0 0; width: 3px;
  border-radius: 12px 0 0 12px; background: var(--dash-blue);
}
.card-icon { margin-bottom: 0.65rem; }
.icon { width: 36px; height: 36px; border-radius: 9px; }
.icon--blue, .icon--sky { color: var(--dash-blue); background: var(--dash-blue-soft); }
.card-title { color: var(--dash-muted); font-size: 0.74rem; font-weight: 700; letter-spacing: 0.01em; }
.grid-4 .card-value {
  margin-top: 0.3rem; color: #0f172a; font-size: clamp(1.65rem, 2.25vw, 2.2rem);
  font-weight: 800; letter-spacing: -0.04em;
}
.grid-4 .card-value--sm { font-size: clamp(1.35rem, 1.8vw, 1.8rem); }
.unit { font-size: 0.72rem; letter-spacing: 0; color: #94a3b8; }
.card-foot { color: #64748b; }
.card-foot.muted { color: #94a3b8; }
.link-like { color: var(--dash-blue-dark); font-weight: 700; }
.trend { letter-spacing: 0; }

.card--mini { min-width: 0; min-height: 76px; padding: 0.8rem; gap: 0.7rem; }
.card--mini .icon { width: 32px; height: 32px; }
.card--mini .card-value--sm { margin-top: 0; font-size: 1.35rem; font-weight: 800; letter-spacing: -0.025em; }
.card--mini .card-title.plain { margin-top: 0.12rem; font-size: 0.7rem; line-height: 1.25; }
.card--derived { border-color: #bfdbfe; background: #fbfdff; }

.chart-card { min-height: 320px; padding: 1rem 1rem 0.65rem; }
.card-title.plain { margin-bottom: 0.65rem; color: #0f172a; font-size: 0.88rem; font-weight: 800; }
.chart-card .card-title.plain { display: flex; align-items: center; gap: 0.45rem; }
.chart-card .card-title.plain::before { content: ''; width: 3px; height: 14px; border-radius: 3px; background: var(--dash-blue); }
.chart-card :deep(.apexcharts-canvas),
.chart-card :deep(.apexcharts-text) { font-family: var(--font-sans) !important; }

.table { overflow-x: auto; color: #334155; }
.thead, .trow { min-width: 720px; }
.table--top .thead, .table--top .trow { min-width: 560px; }
.thead { color: #64748b; border-bottom-color: #cbd5e1; }
.trow { border-bottom-color: #eef2f7; }
.trow:hover { background: #f8fbff; }
.strong { color: var(--dash-blue-dark); }
.mono { color: #334155; }

@media (max-width: 1280px) {
  .grid-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .grid-4 > .card { min-height: 150px; }
}
@media (max-width: 900px) {
  .dashboard-content { padding: 1rem; }
  .filters-primary { align-items: flex-start; }
  .filters-advanced__body, .operational-filter-grid { grid-template-columns: 1fr; }
  .grid-3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 680px) {
  .toolbar { align-items: flex-start; }
  .toolbar-text { width: calc(100% - 110px); }
  .toolbar-title { font-size: 1.5rem; }
  .toolbar-desc { font-size: 0.78rem; line-height: 1.35; }
  .filter-block--period, .filters-primary > .filter-block { width: 100%; align-items: flex-start; flex-direction: column; }
  /* Também sem rolagem lateral no celular: os chips quebram linha. */
  .filters-primary .chip-row { width: 100%; flex-wrap: wrap; }
  .grid-4, .grid-3, .grid-2 { grid-template-columns: 1fr; }
  .grid-4 > .card { min-height: 0; }
  .chart-card { min-height: 300px; }
  .thead, .trow { grid-template-columns: 1.1fr 2.4fr 1.4fr 1fr 1fr; }
  .thead > :nth-child(n+4), .trow > :nth-child(n+4) { display: block; }
}
</style>
