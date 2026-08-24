// src/composables/useMasterStorageSummary.js
//
// Armazenamento consumido somado de TODOS os clientes
// (GET /storage/master/consumed-summary).
//
// O caminho óbvio seria chamar /storage/user/:uid/billing-summary para cada
// cliente e somar no navegador, mas isso são N idas ao servidor e cada uma
// recalcula custos e movimentações do mês — caro e sem utilidade para um card.
// O backend devolve a soma pronta numa consulta só.
import { ref } from 'vue';
import { useApi } from './useApi';

const EMPTY = {
  totalConsumedVolume: 0,
  totalContractedVolume: 0,
  occupancyPercent: 0,
  clientCount: 0,
  clientsWithVolume: 0,
  clients: [],
};

export function useMasterStorageSummary() {
  const summary = ref({ ...EMPTY });
  const isLoading = ref(true);
  const error = ref(null);
  const api = useApi();

  let requestId = 0;
  let activeController = null;

  const fetchSummary = async () => {
    const myRequest = ++requestId;
    if (activeController) activeController.abort();
    activeController = new AbortController();
    isLoading.value = true;
    error.value = null;
    try {
      const data = await api.get('/storage/master/consumed-summary', {
        signal: activeController.signal,
      });
      if (myRequest !== requestId) return;
      summary.value = {
        ...EMPTY,
        ...data,
        clients: Array.isArray(data?.clients) ? data.clients : [],
      };
    } catch (err) {
      if (err?.name === 'AbortError' || myRequest !== requestId) return;
      error.value = err.message || 'Não foi possível carregar o armazenamento dos clientes.';
      summary.value = { ...EMPTY };
    } finally {
      if (myRequest === requestId) {
        activeController = null;
        isLoading.value = false;
      }
    }
  };

  const cancelSummary = () => {
    requestId++;
    if (activeController) activeController.abort();
    activeController = null;
    isLoading.value = false;
  };

  return { summary, isLoading, error, fetchSummary, cancelSummary };
}
