// src/utils/marketplaces.js
//
// Fonte única dos canais de venda: código, rótulo, logo e cor.
//
// Antes cada tela tinha o próprio mapa `MK_LOGOS` e ternários do tipo
// `=== 'Shopee' ? 'Shopee' : 'Mercado Livre'`. Com um terceiro canal, esses
// ternários transformariam qualquer venda do TikTok em "Mercado Livre" sem aviso.
//
// Convenções que já existem no sistema e continuam valendo:
//   - `code`: valor do campo `marketplace` das vendas ('ML', 'Shopee', 'TikTok');
//   - `platform`: identificador minúsculo das telas de contas e das rotas da API
//     ('ml', 'shopee', 'tiktok').

export const MARKETPLACES = Object.freeze({
  ML: Object.freeze({
    code: 'ML',
    platform: 'ml',
    label: 'Mercado Livre',
    shortLabel: 'ML',
    logo: '/img/ml-logo.svg',
    // Cor de gráfico: o amarelo que os dashboards já usavam (#f8d135), mais
    // legível no branco que o #FFE600 da marca.
    color: '#f8d135',
  }),
  Shopee: Object.freeze({
    code: 'Shopee',
    platform: 'shopee',
    label: 'Shopee',
    shortLabel: 'Shopee',
    logo: '/img/shopee-logo.svg',
    color: '#ee4d2d',
  }),
  TikTok: Object.freeze({
    code: 'TikTok',
    platform: 'tiktok',
    label: 'TikTok Shop',
    shortLabel: 'TikTok',
    logo: '/img/tiktok-logo.svg',
    // Ciano da marca. O preto do logo esconderia o rótulo escuro que os
    // gráficos de barra desenham por cima da cor.
    color: '#25f4ee',
  }),
});

export const MARKETPLACE_CODES = Object.freeze(Object.keys(MARKETPLACES));

/** Logo por código do canal. Mantém o nome usado pelas telas antigas. */
export const MK_LOGOS = Object.freeze(
  Object.fromEntries(Object.values(MARKETPLACES).map((mk) => [mk.code, mk.logo]))
);

/** Cor de gráfico por código do canal. */
export const MK_COLORS = Object.freeze(
  Object.fromEntries(Object.values(MARKETPLACES).map((mk) => [mk.code, mk.color]))
);

/** Opções de filtro por canal, na ordem de exibição. */
export const MARKETPLACE_OPTIONS = Object.freeze(
  Object.values(MARKETPLACES).map((mk) => Object.freeze({ value: mk.code, label: mk.label, logo: mk.logo }))
);

/**
 * Código do canal a partir de qualquer grafia conhecida.
 *
 * Mesma regra que as telas já usavam para a Shopee ('shopee' em qualquer
 * posição, ou 'sp'), agora com o TikTok ('tiktok' ou 'tt'). Sem valor, ou com
 * um valor desconhecido, continua sendo Mercado Livre: é o contrato antigo de
 * public.sales, cujas linhas não traziam o campo.
 */
export function marketplaceCode(value) {
  const raw = String(value || 'ML').trim().toLowerCase();
  if (raw.includes('shopee') || raw === 'sp') return 'Shopee';
  if (raw.includes('tiktok') || raw === 'tt') return 'TikTok';
  return 'ML';
}

/** Canal de uma venda. `channel` é o campo antigo e serve de fallback. */
export function saleMarketplace(sale) {
  return marketplaceCode(sale?.marketplace || sale?.channel || 'ML');
}

/** Definição completa do canal a partir do código, da plataforma ou do rótulo. */
export function marketplaceInfo(value) {
  if (value && MARKETPLACES[value]) return MARKETPLACES[value];
  return MARKETPLACES[marketplaceCode(value)];
}

export function marketplaceLabel(value) {
  return marketplaceInfo(value).label;
}

export function marketplaceLogo(value) {
  return marketplaceInfo(value).logo;
}

/** Plataforma minúscula ('ml' | 'shopee' | 'tiktok'), usada nas rotas da API. */
export function marketplacePlatform(value) {
  return marketplaceInfo(value).platform;
}
