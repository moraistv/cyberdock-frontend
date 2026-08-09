<template>
  <div>
    <button @click="openModal" class="connect-button" title="Conectar uma conta do Mercado Livre">
      <img src="/img/ml-logo.svg" alt="" class="connect-button__logo" />
      <span class="connect-button__label">Conectar conta</span>
      <svg class="connect-button__plus" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
    </button>
    <UniversalModal :title="modalTitle" :isOpen="isModalOpen" @close="closeModal">
      <div class="multi-account-info" style="margin-bottom: 1rem; background: #fffbe6; border: 1px solid #ffe066; border-radius: 8px; padding: 0.75rem; color: #7c6f00; font-size: 1rem;">
        <strong>Aviso:</strong> Você pode conectar múltiplas contas Mercado Livre!<br>
        Dica: Após conectar, deslogue do Mercado Livre para vincular outra conta.<br>
        <span style="font-size:0.95em;">(O Mercado Livre mantém a sessão ativa, então é necessário deslogar para conectar uma nova conta.)</span>
      </div>
      <p>Leia o aviso acima para entender como funcionar a conexão MercadoLivre/CyberDock</p>
      <button @click="connectMercadoLivre" class="action-button">Conectar</button>
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
const modalTitle = 'Conectar Conta Mercado Livre';

const openModal = () => { isModalOpen.value = true; };
const closeModal = () => { isModalOpen.value = false; };

const connectMercadoLivre = () => {
  if (!loggedInUser.value?.uid) return;
  const uid = loggedInUser.value.uid;

  // ❌ NÃO passar client_id nem redirect_uri aqui.
  const apiBase = API_BASE_URL.replace(/\/$/, '');
  window.location.href = `${apiBase}/ml/auth?uid=${encodeURIComponent(uid)}`;
};
</script>


<style scoped>
/*
  Botão branco com o logo da marca em vez de fundo colorido: o logo já
  identifica o marketplace, e assim os dois botões de conectar ficam
  visualmente iguais entre si (só o logo muda).
*/
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
  border-color: #f2d24b;
  background: #fffdf5;
  box-shadow: 0 0 0 4px rgba(248, 209, 53, 0.16);
}
.connect-button:focus-visible {
  outline: none;
  border-color: #f2d24b;
  box-shadow: 0 0 0 4px rgba(248, 209, 53, 0.22);
}
.connect-button__logo {
  width: 22px;
  height: 22px;
  object-fit: contain;
  border-radius: 5px;
  flex-shrink: 0;
}
.connect-button__label { white-space: nowrap; }
.connect-button__plus { color: #6b7280; flex-shrink: 0; }

.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background-color: #2b3375;
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
.action-button:hover { background-color: #222a63; }
</style>
