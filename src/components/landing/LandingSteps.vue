<template>
  <section id="como-funciona" class="lp-section steps" aria-labelledby="passos-titulo" tabindex="-1">
    <div class="lp-container">
      <header class="steps__head">
        <p v-reveal class="lp-eyebrow">Como funciona</p>
        <h2 id="passos-titulo" v-reveal="60" class="lp-h2">Do estoque na nossa mão ao pedido a caminho.</h2>
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
.steps {
  background: #fff;
}

.steps__head {
  display: grid;
  justify-items: start;
  max-width: 760px;
}

.steps__list {
  --node: 56px;

  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 28px;
  margin-top: clamp(44px, 5vw, 72px);
}

/* A trilha que liga os passos "desenha" quando a lista entra na tela. */
.steps__list::before {
  content: '';
  position: absolute;
  left: calc(var(--node) / 2 - 1px);
  top: calc(var(--node) / 2);
  bottom: calc(var(--node) / 2);
  width: 2px;
  background: linear-gradient(180deg, var(--lp-blue-deep), var(--lp-blue-bright));
  transform: scaleY(0);
  transform-origin: top;
  transition: transform 1.4s var(--lp-ease) 0.2s;
}

.steps__list.is-in::before {
  transform: scaleY(1);
}

.step {
  position: relative;
  display: grid;
  grid-template-columns: var(--node) minmax(0, 1fr);
  gap: 20px;
  align-items: start;
  /* Sem isto, a sobra de altura do <li> (esticado pela linha mais alta da grade)
   * era dividida entre as linhas internas e empurrava o cartão para baixo. */
  align-content: start;
}

.step__node {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: var(--node);
  height: var(--node);
  border-radius: 50%;
  background: var(--lp-ink);
  color: #fff;
  font-size: 1.25rem;
  font-weight: 760;
  box-shadow: 0 0 0 6px #fff, 0 0 0 8px var(--lp-blue);
}

.step__body {
  padding: 24px;
  border: 1px solid var(--lp-line);
  border-radius: var(--lp-radius-m);
  background: var(--lp-sky-2);
  transition: transform 0.4s var(--lp-ease), box-shadow 0.4s var(--lp-ease), background-color 0.3s ease;
}

.step__body:hover {
  transform: translateY(-4px);
  background: #fff;
  box-shadow: var(--lp-shadow-m);
}

.step__icon {
  display: inline-grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin-bottom: 14px;
  border-radius: 14px;
  background: #fff;
  color: var(--lp-blue-deep);
  font-size: 1.375rem;
  box-shadow: var(--lp-shadow-s);
}

.step__title {
  font-size: 1.25rem;
  font-weight: 730;
  letter-spacing: -0.015em;
  color: var(--lp-ink);
}

.step__text {
  margin-top: 8px;
  color: var(--lp-muted);
}

@media (min-width: 900px) {
  .steps__list {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 24px;
  }

  .steps__list::before {
    left: calc(var(--node) / 2);
    right: 0;
    top: calc(var(--node) / 2 - 1px);
    bottom: auto;
    width: auto;
    height: 2px;
    background: linear-gradient(90deg, var(--lp-blue-deep), var(--lp-blue-bright));
    transform: scaleX(0);
    transform-origin: left;
  }

  .steps__list.is-in::before {
    transform: scaleX(1);
  }

  /* Em colunas: nó em cima, cartão embaixo, e todos os cartões com a mesma
   * altura (o cartão cresce até o fim do <li>). */
  .step {
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  .step__node {
    flex: none;
  }

  .step__body {
    flex: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .steps__list::before {
    transform: none;
  }

  .step__body:hover {
    transform: none;
  }
}
</style>
