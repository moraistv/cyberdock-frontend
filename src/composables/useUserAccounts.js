// src/composables/useUserAccounts.js
import { ref, computed, watch } from 'vue';
import { useApi } from './useApi';

/**
 * Contas de marketplace de UM usuário, vistas de fora (uso do master).
 *
 * Nasceu só com Mercado Livre, para a barra de sincronização da tabela de
 * vendas. A Shopee entrou porque o painel de contas conectadas do master precisa
 * dos dois canais na mesma tela — e porque "contas do cliente" que mostra só
 * metade dos canais é pior que não mostrar nenhuma.
 *
 * `accounts` e `isLoading` continuam sendo o Mercado Livre, que é o que
 * UserSalesTable.vue consome.
 *
 * @param {import('vue').Ref<string>} userIdRef UID do usuário observado.
 * @param {{ shopee?: boolean }} [options] `shopee: true` faz a carga automática
 *   trazer também as lojas Shopee. Fica desligado por padrão de propósito: a
 *   tabela de vendas só precisa do Mercado Livre, e ligar isso para todos
 *   somaria uma requisição por montagem numa tela sensível a tempo de resposta.
 */
export function useUserAccounts(userIdRef, options = {}) {
  // `shopee: true` (nome mantido por compatibilidade) liga todas as lojas:
  // Shopee e TikTok Shop. O único consumidor é o painel de contas do master.
  const comShopee = options.shopee === true || options.tiktok === true;
  const accounts = ref([]);
  const shopeeAccounts = ref([]);
  const tiktokAccounts = ref([]);
  const isLoading = ref(false);
  const isLoadingShopee = ref(false);
  const isLoadingTikTok = ref(false);
  const error = ref(null);
  const api = useApi();

  /** Contas do Mercado Livre. */
  const fetchAccounts = async (uid) => {
    if (!uid) {
      accounts.value = [];
      return [];
    }
    isLoading.value = true;
    error.value = null;
    try {
      // GET /api/ml/contas/:uid — exige ser o dono ou master.
      const data = await api.get(`/ml/contas/${uid}`);
      accounts.value = data || [];
      return accounts.value;
    } catch (e) {
      console.error(`Erro ao buscar contas ML para o usuário ${uid}:`, e);
      error.value = 'Não foi possível carregar as contas do Mercado Livre do usuário.';
      accounts.value = [];
      return [];
    } finally {
      isLoading.value = false;
    }
  };

  /** Lojas da Shopee. */
  const fetchShopeeAccounts = async (uid) => {
    if (!uid) {
      shopeeAccounts.value = [];
      return [];
    }
    isLoadingShopee.value = true;
    try {
      // GET /api/shopee/contas/:uid — exige ser o dono ou master.
      const data = await api.get(`/shopee/contas/${uid}`);
      shopeeAccounts.value = data || [];
      return shopeeAccounts.value;
    } catch (e) {
      console.error(`Erro ao buscar lojas Shopee para o usuário ${uid}:`, e);
      // Erro de um canal não apaga a mensagem do outro nem esconde o que carregou.
      error.value = error.value || 'Não foi possível carregar as lojas Shopee do usuário.';
      shopeeAccounts.value = [];
      return [];
    } finally {
      isLoadingShopee.value = false;
    }
  };

  /** Lojas do TikTok Shop. */
  const fetchTikTokAccounts = async (uid) => {
    if (!uid) {
      tiktokAccounts.value = [];
      return [];
    }
    isLoadingTikTok.value = true;
    try {
      // GET /api/tiktok/contas/:uid — exige ser o dono ou master.
      const data = await api.get(`/tiktok/contas/${uid}`);
      tiktokAccounts.value = Array.isArray(data) ? data : [];
      return tiktokAccounts.value;
    } catch (e) {
      // Backend ainda sem a integração: canal vazio, sem alarme na tela.
      if (e?.status !== 404) {
        console.error(`Erro ao buscar lojas TikTok Shop para o usuário ${uid}:`, e);
        error.value = error.value || 'Não foi possível carregar as lojas TikTok Shop do usuário.';
      }
      tiktokAccounts.value = [];
      return [];
    } finally {
      isLoadingTikTok.value = false;
    }
  };

  /** Todos os canais em paralelo. */
  const fetchAllAccounts = async (uid) => {
    error.value = null;
    await Promise.all([fetchAccounts(uid), fetchShopeeAccounts(uid), fetchTikTokAccounts(uid)]);
  };

  /**
   * Desconecta uma conta do usuário observado (rota de master).
   *
   * As rotas de autoatendimento (`DELETE /ml/contas/:id`) derivam o dono do
   * token, então o master recebia 404 ao tentar desconectar a conta de um
   * cliente. Estas levam o uid alvo na URL.
   *
   * @param {'ml'|'shopee'|'tiktok'} platform
   * @param {string|number} accountId user_id do ML ou shop_id da loja
   */
  const removeAccount = async (platform, accountId) => {
    const uid = userIdRef?.value;
    if (!uid || !accountId) return { success: false, message: 'Conta inválida.' };

    const isShop = platform === 'shopee' || platform === 'tiktok';
    const endpoint = isShop
      ? `/${platform}/contas/${uid}/${encodeURIComponent(accountId)}`
      : `/ml/contas/${uid}/${accountId}`;

    try {
      const data = await api.delete(endpoint);
      if (platform === 'shopee') {
        shopeeAccounts.value = shopeeAccounts.value.filter((a) => String(a.shop_id) !== String(accountId));
      } else if (platform === 'tiktok') {
        tiktokAccounts.value = tiktokAccounts.value.filter((a) => String(a.shop_id) !== String(accountId));
      } else {
        accounts.value = accounts.value.filter((a) => String(a.user_id) !== String(accountId));
      }
      return { success: true, message: data?.message || 'Conta desconectada.' };
    } catch (e) {
      console.error(`Erro ao excluir conta ${platform} ${accountId} do usuário ${uid}:`, e);
      return { success: false, message: e?.data?.error || e?.message || 'Não foi possível excluir a conta.' };
    }
  };

  const isLoadingAny = computed(() => isLoading.value || isLoadingShopee.value || isLoadingTikTok.value);
  const totalAccounts = computed(
    () => accounts.value.length + shopeeAccounts.value.length + tiktokAccounts.value.length
  );

  watch(userIdRef, (newId) => {
    if (!newId) return;
    if (comShopee) fetchAllAccounts(newId);
    else fetchAccounts(newId);
  }, { immediate: true });

  return {
    accounts,
    shopeeAccounts,
    tiktokAccounts,
    isLoading,
    isLoadingShopee,
    isLoadingTikTok,
    isLoadingAny,
    totalAccounts,
    error,
    fetchAccounts,
    fetchShopeeAccounts,
    fetchTikTokAccounts,
    fetchAllAccounts,
    removeAccount,
  };
}
