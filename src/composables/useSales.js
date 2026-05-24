import { ref } from 'vue';
import { useApi } from './useApi'; 

export function useSales() {
  const sales = ref([]);
  const isLoading = ref(false);
  const error = ref(null);
  const totalSales = ref(0);
  const currentPage = ref(1);
  const totalPages = ref(1);
  const pageSize = ref(50);
  const api = useApi(); 

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

      const result = await api.get(`/sales/my-sales?${queryParams.toString()}`);
      
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
      console.error("Erro ao buscar vendas:", err);
      error.value = "Não foi possível carregar a lista de vendas.";
    } finally {
      isLoading.value = false;
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
  };
}