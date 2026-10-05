<template>
  <figure class="operation" :class="{ 'operation--paused': paused || suspended }" aria-labelledby="operation-caption">
    <header class="operation__head">
      <div>
        <p class="operation__title">Sua operação conectada</p>
        <p class="operation__subtitle">Do estoque ao envio</p>
      </div>
      <button class="operation__pause" type="button"
        :aria-label="paused ? 'Retomar animação da operação' : 'Pausar animação da operação'"
        :aria-pressed="paused" @click="paused = !paused">
        <LandingIcon :name="paused ? 'play' : 'pause'" />
        <span>{{ paused ? 'Retomar' : 'Pausar' }}</span>
      </button>
    </header>

    <div class="operation__diagram">
      <p class="operation__section-label">Marketplaces conectados</p>
      <ul class="operation__channels" aria-label="Canais de venda">
        <li v-for="channel in CHANNELS" :key="channel.code" class="operation__channel">
          <img :src="channel.logo" alt="" width="28" height="28">
          <span>{{ channel.label }}</span>
        </li>
      </ul>

      <svg class="operation__connections operation__connections--in" viewBox="0 0 480 80" preserveAspectRatio="none" fill="none" aria-hidden="true" focusable="false">
        <g stroke="#cadce9" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path v-for="route in incoming" :key="route" :d="route" />
        </g>
        <g stroke="#1e90d6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path v-for="(route, index) in incoming" :key="route" :d="route" pathLength="100"
            class="operation__signal" :style="{ '--signal-delay': index * -1.5 + 's' }" />
        </g>
        <circle cx="240" cy="76" r="4" fill="#fff" stroke="#0369a1" stroke-width="1.5" />
      </svg>

      <div class="operation__core">
        <img :src="logo" alt="CyberDock" width="383" height="155">
        <span>Uma operação. Um painel.</span>
      </div>

      <svg class="operation__connections operation__connections--out" viewBox="0 0 480 80" preserveAspectRatio="none" fill="none" aria-hidden="true" focusable="false">
        <g stroke="#cadce9" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path v-for="route in outgoing" :key="route" :d="route" />
        </g>
        <g stroke="#1e90d6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path v-for="(route, index) in outgoing" :key="route" :d="route" pathLength="100"
            class="operation__signal" :style="{ '--signal-delay': index * -1.5 - 2 + 's' }" />
        </g>
        <circle cx="240" cy="4" r="4" fill="#fff" stroke="#0369a1" stroke-width="1.5" />
      </svg>

      <ol class="operation__stages" aria-label="Etapas da operação">
        <li v-for="stage in stages" :key="stage.icon">
          <span class="operation__stage-icon"><LandingIcon :name="stage.icon" /></span>
          <strong>{{ stage.name }}</strong>
          <span>{{ stage.detail }}</span>
        </li>
      </ol>
    </div>

    <figcaption id="operation-caption" class="operation__caption">
      <LandingIcon name="info" />
      <span>Fluxo ilustrativo. Acompanhe pedidos, estoque e cobrança no painel.</span>
    </figcaption>
  </figure>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import logo from '@/assets/logo.png';
import LandingIcon from '@/components/landing/LandingIcon.vue';
import { CHANNELS } from '@/utils/landingContent';

const paused = ref(false);
const suspended = ref(false);
const incoming = [
  'M80 0V20Q80 36 96 36H224Q240 36 240 52V76',
  'M240 0V76',
  'M400 0V20Q400 36 384 36H256Q240 36 240 52V76',
];
const outgoing = [
  'M240 4V28Q240 44 224 44H96Q80 44 80 60V80',
  'M240 4V80',
  'M240 4V28Q240 44 256 44H384Q400 44 400 60V80',
];
const stages = [
  { icon: 'warehouse', name: 'Estoque', detail: 'Organizado por SKU' },
  { icon: 'package-check', name: 'Embalagem', detail: 'Padrão CYBER' },
  { icon: 'truck', name: 'Envio', detail: 'Expedição do pedido' },
];
function syncVisibility() { suspended.value = document.hidden; }
onMounted(() => {
  syncVisibility();
  document.addEventListener('visibilitychange', syncVisibility);
});
onBeforeUnmount(() => document.removeEventListener('visibilitychange', syncVisibility));
</script>

<style scoped>
.operation {
  margin: 0;
  overflow: hidden;
  border: 1px solid #cfdfeb;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 24px 64px -40px #315b7b;
}
.operation__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 22px 24px;
  border-bottom: 1px solid var(--lp-line);
}
.operation__title { font-size: .9375rem; font-weight: 700; color: var(--lp-ink); }
.operation__subtitle { margin-top: 4px; font-size: .8125rem; color: var(--lp-muted); }
.operation__pause {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 8px 10px;
  border: 1px solid var(--lp-line);
  border-radius: 8px;
  background: #fff;
  color: var(--lp-muted);
  font: inherit;
  font-size: .75rem;
  cursor: pointer;
}
.operation__pause:hover { border-color: var(--lp-blue); color: var(--lp-blue-deep); }
.operation__pause .lp-icon { --icon-size: 15px; }
.operation__diagram { padding: 28px 18px; background: #f7fafc; }
.operation__section-label {
  margin-bottom: 18px;
  font-size: .75rem;
  color: var(--lp-muted);
  text-align: center;
}
.operation__channels, .operation__stages { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
.operation__channel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 92px;
  margin-inline: 6px;
  padding: 14px 8px;
  border: 1px solid #dae5ee;
  border-radius: 12px;
  background: #fff;
  font-size: .75rem;
  font-weight: 650;
  color: var(--lp-ink);
  text-align: center;
}
.operation__channel img { width: 28px; height: 28px; object-fit: contain; }
.operation__connections { display: block; width: 100%; height: 56px; overflow: visible; }
.operation__connections path, .operation__connections circle { vector-effect: non-scaling-stroke; }
.operation__core {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  width: min(220px, 74%);
  margin: 0 auto;
  padding: 22px 20px 18px;
  border: 1px solid #8ab9d6;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 8px 22px -16px #0369a1;
}
.operation__core img { width: 130px; height: auto; }
.operation__core span { font-size: .6875rem; color: var(--lp-muted); }
.operation__stages li {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 0;
  margin-inline: 6px;
  padding: 16px 6px 8px;
  border-top: 2px solid #d3e5f1;
  text-align: center;
}
.operation__stage-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  margin-bottom: 2px;
  border: 1px solid #d2e5f2;
  border-radius: 10px;
  background: #eaf4fb;
  color: #0369a1;
  --icon-size: 21px;
}
.operation__stages strong { font-size: .8125rem; font-weight: 650; color: var(--lp-ink); }
.operation__stages li > span:last-child { font-size: .6875rem; line-height: 1.4; color: var(--lp-muted); text-wrap: balance; }
.operation__caption {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid var(--lp-line);
  background: #fff;
  font-size: .75rem;
  line-height: 1.5;
  color: var(--lp-muted);
}
.operation__caption .lp-icon { --icon-size: 15px; margin-top: 2px; }
.operation__signal {
  stroke-dasharray: 9 91;
  animation: operation-stream 4.5s linear var(--signal-delay, 0s) infinite;
}
.operation--paused .operation__signal { animation-play-state: paused; }
@keyframes operation-stream { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }
@media (max-width: 420px) {
  .operation__head { padding: 18px 16px; gap: 10px; }
  .operation__title { font-size: .8125rem; }
  .operation__subtitle { font-size: .75rem; }
  .operation__diagram { padding: 20px 10px; }
  .operation__channel { min-height: 76px; margin-inline: 4px; padding: 10px 4px; font-size: .6875rem; line-height: 1.35; }
  .operation__channel img { width: 24px; height: 24px; }
  .operation__connections { height: 40px; }
  .operation__core { padding: 16px 12px; gap: 10px; }
  .operation__core img { width: 110px; }
  .operation__stages li { margin-inline: 4px; padding-inline: 2px; gap: 6px; }
  .operation__stages strong { font-size: .6875rem; }
  .operation__stages li > span:last-child { font-size: .625rem; }
  .operation__stage-icon { width: 36px; height: 36px; --icon-size: 19px; }
  .operation__caption { padding: 14px 16px; font-size: .6875rem; }
}
@media (prefers-reduced-motion: reduce) {
  .operation__pause { display: none; }
  .operation__signal { display: none; animation: none; }
}
</style>
