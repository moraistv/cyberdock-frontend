<template>
  <!--
    Página de retorno da autorização do TikTok Shop.
    O TikTok devolve `code` e `state` na URL de retorno cadastrada no app. O
    `state` é a tentativa opaca criada no início; o backend a consome uma vez,
    troca os tokens, descobre as lojas autorizadas e então volta para /contas.
  -->
  <main class="callback" aria-live="polite">
    <span class="callback__badge">
      <img src="/img/tiktok-logo.svg" alt="TikTok Shop" class="callback__logo" />
    </span>

    <template v-if="state === 'loading'">
      <span class="callback__spinner" aria-hidden="true"></span>
      <h1 class="callback__title">Conectando sua loja TikTok Shop...</h1>
      <p class="callback__text">Isso leva apenas alguns segundos.</p>
    </template>

    <template v-else-if="state === 'error'">
      <span class="callback__icon callback__icon--error" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </span>
      <h1 class="callback__title">Não foi possível conectar</h1>
      <p class="callback__text" role="alert">{{ message }}</p>
      <router-link to="/contas" class="callback__btn">Voltar para Contas</router-link>
    </template>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApi } from '@/composables/useApi';
import { useAuth } from '@/composables/useAuth';
import { API_BASE_URL } from '@/config.js';

const TIKTOK_OAUTH_ATTEMPT_KEY = 'tiktokOAuthAttempt';
const TIKTOK_OAUTH_EXPECTED_UID_KEY = 'tiktokOAuthExpectedUid';
const route = useRoute();
const router = useRouter();
const api = useApi();
const { fetchTikTokAccounts } = useAuth();

const state = ref('loading');
const message = ref('');

const firstQueryValue = (value) => (Array.isArray(value) ? value[0] : value);

const redirectToLogin = (target) => {
  // Um JWT pode parecer válido para o router e ser recusado pelo backend.
  // Removê-lo antes de abrir /auth evita o laço /auth -> /dashboard.
  localStorage.removeItem('authToken');
  const authLocation = router.resolve({ path: '/auth', query: { redirect: target } });
  window.location.replace(authLocation.href);
};

const readStoredAttempt = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const clearStoredAttempt = () => {
  for (const key of [TIKTOK_OAUTH_ATTEMPT_KEY, TIKTOK_OAUTH_EXPECTED_UID_KEY]) {
    try { localStorage.removeItem(key); } catch { /* indisponível */ }
  }
};

/**
 * Entrega a conclusão ao backend por navegação comum: ele reencontra a
 * tentativa pelo `state` (ou pelo cookie), grava a loja e devolve o resultado
 * em /contas. É a rede de segurança para quando esta página não consegue
 * concluir sozinha.
 */
const handOffToBackend = (code, oauthState) => {
  const apiBase = API_BASE_URL.replace(/\/$/, '');
  const target = new URL(`${apiBase}/tiktok/callback`);
  target.searchParams.set('code', code);
  if (oauthState) target.searchParams.set('state', oauthState);
  window.location.replace(target.toString());
};

onMounted(async () => {
  const code = firstQueryValue(route.query.code || route.query.auth_code);
  // O `state` do retorno é a tentativa; a cópia local cobre o retorno sem ele.
  const oauthState = firstQueryValue(route.query.state) || readStoredAttempt(TIKTOK_OAUTH_ATTEMPT_KEY);
  const expectedUid = readStoredAttempt(TIKTOK_OAUTH_EXPECTED_UID_KEY);
  const alreadyHandedOff = firstQueryValue(route.query.handoff) === '1';

  if (!code) {
    clearStoredAttempt();
    state.value = 'error';
    message.value = 'O TikTok Shop não retornou os dados da autorização. Tente conectar novamente.';
    return;
  }

  try {
    const result = await api.post(
      '/tiktok/connect',
      { code, oauthState },
      { credentials: 'include' }
    );

    if (expectedUid && result?.ownerUid && expectedUid !== result.ownerUid) {
      clearStoredAttempt();
      state.value = 'error';
      message.value = 'A loja foi vinculada a outra sessão. Entre com o usuário que iniciou a conexão.';
      return;
    }

    const success = result?.message || 'Loja TikTok Shop conectada com sucesso!';
    const accountsTarget = router.resolve({ path: '/contas', query: { success } }).fullPath;

    // A tentativa permite gravar mesmo com o JWT vencido durante a
    // autorização. A loja já está salva; o login só abre /contas de novo.
    if (result?.sessionValid === false) {
      clearStoredAttempt();
      if (result?.ownerUid) {
        try { localStorage.setItem(TIKTOK_OAUTH_EXPECTED_UID_KEY, result.ownerUid); } catch { /* indisponível */ }
      }
      redirectToLogin(accountsTarget);
      return;
    }

    clearStoredAttempt();
    await fetchTikTokAccounts(true);
    await router.replace({ path: '/contas', query: { success } });
  } catch (err) {
    const status = err?.status;

    // Resposta estruturada com restartRequired significa que o servidor JÁ
    // consumiu o código. Repassá-lo ao callback backend só trocaria o erro real
    // por "código inválido". Mostra o diagnóstico e exige nova autorização.
    if (err?.data?.restartRequired) {
      clearStoredAttempt();
      state.value = 'error';
      const detail = err.data.error || 'A autorização precisa ser iniciada novamente.';
      const reference = err.data.requestId ? ` Referência: ${err.data.requestId}.` : '';
      message.value = `${detail}${reference}`;
      return;
    }

    // Handoff apenas quando o resultado da primeira chamada é desconhecido
    // (falha de rede/CORS, ou 5xx sem JSON do backend).
    if (!alreadyHandedOff && (!status || (status >= 500 && !err?.data?.error))) {
      handOffToBackend(code, oauthState);
      return;
    }

    if (status === 401 || status === 403) {
      // Sessão de outro usuário: o login retoma esta mesma URL.
      redirectToLogin(route.fullPath);
      return;
    }

    if (status === 400 || err?.data?.restartRequired) clearStoredAttempt();
    state.value = 'error';
    const detail = err?.data?.error || err?.message || 'Erro desconhecido ao conectar a loja.';
    const reference = err?.data?.requestId ? ` Referência: ${err.data.requestId}.` : '';
    message.value = `${detail}${reference}`;
  }
});
</script>

<style scoped>
.callback {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.9rem;
  padding: 2rem;
  text-align: center;
  background-color: #f3f4f6;
  font-family: var(--font-sans);
  color: #0f172a;
}
.callback__badge {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  margin-bottom: 0.25rem;
}
.callback__logo {
  width: 42px;
  height: 42px;
  object-fit: contain;
}
.callback__spinner {
  width: 22px;
  height: 22px;
  border: 2.5px solid #e5e7eb;
  border-top-color: #ec2b89;
  border-radius: 50%;
  animation: callback-spin 0.7s linear infinite;
}
.callback__icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
}
.callback__icon--error { background: #fef2f2; color: #b91c1c; }
.callback__title { margin: 0; font-size: 1.1rem; font-weight: 700; }
.callback__text {
  margin: 0;
  max-width: 440px;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #4b5563;
}
.callback__btn {
  margin-top: 0.6rem;
  display: inline-flex;
  align-items: center;
  height: 40px;
  padding: 0 1.1rem;
  border-radius: 10px;
  background: #111827;
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  transition: background 140ms;
}
.callback__btn:hover { background: #000000; }
.callback__btn:focus-visible { outline: 2px solid #ec2b89; outline-offset: 2px; }
@keyframes callback-spin {
  to { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .callback__spinner { animation: none; }
}
</style>
