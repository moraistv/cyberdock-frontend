<template>
  <footer id="rodape" class="footer lp-dark">
    <div class="lp-container footer__top">
      <div class="footer__brand">
        <!-- O logo tem texto preto, então vai sobre um cartão branco no rodapé escuro. -->
        <a class="footer__logo" href="/" aria-label="CyberDock, voltar ao topo" @click.prevent="goTop">
          <img :src="logo" alt="" width="383" height="155">
        </a>
        <p class="footer__tagline">Fulfillment para quem vende em marketplaces.</p>
      </div>

      <div class="footer__cols">
        <nav class="footer__nav" aria-labelledby="rodape-pagina">
          <h2 id="rodape-pagina" class="footer__heading">Na página</h2>
          <ul role="list">
            <li v-for="link in NAV_LINKS" :key="link.id">
              <a :href="`#${link.id}`" @click.prevent="go(link.id)">{{ link.label }}</a>
            </li>
          </ul>
        </nav>

        <div class="footer__nav">
          <h2 class="footer__heading">Painel</h2>
          <ul role="list">
            <li><router-link to="/auth">Entrar no painel</router-link></li>
          </ul>
        </div>

        <div v-if="LANDING_CONTACT.whatsapp || LANDING_CONTACT.email" class="footer__nav">
          <h2 class="footer__heading">Contato</h2>
          <ul role="list">
            <li v-if="LANDING_CONTACT.whatsapp">
              <a :href="whatsappLink()" target="_blank" rel="noopener noreferrer">WhatsApp</a>
            </li>
            <li v-if="LANDING_CONTACT.email">
              <a :href="mailLink()">{{ LANDING_CONTACT.email }}</a>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="lp-container footer__bottom">
      <p>© {{ year }} CyberDock. Todos os direitos reservados.</p>
    </div>
  </footer>
</template>

<script setup>
import logo from '@/assets/logo.png';
import { scrollToSection, scrollToTop } from '@/composables/useLandingScroll';
import { LANDING_CONTACT, NAV_LINKS, mailLink, whatsappLink } from '@/utils/landingContent';

const year = new Date().getFullYear();

const go = (id) => scrollToSection(id);
const goTop = () => scrollToTop();
</script>

<style scoped>
.footer {
  background: var(--lp-ink);
  color: var(--lp-on-dark-muted);
}

.footer__top {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 40px 64px;
  padding-block: clamp(48px, 6vw, 80px);
}

.footer__brand {
  display: grid;
  flex: 1 1 280px;
  justify-items: start;
  align-content: start;
  gap: 18px;
}

.footer__cols {
  display: flex;
  flex-wrap: wrap;
  gap: 32px 64px;
}

.footer__logo {
  display: inline-flex;
  padding: 10px 16px;
  border-radius: 18px;
  background: #fff;
  transition: transform 0.3s var(--lp-ease);
}

.footer__logo:hover {
  transform: translateY(-2px);
}

.footer__logo img {
  width: auto;
  height: 46px;
}

.footer__tagline {
  max-width: 28ch;
  color: var(--lp-on-dark);
}

.footer__heading {
  margin-bottom: 14px;
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--lp-blue-bright);
}

.footer__nav ul {
  display: grid;
  gap: 4px;
}

.footer__nav a {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  color: var(--lp-on-dark);
  text-decoration: none;
  transition: color 0.2s ease;
}

.footer__nav a:hover {
  color: var(--lp-blue-bright);
  text-decoration: underline;
  text-underline-offset: 4px;
}

.footer__bottom {
  padding-block: 24px 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 0.875rem;
}
</style>
