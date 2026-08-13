// src/composables/useMasterSales.js
import { ref } from 'vue';
import { useApi } from './useApi';

export function useMasterSales() {
  const sales = ref([]);
  const isLoading = ref(false);
  const error = ref(null);
  const totalSales = ref(0);
  const totalIsExact = ref(true);
  const hasNextPage = ref(false);
  const currentPage = ref(1);
  const totalPages = ref(1);
  const pageSize = ref(50);
  const api = useApi();

  const globalAccountOptions = ref([]);
  // Contas com o marketplace de cada uma, para a tela exibir o logo correto.
  const globalAccountsDetailed = ref([]);
  const globalUserOptions = ref([]);

  let requestId = 0;
  let activeController = null;
  let countController = null;

  let es = null; // SSE

  const fetchFilterOptions = async () => {
    try {
      const res = await api.get('/sales/filter-options');
      globalAccountOptions.value = res.accounts || [];
      globalAccountsDetailed.value = res.accountsDetailed || [];
      globalUserOptions.value = res.users || [];
    } catch (err) {
      console.error('Erro ao buscar as opções globais de filtro:', err);
    }
  };

  const fetchSales = async (params = {}) => {
    // Trocar filtro rápido disparava várias buscas simultâneas e a resposta
    // mais lenta podia sobrescrever a mais recente.
    const myRequest = ++requestId;
    if (activeController) activeController.abort();
    if (countController) countController.abort();
    activeController = new AbortController();
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
      if (params.processed) queryParams.set('processed', params.processed);
      if (params.marketplace) queryParams.set('marketplace', params.marketplace);
      if (params.window) queryParams.set('window', params.window);

      const result = await api.get(`/sales/all?${queryParams.toString()}`, {
        signal: activeController.signal,
      });
      if (myRequest !== requestId) return;

      if (result && result.data) {
        sales.value = Array.isArray(result.data) ? result.data : [];
        totalSales.value = Number(result.total ?? sales.value.length);
        totalIsExact.value = result.totalExact !== false;
        hasNextPage.value = Boolean(result.hasNext);
        currentPage.value = result.page || 1;
        totalPages.value = result.totalPages || 1;

        // A listagem já está na tela; o total exato chega depois.
        if (!totalIsExact.value) {
          countController = new AbortController();
          const countParams = new URLSearchParams(queryParams);
          countParams.set('countOnly', '1');
          void api.get(`/sales/all?${countParams.toString()}`, {
            signal: countController.signal,
          }).then((countResult) => {
            if (myRequest !== requestId || !countResult) return;
            totalSales.value = Number(countResult.total || 0);
            totalPages.value = countResult.totalPages || 1;
            totalIsExact.value = true;
          }).catch((countError) => {
            if (countError?.name !== 'AbortError' && myRequest === requestId) {
              console.warn('Não foi possível atualizar o total do tabelão:', countError.message);
            }
          }).finally(() => {
            if (myRequest === requestId) countController = null;
          });
        }
      } else {
        // Backward compatibility: if backend returns array directly
        sales.value = Array.isArray(result) ? result : [];
        totalSales.value = sales.value.length;
        totalIsExact.value = true;
        hasNextPage.value = false;
        totalPages.value = 1;
      }
    } catch (err) {
      if (err?.name === 'AbortError' || myRequest !== requestId) return;
      console.error(`Erro ao buscar todas as vendas globais:`, err);
      error.value = 'Não foi possível carregar as vendas mestre globais.';
    } finally {
      if (myRequest === requestId) {
        activeController = null;
        isLoading.value = false;
      }
    }
  };

  /**
   * Atualiza status de uma venda.
   */
  const updateSaleStatus = async (sale, newStatus) => {
    const isDespachado = /despachado/i.test(String(newStatus || ''));

    try {
      // A venda vive em sales (ML) ou shopee_sales; cada tabela tem sua rota.
      const isShopee = saleChannel(sale) === 'Shopee';
      const payload = isShopee
        ? {
            orderSn: sale.id,
            sku: sale.sku,
            uid: sale.uid,
            shippingStatus: newStatus,
          }
        : {
            saleId: sale.id,
            sku: sale.sku,
            uid: sale.uid,
            shippingStatus: newStatus,
            force: Boolean(isDespachado),
          };

      const res = await api.put(isShopee ? '/shopee/status' : '/sales/status', payload);

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

  /** Canal da venda, com o mesmo fallback usado nas telas. */
  const saleChannel = (sale) => {
    const raw = String(sale?.marketplace || sale?.channel || 'ML').toLowerCase();
    return raw.includes('shopee') || raw === 'sp' ? 'Shopee' : 'ML';
  };

  const processSales = async (salesToProcess, chunkSize = 200) => {
    try {
      // Cada marketplace abate estoque na sua própria tabela: /sales/process
      // procura em public.sales e não encontraria um pedido Shopee. Agora que o
      // tabelão lista os dois canais, o lote é separado por destino.
      const mlBatchItems = [];
      const shopeeBatchItems = [];

      for (const sale of salesToProcess) {
        if (saleChannel(sale) === 'Shopee') {
          shopeeBatchItems.push({ orderSn: sale.id, sku: sale.sku, uid: sale.uid });
        } else {
          mlBatchItems.push({ id: sale.id, sku: sale.sku, uid: sale.uid });
        }
      }

      const aggregate = { success: [], failed: [] };

      const runBatches = async (endpoint, items) => {
        for (const batch of chunk(items, chunkSize)) {
          const res = await api.post(endpoint, { salesToProcess: batch });
          if (res?.success || res?.failed) {
            aggregate.success.push(...(res.success || []));
            aggregate.failed.push(...(res.failed || []));
          }
        }
      };

      if (mlBatchItems.length) await runBatches('/sales/process', mlBatchItems);
      if (shopeeBatchItems.length) await runBatches('/shopee/process', shopeeBatchItems);

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
    totalIsExact,
    hasNextPage,
    currentPage,
    totalPages,
    pageSize,
    fetchSales,
    updateSaleStatus,
    processSales,
    subscribeToSync,
    globalAccountOptions,
    globalAccountsDetailed,
    globalUserOptions,
    fetchFilterOptions
  };
}
