/**
 * v-cabe-na-tela: mantém uma lista suspensa dentro da largura da tela.
 *
 * Os filtros das tabelas de venda abrem listas com `position: absolute`,
 * presas a um lado do botão (left: 0 ou right: 0). No celular os botões ficam
 * lado a lado, e a lista do botão da ponta saía pela borda: presa pela
 * esquerda, era cortada à direita; presa pela direita, sumia à esquerda.
 *
 * Quando a lista abre, ela é medida e, se passar da borda, é deslocada só o
 * necessário. Quando já cabe (o caso do desktop), nada muda.
 *
 * Uso (em <script setup>): import { vCabeNaTela } from '@/directives/cabeNaTela'
 * e <div v-if="aberto" v-cabe-na-tela class="filter-popover">.
 */
const MARGEM = 8;

function encaixar(el) {
  // Volta à posição do CSS antes de medir, senão um ajuste anterior se soma.
  el.style.left = '';
  el.style.right = '';

  const larguraDaTela = document.documentElement.clientWidth;
  const caixa = el.getBoundingClientRect();
  if (!caixa.width || !larguraDaTela) return;

  let deslocamento = 0;
  if (caixa.right > larguraDaTela - MARGEM) deslocamento = (larguraDaTela - MARGEM) - caixa.right;
  if (caixa.left + deslocamento < MARGEM) deslocamento = MARGEM - caixa.left;
  if (!deslocamento) return;

  // offsetLeft é relativo ao contêiner posicionado do botão, o mesmo
  // referencial do `left` do CSS. Mexer em left/right (e não em transform)
  // não briga com a animação de entrada, que usa transform.
  el.style.left = `${Math.round(el.offsetLeft + deslocamento)}px`;
  el.style.right = 'auto';
}

export const vCabeNaTela = {
  mounted: encaixar,
  updated: encaixar,
};

export default vCabeNaTela;
