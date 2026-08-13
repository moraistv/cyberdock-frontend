import { ref } from 'vue';
import { useApi } from './useApi'; 

export function useSales() {
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
  let requestId = 0;
  let activeController = null;
  let countController = null;

  const fetchSales = async (params = {}) => {
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
      if (params.marketplace) queryParams.set('marketplace', params.marketplace);
      if (params.processed) queryParams.set('processed', params.processed);
      if (params.queue) queryParams.set('queue', params.queue);
      if (params.skuMapped) queryParams.set('skuMapped', params.skuMapped);

      const result = await api.get(`/sales/my-sales?${queryParams.toString()}`, {
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

        // A tabela já está visível neste ponto. A contagem pesada roda em uma
        // chamada separada e só atualiza os números/paginação quando terminar.
        if (!totalIsExact.value) {
          countController = new AbortController();
          const countParams = new URLSearchParams(queryParams);
          countParams.set('countOnly', '1');
          void api.get(`/sales/my-sales?${countParams.toString()}`, {
            signal: countController.signal,
          }).then((countResult) => {
            if (myRequest !== requestId || !countResult) return;
            // Total nulo = contagem indisponível no servidor. Mantém o número
            // aproximado já exibido em vez de zerar a tela.
            if (countResult.total === null || countResult.total === undefined) return;
            totalSales.value = Number(countResult.total);
            totalPages.value = countResult.totalPages || 1;
            totalIsExact.value = countResult.totalExact !== false;
          }).catch((countError) => {
            if (countError?.name !== 'AbortError' && myRequest === requestId) {
              console.warn('Não foi possível atualizar o total de vendas:', countError.message);
            }
          }).finally(() => {
            if (myRequest === requestId) countController = null;
          });
        }
      } else {
        sales.value = Array.isArray(result) ? result : [];
        totalSales.value = sales.value.length;
        totalIsExact.value = true;
        hasNextPage.value = false;
        totalPages.value = 1;
      }
    } catch (err) {
      if (err?.name === 'AbortError' || myRequest !== requestId) return;
      console.error('Erro ao buscar vendas:', err);
      error.value = 'Não foi possível carregar a lista de vendas.';
    } finally {
      if (myRequest === requestId) {
        activeController = null;
        isLoading.value = false;
      }
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
  };
}