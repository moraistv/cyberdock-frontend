<template>
    <div class="dashboard-wrapper">
        <SidebarComponent />
        <div class="main-content">
            <TopbarComponent />
            <div class="dashboard-content">

                <div class="header">
                    <div>
                        <h1 class="dashboard-title">Tabela de vendas</h1>
                        <p class="dashboard-subtitle">As suas vendas do Mercado Livre são sincronizadas automaticamente.
                        </p>
                    </div>
                                    <div class="header-buttons">
                    <button @click="handleUnifiedSync" :disabled="syncState.isSyncing || isFetchingAccounts"
                        :class="['btn', 'sync-btn', 'btn-primary']" 
                        title="Clique para sincronizar vendas">
                        <svg v-if="syncState.isSyncing" class="sync-spinner"
                            xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                        <span v-if="isFetchingAccounts">Buscando...</span>
                        <span v-else-if="syncState.isSyncing">Sincronizando...</span>
                        <span v-else>Sincronizar Vendas</span>
                        
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
                                <span class="filter-btn-label">Status:</span>
                                <span>{{ selectedStatusFilter ? getStatusLabel(selectedStatusFilter) : 'Todos' }}</span>
                                <svg :class="{ 'rotate-180': isFilterDropdownOpen }" xmlns="http://www.w3.org/2000/svg"
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

                        <div class="filter-container" ref="accountFilterContainerRef">
                            <button @click="toggleAccountDropdown" class="filter-btn">
                                <span class="filter-btn-label">Conta:</span>
                                <span>{{ selectedAccountNickname }}</span>
                                <svg :class="{ 'rotate-180': isAccountDropdownOpen }" xmlns="http://www.w3.org/2000/svg"
                                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                            <div v-if="isAccountDropdownOpen" ref="accountFilterDropdownRef" class="filter-dropdown">
                                <ul>
                                    <li @click="applyAccountFilter(null)">Todas as Contas</li>
                                    <li v-for="account in mlAccounts" :key="account.user_id"
                                        @click="applyAccountFilter(account.user_id)">
                                        {{ account.nickname }} <small style="color:#6b7280">({{ account.user_id
                                        }})</small>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div class="filter-container" ref="shippingModeFilterContainerRef">
                            <button @click="toggleShippingModeDropdown" class="filter-btn">
                                <span class="filter-btn-label">Envio:</span>
                                <span>{{ selectedShippingModeFilter || 'Todos' }}</span>
                                <svg :class="{ 'rotate-180': isShippingModeDropdownOpen }"
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

                        <button @click="toggleAdvancedFilters" class="filter-btn advanced-filter-toggle">
                            Filtros Avançados
                            <svg :class="{ 'rotate-180': showAdvancedFilters }" xmlns="http://www.w3.org/2000/svg"
                                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>
                    </div>

                    <div v-if="showAdvancedFilters" class="advanced-filters">
                        <div class="filter-row">
                            <div class="filter-group">
                                <label for="conta-ml-filter">Conta ML</label>
                                <select id="conta-ml-filter" v-model="filters.accountId">
                                    <option :value="null">Todas as Contas</option>
                                    <option v-for="account in mlAccounts" :key="account.user_id"
                                        :value="account.user_id">
                                        {{ account.nickname }}
                                    </option>
                                </select>
                            </div>
                            <div class="filter-group date-range-group">
                                <label for="sale-date-start">Data da Venda</label>
                                <div class="date-inputs">
                                    <input id="sale-date-start" type="date" v-model="filters.saleDateStart">
                                    <span>até</span>
                                    <input id="sale-date-end" type="date" v-model="filters.saleDateEnd">
                                </div>
                            </div>
                            <div class="filter-group date-range-group">
                                <label for="shipping-limit-start">Limite de Envio</label>
                                <div class="date-inputs">
                                    <input id="shipping-limit-start" type="date" v-model="filters.shippingLimitStart">
                                    <span>até</span>
                                    <input id="shipping-limit-end" type="date" v-model="filters.shippingLimitEnd">
                                </div>
                                <div class="period-buttons">
                                    <button @click="setShippingLimitPeriod('yesterday')">Ontem</button>
                                    <button @click="setShippingLimitPeriod('today')">Hoje</button>
                                    <button @click="setShippingLimitPeriod('tomorrow')">Amanhã</button>
                                </div>
                            </div>
                        </div>
                        <div class="filter-actions">
                            <button @click="clearFilters" class="btn-clear-filters">Limpar Filtros</button>
                        </div>
                    </div>
                </div>

                <div class="sales-table-container">
                    <div v-if="isLoading && sales.length === 0" class="loading-state">
                        <p>A carregar vendas...</p>
                    </div>
                    <div v-else-if="error" class="error-state">
                        <p>{{ error }}</p>
                    </div>
                    <div v-else-if="sales.length === 0" class="empty-state">
                        <h3 class="empty-state-title">Nenhuma venda encontrada</h3>
                        <p class="empty-state-text">Clique em "Sincronizar Vendas" para buscar os dados do Mercado
                            Livre.</p>
                    </div>
                    <div v-else-if="filteredSales.length === 0" class="empty-state">
                        <p>Nenhuma venda encontrada para os filtros selecionados.</p>
                    </div>
                    <div v-else>
                        <!-- Contador de resultados -->
                        <div class="sale-cards-counter">
                            <span>Mostrando <strong>{{ filteredSales.length }}</strong> de <strong>{{ sales.length }}</strong> vendas</span>
                            <span v-if="isLoading" class="sale-cards-counter__loading">Atualizando...</span>
                        </div>
                        <div class="sale-cards-list" ref="tableBodyRef">
                            <div v-for="sale in paginatedSales" :key="`${sale.id}-${sale.sku}`"
                                 class="sale-card"
                                 :class="{ 'sale-card--cancelled': (sale.unified_status === 'cancelled' || sale.raw_api_data?.status === 'cancelled') }">

                                <div class="sale-card__layout">
                                    <!-- Checkbox para lote -->
                                    <div v-if="!sale.processed_at && sale.is_sku_mapped" class="sale-card__checkbox-container" @click.stop>
                                        <input type="checkbox"
                                               :checked="selectedSaleIds.has(getSaleKey(sale))"
                                               @change="toggleSaleSelection(sale)"
                                               class="sale-card__checkbox"
                                               :disabled="isProcessing">
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
                                                <img src="/img/ml-logo.svg" alt="Mercado Livre" class="sale-card__ml-logo" />
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
                
                <!-- Resumo da sincronização -->
                <div v-if="syncResults.accounts.length > 0" class="sync-summary">
                    <div class="summary-stats">
                        <div class="stat-item">
                            <span class="stat-label">Total de Contas</span>
                            <span class="stat-value">{{ syncResults.summary.total }}</span>
                        </div>
                        <div class="stat-item success" v-if="syncResults.summary.successful > 0">
                            <span class="stat-label">Sincronizadas com Sucesso</span>
                            <span class="stat-value">{{ syncResults.summary.successful }}</span>
                        </div>
                        <div class="stat-item error" v-if="syncResults.summary.failed > 0">
                            <span class="stat-label">Falharam</span>
                            <span class="stat-value">{{ syncResults.summary.failed }}</span>
                        </div>
                        <div class="stat-item" v-if="syncResults.totalNewSales !== undefined">
                            <span class="stat-label">Novas Vendas Encontradas</span>
                            <span class="stat-value">{{ syncResults.totalNewSales }}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Detalhes por conta -->
                <div v-if="syncResults.accounts.length > 0" class="accounts-details">
                    <h4 class="modal-subtitle">📊 Detalhes por Conta</h4>
                    <div class="accounts-list">
                        <div v-for="account in syncResults.accounts" :key="account.userId" class="account-item" :class="account.status">
                            <div class="account-header">
                                <div class="account-info">
                                    <span class="account-icon" v-if="account.status === 'success'">✅</span>
                                    <span class="account-icon" v-else>❌</span>
                                    <div class="account-details">
                                        <span class="account-nickname">{{ account.nickname }}</span>
                                        <small class="account-id">(ID: {{ account.userId }})</small>
                                    </div>
                                </div>
                                <div class="account-stats">
                                    <span class="sales-count" v-if="account.status === 'success'">
                                        {{ account.salesCount }} vendas
                                    </span>
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
/* eslint-disable no-unused-vars */
import { ref, onMounted, onUnmounted, computed, watch, nextTick, reactive } from 'vue';
import { API_BASE_URL } from '@/config';
import SidebarComponent from '../components/SidebarComponent.vue';
import TopbarComponent from '../components/TopbarComponent.vue';
import UniversalModal from '../components/UniversalModal.vue';
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

/**
 * Retorna URL da thumbnail do produto via proxy do backend
 */
function getThumbUrl(sale) {
    let thumbUrl = sale.product_thumbnail;
    if (!thumbUrl && sale.raw_api_data?.order_items) {
        const itemObj = sale.raw_api_data.order_items.find(
            it => it.item?.seller_sku === sale.sku || it.item?.id === sale.sku
        );
        if (itemObj?.item?.thumbnail) thumbUrl = itemObj.item.thumbnail;
    }
    if (!thumbUrl) return null;
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

const { user, userRole, isAuthReady, mlAccounts, fetchMercadoLivreAccounts } = useAuth();
const { sales, isLoading, error, fetchSales } = useSales();
const userUid = computed(() => user.value?.uid);
const { allStatuses: customStatuses } = useStatusesForUser(userUid);
const { syncState, syncAccount } = useSyncManager();
const { systemStatuses } = useSystemStatus();
const { downloadLabel, getLabelInfo: composableLabelInfo } = useLabels();
const labelError = ref(null);
const isProcessing = ref(false);
const api = useApi();

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

async function processSingleSale(sale) {
    if (isProcessing.value) return;
    isProcessing.value = true;
    try {
        await api.post('/sales/process', { sale_id: sale.id, sku: sale.sku });
        sale.processed_at = new Date().toISOString();
    } catch (err) {
        console.error('Erro ao processar venda:', err);
        alert(err?.response?.data?.message || err?.message || 'Erro ao processar venda');
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
const currentPage = ref(1);
const itemsPerPage = ref(10);
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

const filters = reactive({
    accountId: null,
    saleDateStart: '',
    saleDateEnd: '',
    shippingLimitStart: '',
    shippingLimitEnd: '',
});

// --- INÍCIO DAS ALTERAÇÕES ---

// 1. Cria um status unificado para cada venda, priorizando 'cancelled' da API.
const salesWithUnifiedStatus = computed(() => {
    return (sales.value || []).map(sale => ({
        ...sale,
        unified_status: sale.raw_api_data?.status === 'cancelled'
            ? 'cancelled'
            : (sale.shipping_status || 'pendente'),
    }));
});

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

    // Adiciona dinamicamente outros status encontrados nos dados, caso não existam
    salesWithUnifiedStatus.value.forEach(sale => {
        if (sale.unified_status && !options.has(sale.unified_status)) {
            const label = sale.unified_status.charAt(0).toUpperCase() + sale.unified_status.slice(1).replace(/_/g, ' ');
            options.set(sale.unified_status, label);
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
    const acc = (mlAccounts.value || []).find(a => String(a.user_id) === String(id));
    return acc?.nickname ?? 'Conta';
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

        // Captura o número de vendas antes da sincronização
        const salesBefore = sales.value?.length || 0;

        for (const account of accounts) {
            try {
                await syncAccount(account.user_id, account.nickname);
                successCount++;
                
                // Aguarda um pouco para permitir que as vendas sejam atualizadas
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Atualiza as vendas para obter contagem atualizada
                await fetchSales();
                
                // Calcula o número de vendas para esta conta
                const accountSales = sales.value?.filter(sale => {
                    const saleAccountId = getSaleAccountId(sale);
                    return normalizeId(saleAccountId) === normalizeId(account.user_id);
                })?.length || 0;
                
                accountResults.push({
                    nickname: account.nickname,
                    userId: account.user_id,
                    status: 'success',
                    salesCount: accountSales,
                    message: `Sincronizada com sucesso`
                });
            } catch (err) {
                errorCount++;
                console.error(`Falha ao sincronizar a conta ${account.nickname} (${account.user_id}):`, err);
                
                accountResults.push({
                    nickname: account.nickname,
                    userId: account.user_id,
                    status: 'error',
                    salesCount: 0,
                    message: err.message || 'Erro desconhecido'
                });
            }
        }

        // Atualiza as vendas uma última vez após todas as sincronizações
        await fetchSales();
        const salesAfter = sales.value?.length || 0;
        const totalNewSales = salesAfter - salesBefore;

        // Mostra o modal de resultados para múltiplas contas ou quando há resultados importantes
        if (totalAccounts > 1 || errorCount > 0) {
            syncResults.value = {
                title: errorCount > 0 ? 'Sincronização Finalizada com Problemas' : 'Sincronização Finalizada',
                type: errorCount > 0 ? 'warning' : 'success',
                accounts: accountResults,
                summary: {
                    total: totalAccounts,
                    successful: successCount,
                    failed: errorCount
                },
                totalNewSales: totalNewSales
            };
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

const filteredSales = computed(() => {
    // --- INÍCIO DA ALTERAÇÃO: Usar 'salesWithUnifiedStatus' para a filtragem ---
    let tempSales = salesWithUnifiedStatus.value;

    if (selectedStatusFilter.value) {
        tempSales = tempSales.filter(s => s.unified_status === selectedStatusFilter.value);
    }
    // --- FIM DA ALTERAÇÃO ---

    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        tempSales = tempSales.filter(s =>
            (s.product_title?.toLowerCase().includes(query)) ||
            (s.sku?.toLowerCase().includes(query)) ||
            (s.account_nickname?.toLowerCase().includes(query))
        );
    }

    if (selectedAccountFilterId.value) {
        const sel = normalizeId(selectedAccountFilterId.value);
        tempSales = tempSales.filter(s => normalizeId(getSaleAccountId(s)) === sel);
    }

    if (selectedShippingModeFilter.value) {
        tempSales = tempSales.filter(s => s.shipping_mode === selectedShippingModeFilter.value);
    }

    if (filters.saleDateStart) {
        const start = parseFlexibleDate(filters.saleDateStart);
        tempSales = tempSales.filter(s => {
            const saleDate = parseFlexibleDate(s.sale_date);
            return saleDate && start && saleDate >= start;
        });
    }
    if (filters.saleDateEnd) {
        const end = parseFlexibleDate(filters.saleDateEnd, { endOfDay: true });
        tempSales = tempSales.filter(s => {
            const saleDate = parseFlexibleDate(s.sale_date);
            return saleDate && end && saleDate <= end;
        });
    }

    if (filters.shippingLimitStart) {
        const start = parseFlexibleDate(filters.shippingLimitStart);
        tempSales = tempSales.filter(s => {
            const raw = s.raw_api_data?.sla_data?.expected_date || s.shipping_limit_date;
            const limitDate = parseFlexibleDate(raw);
            return limitDate && start && limitDate >= start;
        });
    }
    if (filters.shippingLimitEnd) {
        const end = parseFlexibleDate(filters.shippingLimitEnd, { endOfDay: true });
        tempSales = tempSales.filter(s => {
            const raw = s.raw_api_data?.sla_data?.expected_date || s.shipping_limit_date;
            const limitDate = parseFlexibleDate(raw);
            return limitDate && end && limitDate <= end;
        });
    }

    return tempSales;
});

const totalPages = computed(() => Math.ceil(filteredSales.value.length / itemsPerPage.value) || 1);
const paginatedSales = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value;
    const paginated = filteredSales.value.slice(start, start + itemsPerPage.value);
    nextTick(() => {
        if (tableBodyRef.value?.children.length) {
            gsap.from(tableBodyRef.value.children, {
                opacity: 0, y: 20, duration: 0.5, stagger: 0.08, ease: 'power3.out'
            });
        }
    });
    return paginated;
});

watch([selectedStatusFilter, searchQuery, filters, selectedAccountFilterId, selectedShippingModeFilter], () => { currentPage.value = 1; }, { deep: true });

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
}

onMounted(async () => {
    await fetchMercadoLivreAccounts();
    if (isAuthReady.value && user.value) {
        await fetchSales();
    }
    watch(isAuthReady, async (ready) => {
        if (ready && user.value) {
            await fetchSales();
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
}

function clearFilters() {
    filters.accountId = null;
    filters.saleDateStart = '';
    filters.saleDateEnd = '';
    filters.shippingLimitStart = '';
    filters.shippingLimitEnd = '';
    searchQuery.value = '';
    selectedStatusFilter.value = null;
    selectedAccountFilterId.value = null;
    selectedShippingModeFilter.value = null;
}

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
}

.filter-btn-label {
    color: #6b7280;
}

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

.filter-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 1.5rem;
}

.btn-clear-filters {
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
    color: #e0e0ff;
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
