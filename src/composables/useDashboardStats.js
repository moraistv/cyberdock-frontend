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
  totals: { sales: 0, units: 0, pending: 0, processed: 0, cancelled: 0, distinct_skus: 0 },
  previousTotals: null,
  byStatus: [],
  byDay: [],
  byMarketplace: [],
  byShippingMode: [],
  topSkus: [],
};

export function useDashboardStats() {
  const stats = ref({ ...EMPTY });
  const isLoading = ref(true);
  const error = ref(null);
  const api = useApi();

  // Filtros mudam rápido (o usuário clica em vários chips seguidos): a resposta
  // que chegar de uma busca já superada é descartada, para os cards não
  // piscarem números de um filtro antigo.
  let requestId = 0;

  /**
   * @param {object} params { from, to, marketplace, account, shippingStatus, shippingMode }
   *  Os filtros de lista aceitam array (seleção múltipla) ou string.
   */
  const fetchStats = async (params = {}) => {
    const myRequest = ++requestId;
    isLoading.value = true;
    error.value = null;
    try {
      const qs = new URLSearchParams();
      if (params.from) qs.set('from', params.from);
      if (params.to) qs.set('to', params.to);

      const asCsv = (v) => (Array.isArray(v) ? v.join(',') : v);
      if (params.marketplace?.length) qs.set('marketplace', asCsv(params.marketplace));
      if (params.account?.length) qs.set('account', asCsv(params.account));
      if (params.shippingStatus?.length) qs.set('shippingStatus', asCsv(params.shippingStatus));
      if (params.shippingMode?.length) qs.set('shippingMode', asCsv(params.shippingMode));

      const data = await api.get(`/sales/dashboard-stats?${qs.toString()}`);
      if (myRequest !== requestId) return;
      stats.value = { ...EMPTY, ...data };
    } catch (err) {
      if (myRequest !== requestId) return;
      error.value = err.message || 'Não foi possível carregar as métricas.';
      stats.value = { ...EMPTY };
    } finally {
      if (myRequest === requestId) isLoading.value = false;
    }
  };

  return { stats, isLoading, error, fetchStats };
}
