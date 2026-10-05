// src/utils/asaasStatus.js
//
// Rótulos em PT-BR para o status cru de uma cobrança do Asaas (`asaas_status`,
// `asaasStatus` na fatura mapeada por useBilling).
//
// O status chega em inglês e em CAIXA ALTA ("PENDING", "RECEIVED_IN_CASH"), e
// mostrar isso na tela obriga quem opera a traduzir de cabeça. `DELETED`
// indica cobrança removida no Asaas.

const ROTULOS = Object.freeze({
  PENDING: 'Aguardando pagamento',
  CONFIRMED: 'Pagamento confirmado',
  RECEIVED: 'Recebida',
  RECEIVED_IN_CASH: 'Recebida em dinheiro',
  OVERDUE: 'Vencida',
  REFUNDED: 'Estornada',
  REFUND_REQUESTED: 'Estorno solicitado',
  REFUND_IN_PROGRESS: 'Estorno em andamento',
  CHARGEBACK_REQUESTED: 'Chargeback solicitado',
  CHARGEBACK_DISPUTE: 'Chargeback em disputa',
  AWAITING_CHARGEBACK_REVERSAL: 'Aguardando reversão de chargeback',
  DUNNING_REQUESTED: 'Negativação solicitada',
  DUNNING_RECEIVED: 'Recebida (após negativação)',
  AWAITING_RISK_ANALYSIS: 'Em análise de risco',
  DELETED: 'Cancelada no Asaas',
});

/**
 * Rótulo em português do status de uma cobrança do Asaas.
 *
 * - vazio, nulo ou só espaços -> '' (quem chama decide o texto de "sem status");
 * - status conhecido          -> rótulo em PT-BR, com trim e caixa alta na busca;
 * - status desconhecido       -> o próprio texto. O Asaas cria status novos de
 *   tempos em tempos, e esconder um deles atrás de um rótulo genérico faria o
 *   operador perder exatamente a informação de que precisa.
 */
export function asaasStatusLabel(status) {
  if (status === null || status === undefined) return '';
  const texto = String(status).trim();
  if (!texto) return '';
  const chave = texto.toUpperCase();
  return Object.prototype.hasOwnProperty.call(ROTULOS, chave) ? ROTULOS[chave] : texto;
}
