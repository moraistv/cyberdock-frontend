<template>
  <nav v-show="visible" class="mobile-actions" aria-label="Acesso rápido">
    <a href="#precos" class="mobile-actions__prices" @click.prevent="go('precos')">
      <LandingIcon name="receipt" /> Preços
    </a>
    <a href="#calculadora" class="lp-btn lp-btn--blue" @click.prevent="go('calculadora')">
      Simular custo <LandingIcon name="arrow-right" />
    </a>
  </nav>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import LandingIcon from '@/components/landing/LandingIcon.vue';
import { scrollToSection } from '@/composables/useLandingScroll';

const heroVisible = ref(true);
const calculatorVisible = ref(false);
const editing = ref(false);
const visible = computed(() => !heroVisible.value && !calculatorVisible.value && !editing.value);
const go = (id) => scrollToSection(id);
let frame = 0;
function updateVisibility() {
  frame = 0;
  const hero = document.getElementById('topo')?.getBoundingClientRect();
  const calculator = document.getElementById('calculadora')?.getBoundingClientRect();
  heroVisible.value = Boolean(hero && hero.bottom > 76 && hero.top < window.innerHeight);
  calculatorVisible.value = Boolean(calculator && calculator.top < window.innerHeight && calculator.bottom > 76);
}
function scheduleVisibility() {
  if (!frame) frame = requestAnimationFrame(updateVisibility);
}
function updateFocus(event) {
  editing.value = Boolean(event.target?.matches('input, textarea, select, [contenteditable="true"]'));
}
function clearFocus() { editing.value = false; }
onMounted(() => {
  updateVisibility();
  window.addEventListener('scroll', scheduleVisibility, { passive: true });
  window.addEventListener('resize', scheduleVisibility, { passive: true });
  document.addEventListener('focusin', updateFocus);
  document.addEventListener('focusout', clearFocus);
});
onBeforeUnmount(() => {
  if (frame) cancelAnimationFrame(frame);
  window.removeEventListener('scroll', scheduleVisibility);
  window.removeEventListener('resize', scheduleVisibility);
  document.removeEventListener('focusin', updateFocus);
  document.removeEventListener('focusout', clearFocus);
});
</script>

<style scoped>
.mobile-actions { display: none; }
@media (max-width: 760px) {
  .mobile-actions { position: fixed; inset: auto 0 0; z-index: 12; display: grid; grid-template-columns: 94px minmax(0, 1fr); align-items: center; gap: 12px; padding: 12px 20px calc(12px + env(safe-area-inset-bottom)); background: #fff; border-top: 1px solid var(--lp-line); box-shadow: 0 -8px 30px -20px #102b4366; }
  .mobile-actions__prices { display: inline-flex; justify-content: center; align-items: center; gap: 6px; min-height: 48px; font-size: .875rem; font-weight: 650; color: var(--lp-ink); text-decoration: none; }
  .mobile-actions .lp-btn { min-height: 48px; padding-inline: 14px; font-size: .875rem; }
}
@media (max-width: 360px) { .mobile-actions { grid-template-columns: 76px minmax(0, 1fr); gap: 10px; } }
</style>
