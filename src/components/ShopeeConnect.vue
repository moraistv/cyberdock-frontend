<template>
  <div>
    <button @click="openModal" class="connect-button">Conectar Loja Shopee</button>
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
.connect-button {
  background-color: #ee4d2d;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.action-button {
  background-color: #ee4d2d;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
}
</style>
