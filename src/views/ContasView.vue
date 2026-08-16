<template>
  <div class="dashboard-wrapper" ref="rootRef">
    <SidebarComponent />

    <div class="main-content">
      <TopbarComponent />

      <div class="dashboard-content">
        <div class="header" ref="headerRef">
          <div class="header__intro">
            <h1 class="dashboard-title">Gerenciar Contas</h1>
            <p class="dashboard-subtitle">Conecte suas contas de marketplace para sincronizar vendas automaticamente.</p>
            <div class="header__marketplaces">
              <span class="mk-chip">
                <img src="/img/ml-logo.svg" alt="Mercado Livre" class="mk-chip__logo" />
                Mercado Livre
              </span>
              <span class="mk-chip">
                <img src="/img/shopee-logo.svg" alt="Shopee" class="mk-chip__logo" />
                Shopee
              </span>
            </div>
          </div>
          <div class="header-actions">
            <MercadoLivreConnect />
            <ShopeeConnect />
          </div>
        </div>

        <div v-if="!isLoading" class="stats-row">
          <div class="stat-card">
            <span class="stat-card__icon stat-card__icon--total">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>
            </span>
            <div class="stat-card__body">
              <span class="stat-card__value">{{ totalAccounts }}</span>
              <span class="stat-card__label">Contas conectadas</span>
            </div>
          </div>

          <div class="stat-card">
            <span class="stat-card__icon stat-card__icon--ml">
              <img src="/img/ml-logo.svg" alt="" class="stat-card__logo" />
            </span>
            <div class="stat-card__body">
              <span class="stat-card__value">{{ accounts.mercadoLivre.length }}</span>
              <span class="stat-card__label">Mercado Livre</span>
            </div>
          </div>

          <div class="stat-card">
            <span class="stat-card__icon stat-card__icon--shopee">
              <img src="/img/shopee-logo.svg" alt="" class="stat-card__logo" />
            </span>
            <div class="stat-card__body">
              <span class="stat-card__value">{{ accounts.shopee.length }}</span>
              <span class="stat-card__label">Shopee</span>
            </div>
          </div>

          <div class="stat-card">
            <span class="stat-card__icon stat-card__icon--active">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            </span>
            <div class="stat-card__body">
              <span class="stat-card__value">{{ activeAccountsCount }}</span>
              <span class="stat-card__label">Ativas</span>
            </div>
          </div>
        </div>

        <div class="accounts-list-wrapper">
          <div v-if="isLoading">
            <div class="section-head">
              <div class="skeleton-line" style="width: 190px; height: 20px;"></div>
            </div>
            <div class="accounts-grid">
              <div v-for="n in 3" :key="'skel-' + n" class="skeleton-card">
                <div class="skeleton-header">
                  <div class="skeleton-line icon"></div>
                  <div class="skeleton-line title"></div>
                </div>
                <div class="skeleton-line text short"></div>
                <div class="skeleton-actions">
                  <div class="skeleton-line button"></div>
                </div>
              </div>
            </div>
          </div>

          <div v-else>
            <!-- ================= MERCADO LIVRE ================= -->
            <section v-if="accounts.mercadoLivre.length > 0" class="platform-section">
              <div class="section-head" ref="listTitleRef">
                <div class="section-head__brand">
                  <span class="section-head__logo section-head__logo--ml">
                    <img src="/img/ml-logo.svg" alt="Mercado Livre" />
                  </span>
                  <div>
                    <h2 class="section-head__title">Mercado Livre</h2>
                    <p class="section-head__sub">{{ accounts.mercadoLivre.length }} conta(s) conectada(s)</p>
                  </div>
                </div>
              </div>

              <div class="accounts-grid" ref="mlGrid">
                <article
                  v-for="account in accounts.mercadoLivre"
                  :key="account.user_id"
                  class="account-card account-card--ml"
                  @mouseenter="hoverCard($event, true)"
                  @mouseleave="hoverCard($event, false)"
                >
                  <span class="account-card__stripe account-card__stripe--ml" aria-hidden="true"></span>

                  <header class="account-card__top">
                    <div class="account-card__identity">
                      <span class="account-card__avatar account-card__avatar--ml">
                        <img src="/img/ml-logo.svg" alt="Mercado Livre" />
                      </span>
                      <div class="account-card__names">
                        <span class="account-nickname" :title="account.nickname">{{ account.nickname }}</span>
                        <span class="account-id">ID {{ account.user_id }}</span>
                      </div>
                    </div>

                    <div class="status-pill" :data-status="account.status">
                      <span class="status-dot" :class="account.status"></span>
                      {{ getStatusText(account.status) }}
                    </div>
                  </header>

                  <div class="account-card__meta">
                    <span class="meta-item">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                      Conectada em {{ formatDate(account.connected_at) }}
                    </span>
                  </div>

                  <footer class="account-card__foot">
                    <button
                      @mousedown="press"
                      @click="handleSyncMl(account)"
                      class="btn-sync"
                      :disabled="syncState.isSyncing"
                      title="Sincronizar vendas desta conta"
                    >
                      <svg class="btn-sync__icon" :class="{ 'is-spinning': syncState.isSyncing }" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /><polyline points="21 3 21 9 15 9" /></svg>
                      {{ syncState.isSyncing ? 'Sincronizando...' : 'Sincronizar' }}
                    </button>

                    <div class="account-actions">
                      <button
                        @mousedown="press"
                        @click="toggleDetails(account)"
                        class="action-btn"
                        :aria-label="account.isExpanded ? 'Ocultar detalhes' : 'Mostrar detalhes'"
                        :title="account.isExpanded ? 'Ocultar detalhes' : 'Mostrar detalhes'"
                      >
                        <svg class="details-toggle__chev" :class="{ 'is-open': account.isExpanded }" xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                      </button>
                      <button
                        v-if="userRole === 'master'"
                        @mousedown="press"
                        @click="requestDelete(account, 'ml')"
                        class="action-btn delete-btn"
                        aria-label="Excluir Conta"
                        title="Excluir Conta"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>
                      </button>
                    </div>
                  </footer>

                  <Transition @enter="onEnter" @leave="onLeave">
                    <div v-if="account.isExpanded" class="details-content">
                      <div class="token-info">
                        <label>Access Token</label>
                        <div class="token-value">
                          <code>{{ account.showAccessToken ? account.access_token : maskToken(account.access_token) }}</code>
                          <button @mousedown="press" @click="account.showAccessToken = !account.showAccessToken" class="copy-btn" aria-label="Mostrar/Ocultar Access Token" title="Mostrar/Ocultar">
                            <svg v-if="!account.showAccessToken" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                            <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.9 9.9 4.2 4.2" /><path d="m14.1 14.1 5.7 5.7" /><path d="M2 12s-3 7-10 7a9.84 9.84 0 0 1 5 1.4" /><path d="M22 12s-3 7-10 7a9.84 9.84 0 0 1-5-1.4" /><path d="M14.1 9.9a3 3 0 0 1-4.2 4.2" /></svg>
                          </button>
                        </div>
                      </div>

                      <div class="token-info" v-if="account.refresh_token">
                        <label>Refresh Token</label>
                        <div class="token-value">
                          <code>{{ account.showRefreshToken ? account.refresh_token : maskToken(account.refresh_token) }}</code>
                          <button @mousedown="press" @click="account.showRefreshToken = !account.showRefreshToken" class="copy-btn" aria-label="Mostrar/Ocultar Refresh Token" title="Mostrar/Ocultar">
                            <svg v-if="!account.showRefreshToken" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                            <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.9 9.9 4.2 4.2" /><path d="m14.1 14.1 5.7 5.7" /><path d="M2 12s-3 7-10 7a9.84 9.84 0 0 1 5 1.4" /><path d="M22 12s-3 7-10 7a9.84 9.84 0 0 1-5-1.4" /><path d="M14.1 9.9a3 3 0 0 1-4.2 4.2" /></svg>
                          </button>
                        </div>
                      </div>

                      <div class="token-grid">
                        <div class="token-info">
                          <label>Conectado em</label>
                          <div class="token-value">
                            <code>{{ formatDate(account.connected_at) }}</code>
                          </div>
                        </div>
                        <div class="token-info">
                          <label>Expira em</label>
                          <div class="token-value">
                            <code>{{ formatExpiration(account.connected_at, account.expires_in) }}</code>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Transition>
                </article>
              </div>
            </section>

            <!-- ==================== SHOPEE ==================== -->
            <section v-if="accounts.shopee.length > 0" class="platform-section">
              <div class="section-head">
                <div class="section-head__brand">
                  <span class="section-head__logo section-head__logo--shopee">
                    <img src="/img/shopee-logo.svg" alt="Shopee" />
                  </span>
                  <div>
                    <h2 class="section-head__title">Shopee</h2>
                    <p class="section-head__sub">{{ accounts.shopee.length }} loja(s) conectada(s)</p>
                  </div>
                </div>
              </div>

              <div class="accounts-grid" ref="shopeeGrid">
                <article
                  v-for="account in accounts.shopee"
                  :key="account.shop_id"
                  class="account-card account-card--shopee"
                  @mouseenter="hoverCard($event, true)"
                  @mouseleave="hoverCard($event, false)"
                >
                  <span class="account-card__stripe account-card__stripe--shopee" aria-hidden="true"></span>

                  <header class="account-card__top">
                    <div class="account-card__identity">
                      <span class="account-card__avatar account-card__avatar--shopee">
                        <img src="/img/shopee-logo.svg" alt="Shopee" />
                      </span>
                      <div class="account-card__names">
                        <span class="account-nickname" :title="account.shop_name || account.shop_id">
                          {{ account.shop_name || account.shop_id }}
                        </span>
                        <span class="account-id">Loja {{ account.shop_id }}</span>
                      </div>
                    </div>

                    <div class="status-pill" :data-status="account.status">
                      <span class="status-dot" :class="account.status"></span>
                      {{ getStatusText(account.status) }}
                    </div>
                  </header>

                  <div class="account-card__meta">
                    <span class="meta-item">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                      Conectada em {{ formatDate(account.connected_at) }}
                    </span>
                  </div>

                  <footer class="account-card__foot">
                    <button
                      @mousedown="press"
                      @click="handleSyncShopee(account)"
                      class="btn-sync"
                      :disabled="shopeeSyncState.isSyncing"
                      title="Sincronizar vendas desta loja"
                    >
                      <svg class="btn-sync__icon" :class="{ 'is-spinning': shopeeSyncState.isSyncing }" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /><polyline points="21 3 21 9 15 9" /></svg>
                      {{ shopeeSyncState.isSyncing ? 'Sincronizando...' : 'Sincronizar' }}
                    </button>

                    <div class="account-actions">
                      <button
                        v-if="userRole === 'master'"
                        @mousedown="press"
                        @click="requestDelete(account, 'shopee')"
                        class="action-btn delete-btn"
                        aria-label="Excluir Loja"
                        title="Excluir Loja"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>
                      </button>
                    </div>
                  </footer>
                </article>
              </div>
            </section>

            <!-- =================== VAZIO =================== -->
            <div v-if="accounts.mercadoLivre.length === 0 && accounts.shopee.length === 0" class="no-accounts">
              <div class="no-accounts__logos">
                <img src="/img/ml-logo.svg" alt="Mercado Livre" />
                <img src="/img/shopee-logo.svg" alt="Shopee" />
              </div>
              <h3 class="no-accounts__title">Nenhuma conta conectada ainda</h3>
              <p class="no-accounts__text">
                Conecte uma conta do Mercado Livre ou uma loja Shopee para começar a sincronizar suas vendas.
              </p>
              <div class="no-accounts__actions">
                <MercadoLivreConnect />
                <ShopeeConnect />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <Transition name="modal-fade">
    <div v-if="accountToDelete" class="modal-overlay" @click.self="cancelDelete">
      <div class="modal-panel">
        <div class="modal-header">
          <h3>Confirmar Exclusão</h3>
          <button @click="cancelDelete" class="close-btn" aria-label="Fechar modal">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div class="modal-body">
          <p>Você tem certeza que deseja excluir a conta "<strong>{{ accountToDelete.nickname || accountToDelete.shop_name || accountToDelete.shop_id }}</strong>"? Esta ação não pode ser desfeita.</p>
        </div>
        <div class="modal-footer">
          <button @click="cancelDelete" class="btn-cancel">Cancelar</button>
          <button @click="confirmDelete" class="btn-confirm-delete">Sim, Excluir</button>
        </div>
      </div>
    </div>
  </Transition>

  <!--
    Toast único e compartilhado. Os três emissores (sync ML, sync Shopee e
    avisos simples) usariam a mesma posição fixa e ficariam sobrepostos, então
    exibimos apenas o de maior prioridade — na prática só há uma sincronização
    por vez.
  -->
  <ToastNotification
    :is-visible="activeToast.isVisible"
    :title="activeToast.title"
    :description="activeToast.description"
    :progress="activeToast.progress"
    :type="activeToast.type"
    @close="dismissToast"
  />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import gsap from 'gsap';

import SidebarComponent from '../components/SidebarComponent.vue';
import TopbarComponent from '../components/TopbarComponent.vue';
import MercadoLivreConnect from '../components/MercadoLivreConnect.vue';
import ShopeeConnect from '../components/ShopeeConnect.vue';
import ToastNotification from '../components/ToastNotification.vue';

import { useAuth } from '@/composables/useAuth';
import { useApi } from '@/composables/useApi';
import { useSyncManager } from '@/composables/useSyncManager';
import { useShopeeSyncManager } from '@/composables/useShopeeSyncManager';

const {
  user, userRole, isAuthReady,
  fetchMercadoLivreAccounts: fetchAccountsFromAuth,
  fetchShopeeAccounts: fetchShopeeAccountsFromAuth,
} = useAuth();
const api = useApi();
const { syncState, syncAccount: syncMlAccount } = useSyncManager();
const { syncState: shopeeSyncState, syncAccount: syncShopeeAccount } = useShopeeSyncManager();
const route = useRoute();
const router = useRouter();



const rootRef = ref(null);
const headerRef = ref(null);
const listTitleRef = ref(null);
const mlGrid = ref(null);
const shopeeGrid = ref(null);
let ctx;

const accounts = ref({ mercadoLivre: [], shopee: [] });
const isLoading = ref(true);

const totalAccounts = computed(
  () => accounts.value.mercadoLivre.length + accounts.value.shopee.length
);

const activeAccountsCount = computed(() =>
  [...accounts.value.mercadoLivre, ...accounts.value.shopee].filter(
    (acc) => acc.status === 'active'
  ).length
);

const accountToDelete = ref(null);
const notification = ref({ show: false, title: '', message: '', type: 'info' });
let notificationTimer = null;

const showSimpleNotification = (title, message, type = 'info') => {
  notification.value = { show: true, title, message, type };
  if (notificationTimer) clearTimeout(notificationTimer);
  notificationTimer = setTimeout(() => {
    notification.value.show = false;
  }, 5000);
};

/**
 * Toast exibido: a sincronização em andamento tem prioridade sobre os avisos
 * simples, e a Shopee vem antes do ML apenas por ser a ação disparada nesta
 * tela (a do ML roda na Tabela de Vendas).
 */
const activeToast = computed(() => {
  if (shopeeSyncState.value.isVisible) {
    return {
      isVisible: true,
      title: shopeeSyncState.value.title,
      description: shopeeSyncState.value.description,
      progress: shopeeSyncState.value.progress,
      type: shopeeSyncState.value.type,
    };
  }
  if (syncState.value.isVisible) {
    return {
      isVisible: true,
      title: syncState.value.title,
      description: syncState.value.description,
      progress: syncState.value.progress,
      type: syncState.value.type,
    };
  }
  if (notification.value.show) {
    return {
      isVisible: true,
      title: notification.value.title,
      description: notification.value.message,
      progress: 0,
      type: notification.value.type,
    };
  }
  return { isVisible: false, title: '', description: '', progress: 0, type: 'info' };
});

const dismissToast = () => {
  if (shopeeSyncState.value.isVisible) shopeeSyncState.value.isVisible = false;
  else if (syncState.value.isVisible) syncState.value.isVisible = false;
  else notification.value.show = false;
};

const addExtraProperties = (acc) => ({
  ...acc,
  isExpanded: false,
  showAccessToken: false,
  showRefreshToken: false,
});

const fetchAllAccounts = async () => {
  isLoading.value = true;
  try {
    const [mlData, shopeeData] = await Promise.all([
      fetchAccountsFromAuth(),
      fetchShopeeAccountsFromAuth(),
    ]);

    if (mlData && mlData.error) {
      showSimpleNotification('Erro', mlData.error);
      accounts.value.mercadoLivre = [];
    } else {
      const processedMlData = mlData.map((acc) => {
        let finalAccount = { ...acc };
        return addExtraProperties(finalAccount);
      });
      accounts.value.mercadoLivre = processedMlData;
    }

    if (shopeeData && shopeeData.error) {
      showSimpleNotification('Erro', shopeeData.error);
      accounts.value.shopee = [];
    } else {
      accounts.value.shopee = shopeeData || [];
    }
  } finally {
    isLoading.value = false;
  }
};

const handleSyncShopee = async (account) => {
  try {
    await syncShopeeAccount(account.shop_id, account.shop_name || account.shop_id);
    await fetchAllAccounts();
  } catch (error) {
    showSimpleNotification('Erro', error.message || 'Não foi possível sincronizar a loja.', 'error');
  }
};

const handleSyncMl = async (account) => {
  try {
    await syncMlAccount(account.user_id, account.nickname);
    await fetchAllAccounts();
  } catch (error) {
    showSimpleNotification('Erro', error.message || 'Não foi possível sincronizar a conta.', 'error');
  }
};

const toggleDetails = (account) => {
  account.isExpanded = !account.isExpanded;
};

const maskToken = (token) => {
  if (!token) return '';
  return `${token.substring(0, 4)}...${token.substring(token.length - 4)}`;
};

const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
};

const formatExpiration = (connectedAt, expiresIn) => {
  if (!connectedAt || !expiresIn) return 'N/A';
  const expirationTime = new Date(connectedAt).getTime() + expiresIn * 1000;
  const date = new Date(expirationTime);
  return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
};

const requestDelete = (account, platform = 'ml') => {
  if (userRole.value !== 'master') {
    showSimpleNotification('Acesso Negado', 'Você não tem permissão para excluir contas.');
    return;
  }
  accountToDelete.value = { ...account, platform };
};

const cancelDelete = () => {
  accountToDelete.value = null;
};

const confirmDelete = async () => {
  if (userRole.value !== 'master' || !accountToDelete.value) {
    showSimpleNotification('Acesso Negado', 'Ação não permitida.');
    cancelDelete();
    return;
  }

  const account = accountToDelete.value;
  const isShopee = account.platform === 'shopee';
  const id = isShopee ? account.shop_id : account.user_id;
  const label = isShopee ? (account.shop_name || account.shop_id) : account.nickname;
  const endpoint = isShopee ? `/shopee/contas/${id}` : `/ml/contas/${id}`;

  try {
    await api.delete(endpoint);
    showSimpleNotification('Sucesso!', `A conta "${label}" foi excluída.`);
    await fetchAllAccounts();
  } catch (error) {
    const errorMessage = error.data?.error || 'Não foi possível excluir a conta.';
    showSimpleNotification('Erro', errorMessage);
  } finally {
    cancelDelete();
  }
};

const onEnter = (el, done) => {
  gsap.fromTo(
    el,
    { height: 0, opacity: 0, marginTop: 0 },
    { height: 'auto', opacity: 1, marginTop: '1rem', duration: 0.28, ease: 'power2.out', onComplete: done }
  );
};

const onLeave = (el, done) => {
  gsap.to(el, { height: 0, opacity: 0, marginTop: 0, duration: 0.24, ease: 'power1.inOut', onComplete: done });
};

const press = (e) => {
  gsap.fromTo(
    e.currentTarget,
    { scale: 1 },
    { scale: 0.96, duration: 0.08, yoyo: true, repeat: 1, ease: 'power1.out' }
  );
};

const hoverCard = (e, entering) => {
  gsap.to(e.currentTarget, {
    y: entering ? -2 : 0,
    boxShadow: entering
      ? '0 0 0 1px rgba(15, 23, 42, 0.06), 0 6px 18px rgba(2,6,23,0.06)'
      : '0 0 0 1px var(--border), 0 0 0 rgba(0,0,0,0)'
  });
};



// const handleSyncAllAccounts = async () => {
//   if (syncState.value.isSyncing) return;
  
//   if (!accounts.value.mercadoLivre || accounts.value.mercadoLivre.length === 0) {
//     showSimpleNotification('Atenção', 'Nenhuma conta do Mercado Livre conectada para sincronizar.');
//     return;
//   }


//   let successCount = 0;
//   let errorCount = 0;
//   const totalAccounts = accounts.value.mercadoLivre.length;

//   try {
//     for (const account of accounts.value.mercadoLivre) {
//       try {
//         await syncAccount(account.user_id, account.nickname);
//         successCount++;
//       } catch (err) {
//         errorCount++;
//         console.error(`Falha ao sincronizar a conta ${account.nickname} (${account.user_id}):`, err);
//       }
//     }

//     if (totalAccounts > 1) {
//       const message = `${successCount} de ${totalAccounts} contas sincronizadas com sucesso. ${errorCount > 0 ? `${errorCount} falharam.` : ''}`;
//       showSimpleNotification(
//         'Sincronização Finalizada', 
//         message
//       );
//     }
//   } catch (err) {
//     console.error('Falha geral ao sincronizar contas:', err);
//     showSimpleNotification('Erro Geral', err.message);
//   }
// };

const getStatusText = (status) => {
  const map = { active: 'Ativa', attention: 'Atenção', error: 'Erro' };
  return map[status] || 'Inativa';
};

onMounted(() => {
  ctx = gsap.context(() => {
    if (headerRef.value) {
      gsap.from(headerRef.value, { opacity: 0, y: -12, duration: 0.45, ease: 'power2.out' });
    }
    if (listTitleRef.value) {
      gsap.from(listTitleRef.value, { opacity: 0, y: 8, duration: 0.35, delay: 0.05 });
    }
  }, rootRef);

  watch(
    isAuthReady,
    async (ready) => {
      if (!ready) return;
      if (user.value) {
        await fetchAllAccounts();
        if (route.query.success || route.query.error) {
          const message = route.query.success
            ? decodeURIComponent(route.query.success)
            : decodeURIComponent(route.query.error);
          const title = route.query.success ? 'Sucesso!' : 'Ocorreu um Erro';
          showSimpleNotification(title, message);
          router.replace({ query: {} });
        }
      } else {
        accounts.value.mercadoLivre = [];
        isLoading.value = false;
      }
    },
    { immediate: true }
  );

  watch(isLoading, async (loading) => {
    if (!loading) {
      await nextTick();
      const cards = mlGrid.value?.querySelectorAll('.account-card');
      if (cards?.length) {
        gsap.from(cards, { opacity: 0, y: 12, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
      }
    }
  });

  // Watch for sync completion to refresh accounts
  watch(() => syncState.value.isSyncing, (isSyncing, wasSyncing) => {
    if (wasSyncing && !isSyncing && syncState.value.progress === 100 && syncState.value.type !== 'error') {
      fetchAllAccounts();
    }
  });
});

onUnmounted(() => {
  if (ctx) ctx.revert();
});
</script>

<style scoped>
.dashboard-wrapper {
  --bg: #f3f4f6;
  --surface: #ffffff;
  --text: #0f172a;
  --muted: #475569;
  --subtle: #64748b;
  --border: #e5e7eb;
  --ring: rgba(59, 130, 246, 0.12);
  --brand: #2563eb;
  --success: #16a34a;
  --warn: #f59e0b;
  --danger: #ef4444;
  display: flex;
  min-height: 100vh;
  font-family: var(--font-sans);
  background-color: var(--bg);
  color: var(--text);
}
.main-content { flex: 1; display: flex; flex-direction: column; }
.dashboard-content { flex: 1; padding: 1.75rem 2rem 2.25rem; }
.header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.header__intro { min-width: 0; }
.header-actions { display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap; }

/* Chips de marketplace no header */
.header__marketplaces { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.85rem; flex-wrap: wrap; }
.mk-chip {
  display: inline-flex; align-items: center; gap: 0.45rem;
  padding: 0.3rem 0.7rem 0.3rem 0.45rem;
  background: #fff; border: 1px solid var(--border); border-radius: 9999px;
  font-size: 0.78rem; font-weight: 600; color: var(--muted);
}
.mk-chip__logo { width: 18px; height: 18px; object-fit: contain; border-radius: 4px; }

/* ===================== Cards de estatística ===================== */
.stats-row {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.85rem; margin-bottom: 2rem;
}
.stat-card {
  display: flex; align-items: center; gap: 0.85rem;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 14px; padding: 0.9rem 1rem;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
}
.stat-card__icon {
  display: grid; place-items: center; width: 38px; height: 38px;
  border-radius: 10px; flex-shrink: 0;
}
.stat-card__icon--total { background: #eef2ff; color: #4f46e5; }
.stat-card__icon--active { background: #ecfdf5; color: #059669; }
.stat-card__icon--ml { background: #fff9db; }
.stat-card__icon--shopee { background: #fff1ec; }
.stat-card__logo { width: 22px; height: 22px; object-fit: contain; border-radius: 5px; }
.stat-card__body { display: flex; flex-direction: column; min-width: 0; }
.stat-card__value { font-size: 1.4rem; font-weight: 700; line-height: 1.1; color: var(--text); font-variant-numeric: tabular-nums; }
.stat-card__label { font-size: 0.78rem; color: var(--subtle); margin-top: 0.15rem; }

/* ===================== Cabeçalho de seção ===================== */
.platform-section { margin-bottom: 2.25rem; }
.section-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
.section-head__brand { display: flex; align-items: center; gap: 0.75rem; min-width: 0; }
.section-head__logo {
  display: grid; place-items: center; width: 40px; height: 40px;
  border-radius: 11px; border: 1px solid var(--border); background: #fff; flex-shrink: 0;
}
.section-head__logo img { width: 26px; height: 26px; object-fit: contain; border-radius: 6px; }
.section-head__logo--ml { background: #fffdf2; border-color: #f2e6a8; }
.section-head__logo--shopee { background: #fff6f2; border-color: #f8c6b4; }
.section-head__title { margin: 0; font-size: 1.05rem; font-weight: 700; color: var(--text); letter-spacing: -0.01em; }
.section-head__sub { margin: 0.1rem 0 0; font-size: 0.8rem; color: var(--subtle); }

.btn {
  padding: 0.6rem 1.2rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
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
  position: relative;
}

.sync-spinner {
  animation: spin 1.5s linear infinite;
}

.mode-indicator {
  margin-left: 0.25rem;
  opacity: 0.7;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.dashboard-title { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.01em; color: var(--text); margin: 0; }
.dashboard-subtitle { margin-top: 0.3rem; font-size: 0.95rem; color: var(--subtle); }
.list-title { font-size: 1.1rem; font-weight: 600; color: #1f2937; margin: 0 0 1rem; display: flex; align-items: center; gap: 0.6rem; }
.accounts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 1rem; }

/* ===================== Card de conta ===================== */
.account-card {
  position: relative; overflow: hidden;
  background: var(--surface); border-radius: 14px; border: 1px solid var(--border);
  padding: 1.1rem 1.15rem; box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
  transition: box-shadow 180ms, transform 180ms, border-color 180ms; will-change: transform;
  display: flex; flex-direction: column;
}
.account-card:hover { border-color: #dbe1ea; }
.account-card__stripe { position: absolute; inset: 0 auto 0 0; width: 3px; }
.account-card__stripe--ml { background: linear-gradient(180deg, #f8d135, #ffe680); }
.account-card__stripe--shopee { background: linear-gradient(180deg, #ee4d2d, #ff8b6b); }

.account-card__top { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem; }
.account-card__identity { display: flex; align-items: center; gap: 0.7rem; min-width: 0; }
.account-card__avatar {
  display: grid; place-items: center; width: 40px; height: 40px;
  border-radius: 11px; border: 1px solid var(--border); background: #fff; flex-shrink: 0;
}
.account-card__avatar img { width: 25px; height: 25px; object-fit: contain; border-radius: 6px; }
.account-card__avatar--ml { background: #fffdf2; border-color: #f2e6a8; }
.account-card__avatar--shopee { background: #fff6f2; border-color: #f8c6b4; }
.account-card__names { display: flex; flex-direction: column; min-width: 0; }
.account-nickname {
  font-weight: 650; color: #111827; font-size: 0.95rem; line-height: 1.25;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.account-id {
  font-size: 0.76rem; color: #94a3b8; margin: 0.12rem 0 0;
  font-variant-numeric: tabular-nums;
}

.account-card__meta { margin-top: 0.85rem; display: flex; flex-wrap: wrap; gap: 0.5rem 0.9rem; }
.meta-item { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.78rem; color: var(--subtle); }

.account-card__foot {
  display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
  margin-top: 1rem; padding-top: 0.85rem; border-top: 1px solid var(--border);
}

/* Pílula de status */
.status-pill {
  display: inline-flex; align-items: center; gap: 0.4rem; flex-shrink: 0;
  padding: 0.28rem 0.6rem; border-radius: 9999px;
  background: #f8fafc; border: 1px solid var(--border);
  font-size: 0.74rem; font-weight: 600; color: #334155; white-space: nowrap;
}
.status-pill[data-status="active"] { background: #ecfdf5; border-color: #c7f0dc; color: #047857; }
.status-pill[data-status="attention"] { background: #fffbeb; border-color: #fde9b8; color: #b45309; }
.status-pill[data-status="error"] { background: #fef2f2; border-color: #fdd8d8; color: #b91c1c; }

.account-actions { display: flex; gap: 0.4rem; }
.action-btn { height: 34px; width: 34px; display: inline-flex; align-items: center; justify-content: center; background: #fff; border: 1px solid var(--border); border-radius: 9px; color: #334155; cursor: pointer; transition: background 140ms, border-color 140ms, color 140ms, box-shadow 140ms; }
.action-btn:hover:not(:disabled) { background: #f8fafc; border-color: #dbe1ea; color: #111827; box-shadow: 0 0 0 4px var(--ring); }
.action-btn:focus-visible { outline: none; box-shadow: 0 0 0 4px var(--ring); }
.action-btn:disabled { cursor: not-allowed; opacity: 0.55; }
.action-btn.delete-btn:hover { background: #fff7f7; border-color: #fde2e2; color: #b91c1c; }

/*
  Botão de sincronizar: estilo neutro de propósito. Usar a cor da marca do
  marketplace aqui competia com o logo do card e sugeria "ação destrutiva/
  primária" onde é só uma atualização de dados.
*/
.btn-sync {
  display: inline-flex; align-items: center; gap: 0.45rem;
  height: 34px; padding: 0 0.85rem; border-radius: 9px;
  background: #fff; border: 1px solid var(--border); color: var(--muted);
  font-size: 0.82rem; font-weight: 600; cursor: pointer;
  transition: background 140ms, border-color 140ms, color 140ms, box-shadow 140ms, opacity 140ms;
}
.btn-sync:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; color: var(--text); box-shadow: 0 0 0 4px var(--ring); }
.btn-sync:focus-visible { outline: none; border-color: var(--brand); box-shadow: 0 0 0 4px var(--ring); }
.btn-sync:disabled { opacity: 0.55; cursor: not-allowed; }
.btn-sync .is-spinning { animation: spin-sync 1.1s linear infinite; }
.btn-sync__icon { color: var(--brand); flex-shrink: 0; }
@keyframes spin-sync { to { transform: rotate(360deg); } }

.details-toggle__chev { transition: transform 200ms ease; }
.details-toggle__chev.is-open { transform: rotate(180deg); }

.details-content { overflow: hidden; }
.token-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.token-info { margin-top: 0.9rem; }
.token-info label { display: block; font-size: 0.75rem; font-weight: 600; color: #374151; margin-bottom: 0.25rem; }
.token-value { display: flex; align-items: center; gap: 0.5rem; background: #f8fafc; padding: 0.55rem 0.75rem; border-radius: 8px; border: 1px solid #eef2f7; }
.token-value code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 0.78rem; color: #334155; word-break: break-all; flex: 1; }
.copy-btn { background: none; border: none; cursor: pointer; color: #64748b; padding: 2px; border-radius: 8px; }
.copy-btn:hover { color: #111827; box-shadow: 0 0 0 4px var(--ring); }
.status-display { display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.25rem 0.6rem; border-radius: 9999px; background: #f8fafc; border: 1px solid var(--border); }
.status-text { font-size: 0.78rem; font-weight: 600; line-height: 1; color: #334155; }
.status-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; animation: pulse-dot 2.5s infinite cubic-bezier(0.4, 0, 0.6, 1); }
.status-dot.active { background-color: var(--success); }
.status-dot.attention { background-color: var(--warn); }
.status-dot.error { background-color: var(--danger); }
.platform-tag { font-size: 0.78rem; font-weight: 600; padding: 0.22rem 0.6rem; border-radius: 9999px; border: 1px solid #f5e6a3; background: #fff7bf; color: #3a3a3a; }
.platform-tag.shopee-tag { border-color: #f8c6b4; background: #fff1ec; color: #b3401f; }
.skeleton-card { background-color: var(--surface); padding: 1.25rem; border-radius: 14px; border: 1px solid var(--border); }
.skeleton-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.8rem; }
.skeleton-line { position: relative; overflow: hidden; background: linear-gradient(90deg, rgba(2,6,23,0.06) 25%, rgba(2,6,23,0.08) 37%, rgba(2,6,23,0.06) 63%); background-size: 400% 100%; animation: shimmer 1.4s infinite; border-radius: 8px; }
.skeleton-line.icon { width: 36px; height: 36px; border-radius: 10px; }
.skeleton-line.title { height: 16px; flex: 1; }
.skeleton-line.text { height: 12px; margin: 8px 0 14px; }
.skeleton-line.text.short { width: 65%; }
.skeleton-actions { display: flex; gap: 0.5rem; }
.skeleton-line.button { width: 36px; height: 36px; border-radius: 10px; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.no-accounts {
  display: flex; flex-direction: column; align-items: center;
  padding: 3rem 1.5rem; text-align: center; color: #475569;
  border: 2px dashed var(--border); background: #fff; border-radius: 16px;
}
.no-accounts__logos { display: flex; align-items: center; gap: 0.85rem; margin-bottom: 1.1rem; }
.no-accounts__logos img {
  width: 44px; height: 44px; object-fit: contain;
  padding: 7px; background: #fff; border: 1px solid var(--border);
  border-radius: 12px; box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
}
.no-accounts__title { margin: 0; font-size: 1.05rem; font-weight: 700; color: var(--text); }
.no-accounts__text { margin: 0.5rem 0 0; max-width: 420px; font-size: 0.9rem; line-height: 1.5; color: var(--subtle); }
.no-accounts__actions { display: flex; gap: 0.6rem; margin-top: 1.5rem; flex-wrap: wrap; justify-content: center; }

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  width: 90%;
  max-width: 450px;
  overflow: hidden;
}
.modal-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}
.close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: none;
  border: none;
  border-radius: 0.4rem;
  line-height: 1;
  color: var(--muted);
  cursor: pointer;
}
.close-btn:hover { background: rgba(148, 163, 184, 0.16); color: var(--text); }
.modal-body {
  padding: 1.5rem;
  color: var(--muted);
}
.modal-body p strong {
  color: var(--text);
  font-weight: 600;
}
.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  background-color: #f9fafb;
}
.modal-footer button {
  border: none;
  padding: 0.65rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-cancel {
  background-color: #fff;
  border: 1px solid var(--border);
  color: var(--text);
}
.btn-cancel:hover {
  background-color: #f8fafc;
}
.btn-confirm-delete {
  background-color: #fff;
  color: #151515;
}
.btn-confirm-delete:hover {
  background-color: #dc2626;
  color: white;
}
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-active .modal-panel, .modal-fade-leave-active .modal-panel {
  transition: transform 0.3s ease;
}
.modal-fade-enter-from .modal-panel, .modal-fade-leave-to .modal-panel {
  transform: scale(0.95);
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}

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
</style>
