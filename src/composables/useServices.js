// composables/useServices.js
import { computed, ref } from 'vue';
import { useApi } from './useApi';
import { useNotification } from './useNotification';

/**
 * Tipos de cobrança reconhecidos pelo faturamento (espelha router/services.js).
 * Um serviço salvo sem tipo NÃO é cobrado por nenhuma rotina — foi assim que um
 * armazenamento de R$ 397 ficou invisível para a fatura.
 */
export const SERVICE_TYPE_OPTIONS = [
    { value: 'base_storage', label: 'Armazenamento inicial (mensal)', hint: 'Cobrado todo mês, com proporcional no mês de entrada do cliente.' },
    { value: 'base_storage_50', label: 'Armazenamento inicial 50% | FULL (mensal)', hint: 'Metade do armazenamento inicial, para operação Full. Também tem proporcional na entrada.' },
    { value: 'additional_storage', label: 'Armazenamento adicional por m³ (mensal)', hint: 'Multiplicado pelo volume contratado. Nunca é proporcional.' },
    { value: 'avulso_simples', label: 'Avulso com preço fixo', hint: 'Lançado manualmente na fatura, sempre pelo mesmo valor.' },
    { value: 'avulso_quantidade', label: 'Avulso com preço por faixa de quantidade', hint: 'Lançado com uma quantidade; o sistema escolhe a faixa de preço sozinho.' },
];

export const UNIT_OPTIONS = [
    { value: 'm3', label: 'm³ (metro cúbico)' },
    { value: 'pacote', label: 'pacote' },
    { value: 'viagem', label: 'viagem' },
    { value: 'venda', label: 'venda' },
    { value: 'unidade', label: 'unidade' },
];

const UNIT_LABELS = { m3: 'm³', pacote: 'pacote', viagem: 'viagem', venda: 'venda', unidade: 'unidade' };

export function unitLabel(unit, quantity = 1) {
    const label = UNIT_LABELS[unit] || unit || '';
    if (!label || label === 'm³') return label;
    return quantity > 1 ? `${label}s` : label;
}

export function serviceTypeLabel(type) {
    if (!type) return 'Não faturado';
    return SERVICE_TYPE_OPTIONS.find((o) => o.value === type)?.label || type;
}

/** "De 101 até 300" / "Acima de 301" */
export function tierRangeLabel(tier) {
    const from = Number(tier.from) || 1;
    if (tier.to === null || tier.to === undefined || tier.to === '') return `Acima de ${from}`;
    return `${from} a ${tier.to}`;
}

/**
 * Ícone de cada tipo de cobrança, para o catálogo ser lido de relance.
 * SVG inline (o projeto não usa biblioteca de ícones), traço herdando a cor.
 */
const TYPE_ICONS = {
    // Caixa: armazenamento
    base_storage: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
    // Caixa cortada ao meio: metade do armazenamento
    base_storage_50: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><line x1="12" y1="2.5" x2="12" y2="21.5"/><path d="M12 12l8.73-5.04"/>',
    // Caixas empilhadas: m³ adicional
    additional_storage: '<rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/><rect x="8" y="3" width="8" height="8" rx="1"/>',
    // Caminhão: serviço avulso de preço fixo (coleta, transbordo)
    avulso_simples: '<rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
    // Etiquetas em camadas: preço por faixa de quantidade
    avulso_quantidade: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
    // Alerta: sem tipo, não é faturado
    none: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
};

export function serviceTypeIcon(type) {
    const paths = TYPE_ICONS[type] || TYPE_ICONS.none;
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

/**
 * Composable para gerenciar o catálogo de serviços/produtos e os serviços contratados pelos clientes.
 */
export function useServices() {
    const api = useApi();
    const notify = useNotification();
    
    // --- Estado do Catálogo de Serviços ---
    const services = ref([]);
    const isLoadingServices = ref(true);
    const serviceCatalogueError = ref(null);

    // --- Estado para Modais do Catálogo ---
    const isServiceModalOpen = ref(false);
    const isDeleteServiceModalOpen = ref(false);
    const isEditingService = ref(false);
    const currentService = ref(null);
    const serviceToDelete = ref(null);
    const serviceFormError = ref(null);

    // --- Estado para Serviços Contratados do Cliente ---
    const clientServices = ref([]);
    const isLoadingClientServices = ref(false);
    const clientServicesError = ref(null);

    /**
     * Busca o catálogo de serviços/produtos do backend.
     */
    async function fetchServices() {
        isLoadingServices.value = true;
        serviceCatalogueError.value = null;
        try {
            const data = await api.get('/services');
            services.value = data;
        } catch (err) {
            console.error("Erro ao carregar serviços:", err);
            serviceCatalogueError.value = err.message || "Não foi possível carregar o catálogo de serviços.";
        } finally {
            isLoadingServices.value = false;
        }
    }

    /**
     * Adiciona ou atualiza um serviço/produto no catálogo.
     */
    /** Valida no cliente as mesmas regras do backend, para dar erro na hora. */
    function validateCurrentService() {
        const s = currentService.value;
        if (!s?.name?.trim()) return 'Informe o nome do serviço.';
        if (!s.type) return 'Escolha o tipo de cobrança, senão o serviço não será faturado.';

        if (s.type === 'avulso_quantidade') {
            const tiers = s.config?.tiers || [];
            if (!tiers.length) return 'Adicione ao menos uma faixa de preço.';
            for (const tier of tiers) {
                if (!Number.isFinite(Number(tier.from)) || Number(tier.from) < 1) return 'Faixa com início inválido.';
                if (!Number.isFinite(Number(tier.price)) || Number(tier.price) < 0) return 'Faixa com preço inválido.';
                if (tier.to !== null && tier.to !== undefined && tier.to !== '' && Number(tier.to) < Number(tier.from)) {
                    return 'Uma faixa tem o fim menor que o início.';
                }
            }
            const hasOpen = tiers.some((t) => t.to === null || t.to === undefined || t.to === '');
            if (!hasOpen) return 'Deixe a última faixa sem valor final, para cobrir quantidades maiores.';
            return null;
        }

        if (s.price == null || Number(s.price) < 0) return 'Informe um preço válido.';
        return null;
    }

    async function handleSaveService() {
        serviceFormError.value = null;
        const invalid = validateCurrentService();
        if (invalid) {
            serviceFormError.value = invalid;
            return;
        }

        const s = currentService.value;
        const payload = {
            name: s.name.trim(),
            type: s.type,
            unit: s.unit || null,
            description: s.description || null,
            // Serviço por faixa não tem preço único: o valor sai do tier.
            price: s.type === 'avulso_quantidade' ? 0 : Number(s.price),
            config: s.type === 'avulso_quantidade'
                ? {
                    ...(s.config || {}),
                    tiers: (s.config?.tiers || []).map((t) => ({
                        from: Number(t.from),
                        to: t.to === '' || t.to === null || t.to === undefined ? null : Number(t.to),
                        price: Number(t.price),
                    })),
                }
                : (s.config ?? null),
        };

        try {
            if (isEditingService.value) {
                await api.put(`/services/${s.id}`, payload);
            } else {
                await api.post('/services', payload);
            }

            await fetchServices(); // Recarrega a lista
            closeServiceModal();

        } catch (err) {
            console.error("Erro ao salvar serviço:", err);
            serviceFormError.value = err.message || 'Falha ao salvar o item.';
        }
    }

    /**
     * Exclui um serviço/produto do catálogo.
     */
    async function handleConfirmDeleteService() {
        if (!serviceToDelete.value) return;

        try {
            await api.delete(`/services/${serviceToDelete.value.id}`);
            await fetchServices(); // Recarrega a lista
            closeDeleteServiceModal();
        } catch (err) {
            console.error("Erro ao excluir serviço:", err);
            notify.fromError(err, "Falha ao excluir o item.");
        }
    }

    /**
     * Busca os serviços contratados por um cliente específico.
     * @param {string} uid - O UID do usuário
     */
    async function fetchClientServices(uid) {
        isLoadingClientServices.value = true;
        clientServicesError.value = null;
        try {
            const data = await api.get(`/users/contracts/${uid}`);
            clientServices.value = data.contracts || [];
        } catch (err) {
            console.error("Erro ao carregar serviços do cliente:", err);
            clientServicesError.value = err.message || "Não foi possível carregar os serviços do cliente.";
            clientServices.value = [];
        } finally {
            isLoadingClientServices.value = false;
        }
    }

    /**
     * Adiciona um novo serviço contratado para o cliente.
     * @param {string} uid - O UID do usuário
     * @param {object} contractData - Dados do contrato a ser adicionado
     */
    async function addClientService(uid, contractData) {
        try {
            await api.post(`/users/contracts/${uid}`, contractData);
            await fetchClientServices(uid); // Recarrega a lista do cliente
        } catch (err) {
            console.error("Erro ao adicionar serviço ao cliente:", err);
            notify.fromError(err, "Falha ao adicionar serviço.");
        }
    }

    /**
     * Remove um serviço contratado do cliente.
     * @param {string} uid - O UID do usuário
     * @param {number} contractId - ID do contrato a ser removido
     */
    async function removeClientService(uid, contractId) {
        try {
            await api.delete(`/users/contracts/${uid}/${contractId}`);
            await fetchClientServices(uid); // Recarrega a lista do cliente
        } catch (err) {
            console.error("Erro ao remover serviço do cliente:", err);
            notify.fromError(err, "Falha ao remover serviço.");
        }
    }

    // --- Funções do Modal do Catálogo ---
    const openServiceModal = (service = null) => {
        isEditingService.value = !!service;
        serviceFormError.value = null;
        currentService.value = service
            ? {
                ...service,
                type: service.type || '',
                unit: service.unit || 'unidade',
                description: service.description || '',
                // Clona as faixas para o formulário não editar o objeto da lista.
                config: service.config
                    ? { ...service.config, tiers: (service.config.tiers || []).map((t) => ({ ...t })) }
                    : { tiers: [] },
            }
            : { name: '', price: 0, description: '', type: '', unit: 'unidade', config: { tiers: [] } };
        isServiceModalOpen.value = true;
    };
    const closeServiceModal = () => {
        isServiceModalOpen.value = false;
        currentService.value = null;
        serviceFormError.value = null;
    };

    /** Nova faixa já começa depois do fim da anterior. */
    const addTier = () => {
        if (!currentService.value) return;
        if (!currentService.value.config) currentService.value.config = { tiers: [] };
        if (!currentService.value.config.tiers) currentService.value.config.tiers = [];
        const tiers = currentService.value.config.tiers;
        const last = tiers[tiers.length - 1];
        const nextFrom = last && Number(last.to) ? Number(last.to) + 1 : (last ? Number(last.from) + 1 : 1);
        tiers.push({ from: nextFrom, to: null, price: 0 });
    };

    const removeTier = (index) => {
        const tiers = currentService.value?.config?.tiers;
        if (tiers && tiers.length > 1) tiers.splice(index, 1);
    };

    /** Serviços que não entram em nenhuma fatura por não terem tipo. */
    const untypedServicesCount = computed(() => services.value.filter((s) => !s.type).length);

    const selectedTypeHint = computed(() => {
        const type = currentService.value?.type;
        return SERVICE_TYPE_OPTIONS.find((o) => o.value === type)?.hint
            || 'Escolha como este serviço entra na fatura.';
    });

    // Funções do Modal de Deleção do Catálogo
    const openDeleteServiceModal = (service) => {
        serviceToDelete.value = service;
        isDeleteServiceModalOpen.value = true;
    };
    const closeDeleteServiceModal = () => {
        isDeleteServiceModalOpen.value = false;
        serviceToDelete.value = null;
    };

    const formatCurrency = (value) => {
        if (typeof value !== 'number') return 'R$ 0,00';
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };
    
    return {
        // Catálogo de Serviços
        services,
        isLoadingServices,
        serviceCatalogueError,
        isEditingService,
        currentService,
        isServiceModalOpen,
        isDeleteServiceModalOpen,
        serviceToDelete,
        openServiceModal,
        closeServiceModal,
        handleSaveService,
        openDeleteServiceModal,
        closeDeleteServiceModal,
        handleConfirmDeleteService,
        fetchServices,

        // Tipo de cobrança, unidade e faixas de preço
        serviceFormError,
        serviceTypeOptions: SERVICE_TYPE_OPTIONS,
        unitOptions: UNIT_OPTIONS,
        selectedTypeHint,
        addTier,
        removeTier,
        serviceTypeLabel,
        unitLabel,
        tierRangeLabel,
        serviceTypeIcon,
        untypedServicesCount,

        // Serviços do Cliente
        clientServices,
        isLoadingClientServices,
        clientServicesError,
        fetchClientServices,
        addClientService,
        removeClientService,

        // Utilitários
        formatCurrency,
    };
}
