<template>
  <!--
    Porta de entrada do Armazenamento (/armazenamento).

    A tela é a MESMA para todo mundo: cards de consumo, tabela de kits e SKUs e
    histórico de movimentações — o layout que o master já via ao abrir um
    cliente. O que muda por papel é só o que se pode fazer:

      master  → cadastra, ajusta e exclui;
      cliente → consulta: mesmos filtros, mesma busca, mesma hierarquia de kits.

    Antes o cliente caía em outra tela, com os mesmos dados dentro de um modal e
    duas tabelas repetindo a mesma informação — daí a diferença que ele via.
  -->
  <UserStorageView
    v-if="userId"
    :user-id="userId"
    :can-edit="podeAlterar"
  />

  <div v-else class="carregando" role="status">Carregando armazenamento…</div>
</template>

<script>
import { computed, defineComponent } from 'vue'
import { useAuth } from '@/composables/useAuth'
import UserStorageView from './UserStorageView.vue'

export default defineComponent({
  name: 'StorageEntryView',
  components: { UserStorageView },
  setup() {
    const { user, userRole } = useAuth()

    /* O master informa `?cliente=` para abrir o estoque de alguém; sem isso ele
     * vê o próprio. O cliente sempre vê o dele — o backend recusa outro uid. */
    const userId = computed(() => user.value?.uid || null)

    /* Antes de a sessão carregar o papel vale 'usuario': a tela começa somente
     * leitura, que é o estado seguro. */
    const podeAlterar = computed(() => userRole.value === 'master')

    return { userId, podeAlterar }
  }
})
</script>

<style scoped>
.carregando {
  padding: 4rem 1rem;
  text-align: center;
  color: #6b7280;
}
</style>
