<template>
  <!--
    Página de retorno da autorização da Shopee.
    A Shopee exige que o domínio do redirect seja o mesmo declarado no console
    do parceiro (cyberdock.com.br), por isso o retorno cai aqui, no frontend,
    e não direto na API. Esta tela repassa `code` + `shop_id` junto da tentativa
    opaca criada no início; o backend a consome uma vez, troca os tokens,
    confirma a gravação e então volta para /contas.
  -->
  <div class="callback">
    <img src="/img/shopee-logo.svg" alt="Shopee" class="callback__logo" />

    <template v-if="state === 'loading'">
      <span class="callback__spinner" aria-hidden="true"></span>
      <h1 class="callback__title">Conectando sua loja Shopee...</h1>
      <p class="callback__text">Isso leva apenas alguns segundos.</p>
    </template>

    <template v-else-if="state === 'error'">
      <span class="callback__icon callback__icon--error" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </span>
      <h1 class="callback__title">Não foi possível conectar</h1>
      <p class="callback__text">{{ message }}</p>
      <router-link to="/contas" class="callback__btn">Voltar para Contas</router-link>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApi } from '@/composables/useApi';
import { useAuth } from '@/composables/useAuth';

const SHOPEE_OAUTH_ATTEMPT_KEY = 'shopeeOAuthAttempt';
const SHOPEE_OAUTH_EXPECTED_UID_KEY = 'shopeeOAuthExpectedUid';
const route = useRoute();
const router = useRouter();
const api = useApi();
const { loggedInUser, fetchShopeeAccounts } = useAuth();

const state = ref('loading');
const message = ref('');

const firstQueryValue = (value) => Array.isArray(value) ? value[0] : value;

const redirectToLogin = (target) => {
  // Um JWT pode parecer não expirado para o router e ainda ser recusado pelo
  // backend (segredo rotacionado, sessão inválida etc.). Removê-lo antes de
  // abrir /auth evita o loop /auth -> /dashboard que perdia o callback.
  localStorage.removeItem('authToken');
  const authLocation = router.resolve({ path: '/auth', query: { redirect: target } });
  window.location.replace(authLocation.href);
};

onMounted(async () => {
  const code = firstQueryValue(route.query.code);
  const shopId = firstQueryValue(route.query.shop_id || route.query.shopid);
  const oauthState = sessionStorage.getItem(SHOPEE_OAUTH_ATTEMPT_KEY);
  const expectedUid = sessionStorage.getItem(SHOPEE_OAUTH_EXPECTED_UID_KEY);

  if (!code || !shopId) {
    sessionStorage.removeItem(SHOPEE_OAUTH_ATTEMPT_KEY);
    sessionStorage.removeItem(SHOPEE_OAUTH_EXPECTED_UID_KEY);
    state.value = 'error';
    message.value = 'A Shopee não retornou os dados da autorização. Tente conectar novamente.';
    return;
  }

  // O fallback de rollout para GET /auth não cria uma tentativa no banco. Ele
  // só é seguro se a sessão atual ainda for exatamente a que iniciou o OAuth;
  // valide antes de enviar o code, pois depois da troca a loja já estaria
  // persistida sob o usuário errado.
  if (!oauthState) {
    if (!expectedUid) {
      state.value = 'error';
      message.value = 'Esta autorização não está vinculada a uma sessão CyberDock. Volte para Contas e conecte novamente.';
      return;
    }
    if (loggedInUser.value?.uid !== expectedUid) {
      redirectToLogin(route.fullPath);
      return;
    }
  }

  try {
    const result = await api.post('/shopee/connect', { code, shopId, oauthState });
    sessionStorage.removeItem(SHOPEE_OAUTH_ATTEMPT_KEY);

    if (expectedUid && result?.ownerUid && expectedUid !== result.ownerUid) {
      sessionStorage.removeItem(SHOPEE_OAUTH_EXPECTED_UID_KEY);
      state.value = 'error';
      message.value = 'A loja foi vinculada a outra sessão. Entre com o usuário que iniciou a conexão.';
      return;
    }
    if (result?.ownerUid) {
      sessionStorage.setItem(SHOPEE_OAUTH_EXPECTED_UID_KEY, result.ownerUid);
    }

    const success = result?.message || 'Loja Shopee conectada com sucesso!';
    const accountsTarget = router.resolve({ path: '/contas', query: { success } }).fullPath;

    // A tentativa persistida permite gravar mesmo quando o JWT venceu durante
    // a autorização. Nesse caso, a conta já está salva; pedimos login apenas
    // para abrir a tela de Contas com uma sessão nova.
    if (result?.sessionValid === false) {
      redirectToLogin(accountsTarget);
      return;
    }

    sessionStorage.removeItem(SHOPEE_OAUTH_EXPECTED_UID_KEY);
    // Invalida a lista compartilhada antes de voltar. ContasView também força
    // nova leitura ao ser reativada, cobrindo telas mantidas em keep-alive.
    await fetchShopeeAccounts(true);
    await router.replace({ path: '/contas', query: { success } });
  } catch (err) {
    // O connect rejeita 401/403 antes de trocar o code. Depois de limpar o JWT,
    // o login retoma esta URL completa e tenta novamente sem perder o retorno.
    if (err?.status === 401 || err?.status === 403) {
      redirectToLogin(route.fullPath);
      return;
    }

    if (err?.status === 400 || err?.data?.restartRequired) {
      sessionStorage.removeItem(SHOPEE_OAUTH_ATTEMPT_KEY);
      sessionStorage.removeItem(SHOPEE_OAUTH_EXPECTED_UID_KEY);
    }
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
.callback__logo {
  width: 46px;
  height: 46px;
  object-fit: contain;
  margin-bottom: 0.25rem;
}
.callback__spinner {
  width: 22px;
  height: 22px;
  border: 2.5px solid #e5e7eb;
  border-top-color: #ee4d2d;
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
  max-width: 420px;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #6b7280;
}
.callback__btn {
  margin-top: 0.6rem;
  display: inline-flex;
  align-items: center;
  height: 40px;
  padding: 0 1.1rem;
  border-radius: 10px;
  background: #ee4d2d;
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  transition: background 140ms;
}
.callback__btn:hover { background: #d8401f; }
@keyframes callback-spin {
  to { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .callback__spinner { animation: none; }
}
</style>
