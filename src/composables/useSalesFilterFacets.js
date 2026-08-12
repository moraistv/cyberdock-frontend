// src/composables/useSalesFilterFacets.js
//
// Opções de filtro vindas do backend já cruzadas entre si.
//
// Antes cada tela acumulava localmente os valores que passavam pela página
// atual, então o filtro oferecia combinações impossíveis: escolher só uma loja
// Shopee mantinha as modalidades do Mercado Livre na lista e o resultado vinha
// vazio. Aqui cada faceta é calculada no banco aplicando todos os outros
// filtros ativos, exceto ela mesma.
import { ref } from 'vue';
import { useApi } from './useApi';

const EMPTY = {
  marketplaces: [],
  accounts: [],
  shippingStatuses: [],
  shippingModes: [],
  saleStatuses: [],
};

export function useSalesFilterFacets() {
  const facets = ref({ ...EMPTY });
  const isLoading = ref(false);
  const error = ref(null);
  const api = useApi();

  let requestId = 0;
  let activeController = null;

  /**
   * @param {object} params { from, to, marketplace, account, shippingStatus,
   *   shippingMode, saleStatus, processed, skuMapped, queue }
   *   Listas aceitam array ou string em CSV.
   */
  const fetchFacets = async (params = {}) => {
    const myRequest = ++requestId;
    if (activeController) activeController.abort();
    activeController = new AbortController();
    isLoading.value = true;
    error.value = null;

    try {
      const qs = new URLSearchParams();
      const asCsv = (value) => (Array.isArray(value) ? value.join(',') : value);

      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null || value === '') continue;
        if (Array.isArray(value) && value.length === 0) continue;
        qs.set(key, asCsv(value));
      }

      const data = await api.get(`/sales/filter-facets?${qs.toString()}`, {
        signal: activeController.signal,
      });
      if (myRequest !== requestId) return;
      facets.value = { ...EMPTY, ...(data || {}) };
    } catch (err) {
      if (err?.name === 'AbortError' || myRequest !== requestId) return;
      error.value = err.message || 'Não foi possível carregar as opções de filtro.';
      // Mantém as opções anteriores: zerar aqui apagaria os chips da tela por
      // causa de uma falha momentânea de rede.
    } finally {
      if (myRequest === requestId) {
        activeController = null;
        isLoading.value = false;
      }
    }
  };

  const cancelFacets = () => {
    requestId++;
    if (activeController) activeController.abort();
    activeController = null;
    isLoading.value = false;
  };

  /**
   * Remove da seleção os valores que deixaram de existir nas opções.
   * Evita o estado sem saída em que a tela mostra filtros ativos que, juntos,
   * não retornam nenhuma venda.
   */
  const pruneSelection = (selected, options) => {
    if (!Array.isArray(selected) || selected.length === 0) return selected;
    if (!Array.isArray(options) || options.length === 0) return selected;
    const allowed = new Set(options.map((option) => String(option.value)));
    const kept = selected.filter((value) => allowed.has(String(value)));
    return kept.length === selected.length ? selected : kept;
  };

  return { facets, isLoading, error, fetchFacets, cancelFacets, pruneSelection };
}
