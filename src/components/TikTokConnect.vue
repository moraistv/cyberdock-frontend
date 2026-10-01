<template>
  <div>
    <button
      type="button"
      @click="openModal"
      class="connect-button"
      title="Conectar uma loja TikTok Shop"
      aria-label="Conectar uma loja TikTok Shop"
    >
      <span class="connect-button__badge" aria-hidden="true">
        <img src="/img/tiktok-logo.svg" alt="" class="connect-button__logo" />
      </span>
      <span class="connect-button__label">Conectar TikTok</span>
      <svg class="connect-button__plus" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
    </button>
    <UniversalModal :title="modalTitle" :isOpen="isModalOpen" @close="closeModal">
      <div class="connect-info">
        <strong>Como funciona:</strong> você entra no Seller Center do TikTok Shop e autoriza o CyberDock.
        Todas as lojas liberadas nessa autorização são conectadas de uma vez.<br>
        <span class="connect-info__hint">
          Para conectar a loja de outra conta, saia do TikTok Shop antes de autorizar de novo.
        </span>
      </div>
      <p class="connect-text">
        Depois de conectar, as vendas da loja entram na fila de separação e as etiquetas do
        TikTok podem ser impressas por aqui, com o SKU e a quantidade estampados.
      </p>
      <p v-if="connectError" class="connect-error" role="alert">{{ connectError }}</p>
      <button type="button" @click="connectTikTok" class="action-button" :disabled="isConnecting">
        {{ isConnecting ? 'Abrindo TikTok Shop...' : 'Conectar' }}
      </button>
    </UniversalModal>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import UniversalModal from './UniversalModal.vue';
import { useAuth } from '@/composables/useAuth';
import { useApi } from '@/composables/useApi';

const TIKTOK_OAUTH_ATTEMPT_KEY = 'tiktokOAuthAttempt';
const TIKTOK_OAUTH_EXPECTED_UID_KEY = 'tiktokOAuthExpectedUid';
const { loggedInUser } = useAuth();
const api = useApi();

/* localStorage, como na Shopee: o retorno do TikTok pode abrir outra aba. O
 * valor é opaco, de uso único e validado no servidor. O próprio TikTok devolve
 * a tentativa no `state` do retorno, e o backend guarda uma cópia em cookie. */
const rememberAttempt = (state, uid) => {
  try {
    localStorage.setItem(TIKTOK_OAUTH_ATTEMPT_KEY, state);
    localStorage.setItem(TIKTOK_OAUTH_EXPECTED_UID_KEY, uid);
  } catch {
    // Modo privado pode recusar escrita; o state e o cookie cobrem esse caso.
  }
};

const forgetAttempt = () => {
  try {
    localStorage.removeItem(TIKTOK_OAUTH_ATTEMPT_KEY);
    localStorage.removeItem(TIKTOK_OAUTH_EXPECTED_UID_KEY);
  } catch { /* nada a limpar */ }
};

const isModalOpen = ref(false);
const isConnecting = ref(false);
const connectError = ref('');
const modalTitle = 'Conectar loja TikTok Shop';

const openModal = () => {
  connectError.value = '';
  isModalOpen.value = true;
};
const closeModal = () => {
  if (isConnecting.value) return;
  isModalOpen.value = false;
};

const connectTikTok = async () => {
  if (isConnecting.value) return;
  if (!loggedInUser.value?.uid) {
    connectError.value = 'Sua sessão não está pronta. Entre novamente e tente conectar.';
    return;
  }

  isConnecting.value = true;
  connectError.value = '';
  forgetAttempt();
  try {
    // `credentials: 'include'` para o navegador aceitar o cookie da tentativa.
    const result = await api.post('/tiktok/auth', {}, { credentials: 'include' });
    if (!result?.authUrl || !result?.oauthState) {
      throw new Error('O servidor não devolveu uma autorização TikTok Shop válida.');
    }
    rememberAttempt(result.oauthState, loggedInUser.value.uid);
    window.location.assign(result.authUrl);
  } catch (error) {
    forgetAttempt();
    if (error?.status === 503) {
      connectError.value = 'A integração TikTok Shop ainda não está configurada no servidor. Fale com o suporte da CyberDock.';
    } else if (error?.status === 404) {
      connectError.value = 'A integração TikTok Shop ainda não está disponível neste servidor.';
    } else {
      connectError.value = error?.data?.error || error?.message || 'Não foi possível abrir a autorização do TikTok Shop.';
    }
    isConnecting.value = false;
  }
};
</script>

<style scoped>
/* Mesma estrutura dos botões do Mercado Livre e da Shopee. A marca do TikTok é
 * preta, então ganha um fundo claro próprio para não sumir no tema. */
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
  border-color: #d1d5db;
  background: #f9fafb;
  box-shadow: 0 0 0 4px rgba(17, 24, 39, 0.08);
}
.connect-button:focus-visible {
  outline: none;
  border-color: #9ca3af;
  box-shadow: 0 0 0 4px rgba(236, 43, 137, 0.18);
}
.connect-button__badge {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: #ffffff;
  flex-shrink: 0;
}
.connect-button__logo {
  width: 20px;
  height: 20px;
  object-fit: contain;
}
.connect-button__label { white-space: nowrap; }
.connect-button__plus { color: #6b7280; flex-shrink: 0; }

.connect-info {
  margin-bottom: 1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-left: 3px solid #ec2b89;
  border-radius: 8px;
  padding: 0.75rem;
  color: #111827;
  font-size: 0.95rem;
  line-height: 1.5;
}
.connect-info__hint { font-size: 0.9em; color: #4b5563; }
.connect-text { color: #374151; line-height: 1.5; }

.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background-color: #111827;
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
.action-button:hover:not(:disabled) { background-color: #000000; }
.action-button:focus-visible { outline: 2px solid #ec2b89; outline-offset: 2px; }
.action-button:disabled { cursor: wait; opacity: 0.7; }
.connect-error {
  margin-top: 0.75rem;
  color: #b91c1c;
  font-size: 0.875rem;
  line-height: 1.4;
}
</style>
