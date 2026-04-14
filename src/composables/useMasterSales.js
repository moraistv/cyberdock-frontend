// src/composables/useMasterSales.js
import { ref } from 'vue';
import { useApi } from './useApi';

export function useMasterSales() {
  const sales = ref([]);
  const isLoading = ref(false);
  const error = ref(null);
  const totalSales = ref(0);
  const currentPage = ref(1);
  const totalPages = ref(1);
  const pageSize = ref(50);
  const api = useApi();

  const globalAccountOptions = ref([]);
  const globalUserOptions = ref([]);

  let es = null; // SSE

  const fetchFilterOptions = async () => {
    try {
      const res = await api.get('/sales/filter-options');
      globalAccountOptions.value = res.accounts || [];
      globalUserOptions.value = res.users || [];
    } catch (err) {
      console.error('Erro ao buscar as opções globais de filtro:', err);
    }
  };

  const fetchSales = async (params = {}) => {
    isLoading.value = true;
    error.value = null;
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('page', params.page || currentPage.value);
      queryParams.set('limit', params.limit || pageSize.value);
      if (params.search) queryParams.set('search', params.search);
      if (params.shippingStatus) queryParams.set('shippingStatus', params.shippingStatus);
      if (params.saleStatus) queryParams.set('saleStatus', params.saleStatus);
      if (params.saleDateStart) queryParams.set('saleDateStart', params.saleDateStart);
      if (params.saleDateEnd) queryParams.set('saleDateEnd', params.saleDateEnd);
      if (params.account) queryParams.set('account', params.account);
      if (params.buyer) queryParams.set('buyer', params.buyer);
      if (params.shippingLimitStart) queryParams.set('shippingLimitStart', params.shippingLimitStart);
      if (params.shippingLimitEnd) queryParams.set('shippingLimitEnd', params.shippingLimitEnd);
      if (params.shippingMode) queryParams.set('shippingMode', params.shippingMode);
      if (params.userNickname) queryParams.set('userNickname', params.userNickname);

      const result = await api.get(`/sales/all?${queryParams.toString()}`);

      if (result && result.data) {
        sales.value = Array.isArray(result.data) ? result.data : [];
        totalSales.value = result.total || 0;
        currentPage.value = result.page || 1;
        totalPages.value = result.totalPages || 1;
      } else {
        // Backward compatibility: if backend returns array directly
        sales.value = Array.isArray(result) ? result : [];
        totalSales.value = sales.value.length;
        totalPages.value = 1;
      }
    } catch (err) {
      console.error(`Erro ao buscar todas as vendas globais:`, err);
      error.value = 'Não foi possível carregar as vendas mestre globais.';
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Atualiza status de uma venda.
   */
  const updateSaleStatus = async (sale, newStatus) => {
    const isDespachado = /despachado/i.test(String(newStatus || ''));

    try {
      const payload = {
        saleId: sale.id,
        sku: sale.sku,
        uid: sale.uid,
        shippingStatus: newStatus,
        force: Boolean(isDespachado),
      };

      const res = await api.put('/sales/status', payload);

      // Atualiza localmente
      const idx = sales.value.findIndex(
        (s) => s.id === sale.id && s.sku === sale.sku
      );
      if (idx !== -1) {
        const updated = { ...sales.value[idx], shipping_status: newStatus };
        if (isDespachado && !updated.processed_at) {
          updated.processed_at = new Date().toISOString();
        }
        sales.value[idx] = updated;
      }

      return res;
    } catch (err) {
      const serverMsg =
        err?.message || 'Falha ao atualizar o status da venda.';
      console.error('Erro ao atualizar status da venda global:', err);
      throw new Error(serverMsg);
    }
  };

  // util: chunk
  const chunk = (arr, size) => {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  };

  const processSales = async (salesToProcess, chunkSize = 200) => {
    try {
      const compact = salesToProcess.map((s) => ({
        id: s.id,
        sku: s.sku,
        uid: s.uid,
        quantity: s.quantity,
      }));

      const batches = chunk(compact, chunkSize);
      const aggregate = { success: [], failed: [] };

      for (const batch of batches) {
        const res = await api.post('/sales/process', { salesToProcess: batch });
        if (res?.success || res?.failed) {
          aggregate.success.push(...(res.success || []));
          aggregate.failed.push(...(res.failed || []));
        } else if (
          res?.message &&
          res?.success !== undefined &&
          res?.failed !== undefined
        ) {
          aggregate.success.push(...res.success);
          aggregate.failed.push(...res.failed);
        }
      }

      return aggregate;
    } catch (err) {
      console.error('Erro ao processar vendas em lote:', err);
      throw new Error('Falha ao processar vendas em lote.');
    }
  };

  const subscribeToSync = (clientId) => {
    try {
      if (es) {
        es.close();
        es = null;
      }
      if (!clientId) return;
      es = new EventSource(
        `/api/sales/sync-status/${encodeURIComponent(clientId)}`
      );

      es.onmessage = (evt) => {
        try {
          if (!evt?.data) return;
          const payload = JSON.parse(evt.data);
          if (payload?.progress >= 100) {
            fetchSales();
            es.close();
            es = null;
          }
        } catch (e) {
          // ignore parse
        }
      };

      es.onerror = () => {
        if (es) {
          es.close();
          es = null;
        }
      };
    } catch (e) {
      // silencioso
    }
  };

  return {
    sales,
    isLoading,
    error,
    totalSales,
    currentPage,
    totalPages,
    pageSize,
    fetchSales,
    updateSaleStatus,
    processSales,
    subscribeToSync,
    globalAccountOptions,
    globalUserOptions,
    fetchFilterOptions
  };
}
