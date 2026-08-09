<template>
  <!--
    Página de retorno da autorização da Shopee.
    A Shopee exige que o domínio do redirect seja o mesmo declarado no console
    do parceiro (cyberdock.com.br), por isso o retorno cai aqui, no frontend,
    e não direto na API. Esta tela apenas repassa `code` + `shop_id` para o
    backend, que faz a troca pelos tokens, e então volta para /contas.
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

const route = useRoute();
const router = useRouter();
const api = useApi();

const state = ref('loading');
const message = ref('');

onMounted(async () => {
  const code = route.query.code;
  const shopId = route.query.shop_id || route.query.shopid;

  if (!code || !shopId) {
    state.value = 'error';
    message.value = 'A Shopee não retornou os dados da autorização. Tente conectar novamente.';
    return;
  }

  try {
    const result = await api.post('/shopee/connect', { code, shopId });
    // Reaproveita o aviso que a tela de Contas já sabe exibir via query string.
    const success = result?.message || 'Loja Shopee conectada com sucesso!';
    router.replace({ path: '/contas', query: { success } });
  } catch (err) {
    state.value = 'error';
    message.value = err?.data?.error || err?.message || 'Erro desconhecido ao conectar a loja.';
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
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
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
