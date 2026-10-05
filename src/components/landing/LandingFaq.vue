<template>
  <section id="perguntas" class="lp-section faq" aria-labelledby="perguntas-titulo" tabindex="-1">
    <div class="lp-container faq__grid">
      <header class="faq__head">
        <p v-reveal class="lp-eyebrow">Perguntas</p>
        <h2 id="perguntas-titulo" v-reveal="60" class="lp-h2">Antes de começar,<br> tire suas dúvidas.</h2>
        <p v-reveal="120" class="lp-lead">
          Como os serviços funcionam, o que está incluído e como calculamos os valores.
        </p>
      </header>

      <div class="faq__list">
        <!-- <details> nativo: abre com Enter/Espaço, é anunciado por leitor de tela
             e funciona sem JavaScript. `name` deixa só uma resposta aberta por vez. -->
        <details
          v-for="(item, index) in FAQ_ITEMS"
          :key="item.id"
          v-reveal="index * 50"
          class="item"
          name="landing-faq"
        >
          <summary class="item__question">
            <span>{{ item.question }}</span>
            <span class="item__chevron" aria-hidden="true"><LandingIcon name="plus" /></span>
          </summary>
          <p class="item__answer">{{ item.answer }}</p>
        </details>
      </div>
    </div>
  </section>
</template>

<script setup>
import LandingIcon from '@/components/landing/LandingIcon.vue';
import { vReveal } from '@/composables/useReveal';
import { FAQ_ITEMS } from '@/utils/landingContent';
</script>

<style scoped>
.faq {
  background: #fff;
}

.faq__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: clamp(32px, 5vw, 64px);
  align-items: start;
}

.faq__head {
  display: grid;
  justify-items: start;
}

.faq__list {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
}

.item {
  border: 1px solid var(--lp-line);
  border-radius: var(--lp-radius-m);
  background: var(--lp-sky-2);
  transition: var(--lp-reveal-transition), background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s var(--lp-ease);
}

.item:hover {
  border-color: rgba(30, 144, 214, 0.5);
}

.item[open] {
  border-color: var(--lp-blue);
  background: #fff;
  box-shadow: var(--lp-shadow-m);
}

.item__question {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 64px;
  padding: 16px 22px;
  font-size: 1.0625rem;
  font-weight: 680;
  letter-spacing: -0.01em;
  color: var(--lp-ink);
  cursor: pointer;
  list-style: none;
}

.item__question::-webkit-details-marker {
  display: none;
}

.item__chevron {
  display: grid;
  flex: none;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #fff;
  color: var(--lp-blue-deep);
  box-shadow: inset 0 0 0 1px var(--lp-line);
  transition: transform 0.4s var(--lp-ease), background-color 0.25s ease, color 0.25s ease;
}

.item[open] .item__chevron {
  background: var(--lp-ink);
  color: #fff;
  transform: rotate(135deg);
}

.item__answer {
  padding: 0 22px 22px;
  max-width: 62ch;
  color: var(--lp-muted);
  animation: lp-pop 0.45s var(--lp-ease);
}

@media (min-width: 980px) {
  .faq__grid {
    grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  }

  .faq__head {
    position: sticky;
    top: calc(var(--lp-nav-h) + 32px);
  }
}
</style>
