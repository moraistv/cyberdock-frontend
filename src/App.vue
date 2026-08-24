
<template>
  <!--
    As telas ficam em memória depois da primeira visita.

    Cada view monta o próprio Sidebar e Topbar, então sem isto toda troca de
    página destruía e recriava o menu, a barra do topo e as animações, além de
    refazer as consultas do onMounted. Com keep-alive, voltar a uma tela já
    aberta é imediato e o menu não pisca.

    `max` limita o consumo de memória; telas mais antigas que o limite são
    descartadas normalmente. As rotas de login e callback ficam fora: precisam
    rodar o ciclo de vida limpo a cada visita.
  -->
  <router-view v-slot="{ Component, route: current }">
    <!-- Sem `key`: rotas que usam o MESMO componente (a lista de usuários e a
         aba de um cliente, por exemplo) reaproveitam a instância, e o próprio
         componente reage à mudança de parâmetro. Uma key por rota recriaria a
         tela a cada navegação e anularia o ganho. -->
    <keep-alive v-if="!current.meta.noCache" :max="6">
      <component :is="Component" />
    </keep-alive>
    <component v-else :is="Component" />
  </router-view>

  <!--
    Notificação e confirmação vivem AQUI, uma única vez.

    Antes o ToastComponent só era montado na tela de login, então todo aviso
    disparado pelas telas de SKU, estoque, kits e cobrança era descartado em
    silêncio, inclusive os erros. E a confirmação de exclusão usava o confirm()
    do navegador, que travava a aba e ignorava o visual do sistema.
  -->
  <ToastComponent />
  <ConfirmDialog />
</template>

<script setup>
import { onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';

import ToastComponent from '@/components/ToastComponent.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';

import { useAuth } from '@/composables/useAuth';
import { homeRouteFromStorage } from '@/utils/homeRoute';

// Quais telas ficam fora do cache é decidido por `meta.noCache` na definição
// da rota (src/router/index.js), e não por uma lista de nomes aqui: com
// <script setup> o nome do componente é inferido do arquivo, o que quebraria em
// silêncio se algum arquivo fosse renomeado.

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
            router.replace(homeRouteFromStorage());
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