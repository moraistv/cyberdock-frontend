<template>
    <div class="dashboard-wrapper">
        <SidebarComponent />
        <div class="main-content">
            <TopbarComponent />
            <div class="dashboard-content">

                <div class="header">
                    <div>
                        <h1 class="dashboard-title">Tabela de vendas</h1>
                        <p class="dashboard-subtitle">
                            As suas vendas do Mercado Livre e da Shopee são sincronizadas automaticamente.
                        </p>
                        <div class="mk-legend">
                            <span class="mk-legend__item">
                                <img src="/img/ml-logo.svg" alt="" class="mk-legend__logo" />
                                Mercado Livre
                            </span>
                            <span class="mk-legend__item">
                                <img src="/img/shopee-logo.svg" alt="" class="mk-legend__logo" />
                                Shopee
                            </span>
                        </div>
                    </div>
                                    <div class="header-buttons">
                    <button @click="handleUnifiedSync" :disabled="syncState.isSyncing || isFetchingAccounts"
                        class="btn-sync-sales"
                        :class="{ 'is-busy': syncState.isSyncing || isFetchingAccounts }"
                        title="Buscar vendas novas nas contas conectadas">
                        <svg class="btn-sync-sales__icon"
                            :class="{ 'is-spinning': syncState.isSyncing || isFetchingAccounts }"
                            xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"
                            stroke-linejoin="round">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                            <polyline points="21 3 21 9 15 9" />
                        </svg>
                        <span v-if="isFetchingAccounts">Buscando contas...</span>
                        <span v-else-if="syncState.isSyncing">Sincronizando...</span>
                        <span v-else>Sincronizar vendas</span>

                        <!-- Badge com contador de novas vendas -->
                        <span v-if="syncState.newSalesCount > 0" class="new-sales-badge">
                            {{ syncState.newSalesCount }}
                        </span>
                    </button>
                </div>
                </div>

                <div class="filters-panel">
                    <div class="quick-filters">
                        <div class="search-wrapper">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" class="search-icon">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <input type="text" v-model="searchQuery" placeholder="Buscar por produto, SKU, conta..."
                                class="search-input">
                        </div>

                        <div class="filter-container" ref="filterContainerRef">
                            <button @click="toggleFilterDropdown" class="filter-btn">
                                <svg class="filter-btn__icon" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                                <span class="filter-btn-label">Status:</span>
                                <span>{{ selectedStatusFilter ? getStatusLabel(selectedStatusFilter) : 'Todos' }}</span>
                                <svg class="filter-btn__chev" :class="{ 'rotate-180': isFilterDropdownOpen }" xmlns="http://www.w3.org/2000/svg"
                                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                            <div v-if="isFilterDropdownOpen" ref="filterDropdownRef" class="filter-dropdown">
                                <ul>
                                    <li @click="applyStatusFilter(null)">Todos os Status</li>
                                    <!-- INÍCIO DA ALTERAÇÃO: Usar 'statusOptions' para o filtro -->
                                    <li v-for="status in statusOptions" :key="status.value"
                                        @click="applyStatusFilter(status.value)">
                                        {{ status.label }}
                                    </li>
                                    <!-- FIM DA ALTERAÇÃO -->
                                </ul>
                            </div>
                        </div>

                        <div class="filter-container" ref="marketplaceFilterContainerRef">
                            <button @click="toggleMarketplaceDropdown" class="filter-btn">
                                <img v-if="selectedMarketplaceLogo" :src="selectedMarketplaceLogo" alt=""
                                    class="filter-btn__logo" />
                                <svg v-else class="filter-btn__icon" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                                <span class="filter-btn-label">Canal:</span>
                                <span>{{ selectedMarketplaceLabel }}</span>
                                <svg class="filter-btn__chev" :class="{ 'rotate-180': isMarketplaceDropdownOpen }"
                                    xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                            <div v-if="isMarketplaceDropdownOpen" ref="marketplaceFilterDropdownRef"
                                class="filter-dropdown">
                                <ul>
                                    <li @click="applyMarketplaceFilter(null)">Todos os Canais</li>
                                    <li @click="applyMarketplaceFilter('ML')">
                                        <img src="/img/ml-logo.svg" alt="" class="filter-dropdown__logo" />
                                        Mercado Livre
                                    </li>
                                    <li @click="applyMarketplaceFilter('Shopee')">
                                        <img src="/img/shopee-logo.svg" alt="" class="filter-dropdown__logo" />
                                        Shopee
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div class="filter-container" ref="accountFilterContainerRef">
                            <button @click="toggleAccountDropdown" class="filter-btn">
                                <svg class="filter-btn__icon" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                <span class="filter-btn-label">Conta:</span>
                                <span>{{ selectedAccountNickname }}</span>
                                <svg class="filter-btn__chev" :class="{ 'rotate-180': isAccountDropdownOpen }" xmlns="http://www.w3.org/2000/svg"
                                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                            <div v-if="isAccountDropdownOpen" ref="accountFilterDropdownRef" class="filter-dropdown">
                                <ul>
                                    <li @click="applyAccountFilter(null)">Todas as Contas</li>
                                    <li v-for="account in allAccountOptions" :key="account.key"
                                        @click="applyAccountFilter(account.value)">
                                        <img :src="account.logo" alt="" class="filter-dropdown__logo" />
                                        {{ account.label }}
                                        <small style="color:#6b7280">({{ account.id }})</small>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div class="filter-container" ref="shippingModeFilterContainerRef">
                            <button @click="toggleShippingModeDropdown" class="filter-btn">
                                <svg class="filter-btn__icon" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                                <span class="filter-btn-label">Envio:</span>
                                <span>{{ selectedShippingModeFilter || 'Todos' }}</span>
                                <svg class="filter-btn__chev" :class="{ 'rotate-180': isShippingModeDropdownOpen }"
                                    xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                            <div v-if="isShippingModeDropdownOpen" ref="shippingModeFilterDropdownRef"
                                class="filter-dropdown">
                                <ul>
                                    <li @click="applyShippingModeFilter(null)">Todos os Modos</li>
                                    <li v-for="mode in availableShippingModes" :key="mode"
                                        @click="applyShippingModeFilter(mode)">
                                        {{ mode }}
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <button @click="toggleAdvancedFilters" class="filter-btn advanced-filter-toggle" :class="{ 'is-active': activeAdvancedCount > 0 }">
                            <svg class="filter-btn__icon" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></svg>
                            Filtros Avançados
                            <span v-if="activeAdvancedCount > 0" class="filter-btn__count">{{ activeAdvancedCount }}</span>
                            <svg class="filter-btn__chev" :class="{ 'rotate-180': showAdvancedFilters }" xmlns="http://www.w3.org/2000/svg"
                                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>
                    </div>

                    <Transition @before-enter="advBeforeEnter" @enter="advEnter" @leave="advLeave">
                        <div v-if="showAdvancedFilters" class="advanced-filters">
                            <div class="filter-row">
                                <div class="filter-group">
                                    <label for="conta-ml-filter">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                        Conta
                                    </label>
                                    <select id="conta-ml-filter" v-model="filters.accountId">
                                        <option :value="null">Todas as Contas</option>
                                        <optgroup label="Mercado Livre">
                                            <option v-for="account in mlAccounts" :key="'ml-' + account.user_id"
                                                :value="String(account.user_id)">
                                                {{ account.nickname }}
                                            </option>
                                        </optgroup>
                                        <optgroup label="Shopee">
                                            <option v-for="account in shopeeAccounts" :key="'sp-' + account.shop_id"
                                                :value="String(account.shop_id)">
                                                {{ account.shop_name || account.shop_id }}
                                            </option>
                                        </optgroup>
                                    </select>
                                </div>
                                <div class="filter-group date-range-group">
                                    <label for="sale-date-start">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                        Data da Venda
                                    </label>
                                    <div class="date-inputs">
                                        <input id="sale-date-start" type="date" v-model="filters.saleDateStart">
                                        <span>até</span>
                                        <input id="sale-date-end" type="date" v-model="filters.saleDateEnd">
                                    </div>
                                </div>
                                <div class="filter-group date-range-group">
                                    <label for="shipping-limit-start">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                        Limite de Envio
                                    </label>
                                    <div class="date-inputs">
                                        <input id="shipping-limit-start" type="date" v-model="filters.shippingLimitStart">
                                        <span>até</span>
                                        <input id="shipping-limit-end" type="date" v-model="filters.shippingLimitEnd">
                                    </div>
                                    <div class="period-buttons">
                                        <button @click="setShippingLimitPeriod('yesterday')" :class="{ 'is-active': shippingLimitPeriodActive === 'yesterday' }">Ontem</button>
                                        <button @click="setShippingLimitPeriod('today')" :class="{ 'is-active': shippingLimitPeriodActive === 'today' }">Hoje</button>
                                        <button @click="setShippingLimitPeriod('tomorrow')" :class="{ 'is-active': shippingLimitPeriodActive === 'tomorrow' }">Amanhã</button>
                                    </div>
                                </div>
                            </div>
                            <div class="filter-actions">
                                <button @click="clearFilters" class="btn-clear-filters">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                                    Limpar Filtros
                                </button>
                            </div>
                        </div>
                    </Transition>
                </div>

                <div class="sales-table-container">
                    <!--
                        Skeleton no lugar de um texto "A carregar...": dá a
                        percepção de que a tela já está montada e só o
                        conteúdo está chegando, o que é bem mais rápido aos
                        olhos do que uma tela em branco com uma frase.
                    -->
                    <div v-if="isLoading && sales.length === 0" class="sale-cards-list" aria-busy="true" aria-label="Carregando vendas">
                        <div v-for="n in 6" :key="'sale-skel-' + n" class="sale-card sale-card--skeleton">
                            <div class="sale-card__layout">
                                <div class="skel skel--thumb"></div>
                                <div class="sale-card__main">
                                    <div class="skel skel--line" style="width: 40%;"></div>
                                    <div class="skel skel--line" style="width: 70%; height: 14px; margin-top: 8px;"></div>
                                    <div class="skel skel--line" style="width: 55%; margin-top: 10px;"></div>
                                </div>
                                <div class="skel skel--line" style="width: 90px; height: 28px;"></div>
                            </div>
                        </div>
                    </div>
                    <div v-else-if="error" class="error-state">
                        <p>{{ error }}</p>
                    </div>
                    <div v-else-if="sales.length === 0" class="empty-state">
                        <h3 class="empty-state-title">Nenhuma venda encontrada</h3>
                        <p class="empty-state-text">Clique em "Sincronizar Vendas" para buscar os dados do Mercado
                            Livre ou da Shopee.</p>
                    </div>

                    <div v-else>
                        <!-- Contador de resultados -->
                        <div class="sale-cards-counter">
                            <span>Mostrando <strong>{{ sales.length }}</strong> de <strong>{{ totalSales }}</strong> vendas</span>
                            <span v-if="isLoading" class="sale-cards-counter__loading">Atualizando...</span>
                        </div>

                        <!-- Barra de ações em massa (selecionar + imprimir etiquetas) -->
                        <div class="batch-bar">
                            <button @click="selectAll" class="btn-text" :disabled="isProcessing || isPrinting">Selecionar Todas</button>
                            <button @click="deselectAll" class="btn-text" :disabled="(isProcessing || isPrinting) || selectedSaleIds.size === 0">Desmarcar</button>
                            <template v-if="selectedSaleIds.size > 0">
                                <span class="batch-bar__sep">|</span>
                                <span class="batch-bar__count">{{ selectedSaleIds.size }} selecionada(s)</span>
                                <button @click="printSelectedLabels('pdf')" class="btn-label pdf" :disabled="isProcessing || isPrinting" title="Imprimir etiquetas PDF das selecionadas">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                                    {{ isPrinting ? 'Gerando...' : 'Imprimir PDF' }}
                                </button>
                                <button @click="printSelectedLabels('zpl')" class="btn-label zpl" :disabled="isProcessing || isPrinting" title="Imprimir etiquetas ZPL das selecionadas">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><polyline points="6 14 18 14 18 22 6 22"></polyline></svg>
                                    {{ isPrinting ? 'Gerando...' : 'Imprimir ZPL' }}
                                </button>
                            </template>
                        </div>
                        <div class="sale-cards-list" ref="tableBodyRef">
                            <div v-for="sale in sales" :key="`${sale.id}-${sale.sku}`"
                                 class="sale-card"
                                 :class="{ 'sale-card--cancelled': (sale.unified_status === 'cancelled' || sale.raw_api_data?.status === 'cancelled') }">

                                <div class="sale-card__layout">
                                    <!-- Checkbox para lote -->
                                    <div v-if="isSelectable(sale)" class="sale-card__checkbox-container" @click.stop>
                                        <input type="checkbox"
                                               :checked="selectedSaleIds.has(getSaleKey(sale))"
                                               @change="toggleSaleSelection(sale)"
                                               class="sale-card__checkbox"
                                               :disabled="isProcessing || isPrinting">
                                    </div>

                                    <!-- Thumbnail do Produto -->
                                    <div class="sale-card__thumb">
                                        <img v-if="getThumbUrl(sale)"
                                             :src="getThumbUrl(sale)"
                                             :alt="sale.product_title"
                                             class="sale-card__thumb-img"
                                             loading="lazy" />
                                        <div v-else class="sale-card__thumb-placeholder">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                        </div>
                                    </div>

                                    <!-- Centro: Informações Principais -->
                                    <div class="sale-card__main">
                                        <!-- Topo: ID tag -->
                                        <div class="sale-card__id-row">
                                            <div class="sale-card__id-tag" @click="copySaleId(sale.id)" title="Copiar ID da Venda">
                                                <span class="sale-card__id-label">ID:</span>
                                                <span class="sale-card__id-value">{{ sale.id || 'N/A' }}</span>
                                            </div>
                                            <span class="sale-card__date-mobile">{{ formatDateTime(sale.sale_date) }}</span>
                                        </div>
                                        <!-- Título do Produto (clicável) + Logo ML -->
                                        <div class="sale-card__title-row">
                                            <a v-if="getProductLink(sale)" :href="getProductLink(sale)" target="_blank" rel="noopener" class="sale-card__product-link" :title="sale.product_title">
                                                {{ sale.product_title || 'Produto sem título' }}
                                            </a>
                                            <h3 v-else class="sale-card__product-title" :title="sale.product_title">
                                                {{ sale.product_title || 'Produto sem título' }}
                                            </h3>
                                            <div class="sale-card__badges">
                                                <img :src="marketplaceLogo(sale)" :alt="marketplaceLabel(sale)"
                                                    :title="marketplaceLabel(sale)" class="sale-card__ml-logo" />
                                            </div>
                                        </div>

                                        <!-- Specs: Venda | Expedição | SKU | Mapeado | QTD -->
                                        <div class="sale-card__specs">
                                            <span class="sale-card__spec">
                                                <span class="sale-card__spec-label">Venda:</span>
                                                <span class="sale-card__spec-value">
                                                    {{ getSaleStatusLabel(sale.raw_api_data?.status || sale.sale_status) }}
                                                </span>
                                            </span>
                                            <span class="sale-card__divider">|</span>
                                            <span class="sale-card__spec">
                                                <span class="sale-card__spec-label">Expedição:</span>
                                                <span class="sale-card__spec-value">
                                                    <span :class="['status-badge', getStatusColorClass(sale.shipping_status || sale.unified_status)]"></span>
                                                    {{ getStatusLabel(sale.shipping_status || sale.unified_status) }}
                                                </span>
                                            </span>
                                            <span class="sale-card__divider">|</span>
                                            <span class="sale-card__spec">
                                                <span class="sale-card__spec-label">SKU:</span>
                                                <span class="sale-card__spec-mono">{{ sale.sku || 'N/A' }}</span>
                                            </span>
                                            <span class="sale-card__divider">|</span>
                                            <span class="sale-card__spec" style="display: flex; align-items: center; gap: 0.25rem;">
                                                <span class="sale-card__spec-label" title="Indica se o SKU está mapeado no armazenamento">Mapeado:</span>
                                                <span v-if="sale.is_sku_mapped" class="sale-card__spec-value" style="color: #10b981; font-weight: 600; font-size: 0.8rem;">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:inline; margin-right:2px; vertical-align: text-top;"><polyline points="20 6 9 17 4 12"></polyline></svg>Sim
                                                </span>
                                                <span v-else class="sale-card__spec-value" style="color: #ef4444; font-weight: 600; font-size: 0.8rem;">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:inline; margin-right:2px; vertical-align: text-top;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>Não
                                                </span>
                                            </span>
                                            <span class="sale-card__divider">|</span>
                                            <span class="sale-card__spec">
                                                <span class="sale-card__spec-label">QTD:</span>
                                                <span class="sale-card__spec-value">{{ sale.quantity }}</span>
                                            </span>
                                        </div>

                                        <!-- Footer: Conta • Cliente • Envio -->
                                        <div class="sale-card__footer">
                                            <span class="sale-card__footer-item" title="Conta">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                                <span class="sale-card__account-tag" v-if="sale.account_nickname">
                                                    ({{ sale.account_nickname }})
                                                </span>
                                            </span>
                                            <span class="sale-card__footer-dot">•</span>
                                            <span class="sale-card__footer-item" title="Comprador">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                                {{ getCustomerName(sale) }}
                                            </span>
                                            <span class="sale-card__footer-dot">•</span>
                                            <span class="sale-card__footer-item" title="Modo Envio">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                                                {{ sale.shipping_mode || 'N/A' }}
                                            </span>
                                        </div>
                                    </div>

                                    <!-- Direita: Data / Status / Ações -->
                                    <div class="sale-card__aside">
                                        <div class="sale-card__date-block">
                                             <span v-if="String(sale.shipping_mode).toLowerCase().includes('full')" class="sale-card__date-value" style="color: #6366f1; font-weight: 700;" title="Envio FULL">
                                                LIMITE ENVIO: FULL
                                             </span>
                                             <span v-else class="sale-card__date-value" :class="{'sale-card__date-value--late': isLate(sale.raw_api_data?.sla_data?.expected_date || sale.shipping_limit_date)}" title="Prazo de Expedição">
                                                LIMITE ENVIO: {{ formatDateTime(sale.raw_api_data?.sla_data?.expected_date || sale.shipping_limit_date) || '—' }}
                                             </span>
                                             <span class="sale-card__exp-date" title="Data da Venda">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                                Venda: {{ formatDateTime(sale.sale_date) }}
                                             </span>
                                        </div>

                                        <div class="sale-card__actions">
                                            <button v-if="!sale.processed_at && sale.is_sku_mapped"
                                                    @click="processSingleSale(sale)"
                                                    class="btn-label btn-process-single"
                                                    :disabled="isProcessing"
                                                    title="Processar Abatimento de Estoque">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                                                Processar
                                            </button>
                                            <span v-if="sale.processed_at" class="sale-card__status-tag sale-card__status-tag--proc" :title="'Processado em: ' + formatDateTime(sale.processed_at)">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                Proc
                                            </span>
                                            <span v-else class="sale-card__status-tag sale-card__status-tag--pend">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                                Pend
                                            </span>

                                            <button v-if="getLabelInfo(sale).canPrint" @click="handleDownloadLabel(getLabelInfo(sale).shipmentId, getLabelInfo(sale).sellerId, 'pdf')" class="btn-label pdf" title="Etiqueta PDF">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                                PDF
                                            </button>

                                            <button v-if="getLabelInfo(sale).canPrint" @click="handleDownloadLabel(getLabelInfo(sale).shipmentId, getLabelInfo(sale).sellerId, 'zpl')" class="btn-label zpl" title="Etiqueta ZPL">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><polyline points="6 14 18 14 18 22 6 22"></polyline></svg>
                                                ZPL
                                            </button>

                                            <button v-if="userRole === 'master'" @click="showJsonModal(sale)" class="btn-label" title="Ver JSON da API" style="background: rgba(99,102,241,0.15); color: #818cf8;">
                                                JSON
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="pagination-controls" v-if="totalPages > 1">
                            <button @click="prevPage" :disabled="currentPage === 1">Anterior</button>
                            <span>Página {{ currentPage }} de {{ totalPages }}</span>
                            <button @click="nextPage" :disabled="currentPage === totalPages">Próximo</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <UniversalModal :title="printModalTitle" v-model:open="isPrintModalOpen">
            <div class="summary-modal-content" v-html="printModalContent"></div>
            <div class="modal-actions">
                <button @click="isPrintModalOpen = false" class="btn btn-primary">Fechar</button>
            </div>
        </UniversalModal>

        <UniversalModal v-if="userRole === 'master'" title="JSON Completo da Venda" v-model:open="isJsonModalOpen">
            <div class="json-viewer">
                <pre><code>{{ selectedSaleJson }}</code></pre>
            </div>
            <div class="modal-actions">
                <button @click="isJsonModalOpen = false" class="btn btn-primary">Fechar</button>
            </div>
        </UniversalModal>

        <div ref="tooltipRef" class="custom-tooltip">
            <span class="tooltip-content"></span>
            <div class="tooltip-arrow"></div>
        </div>
        <!-- Modal de Resultados da Sincronização -->
        <UniversalModal :open="isSyncResultsModalOpen" :title="syncResults.title" @close="isSyncResultsModalOpen = false" size="lg">
            <div class="sync-results-content">
                <!-- Mensagem geral quando não há contas ou erro geral -->
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

                <!-- Detalhes por conta -->
                <div v-if="syncResults.accounts.length > 0" class="sr-accounts">
                    <h4 class="sr-subtitle">Detalhes por conta</h4>
                    <div class="sr-account" v-for="account in syncResults.accounts" :key="account.userId" :class="account.status">
                        <span class="sr-account-status" :class="account.status">
                            <svg v-if="account.status === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                        </span>
                        <div class="sr-account-info">
                            <span class="sr-account-name">{{ account.nickname }}</span>
                            <span class="sr-account-id">ID {{ account.userId }}<span v-if="account.durationMs" class="sr-account-time"> · {{ formatDuration(account.durationMs) }}</span></span>
                        </div>
                        <div class="sr-account-badges" v-if="account.status === 'success'">
                            <span class="sr-badge is-new" v-if="account.newSalesCount > 0">{{ account.newSalesCount }} nova{{ account.newSalesCount > 1 ? 's' : '' }}</span>
                            <span class="sr-badge is-updated" v-if="account.updatedCount > 0">{{ account.updatedCount }} atualizada{{ account.updatedCount > 1 ? 's' : '' }}</span>
                            <span class="sr-badge is-muted" v-if="!account.newSalesCount && !account.updatedCount">Sem novidades</span>
                        </div>
                        <div class="sr-account-badges" v-else>
                            <span class="sr-account-error">{{ account.message }}</span>
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

        <!-- Painel de progresso ao vivo (por conta, em tempo real) -->
        <SyncLiveModal :open="isSyncLiveOpen" :accounts="liveAccounts" title="Sincronizando vendas..." />

        <ToastNotification :is-visible="syncState.isVisible" :title="syncState.title"
            :description="syncState.description" :progress="syncState.progress" :type="syncState.type" />
    </div>
</template>

<script setup>
/* eslint-disable no-unused-vars */
import { ref, onMounted, onUnmounted, computed, watch, nextTick, reactive } from 'vue';
import { API_BASE_URL } from '@/config';
import SidebarComponent from '../components/SidebarComponent.vue';
import TopbarComponent from '../components/TopbarComponent.vue';
import UniversalModal from '../components/UniversalModal.vue';
import SyncLiveModal from '../components/SyncLiveModal.vue';
import ToastNotification from '../components/ToastNotification.vue';
import gsap from 'gsap';
import { useAuth } from '@/composables/useAuth';
import { useSales } from '@/composables/useSales';
import { useStatusesForUser } from '@/composables/useStatusesForUser';
import { useSyncManager } from '@/composables/useSyncManager';
import { useSystemStatus } from '@/composables/useSystemStatus';
import { useLabels } from '@/composables/useLabels';
import { useApi } from '@/composables/useApi';

// ===== UTILITY FUNCTIONS FOR CUSTOMER DATA =====

const MK_LOGOS = {
    ML: '/img/ml-logo.svg',
    Shopee: '/img/shopee-logo.svg',
};

/**
 * Marketplace da venda. O backend envia `marketplace` pela view unificada;
 * `channel` é o campo antigo e serve de fallback para dados já em cache.
 */
function saleMarketplace(sale) {
    const raw = String(sale?.marketplace || sale?.channel || 'ML').toLowerCase();
    return raw.includes('shopee') || raw === 'sp' ? 'Shopee' : 'ML';
}

function marketplaceLogo(sale) {
    return MK_LOGOS[saleMarketplace(sale)];
}

function marketplaceLabel(sale) {
    return saleMarketplace(sale) === 'Shopee' ? 'Shopee' : 'Mercado Livre';
}

/**
 * Retorna URL da thumbnail do produto via proxy do backend
 */
function getThumbUrl(sale) {
    let thumbUrl = sale.product_thumbnail;
    if (thumbUrl === 'not_found') return null;

    // Fallback lendo o payload bruto: o formato difere por marketplace.
    if (!thumbUrl && sale.raw_api_data?.order_items) {
        const itemObj = sale.raw_api_data.order_items.find(
            it => it.item?.seller_sku === sale.sku || it.item?.id === sale.sku
        );
        if (itemObj?.item?.thumbnail) thumbUrl = itemObj.item.thumbnail;
    }
    if (!thumbUrl && Array.isArray(sale.raw_api_data?.item_list)) {
        const itemObj = sale.raw_api_data.item_list.find(
            it => it.item_sku === sale.sku || it.model_sku === sale.sku
        ) || sale.raw_api_data.item_list[0];
        if (itemObj?.image_info?.image_url) thumbUrl = itemObj.image_info.image_url;
    }
    if (!thumbUrl) return null;

    // O proxy do backend aceita as imagens dos dois marketplaces (whitelist em
    // router/mercadolivre.js) e resolve o bloqueio de hotlink dos CDNs.
    return `${API_BASE_URL}/ml/img-proxy?url=${encodeURIComponent(thumbUrl)}`;
}

/**
 * Extrai o nome do cliente dos dados da API do Mercado Livre
 * @param {Object} sale - Objeto da venda contendo raw_api_data
 * @returns {string} Nome do cliente ou 'N/A' se não disponível
 */
function getCustomerName(sale) {
    try {
        const buyer = sale?.raw_api_data?.buyer;
        if (!buyer) return 'N/A';
        
        // Prioridade: nome completo > nickname > ID do comprador
        if (buyer.first_name && buyer.last_name) {
            return `${buyer.first_name} ${buyer.last_name}`.trim();
        }
        if (buyer.nickname) {
            return buyer.nickname.trim();
        }
        if (buyer.id) {
            return `Cliente #${buyer.id}`;
        }
        return 'N/A';
    } catch (error) {
        console.warn('Erro ao extrair nome do cliente:', error);
        return 'N/A';
    }
}

/**
 * Copia o ID da venda para a área de transferência
 * @param {number|string} saleId - ID da venda a ser copiado
 */
async function copySaleId(saleId) {
    try {
        if (!saleId) {
            throw new Error('ID da venda não disponível');
        }
        
        const idString = saleId.toString();
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(idString);
            showToast('ID copiado para a área de transferência', 'success');
        } else {
            // Fallback para navegadores antigos
            const textArea = document.createElement('textarea');
            textArea.value = idString;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (successful) {
                showToast('ID copiado para a área de transferência', 'success');
            } else {
                throw new Error('Falha ao copiar usando fallback');
            }
        }
    } catch (error) {
        console.error('Erro ao copiar ID:', error);
        showToast('Erro ao copiar ID da venda', 'error');
    }
}

/**
 * Exibe uma notificação toast simples
 * @param {string} message - Mensagem a ser exibida
 * @param {string} type - Tipo da notificação ('success', 'error', 'info')
 */
function showToast(message, type = 'info') {
    // Implementação simples usando alert por enquanto
    // TODO: Integrar com sistema de toast existente
    if (type === 'error') {
        console.error(message);
    } else {
        console.log(message);
    }
    
    // Criar um toast visual simples
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ef4444' : '#10b981'};
        color: white;
        padding: 12px 16px;
        border-radius: 6px;
        z-index: 9999;
        font-size: 14px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: opacity 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // Remover após 3 segundos
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// ===== END UTILITY FUNCTIONS =====

const {
    user, userRole, isAuthReady,
    mlAccounts, fetchMercadoLivreAccounts,
    shopeeAccounts, fetchShopeeAccounts,
} = useAuth();
const { sales, isLoading, error, totalSales, currentPage, totalPages, pageSize, fetchSales } = useSales();
const userUid = computed(() => user.value?.uid);
const { allStatuses: customStatuses } = useStatusesForUser(userUid);
const { syncState, liveAccounts, syncAccountsBatch } = useSyncManager();
const isSyncLiveOpen = ref(false);
const syncTimeframe = ref('3');
const { systemStatuses } = useSystemStatus();
const { downloadLabel, downloadLabelsForSales, getLabelInfo: composableLabelInfo } = useLabels();
const labelError = ref(null);
const isProcessing = ref(false);
const isPrinting = ref(false);
const api = useApi();

// Modal de resultado da impressão em massa
const isPrintModalOpen = ref(false);
const printModalTitle = ref('');
const printModalContent = ref('');

// === HELPERS DO MASTER ===
function getProductLink(sale) {
    if (sale.product_permalink) return sale.product_permalink;
    if (sale.raw_api_data?.order_items) {
        const item = sale.raw_api_data.order_items.find(it => it.item?.seller_sku === sale.sku || it.item?.id === sale.sku);
        if (item?.item?.permalink) return item.item.permalink;
    }
    if (sale.ml_item_id && String(sale.ml_item_id).toUpperCase().startsWith('MLB')) {
        const idStr = String(sale.ml_item_id);
        const match = idStr.match(/^MLB(\d+)$/i);
        const numId = match ? match[1] : idStr.replace('MLB', '');
        return `https://produto.mercadolivre.com.br/MLB-${numId}`;
    }
    return null;
}

function getSaleStatusLabel(statusValue) {
    if (!statusValue) return 'Pendente';
    const map = { paid: 'Pago', ready_to_ship: 'Pronto para Envio', shipped: 'Enviado', delivered: 'Entregue', cancelled: 'Cancelado', canceled: 'Cancelado', pending: 'Pendente', handling: 'Em Manuseio' };
    const key = String(statusValue).toLowerCase();
    return map[key] || (key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '));
}

function isLate(dateString) {
    if (!dateString) return false;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return false;
    return date < new Date();
}

function getLabelInfo(sale) {
    return composableLabelInfo(sale);
}

async function handleDownloadLabel(shipmentId, sellerId, type) {
    labelError.value = null;
    try {
        await downloadLabel(shipmentId, sellerId, type);
    } catch (err) {
        labelError.value = err?.message || 'Não foi possível baixar a etiqueta.';
        setTimeout(() => { labelError.value = null; }, 8000);
    }
}

// === SELEÇÃO EM LOTE & PROCESSAR ===
const selectedSaleIds = ref(new Set());

function getSaleKey(sale) {
    return `${sale.id}_${sale.sku}`;
}

function toggleSaleSelection(sale) {
    const key = getSaleKey(sale);
    const newSet = new Set(selectedSaleIds.value);
    if (newSet.has(key)) {
        newSet.delete(key);
    } else {
        newSet.add(key);
    }
    selectedSaleIds.value = newSet;
}

// Uma venda é selecionável se for processável (estoque) OU imprimível (etiqueta).
function isSelectable(sale) {
    if (!sale.processed_at && sale.is_sku_mapped) return true;
    try { return getLabelInfo(sale).canPrint; } catch { return false; }
}

function selectAll() {
    const newSet = new Set(selectedSaleIds.value);
    sales.value.forEach(sale => {
        if (isSelectable(sale)) newSet.add(getSaleKey(sale));
    });
    selectedSaleIds.value = newSet;
}

function deselectAll() {
    selectedSaleIds.value = new Set();
}

/**
 * Imprime etiquetas EM MASSA das vendas selecionadas.
 * - Filtra somente as imprimíveis (exclui FULL e status finais).
 * - Agrupa por seller e baixa 1 arquivo por conta.
 * - Mostra um resumo do que foi impresso e do que foi pulado.
 */
async function printSelectedLabels(type = 'pdf') {
    if (isPrinting.value || isProcessing.value) return;

    const selected = sales.value.filter(sale => selectedSaleIds.value.has(getSaleKey(sale)));
    if (selected.length === 0) {
        printModalTitle.value = 'Nenhuma Venda Selecionada';
        printModalContent.value = '<p>Selecione ao menos uma venda para imprimir etiquetas.</p>';
        isPrintModalOpen.value = true;
        return;
    }

    const printable = [];
    const skipped = [];
    for (const sale of selected) {
        const info = getLabelInfo(sale);
        if (info.canPrint && info.shipmentId && info.sellerId) {
            printable.push({ seller_id: info.sellerId, shipment_id: info.shipmentId, sku: sale.sku, account_nickname: sale.account_nickname });
        } else {
            skipped.push({ sku: sale.sku || sale.id, reason: info.reason || 'Não imprimível' });
        }
    }

    if (printable.length === 0) {
        printModalTitle.value = 'Nenhuma Etiqueta Imprimível';
        printModalContent.value = buildPrintResultHtml({ type, printableCount: 0, fileCount: 0, skipped, selectedCount: selected.length });
        isPrintModalOpen.value = true;
        return;
    }

    isPrinting.value = true;
    labelError.value = null;
    try {
        await downloadLabelsForSales(printable, type);

        const sellers = new Set(printable.map(p => p.seller_id));
        printModalTitle.value = 'Impressão em Massa';
        printModalContent.value = buildPrintResultHtml({ type, printableCount: printable.length, fileCount: sellers.size, skipped, selectedCount: selected.length });
        isPrintModalOpen.value = true;
    } catch (err) {
        printModalTitle.value = 'Erro na Impressão em Massa';
        printModalContent.value = `<p style="color:#dc2626;font-weight:600;">${err?.message || 'Falha ao gerar etiquetas em lote.'}</p>`;
        isPrintModalOpen.value = true;
    } finally {
        isPrinting.value = false;
    }
}

// Monta o HTML do resumo da impressão em massa (layout limpo, puladas agrupadas por motivo).
function buildPrintResultHtml({ type, printableCount, fileCount, skipped, selectedCount }) {
    const stat = (num, label, color, bg) => `
        <div style="flex:1;min-width:120px;text-align:center;padding:14px 10px;border-radius:12px;background:${bg};">
            <div style="font-size:1.8rem;font-weight:800;line-height:1;color:${color};">${num}</div>
            <div style="font-size:0.78rem;color:#475569;margin-top:4px;">${label}</div>
        </div>`;

    let html = '<div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;">';
    html += stat(printableCount, `etiqueta(s) ${type.toUpperCase()}`, '#059669', '#ecfdf5');
    if (fileCount > 0) html += stat(fileCount, 'arquivo(s), 1 por conta', '#2563eb', '#eff6ff');
    if (skipped.length > 0) html += stat(skipped.length, 'venda(s) pulada(s)', '#d97706', '#fffbeb');
    html += '</div>';

    if (printableCount === 0) {
        html += `<p style="color:#475569;margin:0 0 12px;">Nenhuma das <strong>${selectedCount}</strong> vendas selecionadas pode ser impressa.</p>`;
    }

    if (skipped.length > 0) {
        const byReason = new Map();
        for (const s of skipped) {
            const r = s.reason || 'Não imprimível';
            if (!byReason.has(r)) byReason.set(r, []);
            byReason.get(r).push(s.sku);
        }
        html += '<div style="border-top:1px solid #e2e8f0;padding-top:10px;"><div style="font-weight:700;color:#334155;margin-bottom:8px;font-size:0.9rem;">Puladas por motivo</div>';
        for (const [reason, skus] of byReason.entries()) {
            const sample = skus.slice(0, 8).join(', ');
            const extra = skus.length > 8 ? ` <span style="color:#94a3b8;">(+${skus.length - 8})</span>` : '';
            html += `<div style="display:flex;gap:8px;align-items:flex-start;padding:6px 0;">
                <span style="flex:0 0 auto;background:#fef3c7;color:#92400e;font-weight:700;border-radius:999px;padding:1px 9px;font-size:0.8rem;">${skus.length}×</span>
                <div style="flex:1;font-size:0.85rem;color:#475569;"><strong style="color:#334155;">${reason}</strong><br><span style="color:#94a3b8;font-size:0.78rem;">${sample}${extra}</span></div>
            </div>`;
        }
        html += '</div>';
    }
    return html;
}

async function processSingleSale(sale) {
    if (isProcessing.value) return;
    isProcessing.value = true;
    try {
        // Cada marketplace tem seu endpoint de abatimento, porque a venda é
        // atualizada na tabela correspondente (sales x shopee_sales). O payload
        // é sempre uma lista, no mesmo formato do processamento em lote.
        const isShopee = saleMarketplace(sale) === 'Shopee';
        const endpoint = isShopee ? '/shopee/process' : '/sales/process';
        const item = isShopee
            ? { orderSn: sale.id, sku: sale.sku, uid: sale.uid, quantity: sale.quantity }
            : { id: sale.id, sku: sale.sku, uid: sale.uid, quantity: sale.quantity };

        const result = await api.post(endpoint, { salesToProcess: [item] });

        // O endpoint responde 200 mesmo com falha por item (lote parcial), por
        // isso conferimos a lista de erros antes de marcar como processada.
        const failure = result?.failed?.[0];
        if (failure) throw new Error(failure.reason || 'Falha ao processar a venda.');

        sale.processed_at = new Date().toISOString();
    } catch (err) {
        console.error('Erro ao processar venda:', err);
        alert(err?.data?.error || err?.message || 'Erro ao processar venda');
    } finally {
        isProcessing.value = false;
    }
}

const tableBodyRef = ref(null);
const searchQuery = ref('');
const selectedStatusFilter = ref(null);
const isFilterDropdownOpen = ref(false);
const filterDropdownRef = ref(null);
const filterContainerRef = ref(null);
const isJsonModalOpen = ref(false);
const selectedSaleJson = ref('');
const tooltipRef = ref(null);
let hideTooltipTimeout = null;
const isFetchingAccounts = ref(false);
const showAdvancedFilters = ref(false);


const selectedAccountFilterId = ref(null);
const isAccountDropdownOpen = ref(false);
const accountFilterDropdownRef = ref(null);
const accountFilterContainerRef = ref(null);

const selectedShippingModeFilter = ref(null);
const isShippingModeDropdownOpen = ref(false);
const shippingModeFilterContainerRef = ref(null);
const shippingModeFilterDropdownRef = ref(null);

// Filtro de canal (marketplace): null = todos.
const selectedMarketplaceFilter = ref(null);
const isMarketplaceDropdownOpen = ref(false);
const marketplaceFilterContainerRef = ref(null);
const marketplaceFilterDropdownRef = ref(null);

const filters = reactive({
    accountId: null,
    marketplace: null,
    saleDateStart: '',
    saleDateEnd: '',
    shippingLimitStart: '',
    shippingLimitEnd: '',
});

/**
 * Contas dos dois marketplaces numa lista só, para o filtro de conta.
 * O backend casa o filtro por identificador OU por nickname, então enviamos o
 * identificador (seller_id no ML, shop_id na Shopee).
 */
const allAccountOptions = computed(() => {
    const ml = (mlAccounts.value || []).map((a) => ({
        key: `ml-${a.user_id}`,
        id: a.user_id,
        value: String(a.user_id),
        label: a.nickname || String(a.user_id),
        logo: MK_LOGOS.ML,
    }));
    const shopee = (shopeeAccounts.value || []).map((a) => ({
        key: `sp-${a.shop_id}`,
        id: a.shop_id,
        value: String(a.shop_id),
        label: a.shop_name || String(a.shop_id),
        logo: MK_LOGOS.Shopee,
    }));
    return [...ml, ...shopee];
});

const selectedMarketplaceLabel = computed(() => {
    if (selectedMarketplaceFilter.value === 'ML') return 'Mercado Livre';
    if (selectedMarketplaceFilter.value === 'Shopee') return 'Shopee';
    return 'Todos';
});

const selectedMarketplaceLogo = computed(() =>
    selectedMarketplaceFilter.value ? MK_LOGOS[selectedMarketplaceFilter.value] : null
);

// --- INÍCIO DAS ALTERAÇÕES ---

// 1. Cria um status unificado para cada venda, priorizando 'cancelled' da API.
// 2. Cria uma lista de opções de status para o filtro, garantindo que 'Cancelado' esteja sempre presente.
const statusOptions = computed(() => {
    const options = new Map();

    // Adiciona os status customizados do usuário
    (customStatuses.value || []).forEach(s => {
        if (s.value) options.set(s.value, s.label);
    });

    // Garante que o status 'cancelled' exista na lista
    if (!options.has('cancelled')) {
        options.set('cancelled', 'Cancelado');
    }

    // Adiciona dinamicamente outros status encontrados nos dados atuais
    (sales.value || []).forEach(sale => {
        const unified = sale.raw_api_data?.status === 'cancelled' ? 'cancelled' : (sale.shipping_status || 'pendente');
        if (unified && !options.has(unified)) {
            const label = unified.charAt(0).toUpperCase() + unified.slice(1).replace(/_/g, ' ');
            options.set(unified, label);
        }
    });

    // Retorna a lista de opções ordenada alfabeticamente
    return Array.from(options, ([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label));
});

// 3. Atualiza a função que obtém o rótulo do status para usar a nova lista de opções.
const getStatusLabel = (statusValue) => {
    if (!statusValue) return 'Pendente';
    const option = statusOptions.value.find(opt => opt.value === statusValue);
    // Retorna o rótulo encontrado ou formata o valor do status como fallback
    return option?.label || (String(statusValue).charAt(0).toUpperCase() + String(statusValue).slice(1).replace(/_/g, ' '));
};

// --- FIM DAS ALTERAÇÕES ---

function toLocalDateInputValue(date) {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function parseFlexibleDate(value, { endOfDay = false } = {}) {
    if (!value) return null;
    let d = null;
    if (value instanceof Date) {
        d = new Date(value);
    } else if (typeof value === 'number') {
        d = new Date(value);
    } else if (typeof value === 'string') {
        const str = value.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
            const [y, m, day] = str.split('-').map(Number);
            d = new Date(y, m - 1, day, 0, 0, 0, 0);
        } else {
            d = new Date(str);
        }
    }
    if (!d || isNaN(d)) return null;
    if (endOfDay) d.setHours(23, 59, 59, 999);
    return d;
}

const getSaleAccountId = (s) =>
    s?.seller_id ?? s?.account_user_id ?? s?.account_id ?? s?.sellerId ?? s?.accountUserId ?? s?.accountId ?? s?.account?.user_id ?? null;

const normalizeId = (id) => (id === null || id === undefined ? null : String(id));

const selectedAccountNickname = computed(() => {
    const id = selectedAccountFilterId.value;
    if (!id) return 'Todas';
    const acc = allAccountOptions.value.find(a => String(a.value) === String(id));
    return acc?.label ?? 'Conta';
});

const availableShippingModes = computed(() => {
    if (!sales.value) return [];
    const modes = sales.value.map(s => s.shipping_mode).filter(Boolean);
    return [...new Set(modes)].sort();
});

const handleUnifiedSync = async () => {
    await handleSync();
};

// Variáveis para o modal de resultados da sincronização
const isSyncResultsModalOpen = ref(false);
const syncResults = ref({
    title: '',
    type: 'success',
    accounts: [],
    summary: {
        total: 0,
        successful: 0,
        failed: 0
    }
});

// Formata duração em ms para algo legível (ex.: "820ms", "3,4s", "1m 05s").
function formatDuration(ms) {
    if (!ms || ms < 0) return '—';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    const s = ms / 1000;
    if (s < 60) return `${s.toFixed(1).replace('.', ',')}s`;
    const m = Math.floor(s / 60);
    const rem = Math.round(s % 60);
    return `${m}m ${String(rem).padStart(2, '0')}s`;
}

// Contadores animados (count-up) do modal de resultados.
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
    // Zera e faz o count-up suave dos números ao abrir o modal.
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

const handleSync = async () => {
    isFetchingAccounts.value = true;
    let successCount = 0;
    let errorCount = 0;
    let totalAccounts = 0;
    const accountResults = [];

    try {
        const accounts = await fetchMercadoLivreAccounts();
        if (accounts?.error) throw new Error(accounts.error);

        if (!accounts || accounts.length === 0) {
            syncResults.value = {
                title: 'Atenção',
                type: 'warning',
                accounts: [],
                summary: {
                    total: 0,
                    successful: 0,
                    failed: 0
                },
                message: 'Nenhuma conta do Mercado Livre conectada para sincronizar.'
            };
            isSyncResultsModalOpen.value = true;
            return;
        }

        totalAccounts = accounts.length;

        // Abre o painel de progresso ao vivo enquanto sincroniza.
        isSyncLiveOpen.value = true;

        // Sincroniza as contas em paralelo controlado (rate protegido no backend),
        // sem esperas artificiais e sem recarregar a tabela a cada conta.
        const batch = await syncAccountsBatch(
            accounts.map(account => ({
                mlAccountId: account.user_id,
                accountNickname: account.nickname,
                clientUid: null,
                daysToSync: null
            })),
            { concurrency: 3 }
        );

        successCount = batch.summary.successful;
        errorCount = batch.summary.failed;
        for (const r of batch.results) {
            accountResults.push({
                nickname: r.accountNickname,
                userId: r.mlAccountId,
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

        // Recarrega a tabela uma única vez, ao final de tudo.
        await fetchSales();
        const totalNewSales = batch.totalNewSales;

        syncResults.value = {
            title: errorCount > 0 ? 'Sincronização finalizada com problemas' : 'Sincronização finalizada',
            type: errorCount > 0 ? 'warning' : 'success',
            accounts: accountResults,
            summary: {
                total: totalAccounts,
                successful: successCount,
                failed: errorCount
            },
            totalNewSales: totalNewSales,
            totalUpdated: batch.totalUpdated,
            totalSkipped: batch.totalSkipped,
            totalDurationMs: batch.totalDurationMs
        };

        // O modal só interrompe o usuário quando há algo para conferir: falha
        // em alguma conta, ou vendas novas/atualizadas. No caso comum ("nada
        // mudou"), o toast que o useSyncManager já exibe ao finalizar é
        // suficiente — abrir um modal cheio a cada clique era só ruído, e
        // exigia um fechamento manual sem motivo.
        const hasNovidade = errorCount > 0 || totalNewSales > 0 || (batch.totalUpdated || 0) > 0;
        if (hasNovidade) {
            isSyncResultsModalOpen.value = true;
        }

    } catch (err) {
        console.error("Falha geral ao buscar contas ou sincronizar:", err);
        syncResults.value = {
            title: 'Erro Geral',
            type: 'error',
            accounts: [],
            summary: {
                total: 0,
                successful: 0,
                failed: 0
            },
            message: err.message
        };
        isSyncResultsModalOpen.value = true;
    } finally {
        isSyncLiveOpen.value = false;
        isFetchingAccounts.value = false;
        syncState.value.isForced = false;
    }
};



watch(() => syncState.value.isSyncing, (newValue, oldValue) => {
    if (oldValue === true && newValue === false && syncState.value.type !== 'error') {
        fetchSales();
    }
});

watch(selectedAccountFilterId, (v) => { filters.accountId = v ?? null; currentPage.value = 1; });
watch(() => filters.accountId, (v) => { selectedAccountFilterId.value = v ?? null; });
watch(selectedMarketplaceFilter, (v) => { filters.marketplace = v ?? null; currentPage.value = 1; });
watch(() => filters.marketplace, (v) => { selectedMarketplaceFilter.value = v ?? null; });

const triggerServerFetch = (resetPage = false) => {
    if (resetPage) currentPage.value = 1;
    
    const params = {
        page: currentPage.value,
        limit: pageSize.value,
    };

    if (searchQuery.value) params.search = searchQuery.value;
    if (selectedStatusFilter.value) params.shippingStatus = selectedStatusFilter.value;
    if (filters.accountId) params.account = filters.accountId;
    if (filters.marketplace) params.marketplace = filters.marketplace;
    if (selectedShippingModeFilter.value) params.shippingMode = selectedShippingModeFilter.value;
    
    if (filters.saleDateStart) params.saleDateStart = toLocalDateInputValue(filters.saleDateStart);
    if (filters.saleDateEnd) params.saleDateEnd = toLocalDateInputValue(filters.saleDateEnd);
    if (filters.shippingLimitStart) params.shippingLimitStart = toLocalDateInputValue(filters.shippingLimitStart);
    if (filters.shippingLimitEnd) params.shippingLimitEnd = toLocalDateInputValue(filters.shippingLimitEnd);
    
    fetchSales(params);
};

let searchTimeout;
watch(searchQuery, () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        triggerServerFetch(true);
    }, 400);
});

watch([selectedStatusFilter, selectedAccountFilterId, selectedMarketplaceFilter, selectedShippingModeFilter, filters], () => {
    triggerServerFetch(true);
}, { deep: true });

watch(currentPage, () => {
    triggerServerFetch(false);
});

function closeDropdownOnClickOutside(event) {
    const target = event.target;
    if (filterContainerRef.value && !filterContainerRef.value.contains(target)) {
        isFilterDropdownOpen.value = false;
    }
    if (accountFilterContainerRef.value && !accountFilterContainerRef.value.contains(target)) {
        isAccountDropdownOpen.value = false;
    }
    if (shippingModeFilterContainerRef.value && !shippingModeFilterContainerRef.value.contains(target)) {
        isShippingModeDropdownOpen.value = false;
    }
    if (marketplaceFilterContainerRef.value && !marketplaceFilterContainerRef.value.contains(target)) {
        isMarketplaceDropdownOpen.value = false;
    }
}

onMounted(async () => {
    // As vendas são o conteúdo principal da tela e não dependem das contas
    // (a lista de contas só alimenta os dropdowns de filtro). Antes, o
    // `await` bloqueava a busca de vendas até as duas chamadas de conta
    // terminarem — em sequência, isso somava latência sem necessidade.
    // Disparando tudo junto, a tabela aparece assim que a resposta de
    // vendas chega, sem esperar pelas contas.
    fetchMercadoLivreAccounts();
    fetchShopeeAccounts();

    if (isAuthReady.value && user.value) {
        triggerServerFetch(false);
    }
    watch(isAuthReady, async (ready) => {
        if (ready && user.value) {
            triggerServerFetch(false);
        }
    });
    document.addEventListener('click', closeDropdownOnClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('click', closeDropdownOnClickOutside);
});

function toggleAdvancedFilters() { showAdvancedFilters.value = !showAdvancedFilters.value; }
function toggleFilterDropdown() { isFilterDropdownOpen.value = !isFilterDropdownOpen.value; }
function applyStatusFilter(status) { selectedStatusFilter.value = status; isFilterDropdownOpen.value = false; }
function toggleAccountDropdown() { isAccountDropdownOpen.value = !isAccountDropdownOpen.value; }
function toggleMarketplaceDropdown() { isMarketplaceDropdownOpen.value = !isMarketplaceDropdownOpen.value; }
function applyMarketplaceFilter(mk) {
    selectedMarketplaceFilter.value = mk ?? null;
    isMarketplaceDropdownOpen.value = false;
}
function applyAccountFilter(id) { selectedAccountFilterId.value = id ?? null; isAccountDropdownOpen.value = false; }
function toggleShippingModeDropdown() { isShippingModeDropdownOpen.value = !isShippingModeDropdownOpen.value; }
function applyShippingModeFilter(mode) {
    selectedShippingModeFilter.value = mode;
    isShippingModeDropdownOpen.value = false;
}
function nextPage() { if (currentPage.value < totalPages.value) currentPage.value++; }
function prevPage() { if (currentPage.value > 1) currentPage.value--; }

function showJsonModal(sale) {
    selectedSaleJson.value = JSON.stringify(sale.raw_api_data, null, 2);
    isJsonModalOpen.value = true;
}

function formatDateTime(d) {
    if (!d) return 'N/A';
    const asDate = parseFlexibleDate(d);
    if (!asDate) return 'Data inválida';
    return asDate.toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function truncateText(text, length) { return text && text.length > length ? text.substring(0, length) + '...' : text || 'N/A'; }
function getStatusColorClass(statusValue) {
    const v = (statusValue || '').toLowerCase();
    if (v === 'pendente') return 'status-badge-gray';
    if (v.includes('imprimir')) return 'status-badge-indigo';
    if (v.includes('preparar')) return 'status-badge-yellow';
    if (v.includes('despachado')) return 'status-badge-red';
    if (v.includes('embalado')) return 'status-badge-cyan';
    if (v.includes('aguardando')) return 'status-badge-purple';
    if (v.includes('enviado') || v.includes('delivered')) return 'status-badge-green';
    if (v.includes('paid')) return 'status-badge-blue';
    if (v.includes('shipped')) return 'status-badge-purple';
    if (v.includes('cancelled')) return 'status-badge-gray';
    return 'status-badge-default';
}

// Marca qual botão de atalho (Ontem/Hoje/Amanhã) está selecionado, só para
// realce visual — recalculado a cada clique e zerado se o usuário editar a
// data manualmente.
const shippingLimitPeriodActive = ref(null);

function setShippingLimitPeriod(period) {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    const today = new Date(base);
    const yesterday = new Date(base); yesterday.setDate(base.getDate() - 1);
    const tomorrow = new Date(base); tomorrow.setDate(base.getDate() + 1);
    if (period === 'today') {
        filters.shippingLimitStart = toLocalDateInputValue(today);
        filters.shippingLimitEnd = toLocalDateInputValue(today);
    } else if (period === 'yesterday') {
        filters.shippingLimitStart = toLocalDateInputValue(yesterday);
        filters.shippingLimitEnd = toLocalDateInputValue(yesterday);
    } else if (period === 'tomorrow') {
        filters.shippingLimitStart = toLocalDateInputValue(tomorrow);
        filters.shippingLimitEnd = toLocalDateInputValue(tomorrow);
    }
    shippingLimitPeriodActive.value = period;
}

// Contagem de filtros avançados em uso, para o badge no botão que abre o painel.
const activeAdvancedCount = computed(() => {
    let count = 0;
    if (filters.accountId) count++;
    if (filters.saleDateStart || filters.saleDateEnd) count++;
    if (filters.shippingLimitStart || filters.shippingLimitEnd) count++;
    return count;
});

function clearFilters() {
    filters.accountId = null;
    filters.saleDateStart = '';
    filters.saleDateEnd = '';
    filters.shippingLimitStart = '';
    filters.shippingLimitEnd = '';
    searchQuery.value = '';
    selectedStatusFilter.value = null;
    selectedAccountFilterId.value = null;
    selectedMarketplaceFilter.value = null;
    selectedShippingModeFilter.value = null;
    shippingLimitPeriodActive.value = null;
}

// Animação leve de expansão/recolhimento do painel de filtros avançados —
// mesmo padrão gsap já usado no resto da tela.
function advBeforeEnter(el) { gsap.set(el, { opacity: 0, height: 0 }); }
function advEnter(el, done) { gsap.to(el, { opacity: 1, height: 'auto', duration: 0.25, ease: 'power2.out', onComplete: done }); }
function advLeave(el, done) { gsap.to(el, { opacity: 0, height: 0, duration: 0.2, ease: 'power2.in', onComplete: done }); }

function showTooltip(event, text) {
    const el = event.target;
    if (el.scrollWidth <= el.clientWidth) return;
    clearTimeout(hideTooltipTimeout);
    const tooltip = tooltipRef.value;
    if (!tooltip) return;
    const contentSpan = tooltip.querySelector('.tooltip-content');
    contentSpan.textContent = text;
    const rect = el.getBoundingClientRect();
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    tooltip.style.left = `${rect.left + rect.width / 2 + scrollLeft}px`;
    tooltip.style.top = `${rect.bottom + scrollTop + 8}px`;
    gsap.killTweensOf(tooltip);
    gsap.set(tooltip, { visibility: 'visible', opacity: 0, y: -10, transform: 'translateX(-50%)' });
    gsap.to(tooltip, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
}
function hideTooltip() {
    const tooltip = tooltipRef.value;
    if (!tooltip) return;
    gsap.killTweensOf(tooltip);
    hideTooltipTimeout = setTimeout(() => {
        gsap.to(tooltip, {
            opacity: 0,
            y: -10,
            duration: 0.2,
            ease: 'power2.in',
            onComplete: () => {
                gsap.set(tooltip, { visibility: 'hidden' });
            }
        });
    }, 100);
}
</script>

<style scoped>
.dashboard-wrapper {
    display: flex;
    min-height: 100vh;
    font-family: 'Inter', sans-serif;
    background-color: #f3f4f6;
}

.main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
}

.dashboard-content {
    flex: 1;
    padding: 2rem;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
}

.header-buttons {
    display: flex;
    gap: 0.75rem;
}

.dashboard-title {
    font-size: 1.875rem;
    font-weight: 700;
    color: #111827;
}

.dashboard-subtitle {
    margin-top: 0.25rem;
    font-size: 0.875rem;
    color: #6b7280;
}

.btn {
    padding: 0.6rem 1.2rem;
    font-size: 0.875rem;
    font-weight: 600;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-primary {
    background-color: #4f46e5;
    color: #fff;
}

.btn-primary:hover:not(:disabled) {
    background-color: #4338ca;
}

.btn-secondary {
    background-color: #6b7280;
    color: #fff;
}

.btn-secondary:hover:not(:disabled) {
    background-color: #4b5563;
}


.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.sync-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    position: relative;
}

/*
  Botão de sincronizar vendas: sólido para deixar claro que é a ação
  principal da tela, mas sem gradiente/sombra exagerada. O ícone traz a seta
  de fechamento do ciclo (desenho universal de "atualizar") e gira enquanto
  a operação está em curso.
*/
.btn-sync-sales {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    height: 40px;
    padding: 0 1.1rem;
    border: 1px solid #4f46e5;
    border-radius: 0.6rem;
    background-color: #4f46e5;
    color: #fff;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: background-color 140ms, border-color 140ms, box-shadow 140ms, opacity 140ms;
}
.btn-sync-sales:hover:not(:disabled) {
    background-color: #4338ca;
    border-color: #4338ca;
    box-shadow: 0 4px 12px -4px rgba(79, 70, 229, 0.45);
}
.btn-sync-sales:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.35);
}
.btn-sync-sales:disabled { cursor: not-allowed; opacity: 0.75; }
.btn-sync-sales__icon { flex-shrink: 0; }
.btn-sync-sales__icon.is-spinning { animation: spin 1s linear infinite; }

.mode-indicator {
    margin-left: 0.25rem;
    opacity: 0.7;
}

.sync-spinner {
    animation: spin 1.5s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.filters-panel {
    background-color: #fff;
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, .1);
}

.quick-filters {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
}

.search-wrapper {
    position: relative;
    flex-grow: 1;
    min-width: 250px;
}

.search-icon {
    position: absolute;
    left: 0.85rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1rem;
    height: 1rem;
    color: #9ca3af;
    pointer-events: none;
}

.search-input {
    padding: 0.6rem 1rem 0.6rem 2.5rem;
    font-size: 0.875rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
}

.filter-container {
    position: relative;
}

.filter-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1.2rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    background-color: #fff;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: border-color 140ms, box-shadow 140ms, background-color 140ms;
}
.filter-btn:hover { border-color: #a5b4fc; background-color: #f8fafc; }
.filter-btn:focus-visible { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15); }

.filter-btn-label {
    color: #6b7280;
}

/* Ícone fixo à esquerda de cada botão de filtro, para reconhecimento visual
   rápido do que cada dropdown representa, sem precisar ler o texto. */
.filter-btn__icon {
    color: #9ca3af;
    flex-shrink: 0;
}
.filter-btn__chev {
    transition: transform 0.2s ease;
}
.filter-btn__count {
    display: inline-grid;
    place-items: center;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    border-radius: 9999px;
    background: #4f46e5;
    color: #fff;
    font-size: 0.68rem;
    font-weight: 700;
    line-height: 1;
}
.advanced-filter-toggle.is-active {
    border-color: #a5b4fc;
    background-color: #eef2ff;
    color: #4338ca;
}
.advanced-filter-toggle.is-active .filter-btn__icon { color: #4f46e5; }

.filter-btn svg {
    transition: transform 0.3s ease;
}

.rotate-180 {
    transform: rotate(180deg);
}

.filter-dropdown {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    z-index: 20;
    min-width: 220px;
    background-color: #fff;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, .1);
    border: 1px solid #e5e7eb;
    overflow: hidden;
}

.filter-dropdown ul {
    list-style: none;
    margin: 0;
    padding: 0.5rem 0;
    max-height: 250px;
    overflow-y: auto;
}

.filter-dropdown li {
    padding: 0.75rem 1.25rem;
    font-size: 0.875rem;
    color: #374151;
    cursor: pointer;
    transition: background-color 0.2s;
}

.filter-dropdown li:hover {
    background-color: #f3f4f6;
}

.advanced-filters {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e5e7eb;
}

.filter-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
    align-items: end;
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.filter-group label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
}

.filter-group input,
.filter-group select {
    font-size: 0.875rem;
    padding: 0.6rem;
    border-radius: 0.5rem;
    border: 1px solid #d1d5db;
    background-color: #fff;
}

.date-inputs {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.date-inputs span {
    color: #6b7280;
}

.period-buttons {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.period-buttons button {
    font-size: 0.75rem;
    padding: 0.3rem 0.6rem;
    border: 1px solid #d1d5db;
    background: #f9fafb;
    border-radius: 0.375rem;
    cursor: pointer;
}

.period-buttons button:hover {
    background-color: #f3f4f6;
    border-color: #a5b4fc;
}
.period-buttons button.is-active {
    background-color: #4f46e5;
    border-color: #4f46e5;
    color: #fff;
}

.filter-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 1.5rem;
}

.btn-clear-filters {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #4f46e5;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
}

.btn-clear-filters:hover {
    text-decoration: underline;
}

.sales-table-container {
    background-color: #fff;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, .1);
    overflow-x: auto;
    margin-top: 1.5rem;
}

.sales-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
}

.sales-table th,
.sales-table td {
    padding: 1rem 1.25rem;
    border-bottom: 1px solid #e5e7eb;
    vertical-align: middle;
    white-space: nowrap;
}

.sales-table th {
    font-size: 0.75rem;
    font-weight: 600;
    color: #4b5563;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background-color: #f9fafb;
}

.product-title,
.sku-cell {
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
}

.channel-badge.ml {
    background-color: #ffe600;
    color: #333;
    display: inline-block;
    padding: 0.25rem 0.6rem;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: 9999px;
    transition: transform 0.2s ease-in-out;
}

.channel-badge.ml.clickable {
    cursor: pointer;
}

.channel-badge.ml.clickable:hover {
    transform: scale(1.05);
}

.status-cell {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.status-badge {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
}

.status-badge-default {
    background-color: #d1d5db;
}

.status-badge-blue {
    background-color: #3b82f6;
}

.status-badge-yellow {
    background-color: #f59e0b;
}

.status-badge-purple {
    background-color: #8b5cf6;
}

.status-badge-green {
    background-color: #22c55e;
}

.status-badge-gray {
    background-color: #6b7280;
}

.status-badge-cyan {
    background-color: #06b6d4;
}

.status-badge-indigo {
    background-color: #6366f1;
}

.status-badge-red {
    background-color: #ef4444;
}

.tag {
    padding: 0.2rem 0.6rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
}

.tag.processed {
    background-color: #dcfce7;
    color: #166534;
}

.tag.unprocessed {
    background-color: #fee2e2;
    color: #991b1b;
}

.btn-json {
    background: none;
    border: none;
    cursor: pointer;
    color: #6b7280;
    padding: 0.25rem;
}

.btn-json:hover {
    color: #111827;
}

.pagination-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    border-top: 1px solid #e5e7eb;
}

.pagination-controls button {
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    background-color: #fff;
    font-weight: 500;
    cursor: pointer;
}

.pagination-controls button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.loading-state,
.error-state,
.empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: #6b7280;
}

/* Skeleton do carregamento inicial: placeholders com shimmer no lugar de
   texto "carregando", para dar a sensação de que a tela já está pronta e o
   conteúdo real está só um instante atrás. */
.sale-card--skeleton { pointer-events: none; }
.sale-card--skeleton .sale-card__layout { align-items: center; }
.skel {
    position: relative;
    overflow: hidden;
    border-radius: 8px;
    background: linear-gradient(90deg, #eef0f3 25%, #f5f6f8 37%, #eef0f3 63%);
    background-size: 400% 100%;
    animation: skel-shimmer 1.4s ease infinite;
}
.skel--thumb { width: 58px; height: 58px; flex-shrink: 0; border-radius: 10px; }
.skel--line { height: 11px; border-radius: 6px; }
@keyframes skel-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}
@media (prefers-reduced-motion: reduce) {
    .skel { animation: none; }
}

.empty-state-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
}

.json-viewer {
    background-color: #f3f4f6;
    border-radius: 0.5rem;
    padding: 1rem;
    max-height: 60vh;
    overflow-y: auto;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1.5rem;
}

.custom-tooltip {
    position: fixed;
    background-color: #262626;
    color: #fff;
    padding: 0.4rem 0.7rem;
    border-radius: 0.375rem;
    z-index: 1000;
    pointer-events: none;
    visibility: hidden;
    opacity: 0;
}

/* Estilos para o Modal de Resultados da Sincronização */
.sync-results-content {
    max-height: 500px;
    overflow-y: auto;
}

.sync-message {
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    font-size: 0.9rem;
}

.sync-message.warning {
    background-color: #fffbeb;
    border-left: 4px solid #f59e0b;
    color: #b45309;
}

.sync-message.error {
    background-color: #fef2f2;
    border-left: 4px solid #ef4444;
    color: #dc2626;
}

.sync-message.success {
    background-color: #f0fdf4;
    border-left: 4px solid #22c55e;
    color: #16a34a;
}

.sync-summary {
    margin-bottom: 1.5rem;
}

.summary-stats {
    background-color: #f9fafb;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1.5rem;
}

.stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid #e5e7eb;
    font-size: 0.9rem;
}

.stat-item:last-child {
    border-bottom: none;
}

.stat-item.success .stat-value {
    color: #16a34a;
    font-weight: 600;
}

.stat-item.error .stat-value {
    color: #dc2626;
    font-weight: 600;
}

.stat-label {
    color: #374151;
}

.stat-value {
    font-weight: 600;
    color: #111827;
}

.accounts-details {
    margin-top: 1rem;
}

.modal-subtitle {
    font-size: 1rem;
    font-weight: 600;
    color: #111827;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #e5e7eb;
}

.accounts-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.account-item {
    background-color: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1rem;
    transition: all 0.2s ease;
}

.account-item.success {
    border-left: 4px solid #22c55e;
    background-color: #f0fdf4;
}

.account-item.error {
    border-left: 4px solid #ef4444;
    background-color: #fef2f2;
}

.account-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.account-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.account-icon {
    font-size: 1.2rem;
    line-height: 1;
}

.account-details {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.account-nickname {
    font-weight: 600;
    color: #111827;
    font-size: 0.95rem;
}

.account-id {
    color: #6b7280;
    font-size: 0.8rem;
}

.account-stats {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.sales-count {
    background-color: #dbeafe;
    color: #1e40af;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.8rem;
    font-weight: 500;
}

.account-message {
    color: #6b7280;
    font-size: 0.85rem;
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid #e5e7eb;
}

/* --- INÍCIO DA ALTERAÇÃO --- */
/* Estilo para destacar a linha da venda cancelada com um fundo vermelho bem fraco */
.sales-table tbody tr.cancelled-sale {
    background-color: #fee2e2;
    /* Cor de fundo vermelho claro */
    transition: background-color 0.3s ease;
}

/* Efeito opcional para escurecer um pouco a cor ao passar o mouse */
.sales-table tbody tr.cancelled-sale:hover {
    background-color: #fecaca;
}

/* --- FIM DA ALTERAÇÃO --- */

/* Badge de novas vendas */
.new-sales-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    background: #ef4444;
    color: white;
    border-radius: 50%;
    min-width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 600;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.1);
    }
    100% {
        transform: scale(1);
    }
}

/* Posicionamento relativo para o botão de sincronização */
.sync-btn {
    position: relative;
}

/* ============================================= */
/* LAYOUT DE CARDS - TABELA DE VENDAS            */
/* ============================================= */

.sale-cards-counter {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    font-size: 0.875rem;
    color: #64748b;
}
.sale-cards-counter strong { color: #1e293b; }
.sale-cards-counter__loading {
    color: #3b82f6;
    font-weight: 500;
    animation: pulse-fade 1.2s ease-in-out infinite;
}

.batch-bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.6rem;
    margin-bottom: 0.9rem;
    padding: 0.45rem 0.9rem;
    background-color: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
}
.batch-bar .btn-text {
    background: none;
    border: none;
    color: #3b82f6;
    font-weight: 600;
    cursor: pointer;
    padding: 0 0.25rem;
    font-size: 0.85rem;
}
.batch-bar .btn-text:hover:not(:disabled) { color: #2563eb; text-decoration: underline; }
.batch-bar .btn-text:disabled { color: #94a3b8; cursor: not-allowed; }
.batch-bar__sep { color: #cbd5e1; }
.batch-bar__count { font-weight: 600; color: #0f172a; font-size: 0.85rem; }
.batch-bar .btn-label {
    padding: 0.3rem 0.7rem;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 600;
}
@keyframes pulse-fade {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
}

.sale-cards-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.sale-card {
    background-color: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    padding: 1rem 1.25rem;
    transition: box-shadow 0.2s ease, border-color 0.2s ease;
}
.sale-card:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.07);
    border-color: #cbd5e1;
}
.sale-card--cancelled {
    opacity: 0.6;
    background-color: #fef2f2;
    border-color: #fecaca;
}

.sale-card__layout {
    display: flex;
    align-items: center;
    gap: 1.25rem;
}

/* Thumbnail */
.sale-card__thumb {
    flex-shrink: 0;
    width: 56px;
    height: 56px;
    border-radius: 0.5rem;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
}
.sync-time-select { padding: 0.5rem 1rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; background-color: #ffffff; color: #475569; font-size: 0.875rem; font-weight: 500; outline: none; transition: border-color 0.2s; }
.sync-time-select:focus { border-color: #3b82f6; }
.sale-card__thumb-img { width: 100%; height: 100%; object-fit: cover; }
.sale-card__thumb-placeholder { color: #cbd5e1; }

/* Main */
.sale-card__main { flex: 1; min-width: 0; }

.sale-card__id-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.4rem;
}
.sale-card__id-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.2rem 0.45rem;
    background-color: #f1f5f9;
    color: #64748b;
    border-radius: 0.375rem;
    font-size: 11px;
    font-family: 'SFMono-Regular', Consolas, monospace;
    border: 1px solid #e2e8f0;
    cursor: pointer;
    transition: background-color 0.15s;
}
.sale-card__id-tag:hover { background-color: #e2e8f0; }
.sale-card__id-label { opacity: 0.65; }
.sale-card__id-value { font-weight: 600; }

.sale-card__date-mobile {
    font-size: 0.75rem;
    color: #94a3b8;
    font-weight: 500;
    display: none;
}

.sale-card__title-row {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    margin-bottom: 0.4rem;
    flex-wrap: wrap;
}
.sale-card__product-title {
    font-size: 1rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
    max-width: 520px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.4;
}
.sale-card__badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    align-items: center;
    flex-shrink: 0;
}

.sale-card__specs {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.25rem 0.85rem;
    font-size: 0.875rem;
    color: #475569;
    margin-bottom: 0.6rem;
}
.sale-card__spec { display: inline-flex; align-items: center; gap: 0.25rem; }
.sale-card__spec-label { font-size: 0.78rem; color: #94a3b8; }
.sale-card__spec-value {
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    color: #1e293b;
}
.sale-card__spec-mono {
    font-family: 'SFMono-Regular', Consolas, monospace;
    color: #475569;
    font-size: 0.78rem;
}
.sale-card__divider { color: #cbd5e1; user-select: none; }

.sale-card__footer {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.2rem 0.6rem;
    font-size: 11px;
    color: #64748b;
    text-transform: uppercase;
    font-weight: 500;
    letter-spacing: 0.04em;
}
.sale-card__footer-item { display: inline-flex; align-items: center; gap: 0.25rem; }
.sale-card__footer-item svg { flex-shrink: 0; }
.sale-card__footer-dot { opacity: 0.4; user-select: none; }

/* Aside */
.sale-card__aside {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: space-between;
    flex-shrink: 0;
    min-width: 190px;
    gap: 0.75rem;
}
.sale-card__date-block {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.2rem;
}
.sale-card__date-value {
    font-size: 0.9rem;
    font-weight: 700;
    color: #1e293b;
}
.sale-card__exp-date {
    font-size: 11px;
    font-weight: 500;
    color: #64748b;
}
.sale-card__actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: flex-end;
}

@media (max-width: 768px) {
    .sale-card__layout { flex-wrap: wrap; gap: 0.75rem; }
    .sale-card__aside {
        width: 100%;
        align-items: flex-start;
        border-top: 1px solid #f1f5f9;
        padding-top: 0.75rem;
        min-width: 0;
    }
    .sale-card__date-block { align-items: flex-start; display: none; }
    .sale-card__date-mobile { display: inline; }
    .sale-card__actions { justify-content: flex-start; }
    .sale-card__product-title { max-width: 100%; }
}

/* === Marketplaces: legenda e logos nos filtros === */
.mk-legend {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 0.5rem;
    flex-wrap: wrap;
}
.mk-legend__item {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: #6b7280;
}
.mk-legend__logo {
    width: 16px;
    height: 16px;
    object-fit: contain;
    border-radius: 4px;
}
.filter-btn__logo {
    width: 15px;
    height: 15px;
    object-fit: contain;
    border-radius: 3px;
}
.filter-dropdown__logo {
    width: 15px;
    height: 15px;
    object-fit: contain;
    border-radius: 3px;
    margin-right: 0.4rem;
    vertical-align: text-bottom;
}

/* === ESTILOS EXTRAS DO MASTER === */
.sale-card__ml-logo {
    width: 22px;
    height: 22px;
    object-fit: contain;
    flex-shrink: 0;
}

.sale-card__product-link {
    font-size: 0.9rem;
    font-weight: 600;
    color: #1e293b;
    text-decoration: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 450px;
    transition: color 0.2s;
}
.sale-card__product-link:hover {
    color: #818cf8;
    text-decoration: underline;
}

.sale-card__status-tag {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
}
.sale-card__status-tag--proc {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.3);
}
.sale-card__status-tag--pend {
    background: rgba(245, 158, 11, 0.15);
    color: #f59e0b;
    border: 1px solid rgba(245, 158, 11, 0.3);
}

.btn-label {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 0.68rem;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 6px;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.2s;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    white-space: nowrap;
}
.btn-label.pdf {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.3);
}
.btn-label.pdf:hover { background: rgba(239, 68, 68, 0.3); }
.btn-label.zpl {
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
    border-color: rgba(34, 197, 94, 0.3);
}
.btn-label.zpl:hover { background: rgba(34, 197, 94, 0.3); }

.btn-process-single {
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
    border-color: rgba(59, 130, 246, 0.3);
}
.btn-process-single:hover { background: rgba(59, 130, 246, 0.3); }
.btn-process-single:disabled { opacity: 0.5; cursor: not-allowed; }

.sale-card__date-value--late {
    color: #ef4444 !important;
    font-weight: 700 !important;
}

.sale-card__checkbox-container {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 6px;
    flex-shrink: 0;
}
.sale-card__checkbox {
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: #6366f1;
}

.sale-card__account-tag {
    color: #f59e0b;
    font-weight: 600;
    font-size: 0.78rem;
}
</style>

<style scoped>
/* ===== Modal de resultados da sincronização (redesign limpo, sem emojis) ===== */
.sync-results-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
    font-family: 'Inter', system-ui, sans-serif;
}

.sync-message {
    padding: 12px 16px;
    border-radius: 10px;
    font-size: 14px;
    line-height: 1.5;
    background: #f1f5f9;
    color: #334155;
    border: 1px solid #e2e8f0;
}
.sync-message.warning { background: #fffbeb; color: #92400e; border-color: #fde68a; }
.sync-message.error   { background: #fef2f2; color: #991b1b; border-color: #fecaca; }
.sync-message.success { background: #f0fdf4; color: #166534; border-color: #bbf7d0; }

/* Cartões de resumo */
.sr-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 12px;
}
.sr-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 14px;
    background: #fff;
    border: 1px solid #eef0f4;
    border-radius: 14px;
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
    animation: sr-pop 0.35s ease both;
}
.sr-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(16, 24, 40, 0.08);
    border-color: #e2e8f0;
}
@keyframes sr-pop {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
}
.sr-card-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 10px;
    flex-shrink: 0;
    background: #eef2ff;
    color: #4f46e5;
}
.sr-card-icon svg { width: 20px; height: 20px; }
.sr-card-icon.is-new     { background: #ecfdf5; color: #059669; }
.sr-card-icon.is-updated { background: #eff6ff; color: #2563eb; }
.sr-card-icon.is-muted   { background: #f1f5f9; color: #64748b; }
.sr-card-icon.is-error   { background: #fef2f2; color: #dc2626; }

.sr-card-body { display: flex; flex-direction: column; line-height: 1.1; }
.sr-card-value {
    font-size: 24px;
    font-weight: 700;
    color: #0f172a;
    font-variant-numeric: tabular-nums;
    font-feature-settings: "tnum";
    letter-spacing: -0.02em;
}
.sr-card-label { font-size: 12px; color: #64748b; margin-top: 3px; font-weight: 500; }

/* Lista por conta */
.sr-subtitle {
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #64748b;
    margin: 0 0 10px;
}
.sr-account {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border: 1px solid #eef0f4;
    border-radius: 12px;
    margin-bottom: 8px;
    background: #fff;
    transition: background 0.15s ease, box-shadow 0.15s ease;
}
.sr-account:hover { box-shadow: 0 4px 14px rgba(16, 24, 40, 0.06); }
.sr-account.success { border-left: 3px solid #10b981; }
.sr-account.error   { border-left: 3px solid #ef4444; background: #fef2f2; }

.sr-account-status {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.sr-account-status svg { width: 22px; height: 22px; }
.sr-account-status.success { color: #10b981; }
.sr-account-status.error   { color: #ef4444; }

.sr-account-info { display: flex; flex-direction: column; min-width: 0; }
.sr-account-name { font-size: 14px; font-weight: 600; color: #0f172a; }
.sr-account-id { font-size: 12px; color: #94a3b8; }

.sr-account-badges {
    margin-left: auto;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: flex-end;
}
.sr-badge {
    font-size: 12px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 999px;
    white-space: nowrap;
}
.sr-badge.is-new     { background: #ecfdf5; color: #059669; }
.sr-badge.is-updated { background: #eff6ff; color: #2563eb; }
.sr-badge.is-muted   { background: #f1f5f9; color: #64748b; }
.sr-account-error { font-size: 13px; color: #b91c1c; text-align: right; }
</style>

<style scoped>
.sr-card-icon.is-time { background: #fef3c7; color: #d97706; }
.sr-card-value-sm { font-size: 19px; }
.sr-account-time { color: #cbd5e1; font-weight: 500; }
</style>
