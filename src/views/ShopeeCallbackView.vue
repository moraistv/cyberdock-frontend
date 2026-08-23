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
import { API_BASE_URL } from '@/config.js';

const SHOPEE_OAUTH_ATTEMPT_KEY = 'shopeeOAuthAttempt';
const SHOPEE_OAUTH_EXPECTED_UID_KEY = 'shopeeOAuthExpectedUid';
const route = useRoute();
const router = useRouter();
const api = useApi();
const { fetchShopeeAccounts } = useAuth();

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

const readStoredAttempt = (key) => {
  try {
    // sessionStorage continua sendo lido para não perder uma conexão iniciada
    // antes desta versão, quando a tentativa ficava só na aba.
    return localStorage.getItem(key) || sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const clearStoredAttempt = () => {
  for (const key of [SHOPEE_OAUTH_ATTEMPT_KEY, SHOPEE_OAUTH_EXPECTED_UID_KEY]) {
    try { localStorage.removeItem(key); } catch { /* indisponível */ }
    try { sessionStorage.removeItem(key); } catch { /* indisponível */ }
  }
};

/**
 * Entrega a conclusão ao backend por navegação comum.
 *
 * É a rede de segurança para quando esta página não consegue concluir: o
 * backend reencontra a tentativa pelo cookie (ou pelo state na URL), grava a
 * conta e devolve o resultado em /contas. Sem isso, qualquer falha aqui deixava
 * a loja autorizada na Shopee e ausente no sistema.
 */
const handOffToBackend = (code, shopId, oauthState) => {
  const apiBase = API_BASE_URL.replace(/\/$/, '');
  const target = new URL(`${apiBase}/shopee/callback`);
  target.searchParams.set('code', code);
  target.searchParams.set('shop_id', shopId);
  if (oauthState) target.searchParams.set('state', oauthState);
  window.location.replace(target.toString());
};

onMounted(async () => {
  const code = firstQueryValue(route.query.code);
  const shopId = firstQueryValue(route.query.shop_id || route.query.shopid);
  const oauthState = readStoredAttempt(SHOPEE_OAUTH_ATTEMPT_KEY);
  const expectedUid = readStoredAttempt(SHOPEE_OAUTH_EXPECTED_UID_KEY);
  // O backend marca o retorno que ele já devolveu para cá; sem esta marca os
  // dois lados poderiam ficar se empurrando o mesmo callback.
  const alreadyHandedOff = firstQueryValue(route.query.handoff) === '1';

  if (!code || !shopId) {
    clearStoredAttempt();
    state.value = 'error';
    message.value = 'A Shopee não retornou os dados da autorização. Tente conectar novamente.';
    return;
  }

  try {
    const result = await api.post(
      '/shopee/connect',
      { code, shopId, oauthState },
      { credentials: 'include' }
    );
    clearStoredAttempt();

    if (expectedUid && result?.ownerUid && expectedUid !== result.ownerUid) {
      state.value = 'error';
      message.value = 'A loja foi vinculada a outra sessão. Entre com o usuário que iniciou a conexão.';
      return;
    }
    // Guarda o dono confirmado pelo servidor: é o que valida o login seguinte
    // quando a sessão venceu durante a autorização.
    if (result?.ownerUid) {
      try { localStorage.setItem(SHOPEE_OAUTH_EXPECTED_UID_KEY, result.ownerUid); } catch { /* indisponível */ }
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

    clearStoredAttempt();
    // Invalida a lista compartilhada antes de voltar. ContasView também força
    // nova leitura ao ser reativada, cobrindo telas mantidas em keep-alive.
    await fetchShopeeAccounts(true);
    await router.replace({ path: '/contas', query: { success } });
  } catch (err) {
    const status = err?.status;

    /* Antes de desistir, deixa o backend concluir.
     *
     * Falha de rede, sessão recusada ou erro interno aqui não significam que a
     * autorização foi perdida: o backend tem a tentativa (cookie ou state) e
     * consegue gravar a conta sozinho. Só não insistimos se este retorno já
     * veio de lá, para não ficar em vaivém. */
    if (!alreadyHandedOff && (!status || status === 401 || status === 403 || status >= 500)) {
      handOffToBackend(code, shopId, oauthState);
      return;
    }

    // Sem tentativa e com sessão recusada, o login retoma esta URL completa.
    if (status === 401 || status === 403) {
      redirectToLogin(route.fullPath);
      return;
    }

    if (status === 400 || err?.data?.restartRequired) {
      clearStoredAttempt();
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
