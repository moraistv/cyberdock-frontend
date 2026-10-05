<template>
  <section id="servicos" class="lp-section services" aria-labelledby="servicos-titulo" tabindex="-1">
    <div class="lp-container">
      <header class="services__head">
        <p v-reveal class="lp-eyebrow">Serviços</p>
        <h2 id="servicos-titulo" v-reveal="60" class="lp-h2">A operação por trás<br> de cada pedido.</h2>
        <p v-reveal="120" class="lp-lead">Do estoque ao despacho, encontre os serviços que fazem sentido para a sua loja.</p>
      </header>

      <div class="services__grid">
        <article
          v-for="(service, index) in SERVICES"
          :key="service.id"
          v-reveal="index * 70"
          class="card"
          :class="`card--${service.id}`"
        >
          <div class="card__icon"><LandingIcon :name="service.icon" /></div>
          <h3 class="card__title">{{ service.title }}</h3>
          <p class="card__text">{{ service.text }}</p>

          <!-- Pilha de caixas com trilhas no topo: o logo, redesenhado como ilustração. -->
          <svg
            v-if="service.id === 'storage'"
            class="card__art"
            viewBox="-92 -120 184 264"
            aria-hidden="true"
            focusable="false"
          >
            <g class="art__traces" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M0 -22V-62L16 -78V-98" />
              <circle cx="16" cy="-108" r="8" />
              <path d="M-18 -12V-48L-32 -62V-84" />
              <circle cx="-32" cy="-94" r="8" />
            </g>
            <g v-for="cube in cubes" :key="cube.key" class="art__cube" stroke-linejoin="round">
              <polygon class="art__top" :points="cube.top" />
              <polygon class="art__left" :points="cube.left" />
              <polygon class="art__right" :points="cube.right" />
            </g>
          </svg>

          <p class="card__price">
            <span v-if="service.prefix" class="card__prefix">{{ service.prefix }}</span>
            <strong class="card__value">{{ service.price }}</strong>
            <span class="card__unit">{{ service.unit }}</span>
          </p>
          <p v-if="service.note" class="card__note">{{ service.note }}</p>
        </article>
      </div>

      <p v-reveal class="services__more">
        <a href="#precos" class="services__link" @click.prevent="go('precos')">
          Ver a tabela de preços completa
          <LandingIcon name="arrow-right" />
        </a>
      </p>
    </div>
  </section>
</template>

<script setup>
import LandingIcon from '@/components/landing/LandingIcon.vue';
import { scrollToSection } from '@/composables/useLandingScroll';
import { vReveal } from '@/composables/useReveal';
import { SERVICES } from '@/utils/landingContent';

const go = (id) => scrollToSection(id);

/* ---------------------------------------------------------------------------
 * Caixas isométricas. Aresta E; a projeção isométrica dá meia-largura E·cos30°
 * e meia-altura E/2. (gx, gy, gz) são posições de grade; a ordem de desenho é
 * de trás para a frente (menor gx+gy+gz primeiro).
 * ------------------------------------------------------------------------- */
const E = 44;
const DX = Math.round(E * Math.cos(Math.PI / 6) * 10) / 10;
const DY = E / 2;

const GRID = [
  [0, 0, 0],
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
  [1, 1, 0],
];

const cubes = GRID
  .slice()
  .sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]) || a[2] - b[2])
  .map(([gx, gy, gz]) => {
    const x = (gx - gy) * DX;
    const y = (gx + gy) * DY - gz * E;
    const pts = (list) => list.map(([px, py]) => `${px},${py}`).join(' ');
    return {
      key: `${gx}${gy}${gz}`,
      top: pts([[x, y], [x + DX, y + DY], [x, y + 2 * DY], [x - DX, y + DY]]),
      left: pts([[x - DX, y + DY], [x, y + 2 * DY], [x, y + 2 * DY + E], [x - DX, y + DY + E]]),
      right: pts([[x, y + 2 * DY], [x + DX, y + DY], [x + DX, y + DY + E], [x, y + 2 * DY + E]]),
    };
  });
</script>

<style scoped>
.services {
  background: #fff;
}

.services__head {
  display: grid;
  justify-items: start;
  max-width: 760px;
}

.services__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px;
  margin-top: clamp(40px, 5vw, 64px);
}

/* --------------------------------------------------------------------------
 * Cartão
 * ------------------------------------------------------------------------ */
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: clamp(24px, 2.4vw, 32px);
  border: 1px solid var(--lp-line);
  border-radius: var(--lp-radius-l);
  background: #fff;
  box-shadow: none;
  transition:
    var(--lp-reveal-transition),
    transform 0.4s var(--lp-ease),
    box-shadow 0.4s var(--lp-ease),
    border-color 0.3s ease;
}

/* Brilho que segue o ponteiro (v-spotlight grava --mx e --my). */
.card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(380px circle at var(--mx, 50%) var(--my, 0%), rgba(30, 144, 214, 0.16), transparent 62%);
  opacity: 0;
  transition: opacity 0.35s ease;
  pointer-events: none;
}

.card:hover {
  transform: translateY(-2px);
  border-color: rgba(30, 144, 214, 0.55);
  box-shadow: var(--lp-shadow-m);
}

.card:hover::before {
  opacity: 0;
}

.card__icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  margin-bottom: 20px;
  border-radius: 10px;
  background: var(--lp-sky);
  color: var(--lp-blue-deep);
  font-size: 1.5rem;
}

.card__title {
  font-size: 1.375rem;
  font-weight: 730;
  letter-spacing: -0.02em;
  color: var(--lp-ink);
}

.card__text {
  margin-top: 10px;
  color: var(--lp-muted);
}

.card__price {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 8px;
  margin-top: auto;
  padding-top: 28px;
}

.card__prefix,
.card__unit {
  font-size: 0.875rem;
  font-weight: 560;
  color: var(--lp-muted);
}

.card__value {
  font-size: clamp(1.625rem, 1.2vw + 1.2rem, 2rem);
  font-weight: 770;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: var(--lp-ink);
}

.card__note {
  margin-top: 6px;
  font-size: 0.875rem;
  color: var(--lp-muted);
}

/* --------------------------------------------------------------------------
 * Armazenamento: cartão escuro, com a pilha de caixas
 * ------------------------------------------------------------------------ */
.card--storage {
  border-color: transparent;
  background:
    radial-gradient(90% 60% at 100% 100%, rgba(30, 144, 214, 0.35), transparent 70%),
    linear-gradient(160deg, var(--lp-ink) 0%, var(--lp-ink-3) 100%);
  color: #fff;
}

.card--storage::before {
  background: radial-gradient(420px circle at var(--mx, 50%) var(--my, 0%), rgba(77, 179, 240, 0.2), transparent 62%);
}

.card--storage:hover {
  border-color: transparent;
}

.card--storage .card__icon {
  background: rgba(255, 255, 255, 0.1);
  color: var(--lp-blue-bright);
}

.card--storage .card__title,
.card--storage .card__value {
  color: #fff;
}

.card--storage .card__text,
.card--storage .card__prefix,
.card--storage .card__unit,
.card--storage .card__note {
  color: var(--lp-on-dark-muted);
}

.card__art {
  width: min(100%, 210px);
  margin: 12px auto 0;
  overflow: visible;
  transition: transform 0.6s var(--lp-ease);
}

.card--storage:hover .card__art {
  transform: translateY(-8px);
}

.art__top {
  fill: #bfe5fb;
}

.art__left {
  fill: var(--lp-blue);
}

.art__right {
  fill: #0a5f9e;
}

.art__cube polygon {
  stroke: rgba(255, 255, 255, 0.55);
  stroke-width: 1.2;
}

.art__traces {
  stroke: var(--lp-blue-bright);
}

.art__traces circle {
  fill: var(--lp-ink-2);
}

/* --------------------------------------------------------------------------
 * Rodapé da seção
 * ------------------------------------------------------------------------ */
.services__more {
  margin-top: 36px;
}

.services__link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 4px;
  border-bottom: 2px solid var(--lp-blue);
  font-weight: 650;
  color: var(--lp-blue-deep);
  text-decoration: none;
  transition: gap 0.3s var(--lp-ease);
}

.services__link:hover {
  gap: 16px;
}

/* --------------------------------------------------------------------------
 * Grade
 * ------------------------------------------------------------------------ */
@media (min-width: 680px) {
  .services__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .card--storage {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(160px, 240px);
    column-gap: 24px;
  }

  .card--storage > * {
    grid-column: 1;
  }

  .card--storage .card__art {
    grid-column: 2;
    grid-row: 1 / span 5;
    align-self: center;
    margin: 0;
  }
}

@media (min-width: 1040px) {
  .services__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-areas:
      'storage shipping assembly'
      'storage transfer collection';
  }

  .card--storage {
    grid-area: storage;
    grid-column: auto;
    display: flex;
    flex-direction: column;
  }

  .card--storage .card__art {
    grid-column: auto;
    grid-row: auto;
    width: min(100%, 230px);
    margin: 20px auto 0;
  }

  .card--shipping {
    grid-area: shipping;
  }

  .card--assembly {
    grid-area: assembly;
  }

  .card--transfer {
    grid-area: transfer;
  }

  .card--collection {
    grid-area: collection;
  }
}

@media (prefers-reduced-motion: reduce) {
  .card:hover,
  .card--storage:hover .card__art {
    transform: none;
  }
}

@media (max-width: 560px) {
  .services__grid { gap: 12px; margin-top: 28px; }
  .card { padding: 22px; border-radius: 14px; }
  .card__art { display: none; }
  .card__icon { width: 40px; height: 40px; margin-bottom: 14px; }
  .card__title { font-size: 1.25rem; }
  .card__text { font-size: .9375rem; }
  .card__price { padding-top: 20px; }
}
</style>
