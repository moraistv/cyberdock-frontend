<template>
  <section id="painel" class="lp-section platform" aria-labelledby="painel-titulo" tabindex="-1">
    <div class="lp-container platform__grid">
      <div class="platform__copy">
        <p v-reveal class="lp-eyebrow">Painel</p>
        <h2 id="painel-titulo" v-reveal="60" class="lp-h2">
          Vendas, estoque e cobrança <span class="lp-grad">no mesmo lugar.</span>
        </h2>
        <p v-reveal="120" class="lp-lead">
          Um lugar para consultar seus pedidos, conferir as movimentações do estoque e acompanhar a cobrança do mês.
        </p>

        <ul class="platform__features" role="list">
          <li v-for="(feature, index) in PANEL_FEATURES" :key="feature.id" v-reveal="index * 70" class="feature">
            <span class="feature__icon"><LandingIcon :name="feature.icon" /></span>
            <div>
              <h3 class="feature__title">{{ feature.title }}</h3>
              <p class="feature__text">{{ feature.text }}</p>
            </div>
          </li>
        </ul>

        <div v-reveal="200" class="platform__cta">
          <router-link to="/auth" class="lp-btn lp-btn--ghost">
            Já sou cliente: entrar no painel
            <LandingIcon name="arrow-right" />
          </router-link>
        </div>
      </div>

      <div v-reveal="160" class="platform__visual">
        <LandingOperations />
        <p class="platform__visual-note">A logística acontece aqui.<br>O acompanhamento fica com você.</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import LandingIcon from '@/components/landing/LandingIcon.vue';
import LandingOperations from '@/components/landing/LandingOperations.vue';
import { vReveal } from '@/composables/useReveal';
import { PANEL_FEATURES } from '@/utils/landingContent';
</script>

<style scoped>
.platform { background: #f3f8fc; }
.platform__grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 40px; align-items: start; }
.platform__copy { display: grid; grid-template-columns: minmax(0, 1fr); justify-items: start; }
.platform__features { display: grid; grid-template-columns: minmax(0, 1fr); width: 100%; margin-top: 28px; }
.feature { display: flex; align-items: flex-start; gap: 14px; padding: 18px 0; border-bottom: 1px solid var(--lp-line); transition: var(--lp-reveal-transition); }
.feature__icon { display: grid; flex: none; place-items: center; width: 40px; height: 40px; border: 1px solid var(--lp-line); border-radius: 10px; background: #fff; color: var(--lp-blue-deep); --icon-size: 22px; }
.feature__title { font-size: 1rem; font-weight: 700; color: var(--lp-ink); }
.feature__text { margin-top: 4px; font-size: .9375rem; color: var(--lp-muted); }
.platform__cta { margin-top: 28px; }
.platform__visual { min-width: 0; }
.platform__visual-note { margin-top: 22px; color: var(--lp-blue-night); font-size: 1.125rem; line-height: 1.5; font-weight: 600; text-align: center; }
@media (min-width: 980px) { .platform__grid { grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: 72px; } .platform__visual { position: sticky; top: calc(var(--lp-nav-h) + 32px); } }
@media (max-width: 560px) { .platform__cta, .platform__cta .lp-btn { width: 100%; } .platform__cta .lp-btn { white-space: normal; line-height: 1.35; padding: 12px 16px; font-size: .875rem; } }
</style>
