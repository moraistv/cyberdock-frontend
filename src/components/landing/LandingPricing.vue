<template>
  <section id="precos" class="lp-section pricing" aria-labelledby="precos-titulo" tabindex="-1">
    <div class="pricing__bg" aria-hidden="true">
      <div class="pricing__glow" />
      <div class="pricing__dots" />
      <LandingCircuit class="pricing__circuit" />
    </div>

    <div class="lp-container pricing__inner">
      <header class="pricing__head">
        <div>
          <p v-reveal class="pricing__eyebrow">Tabela oficial</p>
          <h2 id="precos-titulo" v-reveal="60" class="pricing__title">Preços</h2>
        </div>
        <div v-reveal="140" class="pricing__aside">
          <p class="pricing__lead">
            Valores em reais, por serviço. Para estimar o seu mês com os seus números, use a calculadora.
          </p>
          <a class="lp-btn lp-btn--light" href="#calculadora" @click.prevent="go('calculadora')">
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
        <span class="note__mark" aria-hidden="true">!</span>
        <span class="note__text">{{ PRICE_NOTE }}</span>
      </p>
    </div>
  </section>
</template>

<script setup>
import LandingCircuit from '@/components/landing/LandingCircuit.vue';
import LandingIcon from '@/components/landing/LandingIcon.vue';
import { scrollToSection } from '@/composables/useLandingScroll';
import { vReveal } from '@/composables/useReveal';
import { PRICE_GROUPS, PRICE_NOTE } from '@/utils/landingContent';

const go = (id) => scrollToSection(id);
</script>

<style scoped>
/* --------------------------------------------------------------------------
 * Seção azul, no azul do logo. Texto pequeno é sempre tinta (#050d1a) ou está
 * dentro de uma cápsula branca; o único branco solto é o título gigante, que
 * é texto grande e fica sobre a parte mais escura do fundo.
 * ------------------------------------------------------------------------ */
.pricing {
  overflow: hidden;
  background: linear-gradient(160deg, #1479bd 0%, #1e90d6 46%, #2b9de4 100%);
  color: var(--lp-ink);
}

.pricing__bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.pricing__glow {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(60% 50% at 0% 0%, rgba(6, 65, 109, 0.85) 0%, transparent 72%),
    radial-gradient(50% 45% at 100% 100%, rgba(255, 255, 255, 0.22) 0%, transparent 70%);
}

.pricing__dots {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(255, 255, 255, 0.4) 1.3px, transparent 1.7px);
  background-size: 28px 28px;
  -webkit-mask-image: linear-gradient(200deg, #000 0%, transparent 55%);
  mask-image: linear-gradient(200deg, #000 0%, transparent 55%);
}

/* Só no canto inferior direito, onde não há conteúdo: trilhas passando por
 * trás das cápsulas atrapalhavam a leitura. */
.pricing__circuit {
  position: absolute;
  right: -2%;
  bottom: 0;
  width: min(44%, 560px);
  height: 300px;
  color: #fff;
  opacity: 0.32;
}

.pricing__inner {
  position: relative;
  z-index: 1;
}

/* --------------------------------------------------------------------------
 * Cabeçalho
 * ------------------------------------------------------------------------ */
.pricing__head {
  display: grid;
  gap: 28px;
  align-items: end;
}

.pricing__eyebrow {
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #fff;
}

.pricing__title {
  margin-top: 8px;
  font-size: clamp(5rem, 16vw, 12.5rem);
  font-weight: 800;
  line-height: 0.86;
  letter-spacing: -0.04em;
  color: #fff;
  text-shadow: 0 18px 50px rgba(6, 65, 109, 0.35);
}

.pricing__aside {
  display: grid;
  justify-items: start;
  gap: 20px;
  max-width: 420px;
}

.pricing__lead {
  padding: 16px 20px;
  border-radius: 20px;
  background: var(--lp-ink);
  font-size: 1rem;
  color: #fff;
}

/* --------------------------------------------------------------------------
 * Grupos
 * ------------------------------------------------------------------------ */
.pricing__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 36px 28px;
  margin-top: clamp(40px, 5vw, 72px);
}

.group {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-content: start;
  gap: 12px;
  transition: var(--lp-reveal-transition);
}

.group__head {
  display: flex;
  align-items: center;
  gap: 14px;
  width: fit-content;
  max-width: 100%;
  padding: 8px 26px 8px 8px;
  border-radius: 999px;
  background: var(--lp-ink);
  color: #fff;
  box-shadow: 0 14px 28px -16px rgba(5, 13, 26, 0.7);
}

.group__icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--lp-blue);
  color: #fff;
  font-size: 1.375rem;
}

.group__title {
  font-size: 1.25rem;
  font-weight: 760;
  letter-spacing: -0.02em;
}

.group__desc {
  padding-inline: 10px;
  font-size: 0.9375rem;
  font-weight: 560;
  line-height: 1.45;
}

.group__rows {
  display: grid;
  gap: 10px;
}

/* Cápsula branca com borda de tinta, pontilhado até o preço. */
.row {
  display: flex;
  align-items: baseline;
  gap: 14px;
  min-height: 62px;
  padding: 14px 26px;
  border: 2px solid var(--lp-ink);
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 4px 0 var(--lp-ink);
  transition: transform 0.3s var(--lp-ease), box-shadow 0.3s var(--lp-ease);
}

.row:hover {
  transform: translateY(-2px);
  box-shadow: 0 7px 0 var(--lp-ink);
}

.row__name {
  font-weight: 650;
  color: var(--lp-ink);
}

.row__leader {
  flex: 1;
  min-width: 16px;
  align-self: flex-end;
  margin-bottom: 8px;
  border-bottom: 3px dotted rgba(5, 13, 26, 0.32);
}

.row__price {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: flex-end;
  gap: 2px 8px;
  text-align: right;
}

.row__price strong {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1;
  color: var(--lp-blue-deep);
}

.row__price small {
  font-size: 0.8125rem;
  font-weight: 650;
  color: var(--lp-muted);
}

.group__foot {
  padding-inline: 10px;
  font-size: 0.875rem;
  font-weight: 560;
}

/* --------------------------------------------------------------------------
 * Nota: a barra preta que se dissolve, com o círculo de aviso
 * ------------------------------------------------------------------------ */
.note {
  display: flex;
  align-items: center;
  gap: 16px;
  width: fit-content;
  max-width: 100%;
  margin-top: clamp(40px, 5vw, 64px);
  padding: 12px 76px 12px 12px;
  border-radius: 999px 0 0 999px;
  background: linear-gradient(90deg, var(--lp-ink) calc(100% - 76px), rgba(5, 13, 26, 0) 100%);
  color: #fff;
}

.note__mark {
  display: grid;
  flex: none;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 2px solid #fff;
  border-radius: 50%;
  font-size: 1.5rem;
  font-weight: 800;
  line-height: 1;
}

.note__text {
  font-size: 0.9375rem;
  font-weight: 560;
  line-height: 1.4;
}

/* --------------------------------------------------------------------------
 * Telas largas
 * ------------------------------------------------------------------------ */
@media (min-width: 900px) {
  .pricing__head {
    grid-template-columns: minmax(0, 1fr) minmax(0, 420px);
    justify-content: space-between;
  }

  .pricing__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-areas:
      'storage shipping'
      'transfer assembly'
      'collection assembly';
    align-items: start;
  }

  .group--storage {
    grid-area: storage;
  }

  .group--shipping {
    grid-area: shipping;
  }

  .group--transfer {
    grid-area: transfer;
  }

  .group--assembly {
    grid-area: assembly;
  }

  .group--collection {
    grid-area: collection;
  }
}

@media (max-width: 520px) {
  .row {
    flex-wrap: wrap;
    row-gap: 2px;
    padding: 14px 20px;
    border-radius: 28px;
  }

  .row__leader {
    display: none;
  }

  .row__price {
    margin-left: auto;
  }

  .group__head {
    padding-right: 20px;
  }

  .note {
    padding-right: 48px;
    border-radius: 32px 0 0 32px;
    background: linear-gradient(90deg, var(--lp-ink) calc(100% - 48px), rgba(5, 13, 26, 0) 100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .row:hover {
    transform: none;
    box-shadow: 0 4px 0 var(--lp-ink);
  }
}
</style>
