<template>
    <div class="main-container">
        <!-- Painel de Filtros Melhorado -->
        <div class="filters-panel-v2">
             <!-- Linha principal com filtros rápidos -->
            <div class="filters-main-row">
                <div class="filters-left-group">
                    <!-- Busca -->
                    <div class="search-wrapper">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                            class="search-icon">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input type="text" v-model="searchQuery" placeholder="Buscar por produto, SKU, usuário..."
                            class="search-input">
                    </div>

                    <!-- Filtro rápido: Status da Venda -->
                    <div class="filter-container" ref="saleStatusFilterContainerRef">
                        <button @click="toggleSaleStatusDropdown" class="btn btn-outline">
                            <span class="truncate pr-2">{{ selectedSaleStatusFilter ? `Venda: ${getSaleStatusLabel(selectedSaleStatusFilter)}` : 'Status da Venda' }}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 shrink-0 opacity-50">
                                <path d="m6 9 6 6 6-6"></path>
                            </svg>
                        </button>
                        <div v-if="isSaleStatusDropdownOpen" ref="saleStatusFilterDropdownRef" class="filter-popover">
                            <ul class="filter-popover-list">
                                <li @click="applySaleStatusFilter(null)">
                                    <span :class="{'font-bold': !selectedSaleStatusFilter}">Todos</span>
                                </li>
                                <li v-for="status in saleStatusOptions" :key="status.value" @click="applySaleStatusFilter(status.value)">
                                     <span :class="{'font-bold': selectedSaleStatusFilter === status.value}">{{ status.label }}</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <!-- Filtro rápido: Status de Expedição -->
                    <div class="filter-container" ref="statusFilterContainerRef">
                        <button @click="toggleStatusDropdown" class="btn btn-outline">
                            <span class="truncate pr-2">{{ selectedStatusFilter ? `Expedição: ${getStatusLabel(selectedStatusFilter)}` : 'Status de Expedição' }}</span>
                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 shrink-0 opacity-50">
                                <path d="m6 9 6 6 6-6"></path>
                            </svg>
                        </button>
                        <div v-if="isStatusDropdownOpen" ref="statusFilterDropdownRef" class="filter-popover">
                            <ul class="filter-popover-list">
                                <li @click="applyStatusFilter(null)">
                                    <span :class="{'font-bold': !selectedStatusFilter}">Todos</span>
                                </li>
                                <li v-for="status in systemStatuses" :key="status.value" @click="applyStatusFilter(status.value)">
                                    <span :class="{'font-bold': selectedStatusFilter === status.value}">{{ status.label }}</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <!-- Filtro de Conta -->
                    <div class="filter-container" ref="accountFilterContainerRef">
                        <button @click="isAccountDropdownOpen = !isAccountDropdownOpen" class="btn btn-outline">
                            <span class="truncate pr-2">{{ selectedAccountFilter ? `Conta: ${selectedAccountFilter}` : 'Conta' }}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 shrink-0 opacity-50">
                                <path d="m6 9 6 6 6-6"></path>
                            </svg>
                        </button>
                        <div v-if="isAccountDropdownOpen" class="filter-popover">
                            <div class="filter-popover-search">
                                <input type="text" v-model="accountSearchText" placeholder="Buscar conta..." class="filter-popover-input" />
                            </div>
                            <ul class="filter-popover-list">
                                <li @click="applyAccountFilter(null)">
                                    <span :class="{'font-bold': !selectedAccountFilter}">Todas</span>
                                </li>
                                <li v-for="acc in filteredAccountOptions" :key="acc" @click="applyAccountFilter(acc)">
                                    <span :class="{'font-bold': selectedAccountFilter === acc}">{{ acc }}</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                </div>
                <div class="filters-right-group">
                    <button @click="toggleAdvancedFilters" class="btn btn-ghost" :class="{'btn-ghost--active': showAdvancedFilters || hasActiveAdvancedFilters}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 h-4 w-4">
                            <path d="M3 6h18M7 12h10M10 18h4"></path>
                        </svg>
                        Filtros Avançados
                        <span v-if="hasActiveAdvancedFilters" class="filter-active-dot"></span>
                    </button>
                </div>
            </div>

            <!-- Filtros Avançados -->
            <div v-if="showAdvancedFilters" class="advanced-filters-content">
                <div class="advanced-filters-grid">
                    <!-- Busca por Cliente -->
                    <div class="filter-group">
                        <label for="buyer-search">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            Cliente / Comprador
                        </label>
                        <input id="buyer-search" type="text" v-model="buyerSearch" placeholder="Nome do comprador..." class="filter-text-input" />
                    </div>

                    <!-- Filtro por Modo de Envio -->
                    <div class="filter-group">
                        <label for="shipping-mode-select">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                            Modo de Envio
                        </label>
                        <select id="shipping-mode-select" v-model="filters.shippingMode" class="filter-select">
                            <option value="">Todos</option>
                            <option value="me1">Correios (me1)</option>
                            <option value="me2">Mercado Envios (me2)</option>
                            <option value="fulfillment">FULL (fulfillment)</option>
                            <option value="cross_docking">Coleta (cross docking)</option>
                            <option value="custom">Personalizado (custom)</option>
                        </select>
                    </div>

                    <!-- Data da Venda -->
                    <div class="filter-group date-range-group">
                        <label>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            Data da Venda
                        </label>
                        <div class="quick-date-btns">
                            <button @click="setDatePreset('sale', 'today')" :class="{'quick-btn--active': activeSaleDatePreset === 'today'}" class="quick-btn">Hoje</button>
                            <button @click="setDatePreset('sale', 'yesterday')" :class="{'quick-btn--active': activeSaleDatePreset === 'yesterday'}" class="quick-btn">Ontem</button>
                            <button @click="setDatePreset('sale', '7d')" :class="{'quick-btn--active': activeSaleDatePreset === '7d'}" class="quick-btn">7 dias</button>
                            <button @click="setDatePreset('sale', '30d')" :class="{'quick-btn--active': activeSaleDatePreset === '30d'}" class="quick-btn">30 dias</button>
                            <button @click="setDatePreset('sale', 'month')" :class="{'quick-btn--active': activeSaleDatePreset === 'month'}" class="quick-btn">Este mês</button>
                        </div>
                        <div class="date-inputs">
                            <input type="date" v-model="filters.saleDateStart">
                            <span>até</span>
                            <input type="date" v-model="filters.saleDateEnd">
                        </div>
                    </div>

                    <!-- Prazo de Expedição -->
                    <div class="filter-group date-range-group">
                        <label>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            Prazo de Expedição
                        </label>
                        <div class="quick-date-btns">
                            <button @click="setDatePreset('ship', 'today')" :class="{'quick-btn--active': activeShipDatePreset === 'today'}" class="quick-btn">Hoje</button>
                            <button @click="setDatePreset('ship', 'yesterday')" :class="{'quick-btn--active': activeShipDatePreset === 'yesterday'}" class="quick-btn">Ontem</button>
                            <button @click="setDatePreset('ship', 'tomorrow')" :class="{'quick-btn--active': activeShipDatePreset === 'tomorrow'}" class="quick-btn">Amanhã</button>
                            <button @click="setDatePreset('ship', '7d')" :class="{'quick-btn--active': activeShipDatePreset === '7d'}" class="quick-btn">7 dias</button>
                            <button @click="setDatePreset('ship', 'overdue')" :class="{'quick-btn--active': activeShipDatePreset === 'overdue'}" class="quick-btn quick-btn--danger">Atrasados</button>
                        </div>
                        <div class="date-inputs">
                            <input type="date" v-model="filters.shippingLimitStart">
                            <span>até</span>
                            <input type="date" v-model="filters.shippingLimitEnd">
                        </div>
                    </div>
                </div>
                 <div class="advanced-filters-actions">
                    <button @click="clearFilters" class="btn btn-secondary">Limpar Filtros</button>
                </div>
            </div>

            <!-- Ações da Tabela -->
            <div class="table-actions-bar">
                <div class="table-actions-left">
                    <button @click="processAllSales" class="btn btn-primary" :disabled="isProcessing">
                        <span v-if="isProcessing">Processando...</span>
                        <span v-else>Processar Vendas Filtradas</span>
                    </button>
                </div>
            </div>
        </div>


        <!-- Container da Tabela de Vendas -->
        <div class="sales-table-container">
            <div v-if="isLoading && sales.length === 0" class="loading-state">
                <p>Carregando vendas...</p>
            </div>
            <div v-else-if="error" class="error-state">
                <p>{{ error }}</p>
            </div>
            <div v-else-if="sales.length === 0" class="empty-state">
                <h3 class="empty-state-title">Nenhuma venda encontrada</h3>
                <p class="empty-state-text">Nenhum resultado para os filtros atuais.</p>
                <button @click="clearFilters" class="btn btn-secondary">Limpar Filtros</button>
            </div>
            <div v-else>
                <!-- Contador de resultados -->
                <div class="sale-cards-counter">
                    <span>Mostrando <strong>{{ sales.length }}</strong> de <strong>{{ totalSales }}</strong> vendas</span>
                    <span v-if="isLoading" class="sale-cards-counter__loading">Atualizando...</span>
                </div>
                <div class="sale-cards-list" ref="salesTableBodyRef">
                    <div v-for="sale in sales" :key="`${sale.id}-${sale.sku}`" 
                         class="sale-card"
                         :class="{ 'sale-card--cancelled': sale.sale_status === 'cancelled' }">
                        
                        <div class="sale-card__layout">
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
                                <!-- Trigger image load -->
                                <span style="display:none">{{ loadThumbTrigger(sale) }}</span>
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
                                <!-- Título do Produto (clicável) + Logo ML + Conta -->
                                <div class="sale-card__title-row">
                                    <a v-if="getProductLink(sale)" :href="getProductLink(sale)" target="_blank" rel="noopener" class="sale-card__product-link" :title="sale.product_title">
                                        {{ sale.product_title || 'Produto sem título' }}
                                    </a>
                                    <h3 v-else class="sale-card__product-title" :title="sale.product_title">
                                        {{ sale.product_title || 'Produto sem título' }}
                                    </h3>
                                    <div class="sale-card__badges">
                                        <img v-if="sale.channel?.toLowerCase() === 'ml'" src="/img/ml-logo.svg" alt="Mercado Livre" class="sale-card__ml-logo" />
                                        <span v-else class="sale-card__badge sale-card__badge--other">{{ sale.channel }}</span>
                                        <span class="sale-card__badge sale-card__badge--account">{{ sale.account_nickname }}</span>
                                    </div>
                                </div>

                                <!-- Specs: Status Venda | SKU | QTD -->
                                <div class="sale-card__specs">
                                    <span class="sale-card__spec">
                                        <span class="sale-card__spec-label">Venda:</span>
                                        <span class="sale-card__spec-value">
                                            {{ getSaleStatusLabel(sale.sale_status) }}
                                        </span>
                                    </span>
                                    <span class="sale-card__divider">|</span>
                                    <span class="sale-card__spec">
                                        <span class="sale-card__spec-label">Expedição:</span>
                                        <span class="sale-card__spec-value">
                                            <span :class="['status-badge', getStatusColorClass(sale.shipping_status)]"></span>
                                            {{ getStatusLabel(sale.shipping_status) }}
                                        </span>
                                    </span>
                                    <span class="sale-card__divider">|</span>
                                    <span class="sale-card__spec">
                                        <span class="sale-card__spec-label">SKU:</span>
                                        <span class="sale-card__spec-mono">{{ sale.sku || 'N/A' }}</span>
                                    </span>
                                    <span class="sale-card__divider">|</span>
                                    <span class="sale-card__spec">
                                        <span class="sale-card__spec-label">QTD:</span>
                                        <span class="sale-card__spec-value">{{ sale.quantity }}</span>
                                    </span>
                                </div>

                                <!-- Footer: Vendedor • Comprador • Modo Envio -->
                                <div class="sale-card__footer">
                                    <span class="sale-card__footer-item" title="Vendedor Resp.">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                        {{ sale.user_nickname || 'N/A' }}
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
                                     <span v-else class="sale-card__date-value" :class="{'sale-card__date-value--late': isLate(sale.sla_expected_date || sale.shipping_limit_date)}" title="Prazo de Expedição">
                                        LIMITE ENVIO: {{ formatDateTime(sale.sla_expected_date || sale.shipping_limit_date) || '—' }}
                                     </span>
                                     <span class="sale-card__exp-date" title="Data da Venda">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                        Venda: {{ formatDateTime(sale.sale_date) }}
                                     </span>
                                </div>
                                
                                <div class="sale-card__actions">
                                    <span v-if="sale.processed_at" class="sale-card__status-tag sale-card__status-tag--proc" :title="'Processado em: ' + formatDateTime(sale.processed_at)">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        Proc
                                    </span>
                                    <span v-else class="sale-card__status-tag sale-card__status-tag--pend">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                        Pend
                                    </span>

                                    <button v-if="getLabelInfo(sale).canPrint" @click="downloadLabel(getLabelInfo(sale).shipmentId, getLabelInfo(sale).sellerId, 'pdf')" class="btn-label pdf" title="Etiqueta PDF">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                        PDF
                                    </button>
                                    
                                    <button v-if="getLabelInfo(sale).canPrint" @click="downloadLabel(getLabelInfo(sale).shipmentId, getLabelInfo(sale).sellerId, 'zpl')" class="btn-label zpl" title="Etiqueta ZPL">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><polyline points="6 14 18 14 18 22 6 22"></polyline></svg>
                                        ZPL
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="pagination-controls" v-if="totalPages > 1">
                    <button @click="goToPage(currentPage - 1)" :disabled="currentPage <= 1 || isLoading">Anterior</button>
                    <span>Página {{ currentPage }} de {{ totalPages }} ({{ totalSales }} vendas)</span>
                    <button @click="goToPage(currentPage + 1)" :disabled="currentPage >= totalPages || isLoading">Próximo</button>
                </div>
            </div>
        </div>


        <UniversalModal :is-open="isSummaryModalOpen" :title="summaryModalTitle" @close="isSummaryModalOpen = false">
            <div class="summary-modal-content" v-html="summaryModalContent"></div>
            <div class="modal-actions">
                <button @click="isSummaryModalOpen = false" class="btn btn-primary">Fechar</button>
            </div>
        </UniversalModal>

    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, reactive } from 'vue';
import { useMasterSales } from '@/composables/useMasterSales';
import { useUserStorage } from '@/composables/useUserStorage';
import { useSystemStatus } from '@/composables/useSystemStatus';
import { useLabels } from '@/composables/useLabels';
import { useApi } from '@/composables/useApi';
import UniversalModal from './UniversalModal.vue';

// ===== UTILITY FUNCTIONS FOR CUSTOMER DATA =====

/**
 * Extrai o nome do cliente dos dados da API do Mercado Livre
 * @param {Object} sale - Objeto da venda contendo raw_api_data
 * @returns {string} Nome do cliente ou 'N/A' se não disponível
 */
function getCustomerName(sale) {
    try {
        // Use flat buyer fields from server-side extraction
        if (sale.buyer_first_name && sale.buyer_last_name) {
            return `${sale.buyer_first_name} ${sale.buyer_last_name}`.trim();
        }
        if (sale.buyer_first_name) return sale.buyer_first_name.trim();
        if (sale.buyer_nickname) return sale.buyer_nickname.trim();
        
        // Fallback to raw_api_data if available
        const buyer = sale?.raw_api_data?.buyer;
        if (buyer?.first_name && buyer?.last_name) {
            return `${buyer.first_name} ${buyer.last_name}`.trim();
        }
        if (buyer?.nickname) return buyer.nickname.trim();
        if (buyer?.id) return `Cliente #${buyer.id}`;
        
        return 'N/A';
    } catch (error) {
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

const { sales, isLoading, error, totalSales, currentPage, totalPages, fetchSales, processSales: processSalesApi } = useMasterSales();
const { skus, loadStorageData } = useUserStorage();
const { statuses, fetchStatuses } = useSystemStatus();
const { downloadLabel, getLabelInfo } = useLabels();
const { get: apiGet } = useApi();

const searchQuery = ref('');
const isProcessing = ref(false);
const isSummaryModalOpen = ref(false);
const summaryModalTitle = ref('');
const summaryModalContent = ref('');

const showAdvancedFilters = ref(false);

const selectedSaleStatusFilter = ref(null);
const isSaleStatusDropdownOpen = ref(false);
const saleStatusFilterContainerRef = ref(null);
const saleStatusFilterDropdownRef = ref(null);

const selectedStatusFilter = ref(null);
const isStatusDropdownOpen = ref(false);
const statusFilterContainerRef = ref(null);
const statusFilterDropdownRef = ref(null);

const selectedAccountFilter = ref(null);
const isAccountDropdownOpen = ref(false);
const accountFilterContainerRef = ref(null);
const accountSearchText = ref('');

const buyerSearch = ref('');
let buyerDebounce = null;

const activeSaleDatePreset = ref(null);
const activeShipDatePreset = ref(null);

const filters = reactive({
    saleDateStart: '',
    saleDateEnd: '',
    shippingLimitStart: '',
    shippingLimitEnd: '',
    shippingMode: '',
});

const accountOptions = computed(() => {
    const set = new Set();
    if (Array.isArray(sales.value)) {
        sales.value.forEach(s => { if (s.account_nickname) set.add(s.account_nickname); });
    }
    return Array.from(set).sort();
});

const filteredAccountOptions = computed(() => {
    const q = accountSearchText.value.toLowerCase();
    if (!q) return accountOptions.value;
    return accountOptions.value.filter(a => a.toLowerCase().includes(q));
});

const hasActiveAdvancedFilters = computed(() => {
    return !!(filters.saleDateStart || filters.saleDateEnd || filters.shippingLimitStart || filters.shippingLimitEnd || buyerSearch.value);
});

function applyAccountFilter(acc) {
    selectedAccountFilter.value = acc;
    isAccountDropdownOpen.value = false;
    triggerServerFetch(true);
}

function formatDateLocal(d) {
    return d.toISOString().slice(0, 10);
}

function setDatePreset(type, preset) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let start, end;

    if (preset === 'today') {
        start = end = formatDateLocal(today);
    } else if (preset === 'yesterday') {
        const d = new Date(today); d.setDate(d.getDate() - 1);
        start = end = formatDateLocal(d);
    } else if (preset === 'tomorrow') {
        const d = new Date(today); d.setDate(d.getDate() + 1);
        start = end = formatDateLocal(d);
    } else if (preset === '7d') {
        const d = new Date(today); d.setDate(d.getDate() - 7);
        start = formatDateLocal(d); end = formatDateLocal(today);
    } else if (preset === '30d') {
        const d = new Date(today); d.setDate(d.getDate() - 30);
        start = formatDateLocal(d); end = formatDateLocal(today);
    } else if (preset === 'month') {
        const d = new Date(today.getFullYear(), today.getMonth(), 1);
        start = formatDateLocal(d); end = formatDateLocal(today);
    } else if (preset === 'overdue') {
        const d = new Date(2020, 0, 1);
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
        start = formatDateLocal(d); end = formatDateLocal(yesterday);
    }

    if (type === 'sale') {
        // Toggle off if same preset
        if (activeSaleDatePreset.value === preset) {
            activeSaleDatePreset.value = null;
            filters.saleDateStart = '';
            filters.saleDateEnd = '';
        } else {
            activeSaleDatePreset.value = preset;
            filters.saleDateStart = start;
            filters.saleDateEnd = end;
        }
    } else {
        if (activeShipDatePreset.value === preset) {
            activeShipDatePreset.value = null;
            filters.shippingLimitStart = '';
            filters.shippingLimitEnd = '';
        } else {
            activeShipDatePreset.value = preset;
            filters.shippingLimitStart = start;
            filters.shippingLimitEnd = end;
        }
    }
}

const normalizeSku = (sku) => (sku || '').trim().toUpperCase();

const stockSkuSet = computed(() => {
    if (!Array.isArray(skus.value)) return new Set();
    return new Set(skus.value.map(s => normalizeSku(s.sku)));
});

// Debounce search
let searchDebounce = null;
function triggerServerFetch(resetPage = true) {
    if (resetPage) currentPage.value = 1;
    fetchSales({
        page: currentPage.value,
        search: searchQuery.value || undefined,
        shippingStatus: selectedStatusFilter.value || undefined,
        saleStatus: selectedSaleStatusFilter.value || undefined,
        saleDateStart: filters.saleDateStart || undefined,
        saleDateEnd: filters.saleDateEnd || undefined,
        account: selectedAccountFilter.value || undefined,
        buyer: buyerSearch.value || undefined,
        shippingLimitStart: filters.shippingLimitStart || undefined,
        shippingLimitEnd: filters.shippingLimitEnd || undefined,
        shippingMode: filters.shippingMode || undefined,
    });
}

watch(searchQuery, () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => triggerServerFetch(true), 400);
});

watch(buyerSearch, () => {
    clearTimeout(buyerDebounce);
    buyerDebounce = setTimeout(() => triggerServerFetch(true), 400);
});

watch([selectedSaleStatusFilter, selectedStatusFilter, () => filters.shippingMode], () => triggerServerFetch(true));
watch([() => filters.saleDateStart, () => filters.saleDateEnd, () => filters.shippingLimitStart, () => filters.shippingLimitEnd], () => {
    activeSaleDatePreset.value = null;
    activeShipDatePreset.value = null;
    triggerServerFetch(true);
});

// Pagination
function goToPage(page) {
    if (page < 1 || page > totalPages.value) return;
    currentPage.value = page;
    triggerServerFetch(false);
}

const saleStatusOptions = computed(() => {
    return [
        { value: 'paid', label: 'Pago' },
        { value: 'ready_to_ship', label: 'Pronto para Envio' },
        { value: 'shipped', label: 'Enviado' },
        { value: 'delivered', label: 'Entregue' },
        { value: 'cancelled', label: 'Cancelado' },
    ];
});

function isLate(dateString) {
    if (!dateString) return false;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return false;
    return date < new Date();
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date)) return 'Data inválida';
    return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const getStatusLabel = (s) => {
    // First check system statuses 
    const found = systemStatuses.value.find(cs => cs.value === s);
    if (found) return found.label.replace(/_/g, ' ');
    // PT-BR fallback
    const ptMap = {
        pending: 'Pendente', ready_to_ship: 'Pronto para Envio', shipped: 'Enviado',
        delivered: 'Entregue', cancelled: 'Cancelado', handling: 'Em Manuseio',
        'ready_to_print': 'Imprimir Etiqueta', 'ready_to_pack': 'Preparar Envio',
        'in_transit': 'Em Trânsito', 'out_for_delivery': 'Saiu para Entrega',
        null: 'Pendente', undefined: 'Pendente', '': 'Pendente',
    };
    const key = (s || '').toLowerCase();
    return ptMap[key] || (key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '));
};

function getSaleStatusLabel(statusValue) {
    if (!statusValue) return 'Pendente';
    const map = {
        paid: 'Pago', ready_to_ship: 'Pronto para Envio', shipped: 'Enviado',
        delivered: 'Entregue', cancelled: 'Cancelado', canceled: 'Cancelado',
        pending: 'Pendente', handling: 'Em Manuseio',
    };
    const key = String(statusValue).toLowerCase();
    return map[key] || (key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '));
}

function getStatusColorClass(statusValue) {
    const valueLower = (statusValue || '').toLowerCase();
    if (valueLower === 'pendente' || valueLower === 'pending') return 'status-badge-gray';
    if (valueLower.includes('imprimir') || valueLower.includes('print')) return 'status-badge-indigo';
    if (valueLower.includes('preparar') || valueLower.includes('pack')) return 'status-badge-yellow';
    if (valueLower.includes('despachado')) return 'status-badge-red';
    if (valueLower.includes('embalado')) return 'status-badge-cyan';
    if (valueLower.includes('aguardando') || valueLower.includes('handling')) return 'status-badge-purple';
    if (valueLower.includes('enviado') || valueLower.includes('shipped') || valueLower.includes('transit')) return 'status-badge-green';
    if (valueLower.includes('coleta')) return 'status-badge-orange';
    if (valueLower.includes('delivered') || valueLower.includes('entregue')) return 'status-badge-green';
    return 'status-badge-default';
}

function toggleAdvancedFilters() { showAdvancedFilters.value = !showAdvancedFilters.value; }
function toggleSaleStatusDropdown() { isSaleStatusDropdownOpen.value = !isSaleStatusDropdownOpen.value; }
function applySaleStatusFilter(statusValue) { selectedSaleStatusFilter.value = statusValue; isSaleStatusDropdownOpen.value = false; }
function toggleStatusDropdown() { isStatusDropdownOpen.value = !isStatusDropdownOpen.value; }
function applyStatusFilter(statusValue) { 
    selectedStatusFilter.value = statusValue; 
    isStatusDropdownOpen.value = false; 
}

function clearFilters() {
    filters.saleDateStart = '';
    filters.saleDateEnd = '';
    filters.shippingLimitStart = '';
    filters.shippingLimitEnd = '';
    filters.shippingMode = '';
    searchQuery.value = '';
    buyerSearch.value = '';
    selectedStatusFilter.value = null;
    selectedSaleStatusFilter.value = null;
    selectedAccountFilter.value = null;
    activeSaleDatePreset.value = null;
    activeShipDatePreset.value = null;
    triggerServerFetch(true);
}

async function processAllSales() {
    isProcessing.value = true;
    try {
        await loadStorageData();
        const salesToProcess = sales.value.filter(sale => {
            const saleSku = normalizeSku(sale.sku);
            const isSkuInStock = saleSku && stockSkuSet.value.has(saleSku);
            return !sale.processed_at && isSkuInStock;
        });

        if (salesToProcess.length === 0) {
            summaryModalTitle.value = 'Nenhuma Venda para Processar';
            summaryModalContent.value = '<p>Não foi encontrada nenhuma venda pendente com SKU correspondente no estoque para os filtros atuais.</p>';
            isSummaryModalOpen.value = true;
            return;
        }

        const results = await processSalesApi(salesToProcess);
        summaryModalTitle.value = 'Resumo do Processamento';
        let contentHtml = `<p>O processamento de ${salesToProcess.length} vendas foi concluído.</p>`;
        if (results.success?.length > 0) {
            contentHtml += `<div class="summary-section success"><h4>Processadas: ${results.success.length}</h4><ul>`;
            results.success.forEach(s => { contentHtml += `<li>Venda #${s.saleId} (SKU: ${s.sku})</li>`; });
            contentHtml += `</ul></div>`;
        }
        if (results.failed?.length > 0) {
            contentHtml += `<div class="summary-section failed"><h4>Falharam: ${results.failed.length}</h4><ul>`;
            results.failed.forEach(f => { contentHtml += `<li>Venda #${f.saleId} (SKU: ${f.sku}): <strong>${f.reason}</strong></li>`; });
            contentHtml += `</ul></div>`;
        }
        summaryModalContent.value = contentHtml;
        isSummaryModalOpen.value = true;

    } catch (err) {
        summaryModalTitle.value = 'Erro no Processamento';
        summaryModalContent.value = `<p>Ocorreu um erro inesperado:</p><p class="error-text">${err.message}</p>`;
        isSummaryModalOpen.value = true;
    } finally {
        triggerServerFetch(false);
        isProcessing.value = false;
    }
}

function handleClickOutside(event) {
    const target = event.target;
    if (saleStatusFilterContainerRef.value && !saleStatusFilterContainerRef.value.contains(target)) { isSaleStatusDropdownOpen.value = false; }
    if (statusFilterContainerRef.value && !statusFilterContainerRef.value.contains(target)) { isStatusDropdownOpen.value = false; }
    if (accountFilterContainerRef.value && !accountFilterContainerRef.value.contains(target)) { isAccountDropdownOpen.value = false; }
}

function getLabelInfo(sale) {
    // With server-side data, shipping_id comes as a direct field
    const saleWithShipping = {
        ...sale,
        raw_api_data: {
            shipping: { id: sale.shipping_id },
        }
    };
    return composableLabelInfo(saleWithShipping);
}

onMounted(() => { 
    document.addEventListener('click', handleClickOutside); 
    triggerServerFetch(false);
});
onUnmounted(() => { document.removeEventListener('click', handleClickOutside); });

// ML Data Helpers
function getProductLink(sale) {
    if (sale.product_permalink) return sale.product_permalink;
    
    // Tenta extrair do raw_api_data se disponível
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

const loadedThumbs = reactive({});
function loadThumbTrigger(sale) {
    if (sale.product_thumbnail) return '';
    
    let itId = sale.ml_item_id;

    // Se não tiver ID direto, tenta achar nos dados brutos pelo SKU
    if (!itId && sale.raw_api_data?.order_items) {
        const itemObj = sale.raw_api_data.order_items.find(it => it.item?.seller_sku === sale.sku || it.item?.id === sale.sku);
        if (itemObj?.item?.id) itId = itemObj.item.id;
    }

    if (itId && String(itId).toUpperCase().startsWith('MLB')) {
        const idStr = String(itId).toUpperCase();
        if (!loadedThumbs[idStr]) {
            loadedThumbs[idStr] = 'loading';
            
            // Usando o proxy do backend para evitar Erro 403 (PolicyAgent)
            apiGet(`/ml/item-thumbnail/${idStr}`)
                .then(data => {
                    if (data && data.thumbnail) {
                        loadedThumbs[idStr] = data.thumbnail;
                    } else {
                        loadedThumbs[idStr] = 'error';
                    }
                })
                .catch(() => {
                    loadedThumbs[idStr] = 'error';
                });
        }
    }
    return '';
}

function getThumbUrl(sale) {
    if (sale.product_thumbnail) {
        return sale.product_thumbnail.replace('http://', 'https://');
    }

    let itId = sale.ml_item_id;
    if (!itId && sale.raw_api_data?.order_items) {
        const itemObj = sale.raw_api_data.order_items.find(it => it.item?.seller_sku === sale.sku || it.item?.id === sale.sku);
        if (itemObj?.item?.id) itId = itemObj.item.id;
    }

    if (itId) {
        const idStr = String(itId).toUpperCase();
        const tb = loadedThumbs[idStr];
        if (tb && tb !== 'loading' && tb !== 'error') {
            return tb.replace('http://', 'https://');
        }
    }
    return null;
}

</script>

<style scoped>
/* ============================================= */
/* NOVO PAINEL DE FILTROS (V2)          */
/* ============================================= */
.filters-panel-v2 {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    padding: 1rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.filters-main-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
}

.filters-left-group, .filters-right-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.search-wrapper {
    position: relative;
    min-width: 250px;
    flex-grow: 1;
}

.search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1rem;
    height: 1rem;
    color: #9ca3af;
}

.search-input {
    background-color: #fff;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    padding: 0.5rem 0.75rem 0.5rem 2.25rem;
    font-size: 0.875rem;
    width: 100%;
    transition: box-shadow 0.2s, border-color 0.2s;
}
.search-input:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
}

.filter-container {
    position: relative;
}

.filter-popover {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    z-index: 50;
    min-width: 200px;
    background-color: #fff;
    border-radius: 0.5rem;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
    overflow: hidden;
    animation: fadeIn 0.1s ease-out;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
}

.filter-popover-list {
    list-style: none;
    margin: 0;
    padding: 0.5rem;
    max-height: 250px;
    overflow-y: auto;
}

.filter-popover-list li {
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    color: #374151;
    cursor: pointer;
    border-radius: 0.375rem;
    transition: background-color 0.2s;
}
.filter-popover-list li:hover {
    background-color: #f3f4f6;
}

.advanced-filters-content {
    background-color: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    padding: 1.5rem;
    margin-top: 0.5rem;
}

.advanced-filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    align-items: end;
}
.advanced-filters-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0;
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
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid #d1d5db;
    background-color: #fff;
}

.date-inputs {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.quick-date-btns {
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
    margin-bottom: 0.5rem;
}

.quick-btn {
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #e2e8f0;
    padding: 0.2rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.quick-btn:hover {
    background: #e2e8f0;
}

.quick-btn--active {
    background: #3b82f6;
    color: #fff;
    border-color: #3b82f6;
}

.quick-btn--danger {
    color: #dc2626;
    border-color: #fca5a5;
    background: #fef2f2;
}
.quick-btn--danger.quick-btn--active {
    background: #dc2626;
    color: white;
}

.filter-active-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    background-color: #ef4444;
    border-radius: 50%;
    margin-left: 6px;
}
.btn-ghost--active {
    background-color: #e0e7ff;
    color: #4338ca;
}

.filter-popover-search {
    padding: 0.5rem;
    border-bottom: 1px solid #e2e8f0;
}
.filter-popover-input {
    width: 100%;
    padding: 0.4rem;
    font-size: 0.8rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
}
.filter-popover-input:focus {
    outline: none;
    border-color: #3b82f6;
}

.filter-text-input {
    width: 100%;
}
.filter-group label svg {
    margin-right: 4px;
    display: inline-block;
    vertical-align: text-bottom;
}

.table-actions-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
    padding: 1rem;
    background-color: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
}
.table-actions-left, .table-actions-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
}

/* ============================================= */
/* COMPONENTES DE UI                */
/* ============================================= */
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    padding: 0.5rem 1rem;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;
}
.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn-primary {
    background-color: #1e293b;
    color: #fff;
    border-color: #1e293b;
}
.btn-primary:hover:not(:disabled) {
    background-color: #334155;
}

.btn-secondary {
    background-color: #e2e8f0;
    color: #1e293b;
    border-color: #e2e8f0;
}
.btn-secondary:hover:not(:disabled) {
    background-color: #d1d5db;
}

.btn-outline {
    background-color: #fff;
    color: #374151;
    border-color: #d1d5db;
}
.btn-outline:hover:not(:disabled) {
    background-color: #f9fafb;
    border-color: #9ca3af;
}

.btn-ghost {
    background-color: transparent;
    color: #374151;
    border-color: transparent;
}
.btn-ghost:hover:not(:disabled) {
    background-color: #f3f4f6;
}

/* ============================================= */
/* ESTILOS LEGADOS                   */
/* ============================================= */
.main-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}
.sales-table-container { background-color: #fff; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden; }
.table-wrapper { width: 100%; overflow-x: auto; }
.sales-table { width: 100%; min-width: 1450px; border-collapse: collapse; }
.sales-table th, .sales-table td { padding: 1rem 1.25rem; border-bottom: 1px solid #e5e7eb; text-align: left; white-space: nowrap; }
.sales-table th { background-color: #f9fafb; font-weight: 600; color: #4b5563; text-transform: uppercase; font-size: 0.75rem; }
.sales-table tbody tr:hover { background-color: #f3f4f6; }
.product-title, .sku-cell { max-width: 250px; overflow: hidden; text-overflow: ellipsis; cursor: pointer; }
.channel-badge.ml { background-color: #ffe600; color: #333; padding: 0.25rem 0.6rem; font-size: 0.75rem; font-weight: 500; border-radius: 9999px; }
.status-badge { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.status-badge-default { background-color: #d1d5db; }
.status-badge-green { background-color: #22c55e; }
.status-badge-yellow { background-color: #f59e0b; }
.status-badge-red { background-color: #ef4444; }
.status-badge-gray { background-color: #6b7280; }
.status-badge-indigo { background-color: #6366f1; }
.status-badge-purple { background-color: #8b5cf6; }
.status-badge-cyan { background-color: #06b6d4; }
.status-badge-orange { background-color: #f97316; }
.pagination-controls { display: flex; justify-content: center; align-items: center; gap: .75rem; padding: 1rem; border-top: 1px solid #e5e7eb; }
.pagination-controls button { padding: .5rem .9rem; border: 1px solid #e5e7eb; border-radius: .5rem; background-color: #ffffff; cursor: pointer; }
.pagination-controls button:disabled { opacity: .5; cursor: not-allowed; }
.loading-state, .error-state, .empty-state { text-align: center; padding: 4rem 2rem; color: #6b7280; }
.empty-state-title { font-size: 1.25rem; font-weight: 600; color: #111827; }
.custom-tooltip { position: fixed; background-color: #1f2937; color: #fff; padding: 0.6rem 0.8rem; border-radius: 0.5rem; font-size: 0.8rem; z-index: 1000; pointer-events: none; visibility: hidden; opacity: 0; }
.tooltip-arrow { position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 6px solid #1f2937; }
.tag { padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
.tag.processed { background-color: #dcfce7; color: #166534; }
.tag.unprocessed { background-color: #fee2e2; color: #991b1b; }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
.summary-modal-content .error-text { background-color: #fee2e2; color: #991b1b; padding: 0.75rem; border-radius: 0.5rem; }
.status-select-trigger.compact { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0.5rem; border: 1px solid transparent; border-radius: .375rem; }
.cancelled-sale { background-color: #fee2e2 !important; }
.cancelled-sale:hover { background-color: #fecaca !important; }
.label-actions { display: flex; gap: 0.5rem; align-items: center; justify-content: center; }
.btn-label { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.25rem 0.5rem; font-size: 0.75rem; font-weight: 500; border: 1px solid; border-radius: 0.375rem; cursor: pointer; transition: all 0.2s; text-decoration: none; }
.btn-label.pdf { background-color: #fef2f2; border-color: #fecaca; color: #dc2626; }
.btn-label.pdf:hover { background-color: #fee2e2; border-color: #fca5a5; }
.btn-label.zpl { background-color: #f0f9ff; border-color: #bae6fd; color: #0284c7; }
.btn-label.zpl:hover { background-color: #e0f2fe; border-color: #7dd3fc; }
.btn-label svg { width: 12px; height: 12px; }
.label-unavailable { color: #9ca3af; font-size: 0.875rem; }

/* ============================================= */
/* CARD-BASED SALES LIST LAYOUT         */
/* ============================================= */
.sale-cards-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

/* Counter */
.sale-cards-counter {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    font-size: 0.875rem;
    color: #64748b;
}
.sale-cards-counter strong {
    color: #1e293b;
}
.sale-cards-counter__loading {
    color: #3b82f6;
    font-weight: 500;
    animation: pulse-fade 1.2s ease-in-out infinite;
}
@keyframes pulse-fade {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
}

.sale-card {
    background-color: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    padding: 1rem 1.25rem;
    transition: box-shadow 0.2s ease, border-color 0.2s ease;
}
.sale-card:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    border-color: #cbd5e1;
}
.sale-card--cancelled {
    opacity: 0.55;
    background-color: #fef2f2;
    border-color: #fecaca;
}

.sale-card__layout {
    display: flex;
    justify-content: space-between;
    gap: 1.5rem;
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
.sale-card__thumb-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.sale-card__thumb-placeholder {
    color: #cbd5e1;
    display: flex;
    align-items: center;
    justify-content: center;
}

.sale-card__main {
    flex: 1;
    min-width: 0;
}

/* ID Row */
.sale-card__id-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
}

.sale-card__id-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.5rem;
    background-color: #f1f5f9;
    color: #64748b;
    border-radius: 0.375rem;
    font-size: 11px;
    font-family: 'SFMono-Regular', Consolas, monospace;
    border: 1px solid #e2e8f0;
    cursor: pointer;
    transition: background-color 0.15s;
}
.sale-card__id-tag:hover {
    background-color: #e2e8f0;
}

.sale-card__id-label {
    opacity: 0.65;
}
.sale-card__id-value {
    font-weight: 600;
}

.sale-card__date-mobile {
    font-size: 0.75rem;
    color: #94a3b8;
    font-weight: 500;
    display: none;
}

/* Title Row */
.sale-card__title-row {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
}

.sale-card__product-title,
.sale-card__product-link {
    font-size: 1.05rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
    max-width: 550px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.4;
}
.sale-card__product-link {
    text-decoration: none;
    transition: color 0.15s;
}
.sale-card__product-link:hover {
    color: #3b82f6;
    text-decoration: underline;
}

.sale-card__badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    align-items: center;
    flex-shrink: 0;
}

/* ML Logo */
.sale-card__ml-logo {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    flex-shrink: 0;
}

.sale-card__badge {
    padding: 0.125rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    border: 1px solid;
    letter-spacing: 0.025em;
}
.sale-card__badge--other {
    background-color: #f8fafc;
    color: #475569;
    border-color: #e2e8f0;
}
.sale-card__badge--account {
    background-color: #eef2ff;
    color: #4338ca;
    border-color: #c7d2fe;
}

/* Specs Row */
.sale-card__specs {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.25rem 1rem;
    font-size: 0.9rem;
    color: #475569;
    margin-bottom: 0.75rem;
}

.sale-card__spec {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
}
.sale-card__spec-label {
    font-size: 0.8rem;
    color: #94a3b8;
}
.sale-card__spec-value {
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    color: #1e293b;
}
.sale-card__spec-mono {
    font-family: 'SFMono-Regular', Consolas, monospace;
    color: #475569;
    font-size: 0.8rem;
}
.sale-card__divider {
    color: #cbd5e1;
    user-select: none;
}

/* Footer */
.sale-card__footer {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.25rem 0.75rem;
    font-size: 12px;
    color: #64748b;
    text-transform: uppercase;
    font-weight: 500;
    letter-spacing: 0.04em;
}

.sale-card__footer-item {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
}
.sale-card__footer-item svg {
    flex-shrink: 0;
}
.sale-card__footer-dot {
    opacity: 0.4;
    user-select: none;
}

/* Aside (Right Column) */
.sale-card__aside {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: space-between;
    flex-shrink: 0;
    min-width: 200px;
}

.sale-card__date-block {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
    margin-bottom: 0.75rem;
}

.sale-card__date-value {
    font-size: 0.95rem;
    font-weight: 700;
    color: #1e293b;
}

.sale-card__date-value--late {
    color: #dc2626;
}

.sale-card__exp-date {
    font-size: 12px;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-weight: 500;
    color: #64748b;
}

/* Actions */
.sale-card__actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.sale-card__status-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.625rem;
    border-radius: 0.375rem;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    border: 1px solid;
}
.sale-card__status-tag--proc {
    color: #15803d;
    background-color: #f0fdf4;
    border-color: #bbf7d0;
}
.sale-card__status-tag--pend {
    color: #b45309;
    background-color: #fffbeb;
    border-color: #fde68a;
}

/* Responsive: mobile */
@media (max-width: 768px) {
    .sale-card__layout {
        flex-wrap: wrap;
        gap: 1rem;
    }
    .sale-card__thumb {
        width: 44px;
        height: 44px;
    }
    .sale-card__aside {
        width: 100%;
        align-items: flex-start;
        border-top: 1px solid #f1f5f9;
        padding-top: 0.75rem;
        min-width: 0;
    }
    .sale-card__date-block {
        align-items: flex-start;
        display: none;
    }
    .sale-card__date-mobile {
        display: inline;
    }
    .sale-card__actions {
        justify-content: flex-start;
    }
    .sale-card__product-title,
    .sale-card__product-link {
        max-width: 100%;
    }
}
</style>


