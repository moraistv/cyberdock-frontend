<template>
  <!--
    Botão flutuante do WhatsApp. Aparece junto com a barra do celular (mesma
    regra em useQuickActionsVisibility): some no hero e na calculadora, que já
    têm o próprio botão, e enquanto um campo está em edição.

    No computador é uma pílula com o nome; no celular, só o ícone, logo acima da
    barra de atalhos. Escondido, sai do foco e do leitor de tela (visibility).
  -->
  <a
    v-if="href"
    class="wa-float"
    :class="{ 'is-visible': visible }"
    :href="href"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Falar com a CyberDock no WhatsApp (abre em nova aba)"
  >
    <LandingIcon name="whatsapp" />
    <span class="wa-float__label">WhatsApp</span>
  </a>
</template>

<script setup>
import LandingIcon from '@/components/landing/LandingIcon.vue';
import { useQuickActionsVisibility } from '@/composables/useLandingScroll';
import { CONTACT_MESSAGES, whatsappLink } from '@/utils/landingContent';

const href = whatsappLink(CONTACT_MESSAGES.general);
const visible = useQuickActionsVisibility();
</script>

<style scoped>
.wa-float {
  position: fixed;
  right: max(24px, env(safe-area-inset-right));
  bottom: max(24px, env(safe-area-inset-bottom));
  z-index: 40;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 56px;
  padding: 0 24px 0 18px;
  border: 1px solid #1fbe5b;
  border-radius: 999px;
  /* Texto escuro sobre o verde da marca: 7,3:1 (branco daria 2:1). */
  background: #25d366;
  color: var(--lp-ink);
  font-size: 1rem;
  font-weight: 700;
  line-height: 1;
  text-decoration: none;
  box-shadow: 0 18px 36px -16px rgba(7, 94, 84, 0.7), 0 2px 6px rgba(5, 13, 26, 0.12);
  --icon-size: 26px;

  visibility: hidden;
  opacity: 0;
  transform: translateY(16px) scale(0.96);
  transition:
    opacity 0.25s ease,
    transform 0.35s var(--lp-ease),
    background-color 0.2s ease,
    box-shadow 0.3s var(--lp-ease),
    visibility 0s linear 0.35s;
}

.wa-float.is-visible {
  visibility: visible;
  opacity: 1;
  transform: none;
  transition-delay: 0s;
}

.wa-float.is-visible:hover {
  background: #3ddc7a;
  transform: translateY(-2px);
  box-shadow: 0 22px 40px -16px rgba(7, 94, 84, 0.8), 0 2px 6px rgba(5, 13, 26, 0.12);
}

.wa-float:focus-visible {
  outline-color: var(--lp-ink);
}

/* Celular: só o ícone, acima da barra de atalhos (48 px + 12 px de cada lado). */
@media (max-width: 760px) {
  .wa-float {
    right: 16px;
    bottom: calc(72px + 14px + env(safe-area-inset-bottom));
    justify-content: center;
    width: 56px;
    height: 56px;
    padding: 0;
    --icon-size: 30px;
  }

  .wa-float__label {
    display: none;
  }
}
</style>
