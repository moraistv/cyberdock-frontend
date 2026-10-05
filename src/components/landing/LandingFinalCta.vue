<template>
  <section id="proximo-passo" class="lp-section final" aria-labelledby="final-titulo">
    <div class="lp-container">
      <div v-reveal class="panel lp-dark">
        <div class="panel__bg" aria-hidden="true">
          <LandingCircuit class="panel__circuit" />
          <div class="panel__dots" />
        </div>

        <div class="panel__content">
          <p class="lp-eyebrow">Próximo passo</p>
          <h2 id="final-titulo" class="panel__title">
            Mais tempo para vender.
            <span>Seu envio com a CyberDock.</span>
          </h2>
          <p class="panel__text">
            Comece pelos seus números. Simule o custo de armazenamento, expedição e dos serviços que sua loja precisa.
          </p>

          <div class="panel__actions">
            <a class="lp-btn lp-btn--bright" href="#calculadora" @click.prevent="go('calculadora')">
              Simular meu custo
              <LandingIcon name="arrow-right" />
            </a>
            <a
              v-if="contact"
              class="lp-btn lp-btn--outline-light"
              :href="contact.href"
              :target="contact.external ? '_blank' : null"
              :rel="contact.external ? 'noopener noreferrer' : null"
            >
              <LandingIcon name="message" />
              {{ contact.label }}
            </a>
            <router-link v-else to="/auth" class="lp-btn lp-btn--outline-light">
              Entrar no painel
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';

import LandingCircuit from '@/components/landing/LandingCircuit.vue';
import LandingIcon from '@/components/landing/LandingIcon.vue';
import { scrollToSection } from '@/composables/useLandingScroll';
import { vReveal } from '@/composables/useReveal';
import { contactAction } from '@/utils/landingContent';

const contact = computed(() => contactAction());
const go = (id) => scrollToSection(id);
</script>

<style scoped>
.final {
  padding-block: clamp(48px, 6vw, 88px) clamp(72px, 8vw, 120px);
  background: #fff;
}

.panel {
  position: relative;
  overflow: hidden;
  border-radius: var(--lp-radius-xl);
  background:
    radial-gradient(80% 90% at 100% 0%, rgba(30, 144, 214, 0.55) 0%, transparent 60%),
    linear-gradient(150deg, var(--lp-ink) 0%, var(--lp-blue-night) 100%);
  color: #fff;
  box-shadow: var(--lp-shadow-l);
}

.panel__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.panel__circuit {
  position: absolute;
  right: -4%;
  bottom: -6%;
  width: min(60%, 560px);
  height: 110%;
  color: var(--lp-blue-bright);
  opacity: 0.55;
}

.panel__dots {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(255, 255, 255, 0.22) 1.2px, transparent 1.6px);
  background-size: 28px 28px;
  -webkit-mask-image: linear-gradient(100deg, #000 0%, transparent 60%);
  mask-image: linear-gradient(100deg, #000 0%, transparent 60%);
}

.panel__content {
  position: relative;
  display: grid;
  justify-items: start;
  padding: clamp(36px, 6vw, 88px);
}

.panel__title {
  margin-top: 18px;
  max-width: 16ch;
  font-size: clamp(2.5rem, 4.2vw + 0.6rem, 4.5rem);
  font-weight: 760;
  line-height: 1.04;
  letter-spacing: -0.012em;
  color: #fff;
}

.panel__title > span {
  display: block;
  color: #a8daf8;
}

.panel__text {
  margin-top: 22px;
  max-width: 46ch;
  font-size: clamp(1.0625rem, 0.35vw + 1rem, 1.25rem);
  color: var(--lp-on-dark);
}

.panel__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 36px;
}

@media (max-width: 560px) {
  .panel__content { padding: 28px 24px; }
  .panel__title { font-size: 2rem; max-width: none; }
  .panel__actions { width: 100%; margin-top: 24px; }
  .panel__actions .lp-btn {
    width: 100%;
  }
}
</style>
