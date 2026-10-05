// src/composables/useReveal.js
//
// Movimento da landing: entrada ao rolar, brilho que segue o ponteiro e número
// que anima até o valor novo. Tudo respeita prefers-reduced-motion: quem pede
// menos movimento vê o conteúdo pronto, sem deslocamento nem contagem.

import { onBeforeUnmount, ref, watch } from 'vue';

export function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ---------------------------------------------------------------------------
 * v-reveal
 *
 * Marca o elemento com .lp-reveal e, quando ele entra na tela, acrescenta
 * .is-in. O CSS só esconde o elemento enquanto a raiz tem .lp--js, então sem
 * JavaScript (ou sem IntersectionObserver) nada fica invisível.
 *
 * Uso: v-reveal            entrada simples
 *      v-reveal="120"      com atraso de 120 ms (escalonar irmãos)
 * ------------------------------------------------------------------------- */
let observer = null;

function sharedObserver() {
  if (observer) return observer;
  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
  return observer;
}

export const vReveal = {
  mounted(el, binding) {
    el.classList.add('lp-reveal');

    const delay = Number(binding.value);
    if (Number.isFinite(delay) && delay > 0) {
      el.style.setProperty('--lp-delay', `${delay}ms`);
    }

    if (typeof IntersectionObserver === 'undefined' || prefersReducedMotion()) {
      el.classList.add('is-in');
      return;
    }
    sharedObserver().observe(el);
  },
  unmounted(el) {
    if (observer) observer.unobserve(el);
  },
};

/* ---------------------------------------------------------------------------
 * v-spotlight
 *
 * Grava a posição do ponteiro em --mx/--my no elemento. O CSS usa as duas
 * variáveis para desenhar um brilho que acompanha o mouse. Só em ponteiro fino
 * (mouse); no toque não há o que seguir.
 * ------------------------------------------------------------------------- */
export const vSpotlight = {
  mounted(el) {
    if (prefersReducedMotion()) return;
    if (typeof window.matchMedia === 'function' && !window.matchMedia('(pointer: fine)').matches) return;

    const onMove = (event) => {
      const box = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${event.clientX - box.left}px`);
      el.style.setProperty('--my', `${event.clientY - box.top}px`);
    };
    el.addEventListener('pointermove', onMove, { passive: true });
    el.__lpSpotlight = onMove;
  },
  unmounted(el) {
    if (el.__lpSpotlight) el.removeEventListener('pointermove', el.__lpSpotlight);
  },
};

/* ---------------------------------------------------------------------------
 * useAnimatedNumber
 *
 * Acompanha um número inteiro (centavos) e devolve uma ref que caminha até ele.
 * Sempre termina EXATAMENTE no valor-alvo: a animação é só o caminho.
 * ------------------------------------------------------------------------- */
export function useAnimatedNumber(source, { duration = 360 } = {}) {
  const display = ref(source.value);
  let frame = 0;

  const stop = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  };

  watch(source, (target) => {
    stop();
    if (prefersReducedMotion() || typeof requestAnimationFrame !== 'function') {
      display.value = target;
      return;
    }

    const from = display.value;
    const startedAt = performance.now();

    const step = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - (1 - progress) ** 3;
      display.value = progress >= 1 ? target : Math.round(from + (target - from) * eased);
      frame = progress < 1 ? requestAnimationFrame(step) : 0;
    };
    frame = requestAnimationFrame(step);
  });

  onBeforeUnmount(stop);
  return display;
}
