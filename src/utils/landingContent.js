// src/utils/landingContent.js
//
// Conteúdo da landing page. Tudo que aparece em texto e número está aqui, para
// a equipe editar sem abrir componente.
//
// REGRA DA CASA: nada de dado inventado. Preços vêm de utils/pricing.js (que
// espelha a tabela oficial e o catálogo do backend). Os textos de serviço
// repetem o que está na tabela oficial e o que o painel realmente faz. Não há
// cliente, métrica, prazo ou selo aqui porque não existe fonte para eles.

import { MARKETPLACES } from '@/utils/marketplaces';
import {
  FULL_ASSEMBLY_TIERS,
  PRICE_CENTS,
  SHIPPING_PLANS,
  calculateEstimate,
  formatCents,
} from '@/utils/pricing';

/* ---------------------------------------------------------------------------
 * CONTATO
 *
 * Hoje o repositório não tem WhatsApp nem e-mail comercial, então os botões de
 * contato ficam ESCONDIDOS enquanto estes campos estiverem vazios. A página
 * continua inteira: os botões de ação passam a ser "Simular meu custo" e
 * "Entrar no painel".
 *
 * Para ativar, preencha aqui (ou defina VUE_APP_LANDING_WHATSAPP e
 * VUE_APP_LANDING_EMAIL na hora do build; o Dockerfile atual não repassa
 * variáveis ao build, então editar este arquivo é o caminho mais curto).
 *
 *   whatsapp: DDD + número, com ou sem o 55. Ex.: '11999998888'
 *   email:    endereço completo.
 * ------------------------------------------------------------------------- */
const CONTACT_SETTINGS = Object.freeze({
  whatsapp: '',
  email: '',
});

const onlyDigits = (value) => String(value ?? '').replace(/\D/g, '');

function normalizeWhatsapp(value) {
  const digits = onlyDigits(value);
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  if (digits.length >= 12 && digits.length <= 15) return digits;
  return '';
}

function normalizeEmail(value) {
  const email = String(value ?? '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

export const LANDING_CONTACT = Object.freeze({
  whatsapp: normalizeWhatsapp(process.env.VUE_APP_LANDING_WHATSAPP || CONTACT_SETTINGS.whatsapp),
  email: normalizeEmail(process.env.VUE_APP_LANDING_EMAIL || CONTACT_SETTINGS.email),
});

export const HAS_CONTACT = Boolean(LANDING_CONTACT.whatsapp || LANDING_CONTACT.email);

export function whatsappLink(message = '') {
  if (!LANDING_CONTACT.whatsapp) return '';
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${LANDING_CONTACT.whatsapp}${text}`;
}

export function mailLink(subject = '', body = '') {
  if (!LANDING_CONTACT.email) return '';
  const query = [
    subject ? `subject=${encodeURIComponent(subject)}` : '',
    body ? `body=${encodeURIComponent(body)}` : '',
  ].filter(Boolean).join('&');
  return `mailto:${LANDING_CONTACT.email}${query ? `?${query}` : ''}`;
}

const DEFAULT_CONTACT_MESSAGE = 'Olá! Vim pelo site da CyberDock e gostaria de uma proposta.';

/**
 * Ação de contato principal, ou null quando não há canal configurado (os
 * componentes então nem desenham o botão). WhatsApp tem prioridade sobre e-mail.
 */
export function contactAction(message = DEFAULT_CONTACT_MESSAGE) {
  if (LANDING_CONTACT.whatsapp) {
    return { channel: 'whatsapp', href: whatsappLink(message), label: 'Falar no WhatsApp', external: true };
  }
  if (LANDING_CONTACT.email) {
    return { channel: 'email', href: mailLink('Proposta CyberDock', message), label: 'Falar por e-mail', external: false };
  }
  return null;
}

/* ---------------------------------------------------------------------------
 * PÁGINA
 * ------------------------------------------------------------------------- */
export const PAGE_TITLE = 'CyberDock | Fulfillment para quem vende em marketplaces';
export const PAGE_DESCRIPTION = 'A CyberDock guarda, embala e envia os pedidos da sua loja no Mercado Livre, Shopee e TikTok Shop. Veja a tabela de preços e simule o custo mensal.';

export const NAV_LINKS = Object.freeze([
  { id: 'servicos', label: 'Serviços' },
  { id: 'como-funciona', label: 'Como funciona' },
  { id: 'precos', label: 'Preços' },
  { id: 'calculadora', label: 'Calculadora' },
  { id: 'perguntas', label: 'Perguntas' },
]);

/** Canais integrados, na ordem de exibição, com logo e rótulo do cadastro central. */
export const CHANNELS = Object.freeze([
  MARKETPLACES.ML,
  MARKETPLACES.Shopee,
  MARKETPLACES.TikTok,
]);

/* ---------------------------------------------------------------------------
 * HERO
 * ------------------------------------------------------------------------- */
export const HERO_POINTS = Object.freeze([
  'Tabela de preços aberta, aqui na página',
  'Calculadora de custo mensal',
  'Painel com as vendas de todos os canais',
]);

/**
 * Linhas do painel de exemplo. É uma ilustração: nomes genéricos e o
 * vocabulário de status que o painel usa de verdade.
 */
export const MOCK_ROWS = Object.freeze([
  { id: 'a', channel: 'ML', product: 'Produto exemplo A', sku: 'SKU-A01', quantity: 2, status: 'Pacote embalado', tone: 'blue' },
  { id: 'b', channel: 'Shopee', product: 'Produto exemplo B', sku: 'SKU-B02', quantity: 1, status: 'Aguardando coleta', tone: 'violet' },
  { id: 'c', channel: 'TikTok', product: 'Produto exemplo C', sku: 'SKU-C03', quantity: 3, status: 'Pendente', tone: 'amber' },
  { id: 'd', channel: 'ML', product: 'Produto exemplo D', sku: 'SKU-D04', quantity: 1, status: 'Despachado', tone: 'green' },
]);

/** Cenário da simulação de exemplo do hero. Igual ao estado inicial da calculadora. */
export const HERO_SIMULATION = (() => {
  const inputs = { cubicMeters: 2, monthlySales: 300, shippingPlan: 'essential' };
  const estimate = calculateEstimate(inputs);
  return Object.freeze({
    inputs,
    totalCents: estimate.totalCents,
    total: formatCents(estimate.totalCents),
    caption: '2 m³ e 300 vendas no plano Essencial',
  });
})();

/* ---------------------------------------------------------------------------
 * SERVIÇOS (espelham a tabela oficial)
 * ------------------------------------------------------------------------- */
const essential = SHIPPING_PLANS.essential;
const premium = SHIPPING_PLANS.premium;
const assemblyLowest = FULL_ASSEMBLY_TIERS[FULL_ASSEMBLY_TIERS.length - 1];
const assemblyHighest = FULL_ASSEMBLY_TIERS[0];

export const SERVICES = Object.freeze([
  {
    id: 'storage',
    icon: 'warehouse',
    title: 'Armazenamento',
    text: 'Seu estoque guardado na CyberDock e organizado por SKU no painel.',
    prefix: 'a partir de',
    price: formatCents(PRICE_CENTS.storageFirstCubicMeter),
    unit: 'por mês',
    note: `Para o 1º m³. Cada m³ adicional custa ${formatCents(PRICE_CENTS.storageAdditionalCubicMeter)}.`,
  },
  {
    id: 'shipping',
    icon: 'package-check',
    title: 'Expedição',
    text: 'Embalagem padrão CYBER e envio de cada venda.',
    prefix: 'a partir de',
    price: formatCents(essential.cents),
    unit: 'por venda',
    note: `Plano Premium: ${formatCents(premium.cents)} por venda.`,
  },
  {
    id: 'assembly',
    icon: 'layers',
    title: 'Montagem de Full',
    text: 'Preparação completa no padrão Full, cobrada por pacote.',
    prefix: 'de',
    price: `${formatCents(assemblyLowest.cents)} a ${formatCents(assemblyHighest.cents)}`,
    unit: 'por pacote',
    note: 'Quanto maior a montagem, menor o preço por pacote.',
  },
  {
    id: 'transfer',
    icon: 'truck',
    title: 'Transbordo Full',
    text: 'Envios ao Full, no C.D. do Mercado Livre, na cidade de São Paulo.',
    prefix: '',
    price: formatCents(PRICE_CENTS.fullTransferTrip),
    unit: 'por viagem',
    note: '',
  },
  {
    id: 'collection',
    icon: 'shield-check',
    title: 'Coleta CyberSegura',
    text: 'Coleta de até 1 m³, dentro de 40 km de distância da sede da CyberDock.',
    prefix: '',
    price: formatCents(PRICE_CENTS.secureCollectionTrip),
    unit: 'por viagem',
    note: '',
  },
]);

/* ---------------------------------------------------------------------------
 * TABELA DE PREÇOS (a arte oficial "Preços", em texto)
 *
 * Os valores vêm de utils/pricing.js. A terceira faixa da Montagem de Full diz
 * "301 pacotes ou mais" (a arte diz "acima de 301"), porque é assim que o
 * faturamento aplica: a faixa começa em 301.
 * ------------------------------------------------------------------------- */
export const PRICE_GROUPS = Object.freeze([
  {
    id: 'storage',
    icon: 'warehouse',
    title: 'Armazenamento',
    description: '',
    rows: [
      { name: '1º m³', price: formatCents(PRICE_CENTS.storageFirstCubicMeter), unit: 'por mês' },
      { name: 'Cada m³ adicional', price: formatCents(PRICE_CENTS.storageAdditionalCubicMeter), unit: 'por mês' },
    ],
  },
  {
    id: 'shipping',
    icon: 'package-check',
    title: 'Expedição',
    description: 'Embalagem padrão CYBER + envio.',
    rows: [
      { name: essential.shortName, price: formatCents(essential.cents), unit: 'por venda' },
      { name: premium.shortName, price: formatCents(premium.cents), unit: 'por venda' },
    ],
  },
  {
    id: 'transfer',
    icon: 'truck',
    title: 'Transbordo Full',
    description: 'Envios ao Full, no C.D. do Mercado Livre, na cidade de São Paulo.',
    rows: [
      { name: 'Viagem', price: formatCents(PRICE_CENTS.fullTransferTrip), unit: 'por viagem' },
    ],
  },
  {
    id: 'assembly',
    icon: 'layers',
    title: 'Montagem de Full',
    description: 'Preparação completa no padrão Full.',
    rows: FULL_ASSEMBLY_TIERS.map((tier) => ({
      name: tier.label,
      price: formatCents(tier.cents),
      unit: 'por pacote',
    })),
    footnote: 'O preço da faixa vale para todos os pacotes de cada montagem.',
  },
  {
    id: 'collection',
    icon: 'shield-check',
    title: 'Coleta CyberSegura',
    description: 'Até 1 m³ e 40 km de distância da sede da CyberDock.',
    rows: [
      { name: 'Viagem', price: formatCents(PRICE_CENTS.secureCollectionTrip), unit: 'por viagem' },
    ],
  },
]);

export const PRICE_NOTE = 'No primeiro mês, o armazenamento é cobrado proporcionalmente à data de entrada do estoque.';

/* ---------------------------------------------------------------------------
 * COMO FUNCIONA
 * ------------------------------------------------------------------------- */
export const STEPS = Object.freeze([
  {
    id: 'stock',
    icon: 'warehouse',
    title: 'Seu estoque chega',
    text: 'Você envia o estoque para a CyberDock ou agenda a Coleta CyberSegura. Ele fica organizado por SKU no painel.',
  },
  {
    id: 'connect',
    icon: 'link',
    title: 'Contas conectadas',
    text: 'Conecte Mercado Livre, Shopee e TikTok Shop. As vendas aparecem em uma tabela só.',
  },
  {
    id: 'ship',
    icon: 'package-check',
    title: 'Embalamos e enviamos',
    text: 'Cada venda sai com a embalagem padrão CYBER e etiqueta com SKU e quantidade.',
  },
  {
    id: 'track',
    icon: 'receipt',
    title: 'Você acompanha',
    text: 'Status dos pedidos, movimentações do estoque e resumo de cobrança, tudo no painel.',
  },
]);

/* ---------------------------------------------------------------------------
 * PAINEL
 * ------------------------------------------------------------------------- */
export const PANEL_FEATURES = Object.freeze([
  {
    id: 'sales',
    icon: 'table',
    title: 'Vendas unificadas',
    text: 'Mercado Livre, Shopee e TikTok Shop na mesma tabela, com o status de cada pedido.',
  },
  {
    id: 'stock',
    icon: 'package',
    title: 'Estoque por SKU',
    text: 'Produtos, kits e movimentações, para saber o que entrou e o que saiu.',
  },
  {
    id: 'labels',
    icon: 'barcode',
    title: 'Etiquetas',
    text: 'Etiquetas com SKU e quantidade estampados em cada pedido.',
  },
  {
    id: 'billing',
    icon: 'receipt',
    title: 'Resumo de cobrança',
    text: 'A cobrança do mês fica no painel, junto com o resto da operação.',
  },
  {
    id: 'sync',
    icon: 'refresh',
    title: 'Sincronização',
    text: 'Um botão traz os pedidos mais recentes das contas conectadas.',
  },
]);

/* ---------------------------------------------------------------------------
 * PERGUNTAS FREQUENTES
 * ------------------------------------------------------------------------- */
// "R$ 1,49 de 1 a 100 pacotes, R$ 1,35 de 101 a 300 pacotes e R$ 1,19 a partir de 301 pacotes"
const tierText = FULL_ASSEMBLY_TIERS
  .map((tier) => (tier.to === null
    ? `${formatCents(tier.cents)} a partir de ${tier.from} pacotes`
    : `${formatCents(tier.cents)} de ${tier.from} a ${tier.to} pacotes`))
  .join(', ')
  .replace(/, ([^,]*)$/, ' e $1');

export const FAQ_ITEMS = Object.freeze([
  {
    id: 'storage',
    question: 'Como funciona a cobrança do armazenamento?',
    answer: `O primeiro m³ custa ${formatCents(PRICE_CENTS.storageFirstCubicMeter)} por mês e cada m³ adicional custa ${formatCents(PRICE_CENTS.storageAdditionalCubicMeter)}. No primeiro mês, o valor é proporcional à data de entrada do estoque.`,
  },
  {
    id: 'shipping',
    question: 'O que está incluído na Expedição?',
    answer: `A embalagem padrão CYBER e o envio de cada venda. O valor por venda é ${formatCents(essential.cents)} no plano Essencial e ${formatCents(premium.cents)} no Premium.`,
  },
  {
    id: 'assembly',
    question: 'Como é calculada a Montagem de Full?',
    answer: `É a preparação completa no padrão Full, cobrada por pacote. O preço depende do tamanho de cada montagem: ${tierText}. O preço da faixa vale para todos os pacotes daquela montagem.`,
  },
  {
    id: 'transfer',
    question: 'O que é o Transbordo Full?',
    answer: `São os envios ao Full, no C.D. do Mercado Livre, na cidade de São Paulo. Cada viagem custa ${formatCents(PRICE_CENTS.fullTransferTrip)}.`,
  },
  {
    id: 'collection',
    question: 'O que é a Coleta CyberSegura?',
    answer: `É a coleta de até 1 m³, dentro de 40 km de distância da sede da CyberDock. Cada viagem custa ${formatCents(PRICE_CENTS.secureCollectionTrip)}.`,
  },
  {
    id: 'channels',
    question: 'Com quais marketplaces o painel se conecta?',
    answer: 'Mercado Livre, Shopee e TikTok Shop. As vendas das contas conectadas aparecem em uma tabela única, e você pode sincronizar os pedidos mais recentes quando quiser.',
  },
  {
    id: 'panel',
    question: 'O que eu acompanho no painel?',
    answer: 'As vendas com o status de cada pedido, o estoque por SKU (com kits e movimentações), as etiquetas e o resumo de cobrança.',
  },
  {
    id: 'calculator',
    question: 'A calculadora é uma proposta?',
    answer: 'Não. Ela aplica a tabela de preços desta página aos números que você informa e serve como referência de custo mensal.',
  },
]);

/* ---------------------------------------------------------------------------
 * CALCULADORA
 * ------------------------------------------------------------------------- */
export const CALCULATOR_DEFAULTS = Object.freeze({
  cubicMeters: 2,
  monthlySales: 300,
  shippingPlan: 'essential',
  assemblyPackages: 0,
  assemblyBatches: 1,
  fullTrips: 0,
  collectionTrips: 0,
});

/** Cenários prontos. São exemplos de preenchimento, não perfis típicos de cliente. */
export const CALCULATOR_PRESETS = Object.freeze([
  {
    id: 'start',
    label: 'Começando',
    hint: '1 m³ e 100 vendas',
    values: { ...CALCULATOR_DEFAULTS, cubicMeters: 1, monthlySales: 100 },
  },
  {
    id: 'growing',
    label: 'Crescendo',
    hint: '2 m³ e 300 vendas',
    values: { ...CALCULATOR_DEFAULTS },
  },
  {
    id: 'scale',
    label: 'Em escala',
    hint: '5 m³, 1.000 vendas e Full',
    values: {
      ...CALCULATOR_DEFAULTS,
      cubicMeters: 5,
      monthlySales: 1000,
      shippingPlan: 'premium',
      assemblyPackages: 200,
      assemblyBatches: 2,
      fullTrips: 2,
    },
  },
]);
