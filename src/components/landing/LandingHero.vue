<template>
  <section id="topo" class="hero" aria-labelledby="hero-title" tabindex="-1">
    <div class="hero__bg" aria-hidden="true">
      <div class="hero__wash" />
      <div class="hero__dots" />
      <div class="hero__slab">
        <LandingCircuit class="hero__circuit" />
      </div>
    </div>

    <div class="lp-container hero__grid">
      <div class="hero__copy">
        <p v-reveal class="lp-eyebrow">Fulfillment para marketplaces</p>

        <h1 id="hero-title" v-reveal="80" class="hero__title">
          <span class="hero__line">Você vende.</span>
          <span class="lp-grad hero__accent">A CyberDock guarda, embala e envia.</span>
        </h1>

        <p v-reveal="160" class="lp-lead hero__lead">
          Seu estoque fica com a gente, cada venda sai com a embalagem padrão CYBER e você
          acompanha tudo em um painel só, com Mercado Livre, Shopee e TikTok Shop.
        </p>

        <div v-reveal="240" class="hero__actions">
          <a class="lp-btn" href="#calculadora" @click.prevent="go('calculadora')">
            Simular meu custo
            <LandingIcon name="arrow-right" />
          </a>
          <a class="lp-btn lp-btn--ghost" href="#precos" @click.prevent="go('precos')">Ver tabela de preços</a>
          <a
            v-if="contact"
            class="lp-btn lp-btn--blue"
            :href="contact.href"
            :target="contact.external ? '_blank' : null"
            :rel="contact.external ? 'noopener noreferrer' : null"
          >
            <LandingIcon name="message" />
            {{ contact.label }}
          </a>
        </div>

        <ul v-reveal="320" class="hero__points">
          <li v-for="point in HERO_POINTS" :key="point">
            <span class="hero__tick"><LandingIcon name="check" /></span>
            {{ point }}
          </li>
        </ul>
      </div>

      <div v-reveal="200" class="hero__visual">
        <LandingSalesMock />
      </div>
    </div>
  </section>

  <section id="canais" class="channels" aria-labelledby="channels-title">
    <div class="lp-container channels__inner">
      <p id="channels-title" v-reveal class="channels__label">Conecta com</p>
      <ul class="channels__list">
        <li v-for="(channel, index) in CHANNELS" :key="channel.code" v-reveal="index * 90" class="channels__item">
          <img :src="channel.logo" alt="" height="30">
          <span>{{ channel.label }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';

import LandingCircuit from '@/components/landing/LandingCircuit.vue';
import LandingIcon from '@/components/landing/LandingIcon.vue';
import LandingSalesMock from '@/components/landing/LandingSalesMock.vue';
import { scrollToSection } from '@/composables/useLandingScroll';
import { vReveal } from '@/composables/useReveal';
import { CHANNELS, HERO_POINTS, contactAction } from '@/utils/landingContent';

const contact = computed(() => contactAction());

const go = (id) => scrollToSection(id);
</script>

<style scoped>
.hero {
  position: relative;
  padding-block: clamp(40px, 6vw, 92px) clamp(56px, 7vw, 104px);
}

/* --------------------------------------------------------------------------
 * Fundo: brilho suave, pontos e a placa azul diagonal (a mesma geometria da
 * arte oficial de preços), com trilhas de circuito por cima.
 * ------------------------------------------------------------------------ */
.hero__bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 0;
  pointer-events: none;
}

.hero__wash {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(60% 55% at 8% 0%, #d8edfb 0%, transparent 70%),
    radial-gradient(40% 40% at 60% 100%, #eaf5fd 0%, transparent 70%);
}

/* A trama de pontos fica no canto, longe do título e do texto: pontos atrás de
 * letras derrubam o contraste local (o título em gradiente media 2,75:1 em cima
 * deles). */
.hero__dots {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(3, 105, 161, 0.28) 1.3px, transparent 1.7px);
  background-size: 26px 26px;
  -webkit-mask-image: radial-gradient(34% 46% at 4% 6%, #000 0%, transparent 80%);
  mask-image: radial-gradient(34% 46% at 4% 6%, #000 0%, transparent 80%);
}

.hero__slab {
  display: none;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 47%;
  color: #fff;
  background: linear-gradient(165deg, var(--lp-blue-night) 0%, var(--lp-blue-deep) 42%, var(--lp-blue) 100%);
  clip-path: polygon(26% 0, 100% 0, 100% 100%, 0 100%);
}

.hero__circuit {
  position: absolute;
  inset: 0;
  opacity: 0.5;
}

/* --------------------------------------------------------------------------
 * Conteúdo
 * ------------------------------------------------------------------------ */
.hero__grid {
  position: relative;
  z-index: 1;
  display: grid;
  /* minmax(0, 1fr): a coluna nunca passa da largura do container por causa de um
   * filho com texto que não quebra (foi assim que o painel de exemplo alargou a
   * página no celular). */
  grid-template-columns: minmax(0, 1fr);
  gap: clamp(32px, 5vw, 64px);
  align-items: center;
}

.hero__copy {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  justify-items: start;
}

.hero__title {
  margin-top: 22px;
  /* Dimensionado para "A CyberDock guarda," caber numa linha na coluna larga
   * (3 linhas no total); em telas estreitas a frase quebra em mais linhas. */
  font-size: clamp(2.5rem, 3.2vw + 1rem, 3.6rem);
  font-weight: 760;
  line-height: 1.04;
  letter-spacing: -0.015em;
  color: var(--lp-ink);
}

.hero__line {
  display: block;
}

/* Bloco próprio: o balanceamento de linhas vale só para a frase em gradiente, e
 * o fit-content faz o gradiente cobrir o texto, não a coluna inteira. */
.hero__accent {
  display: block;
  width: fit-content;
  max-width: 100%;
  padding-bottom: 0.1em;
  text-wrap: balance;
}

.hero__lead {
  margin-top: 26px;
  max-width: 52ch;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 36px;
}

.hero__points {
  display: grid;
  gap: 12px;
  margin-top: 40px;
}

.hero__points li {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 560;
  color: var(--lp-text);
}

.hero__tick {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--lp-blue-deep);
  color: #fff;
  font-size: 0.8125rem;
  --icon-size: 14px;
}

.hero__visual {
  position: relative;
  padding-inline: 8px;
}

/* No celular a placa azul fica atrás do painel de exemplo. */
.hero__visual::before {
  content: '';
  position: absolute;
  inset: 12% -40px 0;
  border-radius: 36px;
  background: linear-gradient(165deg, var(--lp-blue-night) 0%, var(--lp-blue-deep) 45%, var(--lp-blue) 100%);
  transform: skewY(-4deg);
}

/* --------------------------------------------------------------------------
 * Faixa de canais
 * ------------------------------------------------------------------------ */
.channels {
  border-block: 1px solid var(--lp-line);
  background: #fff;
}

.channels__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 18px 40px;
  padding-block: 28px;
}

.channels__label {
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--lp-muted);
}

.channels__list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.channels__item {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 8px 20px 8px 12px;
  border: 1px solid var(--lp-line);
  border-radius: 999px;
  background: #fff;
  font-weight: 650;
  color: var(--lp-ink);
  transition: var(--lp-reveal-transition), border-color 0.25s ease, box-shadow 0.3s var(--lp-ease), transform 0.3s var(--lp-ease);
}

.channels__item:hover {
  border-color: var(--lp-blue);
  box-shadow: var(--lp-shadow-m);
  transform: translateY(-2px);
}

.channels__item img {
  width: auto;
  height: 30px;
  max-width: 40px;
}

/* --------------------------------------------------------------------------
 * Telas largas: duas colunas, placa azul do lado direito.
 * ------------------------------------------------------------------------ */
@media (min-width: 980px) {
  .hero__grid {
    grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
  }

  .hero__slab {
    display: block;
  }

  .hero__visual::before {
    display: none;
  }

  .hero__visual {
    padding-inline: 0;
  }
}

@media (max-width: 560px) {
  .hero__actions .lp-btn {
    width: 100%;
  }

  .hero__visual::before {
    inset-inline: -16px;
  }

  .channels__inner {
    padding-block: 24px;
  }
}
</style>
