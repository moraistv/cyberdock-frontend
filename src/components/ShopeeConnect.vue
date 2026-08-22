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
      <p v-if="connectError" class="connect-error" role="alert">{{ connectError }}</p>
      <button @click="connectShopee" class="action-button" :disabled="isConnecting">
        {{ isConnecting ? 'Abrindo Shopee...' : 'Conectar' }}
      </button>
    </UniversalModal>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import UniversalModal from './UniversalModal.vue';
import { useAuth } from '@/composables/useAuth';
import { useApi } from '@/composables/useApi';
import { API_BASE_URL } from '@/config.js';

const SHOPEE_OAUTH_ATTEMPT_KEY = 'shopeeOAuthAttempt';
const SHOPEE_OAUTH_EXPECTED_UID_KEY = 'shopeeOAuthExpectedUid';
const { loggedInUser } = useAuth();
const api = useApi();

const isModalOpen = ref(false);
const isConnecting = ref(false);
const connectError = ref('');
const modalTitle = 'Conectar Loja Shopee';

const openModal = () => {
  connectError.value = '';
  isModalOpen.value = true;
};
const closeModal = () => {
  if (isConnecting.value) return;
  isModalOpen.value = false;
};

const connectShopee = async () => {
  if (isConnecting.value) return;
  if (!loggedInUser.value?.uid) {
    connectError.value = 'Sua sessão não está pronta. Entre novamente e tente conectar.';
    return;
  }

  isConnecting.value = true;
  connectError.value = '';
  sessionStorage.removeItem(SHOPEE_OAUTH_ATTEMPT_KEY);
  sessionStorage.setItem(SHOPEE_OAUTH_EXPECTED_UID_KEY, loggedInUser.value.uid);
  try {
    const result = await api.post('/shopee/auth', {});
    if (!result?.authUrl || !result?.oauthState) {
      throw new Error('O servidor não devolveu uma autorização Shopee válida.');
    }

    // A Shopee recebe um redirect fixo e limpo. Esta aba guarda somente o
    // identificador opaco da tentativa, cuja autoridade fica no PostgreSQL.
    sessionStorage.setItem(SHOPEE_OAUTH_ATTEMPT_KEY, result.oauthState);
    window.location.assign(result.authUrl);
  } catch (error) {
    // Durante rollout, uma instância antiga pode ainda não oferecer o POST.
    // O GET legado continua funcional até todos os nós receberem o backend novo.
    if (error?.status === 404 || error?.status === 405) {
      const apiBase = API_BASE_URL.replace(/\/$/, '');
      window.location.assign(`${apiBase}/shopee/auth?uid=${encodeURIComponent(loggedInUser.value.uid)}`);
      return;
    }

    sessionStorage.removeItem(SHOPEE_OAUTH_EXPECTED_UID_KEY);
    connectError.value = error?.data?.error || error?.message || 'Não foi possível abrir a autorização da Shopee.';
    isConnecting.value = false;
  }
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
.action-button:hover:not(:disabled) { background-color: #d8401f; }
.action-button:disabled { cursor: wait; opacity: 0.7; }
.connect-error {
  margin-top: 0.75rem;
  color: #b91c1c;
  font-size: 0.875rem;
  line-height: 1.4;
}
</style>
