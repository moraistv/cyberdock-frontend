<!-- Central de cobranças (master).
     Todos os clientes de um mês num lugar só. Cada cliente tem UMA ação na
     lista ("Gerar cobrança") e abre, ali mesmo, o painel completo (fatura,
     avulsos, pagamento, Asaas, histórico e dados de cobrança): não é preciso ir
     à tela individual. Uma rolagem só, a da página: nada aqui tem rolagem
     própria. As regras de segurança (lock, idempotência, travar o valor antes de
     cobrar) continuam no backend e são encadeadas por utils/loteDeCobranca.js. -->
<template>
  <div class="billing-wrapper">
    <SidebarComponent />
    <div class="main-content">
      <TopbarComponent />
      <div class="content-area">
        <!-- ================= CABEÇALHO ================= -->
        <header class="page-header">
          <div class="page-header__text">
            <span class="page-eyebrow">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              Área do administrador
            </span>
            <h1 class="title">Central de cobranças</h1>
            <p class="subtitle">Gere as cobranças de todos os clientes do mês. Clique num cliente para ver e resolver tudo dele aqui mesmo.</p>
          </div>

          <div class="header-actions">
            <div class="period-picker" role="group" aria-label="Competência">
              <button type="button" class="period-picker__step" :disabled="ocupado" aria-label="Mês anterior" title="Mês anterior" @click="mudarCompetencia(-1)">
                <IconeSvg nome="chevron" :tamanho="16" class="gira-esquerda" />
              </button>
              <label class="sr-only" for="cobrancas-competencia">Competência</label>
              <select id="cobrancas-competencia" v-model="competencia" class="period-picker__select" :disabled="ocupado">
                <option v-for="opcao in opcoesDeCompetencia" :key="opcao" :value="opcao">{{ periodLabel(opcao) }}</option>
              </select>
              <button type="button" class="period-picker__step" :disabled="ocupado || competencia >= competenciaCorrente" aria-label="Próximo mês" title="Próximo mês" @click="mudarCompetencia(1)">
                <IconeSvg nome="chevron" :tamanho="16" class="gira-direita" />
              </button>
            </div>

            <button
              type="button"
              class="btn btn-secondary btn-with-icon"
              :disabled="ocupado || paraRecalcular.length === 0"
              title="Recalcula agora o valor do mês dos clientes que ainda não foram cobrados. Ao gerar a cobrança o valor é recalculado de qualquer forma"
              @click="recalcularValores"
            >
              <IconeSvg nome="calculadora" />
              <template v-if="recalculo">Recalculando {{ recalculo.feitos }}/{{ recalculo.total }}...</template>
              <template v-else>Recalcular valores ({{ paraRecalcular.length }})</template>
            </button>
            <button
              type="button"
              class="btn btn-secondary btn-with-icon"
              :disabled="!linhasOrdenadas.length"
              title="Baixa a lista atual (com filtros e busca) em planilha"
              @click="exportarCsv"
            >
              <IconeSvg nome="baixar" />
              Exportar
            </button>
            <button type="button" class="btn btn-secondary btn-with-icon" :disabled="ocupado" title="Busca a lista de novo" @click="carregar()">
              <IconeSvg nome="atualizar" :class="{ 'is-spinning': carregando }" />
              Atualizar
            </button>
          </div>
        </header>

        <!-- ================= RESUMO DO MÊS ================= -->
        <section class="resumo-mes" aria-label="Resumo do mês">
          <div class="resumo-mes__topo">
            <div class="resumo-mes__titulo">
              <span class="resumo-mes__rotulo">Total de {{ periodLabel(competencia) }}</span>
              <strong class="resumo-mes__total">{{ formatarMoeda(indicadores.total.valor) }}</strong>
              <span class="resumo-mes__sub">
                {{ indicadores.total.quantidade }} {{ indicadores.total.quantidade === 1 ? 'fatura com valor' : 'faturas com valor' }}
                · {{ percentualRecebido }}% recebido
              </span>
            </div>
            <p v-if="temValorEmAndamento" class="resumo-mes__dica">
              Os valores mostrados são do último cálculo. "Recalcular valores" atualiza agora, e ao gerar a cobrança o valor é sempre recalculado.
              <template v-if="competencia === competenciaCorrente"> Este mês ainda não acabou.</template>
            </p>
          </div>

          <div class="resumo-mes__barra" role="img" :aria-label="descricaoDaBarra">
            <span v-for="segmento in segmentos" :key="segmento.key" :class="`is-${segmento.key}`" :style="{ width: `${segmento.percentual}%` }"></span>
          </div>

          <div class="resumo-mes__kpis">
            <button
              v-for="kpi in KPIS"
              :key="kpi.key"
              type="button"
              class="kpi"
              :class="[`is-${kpi.key}`, { 'is-active': filtro === kpi.filtro }]"
              :aria-pressed="filtro === kpi.filtro"
              :title="`Mostrar só: ${kpi.label}`"
              @click="alternarFiltro(kpi.filtro)"
            >
              <span class="kpi__marca" aria-hidden="true"></span>
              <span class="kpi__rotulo">{{ kpi.label }}</span>
              <strong class="kpi__numero">{{ indicadores[kpi.key].quantidade }}</strong>
              <span class="kpi__valor">{{ formatarMoeda(indicadores[kpi.key].valor) }}</span>
            </button>
          </div>

          <p v-if="filtro !== 'todas'" class="resumo-mes__filtro">
            Mostrando só: <strong>{{ FILTRO_ROTULOS[filtro] }}</strong>
            <button type="button" class="link-btn" @click="filtro = 'todas'">
              <IconeSvg nome="fechar" :tamanho="12" />
              Mostrar todos
            </button>
          </p>
        </section>

        <!-- ================= FERRAMENTAS ================= -->
        <div class="table-controls">
          <div class="search-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <label class="sr-only" for="cobrancas-busca">Buscar cliente</label>
            <input id="cobrancas-busca" v-model="busca" type="text" class="search-input" placeholder="Buscar por código, nome, apelido ou e-mail..." />
            <button v-if="busca" type="button" class="search-clear" title="Limpar busca" aria-label="Limpar busca" @click="busca = ''">
              <IconeSvg nome="fechar" :tamanho="12" />
            </button>
          </div>

          <div class="controls-end">
            <label class="sort">
              <span>Ordenar</span>
              <select v-model="ordem">
                <option v-for="opcao in ORDENACOES" :key="opcao.key" :value="opcao.key">{{ opcao.label }}</option>
              </select>
            </label>
            <label class="toggle-inactive">
              <input v-model="mostrarInativos" type="checkbox" />
              Inativos<template v-if="!mostrarInativos && inativosOcultos"> ({{ inativosOcultos }})</template>
            </label>
          </div>
        </div>

        <!-- ================= LISTA ================= -->
        <div class="lista" :aria-busy="carregando">
          <div v-if="linhasOrdenadas.length" class="lista__cabecalho">
            <span class="col-check">
              <input
                type="checkbox"
                :checked="todasMarcadas"
                :indeterminate="algumasMarcadas"
                :disabled="ocupado || selecionaveisVisiveis.length === 0"
                aria-label="Selecionar todos os clientes da lista que podem ser cobrados"
                @change="alternarTodas($event.target.checked)"
              />
            </span>
            <span aria-hidden="true">Cliente</span>
            <span aria-hidden="true">Situação</span>
            <span aria-hidden="true">Vencimento</span>
            <span aria-hidden="true">Asaas</span>
            <span class="col-num" aria-hidden="true">Valor</span>
            <span class="col-acoes" aria-hidden="true">Ação</span>
            <span aria-hidden="true"></span>
          </div>

          <ul v-if="carregando && !visao" class="lista__itens">
            <li v-for="n in 7" :key="`sk-${n}`" class="linha is-skeleton">
              <div class="linha__resumo">
                <span class="sk sk-check"></span>
                <div class="sk-lines"><span class="sk" style="width: 190px"></span><span class="sk sk--sm" style="width: 130px"></span></div>
                <span class="sk sk-pill" style="width: 80px"></span>
                <span class="sk" style="width: 74px"></span>
                <span class="sk" style="width: 100px"></span>
                <span class="sk" style="width: 84px"></span>
                <span class="sk sk-btn" style="width: 120px"></span>
              </div>
            </li>
          </ul>

          <div v-else-if="erroCarga && !visao" class="feedback-state">
            <span class="feedback-icon is-error" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            </span>
            <h3>Não foi possível carregar as cobranças</h3>
            <p>{{ erroCarga }}</p>
            <button type="button" class="btn btn-secondary btn-sm" @click="carregar()">Tentar de novo</button>
          </div>

          <div v-else-if="linhasOrdenadas.length === 0" class="feedback-state">
            <span class="feedback-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </span>
            <h3>Nenhum cliente nesta visão</h3>
            <p>Ajuste a busca, mostre todos ou escolha outro mês.</p>
            <button v-if="busca || filtro !== 'todas'" type="button" class="btn btn-secondary btn-sm" @click="busca = ''; filtro = 'todas'">
              Limpar filtros
            </button>
          </div>

          <ul v-else class="lista__itens">
            <li
              v-for="linha in linhasOrdenadas"
              :id="idDaLinha(linha.uid)"
              :key="linha.uid"
              class="linha"
              :class="{
                'is-expandida': expandido === linha.uid,
                'is-selecionada': selecionados.has(linha.uid),
                'is-inativa': !linha.active,
              }"
            >
              <div class="linha__resumo" @click="alternarPainel(linha)">
                <span class="linha__check" @click.stop>
                  <input
                    v-if="linha.selecionavel"
                    type="checkbox"
                    :checked="selecionados.has(linha.uid)"
                    :disabled="ocupado"
                    :aria-label="`Selecionar ${linha.nome}`"
                    @change="alternarSelecao(linha.uid, $event.target.checked)"
                  />
                </span>

                <div class="linha__cliente">
                  <span class="linha__nome">{{ linha.nome }}</span>
                  <span v-if="linha.detalhe" class="linha__detalhe">{{ linha.detalhe }}</span>
                  <span v-if="!linha.active || (linha.faltaDocumento && linha.selecionavel) || linha.divergente" class="linha__tags">
                    <span v-if="!linha.active" class="tag is-muted">Inativo</span>
                    <span v-if="linha.faltaDocumento && linha.selecionavel" class="tag is-warning" title="Sem CPF/CNPJ não dá para gerar a cobrança. Abra o cliente e preencha em Dados de cobrança">Sem CPF/CNPJ</span>
                    <span v-if="linha.divergente" class="tag is-danger" title="Os serviços não somam o total da fatura. Abra o cliente, reabra a fatura para recalcular e gere a cobrança de novo">Valor divergente</span>
                  </span>
                </div>

                <div class="linha__meta">
                  <span class="linha__situacao">
                    <span class="status-pill" :class="classeDaSituacao(linha)" :title="SITUACOES[linha.situacao].dica">
                      <span class="status-dot" aria-hidden="true"></span>
                      {{ rotuloDaSituacao(linha) }}
                    </span>
                  </span>
                  <span class="linha__venc">
                    <span class="meta-rotulo">Vence</span>
                    {{ linha.invoice?.dueDate ? formatarData(linha.invoice.dueDate) : '—' }}
                  </span>
                  <span class="linha__asaas" :class="{ 'is-overdue': vencida(linha), 'is-vazio': !textoDoAsaas(linha) }">
                    <span class="meta-rotulo">Asaas</span>
                    {{ textoDoAsaas(linha) || '—' }}
                  </span>
                </div>

                <span class="linha__valor">
                  <template v-if="linha.invoice">
                    <strong>{{ formatarMoeda(linha.total) }}</strong>
                    <small v-if="linha.provisoria">até agora</small>
                  </template>
                  <span v-else class="cell-muted">a calcular</span>
                </span>

                <!-- Uma ação por cliente, com ícone E nome. -->
                <div class="linha__acoes" @click.stop>
                  <button
                    v-if="linha.selecionavel"
                    type="button"
                    class="btn btn-primary btn-xs btn-with-icon"
                    :disabled="ocupado"
                    title="Calcula o valor do mês e cria a cobrança no Asaas, com a descrição dos serviços"
                    @click="abrirProcesso([linha])"
                  >
                    <IconeSvg nome="enviar" :tamanho="14" />
                    Gerar cobrança
                  </button>
                  <a
                    v-else-if="linha.invoice?.asaasInvoiceUrl"
                    class="btn btn-secondary btn-xs btn-with-icon"
                    :href="linha.invoice.asaasInvoiceUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Abre a fatura no Asaas, do jeito que o cliente vê"
                  >
                    <IconeSvg nome="link" :tamanho="14" />
                    Abrir fatura
                  </a>
                </div>

                <button
                  type="button"
                  class="linha__expandir"
                  :aria-expanded="expandido === linha.uid"
                  :aria-controls="`${idDaLinha(linha.uid)}-painel`"
                  :aria-label="expandido === linha.uid ? `Ocultar os detalhes de ${linha.nome}` : `Ver os detalhes de ${linha.nome}`"
                  :title="expandido === linha.uid ? 'Ocultar os detalhes' : 'Ver fatura, histórico e dados do cliente'"
                  @click.stop="alternarPainel(linha)"
                >
                  {{ expandido === linha.uid ? 'Ocultar' : 'Detalhes' }}
                  <IconeSvg nome="chevron" :tamanho="16" />
                </button>
              </div>

              <div v-if="expandido === linha.uid" :id="`${idDaLinha(linha.uid)}-painel`">
                <CobrancaClientePainel
                  :key="linha.uid"
                  :cliente="linha"
                  :competencia="competencia"
                  :hoje="hoje"
                  :versao="versaoDoPainel"
                  :aba-inicial="abaDoPainel"
                  @alterado="carregar({ silencioso: true })"
                  @emitir="emitirDoPainel"
                />
              </div>
            </li>
          </ul>

          <div v-if="visao && linhasOrdenadas.length" class="lista__rodape">
            <span>
              <strong>{{ linhasOrdenadas.length }}</strong> {{ linhasOrdenadas.length === 1 ? 'cliente' : 'clientes' }} nesta visão
              · <strong>{{ formatarMoeda(totalFiltrado) }}</strong>
            </span>
            <span>{{ periodLabel(competencia) }} · vencimento padrão {{ formatarData(visao.standardDueDate) }}</span>
          </div>
        </div>

        <!-- ================= SELEÇÃO =================
             Fica presa ao pé da tela enquanto a lista passa por baixo. -->
        <div v-if="selecionadas.length" class="bulk-bar" role="region" aria-label="Clientes selecionados">
          <span class="bulk-bar__info">
            <strong>{{ selecionadas.length }}</strong> {{ selecionadas.length === 1 ? 'cliente selecionado' : 'clientes selecionados' }}
            · {{ formatarMoeda(totalSelecionado) }} no valor atual
          </span>
          <div class="bulk-bar__actions">
            <button type="button" class="btn btn-ghost-light btn-sm btn-with-icon" :disabled="ocupado" @click="limparSelecao">
              <IconeSvg nome="fechar" :tamanho="14" />
              Limpar seleção
            </button>
            <button type="button" class="btn btn-light btn-sm btn-with-icon" :disabled="ocupado" title="Cria a cobrança de cada cliente selecionado no Asaas" @click="abrirProcesso(selecionadas)">
              <IconeSvg nome="enviar" :tamanho="14" />
              Gerar cobranças ({{ selecionadas.length }})
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= GERAR COBRANÇA (uma ou várias) ================= -->
    <UniversalModal
      :is-open="Boolean(processo) && telaAtiva"
      :title="tituloDoProcesso"
      size="lg"
      :prevent-close="processando"
      :close-on-overlay="!processando"
      :close-on-esc="!processando"
      @close="fecharProcesso"
    >
      <div v-if="processo" class="process">
        <template v-if="processo.fase === 'revisao'">
          <p class="process__lead">{{ textoDeAbertura }}</p>

          <ul class="process__facts">
            <li><strong>{{ resumoRevisao.total }}</strong> {{ resumoRevisao.total === 1 ? 'cliente' : 'clientes' }} · {{ formatarMoeda(resumoRevisao.valorAtual) }} no valor atual</li>
            <li v-if="resumoRevisao.emAndamento">
              <strong>{{ resumoRevisao.emAndamento }}</strong> com valor ainda em andamento: ele é recalculado ao gerar a cobrança e pode mudar.
              <template v-if="resumoRevisao.semValor"> ({{ resumoRevisao.semValor }} ainda sem valor calculado: use "Recalcular valores" antes para conferir.)</template>
            </li>
            <li v-if="resumoRevisao.semDocumento" class="is-warning">
              <strong>{{ resumoRevisao.semDocumento }}</strong> sem CPF/CNPJ: a cobrança não é gerada até completar o cadastro.
            </li>
            <li v-if="resumoRevisao.divergentes" class="is-danger">
              <strong>{{ resumoRevisao.divergentes }}</strong> com valor divergente: a cobrança é recusada até reabrir e recalcular a fatura no painel do cliente.
            </li>
          </ul>

          <div class="due-date">
            <label for="cobrancas-vencimento">Vencimento {{ processo.itens.length === 1 ? 'da cobrança' : 'das cobranças' }}</label>
            <input
              id="cobrancas-vencimento"
              v-model="processo.vencimento"
              type="date"
              :min="hoje"
              :aria-invalid="!vencimentoValido"
              aria-describedby="cobrancas-vencimento-dica"
            />
            <small id="cobrancas-vencimento-dica" :class="{ 'is-error': !vencimentoValido }">
              <template v-if="!vencimentoValido">Escolha uma data a partir de hoje ({{ formatarData(hoje) }}): o Asaas recusa vencimento no passado.</template>
              <template v-else-if="processo.vencimentoPadrao">Padrão do mês: {{ formatarData(processo.vencimentoPadrao) }}. A fatura passa a mostrar a data escolhida.</template>
              <template v-else>A fatura passa a mostrar a data escolhida.</template>
            </small>
          </div>

          <p class="process__notice">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            O Asaas avisa {{ processo.itens.length === 1 ? 'o cliente' : 'cada cliente' }} assim que a cobrança é criada, conforme as notificações configuradas na conta.
          </p>

          <!-- Prévia só para um cliente com o valor do mês já definitivo: com vários,
               seriam N requisições para um texto que cada painel mostra em "Ver descrição". -->
          <div v-if="processo.previaCarregando || processo.previa || processo.previaErro" class="desc-preview">
            <span class="desc-preview__label">Descrição que vai para o Asaas</span>
            <p v-if="processo.previaCarregando" class="desc-preview__state">Montando a descrição...</p>
            <p v-else-if="processo.previaErro" class="desc-preview__state is-error">{{ processo.previaErro }}</p>
            <template v-else-if="processo.previa">
              <pre class="desc-preview__text">{{ processo.previa.description }}</pre>
              <small class="desc-preview__meta" :class="{ 'is-error': !processo.previa.matches }">
                {{ processo.previa.length }}/{{ processo.previa.limit }} caracteres
                <template v-if="processo.previa.groupedItems"> · {{ processo.previa.groupedItems }} serviços agrupados para caber no limite do Asaas</template>
                <template v-if="!processo.previa.matches"> · os serviços não somam o total: a cobrança será recusada</template>
              </small>
            </template>
          </div>

          <ul class="process__list">
            <li v-for="item in processo.itens" :key="item.uid" class="process__item">
              <div class="process__item-body">
                <span class="process__item-name">{{ item.nome }}</span>
                <span class="process__item-note">{{ notaDaRevisao(item.linha) }}</span>
              </div>
              <span class="process__item-value">{{ item.linha.invoice ? formatarMoeda(item.linha.total) : '—' }}</span>
            </li>
          </ul>
        </template>

        <template v-else>
          <div
            class="progress"
            role="progressbar"
            :aria-valuenow="contagemDoProcesso.feitos"
            aria-valuemin="0"
            :aria-valuemax="contagemDoProcesso.total"
            :aria-label="`${contagemDoProcesso.feitos} de ${contagemDoProcesso.total} processados`"
          >
            <span class="progress__bar" :style="{ width: `${percentualDoProcesso}%` }"></span>
          </div>
          <p class="process__counter" aria-live="polite">
            {{ contagemDoProcesso.feitos }} de {{ contagemDoProcesso.total }}
            · {{ contagemDoProcesso.ok }} concluído(s)
            <template v-if="contagemDoProcesso.pulados"> · {{ contagemDoProcesso.pulados }} pulado(s)</template>
            <template v-if="contagemDoProcesso.erros"> · {{ contagemDoProcesso.erros }} com erro</template>
            <template v-if="processando && processo.cancelado"> · parando após os atuais...</template>
          </p>

          <ul class="process__list">
            <li v-for="item in processo.itens" :key="item.uid" class="process__item" :class="`is-${item.etapa}`">
              <span class="process__item-icon" aria-hidden="true">
                <IconeSvg v-if="item.etapa === 'ok'" nome="check" :tamanho="15" />
                <IconeSvg v-else-if="item.etapa === 'erro'" nome="fechar" :tamanho="15" />
                <svg v-else-if="item.etapa === 'pulado' || item.etapa === 'cancelado'" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                <span v-else-if="item.etapa !== 'aguardando'" class="spinner"></span>
              </span>
              <div class="process__item-body">
                <span class="process__item-name">{{ item.nome }}</span>
                <span class="process__item-note">{{ item.mensagem || ETAPAS[item.etapa] }}</span>
              </div>
              <span class="process__item-value">{{ item.total !== null && item.total !== undefined ? formatarMoeda(item.total) : '' }}</span>
              <a v-if="item.invoiceUrl" class="process__item-link" :href="item.invoiceUrl" target="_blank" rel="noopener noreferrer">Abrir fatura</a>
              <button v-else-if="item.pendencia === 'dados' && !processando" type="button" class="process__item-link" @click="abrirCadastroDoCliente(item.uid)">
                Completar cadastro
              </button>
            </li>
          </ul>
        </template>
      </div>

      <template #footer>
        <template v-if="processo?.fase === 'revisao'">
          <button type="button" class="btn btn-secondary" @click="fecharProcesso">Cancelar</button>
          <button type="button" class="btn btn-primary btn-with-icon" :disabled="!podeIniciar" @click="executarProcesso">
            <IconeSvg nome="enviar" />
            {{ textoDeInicio }}
          </button>
        </template>
        <template v-else-if="processando">
          <button type="button" class="btn btn-secondary" :disabled="processo.cancelado" @click="processo.cancelado = true">
            {{ processo.cancelado ? 'Parando...' : 'Parar após os atuais' }}
          </button>
        </template>
        <template v-else-if="processo">
          <button v-if="repetiveis.length" type="button" class="btn btn-secondary btn-with-icon" @click="repetirFalhas">
            <IconeSvg nome="atualizar" />
            Tentar de novo ({{ repetiveis.length }})
          </button>
          <button type="button" class="btn btn-primary" @click="fecharProcesso">Concluir</button>
        </template>
      </template>
    </UniversalModal>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onActivated, onDeactivated } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import SidebarComponent from '@/components/SidebarComponent.vue';
import TopbarComponent from '@/components/TopbarComponent.vue';
import UniversalModal from '@/components/UniversalModal.vue';
import CobrancaClientePainel from '@/components/CobrancaClientePainel.vue';
import IconeSvg from '@/components/IconeSvg.vue';
import { useBilling } from '@/composables/useBilling';
import { useNotification } from '@/composables/useNotification';
import { asaasStatusLabel } from '@/utils/asaasStatus';
import { criarLoteDeCobranca } from '@/utils/loteDeCobranca';
import {
  PERIODO_VALIDO, periodLabel, deslocarCompetencia, competenciaDeHoje, dataDeHoje,
  formatarMoeda, paraCentavos, formatarData, somarDias, dataValida, mensagemDeErro,
} from '@/utils/cobrancaUi';

const route = useRoute();
const router = useRouter();
const notify = useNotification();
const {
  fetchBillingOverview,
  refreshBillingOverview,
  fetchChargePreview,
  closeInvoicePeriod,
  ensureAsaasCustomer,
  issueCharge,
} = useBilling();

const NOME_DA_ROTA = 'MasterCobrancasView';

/* ============================ Competência ============================ */

const competenciaCorrente = ref(competenciaDeHoje());

/* Padrão: o mês ANTERIOR. A cobrança sai depois que o mês acaba, então é o mês
 * que o master abre esta tela para cobrar. */
function competenciaDaRota() {
  const pedida = String(route.query.competencia || '');
  return PERIODO_VALIDO.test(pedida) ? pedida : deslocarCompetencia(competenciaCorrente.value, -1);
}

const competencia = ref(competenciaDaRota());

const opcoesDeCompetencia = computed(() => {
  const lista = Array.from({ length: 24 }, (_, i) => deslocarCompetencia(competenciaCorrente.value, -i));
  if (!lista.includes(competencia.value)) lista.push(competencia.value);
  return lista.sort().reverse();
});

function mudarCompetencia(delta) {
  const nova = deslocarCompetencia(competencia.value, delta);
  if (nova > competenciaCorrente.value) return;
  competencia.value = nova;
}

const normalizarBusca = (texto) => String(texto || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/* ============================ Dados ============================ */

const visao = ref(null);
const carregando = ref(false);
const erroCarga = ref('');
let geracaoDaCarga = 0;

/* uid do cliente com o painel aberto (um por vez). */
const expandido = ref(null);

/**
 * Carrega a visão do mês selecionado.
 *
 * `silencioso` mantém a lista na tela enquanto recarrega (depois de uma ação);
 * a carga normal limpa a lista quando o mês mudou, para não exibir os números de
 * um mês sob o título de outro. Resposta atrasada de um mês anterior é
 * descartada pela geração.
 */
async function carregar({ silencioso = false } = {}) {
  const periodo = competencia.value;
  const geracao = ++geracaoDaCarga;
  competenciaCorrente.value = competenciaDeHoje();
  if (!silencioso) {
    carregando.value = true;
    if (visao.value?.period !== periodo) visao.value = null;
  }
  erroCarga.value = '';
  try {
    const dados = await fetchBillingOverview(periodo);
    if (geracao !== geracaoDaCarga) return;
    visao.value = dados;
    podarSelecao();
  } catch (e) {
    if (geracao !== geracaoDaCarga) return;
    erroCarga.value = mensagemDeErro(e, 'Não foi possível carregar as cobranças do mês.');
    // Com a lista anterior ainda na tela, o estado de erro não aparece: avisa por fora.
    if (visao.value) notify.error(erroCarga.value);
  } finally {
    if (geracao === geracaoDaCarga) carregando.value = false;
  }
}

const hoje = computed(() => visao.value?.today || dataDeHoje());

/* ============================ Linhas ============================ */

/* Quatro situações, na ordem do caminho: a cobrar -> aguardando -> paga.
 * "Em andamento" (valor do mês ainda pode mudar) não é uma situação: é só o
 * "até agora" ao lado do valor, porque para quem opera tudo isso é "a cobrar". */
const SITUACOES = {
  a_cobrar: { label: 'A cobrar', classe: 'is-ready', dica: 'Ainda sem cobrança. Clique em "Gerar cobrança".' },
  zerada: { label: 'Sem valor', classe: 'is-muted', dica: 'Nada a cobrar neste mês.' },
  emitida: { label: 'Aguardando', classe: 'is-sent', dica: 'Cobrança criada no Asaas, aguardando o pagamento.' },
  paga: { label: 'Paga', classe: 'is-paid', dica: 'Pagamento confirmado.' },
};

function situacaoDe(cliente) {
  const fatura = cliente.invoice;
  if (fatura?.status === 'paid') return 'paga';
  if (fatura?.asaasPaymentId) return 'emitida';
  if (fatura && !(fatura.total > 0)) return 'zerada';
  return 'a_cobrar';
}

const vencida = (linha) => linha.situacao === 'emitida' && linha.invoice?.asaasStatus === 'OVERDUE';
const classeDaSituacao = (linha) => (vencida(linha) ? 'is-overdue' : SITUACOES[linha.situacao].classe);
const rotuloDaSituacao = (linha) => (vencida(linha) ? 'Vencida' : SITUACOES[linha.situacao].label);

/** Estado da cobrança no Asaas; vazio quando ainda não há cobrança. */
function textoDoAsaas(linha) {
  if (linha.invoice?.asaasPaymentId) return asaasStatusLabel(linha.invoice.asaasStatus) || 'Cobrança criada';
  if (linha.situacao === 'paga') return 'Baixa manual';
  return '';
}

const linhas = computed(() => (visao.value?.clients || [])
  .map((cliente) => {
    const fatura = cliente.invoice;
    const situacao = situacaoDe(cliente);
    // Vinculado ao Asaas já não depende do documento local para cobrar.
    const faltaDocumento = !cliente.linked && !cliente.hasDocument;
    const divergente = Boolean(fatura?.closedAt && !fatura.asaasPaymentId && fatura.status !== 'paid' && !fatura.itemsMatch);
    return {
      ...cliente,
      nome: cliente.name || cliente.mlNickname || cliente.email || cliente.uid,
      detalhe: [cliente.name && cliente.mlNickname ? cliente.mlNickname : null, cliente.email].filter(Boolean).join(' · '),
      situacao,
      total: fatura ? fatura.total : null,
      faltaDocumento,
      divergente,
      selecionavel: situacao === 'a_cobrar',
      pendente: situacao === 'a_cobrar' && (faltaDocumento || divergente),
      // Valor do último cálculo: pode mudar até a cobrança ser gerada.
      emAndamento: !fatura?.closedAt && situacao !== 'emitida' && situacao !== 'paga',
      provisoria: Boolean(fatura && !fatura.closedAt && situacao === 'a_cobrar'),
      termoDeBusca: normalizarBusca([cliente.name, cliente.mlNickname, cliente.email].filter(Boolean).join(' ')),
    };
  })
  .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true, sensitivity: 'base' })));

/* Inativo sem nada no mês é ruído; inativo com valor, cobrança ou pagamento
 * continua aparecendo, porque ainda há o que acompanhar. */
const mostrarInativos = ref(false);
const temMovimento = (linha) => Boolean(linha.invoice
  && (linha.total > 0 || linha.invoice.asaasPaymentId || linha.invoice.status === 'paid'));
const linhasNoEscopo = computed(() => linhas.value
  .filter((linha) => mostrarInativos.value || linha.active || temMovimento(linha)));
const inativosOcultos = computed(() => linhas.value.length - linhasNoEscopo.value.length);

const busca = ref('');
const linhasBuscadas = computed(() => {
  const termo = normalizarBusca(busca.value.trim());
  if (!termo) return linhasNoEscopo.value;
  return linhasNoEscopo.value.filter((linha) => linha.termoDeBusca.includes(termo));
});

const FILTRO_ROTULOS = {
  a_cobrar: 'A cobrar',
  emitidas: 'Aguardando pagamento',
  pagas: 'Pagas',
  pendencias: 'Com pendência (sem CPF/CNPJ ou valor divergente)',
};

function passaNoFiltro(linha, chave) {
  switch (chave) {
    case 'a_cobrar': return linha.situacao === 'a_cobrar';
    case 'emitidas': return linha.situacao === 'emitida';
    case 'pagas': return linha.situacao === 'paga';
    case 'pendencias': return linha.pendente;
    default: return true;
  }
}

const filtro = ref('todas');
/* O cliente aberto fica na lista mesmo que deixe de passar no filtro: gerar a
 * cobrança de quem está em "A cobrar" não pode fazer o painel sumir no meio do
 * trabalho. Trocar o filtro de propósito fecha o painel (watch abaixo). */
const linhasFiltradas = computed(() => linhasBuscadas.value
  .filter((linha) => passaNoFiltro(linha, filtro.value) || linha.uid === expandido.value));

/* Clicar no indicador filtra; clicar de novo volta para todos. */
function alternarFiltro(chave) {
  filtro.value = filtro.value === chave ? 'todas' : chave;
}

const ORDENACOES = [
  { key: 'nome', label: 'Nome' },
  { key: 'situacao', label: 'O que falta fazer' },
  { key: 'valor', label: 'Maior valor' },
  { key: 'vencimento', label: 'Vencimento' },
];
/* "O que falta fazer" põe primeiro quem ainda precisa de cobrança, depois quem
 * está vencido (cobrar o pagamento), depois quem aguarda, e por fim os pagos. */
const PESO_DA_SITUACAO = { a_cobrar: 0, emitida: 2, paga: 3, zerada: 4 };
const pesoDe = (linha) => (vencida(linha) ? 1 : PESO_DA_SITUACAO[linha.situacao]);
const ordem = ref('nome');

const linhasOrdenadas = computed(() => {
  const lista = [...linhasFiltradas.value];
  const porNome = (a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true, sensitivity: 'base' });
  switch (ordem.value) {
    case 'valor':
      return lista.sort((a, b) => (paraCentavos(b.total) - paraCentavos(a.total)) || porNome(a, b));
    case 'situacao':
      return lista.sort((a, b) => (pesoDe(a) - pesoDe(b)) || porNome(a, b));
    case 'vencimento':
      return lista.sort((a, b) => String(a.invoice?.dueDate || '9999').localeCompare(String(b.invoice?.dueDate || '9999'))
        || porNome(a, b));
    default:
      return lista; // `linhas` já vem por nome
  }
});

/** Soma em centavos: somar float de reais acumula erro de arredondamento. */
const somar = (lista) => lista.reduce((soma, linha) => soma + paraCentavos(linha.total), 0) / 100;
const resumir = (lista) => ({ quantidade: lista.length, valor: somar(lista) });

const indicadores = computed(() => {
  const escopo = linhasNoEscopo.value;
  return {
    total: resumir(escopo.filter((linha) => linha.total > 0)),
    aCobrar: resumir(escopo.filter((linha) => linha.situacao === 'a_cobrar')),
    emitidas: resumir(escopo.filter((linha) => linha.situacao === 'emitida')),
    pagas: resumir(escopo.filter((linha) => linha.situacao === 'paga')),
    pendencias: resumir(escopo.filter((linha) => linha.pendente)),
  };
});

const KPIS = [
  { key: 'aCobrar', filtro: 'a_cobrar', label: 'A cobrar' },
  { key: 'emitidas', filtro: 'emitidas', label: 'Aguardando pagamento' },
  { key: 'pagas', filtro: 'pagas', label: 'Pagas' },
  { key: 'pendencias', filtro: 'pendencias', label: 'Com pendência' },
];

/* Barra do mês por VALOR, na ordem do caminho: recebido, aguardando, a cobrar. */
const segmentos = computed(() => {
  const partes = [
    { key: 'pagas', valor: indicadores.value.pagas.valor },
    { key: 'emitidas', valor: indicadores.value.emitidas.valor },
    { key: 'aCobrar', valor: indicadores.value.aCobrar.valor },
  ];
  const total = partes.reduce((soma, parte) => soma + Math.max(0, parte.valor), 0);
  return partes.map((parte) => ({ ...parte, percentual: total > 0 ? (Math.max(0, parte.valor) / total) * 100 : 0 }));
});
const percentualRecebido = computed(() => Math.round(segmentos.value[0].percentual));
const descricaoDaBarra = computed(() => {
  const nomes = { pagas: 'pago', emitidas: 'aguardando pagamento', aCobrar: 'a cobrar' };
  return `Mês: ${segmentos.value.map((s) => `${Math.round(s.percentual)}% ${nomes[s.key]}`).join(', ')}`;
});

const totalFiltrado = computed(() => somar(linhasOrdenadas.value));
const temValorEmAndamento = computed(() => linhasNoEscopo.value.some((linha) => linha.emAndamento));
const paraRecalcular = computed(() => linhasOrdenadas.value.filter((linha) => linha.emAndamento));

/* ============================ Painel do cliente ============================ */

const abaDoPainel = ref('fatura');
/* Incrementado quando a PÁGINA mexe no cliente aberto (lote, recálculo): o
 * painel recarrega a fatura dele. */
const versaoDoPainel = ref(0);

/* Trocar o filtro de propósito fecha o painel de quem não passa nele. */
watch(filtro, (chave) => {
  const aberta = linhas.value.find((linha) => linha.uid === expandido.value);
  if (aberta && !passaNoFiltro(aberta, chave)) expandido.value = null;
});

const idDaLinha = (uid) => `cliente-${String(uid).replace(/[^A-Za-z0-9_-]/g, '_')}`;

async function mostrarLinha(uid) {
  await nextTick();
  const elemento = document.getElementById(idDaLinha(uid));
  if (!elemento) return;
  const { top } = elemento.getBoundingClientRect();
  // Só rola quando a linha não está na parte de cima da tela.
  if (top < 90 || top > window.innerHeight * 0.45) {
    elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function alternarPainel(linha) {
  if (expandido.value === linha.uid) {
    expandido.value = null;
    return;
  }
  abaDoPainel.value = 'fatura';
  expandido.value = linha.uid;
  mostrarLinha(linha.uid);
}

/** Abre o cliente na aba de dados de cobrança (vindo do "Completar cadastro" do lote). */
function abrirCadastroDoCliente(uid) {
  fecharProcesso();
  if (!linhasOrdenadas.value.some((linha) => linha.uid === uid)) {
    busca.value = '';
    filtro.value = 'todas';
    mostrarInativos.value = true;
  }
  abaDoPainel.value = 'cadastro';
  expandido.value = uid;
  mostrarLinha(uid);
}

/** O painel pede a cobrança; ela passa pelo mesmo modal do lote. */
function emitirDoPainel({ linha, periodo, vencimento, vencimentoPadrao }) {
  abrirProcesso([linha], { periodo, vencimento, vencimentoPadrao });
}

/* ============================ Seleção ============================ */

/* O Set é sempre substituído, nunca mutado: a troca da referência é o que
 * garante que tudo que depende da seleção recalcule. */
const selecionados = ref(new Set());

const selecionadas = computed(() => linhasNoEscopo.value
  .filter((linha) => linha.selecionavel && selecionados.value.has(linha.uid)));
const totalSelecionado = computed(() => somar(selecionadas.value));
const selecionaveisVisiveis = computed(() => linhasOrdenadas.value.filter((linha) => linha.selecionavel));
const todasMarcadas = computed(() => selecionaveisVisiveis.value.length > 0
  && selecionaveisVisiveis.value.every((linha) => selecionados.value.has(linha.uid)));
const algumasMarcadas = computed(() => !todasMarcadas.value
  && selecionaveisVisiveis.value.some((linha) => selecionados.value.has(linha.uid)));

function alternarSelecao(uid, marcar) {
  const proximo = new Set(selecionados.value);
  if (marcar) proximo.add(uid); else proximo.delete(uid);
  selecionados.value = proximo;
}

function alternarTodas(marcar) {
  const proximo = new Set(selecionados.value);
  selecionaveisVisiveis.value.forEach((linha) => (marcar ? proximo.add(linha.uid) : proximo.delete(linha.uid)));
  selecionados.value = proximo;
}

function limparSelecao() {
  selecionados.value = new Set();
}

/** Depois de recarregar, fica selecionado só quem ainda precisa de cobrança. */
function podarSelecao() {
  const validos = new Set(linhas.value.filter((linha) => linha.selecionavel).map((linha) => linha.uid));
  selecionados.value = new Set([...selecionados.value].filter((uid) => validos.has(uid)));
}

/** Recarrega a lista e, se o cliente está aberto, o painel dele. */
async function depoisDaAcao(uid) {
  await carregar({ silencioso: true });
  if (!uid || expandido.value === uid) versaoDoPainel.value += 1;
}

/* ============================ Recalcular valores ============================ */

/* Em lotes: cada recálculo varre as vendas do cliente, e o backend aceita no
 * máximo 25 por chamada justamente para a requisição não cair no timeout. */
const LOTE_DE_RECALCULO = 10;
const recalculo = ref(null);

async function recalcularValores() {
  const alvos = paraRecalcular.value.map((linha) => linha.uid);
  if (!alvos.length || recalculo.value) return;
  const periodo = competencia.value;
  recalculo.value = { feitos: 0, total: alvos.length };
  let falhas = 0;
  try {
    for (let i = 0; i < alvos.length; i += LOTE_DE_RECALCULO) {
      const parte = alvos.slice(i, i + LOTE_DE_RECALCULO);
      const resposta = await refreshBillingOverview(periodo, parte);
      falhas += (resposta?.results || []).filter((r) => !r.ok).length;
      recalculo.value.feitos += parte.length;
    }
    if (falhas) {
      notify.warning(`${alvos.length - falhas} recalculado(s); ${falhas} não puderam ser recalculados agora. Tente de novo em instantes.`);
    } else {
      notify.success(`${alvos.length} ${alvos.length === 1 ? 'cliente recalculado' : 'clientes recalculados'}.`);
    }
  } catch (e) {
    notify.error(mensagemDeErro(e, 'Não foi possível recalcular os valores.'));
  } finally {
    recalculo.value = null;
    await depoisDaAcao(null);
  }
}

/* ============================ Exportar ============================ */

/** Planilha da lista atual. `;` e BOM para o Excel em português abrir certo. */
function exportarCsv() {
  /* Texto que começa com = + - @ vira fórmula no Excel: o apóstrofo neutraliza. */
  const celula = (valor) => {
    let texto = String(valor ?? '');
    if (/^[=+\-@]/.test(texto)) texto = `'${texto}`;
    return `"${texto.replace(/"/g, '""')}"`;
  };
  const valorBr = (valor) => (valor === null || valor === undefined ? '' : (Number(valor) || 0).toFixed(2).replace('.', ','));
  const cabecalho = ['Cliente', 'E-mail', 'Apelido ML', 'Situação', 'Valor (R$)', 'Vencimento', 'Cobrança no Asaas', 'Link da fatura'];
  const linhasDoArquivo = linhasOrdenadas.value.map((linha) => [
    linha.nome,
    linha.email || '',
    linha.mlNickname || '',
    rotuloDaSituacao(linha),
    valorBr(linha.total),
    linha.invoice?.dueDate ? formatarData(linha.invoice.dueDate) : '',
    textoDoAsaas(linha),
    linha.invoice?.asaasInvoiceUrl || '',
  ]);
  const conteudo = [cabecalho, ...linhasDoArquivo].map((colunas) => colunas.map(celula).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([`\ufeff${conteudo}`], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `cobrancas-${competencia.value}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/* ============================ Gerar cobrança (modal) ============================
 *
 * O passo a passo de cada cliente (calcular o valor do mês -> cadastrar no Asaas
 * -> criar a cobrança, com repetição do que for passageiro) está em
 * utils/loteDeCobranca.js, sem Vue, para poder ser testado com dublês. Aqui fica
 * só o estado da tela.
 * ============================================================================ */

/* Dois de cada vez: metade do tempo do lote, bem abaixo do teto de 5 locks por
 * processo do backend e longe do recálculo em paralelo que já esgotou o pool. */
const CONCORRENCIA = 2;

const lote = criarLoteDeCobranca({
  api: { closeInvoicePeriod, ensureAsaasCustomer, issueCharge },
  formatarData,
  mensagemDeErro,
});

const ETAPAS = {
  aguardando: 'Na fila',
  fechando: 'Calculando o valor do mês...',
  vinculando: 'Cadastrando o cliente no Asaas...',
  emitindo: 'Criando a cobrança no Asaas...',
  ok: 'Concluído',
  pulado: 'Pulado',
  erro: 'Erro',
  cancelado: 'Não processado',
};

const processo = ref(null);
const telaAtiva = ref(true);
const processando = computed(() => processo.value?.fase === 'executando');
const ocupado = computed(() => carregando.value || Boolean(recalculo.value) || processando.value);

/* Vencimento padrão do mês; se já passou, cinco dias a partir de hoje (o mesmo
 * prazo que a tela do cliente sugere). */
const vencimentoSugerido = computed(() => {
  const padrao = visao.value?.standardDueDate;
  return padrao && padrao >= hoje.value ? padrao : somarDias(hoje.value, 5);
});

/**
 * Abre o modal de gerar cobrança para um ou vários clientes.
 * `opcoes.periodo` existe porque o painel do cliente pode estar em outro mês
 * (navegando pelo histórico).
 */
function abrirProcesso(alvo, opcoes = {}) {
  const lista = (alvo || []).filter((linha) => linha.selecionavel);
  if (!lista.length || ocupado.value) return;
  const periodo = opcoes.periodo || competencia.value;
  const vencimentoPadrao = opcoes.vencimentoPadrao
    ?? (periodo === competencia.value ? visao.value?.standardDueDate : '');

  processo.value = {
    periodo,
    fase: 'revisao',
    cancelado: false,
    vencimentoPadrao: vencimentoPadrao || '',
    vencimento: opcoes.vencimento || vencimentoSugerido.value,
    previa: null,
    previaErro: '',
    previaCarregando: false,
    itens: lista.map((linha) => ({
      uid: linha.uid,
      nome: linha.nome,
      linha,
      etapa: 'aguardando',
      mensagem: '',
      total: linha.total,
      invoiceUrl: null,
      pendencia: null,
    })),
  };

  const unica = lista.length === 1 ? lista[0] : null;
  if (unica?.invoice?.closedAt) carregarPreviaDoProcesso(unica);
}

async function carregarPreviaDoProcesso(linha) {
  const alvo = processo.value;
  alvo.previaCarregando = true;
  try {
    alvo.previa = await fetchChargePreview(linha.uid, alvo.periodo);
  } catch (e) {
    alvo.previaErro = mensagemDeErro(e, 'Não foi possível montar a descrição.');
  } finally {
    alvo.previaCarregando = false;
  }
}

const tituloDoProcesso = computed(() => {
  const p = processo.value;
  if (!p) return '';
  const quantos = p.itens.length;
  if (quantos === 1) return `Cobrança de ${p.itens[0].nome} · ${periodLabel(p.periodo)}`;
  return `Gerar ${quantos} cobranças · ${periodLabel(p.periodo)}`;
});

const textoDeAbertura = computed(() => {
  const p = processo.value;
  if (!p) return '';
  if (p.itens.length > 1) {
    return 'Para cada cliente, o valor do mês é calculado e a cobrança é criada no Asaas, com a descrição dos serviços. Quem já tem cobrança não é cobrado de novo.';
  }
  return p.itens[0].linha.invoice?.closedAt
    ? 'A cobrança é criada no Asaas com o valor do mês e a descrição dos serviços.'
    : 'O valor do mês é calculado e a cobrança é criada no Asaas, com a descrição dos serviços.';
});

const resumoRevisao = computed(() => {
  const linhasDoLote = (processo.value?.itens || []).map((item) => item.linha);
  return {
    total: linhasDoLote.length,
    emAndamento: linhasDoLote.filter((linha) => !linha.invoice?.closedAt).length,
    semValor: linhasDoLote.filter((linha) => !linha.invoice).length,
    semDocumento: linhasDoLote.filter((linha) => linha.faltaDocumento).length,
    divergentes: linhasDoLote.filter((linha) => linha.divergente).length,
    valorAtual: somar(linhasDoLote),
  };
});

const vencimentoValido = computed(() => {
  const valor = processo.value?.vencimento || '';
  return dataValida(valor) && valor >= hoje.value;
});

const podeIniciar = computed(() => Boolean(processo.value?.itens.length) && vencimentoValido.value);

const textoDeInicio = computed(() => {
  const quantos = processo.value?.itens.length || 0;
  return quantos > 1 ? `Gerar ${quantos} cobranças` : 'Gerar cobrança';
});

function notaDaRevisao(linha) {
  if (linha.faltaDocumento) return 'Sem CPF/CNPJ: não será gerada';
  if (linha.divergente) return 'Valor divergente: será recusada';
  return linha.invoice?.closedAt
    ? 'Será criada com o valor já calculado'
    : 'O valor será calculado e a cobrança criada';
}

const contagemDoProcesso = computed(() => {
  const itens = processo.value?.itens || [];
  const contar = (...etapas) => itens.filter((item) => etapas.includes(item.etapa)).length;
  return {
    total: itens.length,
    ok: contar('ok'),
    pulados: contar('pulado', 'cancelado'),
    erros: contar('erro'),
    feitos: contar('ok', 'pulado', 'erro', 'cancelado'),
  };
});
const percentualDoProcesso = computed(() => {
  const { total, feitos } = contagemDoProcesso.value;
  return total ? Math.round((feitos / total) * 100) : 0;
});
const repetiveis = computed(() => (processo.value?.itens || [])
  .filter((item) => item.etapa === 'erro' || item.etapa === 'cancelado'));

async function executarProcesso() {
  const p = processo.value;
  if (!p || processando.value || !podeIniciar.value) return;
  p.fase = 'executando';
  p.cancelado = false;

  await lote.executar(
    p.itens,
    { periodo: p.periodo, vencimento: p.vencimento },
    { concorrencia: CONCORRENCIA, deveParar: () => p.cancelado }
  );
  p.fase = 'concluido';

  // Contado antes de recarregar: durante a recarga o master já pode ter
  // fechado o modal, e aí o resumo sairia zerado.
  const { ok, erros, pulados } = contagemDoProcesso.value;
  limparSelecao();
  await depoisDaAcao(null);

  if (erros) notify.warning(`${ok} concluída(s), ${erros} com erro. O motivo de cada uma está na lista.`);
  else if (ok) notify.success(`${ok} ${ok === 1 ? 'cobrança concluída' : 'cobranças concluídas'}${pulados ? `, ${pulados} pulada(s)` : ''}.`);
  else notify.info('Nenhuma cobrança criada: todos os clientes foram pulados.');
}

/** Repete os que falharam ou não chegaram a rodar, com a linha recarregada. */
async function repetirFalhas() {
  const p = processo.value;
  if (!p || processando.value) return;
  if (!vencimentoValido.value) {
    // Virou o dia com o modal aberto: a data escolhida ficou no passado.
    notify.warning('O vencimento escolhido já passou. Feche esta janela e gere de novo com outra data.');
    return;
  }
  const atuais = new Map(linhas.value.map((linha) => [linha.uid, linha]));
  repetiveis.value.forEach((item) => {
    // Linha nova só para o mês da página; no histórico, fica a do painel.
    if (p.periodo === competencia.value) item.linha = atuais.get(item.uid) || item.linha;
    lote.concluir(item, 'aguardando', '', { pendencia: null });
  });
  await executarProcesso();
}

function fecharProcesso() {
  if (processando.value) return;
  processo.value = null;
}

/* ============================ Rota e ciclo de vida ============================ */

/* O mês fica na URL: F5 e link compartilhado abrem o mesmo mês. */
function sincronizarRota() {
  if (route.name !== NOME_DA_ROTA || route.query.competencia === competencia.value) return;
  router.replace({ query: { ...route.query, competencia: competencia.value } }).catch(() => {});
}

watch(competencia, () => {
  limparSelecao();
  expandido.value = null;
  sincronizarRota();
  carregar();
});

watch(() => route.query.competencia, () => {
  // A tela fica viva no keep-alive; mudança de query de OUTRA rota não é dela.
  if (route.name !== NOME_DA_ROTA) return;
  const daRota = competenciaDaRota();
  if (daRota !== competencia.value) competencia.value = daRota;
});

onMounted(() => {
  sincronizarRota();
  carregar();
});

/* keep-alive: a primeira ativação é a própria montagem. Nas seguintes os dados
 * podem ter mudado em outra tela. */
let ativadaUmaVez = false;
onActivated(() => {
  telaAtiva.value = true;
  if (!ativadaUmaVez) { ativadaUmaVez = true; return; }
  const daRota = competenciaDaRota();
  if (daRota !== competencia.value) competencia.value = daRota;
  else depoisDaAcao(null);
});

/* Modal teleportado para o body continuaria na tela depois de sair daqui. O lote
 * em andamento segue rodando e o modal volta a aparecer quando a tela voltar. */
onDeactivated(() => {
  telaAtiva.value = false;
  if (!processando.value) processo.value = null;
});
</script>

<style scoped>
/* Uma rolagem só, a da página. Nenhum contêiner aqui tem altura máxima com
   overflow: o cabeçalho da lista gruda logo abaixo da barra do topo (56px) e a
   barra de seleção gruda no pé da tela. */

/* ===================== BASE / LAYOUT ===================== */
.billing-wrapper {
  display: flex; min-height: 100vh;
  font-family: var(--font-sans); background-color: #f4f7fb; color: #0f172a;
}
.main-content { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.content-area {
  flex: 1; display: flex; flex-direction: column; min-width: 0;
  width: 100%; max-width: 1640px; margin: 0 auto;
  padding: 1.25rem 1.5rem 2.5rem; box-sizing: border-box;
}
button, input, select { font-family: var(--font-sans); }
.sr-only {
  position: absolute !important; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}

/* ===================== CABEÇALHO ===================== */
.page-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
.page-header__text { min-width: 0; }
.page-eyebrow {
  display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.2rem 0.55rem; margin-bottom: 0.45rem;
  border: 1px solid #bfdbfe; border-radius: 999px; background: #eff6ff; color: #1d4ed8;
  font-size: 0.68rem; font-weight: 750; letter-spacing: 0.02em; text-transform: uppercase;
}
.title { margin: 0; font-size: clamp(1.45rem, 2vw, 1.8rem); font-weight: 800; letter-spacing: -0.035em; color: #0f172a; }
.subtitle { margin: 0.2rem 0 0; max-width: 46rem; font-size: 0.86rem; color: #64748b; }
.header-actions { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }

.period-picker { display: inline-flex; align-items: center; min-height: 38px; border: 1px solid #dbe3ef; border-radius: 9px; background: #fff; overflow: hidden; }
.period-picker__step { display: grid; place-items: center; width: 34px; height: 38px; border: none; background: transparent; color: #475569; cursor: pointer; transition: background 0.15s, color 0.15s; }
.period-picker__step:hover:not(:disabled) { background: #eff6ff; color: #1d4ed8; }
.period-picker__step:disabled { opacity: 0.4; cursor: not-allowed; }
.period-picker__select {
  min-width: 11.5rem; height: 38px; padding: 0 0.5rem;
  border: none; border-left: 1px solid #eef2f7; border-right: 1px solid #eef2f7;
  background: #fff; color: #0f172a; font-size: 0.85rem; font-weight: 700; cursor: pointer;
}
.period-picker__select:focus-visible, .period-picker__step:focus-visible { outline: 2px solid #93c5fd; outline-offset: -2px; }
/* O mesmo ícone de seta serve para os dois lados do seletor de mês. */
.gira-esquerda { transform: rotate(90deg); }
.gira-direita { transform: rotate(-90deg); }

.link-btn {
  display: inline-flex; align-items: center; gap: 0.25rem; padding: 0; border: none; background: none;
  color: #1d4ed8; font-size: 0.78rem; font-weight: 700; cursor: pointer; text-decoration: underline; text-underline-offset: 2px;
}

/* ===================== RESUMO DO MÊS ===================== */
.resumo-mes {
  display: flex; flex-direction: column; gap: 0.8rem; margin-bottom: 0.9rem; padding: 1rem 1.1rem;
  border: 1px solid #dbe3ef; border-radius: 14px; background: #fff; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
}
.resumo-mes__topo { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.resumo-mes__titulo { display: flex; flex-direction: column; gap: 0.1rem; }
.resumo-mes__rotulo { color: #64748b; font-size: 0.7rem; font-weight: 750; letter-spacing: 0.05em; text-transform: uppercase; }
.resumo-mes__total { color: #0f172a; font-size: 1.75rem; font-weight: 850; letter-spacing: -0.035em; font-variant-numeric: tabular-nums; line-height: 1.15; }
.resumo-mes__sub { color: #64748b; font-size: 0.78rem; font-weight: 600; }
.resumo-mes__dica {
  max-width: 34rem; margin: 0; padding: 0.5rem 0.7rem; border: 1px solid #fde68a; border-radius: 9px;
  background: #fffbeb; color: #92400e; font-size: 0.75rem; line-height: 1.45;
}
.resumo-mes__barra { display: flex; height: 10px; overflow: hidden; border-radius: 999px; background: #eef2f7; }
.resumo-mes__barra span { height: 100%; transition: width 0.35s ease; }
.resumo-mes__barra .is-pagas { background: #10b981; }
.resumo-mes__barra .is-emitidas { background: #6366f1; }
.resumo-mes__barra .is-aCobrar { background: #3b82f6; }

.resumo-mes__kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.6rem; }
.kpi {
  display: grid; grid-template-columns: auto minmax(0, 1fr) auto; grid-template-areas: "marca rotulo numero" "marca valor numero";
  align-items: center; column-gap: 0.55rem; row-gap: 0.05rem; padding: 0.6rem 0.75rem;
  border: 1px solid #e2e8f0; border-radius: 11px; background: #f8fafc; text-align: left; cursor: pointer;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s, transform 0.15s;
}
.kpi:hover { border-color: #93c5fd; background: #fff; transform: translateY(-1px); }
.kpi:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25); }
.kpi.is-active { border-color: #2563eb; background: #eff6ff; box-shadow: 0 0 0 1px #2563eb inset; }
.kpi__marca { grid-area: marca; width: 10px; height: 34px; border-radius: 999px; background: #cbd5e1; }
.kpi.is-aCobrar .kpi__marca { background: #3b82f6; }
.kpi.is-emitidas .kpi__marca { background: #6366f1; }
.kpi.is-pagas .kpi__marca { background: #10b981; }
.kpi.is-pendencias .kpi__marca { background: #f59e0b; }
.kpi__rotulo { grid-area: rotulo; overflow: hidden; color: #475569; font-size: 0.74rem; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.kpi__valor { grid-area: valor; color: #64748b; font-size: 0.74rem; font-variant-numeric: tabular-nums; white-space: nowrap; }
.kpi__numero { grid-area: numero; color: #0f172a; font-size: 1.35rem; font-weight: 850; font-variant-numeric: tabular-nums; }
.resumo-mes__filtro { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; margin: 0; color: #475569; font-size: 0.8rem; }

/* ===================== FERRAMENTAS ===================== */
.table-controls {
  display: flex; align-items: center; gap: 0.7rem; flex-wrap: wrap; margin-bottom: 0.7rem; padding: 0.6rem 0.7rem;
  border: 1px solid #dbe3ef; border-radius: 12px; background: #fff; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}
.search-wrapper { position: relative; flex: 1 1 260px; min-width: 200px; max-width: 420px; }
.search-icon { position: absolute; left: 0.7rem; top: 50%; transform: translateY(-50%); width: 1rem; height: 1rem; color: #94a3b8; pointer-events: none; }
.search-input {
  width: 100%; min-height: 38px; box-sizing: border-box; padding: 0.5rem 2rem 0.5rem 2.1rem;
  border: 1px solid #dbe3ef; border-radius: 8px; background: #fff; color: #0f172a; font-size: 0.85rem;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.search-input::placeholder { color: #94a3b8; }
.search-input:focus { outline: none; border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12); }
.search-clear {
  position: absolute; right: 0.45rem; top: 50%; transform: translateY(-50%); display: grid; place-items: center;
  width: 20px; height: 20px; border: none; border-radius: 999px; background: #eef2f7; color: #64748b; cursor: pointer;
}
.search-clear:hover { background: #dbeafe; color: #1d4ed8; }

.controls-end { display: flex; align-items: center; gap: 0.8rem; margin-left: auto; flex-wrap: wrap; }
.sort { display: inline-flex; align-items: center; gap: 0.4rem; color: #64748b; font-size: 0.72rem; font-weight: 750; letter-spacing: 0.03em; text-transform: uppercase; }
.sort select {
  min-height: 34px; padding: 0 0.5rem; border: 1px solid #dbe3ef; border-radius: 8px; background: #fff;
  color: #0f172a; font-size: 0.8rem; font-weight: 650; letter-spacing: 0; text-transform: none; cursor: pointer;
}
.sort select:focus-visible { outline: none; border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12); }
.toggle-inactive { display: inline-flex; align-items: center; gap: 0.4rem; color: #475569; font-size: 0.78rem; font-weight: 650; white-space: nowrap; cursor: pointer; }
.toggle-inactive input { width: 15px; height: 15px; accent-color: #2563eb; cursor: pointer; }

/* ===================== LISTA ===================== */
/* A lista é um contêiner: o layout de cartão entra pela largura DELA, que muda
   com o menu lateral aberto ou recolhido, e não pela largura da janela. */
.lista {
  container-type: inline-size; container-name: lista;
  border: 1px solid #dbe3ef; border-radius: 14px; background: #fff; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
}

/* Colunas de largura FIXA onde há botão: cada linha é a sua própria grade, e
   uma coluna `auto` ficaria com larguras diferentes de uma linha para outra. */
.lista__cabecalho, .linha__resumo {
  display: grid;
  grid-template-columns: 24px minmax(11rem, 2.4fr) 7.5rem 5.5rem 9rem 7rem 9.75rem 7rem;
  align-items: center; gap: 0.65rem;
}
.lista__cabecalho {
  position: sticky; top: 56px; z-index: 6;
  padding: 0.55rem 1rem; border-bottom: 1px solid #dbe3ef; border-radius: 14px 14px 0 0; background: #f8fafc;
  color: #64748b; font-size: 0.66rem; font-weight: 750; letter-spacing: 0.05em; text-transform: uppercase;
}
.lista__cabecalho input, .linha__check input { width: 16px; height: 16px; accent-color: #2563eb; cursor: pointer; }
.lista__cabecalho input:disabled, .linha__check input:disabled { cursor: not-allowed; }
.col-num { text-align: right; }
.col-acoes { text-align: left; }

.lista__itens { margin: 0; padding: 0; list-style: none; }
.linha { border-bottom: 1px solid #eef2f7; scroll-margin-top: 104px; transition: background 0.15s, box-shadow 0.15s; }
.linha:last-child { border-bottom: none; }
.linha__resumo { padding: 0.65rem 1rem; cursor: pointer; }
.linha:hover .linha__resumo { background: #f8fbff; }
.linha.is-selecionada .linha__resumo { background: #eff6ff; }
.linha.is-expandida { position: relative; z-index: 1; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.1), 0 0 0 1px #93c5fd; }
.linha.is-expandida .linha__resumo { background: #eff6ff; }
.linha.is-inativa .linha__nome { color: #64748b; }

.linha__check { display: flex; align-items: center; justify-content: center; min-height: 24px; cursor: default; }
.linha__cliente { display: flex; flex-direction: column; min-width: 0; }
.linha__nome { overflow: hidden; color: #0f172a; font-size: 0.88rem; font-weight: 750; text-overflow: ellipsis; white-space: nowrap; }
.linha__detalhe { overflow: hidden; color: #94a3b8; font-size: 0.73rem; text-overflow: ellipsis; white-space: nowrap; }
.linha__tags { display: flex; flex-wrap: wrap; gap: 0.25rem; margin-top: 0.25rem; }

/* No desktop os três itens de `meta` viram colunas da grade. */
.linha__meta { display: contents; }
.meta-rotulo { display: none; }
.linha__venc { color: #475569; font-size: 0.8rem; font-variant-numeric: tabular-nums; white-space: nowrap; }
.linha__asaas { color: #4338ca; font-size: 0.78rem; font-weight: 650; line-height: 1.25; overflow-wrap: anywhere; }
.linha__asaas.is-overdue { color: #b91c1c; }
.linha__asaas.is-vazio { color: #cbd5e1; font-weight: 500; }
.linha__valor { display: flex; flex-direction: column; align-items: flex-end; white-space: nowrap; }
.linha__valor strong { color: #0f172a; font-size: 0.9rem; font-weight: 800; font-variant-numeric: tabular-nums; }
.linha__valor small { color: #c2410c; font-size: 0.66rem; font-weight: 700; }
.cell-muted { color: #94a3b8; font-size: 0.78rem; font-style: italic; }

.linha__acoes { display: flex; align-items: center; justify-content: flex-start; cursor: default; }
.linha__expandir {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.3rem;
  min-height: 32px; padding: 0 0.6rem; border: 1px solid #dbe3ef; border-radius: 9px; background: #fff; color: #475569;
  font-size: 0.76rem; font-weight: 700; cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.linha__expandir svg { transition: transform 0.2s; }
.linha__expandir:hover { border-color: #93c5fd; background: #eff6ff; color: #1d4ed8; }
.linha__expandir:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25); }
.linha.is-expandida .linha__expandir { border-color: #2563eb; background: #2563eb; color: #fff; }
.linha.is-expandida .linha__expandir svg { transform: rotate(180deg); }

.tag { display: inline-flex; align-items: center; padding: 0.08rem 0.4rem; border-radius: 5px; font-size: 0.66rem; font-weight: 750; white-space: nowrap; }
.tag.is-muted { background: #f1f5f9; color: #64748b; }
.tag.is-warning { background: #fff7ed; color: #c2410c; }
.tag.is-danger { background: #fef2f2; color: #b91c1c; }

.status-pill {
  display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.22rem 0.55rem; border-radius: 999px; white-space: nowrap;
  font-size: 0.68rem; font-weight: 750; letter-spacing: 0.02em; text-transform: uppercase;
}
.status-dot { width: 6px; height: 6px; border-radius: 999px; background: currentColor; }
.status-pill.is-muted { background: #f1f5f9; color: #64748b; }
.status-pill.is-ready { background: #eff6ff; color: #1d4ed8; }
.status-pill.is-sent { background: #eef2ff; color: #4338ca; }
.status-pill.is-overdue { background: #fef2f2; color: #b91c1c; }
.status-pill.is-paid { background: #ecfdf5; color: #047857; }

.lista__rodape {
  display: flex; align-items: center; justify-content: space-between; gap: 0.8rem; flex-wrap: wrap;
  padding: 0.7rem 1rem; border-top: 1px solid #eef2f7; border-radius: 0 0 14px 14px; background: #fff;
  color: #64748b; font-size: 0.76rem;
}
.lista__rodape strong { color: #0f172a; font-weight: 750; font-variant-numeric: tabular-nums; }

/* ===================== SELEÇÃO ===================== */
.bulk-bar {
  position: sticky; bottom: 1rem; z-index: 8;
  display: flex; align-items: center; justify-content: space-between; gap: 0.7rem; flex-wrap: wrap;
  margin-top: 0.8rem; padding: 0.65rem 0.8rem; border-radius: 14px;
  background: #0f172a; color: #e2e8f0; box-shadow: 0 16px 40px rgba(15, 23, 42, 0.3);
}
.bulk-bar__info { font-size: 0.82rem; }
.bulk-bar__info strong { color: #fff; font-variant-numeric: tabular-nums; }
.bulk-bar__actions { display: flex; gap: 0.45rem; flex-wrap: wrap; }

/* ===================== ESTADOS ===================== */
.feedback-state { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; padding: 3rem 1rem; text-align: center; color: #64748b; }
.feedback-state h3 { margin: 0; color: #0f172a; font-size: 0.98rem; font-weight: 750; }
.feedback-state p { margin: 0; font-size: 0.82rem; }
.feedback-state .btn { margin-top: 0.6rem; }
.feedback-icon { display: grid; place-items: center; width: 46px; height: 46px; margin-bottom: 0.3rem; border-radius: 999px; background: #eff6ff; color: #2563eb; }
.feedback-icon.is-error { background: #fef2f2; color: #dc2626; }

.linha.is-skeleton .linha__resumo { cursor: default; }
.linha.is-skeleton:hover .linha__resumo { background: transparent; }
.sk-lines { display: flex; flex-direction: column; gap: 6px; }
.sk { position: relative; overflow: hidden; display: inline-block; height: 12px; border-radius: 6px; background: #eef1f5; }
.sk::after {
  content: ""; position: absolute; inset: 0; transform: translateX(-100%);
  background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.6) 50%, rgba(255, 255, 255, 0) 100%);
  animation: sk-shimmer 1.2s infinite;
}
.sk--sm { height: 9px; }
.sk-check { width: 16px; height: 16px; border-radius: 4px; }
.sk-pill { height: 24px; border-radius: 999px; }
.sk-btn { height: 30px; border-radius: 8px; }
@keyframes sk-shimmer { 100% { transform: translateX(100%); } }

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
.btn-secondary:hover:not(:disabled) { border-color: #93c5fd; background-color: #eff6ff; color: #1d4ed8; }
.btn-light { background: #fff; border-color: #fff; color: #0f172a; }
.btn-light:hover:not(:disabled) { background: #e0e7ff; border-color: #e0e7ff; }
.btn-ghost-light { background: transparent; border-color: rgba(226, 232, 240, 0.35); color: #e2e8f0; }
.btn-ghost-light:hover:not(:disabled) { background: rgba(226, 232, 240, 0.12); }
.btn-sm { min-height: 32px; padding: 0.3rem 0.65rem; font-size: 0.78rem; }
.btn-xs { min-height: 30px; padding: 0.25rem 0.6rem; font-size: 0.75rem; border-radius: 8px; }
.is-spinning { animation: girar 0.9s linear infinite; }
@keyframes girar { to { transform: rotate(360deg); } }

/* ===================== MODAL ===================== */
.process { display: flex; flex-direction: column; gap: 0.85rem; }
.process__lead { margin: 0; color: #334155; font-size: 0.86rem; line-height: 1.5; }
.process__facts {
  display: flex; flex-direction: column; gap: 0.3rem; margin: 0; padding: 0.7rem 0.85rem; list-style: none;
  border: 1px solid #eef2f7; border-radius: 10px; background: #f8fafc; color: #334155; font-size: 0.8rem; line-height: 1.45;
}
.process__facts strong { font-variant-numeric: tabular-nums; }
.process__facts .is-warning { color: #9a3412; }
.process__facts .is-danger { color: #b91c1c; }

.due-date { display: flex; flex-direction: column; gap: 0.3rem; }
.due-date label { color: #334155; font-size: 0.8rem; font-weight: 700; }
.due-date input {
  width: 12rem; max-width: 100%; min-height: 38px; box-sizing: border-box; padding: 0.4rem 0.6rem;
  border: 1px solid #dbe3ef; border-radius: 8px; color: #0f172a; font-size: 0.86rem;
}
.due-date input:focus { outline: none; border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12); }
.due-date input[aria-invalid="true"] { border-color: #fca5a5; }
.due-date small { color: #64748b; font-size: 0.74rem; line-height: 1.4; }
.due-date small.is-error { color: #b91c1c; font-weight: 650; }

.process__notice {
  display: flex; align-items: flex-start; gap: 0.45rem; margin: 0; padding: 0.55rem 0.7rem;
  border: 1px solid #bfdbfe; border-radius: 9px; background: #eff6ff; color: #1e40af; font-size: 0.78rem; line-height: 1.45;
}
.process__notice svg { flex: 0 0 auto; margin-top: 0.1rem; }

.desc-preview { display: flex; flex-direction: column; gap: 0.35rem; }
.desc-preview__label { color: #64748b; font-size: 0.68rem; font-weight: 750; letter-spacing: 0.04em; text-transform: uppercase; }
.desc-preview__text {
  margin: 0; padding: 0.7rem 0.8rem; border: 1px solid #dbe3ef; border-radius: 9px; background: #0f172a;
  color: #e2e8f0; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.78rem; line-height: 1.55; white-space: pre-wrap; overflow-wrap: anywhere;
}
.desc-preview__meta { color: #64748b; font-size: 0.72rem; }
.desc-preview__meta.is-error { color: #b91c1c; font-weight: 650; }
.desc-preview__state { margin: 0; color: #475569; font-size: 0.8rem; line-height: 1.45; }
.desc-preview__state.is-error { color: #b91c1c; font-weight: 650; }

.progress { height: 8px; border-radius: 999px; background: #eef2f7; overflow: hidden; }
.progress__bar { display: block; height: 100%; border-radius: inherit; background: #2563eb; transition: width 0.25s ease; }
.process__counter { margin: 0; color: #475569; font-size: 0.8rem; font-variant-numeric: tabular-nums; }

.process__list { display: flex; flex-direction: column; margin: 0; padding: 0; list-style: none; border: 1px solid #eef2f7; border-radius: 10px; }
.process__item { display: flex; align-items: center; gap: 0.6rem; padding: 0.5rem 0.75rem; border-bottom: 1px solid #f1f5f9; font-size: 0.8rem; }
.process__item:last-child { border-bottom: none; }
.process__item-icon { display: grid; place-items: center; width: 22px; height: 22px; flex: 0 0 auto; border-radius: 999px; background: #f1f5f9; color: #94a3b8; }
.process__item.is-ok .process__item-icon { background: #ecfdf5; color: #059669; }
.process__item.is-erro .process__item-icon { background: #fef2f2; color: #dc2626; }
.process__item.is-pulado .process__item-icon,
.process__item.is-cancelado .process__item-icon { background: #fff7ed; color: #c2410c; }
.process__item.is-fechando .process__item-icon,
.process__item.is-vinculando .process__item-icon,
.process__item.is-emitindo .process__item-icon { background: #eff6ff; color: #2563eb; }
.process__item-body { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.process__item-name { overflow: hidden; color: #0f172a; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.process__item-note { color: #64748b; font-size: 0.74rem; line-height: 1.35; }
.process__item.is-erro .process__item-note { color: #b91c1c; }
.process__item-value { color: #0f172a; font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; }
.process__item-link {
  padding: 0; border: none; background: none; color: #1d4ed8; font-size: 0.75rem; font-weight: 700;
  white-space: nowrap; text-decoration: none; cursor: pointer;
}
.process__item-link:hover { text-decoration: underline; }
.spinner { width: 12px; height: 12px; border-radius: 999px; border: 2px solid #bfdbfe; border-top-color: #2563eb; animation: girar 0.8s linear infinite; }

/* ===================== RESPONSIVO =====================
   Lista estreita (menos de ~1040px úteis): a linha vira cartão de três faixas.
   Nada de rolagem horizontal em largura nenhuma. */
@media (max-width: 1180px) {
  .resumo-mes__kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@container lista (max-width: 1040px) {
  .lista__cabecalho { grid-template-columns: 28px minmax(0, 1fr); }
  .lista__cabecalho span:not(.col-check) { display: none; }
  .lista__cabecalho span:nth-child(2) { display: inline; }
  .linha__resumo {
    grid-template-columns: 28px minmax(0, 1fr) auto auto;
    grid-template-areas:
      "check cliente valor expandir"
      "check meta meta expandir"
      "check acoes acoes acoes";
    row-gap: 0.45rem;
  }
  .linha__check { grid-area: check; align-self: start; padding-top: 0.15rem; }
  .linha__cliente { grid-area: cliente; }
  .linha__meta { grid-area: meta; display: flex; flex-wrap: wrap; align-items: center; gap: 0.35rem 0.9rem; }
  .linha__valor { grid-area: valor; }
  .linha__acoes { grid-area: acoes; }
  .linha__expandir { grid-area: expandir; align-self: start; }
  .linha__asaas.is-vazio { display: none; }
  .meta-rotulo { display: inline; margin-right: 0.25rem; color: #94a3b8; font-size: 0.66rem; font-weight: 750; letter-spacing: 0.04em; text-transform: uppercase; }
}
@media (max-width: 760px) {
  .content-area { padding: 1rem; }
  .page-header { align-items: stretch; flex-direction: column; }
  .header-actions { width: 100%; }
  .period-picker { flex: 1 1 100%; }
  .period-picker__select { flex: 1; min-width: 0; }
  .table-controls { align-items: stretch; flex-direction: column; }
  .search-wrapper { max-width: none; }
  .controls-end { margin-left: 0; }
  .resumo-mes__kpis { grid-template-columns: 1fr; }
  .lista__cabecalho { position: static; }
  .bulk-bar { bottom: 0.5rem; }
}
@media (prefers-reduced-motion: reduce) {
  .is-spinning, .spinner, .sk::after { animation: none; }
  .progress__bar, .resumo-mes__barra span, .linha__expandir svg, .kpi { transition: none; }
}
</style>
