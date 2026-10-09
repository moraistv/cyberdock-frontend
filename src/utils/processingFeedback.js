// src/utils/processingFeedback.js
//
// Mensagens do processamento em massa ("Processar selecionadas" e "Processar
// página"): o que o operador vê quando tenta processar vendas que já estão
// processadas, que estão sem SKU no estoque ou que saíram da lista.
//
// Antes, marcar vendas já processadas e clicar em "Processar" abria "Nenhuma
// venda para processar: não foi encontrada nenhuma venda pendente com SKU
// correspondente no estoque para os filtros atuais", um texto que não diz o que
// aconteceu. Agora a mensagem fala da ação tentada, afirma que o estoque NÃO foi
// abatido de novo e mostra quando cada venda foi processada.
//
// O HTML vai para o modal por v-html, onde o CSS escopado do componente não
// chega: cores e espaçamentos ficam inline e todo valor vindo da venda é escapado.

import { marketplaceLabel, saleMarketplace } from './marketplaces';

const TEXT = '#334155';
const MUTED = '#64748b';
const BORDER = '#e2e8f0';

const plural = (count, one, many) => (count === 1 ? one : many);

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * "12/10/2026 às 14:32", no fuso do navegador (o mesmo do "Processado em:" dos
 * cards). null quando não há data ou ela é inválida.
 */
export function formatProcessedAt(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const day = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${day} às ${time}`;
}

/** " — processada em 12/10/2026 às 14:32" para as listas de resultado; '' sem data. */
export function processedAtSuffixHtml(value) {
  const label = formatProcessedAt(value);
  return label ? ` — processada em <strong>${escapeHtml(label)}</strong>` : '';
}

/**
 * Separa as vendas pelo que dá para fazer com elas. Uma venda já processada
 * entra em `alreadyProcessed` mesmo que o SKU também não esteja no estoque: o
 * que o operador precisa saber é que ela já foi baixada.
 */
export function classifyForProcessing(sales, isSkuMapped) {
  const groups = { processable: [], alreadyProcessed: [], withoutStock: [] };
  for (const sale of sales || []) {
    if (sale?.processed_at) groups.alreadyProcessed.push(sale);
    else if (!isSkuMapped(sale)) groups.withoutStock.push(sale);
    else groups.processable.push(sale);
  }
  return groups;
}

// --- blocos de HTML -------------------------------------------------------

const paragraph = (html) => `<p style="margin:0 0 4px;color:${TEXT};line-height:1.5;">${html}</p>`;

const note = (html) => `<p style="margin:12px 0 0;color:${MUTED};font-size:0.82rem;line-height:1.45;">${html}</p>`;

const groupTitle = (html) => `<div style="margin:14px 0 0;font-weight:700;color:${TEXT};font-size:0.9rem;">${html}</div>`;

const warningBox = (html) =>
  `<div style="margin:12px 0 0;padding:10px 12px;border-radius:10px;background:#fffbeb;border:1px solid #fde68a;color:#92400e;font-size:0.88rem;line-height:1.45;">${html}</div>`;

function listHtml(rows) {
  if (!rows.length) return '';
  return `<div style="max-height:240px;overflow:auto;border:1px solid ${BORDER};border-radius:10px;margin:6px 0 0;">${rows.join('')}</div>`;
}

function rowHtml(sale, rightHtml, isFirst) {
  const channel = escapeHtml(marketplaceLabel(saleMarketplace(sale)));
  const order = escapeHtml(sale?.id ?? 'sem ID');
  const sku = escapeHtml(sale?.sku || 'sem SKU');
  const divider = isFirst ? '' : `border-top:1px solid ${BORDER};`;
  return `<div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:2px 12px;padding:8px 12px;${divider}font-size:0.85rem;">`
    + `<span style="color:#0f172a;"><strong>${channel} #${order}</strong> <span style="color:${MUTED};">· SKU: ${sku}</span></span>`
    + rightHtml
    + '</div>';
}

function processedRows(sales) {
  return sales.map((sale, index) => {
    const when = formatProcessedAt(sale?.processed_at) || 'data indisponível';
    const right = `<span style="color:#047857;white-space:nowrap;"><span aria-hidden="true">✓</span> Processada em <strong>${escapeHtml(when)}</strong></span>`;
    return rowHtml(sale, right, index === 0);
  });
}

const withoutStockRows = (sales) => sales.map((sale, index) => rowHtml(sale, '', index === 0));

const NOT_REPROCESSED = 'Nada foi alterado: o estoque não foi abatido de novo.';

/**
 * Mensagem de "não há nada a processar".
 *
 * `groups`: vendas já processadas, vendas sem SKU no estoque e quantas marcadas
 * não estão mais na lista atual (outra página ou outro filtro).
 * `context.selection`: true quando o operador marcou vendas; false quando clicou
 * em "processar página". `listedCount`: vendas da lista, usado sem seleção.
 */
export function buildNothingToProcessMessage(groups, context) {
  const alreadyProcessed = groups?.alreadyProcessed || [];
  const withoutStock = groups?.withoutStock || [];
  const notListed = groups?.notListed || 0;
  const done = alreadyProcessed.length;
  const noStock = withoutStock.length;
  const { selection, listedCount = 0 } = context || {};

  if (!selection) {
    if (listedCount === 0) {
      return {
        title: 'Nenhuma venda na lista',
        html: paragraph('Não há vendas na lista atual para processar. Ajuste os filtros e tente de novo.'),
      };
    }
    const lines = [];
    if (done) lines.push(`<strong>${done}</strong> ${plural(done, 'já foi processada', 'já foram processadas')}`);
    if (noStock) lines.push(`<strong>${noStock}</strong> ${plural(noStock, 'está', 'estão')} sem SKU correspondente no estoque`);
    return {
      title: 'Nenhuma venda pendente',
      html: paragraph(
        `Nenhuma das <strong>${listedCount}</strong> ${plural(listedCount, 'venda listada', 'vendas listadas')} `
        + 'está pendente de processamento nos filtros atuais:'
      )
        + `<ul style="margin:6px 0 0 18px;padding:0;color:${TEXT};line-height:1.6;">${lines.map((line) => `<li>${line}</li>`).join('')}</ul>`
        + note(done ? NOT_REPROCESSED : 'Nada foi alterado.'),
    };
  }

  // Tentou processar somente vendas que já estavam processadas.
  if (done > 0 && noStock === 0 && notListed === 0) {
    const single = done === 1;
    return {
      title: single ? 'Esta venda já foi processada' : 'Estas vendas já foram processadas',
      html: paragraph(
        single
          ? 'Você tentou processar uma venda que <strong>já está processada</strong>.'
          : `Você tentou processar <strong>${done} vendas</strong> que <strong>já estão processadas</strong>.`
      )
        + listHtml(processedRows(alreadyProcessed))
        + note(NOT_REPROCESSED),
    };
  }

  const total = done + noStock + notListed;
  let html = paragraph(
    `Das <strong>${total}</strong> ${plural(total, 'venda selecionada', 'vendas selecionadas')}, nenhuma pôde ser processada:`
  );
  if (done) {
    html += groupTitle(`${done} ${plural(done, 'já processada', 'já processadas')}`) + listHtml(processedRows(alreadyProcessed));
  }
  if (noStock) {
    html += groupTitle(`${noStock} sem SKU correspondente no estoque`) + listHtml(withoutStockRows(withoutStock));
  }
  if (notListed) {
    html += groupTitle(`${notListed} ${plural(notListed, 'marcada', 'marcadas')} fora da lista atual`)
      + paragraph(`<span style="color:${MUTED};">Você mudou de página ou de filtro depois de marcar. Volte para onde elas estão e tente de novo.</span>`);
  }
  html += note(done ? NOT_REPROCESSED : 'Nada foi alterado.');
  return { title: 'Nenhuma venda para processar', html };
}

/**
 * Aviso para o resumo de um processamento que seguiu, quando parte das vendas
 * marcadas foi deixada de fora. '' quando nada foi ignorado.
 */
export function buildSkippedNoticeHtml(groups) {
  const alreadyProcessed = groups?.alreadyProcessed || [];
  const withoutStock = groups?.withoutStock || [];
  const notListed = groups?.notListed || 0;
  let html = '';
  if (alreadyProcessed.length) {
    const n = alreadyProcessed.length;
    html += warningBox(
      `<strong>${n} ${plural(n, 'venda marcada já estava processada e foi ignorada', 'vendas marcadas já estavam processadas e foram ignoradas')}.</strong> `
      + 'O estoque não foi abatido de novo.'
    ) + listHtml(processedRows(alreadyProcessed));
  }
  if (withoutStock.length) {
    const n = withoutStock.length;
    html += warningBox(
      `<strong>${n} ${plural(n, 'venda marcada foi ignorada', 'vendas marcadas foram ignoradas')}</strong> por estar sem SKU correspondente no estoque.`
    ) + listHtml(withoutStockRows(withoutStock));
  }
  if (notListed) {
    html += warningBox(
      `<strong>${notListed} ${plural(notListed, 'venda marcada não estava', 'vendas marcadas não estavam')} na lista atual</strong> `
      + `e ${plural(notListed, 'não foi processada', 'não foram processadas')}.`
    );
  }
  return html;
}

/**
 * Decide o que processar e, quando não há nada a fazer, o que dizer.
 *
 * - `sales`: vendas da lista atual;
 * - `selectedKeys`: Set com as chaves marcadas (null/vazio = sem seleção, processa a lista);
 * - `getKey`: chave de uma venda, a mesma usada na seleção;
 * - `isSkuMapped`: a venda tem SKU correspondente no estoque.
 *
 * Quem decide o que é "processável" é só este módulo: a tela envia exatamente
 * `toProcess` e mostra `nothingMessage` ou `skippedHtml`.
 */
export function planProcessing({ sales, selectedKeys, getKey, isSkuMapped }) {
  const list = Array.isArray(sales) ? sales : [];
  const hasSelection = Boolean(selectedKeys && selectedKeys.size > 0);
  const scope = hasSelection ? list.filter((sale) => selectedKeys.has(getKey(sale))) : list;
  const groups = classifyForProcessing(scope, isSkuMapped);
  const notListed = hasSelection ? Math.max(0, selectedKeys.size - scope.length) : 0;
  const skipped = { alreadyProcessed: groups.alreadyProcessed, withoutStock: groups.withoutStock, notListed };
  const toProcess = groups.processable;

  return {
    hasSelection,
    toProcess,
    nothingMessage: toProcess.length === 0
      ? buildNothingToProcessMessage(skipped, { selection: hasSelection, listedCount: scope.length })
      : null,
    // Sem seleção, as já processadas da lista não foram "tentadas": o aviso só vale para o que foi marcado.
    skippedHtml: hasSelection ? buildSkippedNoticeHtml(skipped) : '',
  };
}
