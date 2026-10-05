<template>
  <section id="como-funciona" class="lp-section steps" aria-labelledby="passos-titulo" tabindex="-1">
    <div class="lp-container">
      <header class="steps__head">
        <p v-reveal class="lp-eyebrow">Como funciona</p>
        <h2 id="passos-titulo" v-reveal="60" class="lp-h2">Sua próxima venda.<br> Nossa próxima entrega.</h2>
        <p v-reveal="120" class="lp-lead">Entenda como sua loja e a CyberDock trabalham juntas.</p>
      </header>

      <ol v-reveal="100" class="steps__list" role="list">
        <li v-for="(step, index) in STEPS" :key="step.id" class="step">
          <span class="step__node" aria-hidden="true">{{ index + 1 }}</span>
          <div class="step__body">
            <span class="step__icon"><LandingIcon :name="step.icon" /></span>
            <h3 class="step__title">{{ step.title }}</h3>
            <p class="step__text">{{ step.text }}</p>
          </div>
        </li>
      </ol>
    </div>
  </section>
</template>

<script setup>
import LandingIcon from '@/components/landing/LandingIcon.vue';
import { vReveal } from '@/composables/useReveal';
import { STEPS } from '@/utils/landingContent';
</script>

<style scoped>

.steps { background: #fff; border-top: 1px solid var(--lp-line); }
.steps__head { max-width: 760px; }
.steps__list { display: grid; grid-template-columns: minmax(0, 1fr); margin-top: 44px; gap: 28px; }
.step { display: grid; grid-template-columns: 48px minmax(0, 1fr); gap: 18px; position: relative; }
.step__node { display: grid; place-items: center; width: 44px; height: 44px; border: 1px solid var(--lp-line); border-radius: 10px; color: var(--lp-blue-deep); background: var(--lp-sky-2); font-weight: 700; font-size: 1rem; font-variant-numeric: tabular-nums; }
.step__body { min-width: 0; }
.step__icon { display: inline-flex; margin-bottom: 12px; color: var(--lp-blue-deep); --icon-size: 24px; }
.step__title { font-size: 1.125rem; font-weight: 700; color: var(--lp-ink); line-height: 1.35; }
.step__text { margin-top: 10px; font-size: .9375rem; line-height: 1.65; color: var(--lp-muted); }
@media (min-width: 900px) { .steps__list { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 28px; } .step { display: flex; flex-direction: column; gap: 24px; border-top: 1px solid var(--lp-line); padding-top: 22px; } .step__icon { display: none; } }

</style>
