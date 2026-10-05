<template>
  <section id="precos" class="lp-section pricing" aria-labelledby="precos-titulo" tabindex="-1">
    <div class="lp-container pricing__inner">
      <header class="pricing__head">
        <div>
          <p v-reveal class="lp-eyebrow">Preços por serviço</p>
          <h2 id="precos-titulo" v-reveal="60" class="lp-h2">Uma conta que<br> você entende.</h2>
        </div>
        <div v-reveal="140" class="pricing__aside">
          <p class="pricing__lead">
            Veja quanto custa cada etapa da operação. Depois, combine os serviços na calculadora para estimar seu mês.
          </p>
          <a class="lp-btn lp-btn--blue" href="#calculadora" @click.prevent="go('calculadora')">
            <LandingIcon name="calculator" />
            Calcular meu custo
          </a>
        </div>
      </header>

      <div class="pricing__grid">
        <article
          v-for="(group, index) in PRICE_GROUPS"
          :key="group.id"
          v-reveal="index * 80"
          class="group"
          :class="`group--${group.id}`"
          :aria-labelledby="`grupo-${group.id}`"
        >
          <header class="group__head">
            <span class="group__icon"><LandingIcon :name="group.icon" /></span>
            <h3 :id="`grupo-${group.id}`" class="group__title">{{ group.title }}</h3>
          </header>

          <p v-if="group.description" class="group__desc">{{ group.description }}</p>

          <ul class="group__rows" role="list">
            <li v-for="row in group.rows" :key="row.name" class="row">
              <span class="row__name">{{ row.name }}</span>
              <span class="row__leader" aria-hidden="true" />
              <span class="row__price">
                <strong>{{ row.price }}</strong>
                <small>{{ row.unit }}</small>
              </span>
            </li>
          </ul>

          <p v-if="group.footnote" class="group__foot">{{ group.footnote }}</p>
        </article>
      </div>

      <p v-reveal class="note" role="note">
        <span class="note__mark"><LandingIcon name="info" /></span>
        <span class="note__text">{{ PRICE_NOTE }}</span>
      </p>
    </div>
  </section>
</template>

<script setup>
import LandingIcon from '@/components/landing/LandingIcon.vue';
import { scrollToSection } from '@/composables/useLandingScroll';
import { vReveal } from '@/composables/useReveal';
import { PRICE_GROUPS, PRICE_NOTE } from '@/utils/landingContent';

const go = (id) => scrollToSection(id);
</script>

<style scoped>

.pricing { background: #f3f7fa; border-block: 1px solid var(--lp-line); }
.pricing__head { display: grid; align-items: end; gap: 28px; }
.pricing__aside { display: grid; justify-items: start; gap: 20px; max-width: 420px; }
.pricing__lead { color: var(--lp-muted); line-height: 1.7; }
.pricing__grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 20px; margin-top: 44px; }
.group { min-width: 0; padding: clamp(22px, 2.5vw, 32px); border: 1px solid var(--lp-line); border-radius: 16px; background: #fff; transition: var(--lp-reveal-transition); }
.group__head { display: flex; align-items: center; gap: 12px; }
.group__icon { display: grid; place-items: center; flex: none; width: 40px; height: 40px; border-radius: 10px; background: var(--lp-sky); color: var(--lp-blue-deep); --icon-size: 22px; }
.group__title { font-size: 1.25rem; font-weight: 700; color: var(--lp-ink); }
.group__desc { margin-top: 14px; font-size: .875rem; color: var(--lp-muted); }
.group__rows { display: grid; margin-top: 18px; }
.row { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 64px; padding-block: 14px; border-top: 1px solid var(--lp-line); }
.row__name { font-size: .9375rem; font-weight: 600; }
.row__leader { display: none; }
.row__price { display: grid; gap: 3px; text-align: right; flex: none; }
.row__price strong { color: var(--lp-blue-deep); font-size: 1.65rem; font-weight: 740; line-height: 1.2; letter-spacing: -.025em; font-variant-numeric: tabular-nums; }
.row__price small { font-size: .75rem; color: var(--lp-muted); }
.group__foot { margin-top: 14px; font-size: .8125rem; color: var(--lp-muted); }
.note { display: flex; align-items: flex-start; gap: 10px; margin-top: 24px; color: var(--lp-muted); font-size: .875rem; }
.note__mark { padding-top: 2px; color: var(--lp-blue-deep); flex: none; }
@media (min-width: 900px) { .pricing__head { grid-template-columns: minmax(0, 1fr) minmax(0, 420px); justify-content: space-between; } .pricing__grid { grid-template-columns: repeat(6, minmax(0, 1fr)); align-items: stretch; } .group { grid-column: span 2; } .group--storage, .group--shipping { grid-column: span 3; } }
@media (max-width: 360px) { .row__price strong { font-size: 1.4rem; } .row { gap: 10px; } }

</style>
