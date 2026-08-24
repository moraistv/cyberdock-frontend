// src/composables/useDashboardStats.js
//
// Métricas do Dashboard agregadas NO BANCO (GET /sales/dashboard-stats).
//
// Antes o Dashboard buscava a primeira página de vendas (50 linhas) e
// calculava os totais no navegador — com milhares de vendas, os números
// mostrados estavam errados. Aqui os valores já chegam prontos e cobrem todo
// o período selecionado.
import { ref } from 'vue';
import { useApi } from './useApi';

const EMPTY = {
  totals: {
    orders: 0,
    sales: 0,
    units: 0,
    pending_orders: 0,
    pending: 0,
    // Complemento de "a despachar": o que já saiu da expedição.
    shipped_orders: 0,
    shipped: 0,
    valid_orders: 0,
    cancelled_orders: 0,
    cancelled: 0,
    processed_orders: 0,
    processed: 0,
    processed_lines: 0,
    distinct_skus: 0,
  },
  previousTotals: null,
  byStatus: [],
  byDay: [],
  byMarketplace: [],
  byShippingMode: [],
  // Distribuição por conta, usada pelo Dashboard Master para pôr as contas de
  // todos os clientes lado a lado.
  byAccount: [],
  topSkus: [],
};

export function useDashboardStats() {
  const stats = ref({ ...EMPTY });
  const isLoading = ref(true);
  const error = ref(null);
  const api = useApi();

  let requestId = 0;
  let activeController = null;

  /**
   * @param {object} params { from, to, shipFrom, shipTo, marketplace, account,
   *   shippingStatus, shippingMode, saleStatus, queue, processed, skuMapped }
   *  Os filtros de lista aceitam array (seleção múltipla) ou string.
   *  `from/to` recortam a DATA DA VENDA e `shipFrom/shipTo` o PRAZO DE ENVIO —
   *  são janelas independentes.
   */
  const fetchStats = async (params = {}) => {
    const myRequest = ++requestId;
    if (activeController) activeController.abort();
    activeController = new AbortController();
    isLoading.value = true;
    error.value = null;
    try {
      const qs = new URLSearchParams();
      if (params.from) qs.set('from', params.from);
      if (params.to) qs.set('to', params.to);

      if (params.shipFrom) qs.set('shipFrom', params.shipFrom);
      if (params.shipTo) qs.set('shipTo', params.shipTo);

      const asCsv = (v) => (Array.isArray(v) ? v.join(',') : v);
      if (params.marketplace?.length) qs.set('marketplace', asCsv(params.marketplace));
      if (params.account?.length) qs.set('account', asCsv(params.account));
      if (params.shippingStatus?.length) qs.set('shippingStatus', asCsv(params.shippingStatus));
      if (params.shippingMode?.length) qs.set('shippingMode', asCsv(params.shippingMode));
      if (params.saleStatus?.length) qs.set('saleStatus', asCsv(params.saleStatus));
      // Estes três eram montados na tela mas nunca chegavam ao backend, então
      // clicar em "A despachar", "Estoque abatido" ou "SKU ausente" não mudava
      // número nenhum nos cards.
      if (params.queue) qs.set('queue', params.queue);
      if (params.processed) qs.set('processed', params.processed);
      if (params.skuMapped) qs.set('skuMapped', params.skuMapped);

      /* Visão global do Dashboard Master.
       *
       * O backend só aceita `scope=all` de quem tem papel master; usuário comum
       * que mandasse isso continuaria vendo apenas as próprias vendas. Aqui é só
       * repasse, a autoridade é do servidor.
       *
       * `window=all` desliga a janela padrão de 30 dias, e `userNickname`
       * recorta a visão global por cliente. */
      if (params.scope) qs.set('scope', params.scope);
      if (params.userNickname) qs.set('userNickname', params.userNickname);
      if (params.window) qs.set('window', params.window);

      const data = await api.get(`/sales/dashboard-stats?${qs.toString()}`, {
        signal: activeController.signal,
      });
      if (myRequest !== requestId) return;
      stats.value = {
        ...EMPTY,
        ...data,
        totals: { ...EMPTY.totals, ...(data?.totals || {}) },
        previousTotals: data?.previousTotals
          ? { ...EMPTY.totals, ...data.previousTotals }
          : null,
      };
    } catch (err) {
      if (err?.name === 'AbortError' || myRequest !== requestId) return;
      error.value = err.message || 'Não foi possível carregar as métricas.';
      stats.value = { ...EMPTY };
    } finally {
      if (myRequest === requestId) {
        activeController = null;
        isLoading.value = false;
      }
    }
  };

  const cancelStats = () => {
    requestId++;
    if (activeController) activeController.abort();
    activeController = null;
    isLoading.value = false;
  };

  return { stats, isLoading, error, fetchStats, cancelStats };
}
