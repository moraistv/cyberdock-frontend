import { computed, ref } from 'vue';

/**
 * Estado do menu lateral, compartilhado por toda a aplicação.
 *
 * São dois comportamentos distintos, e misturá-los é o que costuma deixar a
 * navegação estranha:
 *
 * - DESKTOP: o menu está sempre visível e alterna entre largura cheia e apenas
 *   ícones. A escolha persiste em localStorage, então não volta ao padrão a
 *   cada navegação ou recarga.
 * - MOBILE: o menu fica fora da tela e entra como gaveta sobre o conteúdo,
 *   com fundo escurecido. Não faz sentido "só ícones" numa tela estreita.
 *
 * O estado vive no módulo (fora da função) para ser único: cada componente que
 * chama useSidebar() enxerga o mesmo menu.
 */

const STORAGE_KEY = 'cyberdock.sidebar.collapsed';
const MOBILE_BREAKPOINT = 1024;

function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

const isCollapsed = ref(readStored());
const isMobileOpen = ref(false);
const viewportWidth = ref(typeof window === 'undefined' ? 1280 : window.innerWidth);

let listening = false;

function handleResize() {
  viewportWidth.value = window.innerWidth;
  // Ao voltar para desktop a gaveta precisa fechar, senão fica um overlay
  // invisível capturando cliques.
  if (viewportWidth.value > MOBILE_BREAKPOINT) isMobileOpen.value = false;
}

export function useSidebar() {
  if (!listening && typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize, { passive: true });
    listening = true;
  }

  const isMobile = computed(() => viewportWidth.value <= MOBILE_BREAKPOINT);
  /** No mobile o menu nunca é "só ícones": ou está aberto, ou escondido. */
  const isIconOnly = computed(() => !isMobile.value && isCollapsed.value);

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, isCollapsed.value ? '1' : '0');
    } catch {
      // Modo privado pode bloquear o storage; a preferência só não persiste.
    }
  }

  /** Botão do topo: recolhe no desktop, abre/fecha a gaveta no mobile. */
  function toggle() {
    if (isMobile.value) {
      isMobileOpen.value = !isMobileOpen.value;
      return;
    }
    isCollapsed.value = !isCollapsed.value;
    persist();
  }

  function closeMobile() {
    isMobileOpen.value = false;
  }

  return {
    isCollapsed,
    isMobileOpen,
    isMobile,
    isIconOnly,
    toggle,
    closeMobile,
  };
}
