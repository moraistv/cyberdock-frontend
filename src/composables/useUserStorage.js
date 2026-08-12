import { reactive, computed, watch } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useServices } from '@/composables/useServices';
import { API_BASE_URL } from '@/config.js';

// Cache reativo por usuário
const userStorageCache = reactive({});

// -------- Helpers de rede --------
async function safeErrorMessage(response) {
  const text = await response.text();
  try {
    const data = JSON.parse(text);
    return data?.error || data?.message || `${response.status} ${response.statusText}`;
  } catch {
    return text || `${response.status} ${response.statusText}`;
  }
}

async function safeJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Resposta inválida do servidor.');
  }
}

/**
 * @param {import('vue').Ref<string|null>} userId
 * @param {Function|null} onInitialLoad
 * @param {{ withMovements?: boolean, withPackageTypes?: boolean, withBilling?: boolean, withContracts?: boolean }} options
 *   Recursos pesados podem ser desativados por tela. O histórico é paginado e
 *   carregado sob demanda no Armazenamento; o Dashboard não usa tipos de pacote.
 */
export function useUserStorage(userId, onInitialLoad = null, options = {}) {
  const {
    withMovements = true,
    withPackageTypes = true,
    withBilling = true,
    withContracts = true,
  } = options;
  const { token } = useAuth();

  const createNewUserState = () => ({
    skus: [],
    volumeConsumido: 0,
    isLoading: false,
    error: null,
    billingSummary: { isLoading: true, data: null, error: null },
    allMovements: [],
    isLoadingMovements: false,
    movementsLoaded: false,
    movementPagination: { total: 0, page: 1, limit: 25, totalPages: 1 },
    packageTypes: [],
    isLoadingPackageTypes: false,
    packageTypesError: null,
    // A flag initialFetchCompleted foi removida para garantir que os dados sejam sempre atualizados.
  });

  const userState = computed(() => {
    const currentId = userId.value;
    if (!currentId) return null;
    if (!userStorageCache[currentId]) {
      userStorageCache[currentId] = createNewUserState();
    }
    return userStorageCache[currentId];
  });

  const servicesComposable = useServices();
  const volumeContratado = computed(() =>
    servicesComposable.clientServices.value.reduce((total, service) => total + (service.volume || 0), 0)
  );

  const percentualOcupacao = computed(() => {
    if (!userState.value) return 0;
    return volumeContratado.value === 0
      ? 0
      : Math.min((userState.value.volumeConsumido / volumeContratado.value) * 100, 100);
  });

  const calcularVolumePorSku = (sku) => {
    if (!sku) return 0;
    
    // Para kits, volume padrão é 0 já que não têm componentes
    if (sku.is_kit) {
      return 0;
    }
    
    // Para SKUs individuais, cálculo normal
    if (!sku.dimensoes) return 0;
    const { altura, largura, comprimento } = sku.dimensoes;
    return ((altura * largura * comprimento) / 1000000) * sku.quantidade;
  };

  const fetchSkus = async (currentUserId) => {
    if (!currentUserId) return;
    const state = userStorageCache[currentUserId];
    try {
      const response = await fetch(`${API_BASE_URL}/storage/user/${currentUserId}/skus`, {
        headers: { 'Authorization': `Bearer ${token.value}` }
      });
      if (!response.ok) throw new Error(await safeErrorMessage(response));
      const fetchedSkus = (await safeJson(response)) || [];
      state.skus = Array.isArray(fetchedSkus) ? fetchedSkus : [];
      state.volumeConsumido = state.skus.reduce((total, sku) => total + calcularVolumePorSku(sku), 0);
    } catch (err) {
      state.error = err.message;
      state.skus = [];
    }
  };

  const fetchPackageTypes = async (currentUserId) => {
    if (!currentUserId) return;
    const state = userStorageCache[currentUserId];
    state.isLoadingPackageTypes = true;
    try {
      const response = await fetch(`${API_BASE_URL}/storage/package-types`, {
        headers: { 'Authorization': `Bearer ${token.value}` }
      });
      if (!response.ok) throw new Error(await safeErrorMessage(response));
      state.packageTypes = (await safeJson(response)) || [];
    } catch (err) {
      state.packageTypesError = err.message;
    } finally {
      state.isLoadingPackageTypes = false;
    }
  };

  const fetchBillingSummary = async (currentUserId) => {
    if (!currentUserId) return;
    const state = userStorageCache[currentUserId];
    state.billingSummary.isLoading = true;
    try {
      const response = await fetch(`${API_BASE_URL}/storage/user/${currentUserId}/billing-summary`, {
        headers: { 'Authorization': `Bearer ${token.value}` }
      });
      if (!response.ok) throw new Error(await safeErrorMessage(response));
      state.billingSummary.data = await safeJson(response);
      state.billingSummary.error = null;
    } catch (err) {
      state.billingSummary.error = err.message;
      state.billingSummary.data = null;
    } finally {
      state.billingSummary.isLoading = false;
    }
  };

  // Movimentações paginadas e carregadas apenas quando a tela solicitar.
  const fetchAllMovements = async (currentUserId = userId.value, page = 1, limit = 25) => {
    if (!currentUserId) return;
    const state = userStorageCache[currentUserId];
    state.isLoadingMovements = true;
    try {
      const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
      const response = await fetch(`${API_BASE_URL}/storage/user/${currentUserId}/movements?${qs}`, {
        headers: { 'Authorization': `Bearer ${token.value}` }
      });
      if (!response.ok) throw new Error(await safeErrorMessage(response));
      const payload = (await safeJson(response)) || {};
      state.allMovements = Array.isArray(payload) ? payload : (payload.data || []);
      state.movementPagination = Array.isArray(payload)
        ? { total: payload.length, page: 1, limit: payload.length || limit, totalPages: 1 }
        : {
            total: payload.total || 0,
            page: payload.page || page,
            limit: payload.limit || limit,
            totalPages: payload.totalPages || 1,
          };
      state.movementsLoaded = true;
    } catch (err) {
      state.allMovements = [];
      state.movementsLoaded = true;
    } finally {
      state.isLoadingMovements = false;
    }
  };

  const deleteMovement = async (movementId) => {
    const currentUserId = userId.value;
    if (!movementId) throw new Error('ID da movimentação é obrigatório.');

    const res = await fetch(`${API_BASE_URL}/storage/movements/${movementId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Accept': 'application/json'
      }
    });

    if (!res.ok) throw new Error(await safeErrorMessage(res));

    // Atualiza dados locais
    await fetchSkus(currentUserId);
    await fetchBillingSummary(currentUserId);
    await fetchAllMovements(currentUserId);
    return true;
  };

  // Conectar SKU a kits existentes
  const connectSkuToKits = async (skuId, connections) => {
    console.log('connectSkuToKits called with skuId:', skuId);
    console.log('connectSkuToKits called with connections:', connections);
    console.log('connectSkuToKits called with currentUserId:', userId.value);
    
    const currentUserId = userId.value;
    if (!skuId || !connections || !currentUserId) {
      console.error('connectSkuToKits validation failed:', { skuId, connections, currentUserId });
      return;
    }

    const requestBody = {
      sku_id: skuId,
      connections: connections
    };
    
    console.log('connectSkuToKits request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${API_BASE_URL}/storage/user/${currentUserId}/connect-sku-to-kits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('connectSkuToKits response status:', response.status);
    console.log('connectSkuToKits response ok:', response.ok);

    if (!response.ok) {
      const errorMessage = await safeErrorMessage(response);
      console.error('connectSkuToKits error:', errorMessage);
      throw new Error(errorMessage);
    }

    // Recarregar dados após conectar
    await loadAllData();
    
    const result = await safeJson(response);
    console.log('connectSkuToKits result:', result);
    return result;
  };

  // Desconectar SKU de kit
  const disconnectSkuFromKit = async (skuId, kitId) => {
    const currentUserId = userId.value;
    if (!skuId || !kitId || !currentUserId) return;

    const response = await fetch(`${API_BASE_URL}/storage/user/${currentUserId}/disconnect-sku-from-kit`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`,
      },
      body: JSON.stringify({
        sku_id: skuId,
        kit_id: kitId
      }),
    });

    if (!response.ok) {
      const errorMessage = await safeErrorMessage(response);
      throw new Error(errorMessage);
    }

    // Recarregar dados após desconectar
    await loadAllData();
    
    return await safeJson(response);
  };

  // Buscar conexões de um SKU com kits
  const getSkuKitConnections = async (skuId) => {
    const currentUserId = userId.value;
    if (!skuId || !currentUserId) return [];

    const response = await fetch(`${API_BASE_URL}/storage/user/${currentUserId}/sku/${skuId}/kit-connections`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`,
      },
    });

    if (!response.ok) {
      const errorMessage = await safeErrorMessage(response);
      throw new Error(errorMessage);
    }

    return await safeJson(response) || [];
  };

  const loadAllData = async () => {
    const currentUserId = userId.value;
    if (!currentUserId || !token.value || !userState.value) return;

    const state = userState.value;
    // A verificação de 'initialFetchCompleted' foi removida para permitir a recarga dos dados.
    if (state.isLoading) return;

    state.isLoading = true;
    state.error = null;

    try {
      const jobs = [fetchSkus(currentUserId)];
      if (withPackageTypes) jobs.push(fetchPackageTypes(currentUserId));
      if (withContracts) jobs.push(servicesComposable.fetchClientServices(currentUserId));
      if (withBilling) jobs.push(fetchBillingSummary(currentUserId));
      if (withMovements) jobs.push(fetchAllMovements(currentUserId, 1, 25));
      await Promise.all(jobs);
    } catch (e) {
      state.error = e.message || 'Falha ao carregar dados do armazenamento.';
    } finally {
      state.isLoading = false;
      if (onInitialLoad) onInitialLoad();
    }
  };

  watch(userId, (newUserId) => {
    if (newUserId) {
      loadAllData();
    }
  }, { immediate: true });

  // --------- ADD / UPDATE / DELETE / ADJUST (inalterados) ----------
  const addSku = async (skuData) => {
    const currentUserId = userId.value;
    
    console.log('🔧 [useUserStorage] addSku chamado com:', skuData)
    console.log('🔧 [useUserStorage] package_type_id recebido:', skuData?.package_type_id)

    const payload = {
      sku: String(skuData?.sku ?? '').trim(),
      descricao: String(skuData?.descricao ?? '').trim(),
      dimensoes: {
        altura: Number(skuData?.dimensoes?.altura),
        largura: Number(skuData?.dimensoes?.largura),
        comprimento: Number(skuData?.dimensoes?.comprimento),
      },
      quantidade: Number(skuData?.quantidade || 0),
      package_type_id: skuData?.package_type_id ?? null,
      kit_parent_id: skuData?.kit_parent_id ?? null,
      is_kit: skuData?.is_kit ?? false,
      // NOVOS CAMPOS
      is_monthly: skuData?.is_monthly ?? false,
      monthly_price: skuData?.is_monthly ? Number(skuData?.monthly_price) : null,
      monthly_start_date: skuData?.is_monthly ? skuData?.monthly_start_date : null
    };
    
    console.log('🔧 [useUserStorage] payload final:', payload)
    console.log('🔧 [useUserStorage] package_type_id no payload:', payload.package_type_id)

    if (!payload.sku || !payload.descricao) {
      throw new Error('Campos de SKU e descrição são obrigatórios.');
    }

    // Para SKUs individuais (não kits), validar dimensões
    if (!payload.is_kit) {
      if (!Number.isFinite(payload.dimensoes.altura) || payload.dimensoes.altura <= 0 ||
          !Number.isFinite(payload.dimensoes.largura) || payload.dimensoes.largura <= 0 ||
          !Number.isFinite(payload.dimensoes.comprimento) || payload.dimensoes.comprimento <= 0) {
        throw new Error('Dimensões (>0) são obrigatórias para SKUs individuais.');
      }
      
      // For regular SKUs, validate quantity
      if (!Number.isFinite(payload.quantidade) || payload.quantidade < 0) {
        throw new Error('Quantidade deve ser maior ou igual a 0 para SKUs normais.');
      }
    } else {
      // Para kits, quantidade sempre 0
      payload.quantidade = 0;
    }

    // Validação para SKUs mensais
    if (payload.is_monthly) {
      if (!Number.isFinite(payload.monthly_price) || payload.monthly_price <= 0) {
        throw new Error('Preço mensal deve ser maior que 0 para SKUs mensais.');
      }
      if (!payload.monthly_start_date) {
        throw new Error('Data de início é obrigatória para SKUs mensais.');
      }
    }

    console.log('🔧 [useUserStorage] Enviando requisição POST para:', `${API_BASE_URL}/storage/user/${currentUserId}/skus`)
    console.log('🔧 [useUserStorage] Headers:', {
      'Authorization': `Bearer ${token.value}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
    console.log('🔧 [useUserStorage] Body:', JSON.stringify(payload))
    
    const response = await fetch(`${API_BASE_URL}/storage/user/${currentUserId}/skus`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('🔧 [useUserStorage] Response status:', response.status)
    console.log('🔧 [useUserStorage] Response ok:', response.ok)
    
    if (!response.ok) throw new Error(await safeErrorMessage(response));

    console.log('🔧 [useUserStorage] SKU criado com sucesso, atualizando dados...')
    await fetchSkus(currentUserId);
    await fetchBillingSummary(currentUserId);
    await fetchAllMovements(currentUserId);
    console.log('🔧 [useUserStorage] Dados atualizados com sucesso')
  };
const updateSku = async (skuData) => {
  const currentUserId = userId.value;
  
  console.log('🔧 [useUserStorage] updateSku chamado com:', skuData)
  console.log('🔧 [useUserStorage] package_type_id para atualização:', skuData?.package_type_id)

  if (!skuData?.id) {
    throw new Error('ID do SKU é obrigatório para atualização.');
  }

  const updatePayload = {
    descricao: skuData.descricao,
    dimensoes: skuData.dimensoes,
    package_type_id: skuData.package_type_id,
    kit_parent_id: skuData.kit_parent_id,
    ativo: skuData.ativo
  };
  
  console.log('🔧 [useUserStorage] updatePayload:', updatePayload)
  console.log('🔧 [useUserStorage] package_type_id no updatePayload:', updatePayload.package_type_id)

  console.log('🔧 [useUserStorage] Enviando requisição PUT para:', `${API_BASE_URL}/storage/skus/${skuData.id}`)
  console.log('🔧 [useUserStorage] Headers:', {
    'Authorization': `Bearer ${token.value}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  })
  console.log('🔧 [useUserStorage] Body:', JSON.stringify(updatePayload))
  
  const response = await fetch(`${API_BASE_URL}/storage/skus/${skuData.id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token.value}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(updatePayload)
  });

  console.log('🔧 [useUserStorage] Response status:', response.status)
  console.log('🔧 [useUserStorage] Response ok:', response.ok)

  if (!response.ok) throw new Error(await safeErrorMessage(response));
  
  console.log('🔧 [useUserStorage] SKU atualizado com sucesso, atualizando dados...')
  await fetchSkus(currentUserId);
  await fetchBillingSummary(currentUserId);
  console.log('🔧 [useUserStorage] Dados atualizados com sucesso')
};

const removeSku = async (skuId) => {
  const currentUserId = userId.value;
  const response = await fetch(`${API_BASE_URL}/storage/skus/${skuId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token.value}`, 'Accept': 'application/json' }
  });
  if (!response.ok) throw new Error(await safeErrorMessage(response));
  await fetchSkus(currentUserId);
  await fetchBillingSummary(currentUserId);
  await fetchAllMovements(currentUserId);
};


  const adjustStock = async (sku, movementType, quantityChange, reason) => {
    const currentUserId = userId.value;

    const payload = {
      userId: currentUserId,
      movementType: String(movementType),
      quantityChange: Number(quantityChange),
      reason: String(reason || '').trim()
    };

    if (!payload.userId || !payload.movementType ||
        !Number.isFinite(payload.quantityChange) || payload.quantityChange < 1 ||
        !payload.reason) {
      throw new Error('Preencha tipo, quantidade (≥ 1) e motivo para ajustar o estoque.');
    }

    const skuCode = encodeURIComponent(sku.sku);
    
    const url = `${API_BASE_URL}/storage/sku/${skuCode}/movements?uid=${currentUserId}`;

    const res = await fetch(url, {
        method: 'POST',
        headers: {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(await safeErrorMessage(res));

    await fetchSkus(currentUserId);
    await fetchBillingSummary(currentUserId);
    await fetchAllMovements(currentUserId);
  };

  const fetchStockMovements = async (skuCode) => {
    const currentUserId = userId.value;
    if (!currentUserId || !skuCode) return [];

    const code = encodeURIComponent(skuCode);
    const url = `${API_BASE_URL}/storage/sku/${code}/movements?uid=${currentUserId}`;

    try {
        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token.value}`, 'Accept': 'application/json' }
        });
        if (!res.ok) throw new Error(await safeErrorMessage(res));
        const data = (await safeJson(res)) || [];
        return Array.isArray(data) ? data : [];
    } catch (err) {
        throw new Error(err.message || 'Não foi possível carregar o histórico de movimentações.');
    }
  };

  return {
    skus: computed(() => userState.value?.skus ?? []),
    volumeContratado,
    volumeConsumido: computed(() => userState.value?.volumeConsumido ?? 0),
    percentualOcupacao,
    isLoading: computed(() => userState.value?.isLoading ?? false),
    error: computed(() => userState.value?.error ?? null),
    billingSummary: computed(() => userState.value?.billingSummary ?? { isLoading: true, data: null, error: null }),
    allMovements: computed(() => userState.value?.allMovements ?? []),
    isLoadingMovements: computed(() => userState.value?.isLoadingMovements ?? false),
    movementsLoaded: computed(() => userState.value?.movementsLoaded ?? false),
    movementPagination: computed(() => userState.value?.movementPagination ?? { total: 0, page: 1, limit: 25, totalPages: 1 }),
    packageTypes: computed(() => userState.value?.packageTypes ?? []),
    isLoadingPackageTypes: computed(() => userState.value?.isLoadingPackageTypes ?? false),
    packageTypesError: computed(() => userState.value?.packageTypesError ?? null),
    loadStorageData: loadAllData,
    addSku,
    updateSku,
    removeSku,
    adjustStock,
    calcularVolumePorSku,
    fetchStockMovements,
    fetchAllMovements,
    deleteMovement,
    connectSkuToKits,
    disconnectSkuFromKit,
    getSkuKitConnections,
  };
}
