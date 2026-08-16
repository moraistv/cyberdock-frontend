<template>
  <div class="dashboard-wrapper">
    <SidebarComponent />
    <div class="main-content">
      <TopbarComponent />
      <div class="dashboard-content">

        <!-- Cabeçalho -->
        <div class="header">
          <div>
            <h1 class="dashboard-title">Separação de Itens</h1>
            <p class="dashboard-subtitle">Gerencie e acompanhe os itens separados para despacho.</p>
          </div>
          <div class="header-buttons">
            <button class="btn btn-secondary" :disabled="isLoading || isExporting" @click="exportCsv" title="Exportar em CSV">
              <svg v-if="isExporting" class="spin" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              Exportar
            </button>
            <button class="btn btn-primary" :disabled="isLoading || isPrinting" @click="imprimirPdf" title="Gerar relatório para impressão/PDF">
              <svg v-if="isPrinting" class="spin" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
              Imprimir PDF
            </button>
          </div>
        </div>

        <!-- Filtros: só o essencial da fila fica à vista. O resto vai para
             "Filtros avançados", igual ao padrão da tabela de vendas. -->
        <div class="filters-card">
          <div class="filters-bar">
            <div class="filters-bar__group">
              <span class="filters-bar__label">Prazo</span>
              <div class="preset-chips">
                <button class="chip-danger" :class="{ active: activePrazoPreset === 'atrasados' }" @click="setPrazoPeriodo('atrasados')">Atrasados</button>
                <button :class="{ active: activePrazoPreset === 'hoje' }" @click="setPrazoPeriodo('hoje')">Hoje</button>
                <button :class="{ active: activePrazoPreset === 'amanha' }" @click="setPrazoPeriodo('amanha')">Amanhã</button>
                <button :class="{ active: activePrazoPreset === '7dias' }" @click="setPrazoPeriodo('7dias')">7 dias</button>
              </div>
            </div>

            <div class="filters-bar__group">
              <span class="filters-bar__label">Situação</span>
              <select class="filters-bar__select" v-model="filters.despacho" @change="aplicarFiltros">
                <option value="nao">A despachar</option>
                <option value="sim">Já despachados</option>
                <option value="todos">Todos</option>
              </select>
            </div>

            <div class="filters-bar__group">
              <span class="filters-bar__label">Canal</span>
              <select class="filters-bar__select" v-model="filters.marketplace" @change="aplicarFiltros">
                <option value="">Todos</option>
                <option value="ML">Mercado Livre</option>
                <option value="Shopee">Shopee</option>
              </select>
            </div>

            <button class="adv-toggle" :class="{ 'is-active': advancedCount > 0 }"
                    @click="showAdvanced = !showAdvanced">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></svg>
              Filtros avançados
              <span v-if="advancedCount > 0" class="adv-toggle__count">{{ advancedCount }}</span>
              <svg class="adv-toggle__chev" :class="{ 'is-open': showAdvanced }" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
            </button>

            <button v-if="hasAnyFilter" class="btn-link btn-link--inline" @click="limparFiltros">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              Limpar
            </button>
          </div>

          <div v-if="showAdvanced" class="filters-advanced">
            <div class="filters-dates">
              <div class="filter-block">
                <label class="filter-label">Período da Venda</label>
                <div class="date-range">
                  <input type="date" v-model="filters.saleDateStart" @change="activeVendaPreset = null" />
                  <span>até</span>
                  <input type="date" v-model="filters.saleDateEnd" @change="activeVendaPreset = null" />
                </div>
                <div class="preset-chips">
                  <button :class="{ active: activeVendaPreset === 'hoje' }" @click="setVendaPeriodo('hoje')">Hoje</button>
                  <button :class="{ active: activeVendaPreset === '7dias' }" @click="setVendaPeriodo('7dias')">7 dias</button>
                  <button :class="{ active: activeVendaPreset === '30dias' }" @click="setVendaPeriodo('30dias')">30 dias</button>
                  <button :class="{ active: activeVendaPreset === 'mes' }" @click="setVendaPeriodo('mes')">Este mês</button>
                </div>
              </div>

              <div class="filter-block">
                <label class="filter-label">Prazo para Despachar</label>
                <div class="date-range">
                  <input type="date" v-model="filters.shippingLimitStart" @change="activePrazoPreset = null" />
                  <span>até</span>
                  <input type="date" v-model="filters.shippingLimitEnd" @change="activePrazoPreset = null" />
                </div>
              </div>
            </div>

            <div class="filters-selects">
              <div class="filter-block">
                <label class="filter-label">Modalidade de Envio</label>
                <select v-model="filters.shippingMode">
                  <option value="">Todas</option>
                  <option v-for="m in modeOptions" :key="m" :value="m">{{ m }}</option>
                </select>
              </div>
              <div class="filter-block">
                <label class="filter-label">Conta</label>
                <select v-model="filters.account">
                  <option value="">Todas as contas</option>
                  <option v-for="acc in accountOptions" :key="acc" :value="acc">{{ acc }}</option>
                </select>
              </div>
              <div class="filter-block">
                <label class="filter-label">Usuário</label>
                <select v-model="filters.userNickname">
                  <option value="">Todos os usuários</option>
                  <option v-for="usr in userOptions" :key="usr" :value="usr">{{ usr }}</option>
                </select>
              </div>
            </div>

            <div class="filters-actions">
              <button class="btn-link" @click="limparFiltros">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                Limpar filtros
              </button>
              <button class="btn btn-primary" @click="aplicarFiltros" :disabled="isLoading">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                Aplicar filtros
              </button>
            </div>
          </div>
        </div>

        <!-- Cards de resumo -->
        <div class="summary-cards">
          <div class="s-card">
            <div class="s-card__icon s-card__icon--blue">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            </div>
            <div class="s-card__body">
              <span class="s-card__label">Pacotes</span>
              <span class="s-card__value">{{ summary.totalPacotes }}</span>
              <span class="s-card__hint">a montar</span>
            </div>
          </div>

          <div class="s-card">
            <div class="s-card__icon s-card__icon--green">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </div>
            <div class="s-card__body">
              <span class="s-card__label">Itens</span>
              <span class="s-card__value">{{ summary.totalItens }}</span>
              <span class="s-card__hint">linhas de SKU</span>
            </div>
          </div>

          <div class="s-card">
            <div class="s-card__icon s-card__icon--orange">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
            </div>
            <div class="s-card__body">
              <span class="s-card__label">Unidades</span>
              <span class="s-card__value">{{ summary.totalUnidades }}</span>
              <span class="s-card__hint">total físico</span>
            </div>
          </div>

          <div class="s-card">
            <div class="s-card__icon s-card__icon--red">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            </div>
            <div class="s-card__body">
              <span class="s-card__label">Atrasados</span>
              <span class="s-card__value" :class="{ 'value-danger': summary.atrasados > 0 }">{{ summary.atrasados }}</span>
              <span class="s-card__hint">prazo já vencido</span>
            </div>
          </div>

          <div class="s-card">
            <div class="s-card__icon s-card__icon--orange">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M12 14v3" /><path d="M10.5 15.5h3" /></svg>
            </div>
            <div class="s-card__body">
              <span class="s-card__label">Despachar Hoje</span>
              <span class="s-card__value">{{ summary.despacharHoje }}</span>
              <span class="s-card__hint">com prazo para hoje</span>
            </div>
          </div>

          <div class="s-card s-card--modes">
            <span class="s-card__label">Por Modalidade de Envio</span>
            <div class="mode-mini-list">
              <div v-for="(count, mode) in summary.porModalidade" :key="mode" class="mode-mini">
                <span class="mode-mini__badge" :style="{ background: modeMeta(mode).bg, color: modeMeta(mode).color }">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="modeMeta(mode).icon"></svg>
                </span>
                <span class="mode-mini__info">
                  <span class="mode-mini__count">{{ count }}</span>
                  <span class="mode-mini__name">{{ modeMeta(mode).label }}</span>
                </span>
              </div>
              <div v-if="!hasModes" class="mode-mini__empty">—</div>
            </div>
          </div>

          <div class="s-card">
            <div class="s-card__icon s-card__icon--slate">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            </div>
            <div class="s-card__body">
              <span class="s-card__label">Usuários Ativos</span>
              <span class="s-card__value">{{ summary.usuariosAtivos }}</span>
              <span class="s-card__hint">no período</span>
            </div>
          </div>
        </div>

        <!-- Tabela -->
        <div class="table-card">
          <div class="table-toolbar">
            <span class="table-count">{{ total }} pacotes · {{ summary.totalItens }} itens · {{ summary.totalUnidades }} unidades</span>
            <div class="sort-control">
              <label>Ordenar por</label>
              <select v-model="filters.sort" @change="aplicarFiltros">
                <option value="prazo_asc">Prazo (mais próximo)</option>
                <option value="prazo_desc">Prazo (mais distante)</option>
                <option value="venda_desc">Venda (mais recente)</option>
                <option value="venda_asc">Venda (mais antiga)</option>
              </select>
            </div>
          </div>

          <div v-if="isLoading" class="table-state">Carregando itens...</div>
          <div v-else-if="error" class="table-state error">{{ error }}</div>
          <div v-else-if="items.length === 0" class="table-state">Nenhum item encontrado para os filtros selecionados.</div>

          <div v-else class="table-scroll">
            <table class="sep-table">
              <thead>
                <tr>
                  <th class="col-qtd">Qtd.</th>
                  <th class="col-produto">Produto</th>
                  <th class="col-conta">Conta / Cliente</th>
                  <th class="col-comprador">Comprador</th>
                  <th class="col-envio">Envio</th>
                  <th class="col-prazo">Despachar</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(group, groupIndex) in groupedItems" :key="group._groupKey">
                  <tr class="package-row">
                    <td colspan="6">
                      <div class="package-row__content">
                        <span class="package-number">Pacote {{ (page - 1) * limit + groupIndex + 1 }}</span>
                        <span class="package-id">{{ packageLabel(group) }}</span>
                        <span>{{ group._items.length }} {{ group._items.length === 1 ? 'item' : 'itens' }}</span>
                        <span>{{ group._totalQty }} {{ group._totalQty === 1 ? 'unidade' : 'unidades' }}</span>
                      </div>
                    </td>
                  </tr>
                  <tr
                    v-for="(item, itemIndex) in group._items"
                    :key="`${group._groupKey}-${item.id}-${item.sku}-${itemIndex}`"
                    class="package-item-row"
                  >
                    <td class="col-qtd">
                      <span class="qty-badge" :class="{ 'qty-badge--multi': Number(item.quantity) > 1 }">
                        {{ item.quantity }}
                      </span>
                    </td>

                    <td class="col-produto">
                      <div class="prod">
                        <span class="desc-origin" :class="temDescricaoInterna(item) ? 'desc-origin--cd' : 'desc-origin--ml'" :title="descricaoTitle(item)">
                          <svg v-if="temDescricaoInterna(item)" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                            <line x1="12" y1="22.08" x2="12" y2="12" />
                          </svg>
                          <img v-else :src="marketplaceLogo(item)" :alt="marketplaceLabel(item)" class="desc-origin__img" />
                        </span>
                        <div class="prod__body">
                          <div class="prod__desc" :title="descricaoProduto(item)">{{ descricaoProduto(item) }}</div>
                          <div class="prod__meta">
                            <img :src="marketplaceLogo(item)" :alt="marketplaceLabel(item)" :title="marketplaceLabel(item)" class="prod__mk-logo" />
                            <span class="chip chip--sku" :title="`SKU: ${item.sku || '—'}`">{{ item.sku || '—' }}</span>
                            <span v-if="variacao(item)" class="chip chip--var" :title="variacao(item)">{{ variacao(item) }}</span>
                            <span class="chip chip--status" :class="statusClass(item)">{{ statusLabel(item) }}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td v-if="itemIndex === 0" class="col-conta package-common" :rowspan="group._items.length">
                      <div class="cell-strong">{{ group.account_nickname || '—' }}</div>
                      <div class="cell-sub">{{ group.user_nickname || '—' }}</div>
                    </td>

                    <td v-if="itemIndex === 0" class="col-comprador package-common" :rowspan="group._items.length">
                      <div class="cell-strong">{{ customerName(group) }}</div>
                      <div class="cell-sub">{{ group.buyer_nickname || '—' }}</div>
                    </td>

                    <td v-if="itemIndex === 0" class="col-envio package-common" :rowspan="group._items.length">
                      <span class="mode-badge" :style="{ background: modeMeta(group.shipping_mode).bg, color: modeMeta(group.shipping_mode).color }">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="modeMeta(group.shipping_mode).icon"></svg>
                        {{ modeMeta(group.shipping_mode).label }}
                      </span>
                    </td>

                    <td v-if="itemIndex === 0" class="col-prazo package-common" :rowspan="group._items.length">
                      <div class="prazo" :class="{ 'prazo--late': isLate(prazoDate(group)) }">
                        {{ formatDate(prazoDate(group)) }}
                        <span class="prazo-rel-inline">{{ relativeDay(prazoDate(group)) }}</span>
                      </div>
                      <button
                        v-for="orderId in group._orderIds"
                        :key="orderId"
                        type="button"
                        class="id-copy"
                        :title="`Copiar ID da venda: ${orderId}`"
                        @click="copiarId(orderId)"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        <span>{{ orderId }}</span>
                        <span v-if="idCopiado === String(orderId)" class="id-copy__ok">copiado</span>
                      </button>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>

          <!-- Paginação -->
          <div v-if="!isLoading && items.length > 0" class="pagination">
            <div class="per-page">
              <label>Pacotes por página:</label>
              <select v-model.number="limit" @change="onLimitChange">
                <option :value="20">20</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
              </select>
            </div>
            <div class="pager">
              <!-- Setas em SVG: os glifos ‹ › mudam de tamanho e de alinhamento
                   conforme a fonte disponível no sistema. -->
              <button class="pg-btn pg-btn--icon" :disabled="page <= 1" title="Página anterior" @click="goTo(page - 1)">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              <button
                v-for="p in pagesToShow"
                :key="p"
                class="pg-btn"
                :class="{ 'pg-btn--active': p === page, 'pg-btn--dots': p === '...' }"
                :disabled="p === '...'"
                @click="p !== '...' && goTo(p)"
              >{{ p }}</button>
              <button class="pg-btn pg-btn--icon" :disabled="page >= totalPages" title="Próxima página" @click="goTo(page + 1)">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Relatório para impressão (visível apenas na impressão) -->
    <SeparacaoReport
      v-if="reportReady"
      :rows="reportRows"
      :summary="summary"
      :filters="appliedFiltersLabel"
      :emitted-by="emittedBy"
      :mode-meta="modeMeta"
      :format-date="formatDate"
      :relative-day="relativeDay"
      :customer-name="customerName"
      :descricao-produto="descricaoProduto"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onActivated, nextTick } from 'vue';
import SidebarComponent from '@/components/SidebarComponent.vue';
import TopbarComponent from '@/components/TopbarComponent.vue';
import SeparacaoReport from '@/components/SeparacaoReport.vue';
import { useApi } from '@/composables/useApi';
import { useAuth } from '@/composables/useAuth';
import { useNotification } from '@/composables/useNotification';
import { formatVariation } from '@/utils/variation';

const api = useApi();
const { user } = useAuth();
const notify = useNotification();

const modeOptions = ['FULL', 'FLEX', 'Correios', 'Agência', 'Coleta', 'Envio Padrão', 'Outros'];
const accountOptions = ref([]);
const userOptions = ref([]);

const filters = reactive({
  saleDateStart: '',
  saleDateEnd: '',
  shippingLimitStart: '',
  shippingLimitEnd: '',
  shippingMode: '',
  marketplace: '',
  account: '',
  userNickname: '',
  despacho: 'nao',
  sort: 'prazo_asc',
});

const items = ref([]);
const total = ref(0);
const page = ref(1);
const limit = ref(20);
const totalPages = ref(1);
const summary = reactive({
  totalPacotes: 0,
  totalItens: 0,
  totalUnidades: 0,
  atrasados: 0,
  despacharHoje: 0,
  usuariosAtivos: 0,
  porModalidade: {},
});

const groupedItems = computed(() => {
  const groups = new Map();
  for (const item of items.value) {
    const key = item.package_key
      || (item.shipping_id ? `ML:${item.uid}:ship:${item.shipping_id}` : `${item.marketplace || 'ML'}:${item.uid}:order:${item.id}`);
    if (!groups.has(key)) {
      groups.set(key, { ...item, _groupKey: key, _items: [], _orderIds: [] });
    }
    const group = groups.get(key);
    group._items.push(item);
    if (!group._orderIds.includes(String(item.id))) group._orderIds.push(String(item.id));
  }
  return Array.from(groups.values()).map(group => ({
    ...group,
    _totalQty: group._items.reduce((totalQty, item) => totalQty + (Number(item.quantity) || 0), 0),
  }));
});

function packageLabel(group) {
  if (group.shipping_id) return `Envio ${group.shipping_id}`;
  return `${itemMarketplace(group) === 'Shopee' ? 'Pedido Shopee' : 'Pedido'} ${group.id}`;
}

function statusLabel(item) {
  const status = String(item.shipping_status_live || item.shipping_status || '').toLowerCase();
  if (['shipped', 'delivered', 'completed', 'expedited'].includes(status)) return 'Despachado';
  if (['cancelled', 'canceled'].includes(status)) return 'Cancelado';
  return status ? status.replaceAll('_', ' ') : 'A despachar';
}

function statusClass(item) {
  const status = String(item.shipping_status_live || item.shipping_status || '').toLowerCase();
  if (['shipped', 'delivered', 'completed', 'expedited'].includes(status)) return 'chip--status-done';
  if (['cancelled', 'canceled'].includes(status)) return 'chip--status-cancelled';
  return 'chip--status-pending';
}

const isLoading = ref(false);
const isExporting = ref(false);
const isPrinting = ref(false);
const error = ref(null);

// Feedback do "copiar ID da venda"
const idCopiado = ref(null);
async function copiarId(id) {
  try {
    await navigator.clipboard.writeText(String(id));
    idCopiado.value = String(id);
    setTimeout(() => {
      if (idCopiado.value === String(id)) idCopiado.value = null;
    }, 1500);
  } catch {
    // clipboard bloqueado pelo navegador — ignora silenciosamente
  }
}

// Presets ativos (para destaque dos chips)
const activeVendaPreset = ref(null);
const activePrazoPreset = ref(null);

function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function addDays(base, n) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function setVendaPeriodo(kind) {
  const hoje = new Date();
  if (kind === 'hoje') {
    filters.saleDateStart = ymd(hoje);
    filters.saleDateEnd = ymd(hoje);
  } else if (kind === '7dias') {
    filters.saleDateStart = ymd(addDays(hoje, -6));
    filters.saleDateEnd = ymd(hoje);
  } else if (kind === '30dias') {
    filters.saleDateStart = ymd(addDays(hoje, -29));
    filters.saleDateEnd = ymd(hoje);
  } else if (kind === 'mes') {
    filters.saleDateStart = ymd(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
    filters.saleDateEnd = ymd(hoje);
  }
  activeVendaPreset.value = kind;
  aplicarFiltros();
}

function setPrazoPeriodo(kind) {
  const hoje = new Date();
  if (kind === 'atrasados') {
    filters.shippingLimitStart = '';
    filters.shippingLimitEnd = ymd(addDays(hoje, -1));
  } else if (kind === 'hoje') {
    filters.shippingLimitStart = ymd(hoje);
    filters.shippingLimitEnd = ymd(hoje);
  } else if (kind === 'amanha') {
    filters.shippingLimitStart = ymd(addDays(hoje, 1));
    filters.shippingLimitEnd = ymd(addDays(hoje, 1));
  } else if (kind === '7dias') {
    filters.shippingLimitStart = ymd(hoje);
    filters.shippingLimitEnd = ymd(addDays(hoje, 7));
  }
  activePrazoPreset.value = kind;
  aplicarFiltros();
}

// ---- Relatório de impressão ----
const reportRows = ref([]);
const reportReady = ref(false);
const emittedBy = computed(() => {
  const u = user?.value;
  const name = u?.name || u?.displayName || u?.email || 'Usuário';
  return `${name} (Administrador)`;
});
const appliedFiltersLabel = ref({});

const hasModes = computed(() => Object.keys(summary.porModalidade || {}).length > 0);

function buildQuery(extra = {}) {
  const q = new URLSearchParams();
  if (filters.saleDateStart) q.set('saleDateStart', filters.saleDateStart);
  if (filters.saleDateEnd) q.set('saleDateEnd', filters.saleDateEnd);
  if (filters.shippingLimitStart) q.set('shippingLimitStart', filters.shippingLimitStart);
  if (filters.shippingLimitEnd) q.set('shippingLimitEnd', filters.shippingLimitEnd);
  if (filters.shippingMode) q.set('shippingMode', filters.shippingMode);
  if (filters.marketplace) q.set('marketplace', filters.marketplace);
  if (filters.account) q.set('account', filters.account);
  if (filters.userNickname) q.set('userNickname', filters.userNickname);
  if (filters.despacho) q.set('despacho', filters.despacho);
  if (filters.sort) q.set('sort', filters.sort);
  for (const [k, v] of Object.entries(extra)) q.set(k, v);
  return q.toString();
}

async function fetchData() {
  isLoading.value = true;
  error.value = null;
  try {
    const qs = buildQuery({ page: page.value, limit: limit.value });
    const data = await api.get(`sales/separacao?${qs}`);
    items.value = data.items || [];
    total.value = data.total || 0;
    totalPages.value = data.totalPages || 1;
    Object.assign(summary, data.summary || {});
  } catch (e) {
    error.value = e.message || 'Falha ao carregar itens';
    items.value = [];
  } finally {
    isLoading.value = false;
  }
}

async function fetchFilterOptions() {
  try {
    const data = await api.get('sales/filter-options');
    accountOptions.value = data.accounts || [];
    userOptions.value = data.users || [];
  } catch (e) {
    // silencioso: filtros continuam usáveis por texto padrão
  }
}

function aplicarFiltros() {
  page.value = 1;
  fetchData();
}

function limparFiltros() {
  filters.saleDateStart = '';
  filters.saleDateEnd = '';
  filters.shippingLimitStart = '';
  filters.shippingLimitEnd = '';
  filters.shippingMode = '';
  filters.marketplace = '';
  filters.account = '';
  filters.userNickname = '';
  filters.despacho = 'nao';
  filters.sort = 'prazo_asc';
  activeVendaPreset.value = null;
  activePrazoPreset.value = null;
  aplicarFiltros();
}

function goTo(p) {
  if (p < 1 || p > totalPages.value || p === page.value) return;
  page.value = p;
  fetchData();
}

function onLimitChange() {
  page.value = 1;
  fetchData();
}

const pagesToShow = computed(() => {
  const tp = totalPages.value;
  const cur = page.value;
  if (tp <= 7) return Array.from({ length: tp }, (_, i) => i + 1);
  const pages = [1];
  const start = Math.max(2, cur - 1);
  const end = Math.min(tp - 1, cur + 1);
  if (start > 2) pages.push('...');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < tp - 1) pages.push('...');
  pages.push(tp);
  return pages;
});

// ---- Helpers de exibição ----
function prazoDate(item) {
  return item.sla_expected_date || item.shipping_limit_date || null;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function relativeDay(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const today = new Date();
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const b = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.round((a - b) / 86400000);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  if (diff === -1) return 'Ontem';
  const wd = d.toLocaleDateString('pt-BR', { weekday: 'long' });
  return wd.charAt(0).toUpperCase() + wd.slice(1);
}

function isLate(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const b = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return a < b;
}

function customerName(item) {
  const parts = [item.buyer_first_name, item.buyer_last_name].filter(Boolean);
  return parts.join(' ') || '—';
}

// Descrição do produto: prioridade 1 = descrição cadastrada no Armazenamento
// (por conta/cliente). Sem ela, usa o título original do anúncio do ML.
function temDescricaoInterna(item) {
  return !!(item?.sku_descricao && String(item.sku_descricao).trim());
}

function descricaoProduto(item) {
  if (temDescricaoInterna(item)) return String(item.sku_descricao).trim();
  return item?.product_title || '—';
}

const showAdvanced = ref(false);

/** Quantos filtros avançados estão ativos (aparece no contador do botão). */
const advancedCount = computed(() =>
  (filters.saleDateStart ? 1 : 0) +
  (filters.saleDateEnd ? 1 : 0) +
  (filters.shippingMode ? 1 : 0) +
  (filters.account ? 1 : 0) +
  (filters.userNickname ? 1 : 0)
);

const hasAnyFilter = computed(() =>
  advancedCount.value > 0 ||
  Boolean(filters.marketplace) ||
  filters.despacho !== 'nao' ||
  Boolean(activePrazoPreset.value) ||
  Boolean(filters.shippingLimitStart) ||
  Boolean(filters.shippingLimitEnd)
);

const MK_LOGOS = {
  ML: '/img/ml-logo.svg',
  Shopee: '/img/shopee-logo.svg',
};

/** Canal do item; `channel` é o apelido antigo mantido pelo backend. */
function itemMarketplace(item) {
  const raw = String(item?.marketplace || item?.channel || 'ML').toLowerCase();
  return raw.includes('shopee') || raw === 'sp' ? 'Shopee' : 'ML';
}

function marketplaceLogo(item) {
  return MK_LOGOS[itemMarketplace(item)];
}

function marketplaceLabel(item) {
  return itemMarketplace(item) === 'Shopee' ? 'Shopee' : 'Mercado Livre';
}

function descricaoTitle(item) {
  return temDescricaoInterna(item)
    ? `${descricaoProduto(item)} (descrição CyberDock)`
    : `${descricaoProduto(item)} (título do anúncio na ${marketplaceLabel(item)})`;
}

// Variação escolhida na venda (ex.: "Cor: Preto · Tamanho: 42 BR").
// Só atributos relevantes para a separação — ver src/utils/variation.js.
function variacao(item) {
  return formatVariation(item?.variation_attributes);
}

const MODE_META = {
  FULL: { label: 'FULL', color: '#2563eb', bg: '#eff6ff', icon: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />' },
  FLEX: { label: 'FLEX', color: '#ea580c', bg: '#fff7ed', icon: '<circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />' },
  Correios: { label: 'CORREIOS', color: '#16a34a', bg: '#f0fdf4', icon: '<rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />' },
  'Agência': { label: 'AGÊNCIA', color: '#0369a1', bg: '#f0f9ff', icon: '<path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="9" y1="12" x2="9.01" y2="12" />' },
  Coleta: { label: 'COLETA', color: '#2563eb', bg: '#eff6ff', icon: '<rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />' },
  'Envio Padrão': { label: 'ENVIO PADRÃO', color: '#0891b2', bg: '#ecfeff', icon: '<path d="M16.5 9.4 7.55 4.24" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />' },
  Outros: { label: 'OUTROS', color: '#64748b', bg: '#f1f5f9', icon: '<circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />' },
};

function modeMeta(mode) {
  return MODE_META[mode] || MODE_META['Outros'];
}

// ---- Exportar CSV ----
async function exportCsv() {
  isExporting.value = true;
  try {
    const qs = buildQuery({ full: '1' });
    const data = await api.get(`sales/separacao?${qs}`);
    const rows = data.items || [];
    const header = ['Pacote', 'ID do Envio', 'Conta', 'Usuario', 'Qtd', 'SKU', 'Descricao', 'Variacao', 'Status do Item', 'Apelido Comprador', 'Nome Comprador', 'Modalidade', 'Data para Despachar', 'ID da Venda'];
    const csvEscape = (v) => {
      const s = String(v ?? '');
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [header.join(';')];
    for (const it of rows) {
      lines.push([
        it.package_key || '',
        it.shipping_id || '',
        it.account_nickname || '',
        it.user_nickname || '',
        it.quantity ?? '',
        it.sku || '',
        descricaoProduto(it),
        variacao(it),
        statusLabel(it),
        it.buyer_nickname || '',
        customerName(it),
        modeMeta(it.shipping_mode).label,
        formatDate(prazoDate(it)),
        it.id ?? '',
      ].map(csvEscape).join(';'));
    }
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `separacao-itens-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    // Falha ao exportar é aviso, não estado da tela. `error` é o que substitui
    // a tabela por uma mensagem: usá-lo aqui apagava a lista inteira só porque
    // o download não saiu, e não havia como voltar sem recarregar.
    notify.fromError(e, 'Falha ao exportar a planilha.');
  } finally {
    isExporting.value = false;
  }
}

// ---- Imprimir PDF ----
function currentFiltersLabel() {
  const fmt = (s) => (s ? new Date(s + 'T00:00:00').toLocaleDateString('pt-BR') : null);
  const periodo = filters.saleDateStart || filters.saleDateEnd
    ? `${fmt(filters.saleDateStart) || '...'} até ${fmt(filters.saleDateEnd) || '...'}`
    : 'Todo o período';
  const prazo = filters.shippingLimitStart || filters.shippingLimitEnd
    ? `${fmt(filters.shippingLimitStart) || '...'} até ${fmt(filters.shippingLimitEnd) || '...'}`
    : 'Todos';
  return {
    periodoVenda: periodo,
    prazoDespacho: prazo,
    modalidade: filters.shippingMode || 'Todas',
    conta: filters.account || 'Todas as contas',
    usuario: filters.userNickname || 'Todos os usuários',
  };
}

async function imprimirPdf() {
  isPrinting.value = true;
  try {
    const qs = buildQuery({ full: '1' });
    const data = await api.get(`sales/separacao?${qs}`);
    reportRows.value = data.items || [];
    if (data.summary) Object.assign(summary, data.summary);
    appliedFiltersLabel.value = currentFiltersLabel();
    reportReady.value = true;
    await nextTick();
    setTimeout(() => {
      window.print();
      isPrinting.value = false;
    }, 300);
  } catch (e) {
    notify.fromError(e, 'Falha ao gerar o relatório para impressão.');
    isPrinting.value = false;
  }
}

onMounted(() => {
  // Padrão ao abrir: itens a despachar HOJE
  const hoje = ymd(new Date());
  filters.shippingLimitStart = hoje;
  filters.shippingLimitEnd = hoje;
  activePrazoPreset.value = 'hoje';
  fetchFilterOptions();
  fetchData();
});

/* A fila de separação é o caso mais sensível a dado velho: pedido separado em
 * outra aba, ou despachado por outra pessoa, continuava listado ao voltar para
 * a tela, porque keep-alive não refaz o onMounted. */
let separacaoActivated = false;
onActivated(() => {
  if (!separacaoActivated) {
    separacaoActivated = true;
    return;
  }
  fetchData();
});
</script>

<style scoped>
.dashboard-wrapper {
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-border: #e5e7eb;
  --color-text: #1f2937;
  --color-text-secondary: #6b7280;
  --color-bg-soft: #f9fafb;
  display: flex;
  min-height: 100vh;
  background: #f3f4f6;
  font-family: var(--font-sans);
}
.main-content { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.dashboard-content { padding: 1.5rem 2rem; flex: 1; }

.header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.dashboard-title { font-size: 1.6rem; font-weight: 700; color: var(--color-text); margin: 0; }
.dashboard-subtitle { color: var(--color-text-secondary); margin: 0.25rem 0 0; font-size: 0.9rem; }
.header-buttons { display: flex; gap: 0.75rem; }

.btn {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.6rem 1rem; border-radius: 10px; font-size: 0.875rem; font-weight: 600;
  cursor: pointer; border: 1px solid transparent; transition: all 0.15s ease;
}
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-primary:hover:not(:disabled) { background: var(--color-primary-hover); }
.btn-secondary { background: #fff; color: var(--color-text); border-color: var(--color-border); }
.btn-secondary:hover:not(:disabled) { background: var(--color-bg-soft); border-color: #d1d5db; }
.btn-link {
  display: inline-flex; align-items: center; gap: 0.35rem; background: none; border: none;
  color: var(--color-text-secondary); font-size: 0.85rem; font-weight: 600; cursor: pointer; padding: 0.5rem;
}
.btn-link:hover { color: var(--color-text); }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Filtros */
.filters-card { background: #fff; border: 1px solid var(--color-border); border-radius: 14px; padding: 0; margin-bottom: 1rem; overflow: hidden; }

/* Barra compacta: o painel antigo abria com 2 grades de data + 5 selects e
   tomava metade da tela antes de mostrar um item. Aqui fica só o que a fila de
   separação usa todo dia; o resto vive em "Filtros avançados". */
.filters-bar {
  display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem 0.9rem;
  padding: 0.7rem 0.85rem;
}
.filters-bar__group { display: flex; align-items: center; gap: 0.45rem; min-width: 0; }
.filters-bar__label {
  color: #475569; font-size: 0.68rem; font-weight: 800;
  letter-spacing: 0.05em; text-transform: uppercase; white-space: nowrap;
}
.filters-bar__select {
  height: 32px; padding: 0 0.55rem; border: 1px solid #dbe3ef; border-radius: 8px;
  background: #fff; color: #334155; font-family: inherit; font-size: 0.78rem; font-weight: 600;
}
.filters-bar__select:focus { outline: none; border-color: #93c5fd; }

.adv-toggle {
  display: inline-flex; align-items: center; gap: 0.4rem; height: 32px;
  margin-left: auto; padding: 0 0.7rem; border: 1px solid #dbe3ef; border-radius: 8px;
  flex: 0 0 auto;
  background: #fff; color: #475569; cursor: pointer;
  font-family: inherit; font-size: 0.76rem; font-weight: 700;
}
.adv-toggle:hover { border-color: #93c5fd; background: #f8fbff; color: #1d4ed8; }
.adv-toggle.is-active { border-color: #93c5fd; background: #eff6ff; color: #1d4ed8; }
.adv-toggle__count {
  display: grid; place-items: center; min-width: 18px; height: 18px; padding: 0 5px;
  border-radius: 999px; background: #2563eb; color: #fff; font-size: 0.64rem;
}
.adv-toggle__chev { transition: transform 180ms ease; }
.adv-toggle__chev.is-open { transform: rotate(180deg); }
.btn-link--inline { height: 32px; padding: 0 0.5rem; }

.filters-advanced {
  display: flex; flex-direction: column; gap: 1rem;
  padding: 0.9rem 0.85rem; border-top: 1px solid #eef2f7; background: #fbfdff;
}
.filters-dates { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
.filters-selects { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-top: 1.1rem; }
.filter-block { display: flex; flex-direction: column; gap: 0.4rem; }
.filter-label { font-size: 0.75rem; font-weight: 600; color: var(--color-text-secondary); }
.filter-block input[type="date"], .filter-block select {
  border: 1px solid var(--color-border); border-radius: 8px; padding: 0.5rem 0.6rem;
  font-size: 0.85rem; color: var(--color-text); background: #fff; width: 100%;
}
.filter-block input:focus, .filter-block select:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
.date-range { display: flex; align-items: center; gap: 0.4rem; }
.date-range input { flex: 1; min-width: 0; }
.date-range span { color: var(--color-text-secondary); font-size: 0.8rem; }
.preset-chips { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.15rem; }
.preset-chips button {
  padding: 0.25rem 0.65rem; font-size: 0.72rem; font-weight: 600; border-radius: 999px; cursor: pointer;
  border: 1px solid var(--color-border); background: #fff; color: var(--color-text-secondary); transition: all 0.15s ease;
}
.preset-chips button:hover { background: var(--color-bg-soft); color: var(--color-text); }
.preset-chips button.active { background: var(--color-primary); border-color: var(--color-primary); color: #fff; }
.preset-chips button.chip-danger.active { background: #dc2626; border-color: #dc2626; }
.filters-actions { display: flex; justify-content: flex-end; align-items: center; gap: 0.75rem; margin-top: 1.1rem; border-top: 1px solid var(--color-border); padding-top: 1rem; }

@media (max-width: 900px) {
  .filters-dates { grid-template-columns: 1fr; }
  .filters-selects { grid-template-columns: 1fr 1fr; }
}

/* Cards de resumo */
.summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.25rem; }
.s-card { background: #fff; border: 1px solid var(--color-border); border-radius: 14px; padding: 1rem 1.1rem; display: flex; align-items: center; gap: 0.9rem; }
.s-card--modes { flex-direction: column; align-items: stretch; gap: 0.6rem; }
.s-card__icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.s-card__icon--blue { background: #eff6ff; color: #2563eb; }
.s-card__icon--orange { background: #fff7ed; color: #ea580c; }
.s-card__icon--green { background: #f0fdf4; color: #16a34a; }
.s-card__icon--red { background: #fef2f2; color: #dc2626; }
.s-card__icon--slate { background: #f1f5f9; color: #475569; }
.value-danger { color: #dc2626; }
.s-card__body { display: flex; flex-direction: column; }
.s-card__label { font-size: 0.72rem; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.03em; }
.s-card__value { font-size: 1.6rem; font-weight: 800; color: var(--color-text); line-height: 1.1; }
.s-card__hint { font-size: 0.72rem; color: var(--color-text-secondary); }

.mode-mini-list { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem 0.75rem; }
.mode-mini { display: flex; align-items: center; gap: 0.45rem; }
.mode-mini__badge { width: 26px; height: 26px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.mode-mini__info { display: flex; flex-direction: column; line-height: 1.05; }
.mode-mini__count { font-size: 0.95rem; font-weight: 700; color: var(--color-text); }
.mode-mini__name { font-size: 0.65rem; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.02em; }
.mode-mini__empty { color: var(--color-text-secondary); }

/* Tabela */
.table-card { background: #fff; border: 1px solid var(--color-border); border-radius: 14px; overflow: hidden; }
.table-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 0.9rem 1.2rem; border-bottom: 1px solid var(--color-border); flex-wrap: wrap; gap: 0.5rem; }
.table-count { font-size: 0.85rem; font-weight: 600; color: var(--color-text-secondary); }
.sort-control { display: flex; align-items: center; gap: 0.5rem; }
.sort-control label { font-size: 0.8rem; color: var(--color-text-secondary); }
.sort-control select { border: 1px solid var(--color-border); border-radius: 8px; padding: 0.4rem 0.6rem; font-size: 0.82rem; background: #fff; }

.table-state { padding: 3rem; text-align: center; color: var(--color-text-secondary); }
.table-state.error { color: #dc2626; }
.table-scroll { overflow-x: auto; overflow-y: auto; max-height: calc(100vh - 260px); }
.sep-table { width: 100%; min-width: 940px; border-collapse: collapse; font-size: 0.85rem; table-layout: fixed; }
.sep-table thead th {
  text-align: left; padding: 0.7rem 0.9rem; font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.04em; color: var(--color-text-secondary); background: var(--color-bg-soft);
  border-bottom: 1px solid var(--color-border); white-space: nowrap;
  position: sticky; top: 0; z-index: 2;
}
.sep-table tbody td { padding: 0.7rem 0.9rem; border-bottom: 1px solid #f3f4f6; color: var(--color-text); vertical-align: middle; }
.sep-table tbody tr.package-item-row:hover { background: #eff6ff; }
.package-row td { padding: 0.45rem 0.9rem !important; background: #eaf2ff; border-top: 1px solid #bfdbfe; border-bottom: 1px solid #bfdbfe !important; }
.package-row__content { display: flex; align-items: center; flex-wrap: wrap; gap: 0.45rem 0.8rem; color: #475569; font-size: 0.72rem; }
.package-number { color: #1d4ed8; font-size: 0.76rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em; }
.package-id { padding: 0.1rem 0.45rem; border-radius: 999px; background: #fff; border: 1px solid #bfdbfe; color: #1e3a8a; font-family: 'SFMono-Regular', Consolas, monospace; font-weight: 700; }
.package-common { background: #fbfdff; border-left: 1px solid #e2e8f0; vertical-align: top !important; }

/* Larguras — sobra espaço para o produto e o ID não corta mais */
.col-qtd { width: 62px; text-align: center; }
.col-produto { width: auto; }
.col-conta { width: 160px; }
.col-comprador { width: 180px; }
.col-envio { width: 140px; }
.col-prazo { width: 200px; }

.ta-center { text-align: center; }
.cell-strong { font-weight: 600; color: var(--color-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cell-sub { font-size: 0.72rem; color: var(--color-text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Quantidade em destaque */
.qty-badge {
  display: inline-flex; align-items: center; justify-content: center; min-width: 30px; height: 26px;
  padding: 0 0.4rem; border-radius: 8px; background: #f1f5f9; border: 1px solid #e2e8f0;
  font-size: 0.85rem; font-weight: 700; color: #334155;
}
.qty-badge--multi { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }

/* Produto: descrição + SKU + variação em um só bloco */
.prod { display: flex; align-items: flex-start; gap: 0.5rem; min-width: 0; }
.prod__body { min-width: 0; flex: 1; }
.prod__desc {
  font-weight: 600; color: var(--color-text); line-height: 1.25;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.prod__meta { display: flex; align-items: center; gap: 0.35rem; margin-top: 0.2rem; flex-wrap: wrap; }
.chip {
  display: inline-block; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  padding: 0.05rem 0.4rem; border-radius: 5px; font-size: 0.7rem; font-weight: 600; line-height: 1.5;
}
.chip--sku { font-family: 'SFMono-Regular', Consolas, monospace; background: #f8fafc; border: 1px solid #e2e8f0; color: #475569; }
.chip--var { background: #eff6ff; border: 1px solid #dbeafe; color: #1d4ed8; }
.chip--status { text-transform: capitalize; border: 1px solid transparent; }
.chip--status-pending { background: #fff7ed; border-color: #fed7aa; color: #c2410c; }
.chip--status-done { background: #f0fdf4; border-color: #bbf7d0; color: #15803d; }
.chip--status-cancelled { background: #fef2f2; border-color: #fecaca; color: #b91c1c; }
.prod__mk-logo { width: 14px; height: 14px; object-fit: contain; flex-shrink: 0; }
/* Indicador da origem da descrição (CyberDock x Mercado Livre) */
.desc-origin {
  display: inline-flex; align-items: center; justify-content: center;
  width: 18px; height: 18px; border-radius: 5px; flex-shrink: 0; margin-top: 1px;
}
.desc-origin--cd { background: #eff6ff; color: #2563eb; border: 1px solid #dbeafe; }
.desc-origin--ml { background: #fffbeb; border: 1px solid #fef3c7; }
.desc-origin__img { width: 12px; height: 12px; object-fit: contain; }
.text-muted { color: var(--color-text-secondary); }
.mono { font-family: 'SFMono-Regular', Consolas, monospace; font-size: 0.8rem; }
.mode-badge { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.25rem 0.6rem; border-radius: 999px; font-size: 0.72rem; font-weight: 700; white-space: nowrap; }

/* Prazo + ID da venda */
.prazo { font-weight: 700; color: #b45309; white-space: nowrap; }
.prazo--late { color: #dc2626; }
.prazo-rel-inline { font-weight: 500; font-size: 0.72rem; color: var(--color-text-secondary); margin-left: 0.35rem; }
.id-copy {
  display: inline-flex; align-items: center; gap: 0.3rem; margin-top: 0.25rem; padding: 0.1rem 0.4rem 0.1rem 0.3rem;
  border: 1px solid transparent; border-radius: 6px; background: none; cursor: pointer;
  font-family: 'SFMono-Regular', Consolas, monospace; font-size: 0.72rem; color: var(--color-text-secondary);
  max-width: 100%;
}
.id-copy:hover { background: #f1f5f9; border-color: var(--color-border); color: var(--color-text); }
.id-copy svg { flex-shrink: 0; opacity: 0.7; }
.id-copy__ok {
  font-family: var(--font-sans); font-weight: 700; color: #16a34a; font-size: 0.65rem;
  text-transform: uppercase; letter-spacing: 0.03em;
}

/* Paginação */
.pagination { display: flex; justify-content: space-between; align-items: center; padding: 0.9rem 1.2rem; border-top: 1px solid var(--color-border); flex-wrap: wrap; gap: 0.75rem; }
.per-page { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: var(--color-text-secondary); }
.per-page select { border: 1px solid var(--color-border); border-radius: 8px; padding: 0.3rem 0.5rem; }
.pager { display: flex; gap: 0.25rem; }
.pg-btn {
  min-width: 32px; height: 32px; padding: 0 0.5rem; border: 1px solid var(--color-border); background: #fff;
  border-radius: 8px; font-size: 0.8rem; color: var(--color-text); cursor: pointer;
}
.pg-btn:hover:not(:disabled):not(.pg-btn--active) { background: var(--color-bg-soft); }
.pg-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.pg-btn--active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
.pg-btn--dots { border: none; background: none; cursor: default; }
/* Botões de seta: o SVG precisa ficar centrado no quadrado de 32px. */
.pg-btn--icon { display: inline-flex; align-items: center; justify-content: center; padding: 0; }

@media (max-width: 768px) {
  .dashboard-content { padding: 1rem; }
}
</style>
