
<template>
  <router-view />
</template>

<script setup>
import { onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';

import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const route = useRoute();
const { isAuthReady } = useAuth();

onMounted(() => {
  // Aguarda o carregamento da autenticação
  const checkAndRedirect = () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload && payload.exp * 1000 > Date.now()) {
          // Só redireciona se estiver em / ou /auth
          const current = route?.path;
          if (current === '/' || current === '/auth') {
            router.replace('/dashboard');
          }
          // Para outras rotas protegidas, deixa o router guard lidar
        }
      }
    } catch (e) {
      // Ignora erro de decodificação do token ou acesso a propriedades nulas
      console.warn('Error in checkAndRedirect:', e);
    }
  };
  
  // Defensive check for isAuthReady
  if (isAuthReady?.value) {
    checkAndRedirect();
  } else if (isAuthReady) {
    const stop = watch(isAuthReady, (ready) => {
      if (ready) {
        checkAndRedirect();
        stop();
      }
    });
  }
});
</script>

<style>
#app {
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin: 0;
  padding: 0;
}

*{
  margin: 0;
  padding: 0;
}

#nav {
  margin: 0;
  padding: 0;
}

#nav a {
  font-weight: 600;
  color: inherit;
  text-decoration: none;
}

#nav a.router-link-exact-active {
  color: inherit;
  font-weight: 700;
}
</style>