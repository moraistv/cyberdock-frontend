// src/composables/useLandingScroll.js
//
// Rolagem entre as seções da landing e destaque da seção visível no menu.

import { onBeforeUnmount, onMounted, ref } from 'vue';
import { prefersReducedMotion } from '@/composables/useReveal';

/**
 * Rola até a seção `id`. O deslocamento do menu fixo vem do scroll-padding-top
 * do <html> (html.lp-page em landing.css), então aqui basta pedir o alinhamento
 * ao topo.
 *
 * Também move o foco para a seção, para que quem navega por teclado ou leitor de
 * tela continue dali, e grava #id na barra de endereço sem empilhar histórico.
 */
export function scrollToSection(id, { updateHash = true, smooth = true } = {}) {
  const target = document.getElementById(id);
  if (!target) return false;

  const behavior = smooth && !prefersReducedMotion() ? 'smooth' : 'auto';
  target.scrollIntoView({ behavior, block: 'start' });
  target.focus({ preventScroll: true });

  if (updateHash) {
    // Reaproveita o state atual: o vue-router guarda posição e navegação nele.
    history.replaceState(history.state, '', `#${id}`);
  }
  return true;
}

export function scrollToTop({ smooth = true } = {}) {
  window.scrollTo({ top: 0, behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'auto' });
  history.replaceState(history.state, '', `${window.location.pathname}${window.location.search}`);
}

/** Id da seção que ocupa o meio da tela, ou '' quando nenhuma das listadas. */
export function useActiveSection(ids) {
  const active = ref('');
  let observer = null;

  onMounted(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) active.value = entry.target.id;
        else if (active.value === entry.target.id) active.value = '';
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    ids.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
  });

  onBeforeUnmount(() => {
    if (observer) observer.disconnect();
  });

  return active;
}
