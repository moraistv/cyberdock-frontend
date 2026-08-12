<template>
  <!--
    Rota "/" é só um portão de entrada: não tem conteúdo próprio.
    Mostra a marca enquanto o router decide o destino (dashboard ou login),
    evitando um flash de tela branca em conexões lentas.
  -->
  <div class="splash">
    <img src="@/assets/logo.png" alt="CyberDock" class="splash__logo" />
    <span class="splash__spinner" aria-hidden="true"></span>
    <p class="splash__text">Carregando...</p>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

/**
 * Decide o destino pelo token salvo. Usa a mesma checagem de expiração do
 * guard do router (router/index.js) para não divergir do resto do app.
 */
function isAuthenticated() {
  const token = localStorage.getItem('authToken');
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Boolean(payload?.exp) && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

onMounted(() => {
  router.replace(isAuthenticated() ? '/dashboard' : '/auth');
});
</script>

<style scoped>
.splash {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background-color: #f3f4f6;
  font-family: var(--font-sans);
}
.splash__logo {
  height: 52px;
  object-fit: contain;
}
.splash__spinner {
  width: 22px;
  height: 22px;
  border: 2.5px solid #d1d5db;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: splash-spin 0.7s linear infinite;
}
.splash__text {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}
@keyframes splash-spin {
  to { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .splash__spinner { animation: none; }
}
</style>
