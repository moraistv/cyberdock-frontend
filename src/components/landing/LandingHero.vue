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
        <p v-reveal class="lp-eyebrow">Logística para o seu e-commerce</p>

        <h1 id="hero-title" v-reveal="80" class="hero__title">
          <span class="hero__line">Você vende.</span>
          <span class="hero__accent">A CyberDock guarda, embala e envia.</span>
        </h1>

        <p v-reveal="160" class="lp-lead hero__lead">
          Armazenamento, embalagem e expedição para quem vende no Mercado Livre,
          Shopee e TikTok Shop. Você acompanha os pedidos, o estoque e os custos em um só painel.
        </p>

        <div v-reveal="240" class="hero__actions">
          <a class="lp-btn lp-btn--blue" href="#calculadora" @click.prevent="go('calculadora')">
            Simular meu custo
            <LandingIcon name="arrow-right" />
          </a>
          <a class="hero__price-link" href="#precos" @click.prevent="go('precos')">Conhecer os preços <LandingIcon name="arrow-down" /></a>
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
      <p id="channels-title" v-reveal class="channels__label">Sua operação conectada a</p>
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

.hero { position: relative; padding-block: clamp(48px, 6vw, 88px) clamp(52px, 6vw, 80px); background: #f3f8fc; }
.hero__bg { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.hero__wash { position: absolute; inset: 0; background: linear-gradient(110deg, #fff 0%, #f3f8fc 60%); }
.hero__dots { position: absolute; inset: 0; background-image: radial-gradient(circle, #bedbec 1px, transparent 1px); background-size: 26px 26px; mask-image: radial-gradient(32% 40% at 0% 0%, #000, transparent); }
.hero__slab { display: none; position: absolute; inset: 0 0 0 auto; width: 44%; background: linear-gradient(165deg, #084b74, #1e90d6); clip-path: polygon(26% 0,100% 0,100% 100%,0 100%); color: #fff; }
.hero__circuit { position: absolute; inset: 0; opacity: .35; }
.hero__grid { position: relative; display: grid; grid-template-columns: minmax(0, 1fr); align-items: center; gap: 44px; }
.hero__copy { display: grid; grid-template-columns: minmax(0, 1fr); justify-items: start; }
.hero__title { margin-top: 22px; font-size: clamp(2.6rem, 3.2vw + 1rem, 3.65rem); line-height: 1.08; letter-spacing: -.025em; font-weight: 760; color: var(--lp-ink); }
.hero__line, .hero__accent { display: block; }
.hero__accent { color: var(--lp-blue-deep); }
.hero__lead { margin-top: 26px; max-width: 44ch; font-size: 1.125rem; line-height: 1.7; }
.hero__actions { display: flex; align-items: center; flex-wrap: wrap; gap: 22px; margin-top: 32px; }
.hero__price-link { display: inline-flex; align-items: center; gap: 8px; min-height: 48px; color: var(--lp-ink); font-weight: 650; text-decoration: none; }
.hero__price-link:hover { color: var(--lp-blue-deep); text-decoration: underline; text-underline-offset: 5px; }
.hero__points { display: grid; gap: 10px; margin-top: 28px; }
.hero__points li { display: flex; align-items: center; gap: 10px; font-size: .875rem; color: var(--lp-muted); }
.hero__tick { display: grid; place-items: center; flex: none; width: 20px; height: 20px; color: var(--lp-blue-deep); --icon-size: 17px; }
.hero__visual { min-width: 0; position: relative; }
.channels { border-block: 1px solid var(--lp-line); background: #fff; }
.channels__inner { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 20px 32px; padding-block: 24px; }
.channels__label { font-size: .875rem; color: var(--lp-muted); }
.channels__list { display: flex; flex-wrap: wrap; gap: 24px 44px; }
.channels__item { display: inline-flex; align-items: center; gap: 10px; font-weight: 650; color: var(--lp-ink); }
.channels__item img { width: auto; height: 28px; max-width: 38px; }
@media (min-width: 980px) { .hero__grid { grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 54px; } .hero__slab { display: block; } }
@media (max-width: 979px) { .hero__visual::before { content: ''; position: absolute; inset: 30px -20px 24px; background: #08699f; border-radius: 18px; } }
@media (max-width: 560px) { .hero { padding-block: 32px 40px; } .hero__grid { gap: 28px; } .hero__copy .lp-eyebrow { font-size: .6875rem; letter-spacing: .08em; } .hero__title { margin-top: 18px; font-size: clamp(2.25rem, 9.2vw, 3.25rem); } .hero__lead { margin-top: 20px; font-size: 1rem; line-height: 1.65; } .hero__actions { margin-top: 24px; gap: 8px; width: 100%; } .hero__actions > .lp-btn { width: 100%; } .hero__price-link { justify-content: center; width: 100%; font-size: .9375rem; } .hero__points { margin-top: 16px; gap: 8px; } .hero__points li { font-size: .8125rem; } .channels__inner { justify-content: center; text-align: center; } .channels__list { justify-content: center; gap: 16px 22px; } .channels__item { font-size: .875rem; } }

</style>
