<template>
  <div>
    <button @click="openModal" class="connect-button" title="Conectar uma loja Shopee">
      <img src="/img/shopee-logo.svg" alt="" class="connect-button__logo" />
      <span class="connect-button__label">Conectar loja</span>
      <svg class="connect-button__plus" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
    </button>
    <UniversalModal :title="modalTitle" :isOpen="isModalOpen" @close="closeModal">
      <div class="multi-account-info" style="margin-bottom: 1rem; background: #fff1ec; border: 1px solid #f8c6b4; border-radius: 8px; padding: 0.75rem; color: #b3401f; font-size: 1rem;">
        <strong>Aviso:</strong> Você pode conectar múltiplas lojas Shopee!<br>
        Dica: Após conectar, deslogue da Shopee para vincular outra loja.<br>
        <span style="font-size:0.95em;">(A Shopee mantém a sessão ativa, então é necessário deslogar para conectar outra loja.)</span>
      </div>
      <p>Leia o aviso acima para entender como funciona a conexão Shopee/CyberDock</p>
      <button @click="connectShopee" class="action-button">Conectar</button>
    </UniversalModal>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import UniversalModal from './UniversalModal.vue';
import { useAuth } from '@/composables/useAuth';
import { API_BASE_URL } from '@/config.js';

const { loggedInUser } = useAuth();

const isModalOpen = ref(false);
const modalTitle = 'Conectar Loja Shopee';

const openModal = () => { isModalOpen.value = true; };
const closeModal = () => { isModalOpen.value = false; };

const connectShopee = () => {
  if (!loggedInUser.value?.uid) return;
  const uid = loggedInUser.value.uid;

  const apiBase = API_BASE_URL.replace(/\/$/, '');
  window.location.href = `${apiBase}/shopee/auth?uid=${encodeURIComponent(uid)}`;
};
</script>

<style scoped>
/* Mesma estrutura do botão do Mercado Livre: só o logo e o tom de foco mudam. */
.connect-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  height: 40px;
  padding: 0 0.9rem;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  color: #0f172a;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
  transition: border-color 140ms, box-shadow 140ms, background 140ms;
}
.connect-button:hover {
  border-color: #f8c6b4;
  background: #fff8f5;
  box-shadow: 0 0 0 4px rgba(238, 77, 45, 0.12);
}
.connect-button:focus-visible {
  outline: none;
  border-color: #f8c6b4;
  box-shadow: 0 0 0 4px rgba(238, 77, 45, 0.18);
}
.connect-button__logo {
  width: 20px;
  height: 20px;
  object-fit: contain;
  flex-shrink: 0;
}
.connect-button__label { white-space: nowrap; }
.connect-button__plus { color: #6b7280; flex-shrink: 0; }

.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background-color: #ee4d2d;
  color: #fff;
  padding: 0.6rem 1.15rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
  transition: background 140ms;
}
.action-button:hover { background-color: #d8401f; }
</style>
