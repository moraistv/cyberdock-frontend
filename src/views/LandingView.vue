<template>
  <!--
    Landing pública da CyberDock (rota "/").

    Visitante vê esta página; quem já está logado nem chega aqui, porque o guard
    de src/router/index.js manda direto para a tela inicial do papel.

    Tudo vive sob .lp (src/assets/landing.css), então nenhum estilo vaza para o
    painel. Conteúdo e números: utils/landingContent.js e utils/pricing.js.
  -->
  <div class="lp lp--js">
    <a class="lp-skip" href="#conteudo" @click.prevent="skipToContent">Ir para o conteúdo</a>

    <LandingNav />

    <main id="conteudo" tabindex="-1">
      <LandingHero />
      <LandingServices />
      <LandingSteps />
      <LandingPricing />
      <LandingCalculator />
      <LandingPlatform />
      <LandingFaq />
      <LandingFinalCta />
    </main>

    <LandingFooter />
    <LandingMobileActions />
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted } from 'vue';

import '@/assets/landing.css';
import LandingCalculator from '@/components/landing/LandingCalculator.vue';
import LandingFaq from '@/components/landing/LandingFaq.vue';
import LandingFinalCta from '@/components/landing/LandingFinalCta.vue';
import LandingFooter from '@/components/landing/LandingFooter.vue';
import LandingHero from '@/components/landing/LandingHero.vue';
import LandingNav from '@/components/landing/LandingNav.vue';
import LandingMobileActions from '@/components/landing/LandingMobileActions.vue';
import LandingPlatform from '@/components/landing/LandingPlatform.vue';
import LandingPricing from '@/components/landing/LandingPricing.vue';
import LandingServices from '@/components/landing/LandingServices.vue';
import LandingSteps from '@/components/landing/LandingSteps.vue';
import { scrollToSection } from '@/composables/useLandingScroll';
import { PAGE_DESCRIPTION, PAGE_TITLE } from '@/utils/landingContent';

function skipToContent() {
  scrollToSection('conteudo', { updateHash: false, smooth: false });
}

/* Título e descrição valem só enquanto a landing está na tela; ao sair, voltam
 * ao que o index.html definiu para o restante do sistema. */
const previousTitle = document.title;
let descriptionTag = null;
let createdDescriptionTag = false;
let previousDescription = '';

onMounted(async () => {
  document.title = PAGE_TITLE;
  document.documentElement.classList.add('lp-page');

  descriptionTag = document.querySelector('meta[name="description"]');
  if (!descriptionTag) {
    descriptionTag = document.createElement('meta');
    descriptionTag.setAttribute('name', 'description');
    document.head.appendChild(descriptionTag);
    createdDescriptionTag = true;
  }
  previousDescription = descriptionTag.getAttribute('content') || '';
  descriptionTag.setAttribute('content', PAGE_DESCRIPTION);

  /* Link direto para uma seção (cyberdock.com.br/#precos): o navegador não rola
   * sozinho porque a página só existe depois que o Vue monta. */
  const hash = decodeURIComponent(window.location.hash.replace(/^#/, ''));
  if (hash) {
    await nextTick();
    requestAnimationFrame(() => scrollToSection(hash, { updateHash: false, smooth: false }));
  }
});

onBeforeUnmount(() => {
  document.title = previousTitle;
  document.documentElement.classList.remove('lp-page');
  if (!descriptionTag) return;
  if (createdDescriptionTag) descriptionTag.remove();
  else descriptionTag.setAttribute('content', previousDescription);
});
</script>
