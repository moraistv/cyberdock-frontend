<!-- Ícone de traço, sempre decorativo: o nome da ação vem escrito ao lado (ou no
     aria-label do botão). Só <path>, sem v-html. -->
<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="tamanho"
    :height="tamanho"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path v-for="(d, i) in caminhos" :key="i" :d="d" />
  </svg>
</template>

<script setup>
/* global defineProps */
import { computed } from 'vue';

const props = defineProps({
  nome: { type: String, required: true },
  tamanho: { type: [Number, String], default: 16 },
});

const ICONES = {
  // avião de papel: gerar/enviar a cobrança
  enviar: ['M22 2L11 13', 'M22 2L15 22L11 13L2 9L22 2Z'],
  // abrir em outra aba
  link: ['M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6', 'M15 3h6v6', 'M10 14L21 3'],
  // setas circulares: conferir/atualizar
  atualizar: ['M23 4v6h-6', 'M1 20v-6h6', 'M3.51 9a9 9 0 0 1 14.85-3.36L23 10', 'M1 14l4.64 4.36A9 9 0 0 0 20.49 15'],
  calendario: ['M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'M16 2v4', 'M8 2v4', 'M3 10h18'],
  check: ['M22 11.08V12a10 10 0 1 1-5.93-9.14', 'M22 4L12 14.01l-3-3'],
  desfazer: ['M1 4v6h6', 'M3.51 15a9 9 0 1 0 2.13-9.36L1 10'],
  documento: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M16 13H8', 'M16 17H8', 'M10 9H8'],
  mais: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 8v8', 'M8 12h8'],
  // cadeado aberto: reabrir a fatura para alterar
  destravar: ['M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z', 'M7 11V7a5 5 0 0 1 9.9-1'],
  cancelar: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M15 9l-6 6', 'M9 9l6 6'],
  fechar: ['M18 6L6 18', 'M6 6l12 12'],
  chevron: ['M6 9l6 6 6-6'],
  baixar: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3'],
  lixo: ['M3 6h18', 'M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6', 'M10 11v6', 'M14 11v6', 'M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2'],
  // máquina de calcular: recalcular valores
  calculadora: [
    'M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z', 'M8 6h8',
    'M8 10h.01', 'M12 10h.01', 'M16 10h.01', 'M8 14h.01', 'M12 14h.01', 'M16 14h.01', 'M8 18h.01', 'M12 18h.01', 'M16 18h.01',
  ],
  usuario: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
  salvar: ['M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z', 'M17 21v-8H7v8', 'M7 3v5h8'],
  // devoluções: caixa, caminhão, seta de volta
  caixa: [
    'M16.5 9.4l-9-5.19', 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
    'M3.27 6.96L12 12.01l8.73-5.05', 'M12 22.08V12',
  ],
  caminhao: ['M1 3h15v13H1z', 'M16 8h4l3 3v5h-7z', 'M3 18.5a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0', 'M16 18.5a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0'],
  devolucao: ['M9 14l-4-4 4-4', 'M5 10h11a4 4 0 1 1 0 8h-1'],
  camera: ['M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z', 'M8 13a4 4 0 1 0 8 0 4 4 0 1 0-8 0'],
  imagem: ['M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', 'M7 8.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0', 'M21 15l-5-5L5 21'],
  filtro: ['M22 3H2l8 9.46V19l4 2v-8.54L22 3z'],
  busca: ['M3 11a8 8 0 1 0 16 0 8 8 0 1 0-16 0', 'M21 21l-4.35-4.35'],
  // três pontos na vertical: menu da linha
  reticencias: ['M11 12a1 1 0 1 0 2 0 1 1 0 1 0-2 0', 'M11 5a1 1 0 1 0 2 0 1 1 0 1 0-2 0', 'M11 19a1 1 0 1 0 2 0 1 1 0 1 0-2 0'],
  alerta: ['M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z', 'M12 9v4', 'M12 17h.01'],
  relogio: ['M2 12a10 10 0 1 0 20 0 10 10 0 1 0-20 0', 'M12 6v6l4 2'],
  copiar: ['M11 9h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z', 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'],
  olho: ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z', 'M9 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0'],
  certo: ['M20 6L9 17l-5-5'],
  tendencia: ['M23 6l-9.5 9.5-5-5L1 18', 'M17 6h6v6'],
  tendenciaBaixa: ['M23 18l-9.5-9.5-5 5L1 6', 'M17 18h6v-6'],
};

const caminhos = computed(() => ICONES[props.nome] || []);
</script>
