<!-- Devoluções do Mercado Livre (master).
     Todas as devoluções das contas do ML conectadas, da abertura no ML até a
     análise no CD: o pacote chegou? o produto está apto? então volta ao
     estoque do cliente. Os dados vêm da API do ML (o backend busca sozinho a
     cada 30 minutos e pelo botão "Sincronizar"); a análise e a entrada no
     estoque acontecem no backend (utils/mlReturns.js).
     Tela larga: lista e detalhes lado a lado. Tela estreita: os detalhes abrem
     numa gaveta por cima. A lista não tem rolagem própria, só a da página. -->
<template>
  <div class="dev-wrapper">
    <SidebarComponent />
    <div class="main-content">
      <TopbarComponent />
      <div class="content-area">
        <!-- ================= CABEÇALHO ================= -->
        <header class="page-header">
          <div class="page-header__text">
            <div class="title-row">
              <h1 class="title">Devoluções</h1>
              <span class="ml-chip">
                <img src="/img/ml-logo.svg" alt="" width="18" height="18" />
                Mercado Livre
              </span>
            </div>
            <p class="subtitle">Acompanhe cada devolução até chegar ao CD, confira o produto e devolva ao estoque o que estiver apto.</p>
          </div>
          <div class="sync">
            <button
              type="button"
              class="btn btn-primary btn-with-icon"
              :disabled="sincronizando || pedindoSync"
              @click="sincronizarAgora"
            >
              <IconeSvg nome="atualizar" :class="{ 'is-spinning': sincronizando || pedindoSync }" />
              {{ textoDoBotaoDeSync }}
            </button>
            <span class="sync__quando" title="O sistema também busca as devoluções sozinho a cada 30 minutos">
              Última atualização: {{ ultimaAtualizacao }}
            </span>
          </div>
        </header>

        <!-- ================= NÚMEROS DO PERÍODO ================= -->
        <section class="kpis" aria-label="Números do período">
          <div class="kpis__grade">
            <button
              v-for="cartao in cartoes"
              :key="cartao.id"
              type="button"
              class="kpi"
              :class="[`is-${cartao.cor}`, { 'is-ativo': cartaoAtivo === cartao.id }]"
              :aria-pressed="cartaoAtivo === cartao.id ? 'true' : 'false'"
              :title="cartao.titulo"
              @click="filtrarPeloCartao(cartao)"
            >
              <span class="kpi__icone"><IconeSvg :nome="cartao.icone" :tamanho="20" /></span>
              <span class="kpi__texto">
                <span class="kpi__rotulo">{{ cartao.rotulo }}</span>
                <span class="kpi__linha">
                  <span v-if="!carregouUmaVez" class="sk sk-numero" />
                  <strong v-else class="kpi__numero">{{ cartao.numero }}</strong>
                  <span
                    v-if="cartao.tendencia"
                    class="kpi__tendencia"
                    :class="classeDaTendencia(cartao.tendencia)"
                  >
                    <IconeSvg :nome="cartao.tendencia.valor < 0 ? 'tendenciaBaixa' : 'tendencia'" :tamanho="12" />
                    {{ cartao.tendencia.texto }}
                  </span>
                </span>
                <span class="kpi__dica">{{ cartao.dica }}</span>
              </span>
            </button>
          </div>

          <p v-if="carregouUmaVez && kpis" class="kpis__rodape">
            <span class="kpis__item">
              <IconeSvg nome="relogio" :tamanho="14" />
              Tempo médio entre a chegada e a análise:
              <strong>{{ formatarDuracaoEmHoras(kpis.horasMediasDeAnalise) || 'ainda sem análise no período' }}</strong>
            </span>
            <span class="kpis__item">
              Unidades analisadas:
              <strong>{{ kpis.unidadesAptas }}</strong> {{ kpis.unidadesAptas === 1 ? 'apta' : 'aptas' }} ·
              <strong>{{ kpis.unidadesNaoAptas }}</strong> {{ kpis.unidadesNaoAptas === 1 ? 'não apta' : 'não aptas' }}
            </span>
            <button v-if="kpis.canceladas" type="button" class="link-btn" @click="definirFiltros({ situacao: 'cancelada', resultado: '' })">
              {{ kpis.canceladas }} {{ kpis.canceladas === 1 ? 'cancelada' : 'canceladas' }}
            </button>
            <button v-if="kpis.noMl" type="button" class="link-btn" @click="definirFiltros({ situacao: 'no_ml', resultado: '' })">
              {{ kpis.noMl }} {{ kpis.noMl === 1 ? 'foi' : 'foram' }} para o depósito do ML (Full)
            </button>
          </p>
        </section>

        <!-- ================= FILTROS ================= -->
        <section class="filtros" aria-label="Filtros da lista">
          <div class="busca">
            <IconeSvg nome="busca" class="busca__icone" />
            <label class="sr-only" for="dev-busca">Buscar por pedido, SKU ou cliente</label>
            <input
              id="dev-busca"
              v-model="filtros.busca"
              type="search"
              class="busca__campo"
              placeholder="Buscar por pedido, SKU, cliente..."
              autocomplete="off"
              maxlength="120"
              @input="buscarComAtraso"
              @keydown.enter.prevent="aplicarFiltros"
            />
            <button v-if="filtros.busca" type="button" class="busca__limpar" aria-label="Limpar a busca" @click="limparBusca">
              <IconeSvg nome="fechar" :tamanho="12" />
            </button>
          </div>

          <label class="seletor com-icone">
            <IconeSvg nome="calendario" class="seletor__icone" />
            <span class="sr-only">Período</span>
            <select v-model="filtros.periodo" @change="aplicarFiltros">
              <option v-for="opcao in OPCOES_DE_PERIODO" :key="opcao.valor" :value="opcao.valor">{{ opcao.rotulo }}</option>
            </select>
          </label>
          <label class="seletor">
            <span class="sr-only">Status</span>
            <select v-model="filtros.situacao" @change="aplicarFiltros">
              <option v-for="opcao in OPCOES_DE_SITUACAO" :key="opcao.valor" :value="opcao.valor">{{ opcao.rotulo }}</option>
            </select>
          </label>
          <label class="seletor">
            <span class="sr-only">Resultado</span>
            <select v-model="filtros.resultado" @change="aplicarFiltros">
              <option v-for="opcao in OPCOES_DE_RESULTADO" :key="opcao.valor" :value="opcao.valor">{{ opcao.rotulo }}</option>
            </select>
          </label>

          <button
            type="button"
            class="btn btn-secondary btn-with-icon"
            :class="{ 'is-ligado': avancados }"
            :aria-expanded="avancados ? 'true' : 'false'"
            aria-controls="dev-filtros-avancados"
            @click="avancados = !avancados"
          >
            <IconeSvg nome="filtro" />
            Filtros avançados
            <span v-if="avancadosAtivos" class="contador">{{ avancadosAtivos }}</span>
          </button>
          <button type="button" class="btn btn-secondary btn-with-icon" :disabled="!filtrosAtivos" @click="limparFiltros">
            <IconeSvg nome="desfazer" />
            Limpar
          </button>
        </section>

        <div v-show="avancados" id="dev-filtros-avancados" class="filtros-avancados">
          <label class="campo-filtro">
            <span>Cliente</span>
            <select v-model="filtros.cliente" @change="aplicarFiltros">
              <option value="">Todos os clientes</option>
              <option v-for="opcao in facetas.clientes" :key="opcao.valor" :value="opcao.valor">{{ opcao.rotulo }}</option>
            </select>
          </label>
          <label class="campo-filtro">
            <span>Conta do Mercado Livre</span>
            <select v-model="filtros.conta" @change="aplicarFiltros">
              <option value="">Todas as contas</option>
              <option v-for="opcao in facetas.contas" :key="opcao.valor" :value="opcao.valor">{{ opcao.rotulo }}</option>
            </select>
          </label>
          <p class="filtros-avancados__dica">
            Devoluções que vão para o depósito do ML (Full) ou que não têm pacote ficam fora da lista. Para ver, escolha no Status.
          </p>
        </div>

        <!-- ================= LISTA + DETALHES ================= -->
        <div class="area" :class="{ 'is-lado': modoLado }">
          <section ref="listaEl" class="lista" aria-labelledby="dev-lista-titulo" :aria-busy="carregando ? 'true' : 'false'">
            <header class="lista__topo">
              <h2 id="dev-lista-titulo" class="lista__titulo">
                Lista de Devoluções
                <span class="chip-contagem">{{ total }}</span>
              </h2>
              <button
                type="button"
                class="btn btn-secondary btn-sm btn-with-icon"
                :disabled="exportando || !total"
                title="Baixa em planilha todas as devoluções do filtro atual, um item por linha"
                @click="exportar"
              >
                <IconeSvg nome="baixar" />
                {{ exportando ? 'Exportando...' : 'Exportar' }}
              </button>
            </header>

            <p v-if="erro && lista.length" class="lista__aviso" role="alert">
              <IconeSvg nome="alerta" :tamanho="15" />
              <span>{{ erro }}</span>
              <button type="button" class="link-btn" @click="carregar()">Tentar de novo</button>
            </p>

            <div class="lista__cabecalho" aria-hidden="true">
              <span>Pedido / Devolução</span>
              <span class="so-largo">Cliente</span>
              <span>Produto (SKU)</span>
              <span class="col-num">Qtd</span>
              <span>Status</span>
              <span class="so-largo">Atualizada em</span>
              <span>Resultado</span>
              <span />
            </div>

            <!-- Erro sem nada para mostrar -->
            <div v-if="erro && !lista.length" class="estado" role="alert">
              <span class="estado__icone is-erro"><IconeSvg nome="alerta" :tamanho="22" /></span>
              <h3>Não foi possível carregar as devoluções</h3>
              <p>{{ erro }}</p>
              <div class="estado__acoes">
                <button type="button" class="btn btn-secondary btn-with-icon" @click="carregar()">
                  <IconeSvg nome="atualizar" />
                  Tentar de novo
                </button>
              </div>
            </div>

            <!-- Primeira carga -->
            <ul v-else-if="!carregouUmaVez" class="lista__itens" aria-hidden="true">
              <li v-for="n in 6" :key="n" class="linha is-esqueleto">
                <div class="linha__grade">
                  <div class="c-pedido">
                    <span class="sk sk-miniatura" />
                    <span class="sk-linhas"><span class="sk" style="width: 7rem" /><span class="sk sk--sm" style="width: 4.5rem" /></span>
                  </div>
                  <div class="c-cliente"><span class="sk-linhas"><span class="sk" style="width: 75%" /><span class="sk sk--sm" style="width: 50%" /></span></div>
                  <div class="c-produto"><span class="sk-linhas"><span class="sk" style="width: 85%" /><span class="sk sk--sm" style="width: 40%" /></span></div>
                  <div class="linha__meta">
                    <span class="c-qtd"><span class="sk" style="width: 1.2rem" /></span>
                    <span class="c-status"><span class="sk sk-pilula" style="width: 5.5rem" /></span>
                    <span class="c-data"><span class="sk" style="width: 4.5rem" /></span>
                    <span class="c-resultado"><span class="sk sk-pilula" style="width: 4rem" /></span>
                  </div>
                  <div class="c-acoes" />
                </div>
              </li>
            </ul>

            <!-- Vazio -->
            <div v-else-if="!lista.length" class="estado">
              <span class="estado__icone"><IconeSvg nome="devolucao" :tamanho="22" /></span>
              <template v-if="filtrosAlemDoPeriodo">
                <h3>Nenhuma devolução com esses filtros</h3>
                <p>Tente outro status, outro período ou uma busca diferente.</p>
                <div class="estado__acoes">
                  <button type="button" class="btn btn-secondary btn-with-icon" @click="limparFiltros">
                    <IconeSvg nome="desfazer" />
                    Limpar filtros
                  </button>
                </div>
              </template>
              <template v-else>
                <h3>{{ filtros.periodo === 'all' ? 'Nenhuma devolução por aqui ainda' : `Nenhuma devolução ${textoDoPeriodo}` }}</h3>
                <p>As devoluções das contas do Mercado Livre conectadas aparecem aqui. O sistema busca sozinho a cada 30 minutos.</p>
                <div class="estado__acoes">
                  <button type="button" class="btn btn-primary btn-with-icon" :disabled="sincronizando || pedindoSync" @click="sincronizarAgora">
                    <IconeSvg nome="atualizar" :class="{ 'is-spinning': sincronizando || pedindoSync }" />
                    {{ textoDoBotaoDeSync }}
                  </button>
                  <button v-if="filtros.periodo !== 'all'" type="button" class="btn btn-secondary btn-with-icon" @click="definirFiltros({ periodo: 'all' })">
                    <IconeSvg nome="calendario" />
                    Ver todo o período
                  </button>
                </div>
              </template>
            </div>

            <!-- Linhas -->
            <ul v-else class="lista__itens" :class="{ 'is-recarregando': carregando }">
              <li
                v-for="d in lista"
                :key="d.id"
                class="linha"
                :class="{ 'is-selecionada': selecionada === String(d.id) }"
              >
                <div class="linha__grade" @click="aoClicarNaLinha(d)">
                  <div class="c-pedido">
                    <span class="miniatura">
                      <img
                        v-if="miniaturaDa(d)"
                        :src="miniaturaDa(d)"
                        alt=""
                        loading="lazy"
                        @error="aoFalharMiniatura($event, d)"
                      />
                      <IconeSvg v-else nome="caixa" :tamanho="18" />
                    </span>
                    <div class="c-pedido__texto">
                      <button
                        :id="`dev-linha-${d.id}`"
                        type="button"
                        class="c-pedido__numero"
                        :aria-current="selecionada === String(d.id) ? 'true' : null"
                        @click.stop="abrir(d)"
                      >
                        <span class="sr-only">Ver detalhes do pedido </span>#{{ d.order_id || '—' }}
                      </button>
                      <span class="c-pedido__dev">Dev. #{{ d.ml_return_id }}</span>
                      <span class="c-pedido__cliente" :title="nomeDoCliente(d)">{{ nomeDoCliente(d) }}</span>
                      <span v-if="prazoDaLinha(d)" class="tag" :class="prazoDaLinha(d).classe">{{ prazoDaLinha(d).curto }}</span>
                    </div>
                  </div>

                  <div class="c-cliente">
                    <span class="c-cliente__nome" :title="nomeDoCliente(d)">{{ nomeDoCliente(d) }}</span>
                    <span class="c-cliente__conta">{{ d.account_nickname || 'Conta do ML não informada' }}</span>
                  </div>

                  <div class="c-produto">
                    <span class="c-produto__titulo" :title="primeiroItem(d).title || ''">{{ primeiroItem(d).title || 'Produto sem título' }}</span>
                    <span class="c-produto__sku">
                      SKU: {{ primeiroItem(d).sku || 'não identificado' }}
                      <template v-if="(d.items || []).length > 1"> · +{{ d.items.length - 1 }} {{ d.items.length === 2 ? 'item' : 'itens' }}</template>
                    </span>
                  </div>

                  <div class="linha__meta">
                    <span class="c-qtd">
                      <span class="meta-rotulo">Qtd</span>
                      {{ quantidadeTotal(d) }}
                      <span class="sr-only">{{ quantidadeTotal(d) === 1 ? 'unidade' : 'unidades' }}</span>
                    </span>
                    <span class="c-status">
                      <span class="status-pill" :class="situacaoDa(d).classe" :title="dicaDaSituacao(d)">
                        <span class="status-dot" />{{ situacaoDa(d).rotulo }}
                      </span>
                      <span class="c-status__data">{{ formatarDataHora(d.status_changed_at) }}</span>
                    </span>
                    <span class="c-data">
                      <span>{{ formatarData(d.status_changed_at) }}</span>
                      <small>{{ formatarHora(d.status_changed_at) }}</small>
                    </span>
                    <span class="c-resultado">
                      <span v-if="resultadoDa(d)" class="status-pill" :class="resultadoDa(d).classe">{{ resultadoDa(d).rotulo }}</span>
                      <span v-else class="vazio" title="Sem resultado: o pacote ainda não chegou ao CD">—</span>
                    </span>
                  </div>

                  <div class="c-acoes" :data-menu-da-linha="d.id" @click.stop>
                    <button
                      :id="`dev-menu-${d.id}`"
                      type="button"
                      class="kebab"
                      aria-haspopup="menu"
                      :aria-expanded="menuAberto === String(d.id) ? 'true' : 'false'"
                      :aria-controls="menuAberto === String(d.id) ? `dev-menu-lista-${d.id}` : null"
                      :aria-label="`Mais ações do pedido ${d.order_id || d.ml_return_id}`"
                      @click="alternarMenu(d)"
                    >
                      <IconeSvg nome="reticencias" :tamanho="18" />
                    </button>
                    <div
                      v-if="menuAberto === String(d.id)"
                      :id="`dev-menu-lista-${d.id}`"
                      class="menu"
                      role="menu"
                      :aria-labelledby="`dev-menu-${d.id}`"
                      @keydown="aoTeclarMenu"
                    >
                      <button type="button" role="menuitem" class="menu__item" @click="abrir(d)">
                        <IconeSvg nome="olho" />
                        Ver detalhes
                      </button>
                      <button type="button" role="menuitem" class="menu__item" :disabled="!d.order_id" @click="copiarPedido(d)">
                        <IconeSvg nome="copiar" />
                        Copiar nº do pedido
                      </button>
                      <a
                        v-if="linkDaVendaNoMl(d)"
                        role="menuitem"
                        class="menu__item"
                        :href="linkDaVendaNoMl(d)"
                        target="_blank"
                        rel="noopener noreferrer"
                        @click="fecharMenu()"
                      >
                        <IconeSvg nome="link" />
                        Abrir venda no ML
                        <span class="sr-only">(abre em outra aba)</span>
                      </a>
                    </div>
                  </div>
                </div>
              </li>
            </ul>

            <footer v-if="carregouUmaVez && total > 0" class="lista__rodape">
              <span>Mostrando <strong>{{ primeiraDaPagina }}–{{ ultimaDaPagina }}</strong> de <strong>{{ total }}</strong></span>
              <div v-if="totalDePaginas > 1" class="paginacao">
                <button type="button" class="btn btn-secondary btn-sm btn-with-icon" :disabled="pagina <= 1 || carregando" @click="mudarPagina(pagina - 1)">
                  <IconeSvg nome="chevron" class="gira-esquerda" />
                  Anterior
                </button>
                <span class="paginacao__atual">Página {{ pagina }} de {{ totalDePaginas }}</span>
                <button type="button" class="btn btn-secondary btn-sm btn-with-icon" :disabled="pagina >= totalDePaginas || carregando" @click="mudarPagina(pagina + 1)">
                  Próxima
                  <IconeSvg nome="chevron" class="gira-direita" />
                </button>
              </div>
            </footer>
          </section>

          <!-- Detalhes ao lado da lista (tela larga) -->
          <div v-if="modoLado" class="area__lateral">
            <DevolucaoPainel
              v-if="selecionada"
              ref="painelAoLado"
              :devolucao-id="selecionada"
              modo="lado"
              :ativa="telaAtiva"
              @fechar="fecharPainel"
              @alterada="aoAlterar"
            />
            <div v-else class="painel-vazio">
              <span class="painel-vazio__icone"><IconeSvg nome="devolucao" :tamanho="22" /></span>
              <h2 class="painel-vazio__titulo">Detalhes da Devolução</h2>
              <p class="painel-vazio__texto">Escolha uma devolução na lista para ver o resumo, conferir o produto e decidir se volta ao estoque.</p>
              <ol class="painel-vazio__passos">
                <li><IconeSvg nome="caminhao" :tamanho="15" /> O Mercado Livre avisa quando o comprador envia o pacote.</li>
                <li><IconeSvg nome="caixa" :tamanho="15" /> Quando o pacote chega, a devolução fica "No CD".</li>
                <li><IconeSvg nome="check" :tamanho="15" /> Na inspeção você decide. O que estiver apto volta ao estoque do cliente.</li>
              </ol>
              <button
                v-if="kpis && kpis.noCd"
                type="button"
                class="btn btn-secondary btn-sm btn-with-icon"
                @click="definirFiltros({ situacao: 'no_cd', resultado: '' })"
              >
                <IconeSvg nome="caixa" />
                {{ kpis.noCd === 1 ? 'Ver a que espera análise' : `Ver as ${kpis.noCd} que esperam análise` }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detalhes em gaveta (tela estreita). v-show: ao sair da tela a gaveta
         some, mas o que foi digitado continua lá na volta. -->
    <Teleport to="body">
      <Transition name="gaveta">
        <div v-if="selecionada && !modoLado" v-show="telaAtiva" class="gaveta">
          <div class="gaveta__fundo" aria-hidden="true" @click="fecharPainel" />
          <span class="sr-only" tabindex="0" @focus="focarFimDaGaveta" />
          <div ref="gavetaEl" class="gaveta__caixa">
            <DevolucaoPainel
              ref="painelNaGaveta"
              :devolucao-id="selecionada"
              modo="gaveta"
              :ativa="telaAtiva"
              @fechar="fecharPainel"
              @alterada="aoAlterar"
            />
          </div>
          <span class="sr-only" tabindex="0" @focus="focarInicioDaGaveta" />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount, onActivated, onDeactivated } from 'vue';
import { useRoute, useRouter, onBeforeRouteUpdate } from 'vue-router';
import SidebarComponent from '@/components/SidebarComponent.vue';
import TopbarComponent from '@/components/TopbarComponent.vue';
import IconeSvg from '@/components/IconeSvg.vue';
import DevolucaoPainel from '@/components/DevolucaoPainel.vue';
import { useDevolucoes } from '@/composables/useDevolucoes';
import { useNotification } from '@/composables/useNotification';
import {
  OPCOES_DE_PERIODO, OPCOES_DE_SITUACAO, OPCOES_DE_RESULTADO,
  situacaoDa, resultadoDa, statusNoMl, situacaoDoPrazo, nomeDoCliente, quantidadeTotal, linkDaVendaNoMl,
  formatarData, formatarHora, formatarDataHora, formatarDuracaoEmHoras, variacaoPercentual,
  miniaturaSegura, tentarMiniaturaPeloProxy, montarCsv, linhasDaPlanilha, hojeEmBrasilia,
} from '@/utils/devolucoesUi';

const NOME_DA_ROTA = 'MasterDevolucoesView';
/* A partir desta largura a lista e os detalhes cabem lado a lado. */
const CONSULTA_DO_PAINEL_AO_LADO = '(min-width: 1280px)';

const TEXTO_DO_PERIODO = { '7d': 'nos últimos 7 dias', '30d': 'nos últimos 30 dias', '90d': 'nos últimos 90 dias', all: 'desde o início' };
const DIAS_DO_PERIODO = { '7d': 7, '30d': 30, '90d': 90 };

const route = useRoute();
const router = useRouter();
const notify = useNotification();
const {
  filtros, pagina, lista, total, totalDePaginas, kpis, facetas, ultimaSincronizacao,
  carregando, carregouUmaVez, erro, sync, filtrosAtivos, sincronizando, limitePorPagina,
  carregar, aplicarFiltros, buscarComAtraso, definirFiltros, limparFiltros, irParaPagina,
  buscarTodas, sincronizar, acompanharSincronizacao, pausar,
} = useDevolucoes();

const listaEl = ref(null);
const gavetaEl = ref(null);
/* Uma referência para cada lugar: na troca de largura a gaveta ainda está
 * saindo (animação) quando o painel ao lado já montou, e uma referência só
 * seria zerada pela que sai. */
const painelAoLado = ref(null);
const painelNaGaveta = ref(null);
const telaAtiva = ref(true);
const avancados = ref(false);
const exportando = ref(false);
const pedindoSync = ref(false);
const menuAberto = ref(null);
/* Miniaturas que nem o proxy conseguiu abrir: mostram o ícone. */
const miniaturasQueFalharam = reactive({});

function larguraPermitePainelAoLado() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
  return window.matchMedia(CONSULTA_DO_PAINEL_AO_LADO).matches;
}
const modoLado = ref(larguraPermitePainelAoLado());
const painel = computed(() => (modoLado.value ? painelAoLado.value : painelNaGaveta.value));

/* ============================ Números do período ============================ */

const textoDoPeriodo = computed(() => TEXTO_DO_PERIODO[filtros.periodo] || TEXTO_DO_PERIODO['30d']);

const cartoes = computed(() => {
  const k = kpis.value || {};
  const analisadas = (Number(k.aptos) || 0) + (Number(k.naoAptos) || 0);
  const parte = (n) => (analisadas ? Math.round(((Number(n) || 0) / analisadas) * 100) : null);
  const pctAptos = parte(k.aptos);
  const pctNaoAptos = parte(k.naoAptos);
  const dias = DIAS_DO_PERIODO[filtros.periodo];
  const tendencia = dias ? variacaoPercentual(k.total, k.totalAnterior) : null;
  return [
    {
      id: 'total', rotulo: 'Total de devoluções', numero: k.total || 0, dica: textoDoPeriodo.value,
      icone: 'devolucao', cor: 'azul', filtro: { situacao: '', resultado: '' }, tendencia,
      titulo: tendencia ? `Nos ${dias} dias anteriores: ${k.totalAnterior}` : 'Mostra todas as devoluções do período',
    },
    {
      id: 'transito', rotulo: 'Em trânsito', numero: k.emTransito || 0, dica: 'aguardando chegada',
      icone: 'caminhao', cor: 'indigo', filtro: { situacao: 'a_caminho', resultado: '' },
      titulo: 'Abertas no Mercado Livre e ainda a caminho do CD',
    },
    {
      id: 'cd', rotulo: 'No CD', numero: k.noCd || 0, dica: 'aguardando análise',
      icone: 'caixa', cor: 'laranja', filtro: { situacao: 'no_cd', resultado: '' },
      titulo: 'Chegaram ao CD e esperam a inspeção',
    },
    {
      id: 'aptos', rotulo: 'Aptos', numero: k.aptos || 0,
      dica: pctAptos === null ? 'voltaram ao estoque' : `voltaram ao estoque · ${pctAptos}%`,
      icone: 'check', cor: 'verde', filtro: { situacao: '', resultado: 'aptos' },
      titulo: 'Analisadas com pelo menos uma unidade apta (inclui as parciais)',
    },
    {
      id: 'naoAptos', rotulo: 'Não aptos', numero: k.naoAptos || 0,
      dica: pctNaoAptos === null ? 'avaria ou descarte' : `avaria ou descarte · ${pctNaoAptos}%`,
      icone: 'cancelar', cor: 'vermelho', filtro: { situacao: '', resultado: 'nao_apto' },
      titulo: 'Analisadas sem nenhuma unidade apta',
    },
  ];
});

const cartaoAtivo = computed(() => {
  const { situacao, resultado } = filtros;
  if (!situacao && !resultado) return 'total';
  const achado = cartoes.value.find((c) => c.id !== 'total' && c.filtro.situacao === situacao && c.filtro.resultado === resultado);
  return achado ? achado.id : null;
});

/** Clicar no número filtra a lista; clicar de novo no mesmo volta para o total. */
function filtrarPeloCartao(cartao) {
  const voltarAoTotal = cartao.id === 'total' || cartaoAtivo.value === cartao.id;
  definirFiltros(voltarAoTotal ? { situacao: '', resultado: '' } : { ...cartao.filtro });
}

/* Mais devoluções que no período anterior é ruim: vermelho; menos, verde. */
const classeDaTendencia = (t) => (t.valor > 0 ? 'is-sobe' : (t.valor < 0 ? 'is-desce' : 'is-igual'));

/* ============================ Filtros ============================ */

const avancadosAtivos = computed(() => [filtros.cliente, filtros.conta].filter(Boolean).length);
const filtrosAlemDoPeriodo = computed(() => ['busca', 'situacao', 'resultado', 'cliente', 'conta']
  .some((campo) => String(filtros[campo] || '').trim() !== ''));

function limparBusca() {
  filtros.busca = '';
  aplicarFiltros();
}

/* ============================ Sincronização ============================ */

const ultimaAtualizacao = computed(() => (ultimaSincronizacao.value
  ? formatarDataHora(ultimaSincronizacao.value)
  : 'ainda não sincronizado'));

const textoDoBotaoDeSync = computed(() => {
  if (pedindoSync.value) return 'Iniciando...';
  const s = sync.value;
  if (s?.rodando) {
    return s.contas
      ? `Sincronizando conta ${Math.min((Number(s.feitas) || 0) + 1, s.contas)} de ${s.contas}...`
      : 'Sincronizando...';
  }
  return 'Sincronizar com Mercado Livre';
});

function avisarFimDaSincronizacao(estado) {
  if (!estado) return;
  if (estado.erro) {
    notify.error(estado.erro);
    return;
  }
  if (!estado.contas) {
    notify.warning('Nenhuma conta do Mercado Livre conectada e ativa para buscar devoluções.');
    return;
  }
  const lidas = Number(estado.devolucoes) || 0;
  const novas = Number(estado.novas) || 0;
  const partes = [`${lidas} ${lidas === 1 ? 'devolução atualizada' : 'devoluções atualizadas'}`];
  if (novas) partes.push(`${novas} ${novas === 1 ? 'nova' : 'novas'}`);
  notify.success(`Sincronização concluída: ${partes.join(', ')}.`, 5000);
  const falhas = Number(estado.contasComFalha) || 0;
  if (falhas) {
    notify.warning(`${falhas} ${falhas === 1 ? 'conta do Mercado Livre não respondeu' : 'contas do Mercado Livre não responderam'}. Confira se a conexão da conta continua ativa.`, 8000);
  }
}

async function sincronizarAgora() {
  if (sincronizando.value || pedindoSync.value) return;
  pedindoSync.value = true;
  try {
    await sincronizar(avisarFimDaSincronizacao);
    notify.info('Buscando as devoluções no Mercado Livre. Pode continuar usando a tela.');
  } catch (falha) {
    notify.fromError(falha, 'Não foi possível começar a sincronização.');
  } finally {
    pedindoSync.value = false;
  }
}

/* A rotina automática do servidor também aparece aqui: o botão mostra o
 * andamento e, no fim, a lista e o painel aberto são lidos de novo. */
watch(() => Boolean(sync.value?.rodando), (rodando, antes) => {
  if (rodando && telaAtiva.value) acompanharSincronizacao();
  if (!rodando && antes) painel.value?.recarregar?.();
});

/* ============================ Lista ============================ */

const primeiroItem = (d) => (Array.isArray(d?.items) && d.items[0]) || {};

function miniaturaDa(d) {
  if (miniaturasQueFalharam[String(d.id)]) return '';
  return miniaturaSegura(primeiroItem(d).thumbnail);
}

function aoFalharMiniatura(evento, d) {
  if (!tentarMiniaturaPeloProxy(evento.target)) miniaturasQueFalharam[String(d.id)] = true;
}

function dicaDaSituacao(d) {
  const situacao = situacaoDa(d);
  return [situacao.dica, d.ml_status ? `No Mercado Livre: ${statusNoMl(d.ml_status)}.` : ''].filter(Boolean).join(' ');
}

/* Prazo de revisão do ML na linha: só enquanto espera análise e só se aperta. */
function prazoDaLinha(d) {
  if (d.stage !== 'no_cd') return null;
  const prazo = situacaoDoPrazo(d.review_due_at);
  if (!prazo || prazo.classe === 'is-muted') return null;
  return { classe: prazo.classe === 'is-overdue' ? 'is-danger' : 'is-warning', curto: prazo.curto };
}

const primeiraDaPagina = computed(() => (total.value ? (pagina.value - 1) * limitePorPagina + 1 : 0));
const ultimaDaPagina = computed(() => Math.min(pagina.value * limitePorPagina, total.value));

function reduzMovimento() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function mudarPagina(numero) {
  irParaPagina(numero);
  const el = listaEl.value;
  if (el && el.getBoundingClientRect().top < 64) {
    el.scrollIntoView({ block: 'start', behavior: reduzMovimento() ? 'auto' : 'smooth' });
  }
}

function aoAlterar() {
  carregar({ silencioso: true });
}

/* ============================ Seleção (?devolucao=ID) ============================ */

function idDe(valor) {
  const bruto = Array.isArray(valor) ? valor[0] : valor;
  const texto = String(bruto ?? '');
  return /^\d{1,18}$/.test(texto) ? texto : null;
}
const idDaRota = () => idDe(route.query.devolucao);

const selecionada = ref(idDaRota());

watch(() => route.query.devolucao, () => {
  // A tela fica viva no keep-alive; mudança de query de OUTRA rota não é dela.
  if (route.name !== NOME_DA_ROTA) return;
  selecionada.value = idDaRota();
});

/* Trocar ou fechar a devolução com checklist não salvo pede confirmação. */
onBeforeRouteUpdate(async (to) => {
  if (idDe(to.query.devolucao) === selecionada.value) return true;
  return painel.value?.podeSair ? painel.value.podeSair() : true;
});

function abrir(d) {
  fecharMenu();
  const id = String(d.id);
  if (selecionada.value === id) {
    nextTick(() => painel.value?.focar?.());
    return;
  }
  router.replace({ query: { ...route.query, devolucao: id } }).catch(() => {});
}

function aoClicarNaLinha(d) {
  // Quem está selecionando texto (para copiar o pedido, por exemplo) não quer abrir.
  if (typeof window !== 'undefined' && String(window.getSelection?.() || '').trim()) return;
  abrir(d);
}

function fecharPainel() {
  if (!selecionada.value) return;
  const query = { ...route.query };
  delete query.devolucao;
  router.replace({ query }).catch(() => {});
}

/* Fechou: o foco volta para a linha, e não para o começo da página. */
watch(selecionada, (agora, antes) => {
  if (agora || !antes) return;
  nextTick(() => document.getElementById(`dev-linha-${antes}`)?.focus?.());
});

/* Gaveta: Tab fica dentro dela enquanto estiver aberta. */
function focaveisDaGaveta() {
  const raiz = gavetaEl.value;
  if (!raiz) return [];
  return [...raiz.querySelectorAll('a[href], button, input, select, textarea, [tabindex]')]
    .filter((el) => !el.disabled && el.getAttribute('tabindex') !== '-1' && el.offsetParent !== null);
}
function focarInicioDaGaveta() {
  (focaveisDaGaveta()[0] || gavetaEl.value)?.focus?.();
}
function focarFimDaGaveta() {
  const focaveis = focaveisDaGaveta();
  (focaveis[focaveis.length - 1] || gavetaEl.value)?.focus?.();
}

/* ============================ Menu da linha ============================ */

function itensDoMenu() {
  const menu = menuAberto.value ? document.getElementById(`dev-menu-lista-${menuAberto.value}`) : null;
  return menu ? [...menu.querySelectorAll('[role="menuitem"]')].filter((el) => !el.disabled) : [];
}

function fecharMenu({ devolverFoco = false } = {}) {
  const id = menuAberto.value;
  menuAberto.value = null;
  if (devolverFoco && id) nextTick(() => document.getElementById(`dev-menu-${id}`)?.focus?.());
}

function alternarMenu(d) {
  const id = String(d.id);
  if (menuAberto.value === id) {
    fecharMenu();
    return;
  }
  menuAberto.value = id;
  nextTick(() => itensDoMenu()[0]?.focus?.());
}

function aoTeclarMenu(evento) {
  if (evento.key === 'Escape') {
    evento.preventDefault();
    evento.stopPropagation();
    fecharMenu({ devolverFoco: true });
    return;
  }
  if (evento.key === 'Tab') {
    fecharMenu();
    return;
  }
  const itens = itensDoMenu();
  if (!itens.length) return;
  const atual = itens.indexOf(document.activeElement);
  const destinos = {
    ArrowDown: (atual + 1) % itens.length,
    ArrowUp: (atual - 1 + itens.length) % itens.length,
    Home: 0,
    End: itens.length - 1,
  };
  if (!(evento.key in destinos)) return;
  evento.preventDefault();
  itens[destinos[evento.key]].focus();
}

function aoApertarFora(evento) {
  if (!menuAberto.value) return;
  const dono = evento.target?.closest?.('[data-menu-da-linha]');
  if (dono && dono.getAttribute('data-menu-da-linha') === menuAberto.value) return;
  fecharMenu();
}

async function copiarPedido(d) {
  fecharMenu({ devolverFoco: true });
  const numero = String(d.order_id || '');
  if (!numero) return;
  try {
    await navigator.clipboard.writeText(numero);
    notify.success(`Pedido #${numero} copiado.`);
  } catch {
    notify.error(`Não foi possível copiar. O pedido é #${numero}.`);
  }
}

/* ============================ Planilha ============================ */

function baixarArquivo(conteudo, nome) {
  const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function exportar() {
  if (exportando.value) return;
  exportando.value = true;
  try {
    const { linhas, total: totalNoFiltro } = await buscarTodas();
    if (!linhas.length) {
      notify.warning('Nenhuma devolução para exportar com esses filtros.');
      return;
    }
    const planilha = linhasDaPlanilha(linhas);
    baixarArquivo(montarCsv(planilha.cabecalho, planilha.linhas), `devolucoes-mercado-livre-${hojeEmBrasilia()}.csv`);
    if (totalNoFiltro > linhas.length) {
      notify.warning(`A planilha saiu com as ${linhas.length} devoluções atualizadas mais recentemente, de ${totalNoFiltro}. Use os filtros para separar o restante.`, 8000);
    } else {
      notify.success(`Planilha com ${linhas.length} ${linhas.length === 1 ? 'devolução' : 'devoluções'} baixada.`);
    }
  } catch (falha) {
    notify.fromError(falha, 'Não foi possível exportar as devoluções.');
  } finally {
    exportando.value = false;
  }
}

/* ============================ Ciclo de vida ============================ */

let consultaDeLargura = null;
const aoMudarLargura = () => { modoLado.value = larguraPermitePainelAoLado(); };

async function carregarEAcompanhar(opcoes) {
  await carregar(opcoes);
  if (sync.value?.rodando && telaAtiva.value) acompanharSincronizacao();
}

onMounted(() => {
  if (typeof window.matchMedia === 'function') {
    consultaDeLargura = window.matchMedia(CONSULTA_DO_PAINEL_AO_LADO);
    if (consultaDeLargura.addEventListener) consultaDeLargura.addEventListener('change', aoMudarLargura);
    else consultaDeLargura.addListener?.(aoMudarLargura);
  }
  document.addEventListener('pointerdown', aoApertarFora);
  carregarEAcompanhar();
});

/* keep-alive: a primeira ativação é a própria montagem. Nas seguintes os dados
 * podem ter mudado (outra aba, rotina automática). */
let ativadaUmaVez = false;
onActivated(() => {
  telaAtiva.value = true;
  if (!ativadaUmaVez) {
    ativadaUmaVez = true;
    return;
  }
  const daRota = idDaRota();
  if (daRota) {
    selecionada.value = daRota;
  } else if (selecionada.value) {
    // Voltou pelo menu (sem ?devolucao=): reabre onde estava.
    router.replace({ query: { ...route.query, devolucao: selecionada.value } }).catch(() => {});
  }
  carregarEAcompanhar({ silencioso: true });
  painel.value?.recarregar?.();
});

onDeactivated(() => {
  telaAtiva.value = false;
  fecharMenu();
  pausar();
});

onBeforeUnmount(() => {
  pausar();
  document.removeEventListener('pointerdown', aoApertarFora);
  if (consultaDeLargura?.removeEventListener) consultaDeLargura.removeEventListener('change', aoMudarLargura);
  else consultaDeLargura?.removeListener?.(aoMudarLargura);
});
</script>

<style scoped>
/* ===================== BASE ===================== */
.dev-wrapper {
  display: flex; min-height: 100vh;
  font-family: var(--font-sans); background-color: #f4f7fb; color: #0f172a;
}
.main-content { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.content-area {
  flex: 1; display: flex; flex-direction: column; min-width: 0;
  width: 100%; max-width: 1680px; margin: 0 auto;
  padding: 1.25rem 1.5rem 2.5rem; box-sizing: border-box;
}
button, input, select { font-family: var(--font-sans); }
.sr-only {
  position: absolute !important; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}

/* ===================== CABEÇALHO ===================== */
.page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
.page-header__text { min-width: 0; }
.title-row { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
.title { margin: 0; color: #0f172a; font-size: clamp(1.45rem, 2vw, 1.8rem); font-weight: 800; letter-spacing: -0.035em; }
.ml-chip {
  display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.2rem 0.6rem 0.2rem 0.3rem;
  border: 1px solid #f5d90a; border-radius: 999px; background: #fff7b8; color: #4d3f00;
  font-size: 0.74rem; font-weight: 750; white-space: nowrap;
}
.ml-chip img { width: 18px; height: 18px; border-radius: 999px; background: #fff; }
.subtitle { margin: 0.25rem 0 0; max-width: 46rem; color: #64748b; font-size: 0.86rem; }
.sync { display: flex; flex-direction: column; align-items: flex-end; gap: 0.3rem; }
.sync__quando { color: #64748b; font-size: 0.74rem; font-variant-numeric: tabular-nums; }

/* ===================== NÚMEROS ===================== */
.kpis { container-type: inline-size; container-name: kpis; margin-bottom: 0.9rem; }
.kpis__grade { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 0.75rem; }
.kpi {
  display: flex; align-items: flex-start; gap: 0.75rem; min-width: 0; padding: 0.9rem 1rem;
  border: 1px solid #dbe3ef; border-radius: 14px; background: #fff; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
  color: inherit; text-align: left; cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s, background 0.15s;
}
.kpi:hover { border-color: #93c5fd; transform: translateY(-1px); }
.kpi:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25); }
.kpi.is-ativo { border-color: #2563eb; background: #f8fbff; box-shadow: 0 0 0 1px #2563eb inset; }
.kpi__icone { display: grid; place-items: center; flex: 0 0 auto; width: 42px; height: 42px; border-radius: 11px; }
.kpi.is-azul .kpi__icone { background: #eff6ff; color: #2563eb; }
.kpi.is-indigo .kpi__icone { background: #eef2ff; color: #4f46e5; }
.kpi.is-laranja .kpi__icone { background: #fff7ed; color: #ea580c; }
.kpi.is-verde .kpi__icone { background: #ecfdf5; color: #059669; }
.kpi.is-vermelho .kpi__icone { background: #fef2f2; color: #dc2626; }
.kpi__texto { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; }
.kpi__rotulo { overflow: hidden; color: #64748b; font-size: 0.68rem; font-weight: 750; letter-spacing: 0.05em; text-overflow: ellipsis; text-transform: uppercase; white-space: nowrap; }
.kpi__linha { display: flex; align-items: center; gap: 0.45rem; flex-wrap: wrap; min-height: 1.85rem; }
.kpi__numero { color: #0f172a; font-size: 1.6rem; font-weight: 850; letter-spacing: -0.03em; line-height: 1.15; font-variant-numeric: tabular-nums; }
.kpi__tendencia { display: inline-flex; align-items: center; gap: 0.2rem; padding: 0.1rem 0.4rem; border-radius: 999px; font-size: 0.68rem; font-weight: 800; font-variant-numeric: tabular-nums; }
.kpi__tendencia.is-sobe { background: #fef2f2; color: #b91c1c; }
.kpi__tendencia.is-desce { background: #ecfdf5; color: #047857; }
.kpi__tendencia.is-igual { background: #f1f5f9; color: #64748b; }
.kpi__dica { overflow: hidden; color: #64748b; font-size: 0.74rem; text-overflow: ellipsis; white-space: nowrap; }

.kpis__rodape { display: flex; flex-wrap: wrap; align-items: center; gap: 0.35rem 1.1rem; margin: 0.65rem 0 0; color: #64748b; font-size: 0.76rem; }
.kpis__rodape strong { color: #0f172a; font-weight: 750; font-variant-numeric: tabular-nums; }
.kpis__item { display: inline-flex; align-items: center; gap: 0.3rem; flex-wrap: wrap; }
.link-btn {
  display: inline-flex; align-items: center; gap: 0.25rem; padding: 0; border: none; background: none;
  color: #1d4ed8; font-size: 0.76rem; font-weight: 700; cursor: pointer; text-decoration: underline; text-underline-offset: 2px;
}
.link-btn:focus-visible { outline: none; border-radius: 4px; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25); }

/* ===================== FILTROS ===================== */
.filtros {
  display: flex; align-items: center; gap: 0.55rem; flex-wrap: wrap; margin-bottom: 0.7rem; padding: 0.6rem 0.7rem;
  border: 1px solid #dbe3ef; border-radius: 12px; background: #fff; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}
.busca { position: relative; flex: 1 1 260px; min-width: 200px; }
.busca__icone { position: absolute; left: 0.7rem; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }
.busca__campo {
  width: 100%; min-height: 38px; box-sizing: border-box; padding: 0.5rem 2rem 0.5rem 2.1rem;
  border: 1px solid #dbe3ef; border-radius: 9px; background: #fff; color: #0f172a; font-size: 0.85rem;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.busca__campo::placeholder { color: #64748b; }
.busca__campo::-webkit-search-cancel-button { display: none; }
.busca__campo:focus { outline: none; border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12); }
.busca__limpar {
  position: absolute; right: 0.45rem; top: 50%; transform: translateY(-50%); display: grid; place-items: center;
  width: 22px; height: 22px; border: none; border-radius: 999px; background: #eef2f7; color: #64748b; cursor: pointer;
}
.busca__limpar:hover { background: #dbeafe; color: #1d4ed8; }
.busca__limpar:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25); }

.seletor { position: relative; display: inline-flex; align-items: center; }
.seletor select {
  min-height: 38px; padding: 0 0.6rem; border: 1px solid #dbe3ef; border-radius: 9px; background: #fff;
  color: #0f172a; font-size: 0.82rem; font-weight: 650; cursor: pointer;
}
.seletor.com-icone select { padding-left: 2rem; }
.seletor__icone { position: absolute; left: 0.65rem; color: #64748b; pointer-events: none; }
.seletor select:focus-visible { outline: none; border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12); }

.contador {
  min-width: 18px; padding: 0 0.3rem; border-radius: 999px; background: #2563eb; color: #fff;
  font-size: 0.66rem; font-weight: 800; line-height: 18px; text-align: center;
}

.filtros-avancados {
  display: flex; flex-wrap: wrap; align-items: flex-end; gap: 0.7rem 1rem; margin: -0.2rem 0 0.7rem; padding: 0.7rem 0.8rem;
  border: 1px dashed #cbd5e1; border-radius: 12px; background: #f8fafc;
}
.campo-filtro { display: flex; flex: 0 1 18rem; flex-direction: column; gap: 0.3rem; min-width: 13rem; }
.campo-filtro span { color: #475569; font-size: 0.72rem; font-weight: 750; }
.campo-filtro select {
  min-height: 36px; padding: 0 0.6rem; border: 1px solid #dbe3ef; border-radius: 8px; background: #fff;
  color: #0f172a; font-size: 0.82rem; cursor: pointer;
}
.campo-filtro select:focus-visible { outline: none; border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12); }
.filtros-avancados__dica { flex: 1 1 16rem; margin: 0; color: #64748b; font-size: 0.74rem; line-height: 1.45; }

/* ===================== LISTA + DETALHES ===================== */
.area { display: grid; grid-template-columns: minmax(0, 1fr); gap: 1rem; align-items: start; }
.area.is-lado { grid-template-columns: minmax(0, 1fr) minmax(340px, 390px); }
.area__lateral { position: sticky; top: 72px; min-width: 0; }

/* A lista é um contêiner: o desenho da linha muda pela largura DELA, que
   depende do menu lateral e do painel de detalhes, e não pela da janela. */
.lista {
  container-type: inline-size; container-name: lista; min-width: 0; scroll-margin-top: 72px;
  border: 1px solid #dbe3ef; border-radius: 14px; background: #fff; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
}
.lista__topo {
  display: flex; align-items: center; justify-content: space-between; gap: 0.6rem; flex-wrap: wrap;
  padding: 0.75rem 1rem; border-bottom: 1px solid #eef2f7;
}
.lista__titulo { display: flex; align-items: center; gap: 0.5rem; margin: 0; color: #0f172a; font-size: 0.95rem; font-weight: 800; }
.chip-contagem {
  min-width: 1.5rem; padding: 0.05rem 0.5rem; border-radius: 999px; background: #eff6ff; color: #1d4ed8;
  font-size: 0.72rem; font-weight: 800; text-align: center; font-variant-numeric: tabular-nums;
}
.lista__aviso {
  display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin: 0; padding: 0.55rem 1rem;
  border-bottom: 1px solid #fecaca; background: #fef2f2; color: #b91c1c; font-size: 0.78rem;
}

/* Colunas de largura fixa onde há pílula ou botão: cada linha é a sua própria
   grade, e coluna `auto` ficaria com largura diferente de uma linha para outra. */
.lista__cabecalho, .linha__grade {
  display: grid;
  grid-template-columns: minmax(11rem, 1.25fr) minmax(8rem, 1fr) minmax(10rem, 1.6fr) 2.75rem 9.25rem 6.25rem 6.25rem 34px;
  align-items: center; gap: 0.65rem;
}
.lista__cabecalho {
  position: sticky; top: 56px; z-index: 6;
  padding: 0.55rem 1rem; border-bottom: 1px solid #dbe3ef; background: #f8fafc;
  color: #64748b; font-size: 0.66rem; font-weight: 750; letter-spacing: 0.05em; text-transform: uppercase;
}
.col-num { text-align: right; }

.lista__itens { margin: 0; padding: 0; list-style: none; transition: opacity 0.15s; }
.lista__itens.is-recarregando { opacity: 0.6; }
.linha { border-bottom: 1px solid #eef2f7; }
.linha:last-child { border-bottom: none; }
.linha__grade { padding: 0.6rem 1rem; cursor: pointer; transition: background 0.15s, box-shadow 0.15s; }
.linha:hover .linha__grade { background: #f8fbff; }
.linha.is-selecionada .linha__grade { background: #eff6ff; box-shadow: inset 3px 0 0 #2563eb; }
.linha.is-esqueleto .linha__grade { cursor: default; }
.linha.is-esqueleto:hover .linha__grade { background: transparent; }

.c-pedido { display: flex; align-items: center; gap: 0.6rem; min-width: 0; }
.miniatura {
  display: grid; place-items: center; flex: 0 0 auto; width: 40px; height: 40px; overflow: hidden;
  border: 1px solid #e2e8f0; border-radius: 9px; background: #f8fafc; color: #94a3b8;
}
.miniatura img { width: 100%; height: 100%; object-fit: contain; background: #fff; }
.c-pedido__texto { display: flex; flex-direction: column; align-items: flex-start; gap: 0.05rem; min-width: 0; }
.c-pedido__numero {
  padding: 0; border: none; background: none; color: #0f172a; font-size: 0.86rem; font-weight: 800;
  font-variant-numeric: tabular-nums; text-align: left; cursor: pointer; overflow-wrap: anywhere;
}
.c-pedido__numero:hover { color: #1d4ed8; text-decoration: underline; text-underline-offset: 2px; }
.c-pedido__numero:focus-visible { outline: none; border-radius: 4px; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.3); }
.c-pedido__dev { color: #64748b; font-size: 0.72rem; font-variant-numeric: tabular-nums; }
/* Nome do cliente embaixo do pedido: só quando a coluna Cliente some. */
.c-pedido__cliente { display: none; }

.tag { display: inline-flex; align-items: center; margin-top: 0.15rem; padding: 0.08rem 0.4rem; border-radius: 5px; font-size: 0.66rem; font-weight: 750; white-space: nowrap; }
.tag.is-warning { background: #fff7ed; color: #c2410c; }
.tag.is-danger { background: #fef2f2; color: #b91c1c; }

.c-cliente, .c-produto { display: flex; flex-direction: column; min-width: 0; }
.c-cliente__nome, .c-produto__titulo { overflow: hidden; color: #0f172a; font-size: 0.82rem; text-overflow: ellipsis; white-space: nowrap; }
.c-cliente__nome { font-weight: 700; }
.c-produto__titulo { font-weight: 650; }
.c-cliente__conta { overflow: hidden; color: #64748b; font-size: 0.72rem; text-overflow: ellipsis; white-space: nowrap; }
.c-produto__sku { color: #64748b; font-size: 0.72rem; overflow-wrap: anywhere; }

/* No desktop os itens de `meta` viram colunas da grade. */
.linha__meta { display: contents; }
.meta-rotulo { display: none; }
.c-qtd { color: #0f172a; font-size: 0.86rem; font-weight: 750; text-align: right; font-variant-numeric: tabular-nums; }
.c-status { display: flex; flex-direction: column; align-items: flex-start; gap: 0.2rem; min-width: 0; }
.c-status__data { display: none; color: #64748b; font-size: 0.7rem; font-variant-numeric: tabular-nums; }
.c-data { display: flex; flex-direction: column; color: #475569; font-size: 0.78rem; font-variant-numeric: tabular-nums; }
.c-data small { color: #64748b; font-size: 0.7rem; }
.c-resultado .vazio { color: #94a3b8; }

.status-pill {
  display: inline-flex; align-items: center; gap: 0.35rem; max-width: 100%; padding: 0.22rem 0.55rem; border-radius: 999px;
  font-size: 0.72rem; font-weight: 750; line-height: 1.25; white-space: nowrap;
}
.status-dot { flex: 0 0 auto; width: 6px; height: 6px; border-radius: 999px; background: currentColor; }
.status-pill.is-muted { background: #f1f5f9; color: #64748b; }
.status-pill.is-ready { background: #eff6ff; color: #1d4ed8; }
.status-pill.is-sent { background: #eef2ff; color: #4338ca; }
.status-pill.is-warning { background: #fff7ed; color: #c2410c; }
.status-pill.is-overdue { background: #fef2f2; color: #b91c1c; }
.status-pill.is-paid { background: #ecfdf5; color: #047857; }

.c-acoes { position: relative; display: flex; justify-content: flex-end; cursor: default; }
.kebab {
  display: grid; place-items: center; width: 32px; height: 32px; border: 1px solid transparent; border-radius: 8px;
  background: transparent; color: #64748b; cursor: pointer; transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.kebab:hover, .kebab[aria-expanded="true"] { border-color: #dbe3ef; background: #fff; color: #1d4ed8; }
.kebab:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25); }
.menu {
  position: absolute; top: calc(100% + 4px); right: 0; z-index: 20;
  display: flex; flex-direction: column; min-width: 13rem; padding: 0.3rem;
  border: 1px solid #dbe3ef; border-radius: 10px; background: #fff; box-shadow: 0 12px 32px rgba(15, 23, 42, 0.16);
}
.menu__item {
  display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.6rem; border: none; border-radius: 7px;
  background: none; color: #0f172a; font-size: 0.8rem; font-weight: 650; text-align: left; text-decoration: none;
  white-space: nowrap; cursor: pointer;
}
.menu__item:hover:not(:disabled), .menu__item:focus-visible { outline: none; background: #eff6ff; color: #1d4ed8; }
.menu__item:disabled { opacity: 0.5; cursor: not-allowed; }

.lista__rodape {
  display: flex; align-items: center; justify-content: space-between; gap: 0.8rem; flex-wrap: wrap;
  padding: 0.7rem 1rem; border-top: 1px solid #eef2f7; border-radius: 0 0 14px 14px; background: #fff;
  color: #64748b; font-size: 0.76rem;
}
.lista__rodape strong { color: #0f172a; font-weight: 750; font-variant-numeric: tabular-nums; }
.paginacao { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.paginacao__atual { font-variant-numeric: tabular-nums; }
.gira-esquerda { transform: rotate(90deg); }
.gira-direita { transform: rotate(-90deg); }

/* ===================== ESTADOS ===================== */
.estado { display: flex; flex-direction: column; align-items: center; gap: 0.45rem; padding: 3rem 1rem; text-align: center; color: #64748b; }
.estado h3 { margin: 0; color: #0f172a; font-size: 0.98rem; font-weight: 750; }
.estado p { max-width: 34rem; margin: 0; font-size: 0.82rem; line-height: 1.5; }
.estado__icone { display: grid; place-items: center; width: 46px; height: 46px; margin-bottom: 0.3rem; border-radius: 999px; background: #eff6ff; color: #2563eb; }
.estado__icone.is-erro { background: #fef2f2; color: #dc2626; }
.estado__acoes { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem; margin-top: 0.5rem; }

.sk { position: relative; display: block; height: 12px; overflow: hidden; border-radius: 6px; background: #eef1f5; }
.sk::after {
  content: ""; position: absolute; inset: 0; transform: translateX(-100%);
  background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.6) 50%, rgba(255, 255, 255, 0) 100%);
  animation: sk-brilho 1.2s infinite;
}
.sk--sm { height: 9px; }
.sk-linhas { display: flex; flex: 1; flex-direction: column; gap: 6px; min-width: 0; }
.sk-miniatura { width: 40px; height: 40px; flex: 0 0 auto; border-radius: 9px; }
.sk-pilula { height: 22px; border-radius: 999px; }
.sk-numero { width: 3rem; height: 1.5rem; border-radius: 8px; }
@keyframes sk-brilho { 100% { transform: translateX(100%); } }

/* ===================== DETALHES VAZIOS ===================== */
.painel-vazio {
  display: flex; flex-direction: column; align-items: flex-start; gap: 0.6rem; padding: 1.25rem 1.1rem;
  border: 1px dashed #cbd5e1; border-radius: 14px; background: #fff; color: #64748b;
}
.painel-vazio__icone { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 11px; background: #eff6ff; color: #2563eb; }
.painel-vazio__titulo { margin: 0; color: #0f172a; font-size: 1rem; font-weight: 800; }
.painel-vazio__texto { margin: 0; font-size: 0.82rem; line-height: 1.5; }
.painel-vazio__passos { display: flex; flex-direction: column; gap: 0.5rem; margin: 0.2rem 0 0.3rem; padding: 0; list-style: none; }
.painel-vazio__passos li { display: flex; align-items: flex-start; gap: 0.5rem; color: #334155; font-size: 0.78rem; line-height: 1.45; }
.painel-vazio__passos svg { flex: 0 0 auto; margin-top: 0.1rem; color: #2563eb; }

/* ===================== GAVETA ===================== */
.gaveta { position: fixed; inset: 0; z-index: 900; }
.gaveta__fundo { position: absolute; inset: 0; background: rgba(15, 23, 42, 0.45); }
.gaveta__caixa {
  position: absolute; top: 0; right: 0; bottom: 0; width: min(460px, 100vw);
  background: #fff; box-shadow: -12px 0 40px rgba(15, 23, 42, 0.2);
}
.gaveta-enter-active, .gaveta-leave-active { transition: opacity 0.2s ease; }
.gaveta-enter-active .gaveta__caixa, .gaveta-leave-active .gaveta__caixa { transition: transform 0.22s ease; }
.gaveta-enter-from, .gaveta-leave-to { opacity: 0; }
.gaveta-enter-from .gaveta__caixa, .gaveta-leave-to .gaveta__caixa { transform: translateX(100%); }

/* ===================== BOTÕES ===================== */
.btn {
  display: inline-flex; align-items: center; justify-content: center;
  min-height: 38px; padding: 0.45rem 0.8rem; border: 1px solid transparent; border-radius: 9px;
  font-size: 0.82rem; font-weight: 700; white-space: nowrap; text-decoration: none; cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s, opacity 0.15s;
}
.btn:disabled { opacity: 0.55; cursor: not-allowed; }
.btn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25); }
.btn-with-icon { gap: 0.4rem; }
.btn-primary { background-color: #2563eb; border-color: #2563eb; color: #fff; }
.btn-primary:hover:not(:disabled) { background-color: #1d4ed8; border-color: #1d4ed8; }
.btn-secondary { background-color: #fff; border-color: #dbe3ef; color: #475569; }
.btn-secondary:hover:not(:disabled), .btn-secondary.is-ligado { border-color: #93c5fd; background-color: #eff6ff; color: #1d4ed8; }
.btn-sm { min-height: 32px; padding: 0.3rem 0.65rem; font-size: 0.78rem; }
.is-spinning { animation: girar 0.9s linear infinite; }
@keyframes girar { to { transform: rotate(360deg); } }

/* ===================== RESPONSIVO =====================
   Lista média (sem espaço para 8 colunas): Cliente vai para baixo do pedido e
   a data para baixo do status. Lista estreita: a linha vira um cartão de três
   faixas. Nada de rolagem horizontal em largura nenhuma. */
@container kpis (max-width: 1000px) {
  .kpis__grade { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@container kpis (max-width: 620px) {
  .kpis__grade { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@container kpis (max-width: 380px) {
  .kpis__grade { grid-template-columns: minmax(0, 1fr); }
}
@container lista (max-width: 1000px) {
  .lista__cabecalho, .linha__grade { grid-template-columns: minmax(10rem, 1.2fr) minmax(9rem, 1.5fr) 2.5rem 9.25rem 6rem 34px; }
  .so-largo, .c-cliente, .c-data { display: none; }
  .c-pedido__cliente {
    display: block; max-width: 100%; overflow: hidden; color: #475569; font-size: 0.72rem; font-weight: 650;
    text-overflow: ellipsis; white-space: nowrap;
  }
  .c-status__data { display: block; }
}
@container lista (max-width: 640px) {
  .lista__cabecalho { display: none; }
  .linha__grade {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      "pedido acoes"
      "produto produto"
      "meta meta";
    row-gap: 0.45rem;
  }
  .c-pedido { grid-area: pedido; }
  .c-produto { grid-area: produto; padding-left: calc(40px + 0.6rem); }
  .linha__meta { grid-area: meta; display: flex; flex-wrap: wrap; align-items: center; gap: 0.35rem 0.6rem; padding-left: calc(40px + 0.6rem); }
  .c-acoes { grid-area: acoes; align-self: start; }
  .c-qtd { color: #475569; font-size: 0.76rem; font-weight: 650; text-align: left; }
  .meta-rotulo { display: inline; margin-right: 0.2rem; color: #64748b; font-size: 0.66rem; font-weight: 750; letter-spacing: 0.04em; text-transform: uppercase; }
  .c-status { flex-direction: row; flex-wrap: wrap; align-items: center; gap: 0.4rem; }
}
@media (max-width: 760px) {
  .content-area { padding: 1rem; }
  .page-header { flex-direction: column; align-items: stretch; }
  .sync { align-items: stretch; }
  .sync .btn { width: 100%; }
  .filtros { flex-direction: column; align-items: stretch; }
  .busca { flex-basis: auto; }
  .seletor, .seletor select { width: 100%; }
  .filtros .btn { width: 100%; }
  .campo-filtro { flex-basis: 100%; }
  .lista__cabecalho { position: static; }
}
@media (prefers-reduced-motion: reduce) {
  .is-spinning, .sk::after { animation: none; }
  .kpi, .btn, .linha__grade, .lista__itens, .kebab { transition: none; }
  .gaveta-enter-active, .gaveta-leave-active,
  .gaveta-enter-active .gaveta__caixa, .gaveta-leave-active .gaveta__caixa { transition: none; }
}
</style>
