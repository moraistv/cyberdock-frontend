<template>
  <div class="sep-report">
    <!-- Cabeçalho -->
    <div class="rep-header">
      <div class="rep-brand">
        <img :src="logo" alt="Cyberdock" class="rep-logo" />
        <div class="rep-title-block">
          <h1 class="rep-title">RELATÓRIO DE SEPARAÇÃO DE ITENS</h1>
          <p class="rep-subtitle">Itens separados para despacho</p>
        </div>
      </div>
      <div class="rep-meta">
        <div class="rep-meta-row">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
          <span>Data de Emissão: <strong>{{ emissionDate }}</strong></span>
        </div>
        <div class="rep-meta-row">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          <span>Emitido por: <strong>{{ emittedBy }}</strong></span>
        </div>
      </div>
    </div>

    <!-- Filtros aplicados -->
    <div class="rep-filters">
      <div class="rep-filter"><span class="rep-filter__label">Período da Venda:</span> {{ filters.periodoVenda }}</div>
      <div class="rep-filter"><span class="rep-filter__label">Prazo para Despachar:</span> {{ filters.prazoDespacho }}</div>
      <div class="rep-filter"><span class="rep-filter__label">Modalidade de Envio:</span> {{ filters.modalidade }}</div>
      <div class="rep-filter"><span class="rep-filter__label">Conta:</span> {{ filters.conta }}</div>
      <div class="rep-filter"><span class="rep-filter__label">Usuário:</span> {{ filters.usuario }}</div>
    </div>

    <!-- Cards de resumo -->
    <div class="rep-cards">
      <div class="rep-card">
        <span class="rep-card__label">Total de Itens</span>
        <span class="rep-card__value">{{ summary.totalItens }}</span>
        <span class="rep-card__hint">itens no período</span>
      </div>
      <div class="rep-card">
        <span class="rep-card__label">A Despachar</span>
        <span class="rep-card__value">{{ summary.aDespachar }}</span>
        <span class="rep-card__hint">{{ pct(summary.aDespachar) }}% do total</span>
      </div>
      <div class="rep-card">
        <span class="rep-card__label">Despachados</span>
        <span class="rep-card__value">{{ summary.despachados }}</span>
        <span class="rep-card__hint">{{ pct(summary.despachados) }}% do total</span>
      </div>
      <div class="rep-card rep-card--modes">
        <span class="rep-card__label">Por Modalidades de Envio</span>
        <div class="rep-modes">
          <div v-for="(count, mode) in summary.porModalidade" :key="mode" class="rep-mode">
            <span class="rep-mode__dot" :style="{ background: modeMeta(mode).color }"></span>
            <span class="rep-mode__count">{{ count }}</span>
            <span class="rep-mode__name">{{ modeMeta(mode).label }}</span>
          </div>
        </div>
      </div>
      <div class="rep-card">
        <span class="rep-card__label">Usuários Ativos</span>
        <span class="rep-card__value">{{ summary.usuariosAtivos }}</span>
        <span class="rep-card__hint">no período</span>
      </div>
    </div>

    <!-- Tabela -->
    <table class="rep-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Conta</th>
          <th>Qtd.</th>
          <th>SKU</th>
          <th>Descrição do Produto</th>
          <th>Comprador</th>
          <th>Modalidade de Envio</th>
          <th>Data para Despachar</th>
          <th>ID da Venda</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, idx) in rows" :key="`${item.id}-${item.sku}-${item.uid}`">
          <td>{{ idx + 1 }}</td>
          <td>
            <div class="rep-strong">{{ item.account_nickname || '—' }}</div>
            <div class="rep-sub">{{ item.user_nickname || '—' }}</div>
          </td>
          <td>{{ item.quantity }}</td>
          <td class="rep-mono">{{ item.sku || '—' }}</td>
          <td>{{ item.product_title || '—' }}</td>
          <td>
            <div class="rep-strong">{{ item.buyer_nickname || '—' }}</div>
            <div class="rep-sub">{{ customerName(item) }}</div>
          </td>
          <td>
            <span class="rep-mode-badge" :style="{ borderColor: modeMeta(item.shipping_mode).color, color: modeMeta(item.shipping_mode).color }">
              {{ modeMeta(item.shipping_mode).label }}
            </span>
          </td>
          <td>
            <div class="rep-strong">{{ formatDate(prazoDate(item)) }}</div>
            <div class="rep-sub rep-late">{{ relativeDay(prazoDate(item)) }}</div>
          </td>
          <td class="rep-mono">{{ item.id }}</td>
        </tr>
      </tbody>
    </table>

    <!-- Rodapé fixo (repete em cada página impressa) -->
    <div class="rep-footer">
      <span>Cyberdock — Armazenamento e Logística</span>
      <span>Total de Itens: {{ rows.length }}</span>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import logo from '@/assets/logo.png';

const props = defineProps({
  rows: { type: Array, default: () => [] },
  summary: { type: Object, default: () => ({}) },
  filters: { type: Object, default: () => ({}) },
  emittedBy: { type: String, default: '' },
  modeMeta: { type: Function, required: true },
  formatDate: { type: Function, required: true },
  relativeDay: { type: Function, required: true },
  customerName: { type: Function, required: true },
});

const emissionDate = new Date().toLocaleString('pt-BR', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

function pct(value) {
  const t = props.summary.totalItens || 0;
  if (!t) return '0';
  return ((value / t) * 100).toFixed(1);
}

function prazoDate(item) {
  return item.sla_expected_date || item.shipping_limit_date || null;
}
</script>

<style scoped>
.sep-report {
  display: none;
  font-family: 'Inter', Arial, sans-serif;
  color: #1f2937;
  background: #fff;
  padding: 0 4px 60px;
}
.rep-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1f2937; padding-bottom: 12px; }
.rep-brand { display: flex; align-items: center; gap: 14px; }
.rep-logo { height: 46px; }
.rep-title { font-size: 20px; font-weight: 800; margin: 0; letter-spacing: 0.02em; }
.rep-subtitle { font-size: 11px; color: #6b7280; margin: 2px 0 0; }
.rep-meta { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 12px; font-size: 10.5px; color: #374151; display: flex; flex-direction: column; gap: 4px; }
.rep-meta-row { display: flex; align-items: center; gap: 6px; }

.rep-filters { display: flex; flex-wrap: wrap; gap: 4px 24px; padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-size: 10.5px; color: #374151; }
.rep-filter__label { color: #6b7280; font-weight: 600; }

.rep-cards { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin: 14px 0; }
.rep-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; }
.rep-card__label { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #6b7280; letter-spacing: 0.03em; }
.rep-card__value { font-size: 22px; font-weight: 800; line-height: 1.2; }
.rep-card__hint { font-size: 9px; color: #6b7280; }
.rep-card--modes { grid-column: span 1; }
.rep-modes { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 8px; margin-top: 4px; }
.rep-mode { display: flex; align-items: center; gap: 4px; font-size: 9.5px; }
.rep-mode__dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.rep-mode__count { font-weight: 700; }
.rep-mode__name { color: #6b7280; text-transform: uppercase; font-size: 8px; }

.rep-table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
.rep-table thead { display: table-header-group; }
.rep-table th {
  text-align: left; padding: 6px 6px; background: #f3f4f6; border-bottom: 1px solid #d1d5db;
  font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.02em; color: #4b5563; font-weight: 700;
}
.rep-table td { padding: 6px 6px; border-bottom: 1px solid #eef0f3; vertical-align: top; }
.rep-table tr { page-break-inside: avoid; }
.rep-strong { font-weight: 600; }
.rep-sub { font-size: 8.5px; color: #6b7280; }
.rep-late { color: #b45309; }
.rep-mono { font-family: Consolas, monospace; font-size: 9px; }
.rep-mode-badge { display: inline-block; padding: 1px 7px; border: 1px solid; border-radius: 999px; font-size: 8.5px; font-weight: 700; }

.rep-footer {
  display: flex; justify-content: space-between; font-size: 9px; color: #6b7280;
  border-top: 1px solid #e5e7eb; padding-top: 6px; margin-top: 10px;
}
</style>

<style>
@media print {
  body * { visibility: hidden !important; }
  .sep-report, .sep-report * { visibility: visible !important; }
  .sep-report {
    display: block !important;
    position: absolute; left: 0; top: 0; width: 100%;
  }
  .sep-report .rep-footer { position: fixed; bottom: 0; left: 0; right: 0; padding: 6px 8px; background: #fff; }
  @page { margin: 12mm; size: landscape; }
}
</style>
