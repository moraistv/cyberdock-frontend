// src/composables/useLandingScroll.js
//
// Rolagem entre as seções da landing e destaque da seção visível no menu.

import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
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

/**
 * Quando mostrar os atalhos fixos (barra do celular e botão do WhatsApp):
 * fora do hero e da calculadora, que já têm os próprios botões, e nunca com um
 * campo em edição, para não cobrir o que se digita nem o teclado do celular.
 * Os dois atalhos usam esta mesma regra, então aparecem e somem juntos.
 */
export function useQuickActionsVisibility() {
  const heroVisible = ref(true);
  const calculatorVisible = ref(false);
  const editing = ref(false);
  const visible = computed(() => !heroVisible.value && !calculatorVisible.value && !editing.value);

  let frame = 0;
  function update() {
    frame = 0;
    const hero = document.getElementById('topo')?.getBoundingClientRect();
    const calculator = document.getElementById('calculadora')?.getBoundingClientRect();
    heroVisible.value = Boolean(hero && hero.bottom > 76 && hero.top < window.innerHeight);
    calculatorVisible.value = Boolean(calculator && calculator.top < window.innerHeight && calculator.bottom > 76);
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }
  function onFocusIn(event) {
    editing.value = Boolean(event.target?.matches('input, textarea, select, [contenteditable="true"]'));
  }
  function onFocusOut() { editing.value = false; }

  onMounted(() => {
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
  });
  onBeforeUnmount(() => {
    if (frame) cancelAnimationFrame(frame);
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    document.removeEventListener('focusin', onFocusIn);
    document.removeEventListener('focusout', onFocusOut);
  });

  return visible;
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
