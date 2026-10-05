// src/composables/useSalesForUser.js
import { ref, watch } from 'vue';
import { useApi } from './useApi';
import { saleMarketplace } from '@/utils/marketplaces';

/* /sales/user/:uid lê de public.unified_sales, então a lista traz ML, Shopee e
 * TikTok Shop. Status e abatimento iam todos para /sales/*, que procura o
 * pedido em public.sales: venda de loja falhava com "não encontrada". */
const PROCESS_ROUTES = [
  ['ML', '/sales/process'],
  ['Shopee', '/shopee/process'],
  ['TikTok', '/tiktok/process'],
];

export function useSalesForUser(uidRef) {
  const sales = ref([]);
  const isLoading = ref(false);
  const error = ref(null);
  const api = useApi();

  let es = null; // SSE

  const fetchSales = async () => {
    const uid = uidRef.value;
    if (!uid) {
      sales.value = [];
      error.value = 'UID do usuário não fornecido.';
      isLoading.value = false;
      return;
    }

    isLoading.value = true;
    error.value = null;
    try {
      const salesData = await api.get(`/sales/user/${uid}`);
      sales.value = Array.isArray(salesData) ? salesData : [];
    } catch (err) {
      console.error(`Erro ao buscar vendas para o usuário ${uid}:`, err);
      error.value = 'Não foi possível carregar as vendas do usuário.';
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Atualiza status de uma venda. Para "Despachado", força a atualização mesmo se já tiver processed_at.
   */
  const updateSaleStatus = async (sale, newStatus) => {
    const isDespachado = /despachado/i.test(String(newStatus || ''));

    try {
      // A venda vive em sales (ML), shopee_sales ou tiktok_sales; cada tabela
      // tem a sua rota (mesma regra do useMasterSales).
      const channel = saleMarketplace(sale);
      let endpoint = '/sales/status';
      let payload = {
        saleId: sale.id,
        sku: sale.sku,
        uid: sale.uid,
        shippingStatus: newStatus,
        // 👇 força para "Despachado" (backend deve aceitar sem reprocessar estoque)
        force: Boolean(isDespachado),
      };
      if (channel === 'Shopee') {
        endpoint = '/shopee/status';
        payload = { orderSn: sale.id, sku: sale.sku, uid: sale.uid, shippingStatus: newStatus };
      } else if (channel === 'TikTok') {
        endpoint = '/tiktok/status';
        payload = { orderId: sale.id, sku: sale.sku, uid: sale.uid, shippingStatus: newStatus };
      }

      const res = await api.put(endpoint, payload);

      // Atualiza localmente. processed_at só pode vir do backend que realmente
      // executou a baixa; não usamos o relógio do navegador para inventá-lo.
      const idx = sales.value.findIndex(
        (s) => s.id === sale.id && s.sku === sale.sku && s.uid === sale.uid
      );
      if (idx !== -1) {
        const updated = { ...sales.value[idx], shipping_status: newStatus };
        const processedAt = res?.sale?.processed_at || res?.sale?.processedAt || null;
        if (processedAt) updated.processed_at = processedAt;
        sales.value[idx] = updated;
      }

      return res;
    } catch (err) {
      const serverMsg =
        err?.message || 'Falha ao atualizar o status da venda.';
      console.error('Erro ao atualizar status da venda:', err);
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
    // A lista mistura canais e cada um abate estoque na própria tabela.
    const items = { ML: [], Shopee: [], TikTok: [] };
    for (const sale of salesToProcess) {
      const channel = saleMarketplace(sale);
      if (channel === 'Shopee') items.Shopee.push({ orderSn: sale.id, sku: sale.sku, uid: sale.uid });
      else if (channel === 'TikTok') items.TikTok.push({ orderId: sale.id, sku: sale.sku, uid: sale.uid });
      else items.ML.push({ id: sale.id, sku: sale.sku, uid: sale.uid });
    }

    const labels = { ML: 'Mercado Livre', Shopee: 'Shopee', TikTok: 'TikTok Shop' };
    const aggregate = { processedNow: [], alreadyProcessed: [], failed: [] };
    const resultId = (item) => item?.saleId ?? item?.orderSn ?? item?.orderId ?? item?.id ?? null;

    for (const [channel, endpoint] of PROCESS_ROUTES) {
      for (const batch of chunk(items[channel], chunkSize)) {
        try {
          const res = await api.post(endpoint, { salesToProcess: batch });
          for (const item of res?.success || []) {
            const normalized = {
              ...item,
              marketplace: labels[channel],
              orderId: resultId(item),
              saleId: resultId(item),
              outcome: item.alreadyProcessed ? 'already_processed' : 'processed_now',
            };
            if (item.alreadyProcessed) aggregate.alreadyProcessed.push(normalized);
            else aggregate.processedNow.push(normalized);
          }
          for (const item of res?.failed || []) {
            aggregate.failed.push({
              ...item,
              marketplace: labels[channel],
              orderId: resultId(item),
              saleId: resultId(item),
              outcome: 'failed',
            });
          }
        } catch (err) {
          for (const item of batch) {
            aggregate.failed.push({
              marketplace: labels[channel],
              orderId: resultId(item),
              saleId: resultId(item),
              sku: item.sku,
              uid: item.uid,
              outcome: 'failed',
              reason: err?.message || 'Falha de comunicação durante o processamento.',
            });
          }
        }
      }
    }

    return {
      ...aggregate,
      success: [...aggregate.processedNow, ...aggregate.alreadyProcessed],
    };
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

  watch(
    uidRef,
    (newUid) => {
      if (newUid) {
        fetchSales();
      } else {
        sales.value = [];
        error.value = null;
        isLoading.value = false;
      }
      if (es) {
        es.close();
        es = null;
      }
    },
    { immediate: true }
  );

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
