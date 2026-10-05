<template>
  <!--
    Trilhas de circuito com nó na ponta: a mesma linguagem das três linhas que
    saem da caixa do logo. Decoração pura. A cor vem de `color` do elemento pai e
    o fluxo animado é desligado com prefers-reduced-motion.
  -->
  <svg
    class="circuit"
    viewBox="0 0 640 640"
    preserveAspectRatio="xMaxYMax slice"
    fill="none"
    stroke="currentColor"
    stroke-width="3"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <g class="circuit__base">
      <path v-for="trace in TRACES" :key="trace.d" :d="trace.d" />
      <circle v-for="trace in TRACES" :key="`${trace.cx}-${trace.cy}`" :cx="trace.cx" :cy="trace.cy" r="11" />
    </g>
    <g class="circuit__flow">
      <path v-for="trace in TRACES" :key="`flow-${trace.d}`" :d="trace.d" />
    </g>
  </svg>
</template>

<script setup>
// Cada trilha termina num nó (cx, cy) um pouco além do fim do traço.
const TRACES = [
  { d: 'M60 640V500L120 440V300L180 240V150', cx: 180, cy: 136 },
  { d: 'M210 640V570L270 510V390L330 330H430', cx: 444, cy: 330 },
  { d: 'M360 640V610L420 550H520L570 500V390', cx: 570, cy: 376 },
  { d: 'M640 190H540L500 150V70', cx: 500, cy: 56 },
];
</script>

<style scoped>
.circuit {
  width: 100%;
  height: 100%;
}

.circuit__base {
  opacity: 0.55;
}

.circuit__flow {
  stroke-dasharray: 10 38;
  animation: lp-flow 2.6s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .circuit__flow {
    display: none;
  }
}
</style>
