<template>
  <UniversalModal
    :title="`Histórico do SKU: ${sku?.sku || '—'}`"
    :is-open="isOpen"
    @close="$emit('close')"
    size="full"
  >
    <div class="history">
      <!-- Top bar: filtros -->
      <div class="history__toolbar">
        <div class="segmented" role="tablist" aria-label="Filtro por tipo de movimentação">
          <button
            v-for="aba in abas"
            :key="aba.valor"
            type="button"
            role="tab"
            :aria-selected="typeFilter === aba.valor"
            :class="['segmented__btn', `is-${aba.valor}`, { 'is-active': typeFilter === aba.valor }]"
            @click="typeFilter = aba.valor"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="aba.icone" /></svg>
            <span>{{ aba.rotulo }}</span>
            <!-- A contagem responde "quantas foram?" sem obrigar a contar linha
                 por linha, que era o que se fazia nesta tela. -->
            <span class="segmented__contador">{{ aba.total }}</span>
          </button>
        </div>

        <div class="search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z"/></svg>
          <input
            id="busca-motivo-movimentacao"
            class="search__input"
            type="text"
            v-model.trim="query"
            placeholder="Buscar por motivo..."
            aria-label="Buscar movimentação por motivo"
          />
        </div>
      </div>

      <!-- Conteúdo -->
      <div v-if="isLoading" class="feedback">Carregando histórico…</div>
      <div v-else-if="filtered.length === 0" class="feedback">
        <div class="empty">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10"/></svg>
          <p>Nenhuma movimentação encontrada.</p>
        </div>
      </div>
      <div v-else class="table-wrap">
        <table class="tbl">
          <!-- Larguras fixas nas três primeiras colunas e o resto para o motivo.
               Sem isto o motivo (que traz o ID do pedido) empurrava a tabela além
               da largura do modal e aparecia uma barra de rolagem HORIZONTAL, com
               o texto quebrando em três linhas ao mesmo tempo. -->
          <colgroup>
            <col style="width: 116px" />
            <col style="width: 124px" />
            <col style="width: 112px" />
            <col />
          </colgroup>
          <thead class="tbl__head">
            <tr>
              <th scope="col">Data</th>
              <th scope="col">Tipo</th>
              <th scope="col" class="th-right">Quantidade</th>
              <th scope="col">Motivo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in filtered" :key="m.id">
              <td class="td-date">
                <div class="date-main">{{ formatDate(m.created_at) }}</div>
                <div class="date-sub">{{ formatTime(m.created_at) }}</div>
              </td>
              <td>
                <span :class="['chip', m.movement_type]">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="iconeDoTipo(m.movement_type)" /></svg>
                  {{ m.movement_type }}
                </span>
              </td>
              <td class="td-right" :class="m.movement_type">
                {{ m.movement_type === 'entrada' ? '+' : '-' }}{{ m.quantity_change }}
              </td>
              <td class="td-reason">{{ m.reason || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Resumo do SKU inteiro. Fica fora do v-else da tabela para continuar
           visível quando o filtro esconde tudo: é justamente aí que a conta
           importa (aba Entrada vazia com saldo zerado = lançamento faltando). -->
      <div v-if="!isLoading && temMovimentacao" class="resumo">
        <span class="resumo__item">
          <svg class="entrada" viewBox="0 0 24 24" aria-hidden="true"><path :d="ICONES.entrada" /></svg>
          <span class="resumo__texto">
            <span class="resumo__rotulo">Entradas</span>
            <strong class="entrada">+{{ resumo.entradas }}</strong>
          </span>
        </span>
        <span class="resumo__item">
          <svg class="saida" viewBox="0 0 24 24" aria-hidden="true"><path :d="ICONES.saida" /></svg>
          <span class="resumo__texto">
            <span class="resumo__rotulo">Saídas</span>
            <strong class="saida">-{{ resumo.saidas }}</strong>
          </span>
        </span>
        <span class="resumo__item">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="ICONES.saldo" /></svg>
          <span class="resumo__texto">
            <span class="resumo__rotulo">Saldo pelo histórico</span>
            <strong>{{ resumo.saldo }}</strong>
          </span>
        </span>
        <span v-if="saldoAtual !== null" class="resumo__item">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="ICONES.estoque" /></svg>
          <span class="resumo__texto">
            <span class="resumo__rotulo">Estoque atual</span>
            <strong :class="{ divergente: divergencia !== 0 }">{{ saldoAtual }}</strong>
          </span>
        </span>
      </div>

      <!-- O detector do problema que trouxe alguém até aqui.
           Saldo do histórico diferente do estoque da tabela só acontece por
           movimentação que não foi registrada. Antes isso exigia somar as linhas
           na mão para descobrir; agora a própria tela aponta, e diz de quanto é
           a diferença. -->
      <p v-if="!isLoading && temMovimentacao && divergencia !== 0" class="alerta">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="ICONES.alerta" /></svg>
        <span>
          O histórico soma <strong>{{ resumo.saldo }}</strong> e o estoque atual é
          <strong>{{ saldoAtual }}</strong>: uma diferença de
          <strong>{{ divergencia > 0 ? '+' : '' }}{{ divergencia }}</strong>.
          Falta movimentação registrada para este SKU.
        </span>
      </p>
    </div>
  </UniversalModal>
</template>

<script>
import { defineComponent, ref, computed } from 'vue';
import UniversalModal from '../UniversalModal.vue';

/* Ícones em um lugar só.
 *
 * O projeto desenha SVG inline (sem biblioteca de ícones), então os traçados
 * ficam aqui como dado em vez de repetidos no markup: o mesmo desenho alimenta
 * a aba do filtro, o selo da linha e o resumo. Mudar o ícone de "entrada" é uma
 * edição, não três.
 *
 * Entrada e saída não são setas genéricas: apontam para a linha (entrada, chega
 * ao estoque) e para fora dela (saída, deixa o estoque). A direção carrega o
 * significado para quem bate o olho sem ler o rótulo. */
const ICONES = {
  todos: 'M4 7h16M4 12h16M4 17h10',
  entrada: 'M12 3v11m0 0l-4-4m4 4l4-4M5 21h14',
  saida: 'M12 21V10m0 0l-4 4m4-4l4 4M5 3h14',
  saldo: 'M5 9h14M5 15h14',
  estoque: 'M21 16V8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8',
  alerta: 'M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
};

export default defineComponent({
  name: 'SkuHistoryModal',
  components: { UniversalModal },
  props: {
    isOpen: Boolean,
    sku: Object,
    movements: Array,
    isLoading: Boolean,
  },
  emits: ['close'],
  setup(props) {
    const typeFilter = ref('all'); // all | entrada | saida
    const query = ref('');

    /* Tipo normalizado antes de qualquer comparação.
     *
     * O filtro comparava o valor cru do banco com 'entrada' por igualdade
     * exata, e `movement_type` é texto livre. Uma linha gravada como "Entrada"
     * desaparecia da aba Entrada E era exibida com sinal negativo, porque o
     * template trata "não é entrada" como saída. Normalizando aqui, a mesma
     * lista alimenta filtro, sinal, cor e resumo com um valor só. */
    const normalized = computed(() => {
      const list = Array.isArray(props.movements) ? props.movements : [];
      return list.map(m => ({
        ...m,
        movement_type: String(m.movement_type || '').trim().toLowerCase(),
      }));
    });

    const filtered = computed(() => {
      const list = normalized.value;
      const byType = typeFilter.value === 'all'
        ? list
        : list.filter(m => m.movement_type === typeFilter.value);
      const q = query.value.toLowerCase();
      if (!q) return byType;
      return byType.filter(m => String(m.reason || '').toLowerCase().includes(q));
    });

    /* Resumo do SKU inteiro, não do filtro.
     *
     * É a pergunta que traz alguém a esta tela: "entraram quantas, saíram
     * quantas, sobrou quanto?". Antes exigia somar as linhas na mão, e a conta
     * era justamente o que revelava se faltava lançamento. */
    const resumo = computed(() => {
      const totais = normalized.value.reduce((acc, m) => {
        const qtd = Number(m.quantity_change) || 0;
        if (m.movement_type === 'entrada') acc.entradas += qtd;
        else if (m.movement_type === 'saida') acc.saidas += qtd;
        return acc;
      }, { entradas: 0, saidas: 0 });

      return { ...totais, saldo: totais.entradas - totais.saidas };
    });

    const temMovimentacao = computed(
      () => resumo.value.entradas > 0 || resumo.value.saidas > 0
    );

    /* Estoque gravado na tabela, para confrontar com o saldo do histórico.
     *
     * Vem do SKU já carregado na tela, sem requisição nova. Null quando a
     * quantidade não veio, para o confronto não acusar diferença falsa contra um
     * zero que na verdade é "não sei". */
    const saldoAtual = computed(() => {
      const valor = Number(props.sku?.quantidade);
      return Number.isFinite(valor) ? valor : null;
    });

    const divergencia = computed(() => {
      if (saldoAtual.value === null) return 0;
      return saldoAtual.value - resumo.value.saldo;
    });

    const abas = computed(() => [
      { valor: 'all', rotulo: 'Todos', icone: ICONES.todos, total: normalized.value.length },
      {
        valor: 'entrada',
        rotulo: 'Entrada',
        icone: ICONES.entrada,
        total: normalized.value.filter(m => m.movement_type === 'entrada').length,
      },
      {
        valor: 'saida',
        rotulo: 'Saída',
        icone: ICONES.saida,
        total: normalized.value.filter(m => m.movement_type === 'saida').length,
      },
    ]);

    const iconeDoTipo = (tipo) => (tipo === 'entrada' ? ICONES.entrada : ICONES.saida);

    const formatDate = (s) => {
      const d = new Date(s);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };
    const formatTime = (s) => {
      const d = new Date(s);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    return {
      typeFilter, query, filtered, resumo, temMovimentacao,
      saldoAtual, divergencia, abas, iconeDoTipo, ICONES,
      formatDate, formatTime,
    };
  }
});
</script>

<style scoped>
.history { display: grid; gap: 0.85rem; }
.history__toolbar {
  display: grid; grid-template-columns: auto 1fr; gap: 0.75rem; align-items: center;
  position: sticky; top: 0; background: #fff; z-index: 1; padding-top: .25rem;
}

/* Segmented minimal */
.segmented {
  display: grid; grid-auto-flow: column; gap: .25rem; background: #f3f4f6;
  border: 1px solid #e5e7eb; border-radius: 999px; padding: .22rem;
}
.segmented__btn {
  display: inline-flex; align-items: center; gap: .4rem;
  background: transparent; border: 0; border-radius: 999px;
  padding: .4rem .8rem; font-weight: 600; font-size: .86rem; color: #374151; cursor: pointer;
}
.segmented__btn svg { width: 15px; height: 15px; stroke: currentColor; stroke-width: 2; fill: none; }
.segmented__btn.is-active { background: #111827; color: #fff; }
.segmented__contador {
  min-width: 1.35rem; padding: 0 .3rem; border-radius: 999px;
  background: #e5e7eb; color: #374151;
  font-size: .74rem; font-weight: 700; text-align: center;
}
.segmented__btn.is-active .segmented__contador { background: rgba(255, 255, 255, .22); color: #fff; }
/* Cor só na aba ativa: as três coloridas ao mesmo tempo competiriam com os
   selos da tabela, que são o lugar onde a cor precisa significar algo. */
.segmented__btn.is-active.is-entrada { background: #15803d; }
.segmented__btn.is-active.is-saida { background: #b91c1c; }

/* Search */
.search {
  display: grid; grid-template-columns: auto 1fr; align-items: center; gap: .4rem;
  border: 1px solid #e5e7eb; border-radius: 10px; padding: .4rem .6rem; background: #fff;
}
.search svg { width: 18px; height: 18px; stroke: #6b7280; stroke-width: 2; fill: none; }
.search__input {
  border: 0; outline: none; font-size: .9rem; color: #111827; width: 100%;
}

/* Tabela */
.table-wrap {
  max-height: 58vh;
  /* Só o eixo vertical. `overflow: auto` valia para os dois e qualquer conteúdo
     um pixel mais largo abria a barra horizontal — com as larguras do colgroup
     não há o que rolar de lado. */
  overflow-y: auto; overflow-x: hidden;
  border: 1px solid #e5e7eb; border-radius: 12px;
}
.tbl { width: 100%; border-collapse: collapse; background: #fff; table-layout: fixed; }
.tbl__head { position: sticky; top: 0; background: #fff; z-index: 1; }
.tbl__head th {
  font-size: .74rem; text-transform: uppercase; letter-spacing: .03em; color: #6b7280;
  text-align: left; font-weight: 700;
}
.tbl th, .tbl td { padding: .7rem .9rem; border-bottom: 1px solid #eef2f7; vertical-align: top; }
.tbl tbody tr:last-child td { border-bottom: 0; }
.th-right, .td-right { text-align: right; }

.td-date .date-main { font-weight: 700; color: #111827; }
.td-date .date-sub  { font-size: .78rem; color: #6b7280; }

/* O motivo carrega o ID do pedido, que é um número longo sem espaço. Sem quebra
   forçada ele estoura a coluna mesmo com table-layout fixo. */
.td-reason { color: #374151; overflow-wrap: anywhere; }

.chip {
  display: inline-flex; align-items: center; gap: .3rem;
  padding: .2rem .55rem; border-radius: 999px; font-size: .78rem; font-weight: 700; text-transform: capitalize; color: #fff;
}
.chip svg { width: 13px; height: 13px; stroke: currentColor; stroke-width: 2.4; fill: none; }
.chip.entrada { background: #16a34a; }
.chip.saida   { background: #dc2626; }

.td-right { font-variant-numeric: tabular-nums; }
.td-right.entrada { color: #16a34a; font-weight: 700; }
.td-right.saida   { color: #dc2626; font-weight: 700; }

/* Resumo */
.resumo {
  display: flex; flex-wrap: wrap; gap: 1.75rem;
  border: 1px solid #e5e7eb; border-radius: 12px;
  padding: .75rem 1rem; background: #f9fafb;
}
.resumo__item { display: inline-flex; align-items: center; gap: .55rem; }
.resumo__item > svg {
  width: 20px; height: 20px; stroke: #6b7280; stroke-width: 1.9; fill: none; flex-shrink: 0;
}
.resumo__item > svg.entrada { stroke: #16a34a; }
.resumo__item > svg.saida { stroke: #dc2626; }
.resumo__texto { display: grid; gap: .05rem; }
.resumo__rotulo { font-size: .72rem; color: #6b7280; text-transform: uppercase; letter-spacing: .03em; }
.resumo__texto strong { font-size: 1.05rem; color: #111827; font-variant-numeric: tabular-nums; }
.resumo__texto strong.entrada { color: #16a34a; }
.resumo__texto strong.saida { color: #dc2626; }
.resumo__texto strong.divergente { color: #b45309; }

/* Alerta de divergência */
.alerta {
  display: flex; align-items: flex-start; gap: .55rem; margin: 0;
  border: 1px solid #fcd34d; border-radius: 12px;
  padding: .7rem .9rem; background: #fffbeb;
  color: #92400e; font-size: .88rem; line-height: 1.45;
}
.alerta svg {
  width: 18px; height: 18px; stroke: currentColor; stroke-width: 2; fill: none;
  flex-shrink: 0; margin-top: .12rem;
}

/* Estados */
.feedback { text-align: center; color: #6b7280; padding: 2.2rem 1rem; }
.empty {
  display: grid; place-items: center; gap: .4rem;
  color: #6b7280;
}
.empty svg { width: 36px; height: 36px; stroke: currentColor; stroke-width: 2; fill: none; opacity: .6; }
</style>
