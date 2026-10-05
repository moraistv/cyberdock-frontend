// src/composables/useMasterSales.js
import { ref } from 'vue';
import { useApi } from './useApi';
import { saleMarketplace } from '@/utils/marketplaces';

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
      // `window` saiu junto com a linha de botões "Período" do tabelão: o
      // recorte obrigatório de 30 dias existia só por causa da lentidão da
      // consulta, que foi corrigida. Recorte por data agora é o
      // saleDateStart/saleDateEnd dos filtros avançados.

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
            // Total nulo = contagem indisponível no servidor. Mantém o número
            // aproximado já exibido em vez de zerar a tela.
            if (countResult.total === null || countResult.total === undefined) return;
            totalSales.value = Number(countResult.total);
            totalPages.value = countResult.totalPages || 1;
            totalIsExact.value = countResult.totalExact !== false;
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
      // A venda vive em sales (ML), shopee_sales ou tiktok_sales; cada tabela
      // tem a sua rota.
      const channel = saleChannel(sale);
      let endpoint = '/sales/status';
      let payload = {
        saleId: sale.id,
        sku: sale.sku,
        uid: sale.uid,
        shippingStatus: newStatus,
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

      // Atualiza localmente. `processed_at` só vem do servidor que realmente
      // efetuou a baixa; mudar o status de Shopee/TikTok não pode fabricar uma
      // baixa local no relógio do navegador.
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
  const saleChannel = (sale) => saleMarketplace(sale);

  const processSales = async (salesToProcess, chunkSize = 200) => {
    // Cada marketplace abate estoque na sua própria tabela: /sales/process
    // procura em public.sales e não encontraria um pedido Shopee ou TikTok.
    const groups = [
      { marketplace: 'Mercado Livre', endpoint: '/sales/process', items: [] },
      { marketplace: 'Shopee', endpoint: '/shopee/process', items: [] },
      { marketplace: 'TikTok Shop', endpoint: '/tiktok/process', items: [] },
    ];

    for (const sale of salesToProcess) {
      const channel = saleChannel(sale);
      if (channel === 'Shopee') {
        groups[1].items.push({ orderSn: sale.id, sku: sale.sku, uid: sale.uid });
      } else if (channel === 'TikTok') {
        groups[2].items.push({ orderId: sale.id, sku: sale.sku, uid: sale.uid });
      } else {
        groups[0].items.push({ id: sale.id, sku: sale.sku, uid: sale.uid });
      }
    }

    const aggregate = { processedNow: [], alreadyProcessed: [], failed: [] };
    const itemOrderId = (item) => item.id ?? item.orderSn ?? item.orderId ?? null;
    const responseOrderId = (item) => item?.saleId ?? item?.orderSn ?? item?.orderId ?? null;

    const sourceFor = (items, responseItem) => {
      const id = String(responseOrderId(responseItem) ?? '');
      const sku = String(responseItem?.sku ?? '').trim().toUpperCase();
      return items.find((item) => (
        String(itemOrderId(item)) === id
        && String(item.sku || '').trim().toUpperCase() === sku
      )) || null;
    };

    const normalized = (marketplace, source, item, outcome) => ({
      marketplace,
      uid: source?.uid || null,
      orderId: responseOrderId(item) ?? itemOrderId(source),
      sku: item?.sku || source?.sku || '',
      outcome,
      processedAt: item?.processedAt || item?.processed_at || null,
      ...(item?.reason ? { reason: item.reason } : {}),
    });

    for (const group of groups) {
      for (const batch of chunk(group.items, chunkSize)) {
        try {
          const res = await api.post(group.endpoint, { salesToProcess: batch });
          for (const item of res?.success || []) {
            const source = sourceFor(batch, item);
            const result = normalized(
              group.marketplace,
              source,
              item,
              item.alreadyProcessed ? 'already_processed' : 'processed_now'
            );
            if (item.alreadyProcessed) aggregate.alreadyProcessed.push(result);
            else aggregate.processedNow.push(result);
          }
          for (const item of res?.failed || []) {
            aggregate.failed.push(normalized(
              group.marketplace,
              sourceFor(batch, item),
              item,
              'failed'
            ));
          }
        } catch (err) {
          /* A requisição pode cair depois de o servidor confirmar alguma baixa.
           * Não inventamos sucesso nem perdemos o restante do agregado: estes
           * itens ficam como falha e o refetch final consulta processed_at real. */
          for (const item of batch) {
            aggregate.failed.push({
              ...normalized(group.marketplace, item, item, 'failed'),
              reason: err?.message || 'Falha de comunicação durante o processamento.',
            });
          }
        }
      }
    }

    // `success` mantém compatibilidade com chamadas antigas, mas agora as telas
    // usam as duas categorias para não contar replay como processamento novo.
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
