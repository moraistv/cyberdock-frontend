<!-- Devoluções do Mercado Livre na visão do cliente (/devolucoes): as devoluções
     das vendas dele, se a CyberDock já recebeu o pacote, o que foi conferido e o
     que voltou ao estoque. Só leitura; os dados vêm de /returns/minhas, que o
     backend prende ao usuário logado.
     É a mesma tela do master com visao="cliente". Este componente existe para
     o keep-alive (App.vue, sem key) guardar uma instância para cada visão: com
     o mesmo componente nas duas rotas, o master que abrisse as duas veria uma
     reaproveitar a outra. -->
<template>
  <MasterDevolucoesView visao="cliente" />
</template>

<script setup>
import MasterDevolucoesView from './MasterDevolucoesView.vue';
</script>
