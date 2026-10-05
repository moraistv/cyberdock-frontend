// src/utils/pricing.js
//
// Tabela de preços pública da CyberDock e a conta da calculadora da landing.
//
// FONTES. A arte oficial "PREÇOS" e o catálogo do backend (utils/init-db.js:
// serviços e faixas da Montagem de Full). Mudou um preço lá, muda aqui.
//
// CENTAVOS INTEIROS. 2,97 x 333 em ponto flutuante dá 989.0100000000001, e numa
// página de preço uma estimativa com resto de dízima tira a confiança. A conta
// inteira roda em inteiros e só vira reais na hora de mostrar.
//
// FAIXAS DA MONTAGEM DE FULL. Mesma regra do faturamento (getTierUnitPrice em
// utils/billingRules.js): a faixa é escolhida pela quantidade de UMA montagem e o
// preço dela vale para TODOS os pacotes dessa montagem, não só para o excedente.
// O faturamento começa a terceira faixa em 301, por isso "301 ou mais".

export const PRICE_CENTS = Object.freeze({
  storageFirstCubicMeter: 39700,
  storageAdditionalCubicMeter: 19700,
  fullTransferTrip: 29700,
  secureCollectionTrip: 19700,
});

export const SHIPPING_PLANS = Object.freeze({
  essential: Object.freeze({
    id: 'essential',
    name: 'Expedição Essencial',
    shortName: 'Essencial',
    cents: 297,
  }),
  premium: Object.freeze({
    id: 'premium',
    name: 'Expedição Premium',
    shortName: 'Premium',
    cents: 397,
  }),
});

export const FULL_ASSEMBLY_TIERS = Object.freeze([
  Object.freeze({ from: 1, to: 100, cents: 149, label: '1 a 100 pacotes' }),
  Object.freeze({ from: 101, to: 300, cents: 135, label: '101 a 300 pacotes' }),
  Object.freeze({ from: 301, to: null, cents: 119, label: '301 pacotes ou mais' }),
]);

/** Limites dos campos da calculadora. O `min` do armazenamento é 1 m³ (unidade cobrada). */
export const INPUT_LIMITS = Object.freeze({
  cubicMeters: Object.freeze({ min: 1, max: 100 }),
  monthlySales: Object.freeze({ min: 0, max: 100000 }),
  assemblyPackages: Object.freeze({ min: 0, max: 5000 }),
  assemblyBatches: Object.freeze({ min: 1, max: 30 }),
  fullTrips: Object.freeze({ min: 0, max: 60 }),
  collectionTrips: Object.freeze({ min: 0, max: 60 }),
});

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const INTEGER = new Intl.NumberFormat('pt-BR');

/** 39700 -> "R$ 397,00". */
export const formatCents = (cents) => BRL.format(cents / 100);

/** 1234567 -> "1.234.567". */
export const formatInteger = (value) => INTEGER.format(value);

/** 123456 -> { whole: "1.234", fraction: "56" }, para destacar o inteiro no visual. */
export function splitCents(cents) {
  const safe = Math.max(0, Math.round(Number(cents) || 0));
  return {
    whole: INTEGER.format(Math.floor(safe / 100)),
    fraction: String(safe % 100).padStart(2, '0'),
  };
}

function clampCount(value, { min, max }) {
  const number = Math.floor(Number(value));
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
}

const plural = (count, singular, pluralForm) => (count === 1 ? singular : pluralForm);

/** Faixa de preço da Montagem de Full para a quantidade de UMA montagem. */
export function assemblyTier(quantity) {
  const qty = Math.floor(Number(quantity));
  if (!Number.isFinite(qty) || qty < 1) return null;
  return FULL_ASSEMBLY_TIERS.find((tier) => qty >= tier.from && (tier.to === null || qty <= tier.to)) || null;
}

/** 1 m3 = R$ 397,00; cada m3 adicional soma R$ 197,00. */
export function storageCents(cubicMeters) {
  const cubic = Math.floor(Number(cubicMeters));
  if (!Number.isFinite(cubic) || cubic < 1) return 0;
  return PRICE_CENTS.storageFirstCubicMeter + (cubic - 1) * PRICE_CENTS.storageAdditionalCubicMeter;
}

function storageDetail(cubicMeters) {
  const base = `1º m³ ${formatCents(PRICE_CENTS.storageFirstCubicMeter)}`;
  if (cubicMeters <= 1) return base;
  const extra = cubicMeters - 1;
  return `${base} + ${extra} ${plural(extra, 'adicional', 'adicionais')} de ${formatCents(PRICE_CENTS.storageAdditionalCubicMeter)}`;
}

/**
 * Estimativa mensal. Aceita qualquer entrada e normaliza para inteiros dentro dos limites.
 *
 * @param {object} raw
 * @param {number} raw.cubicMeters        m3 de armazenamento (mínimo 1).
 * @param {number} raw.monthlySales       vendas expedidas por mês.
 * @param {'essential'|'premium'} raw.shippingPlan
 * @param {number} raw.assemblyPackages   pacotes de Full em CADA montagem.
 * @param {number} raw.assemblyBatches    montagens de Full no mês.
 * @param {number} raw.fullTrips          viagens de Transbordo Full no mês.
 * @param {number} raw.collectionTrips    viagens de Coleta CyberSegura no mês.
 */
export function calculateEstimate(raw = {}) {
  const cubicMeters = clampCount(raw.cubicMeters, INPUT_LIMITS.cubicMeters);
  const monthlySales = clampCount(raw.monthlySales, INPUT_LIMITS.monthlySales);
  const assemblyPackages = clampCount(raw.assemblyPackages, INPUT_LIMITS.assemblyPackages);
  const assemblyBatches = assemblyPackages > 0
    ? clampCount(raw.assemblyBatches, INPUT_LIMITS.assemblyBatches)
    : 0;
  const fullTrips = clampCount(raw.fullTrips, INPUT_LIMITS.fullTrips);
  const collectionTrips = clampCount(raw.collectionTrips, INPUT_LIMITS.collectionTrips);
  const plan = SHIPPING_PLANS[raw.shippingPlan] || SHIPPING_PLANS.essential;
  const tier = assemblyTier(assemblyPackages);

  const lines = [{
    key: 'storage',
    label: 'Armazenamento',
    detail: storageDetail(cubicMeters),
    cents: storageCents(cubicMeters),
  }];

  if (monthlySales > 0) {
    lines.push({
      key: 'shipping',
      label: plan.name,
      detail: `${formatInteger(monthlySales)} ${plural(monthlySales, 'venda', 'vendas')} x ${formatCents(plan.cents)}`,
      cents: monthlySales * plan.cents,
    });
  }

  if (tier) {
    lines.push({
      key: 'assembly',
      label: 'Montagem de Full',
      detail: `${assemblyBatches} ${plural(assemblyBatches, 'montagem', 'montagens')} x ${formatInteger(assemblyPackages)} ${plural(assemblyPackages, 'pacote', 'pacotes')} x ${formatCents(tier.cents)}`,
      cents: assemblyBatches * assemblyPackages * tier.cents,
    });
  }

  if (fullTrips > 0) {
    lines.push({
      key: 'transfer',
      label: 'Transbordo Full',
      detail: `${fullTrips} ${plural(fullTrips, 'viagem', 'viagens')} x ${formatCents(PRICE_CENTS.fullTransferTrip)}`,
      cents: fullTrips * PRICE_CENTS.fullTransferTrip,
    });
  }

  if (collectionTrips > 0) {
    lines.push({
      key: 'collection',
      label: 'Coleta CyberSegura',
      detail: `${collectionTrips} ${plural(collectionTrips, 'viagem', 'viagens')} x ${formatCents(PRICE_CENTS.secureCollectionTrip)}`,
      cents: collectionTrips * PRICE_CENTS.secureCollectionTrip,
    });
  }

  const totalCents = lines.reduce((sum, line) => sum + line.cents, 0);

  return {
    inputs: { cubicMeters, monthlySales, assemblyPackages, assemblyBatches, fullTrips, collectionTrips },
    plan,
    tier,
    lines,
    totalCents,
    perSaleCents: monthlySales > 0 ? Math.round(totalCents / monthlySales) : null,
  };
}

/** Texto da simulação, pronto para abrir uma conversa com a equipe. */
export function describeEstimate(estimate) {
  const rows = estimate.lines.map((line) => `- ${line.label}: ${line.detail} = ${formatCents(line.cents)}`);
  return [
    'Olá! Fiz uma simulação no site da CyberDock:',
    '',
    ...rows,
    '',
    `Total estimado: ${formatCents(estimate.totalCents)} por mês.`,
    'Gostaria de uma proposta.',
  ].join('\n');
}
