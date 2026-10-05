// src/utils/marketplacePresentation.js
//
// Texto exibido para os valores crus que os canais devolvem.
//
// O TikTok Shop grava e devolve AWAITING_SHIPMENT, SELLER, FULFILLMENT_BY_TIKTOK,
// e a conta pode ficar em reconnect_needed. Essas strings são contrato com a API
// e com o banco: continuam sendo o `value` de filtros, selects e chamadas. Aqui
// só nasce o `label` em português.
//
// Convenções:
//   - funções puras: recebem o valor CRU e devolvem o rótulo;
//   - a caixa não importa. O status do pedido chega em MAIÚSCULAS na venda e em
//     minúsculas na faceta de filtro (o backend aplica LOWER);
//   - valor vazio ou nulo vira "—", nunca um rótulo em branco;
//   - valor desconhecido nunca some. O status de pedido vira
//     "Status TikTok não traduzido: <valor>" e os demais domínios mostram o
//     próprio texto cru. Um valor novo da API aparece na tela, em vez de ficar
//     escondido, e dá para achá-lo e acrescentar no mapa;
//   - Mercado Livre e Shopee seguem com os rótulos que as telas já têm. Este
//     arquivo só cobre o TikTok e devolve os outros canais para quem chamou.

import { marketplaceCode } from './marketplaces';

const EMPTY_LABEL = '—';

function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === '';
}

function rawText(value) {
  return String(value).trim();
}

/**
 * Tabela de rótulos que ignora a caixa do valor. Devolve `undefined` quando o
 * valor é vazio ou não está na tabela; quem chama decide o que exibir.
 * Usa Map de propósito: num objeto comum, 'constructor' acharia uma função.
 */
function labelTable(entries) {
  const table = new Map(
    Object.entries(entries).map(([raw, label]) => [raw.toLowerCase(), label])
  );
  return (value) => (isBlank(value) ? undefined : table.get(rawText(value).toLowerCase()));
}

/** Rótulo do mapa; valor fora dele aparece como veio. */
function labelOrRaw(table, value) {
  if (isBlank(value)) return EMPTY_LABEL;
  return table(value) ?? rawText(value);
}

// --- Pedido -----------------------------------------------------------------

// `order_status` do pedido (coluna tiktok_sales.order_status). O sync grava em
// MAIÚSCULAS e usa DESCONHECIDO quando a API não manda status (router/tiktok.js,
// orderToRows). SHIPPED e NOT_DELIVERED entram porque o backend também os trata
// como "já saiu" (router/sales.js, U_SHIPPED_STATUSES).
const orderStatus = labelTable({
  UNPAID: 'Aguardando pagamento',
  ON_HOLD: 'Em espera',
  AWAITING_SHIPMENT: 'Aguardando envio',
  AWAITING_COLLECTION: 'Aguardando coleta',
  PARTIALLY_SHIPPING: 'Parcialmente enviado',
  CANCELLED: 'Cancelado',
  SHIPPED: 'Enviado',
  IN_TRANSIT: 'Em trânsito',
  DELIVERED: 'Entregue',
  COMPLETED: 'Concluído',
  NOT_DELIVERED: 'Não entregue',
  DESCONHECIDO: 'Status desconhecido',
});

// `shipping_type` do pedido: quem faz a logística.
const shippingType = labelTable({
  SELLER: 'Envio pelo vendedor',
  TIKTOK: 'Logística TikTok',
});

// `fulfillment_type` do pedido. FULL é o nome que o sistema já usa para "a
// expedição é do marketplace": o fulfillment do Mercado Livre e o sync do TikTok
// gravam shipping_mode = 'FULL'.
const fulfillmentType = labelTable({
  FULFILLMENT_BY_TIKTOK: 'FULL (TikTok)',
  FULFILLMENT_BY_SELLER: 'Envio próprio',
});

// --- Loja, sincronização e etiqueta ----------------------------------------

// `status` da loja em tiktok_accounts (router/tiktok.js e utils/tiktokClient.js).
const accountStatus = labelTable({
  active: 'Ativa',
  error: 'Com erro',
  reconnect_needed: 'Reconexão necessária',
});

// `status` da sincronização (tiktok_sync_cursors / tiktok_sync_jobs). `never` é
// o que /tiktok/last-sync devolve para loja que nunca sincronizou.
const syncJobStatus = labelTable({
  running: 'Sincronizando',
  success: 'Concluída',
  error: 'Com erro',
  never: 'Nunca sincronizou',
});

// `status` de /tiktok/label-info.
const labelState = labelTable({
  ready: 'Etiqueta pronta',
  blocked: 'Etiqueta bloqueada',
  not_applicable: 'Sem etiqueta neste pedido',
  awaiting_shipment: 'Aguardando envio para gerar etiqueta',
});

/**
 * Status do pedido no TikTok Shop.
 * Valor fora do mapa vira "Status TikTok não traduzido: <valor>".
 */
export function tiktokOrderStatusLabel(value) {
  if (isBlank(value)) return EMPTY_LABEL;
  return orderStatus(value) ?? `Status TikTok não traduzido: ${rawText(value)}`;
}

/** `true` quando o valor é um status de pedido que o TikTok Shop usa. */
export function isTikTokOrderStatus(value) {
  return orderStatus(value) !== undefined;
}

/** Tipo de envio do pedido (SELLER, TIKTOK). */
export function tiktokShippingTypeLabel(value) {
  return labelOrRaw(shippingType, value);
}

/** Tipo de fulfillment do pedido (FULFILLMENT_BY_TIKTOK, FULFILLMENT_BY_SELLER). */
export function tiktokFulfillmentTypeLabel(value) {
  return labelOrRaw(fulfillmentType, value);
}

// Códigos crus de tipo de envio e de fulfillment, sempre em MAIÚSCULAS. A
// comparação é exata para não mexer em 'TikTok', que é texto do sistema.
const RAW_SHIPPING_CODES = new Map([
  ['SELLER', shippingType('SELLER')],
  ['TIKTOK', shippingType('TIKTOK')],
  ['FULFILLMENT_BY_TIKTOK', fulfillmentType('FULFILLMENT_BY_TIKTOK')],
  ['FULFILLMENT_BY_SELLER', fulfillmentType('FULFILLMENT_BY_SELLER')],
]);

/**
 * Modalidade de envio (`shipping_mode`). O sync grava 'FULL', o nome da
 * transportadora, 'Envio próprio' ou 'TikTok' (router/tiktok.js, orderToRows):
 * tudo isso já é o texto de tela e nome de transportadora não se traduz, então
 * sai como está. Só os códigos crus de tipo de envio, se chegarem até aqui,
 * viram o rótulo.
 */
export function tiktokShippingModeLabel(value) {
  if (isBlank(value)) return EMPTY_LABEL;
  const text = rawText(value);
  return RAW_SHIPPING_CODES.get(text) ?? text;
}

/** Status da loja (active, error, reconnect_needed). */
export function tiktokAccountStatusLabel(value) {
  return labelOrRaw(accountStatus, value);
}

/** Status da sincronização (running, success, error, never). */
export function tiktokSyncJobStatusLabel(value) {
  return labelOrRaw(syncJobStatus, value);
}

/** Estado da etiqueta (ready, blocked, not_applicable, awaiting_shipment). */
export function tiktokLabelStateLabel(value) {
  return labelOrRaw(labelState, value);
}

/**
 * Rótulo do status do pedido conforme o canal.
 *
 *   - TikTok ('TikTok', 'tiktok' ou 'tt'): mapa do TikTok; valor fora do mapa
 *     vira "Status TikTok não traduzido: <valor>".
 *   - Canal em branco: é a opção de filtro, que mistura canais (o backend agrupa
 *     por LOWER(order_status) e devolve label === value). Traduz só o que é
 *     reconhecidamente status do TikTok; o resto vai para `fallback`.
 *   - Mercado Livre, Shopee e demais: `fallback`, ou seja, o que a tela já fazia.
 *
 * `fallback` é a função de rótulo que a tela já tinha. Sem ela, o canal que não
 * é TikTok recebe o texto cru.
 */
export function marketplaceStatusLabel(marketplace, rawStatus, fallback) {
  const isTikTok = isBlank(marketplace)
    ? isTikTokOrderStatus(rawStatus)
    : marketplaceCode(marketplace) === 'TikTok';
  if (isTikTok) return tiktokOrderStatusLabel(rawStatus);
  if (typeof fallback === 'function') return fallback(rawStatus);
  return isBlank(rawStatus) ? EMPTY_LABEL : rawText(rawStatus);
}
