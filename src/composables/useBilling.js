// src/composables/useBilling.js
import { ref } from 'vue';
import { useApi } from './useApi';

export function useBilling() {
  const invoices = ref([]);
  const billingSummary = ref([]);
  const manualServices = ref([]); // serviços avulsos, vindos de /services?manualOnly=1
  const isLoading = ref(false);
  const error = ref(null);
  const api = useApi();

  const fetchInvoices = async (uid, period = null) => {
    if (!uid) return;
    isLoading.value = true;
    error.value = null;
    try {
      let url = `/billing/invoices/${uid}`;
      if (period) {
        url += `?period=${period}`;
      }
      const data = await api.get(url);
      invoices.value = data.map(inv => {
        const dueDate = new Date(inv.due_date);
        const formattedDueDate = `${String(dueDate.getUTCDate()).padStart(2, '0')}/${String(dueDate.getUTCMonth() + 1).padStart(2, '0')}/${dueDate.getUTCFullYear()}`;

        let formattedPaymentDate = null;
        if (inv.payment_date) {
          const paymentDate = new Date(inv.payment_date);
          formattedPaymentDate = `${String(paymentDate.getUTCDate()).padStart(2, '0')}/${String(paymentDate.getUTCMonth() + 1).padStart(2, '0')}/${paymentDate.getUTCFullYear()}`;
        }

        /* `closed_at` e `paid_at` são TIMESTAMPTZ, não DATE: aqui vale a hora
         * local de quem olha, e não UTC como no vencimento (que é um dia de
         * calendário e escorregaria um dia se lido no fuso do navegador). */
        const dataHora = (valor) => {
          if (!valor) return null;
          const d = new Date(valor);
          return Number.isNaN(d.getTime()) ? null : d.toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          });
        };

        return {
          ...inv,
          totalAmount: parseFloat(inv.total_amount),
          dueDate: formattedDueDate,
          paymentDate: formattedPaymentDate,
          /* Fechamento: já vinha no payload do backend e nenhuma tela usava.
           * `isClosed` evita que cada lugar refaça o teste de nulo. */
          isClosed: Boolean(inv.closed_at),
          closedAtLabel: dataHora(inv.closed_at),
          closedBy: inv.closed_by || null,
          paidAtLabel: dataHora(inv.paid_at),
          paidBy: inv.paid_by || null,
          /* Cobrança externa: preenchida só quando existir emissão no provedor.
           * Hoje nada popula, e a tela simplesmente não mostra o bloco. */
          asaasPaymentId: inv.asaas_payment_id || null,
          asaasStatus: inv.asaas_status || null,
          asaasInvoiceUrl: inv.asaas_invoice_url || null,
          items: inv.items || []
        };
      });
    } catch (e) {
      console.error('Erro ao buscar faturas:', e);
      error.value = e.message || 'Falha ao carregar faturas.';
      invoices.value = [];
    } finally {
      isLoading.value = false;
    }
  };

  const fetchBillingSummary = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const data = await api.get('/billing/summary');
      billingSummary.value = data.map(s => ({
        ...s,
        last_invoice_total: s.last_invoice_total ? parseFloat(s.last_invoice_total) : 0,
      }));
    } catch (e) {
      console.error('Erro ao buscar resumo de faturamento:', e);
      error.value = e.message || 'Falha ao carregar resumo.';
      billingSummary.value = [];
    } finally {
      isLoading.value = false;
    }
  };

  // Busca os serviços que podem ser lançados manualmente (catálogo)
  const fetchManualServices = async () => {
    try {
      // agora puxa do catálogo, com filtro manualOnly
      const data = await api.get('/services?manualOnly=1');
      manualServices.value = data; // [{id,name,type,price,config}, ...]
    } catch (e) {
      console.error('Erro ao buscar serviços avulsos:', e);
      // não popula error global
    }
  };

  // Adiciona um item de serviço manual na fatura
  const addManualService = async (payload) => {
    return api.post('/billing/add-manual-item', payload);
  };

  /**
   * Baixa ou reabre a fatura (somente master).
   * O status deixou de ser reescrito pelo recálculo, então a baixa persiste.
   */
  const setInvoiceStatus = async (uid, period, status, paymentDate = null) => {
    return api.patch(`/billing/invoices/${uid}/${period}/status`, { status, paymentDate });
  };

  /** Remove um serviço avulso lançado por engano (somente master). */
  const deleteManualItem = async (itemId) => {
    return api.delete(`/billing/manual-item/${itemId}`);
  };

  /**
   * Fecha a competência (somente master).
   *
   * É o que "gera" a fatura no sentido prático: enquanto a competência está
   * aberta, o total é recalculado a cada abertura da tela e uma venda
   * processada com data retroativa muda o valor. Fechar congela, e o valor
   * passa a ser o mesmo que pode ser cobrado do cliente por fora do sistema.
   *
   * O backend recalcula uma última vez antes de congelar, então o valor
   * congelado inclui as expedições mais recentes.
   */
  const closeInvoicePeriod = async (uid, period) => {
    return api.post(`/billing/invoices/${uid}/${period}/close`);
  };

  /**
   * Reabre a competência (somente master).
   *
   * `force` só é necessário quando já existe cobrança emitida no provedor: o
   * backend responde 409 `has_external_charge` sem ele, porque reabrir faz o
   * total voltar a mudar e ele pode divergir do documento que o cliente
   * recebeu.
   */
  const reopenInvoicePeriod = async (uid, period, { force = false } = {}) => {
    const query = force ? '?force=1' : '';
    return api.post(`/billing/invoices/${uid}/${period}/reopen${query}`);
  };

  return {
    invoices,
    billingSummary,
    manualServices,
    isLoading,
    error,
    fetchInvoices,
    fetchBillingSummary,
    fetchManualServices,
    addManualService,
    setInvoiceStatus,
    deleteManualItem,
    closeInvoicePeriod,
    reopenInvoicePeriod,
  };
}
