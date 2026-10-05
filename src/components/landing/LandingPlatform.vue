<template>
  <section id="painel" class="lp-section platform" aria-labelledby="painel-titulo" tabindex="-1">
    <div class="lp-container platform__grid">
      <div class="platform__copy">
        <p v-reveal class="lp-eyebrow">Painel</p>
        <h2 id="painel-titulo" v-reveal="60" class="lp-h2">
          Vendas, estoque e cobrança <span class="lp-grad">no mesmo lugar.</span>
        </h2>
        <p v-reveal="120" class="lp-lead">
          Conecte suas contas e acompanhe a operação inteira sem trocar de tela.
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

      <!-- Diagrama: canais -> CyberDock -> painel. Decorativo; o texto ao lado diz o mesmo. -->
      <div v-reveal="160" class="hub">
        <svg
          class="hub__svg"
          viewBox="0 0 600 380"
          role="img"
          aria-label="Mercado Livre, Shopee e TikTok Shop ligados à CyberDock e, dela, ao painel do cliente."
        >
          <g class="hub__lines" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path v-for="path in LINES" :key="path" :d="path" class="hub__line" />
          </g>
          <g class="hub__flow" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path v-for="path in LINES" :key="`flow-${path}`" :d="path" />
          </g>
          <g class="hub__nodes">
            <circle v-for="dot in DOTS" :key="`${dot[0]}-${dot[1]}`" :cx="dot[0]" :cy="dot[1]" r="5.5" />
          </g>

          <g v-for="(channel, index) in CHANNELS" :key="channel.code">
            <rect class="hub__tile" x="20" :y="CHANNEL_Y[index] - 46" width="92" height="92" rx="26" />
            <image
              :href="channel.logo"
              :x="20 + 18"
              :y="CHANNEL_Y[index] - 28"
              width="56"
              height="56"
              preserveAspectRatio="xMidYMid meet"
            />
          </g>

          <rect class="hub__core" x="200" y="124" width="200" height="132" rx="34" />
          <image :href="logo" x="226" y="148" width="148" height="84" preserveAspectRatio="xMidYMid meet" />

          <rect class="hub__tile hub__tile--ink" x="488" y="144" width="92" height="92" rx="26" />
          <g class="hub__panel-icon" transform="translate(508 164) scale(2.16)" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <rect width="7" height="9" x="3" y="3" rx="1" />
            <rect width="7" height="5" x="14" y="3" rx="1" />
            <rect width="7" height="9" x="14" y="12" rx="1" />
            <rect width="7" height="5" x="3" y="16" rx="1" />
          </g>
        </svg>

        <ul class="hub__legend" role="list">
          <li>Canais de venda</li>
          <li>CyberDock</li>
          <li>Seu painel</li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup>
import logo from '@/assets/logo.png';
import LandingIcon from '@/components/landing/LandingIcon.vue';
import { vReveal } from '@/composables/useReveal';
import { CHANNELS, PANEL_FEATURES } from '@/utils/landingContent';

/* Centros verticais dos três canais no diagrama (viewBox 600 x 380). */
const CHANNEL_Y = [74, 190, 306];

/* Trilhas com cantos arredondados: canais -> núcleo, e núcleo -> painel. */
const LINES = [
  'M112 74H148a12 12 0 0 1 12 12V178a12 12 0 0 0 12 12H200',
  'M112 190H200',
  'M112 306H148a12 12 0 0 0 12-12V202a12 12 0 0 1 12-12H200',
  'M400 190H488',
];

/* Nós nas pontas das trilhas, como no logo. */
const DOTS = [[112, 74], [112, 190], [112, 306], [200, 190], [400, 190], [488, 190]];
</script>

<style scoped>
.platform {
  background:
    radial-gradient(60% 50% at 100% 0%, #e2f1fc 0%, transparent 70%),
    var(--lp-sky-2);
}

.platform__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: clamp(40px, 6vw, 80px);
  align-items: start;
}

.platform__copy {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  justify-items: start;
}

.platform__features {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
  width: 100%;
  margin-top: 36px;
}

.feature {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px 18px;
  border: 1px solid transparent;
  border-radius: var(--lp-radius-m);
  transition: var(--lp-reveal-transition), background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s var(--lp-ease);
}

.feature:hover {
  border-color: var(--lp-line);
  background: #fff;
  box-shadow: var(--lp-shadow-s);
}

.feature__icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(145deg, #fff, var(--lp-sky));
  color: var(--lp-blue-deep);
  font-size: 1.375rem;
  box-shadow: inset 0 0 0 1px var(--lp-line);
}

.feature__title {
  font-size: 1.0625rem;
  font-weight: 720;
  letter-spacing: -0.01em;
  color: var(--lp-ink);
}

.feature__text {
  margin-top: 2px;
  color: var(--lp-muted);
}

.platform__cta {
  margin-top: 32px;
}

/* --------------------------------------------------------------------------
 * Diagrama
 * ------------------------------------------------------------------------ */
.hub {
  position: relative;
  padding: clamp(16px, 3vw, 32px);
  border: 1px solid var(--lp-line);
  border-radius: var(--lp-radius-xl);
  background:
    radial-gradient(circle, rgba(3, 105, 161, 0.16) 1.2px, transparent 1.6px) 0 0 / 24px 24px,
    linear-gradient(160deg, #fff 0%, var(--lp-sky) 100%);
  box-shadow: var(--lp-shadow-m);
}

.hub__svg {
  width: 100%;
  height: auto;
}

.hub__line {
  stroke: var(--lp-blue);
  opacity: 0.45;
}

.hub__flow {
  stroke: var(--lp-blue-deep);
  stroke-dasharray: 8 40;
  animation: lp-flow 2.2s linear infinite;
}

.hub__nodes circle {
  fill: #fff;
  stroke: var(--lp-blue);
  stroke-width: 2.5;
}

.hub__tile {
  fill: #fff;
  stroke: var(--lp-line);
  stroke-width: 1.5;
  filter: drop-shadow(0 10px 14px rgba(5, 13, 26, 0.1));
}

.hub__tile--ink {
  fill: var(--lp-ink);
  stroke: var(--lp-ink);
}

.hub__panel-icon {
  stroke: #fff;
}

.hub__core {
  fill: #fff;
  stroke: var(--lp-blue);
  stroke-width: 2.5;
  filter: drop-shadow(0 18px 24px rgba(3, 105, 161, 0.28));
}

.hub__legend {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--lp-muted);
}

@media (min-width: 980px) {
  .platform__grid {
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  }

  /* O diagrama acompanha a leitura da lista de recursos. */
  .hub {
    position: sticky;
    top: calc(var(--lp-nav-h) + 32px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hub__flow {
    display: none;
  }
}
</style>
