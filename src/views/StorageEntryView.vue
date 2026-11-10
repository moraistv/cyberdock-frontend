<template>
  <!--
    Porta de entrada do Armazenamento (/armazenamento).

    A tela é a MESMA para todo mundo: cards de consumo, tabela de kits e SKUs e
    histórico de movimentações — o layout que o master já via ao abrir um
    cliente. O que muda por papel é só o que se pode fazer:

      master  → cadastra, ajusta e exclui;
      cliente → consulta: mesmos filtros, mesma busca, mesma hierarquia de kits.

    O menu e a barra do topo são montados AQUI, como em toda tela do sistema.
    O `UserStorageView` é conteúdo de aba (nasce dentro do painel de usuários) e
    não traz shell próprio: sem este bloco a página abria sem menu nenhum.
  -->
  <div class="dashboard-wrapper">
    <SidebarComponent />

    <div class="main-content">
      <TopbarComponent />

      <div class="dashboard-content">
        <UserStorageView
          v-if="userId"
          :user-id="userId"
          :can-edit="podeAlterar"
        />

        <div v-else class="carregando" role="status">Carregando armazenamento…</div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, defineComponent } from 'vue'
import { useAuth } from '@/composables/useAuth'
import SidebarComponent from '@/components/SidebarComponent.vue'
import TopbarComponent from '@/components/TopbarComponent.vue'
import UserStorageView from './UserStorageView.vue'

export default defineComponent({
  name: 'StorageEntryView',
  components: { SidebarComponent, TopbarComponent, UserStorageView },
  setup() {
    const { user, userRole } = useAuth()

    const userId = computed(() => user.value?.uid || null)

    /* Antes de a sessão carregar o papel vale 'usuario': a tela começa somente
     * leitura, que é o estado seguro. */
    const podeAlterar = computed(() => userRole.value === 'master')

    return { userId, podeAlterar }
  }
})
</script>

<style scoped>
/* Mesma casca das outras telas do sistema: sidebar fixa à esquerda, conteúdo
 * ocupando o resto. `min-height: 100vh` mantém o fundo cinza até o rodapé
 * mesmo quando a tabela é curta. */
.dashboard-wrapper {
  display: flex;
  min-height: 100vh;
  font-family: var(--font-sans);
  background-color: #f3f4f6;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.dashboard-content {
  flex: 1;
  padding: 2rem;
}

.carregando {
  padding: 4rem 1rem;
  text-align: center;
  color: #6b7280;
}

@media (max-width: 760px) {
  .dashboard-content { padding: 1rem; }
}
</style>
