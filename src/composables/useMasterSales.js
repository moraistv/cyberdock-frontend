// src/composables/useMasterSales.js
import { ref } from 'vue';
import { useApi } from './useApi';

export function useMasterSales() {
  const sales = ref([]);
  const isLoading = ref(false);
  const error = ref(null);
  const api = useApi();

  let es = null; // SSE

  const fetchSales = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const salesData = await api.get(`/sales/all`);
      sales.value = Array.isArray(salesData) ? salesData : [];
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
    fetchSales,
    updateSaleStatus,
    processSales,
    subscribeToSync,
  };
}
