<template>
  <header class="nav" :class="{ 'nav--open': open, 'nav--stuck': stuck }" :style="{ '--progress': progress }">
    <div class="lp-container nav__inner">
      <a class="nav__brand" href="/" aria-label="CyberDock, voltar ao topo" @click.prevent="goTop">
        <img class="nav__logo" :src="logo" alt="" width="383" height="155">
      </a>

      <nav class="nav__links" aria-label="Seções da página">
        <a
          v-for="link in NAV_LINKS"
          :key="link.id"
          class="nav__link"
          :href="`#${link.id}`"
          :aria-current="active === link.id ? 'location' : null"
          @click.prevent="go(link.id)"
        >{{ link.label }}</a>
      </nav>

      <div class="nav__actions">
        <router-link to="/auth" class="lp-btn lp-btn--ghost lp-btn--sm">Entrar</router-link>
        <a class="lp-btn lp-btn--sm" href="#calculadora" @click.prevent="go('calculadora')">
          Simular custo
          <LandingIcon name="arrow-right" />
        </a>
      </div>

      <!-- Celular: o login fica à vista no cabeçalho, sem precisar abrir o menu. -->
      <router-link to="/auth" class="lp-btn lp-btn--ghost lp-btn--sm nav__login">Entrar</router-link>

      <button
        class="nav__toggle"
        type="button"
        aria-controls="menu-mobile"
        :aria-expanded="open ? 'true' : 'false'"
        :aria-label="open ? 'Fechar menu' : 'Abrir menu'"
        @click="open = !open"
      >
        <LandingIcon :name="open ? 'x' : 'menu'" />
      </button>
    </div>

    <!-- Menu do celular: visibility:hidden tira os links do foco quando fechado. -->
    <div id="menu-mobile" class="nav__sheet">
      <nav class="lp-container nav__sheet-inner" aria-label="Seções da página (menu)">
        <a
          v-for="link in NAV_LINKS"
          :key="link.id"
          class="nav__sheet-link"
          :href="`#${link.id}`"
          @click.prevent="go(link.id)"
        >
          {{ link.label }}
          <LandingIcon name="arrow-right" />
        </a>
        <div class="nav__sheet-actions">
          <router-link to="/auth" class="lp-btn lp-btn--ghost">Entrar no painel</router-link>
          <a class="lp-btn" href="#calculadora" @click.prevent="go('calculadora')">Simular meu custo</a>
        </div>
      </nav>
    </div>

    <span class="nav__progress" aria-hidden="true" />
  </header>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

import logo from '@/assets/logo.png';
import LandingIcon from '@/components/landing/LandingIcon.vue';
import { scrollToSection, scrollToTop, useActiveSection } from '@/composables/useLandingScroll';
import { NAV_LINKS } from '@/utils/landingContent';

const open = ref(false);
const stuck = ref(false);
const progress = ref(0);
const active = useActiveSection(NAV_LINKS.map((link) => link.id));

function go(id) {
  open.value = false;
  scrollToSection(id);
}

function goTop() {
  open.value = false;
  scrollToTop();
}

/* Sombra do menu e barra de progresso de leitura. Um frame por rolagem, no
 * máximo, e listener passivo: não compete com a rolagem. */
let frame = 0;

function measure() {
  frame = 0;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  stuck.value = window.scrollY > 8;
  progress.value = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
}

function onScroll() {
  if (!frame) frame = requestAnimationFrame(measure);
}

function onKeydown(event) {
  if (event.key === 'Escape' && open.value) open.value = false;
}

/* Ao chegar na largura do menu completo, o menu do celular se fecha sozinho. */
function onResize() {
  if (open.value && window.innerWidth >= 1040) open.value = false;
  onScroll();
}

onMounted(() => {
  measure();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('keydown', onKeydown);
});

/* Com o menu aberto o fundo não rola, para o toque não arrastar a página. */
watch(open, (isOpen) => {
  document.documentElement.style.overflow = isOpen ? 'hidden' : '';
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('resize', onResize);
  window.removeEventListener('keydown', onKeydown);
  if (frame) cancelAnimationFrame(frame);
  document.documentElement.style.overflow = '';
});
</script>

<style scoped>
.nav {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(255, 255, 255, 0.94);
  -webkit-backdrop-filter: saturate(1.6) blur(18px);
  backdrop-filter: saturate(1.6) blur(18px);
  border-bottom: 1px solid transparent;
  transition: border-color 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease;
}

.nav--stuck {
  border-bottom-color: rgba(5, 13, 26, 0.08);
  box-shadow: 0 10px 30px -22px rgba(5, 13, 26, 0.45);
}

.nav__inner {
  display: flex;
  align-items: center;
  gap: 12px;
  height: var(--lp-nav-h);
}

.nav__brand {
  display: inline-flex;
  flex: none;
  border-radius: 10px;
}

.nav__logo {
  width: auto;
  height: 48px;
}

.nav__links {
  display: none;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.nav__link {
  position: relative;
  padding: 10px 14px;
  border-radius: 999px;
  font-size: 0.9375rem;
  font-weight: 560;
  color: var(--lp-text);
  text-decoration: none;
  transition: color 0.2s ease, background-color 0.2s ease;
}

.nav__link::after {
  content: '';
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 5px;
  height: 2px;
  border-radius: 2px;
  background: var(--lp-blue);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.35s var(--lp-ease);
}

.nav__link:hover::after,
.nav__link[aria-current='location']::after {
  transform: scaleX(1);
}

.nav__link[aria-current='location'] {
  color: var(--lp-blue-deep);
}

.nav__actions {
  display: none;
  align-items: center;
  gap: 10px;
}

.nav__login {
  margin-left: auto;
}

.nav__toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 48px;
  height: 48px;
  border: 1px solid var(--lp-ink);
  border-radius: 10px;
  background: transparent;
  color: var(--lp-ink);
  font-size: 1.25rem;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.nav__toggle:hover,
.nav--open .nav__toggle {
  background: var(--lp-ink);
  color: #fff;
}

.nav__sheet {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: calc(100vh - var(--lp-nav-h));
  max-height: calc(100dvh - var(--lp-nav-h));
  overflow-y: auto;
  background: #fff;
  border-bottom: 1px solid rgba(5, 13, 26, 0.1);
  box-shadow: 0 30px 50px -30px rgba(5, 13, 26, 0.5);
  visibility: hidden;
  opacity: 0;
  transform: translateY(-10px);
  transition: opacity 0.25s ease, transform 0.35s var(--lp-ease), visibility 0s linear 0.35s;
}

.nav--open .nav__sheet {
  visibility: visible;
  opacity: 1;
  transform: none;
  transition-delay: 0s;
}

.nav__sheet-inner {
  display: flex;
  flex-direction: column;
  padding-block: 12px 28px;
}

.nav__sheet-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 60px;
  border-bottom: 1px solid var(--lp-line);
  font-size: 1.125rem;
  font-weight: 620;
  color: var(--lp-ink);
  text-decoration: none;
}

.nav__sheet-actions {
  display: grid;
  gap: 12px;
  margin-top: 24px;
}

.nav__progress {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 3px;
  background: linear-gradient(90deg, var(--lp-blue-deep), var(--lp-blue-bright));
  transform: scaleX(var(--progress, 0));
  transform-origin: left;
  opacity: 0.9;
}

@media (min-width: 1040px) {
  .nav__inner {
    gap: 28px;
  }

  .nav__links,
  .nav__actions {
    display: flex;
  }

  .nav__actions {
    margin-left: 12px;
  }

  .nav__login,
  .nav__toggle,
  .nav__sheet {
    display: none;
  }
}

@media (max-width: 480px) {
  .nav__logo {
    height: 42px;
  }
}

/* 320 px: logo + Entrar + menu precisam caber nos 280 px úteis. */
@media (max-width: 360px) {
  .nav__login {
    padding-inline: 16px;
  }
}
</style>
