<!-- Tela geral de cobranças (master).
     Todos os clientes de uma competência num lugar só: fechar, conferir a
     descrição e emitir no Asaas, um cliente por vez ou em lote. As regras de
     segurança (lock, idempotência, fechar antes de cobrar) continuam no backend;
     esta tela só encadeia as mesmas rotas que a tela de cada cliente usa. -->
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
            <h1 class="title">Cobranças</h1>
            <p class="subtitle">Todos os clientes da competência: feche, confira e emita as cobranças no Asaas, um a um ou em lote.</p>
          </div>

          <div class="header-actions">
            <div class="period-picker" role="group" aria-label="Competência">
              <button
                type="button"
                class="period-picker__step"
                :disabled="ocupado"
                aria-label="Competência anterior"
                title="Competência anterior"
                @click="mudarCompetencia(-1)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              <label class="sr-only" for="cobrancas-competencia">Competência</label>
              <select id="cobrancas-competencia" v-model="competencia" class="period-picker__select" :disabled="ocupado">
                <option v-for="opcao in opcoesDeCompetencia" :key="opcao" :value="opcao">{{ periodLabel(opcao) }}</option>
              </select>
              <button
                type="button"
                class="period-picker__step"
                :disabled="ocupado || competencia >= competenciaCorrente"
                aria-label="Próxima competência"
                title="Próxima competência"
                @click="mudarCompetencia(1)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>

            <button
              type="button"
              class="btn btn-secondary btn-with-icon"
              :disabled="ocupado || abertasVisiveis.length === 0"
              title="Recalcula agora as competências abertas da lista. O fechamento também recalcula antes de congelar"
              @click="recalcularAbertas"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
              <template v-if="recalculo">Recalculando {{ recalculo.feitos }}/{{ recalculo.total }}...</template>
              <template v-else>Recalcular abertas ({{ abertasVisiveis.length }})</template>
            </button>
            <button
              type="button"
              class="btn btn-secondary btn-icon"
              :disabled="ocupado"
              title="Atualizar a lista"
              aria-label="Atualizar a lista"
              @click="carregar()"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" :class="{ 'is-spinning': carregando }"><path d="M21 12a9 9 0 1 1-2.64-6.36L21 8"></path><polyline points="21 3 21 8 16 8"></polyline></svg>
            </button>
          </div>
        </header>

        <!-- ================= INDICADORES ================= -->
        <div class="stats-strip">
          <div class="stat-tile">
            <span class="stat-tile__icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16l-3 -2l-2 2l-2 -2l-2 2l-2 -2l-3 2"></path><path d="M9 7h6"></path><path d="M9 11h6"></path><path d="M13 15h2"></path></svg>
            </span>
            <div class="stat-tile__body">
              <strong>{{ formatCurrency(indicadores.total.valor) }}</strong>
              <span>Total da competência · {{ indicadores.total.quantidade }} fatura(s)</span>
            </div>
          </div>
          <div class="stat-tile is-warning">
            <span class="stat-tile__icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
            </span>
            <div class="stat-tile__body">
              <strong>{{ indicadores.aFechar.quantidade }}</strong>
              <span>A fechar · {{ formatCurrency(indicadores.aFechar.valor) }} até agora</span>
            </div>
          </div>
          <div class="stat-tile is-info">
            <span class="stat-tile__icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </span>
            <div class="stat-tile__body">
              <strong>{{ indicadores.aEmitir.quantidade }}</strong>
              <span>A emitir · {{ formatCurrency(indicadores.aEmitir.valor) }}</span>
            </div>
          </div>
          <div class="stat-tile is-sent">
            <span class="stat-tile__icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </span>
            <div class="stat-tile__body">
              <strong>{{ indicadores.emitidas.quantidade }}</strong>
              <span>Aguardando pagamento · {{ formatCurrency(indicadores.emitidas.valor) }}</span>
            </div>
          </div>
          <div class="stat-tile is-success">
            <span class="stat-tile__icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </span>
            <div class="stat-tile__body">
              <strong>{{ indicadores.pagas.quantidade }}</strong>
              <span>Pagas · {{ formatCurrency(indicadores.pagas.valor) }}</span>
            </div>
          </div>
        </div>

        <!-- Competência aberta mostra o último valor gravado: a lista não
             recalcula sozinha, porque recalcular todo mundo a cada abertura
             varreria as vendas de todos os clientes. -->
        <p v-if="indicadores.aFechar.quantidade" class="page-hint">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          <span>
            Competências abertas mostram o último valor calculado. "Recalcular abertas" atualiza agora;
            fechar sempre recalcula antes de congelar.
            <template v-if="competencia === competenciaCorrente"> Este mês ainda está em andamento.</template>
          </span>
        </p>

        <!-- ================= FERRAMENTAS ================= -->
        <div class="table-controls">
          <div class="search-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <label class="sr-only" for="cobrancas-busca">Buscar cliente</label>
            <input id="cobrancas-busca" v-model="busca" type="text" class="search-input" placeholder="Buscar por código, nome, apelido ou e-mail..." />
            <button v-if="busca" type="button" class="search-clear" title="Limpar busca" aria-label="Limpar busca" @click="busca = ''">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <div class="status-filter-wrapper">
            <span class="filter-label">Situação</span>
            <div class="chip-row">
              <button
                v-for="opcao in FILTROS"
                :key="opcao.key"
                type="button"
                class="chip"
                :class="{ 'is-active': filtro === opcao.key }"
                :aria-pressed="filtro === opcao.key"
                :title="opcao.dica"
                @click="filtro = opcao.key"
              >
                {{ opcao.label }}
                <span class="chip__count">{{ contagemPorFiltro[opcao.key] }}</span>
              </button>
            </div>
          </div>

          <label class="toggle-inactive">
            <input v-model="mostrarInativos" type="checkbox" />
            Mostrar inativos<template v-if="!mostrarInativos && inativosOcultos"> ({{ inativosOcultos }})</template>
          </label>

          <span class="results-count">
            {{ linhasFiltradas.length }} {{ linhasFiltradas.length === 1 ? 'cliente' : 'clientes' }}
          </span>
        </div>

        <!-- ================= AÇÕES EM LOTE ================= -->
        <div v-if="selecionadas.length" class="bulk-bar" role="region" aria-label="Ações em lote">
          <span class="bulk-bar__info">
            <strong>{{ selecionadas.length }}</strong> {{ selecionadas.length === 1 ? 'cliente selecionado' : 'clientes selecionados' }}
            · {{ formatCurrency(totalSelecionado) }} no valor atual
          </span>
          <div class="bulk-bar__actions">
            <button type="button" class="btn btn-secondary btn-sm" :disabled="ocupado" @click="limparSelecao">Limpar seleção</button>
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              :disabled="ocupado || selecionadasAbertas.length === 0"
              title="Só congela o valor. Nenhuma cobrança é criada"
              @click="abrirProcesso('fechar', selecionadasAbertas)"
            >
              Só fechar ({{ selecionadasAbertas.length }})
            </button>
            <button
              type="button"
              class="btn btn-primary btn-sm btn-with-icon"
              :disabled="ocupado"
              title="Fecha o que estiver aberto e emite a cobrança de cada cliente no Asaas"
              @click="abrirProcesso('emitir', selecionadas)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              Gerar cobranças ({{ selecionadas.length }})
            </button>
          </div>
        </div>

        <!-- ================= TABELA ================= -->
        <div class="table-container">
          <div class="table-wrapper">
            <table v-if="carregando && !visao" class="billing-table" aria-busy="true">
              <thead>
                <tr>
                  <th class="col-check"></th>
                  <th>Cliente</th>
                  <th>Situação</th>
                  <th class="col-num">Valor</th>
                  <th>Vencimento</th>
                  <th>Asaas</th>
                  <th class="col-actions">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="n in 8" :key="`sk-${n}`" class="is-skeleton">
                  <td class="col-check"><div class="sk sk-check"></div></td>
                  <td>
                    <div class="sk-lines">
                      <div class="sk sk-text" style="width: 180px"></div>
                      <div class="sk sk-text sk-text--sm" style="width: 130px"></div>
                    </div>
                  </td>
                  <td><div class="sk sk-pill" style="width: 76px"></div></td>
                  <td class="col-num"><div class="sk sk-text" style="width: 80px"></div></td>
                  <td><div class="sk sk-text" style="width: 72px"></div></td>
                  <td><div class="sk sk-text" style="width: 110px"></div></td>
                  <td class="col-actions"><div class="sk sk-btn" style="width: 150px"></div></td>
                </tr>
              </tbody>
            </table>

            <div v-else-if="erroCarga && !visao" class="feedback-state">
              <span class="feedback-icon is-error" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              </span>
              <h3>Não foi possível carregar as cobranças</h3>
              <p>{{ erroCarga }}</p>
              <button type="button" class="btn btn-secondary btn-sm" @click="carregar()">Tentar de novo</button>
            </div>

            <div v-else-if="linhasFiltradas.length === 0" class="feedback-state">
              <span class="feedback-icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </span>
              <h3>Nenhum cliente nesta visão</h3>
              <p>Ajuste a busca, troque o filtro ou escolha outra competência.</p>
              <button
                v-if="busca || filtro !== 'todas'"
                type="button"
                class="btn btn-secondary btn-sm"
                @click="busca = ''; filtro = 'todas'"
              >
                Limpar filtros
              </button>
            </div>

            <table v-else class="billing-table">
              <thead>
                <tr>
                  <th class="col-check">
                    <input
                      type="checkbox"
                      :checked="todasMarcadas"
                      :indeterminate="algumasMarcadas"
                      :disabled="ocupado || selecionaveisVisiveis.length === 0"
                      aria-label="Selecionar todos os clientes da lista que podem ser cobrados"
                      @change="alternarTodas($event.target.checked)"
                    />
                  </th>
                  <th>Cliente</th>
                  <th>Situação</th>
                  <th class="col-num">Valor</th>
                  <th>Vencimento</th>
                  <th>Asaas</th>
                  <th class="col-actions">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="linha in linhasFiltradas"
                  :key="linha.uid"
                  :class="{ 'is-selected': selecionados.has(linha.uid), 'row-inactive': !linha.active }"
                >
                  <td class="col-check">
                    <input
                      v-if="linha.selecionavel"
                      type="checkbox"
                      :checked="selecionados.has(linha.uid)"
                      :disabled="ocupado"
                      :aria-label="`Selecionar ${linha.nome}`"
                      @change="alternarSelecao(linha.uid, $event.target.checked)"
                    />
                  </td>

                  <td>
                    <div class="client-cell">
                      <span class="client-cell__name">{{ linha.nome }}</span>
                      <span v-if="linha.detalhe" class="client-cell__meta">{{ linha.detalhe }}</span>
                      <span v-if="!linha.active || linha.faltaDocumento || linha.divergente" class="client-cell__tags">
                        <span v-if="!linha.active" class="tag is-muted">Inativo</span>
                        <span
                          v-if="linha.faltaDocumento && linha.selecionavel"
                          class="tag is-warning"
                          title="Sem CPF/CNPJ não há como criar o cliente no Asaas. Complete o cadastro na tela do cliente"
                        >Sem CPF/CNPJ</span>
                        <span
                          v-if="linha.divergente"
                          class="tag is-danger"
                          title="Os itens não somam o total congelado. Reabra e feche a competência na tela do cliente para recalcular"
                        >Itens ≠ total</span>
                      </span>
                    </div>
                  </td>

                  <td>
                    <span class="status-pill" :class="classeDaSituacao(linha)" :title="SITUACOES[linha.situacao].dica">
                      <span class="status-dot" aria-hidden="true"></span>
                      {{ SITUACOES[linha.situacao].label }}
                    </span>
                  </td>

                  <td class="col-num">
                    <template v-if="linha.invoice">
                      <span class="money">{{ formatCurrency(linha.total) }}</span>
                      <small v-if="linha.situacao === 'aberta'" class="cell-hint">até agora</small>
                    </template>
                    <span v-else class="cell-muted">—</span>
                  </td>

                  <td class="cell-date">
                    {{ linha.invoice?.dueDate ? formatarData(linha.invoice.dueDate) : '—' }}
                  </td>

                  <td>
                    <template v-if="linha.invoice?.asaasPaymentId">
                      <span class="asaas-status" :class="{ 'is-overdue': linha.invoice.asaasStatus === 'OVERDUE' }">
                        {{ asaasStatusLabel(linha.invoice.asaasStatus) || 'Emitida' }}
                      </span>
                    </template>
                    <span v-else class="cell-muted">{{ linha.situacao === 'paga' ? 'Baixa manual' : 'Não emitida' }}</span>
                  </td>

                  <td class="actions-cell">
                    <div class="row-actions">
                      <template v-if="linha.situacao === 'sem_fatura' || linha.situacao === 'aberta'">
                        <button
                          type="button"
                          class="btn btn-primary btn-xs"
                          :disabled="ocupado || ocupados.has(linha.uid)"
                          title="Fecha a competência (o valor é recalculado e congelado) e emite a cobrança"
                          @click="abrirProcesso('emitir', [linha])"
                        >
                          Fechar e cobrar
                        </button>
                        <button
                          type="button"
                          class="btn btn-secondary btn-xs"
                          :disabled="ocupado || ocupados.has(linha.uid)"
                          title="Só congela o valor, sem criar cobrança"
                          @click="fecharUma(linha)"
                        >
                          {{ ocupados.has(linha.uid) ? 'Fechando...' : 'Fechar' }}
                        </button>
                      </template>

                      <template v-else-if="linha.situacao === 'a_emitir'">
                        <button
                          type="button"
                          class="btn btn-primary btn-xs"
                          :disabled="ocupado"
                          title="Emite a cobrança no Asaas com a descrição dos serviços"
                          @click="abrirProcesso('emitir', [linha])"
                        >
                          Emitir cobrança
                        </button>
                        <button
                          type="button"
                          class="btn btn-secondary btn-xs"
                          :disabled="ocupado"
                          title="Mostra o texto que vai na cobrança: cada serviço com quantidade e valor"
                          @click="abrirDescricao(linha)"
                        >
                          Descrição
                        </button>
                      </template>

                      <template v-else-if="linha.situacao === 'emitida' || linha.situacao === 'paga'">
                        <a
                          v-if="linha.invoice?.asaasInvoiceUrl"
                          class="btn btn-secondary btn-xs"
                          :href="linha.invoice.asaasInvoiceUrl"
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Abre a fatura no Asaas, do jeito que o cliente vê"
                        >
                          Abrir fatura
                        </a>
                        <button
                          v-if="linha.invoice?.asaasPaymentId"
                          type="button"
                          class="btn btn-secondary btn-xs"
                          :disabled="ocupado || ocupados.has(linha.uid)"
                          title="Relê o status no Asaas. Use se o pagamento entrou e a lista não atualizou"
                          @click="sincronizar(linha)"
                        >
                          {{ ocupados.has(linha.uid) ? 'Sincronizando...' : 'Sincronizar' }}
                        </button>
                      </template>

                      <router-link
                        :to="rotaDoCliente(linha.uid)"
                        class="btn-icon-link"
                        :title="`Abrir a cobrança de ${linha.nome}`"
                        :aria-label="`Abrir a cobrança de ${linha.nome}`"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                      </router-link>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="visao && linhasFiltradas.length" class="table-footer">
            <span class="table-footer__info">
              <strong>{{ linhasFiltradas.length }}</strong> {{ linhasFiltradas.length === 1 ? 'cliente' : 'clientes' }} nesta visão
              · <strong>{{ formatCurrency(totalFiltrado) }}</strong>
            </span>
            <span class="table-footer__info">{{ periodLabel(competencia) }} · vencimento padrão {{ formatarData(visao.standardDueDate) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= FECHAR / EMITIR (um ou vários) ================= -->
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
          <p class="process__lead">
            <template v-if="processo.modo === 'fechar'">
              O valor de cada competência é recalculado uma última vez e congelado. Nenhuma cobrança é criada.
            </template>
            <template v-else-if="processo.itens.length === 1">
              {{ processo.itens[0].linha.invoice?.closedAt
                ? 'A cobrança é criada no Asaas com o valor congelado e a descrição dos serviços.'
                : 'A competência é fechada (o valor é recalculado e congelado) e a cobrança é criada no Asaas em seguida.' }}
            </template>
            <template v-else>
              Para cada cliente: fecha a competência se ainda estiver aberta e cria a cobrança no Asaas com a
              descrição dos serviços. Um cliente por vez, sem cobrar duas vezes quem já tiver cobrança.
            </template>
          </p>

          <ul class="process__facts">
            <li><strong>{{ resumoRevisao.total }}</strong> {{ resumoRevisao.total === 1 ? 'cliente' : 'clientes' }} · {{ formatCurrency(resumoRevisao.valorAtual) }} no valor atual</li>
            <li v-if="resumoRevisao.aFechar">
              <strong>{{ resumoRevisao.aFechar }}</strong> com a competência aberta: o valor pode mudar ao fechar.
              <template v-if="resumoRevisao.semValor"> ({{ resumoRevisao.semValor }} ainda sem valor calculado: use "Recalcular abertas" antes para conferir.)</template>
            </li>
            <li v-if="processo.modo === 'emitir' && resumoRevisao.semDocumento" class="is-warning">
              <strong>{{ resumoRevisao.semDocumento }}</strong> sem CPF/CNPJ: a competência é fechada, mas a cobrança fica para depois do cadastro.
            </li>
            <li v-if="processo.modo === 'emitir' && resumoRevisao.divergentes" class="is-danger">
              <strong>{{ resumoRevisao.divergentes }}</strong> com itens que não somam o total: o backend recusa a emissão até a competência ser recalculada.
            </li>
          </ul>

          <div v-if="processo.modo === 'emitir'" class="due-date">
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
              <template v-else>Padrão da competência: {{ formatarData(visao?.standardDueDate) }}. A fatura passa a mostrar a data emitida.</template>
            </small>
          </div>

          <p v-if="processo.modo === 'emitir'" class="process__notice">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            O Asaas avisa {{ processo.itens.length === 1 ? 'o cliente' : 'cada cliente' }} assim que a cobrança é criada, conforme as notificações configuradas na conta.
          </p>

          <!-- Prévia só para um cliente com valor já congelado: com vários, seriam
               N requisições para um texto que cada linha mostra em "Descrição". -->
          <div v-if="processo.previaCarregando || processo.previa || processo.previaErro" class="desc-preview">
            <span class="desc-preview__label">Descrição que vai para o Asaas</span>
            <p v-if="processo.previaCarregando" class="desc-preview__state">Montando a descrição...</p>
            <p v-else-if="processo.previaErro" class="desc-preview__state is-error">{{ processo.previaErro }}</p>
            <template v-else-if="processo.previa">
              <pre class="desc-preview__text">{{ processo.previa.description }}</pre>
              <small class="desc-preview__meta" :class="{ 'is-error': !processo.previa.matches }">
                {{ processo.previa.length }}/{{ processo.previa.limit }} caracteres
                <template v-if="processo.previa.groupedItems"> · {{ processo.previa.groupedItems }} serviços agrupados para caber no limite do Asaas</template>
                <template v-if="!processo.previa.matches"> · os itens não somam o total: a emissão será recusada</template>
              </small>
            </template>
          </div>

          <ul class="process__list">
            <li v-for="item in processo.itens" :key="item.uid" class="process__item">
              <div class="process__item-body">
                <span class="process__item-name">{{ item.nome }}</span>
                <span class="process__item-note">{{ notaDaRevisao(item.linha) }}</span>
              </div>
              <span class="process__item-value">{{ item.linha.invoice ? formatCurrency(item.linha.total) : '—' }}</span>
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
                <svg v-if="item.etapa === 'ok'" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <svg v-else-if="item.etapa === 'erro'" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                <svg v-else-if="item.etapa === 'pulado' || item.etapa === 'cancelado'" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                <span v-else-if="item.etapa !== 'aguardando'" class="spinner"></span>
              </span>
              <div class="process__item-body">
                <span class="process__item-name">{{ item.nome }}</span>
                <span class="process__item-note">{{ item.mensagem || ETAPAS[item.etapa] }}</span>
              </div>
              <span class="process__item-value">{{ item.total !== null && item.total !== undefined ? formatCurrency(item.total) : '' }}</span>
              <a
                v-if="item.invoiceUrl"
                class="process__item-link"
                :href="item.invoiceUrl"
                target="_blank"
                rel="noopener noreferrer"
              >Abrir</a>
              <router-link
                v-else-if="item.pendencia === 'dados' && !processando"
                class="process__item-link"
                :to="rotaDoCliente(item.uid)"
              >Completar cadastro</router-link>
            </li>
          </ul>
        </template>
      </div>

      <template #footer>
        <template v-if="processo?.fase === 'revisao'">
          <button type="button" class="btn btn-secondary" @click="fecharProcesso">Cancelar</button>
          <button type="button" class="btn btn-primary" :disabled="!podeIniciar" @click="executarProcesso">
            {{ textoDeInicio }}
          </button>
        </template>
        <template v-else-if="processando">
          <button type="button" class="btn btn-secondary" :disabled="processo.cancelado" @click="processo.cancelado = true">
            {{ processo.cancelado ? 'Parando...' : 'Parar após os atuais' }}
          </button>
        </template>
        <template v-else-if="processo">
          <button v-if="repetiveis.length" type="button" class="btn btn-secondary" @click="repetirFalhas">
            Tentar de novo ({{ repetiveis.length }})
          </button>
          <button type="button" class="btn btn-primary" @click="fecharProcesso">Concluir</button>
        </template>
      </template>
    </UniversalModal>

    <!-- ================= PRÉVIA DA DESCRIÇÃO ================= -->
    <UniversalModal
      :is-open="Boolean(previa) && telaAtiva"
      :title="previa ? `Descrição da cobrança · ${previa.nome}` : 'Descrição da cobrança'"
      size="md"
      @close="previa = null"
    >
      <div v-if="previa" class="desc-preview desc-preview--modal">
        <p v-if="previa.carregando" class="desc-preview__state">Montando a descrição...</p>
        <p v-else-if="previa.erro" class="desc-preview__state is-error">{{ previa.erro }}</p>
        <template v-else-if="previa.dados">
          <pre class="desc-preview__text">{{ previa.dados.description }}</pre>
          <small class="desc-preview__meta" :class="{ 'is-error': !previa.dados.matches }">
            {{ previa.dados.length }}/{{ previa.dados.limit }} caracteres · {{ previa.dados.itemCount }} serviço(s)
            <template v-if="previa.dados.groupedItems"> · {{ previa.dados.groupedItems }} agrupados para caber no limite do Asaas</template>
          </small>
          <p v-if="!previa.dados.matches" class="desc-preview__state is-error">
            Os itens somam {{ formatCurrency(previa.dados.itemsTotal) }} e o total congelado é {{ formatCurrency(previa.dados.total) }}.
            A emissão é recusada até a competência ser reaberta e fechada de novo na tela do cliente.
          </p>
          <p v-else-if="!previa.dados.closed" class="desc-preview__state">
            Competência aberta: os valores ainda podem mudar até o fechamento.
          </p>
        </template>
      </div>
      <template #footer>
        <button type="button" class="btn btn-primary" @click="previa = null">Fechar</button>
      </template>
    </UniversalModal>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onActivated, onDeactivated } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import SidebarComponent from '@/components/SidebarComponent.vue';
import TopbarComponent from '@/components/TopbarComponent.vue';
import UniversalModal from '@/components/UniversalModal.vue';
import { useBilling } from '@/composables/useBilling';
import { useConfirm } from '@/composables/useConfirm';
import { useNotification } from '@/composables/useNotification';
import { asaasStatusLabel } from '@/utils/asaasStatus';
import { criarLoteDeCobranca, codigoDoErro } from '@/utils/loteDeCobranca';

const route = useRoute();
const router = useRouter();
const notify = useNotification();
const { confirm } = useConfirm();
const {
  fetchBillingOverview,
  refreshBillingOverview,
  fetchChargePreview,
  closeInvoicePeriod,
  ensureAsaasCustomer,
  issueCharge,
  syncCharge,
} = useBilling();

const NOME_DA_ROTA = 'MasterCobrancasView';

/* ============================ Competência ============================ */

const PERIODO_VALIDO = /^\d{4}-(0[1-9]|1[0-2])$/;
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/** "2026-08" -> "Agosto de 2026". */
function periodLabel(period) {
  const [ano, mes] = String(period || '').split('-').map(Number);
  if (!ano || !mes || mes < 1 || mes > 12) return period || '';
  const nome = MESES[mes - 1];
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} de ${ano}`;
}

/** Competência AAAA-MM deslocada `delta` meses. */
function deslocarCompetencia(period, delta) {
  const [ano, mes] = period.split('-').map(Number);
  const data = new Date(Date.UTC(ano, mes - 1 + delta, 1));
  return `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, '0')}`;
}

/* Datas civis de Brasília, as mesmas que o backend usa para recusar
 * vencimento no passado. O fuso do navegador não entra na conta. */
function partesDeHojeNoBrasil() {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const valor = (tipo) => partes.find((p) => p.type === tipo)?.value;
  return { ano: valor('year'), mes: valor('month'), dia: valor('day') };
}
const competenciaDeHoje = () => { const { ano, mes } = partesDeHojeNoBrasil(); return `${ano}-${mes}`; };
const dataDeHoje = () => { const { ano, mes, dia } = partesDeHojeNoBrasil(); return `${ano}-${mes}-${dia}`; };

const competenciaCorrente = ref(competenciaDeHoje());

/* Padrão: o mês ANTERIOR. O fechamento acontece depois que o mês acaba, então
 * é a competência que o master abre esta tela para cobrar. */
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

/* ============================ Formatação ============================ */

const formatCurrency = (valor) => (Number(valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const paraCentavos = (valor) => Math.round((Number(valor) || 0) * 100);

/** "2026-09-10" -> "10/09/2026", sem passar pelo fuso do navegador. */
function formatarData(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '—';
}

function somarDias(iso, dias) {
  const data = new Date(`${iso}T00:00:00Z`);
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}

const normalizarBusca = (texto) => String(texto || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/* ============================ Dados ============================ */

const visao = ref(null);
const carregando = ref(false);
const erroCarga = ref('');
let geracaoDaCarga = 0;

/**
 * Carrega a visão da competência selecionada.
 *
 * `silencioso` mantém a lista na tela enquanto recarrega (depois de uma ação);
 * a carga normal limpa a lista quando a competência mudou, para não exibir os
 * números de um mês sob o título de outro. Resposta atrasada de uma
 * competência anterior é descartada pela geração.
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
    erroCarga.value = mensagemDeErro(e, 'Não foi possível carregar as cobranças da competência.');
    // Com a lista anterior ainda na tela, o estado de erro não aparece: avisa por fora.
    if (visao.value) notify.error(erroCarga.value);
  } finally {
    if (geracao === geracaoDaCarga) carregando.value = false;
  }
}

/* ============================ Linhas ============================ */

const SITUACOES = {
  sem_fatura: { label: 'Sem fatura', classe: 'is-muted', dica: 'Ainda não calculada nesta competência. Fechar calcula e congela o valor.' },
  aberta: { label: 'Aberta', classe: 'is-live', dica: 'O valor ainda pode mudar até o fechamento.' },
  zerada: { label: 'Sem valor', classe: 'is-muted', dica: 'Fechada com total zero: não há o que cobrar.' },
  a_emitir: { label: 'A emitir', classe: 'is-ready', dica: 'Fechada e pronta para emitir no Asaas.' },
  emitida: { label: 'Emitida', classe: 'is-sent', dica: 'Cobrança criada no Asaas, aguardando pagamento.' },
  paga: { label: 'Paga', classe: 'is-paid', dica: 'Pagamento confirmado.' },
};

/* Só o que ainda tem passo a dar entra na seleção em lote. */
const SELECIONAVEIS = new Set(['sem_fatura', 'aberta', 'a_emitir']);

function situacaoDe(cliente) {
  const fatura = cliente.invoice;
  if (!fatura) return 'sem_fatura';
  if (fatura.status === 'paid') return 'paga';
  if (fatura.asaasPaymentId) return 'emitida';
  if (!fatura.closedAt) return 'aberta';
  if (!(fatura.total > 0)) return 'zerada';
  return 'a_emitir';
}

function classeDaSituacao(linha) {
  if (linha.situacao === 'emitida' && linha.invoice?.asaasStatus === 'OVERDUE') return 'is-overdue';
  return SITUACOES[linha.situacao].classe;
}

const linhas = computed(() => (visao.value?.clients || [])
  .map((cliente) => {
    const fatura = cliente.invoice;
    const situacao = situacaoDe(cliente);
    return {
      ...cliente,
      nome: cliente.name || cliente.mlNickname || cliente.email || cliente.uid,
      detalhe: [cliente.name && cliente.mlNickname ? cliente.mlNickname : null, cliente.email].filter(Boolean).join(' · '),
      situacao,
      total: fatura ? fatura.total : null,
      // Vinculado ao Asaas já não depende do documento local para cobrar.
      faltaDocumento: !cliente.linked && !cliente.hasDocument,
      divergente: Boolean(fatura?.closedAt && !fatura.asaasPaymentId && fatura.status !== 'paid' && !fatura.itemsMatch),
      selecionavel: SELECIONAVEIS.has(situacao),
      termoDeBusca: normalizarBusca([cliente.name, cliente.mlNickname, cliente.email].filter(Boolean).join(' ')),
    };
  })
  .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true, sensitivity: 'base' })));

/* Inativo sem nada na competência é ruído; inativo com valor, cobrança ou
 * pagamento continua aparecendo, porque ainda há o que acompanhar. */
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

const FILTROS = [
  { key: 'todas', label: 'Todas', dica: 'Todos os clientes da competência' },
  { key: 'a_fechar', label: 'A fechar', dica: 'Competência aberta ou ainda sem fatura' },
  { key: 'a_emitir', label: 'A emitir', dica: 'Fechada e sem cobrança no Asaas' },
  { key: 'emitidas', label: 'Emitidas', dica: 'Cobrança criada, aguardando pagamento' },
  { key: 'pagas', label: 'Pagas', dica: 'Pagamento confirmado' },
  { key: 'pendencias', label: 'Pendências', dica: 'Sem CPF/CNPJ ou com itens que não somam o total' },
];

function passaNoFiltro(linha, chave) {
  switch (chave) {
    case 'a_fechar': return linha.situacao === 'sem_fatura' || linha.situacao === 'aberta';
    case 'a_emitir': return linha.situacao === 'a_emitir';
    case 'emitidas': return linha.situacao === 'emitida';
    case 'pagas': return linha.situacao === 'paga';
    case 'pendencias': return linha.selecionavel && (linha.faltaDocumento || linha.divergente);
    default: return true;
  }
}

const filtro = ref('todas');
const contagemPorFiltro = computed(() => Object.fromEntries(FILTROS.map(({ key }) => [
  key, linhasBuscadas.value.filter((linha) => passaNoFiltro(linha, key)).length,
])));
const linhasFiltradas = computed(() => linhasBuscadas.value.filter((linha) => passaNoFiltro(linha, filtro.value)));

/** Soma em centavos: somar float de reais acumula erro de arredondamento. */
const somar = (lista) => lista.reduce((soma, linha) => soma + paraCentavos(linha.total), 0) / 100;
const resumir = (lista) => ({ quantidade: lista.length, valor: somar(lista) });

const indicadores = computed(() => {
  const escopo = linhasNoEscopo.value;
  return {
    total: resumir(escopo.filter((linha) => linha.total > 0)),
    aFechar: resumir(escopo.filter((linha) => linha.situacao === 'sem_fatura' || linha.situacao === 'aberta')),
    aEmitir: resumir(escopo.filter((linha) => linha.situacao === 'a_emitir')),
    emitidas: resumir(escopo.filter((linha) => linha.situacao === 'emitida')),
    pagas: resumir(escopo.filter((linha) => linha.situacao === 'paga')),
  };
});
const totalFiltrado = computed(() => somar(linhasFiltradas.value));
const abertasVisiveis = computed(() => linhasFiltradas.value
  .filter((linha) => linha.situacao === 'sem_fatura' || linha.situacao === 'aberta'));

const rotaDoCliente = (uid) => ({ name: 'ManageUserDetail', params: { uid, tab: 'cobranca' } });

/* ============================ Seleção ============================ */

/* O Set é sempre substituído, nunca mutado: a troca da referência é o que
 * garante que tudo que depende da seleção recalcule. */
const selecionados = ref(new Set());

const selecionadas = computed(() => linhasNoEscopo.value
  .filter((linha) => linha.selecionavel && selecionados.value.has(linha.uid)));
const selecionadasAbertas = computed(() => selecionadas.value.filter((linha) => !linha.invoice?.closedAt));
const totalSelecionado = computed(() => somar(selecionadas.value));
const selecionaveisVisiveis = computed(() => linhasFiltradas.value.filter((linha) => linha.selecionavel));
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

/** Depois de recarregar, fica selecionado só quem ainda tem passo a dar. */
function podarSelecao() {
  const validos = new Set(linhas.value.filter((linha) => linha.selecionavel).map((linha) => linha.uid));
  selecionados.value = new Set([...selecionados.value].filter((uid) => validos.has(uid)));
}

/* ============================ Erros ============================ */

/** Texto para o master, a partir do `code` do backend quando a mensagem crua não diz o que fazer. */
function mensagemDeErro(e, padrao = 'Não foi possível concluir a operação.') {
  switch (codigoDoErro(e)) {
    case 'billing_busy':
      return 'Outra operação de cobrança deste cliente está em andamento. Tente de novo em instantes.';
    case 'provider_unauthorized':
      return 'O Asaas recusou a chave de API. Confira ASAAS_API_KEY e ASAAS_ENV no servidor.';
    case 'not_configured':
      return 'Integração com o Asaas não configurada no servidor (ASAAS_API_KEY).';
    case 'provider_rate_limited':
      return 'O Asaas limitou as requisições. Aguarde um minuto e tente de novo.';
    case 'timeout':
    case 'network_error':
      return 'O Asaas não respondeu a tempo. Nada foi duplicado; tente de novo.';
    default:
      // Sem status HTTP: a requisição nem chegou ao servidor.
      if (e && !e.status && e.name === 'TypeError') return 'Sem resposta do servidor. Confira a conexão e tente de novo.';
      return e?.message || padrao;
  }
}

/* ============================ Ações de uma linha ============================ */

const ocupados = ref(new Set());
function marcarOcupado(uid, sim) {
  const proximo = new Set(ocupados.value);
  if (sim) proximo.add(uid); else proximo.delete(uid);
  ocupados.value = proximo;
}

/** Fecha sem emitir. A confirmação diz o que muda: o valor deixa de mudar. */
async function fecharUma(linha) {
  const periodo = competencia.value;
  const confirmado = await confirm({
    title: `Fechar ${periodLabel(periodo)}`,
    message: `${linha.nome}: o valor é recalculado uma última vez e passa a ser definitivo.`,
    detail: 'Vendas e avulsos que chegarem depois entram na competência seguinte. Para reabrir, use a tela do cliente.',
    confirmText: 'Fechar competência',
    tone: 'primary',
  });
  if (!confirmado) return;

  marcarOcupado(linha.uid, true);
  try {
    const resposta = await closeInvoicePeriod(linha.uid, periodo);
    notify.success(`${linha.nome}: competência fechada em ${formatCurrency(resposta?.invoice?.total_amount)}.`);
  } catch (e) {
    if (codigoDoErro(e) === 'already_closed') notify.info(`${linha.nome}: a competência já estava fechada.`);
    else notify.error(mensagemDeErro(e, 'Não foi possível fechar a competência.'));
  } finally {
    marcarOcupado(linha.uid, false);
    await carregar({ silencioso: true });
  }
}

/** Relê o status no Asaas. É o caminho de conferência quando um webhook se perdeu. */
async function sincronizar(linha) {
  marcarOcupado(linha.uid, true);
  try {
    const resposta = await syncCharge(linha.uid, competencia.value);
    notify.success(`${linha.nome}: ${asaasStatusLabel(resposta?.status) || 'status atualizado'}.`);
  } catch (e) {
    notify.error(mensagemDeErro(e, 'Não foi possível sincronizar com o Asaas.'));
  } finally {
    marcarOcupado(linha.uid, false);
    await carregar({ silencioso: true });
  }
}

/* ---------------- Prévia da descrição ---------------- */

const previa = ref(null);
let geracaoDaPrevia = 0;

async function abrirDescricao(linha) {
  const geracao = ++geracaoDaPrevia;
  previa.value = { geracao, nome: linha.nome, carregando: true, erro: '', dados: null };
  try {
    const dados = await fetchChargePreview(linha.uid, competencia.value);
    if (previa.value?.geracao === geracao) previa.value.dados = dados;
  } catch (e) {
    if (previa.value?.geracao === geracao) {
      previa.value.erro = e?.status === 404
        ? 'Este cliente ainda não tem fatura nesta competência.'
        : mensagemDeErro(e, 'Não foi possível montar a descrição.');
    }
  } finally {
    if (previa.value?.geracao === geracao) previa.value.carregando = false;
  }
}

/* ---------------- Recalcular abertas ---------------- */

/* Em lotes: cada recálculo varre as vendas do cliente, e o backend aceita no
 * máximo 25 por chamada justamente para a requisição não cair no timeout. */
const LOTE_DE_RECALCULO = 10;
const recalculo = ref(null);

async function recalcularAbertas() {
  const alvos = abertasVisiveis.value.map((linha) => linha.uid);
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
      notify.warning(`${alvos.length - falhas} recalculada(s); ${falhas} não puderam ser recalculadas agora. Tente de novo em instantes.`);
    } else {
      notify.success(`${alvos.length} competência(s) aberta(s) recalculada(s).`);
    }
  } catch (e) {
    notify.error(mensagemDeErro(e, 'Não foi possível recalcular as competências abertas.'));
  } finally {
    recalculo.value = null;
    await carregar({ silencioso: true });
  }
}

/* ============================ Fechar / emitir em lote ============================
 *
 * O passo a passo de cada cliente (fechar -> vincular no Asaas -> emitir, com
 * repetição do que for passageiro) está em utils/loteDeCobranca.js, sem Vue,
 * para poder ser testado com dublês. Aqui fica só o estado da tela.
 * ============================================================================ */

/* Dois de cada vez: metade do tempo do lote, bem abaixo do teto de 5 locks por
 * processo do backend e longe do recálculo em paralelo que já esgotou o pool. */
const CONCORRENCIA = 2;

const lote = criarLoteDeCobranca({
  api: { closeInvoicePeriod, ensureAsaasCustomer, issueCharge },
  formatarValor: formatCurrency,
  formatarData,
  mensagemDeErro,
});

const ETAPAS = {
  aguardando: 'Na fila',
  fechando: 'Fechando a competência...',
  vinculando: 'Vinculando o cliente no Asaas...',
  emitindo: 'Emitindo a cobrança...',
  ok: 'Concluído',
  pulado: 'Pulado',
  erro: 'Erro',
  cancelado: 'Não processado',
};

const processo = ref(null);
const telaAtiva = ref(true);
const processando = computed(() => processo.value?.fase === 'executando');
const ocupado = computed(() => carregando.value || Boolean(recalculo.value) || processando.value);

const hoje = computed(() => visao.value?.today || dataDeHoje());

/* Vencimento padrão da competência; se já passou, cinco dias a partir de hoje
 * (o mesmo prazo que a tela do cliente sugere). */
const vencimentoSugerido = computed(() => {
  const padrao = visao.value?.standardDueDate;
  return padrao && padrao >= hoje.value ? padrao : somarDias(hoje.value, 5);
});

function abrirProcesso(modo, alvo) {
  const lista = (alvo || []).filter((linha) => linha.selecionavel);
  if (!lista.length || ocupado.value) return;

  processo.value = {
    modo,
    periodo: competencia.value,
    fase: 'revisao',
    cancelado: false,
    vencimento: vencimentoSugerido.value,
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
  if (modo === 'emitir' && unica?.invoice?.closedAt) carregarPreviaDoProcesso(unica);
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
  if (p.modo === 'fechar') return `Fechar ${quantos === 1 ? 'competência' : `${quantos} competências`} · ${periodLabel(p.periodo)}`;
  if (quantos === 1) return `Cobrança de ${p.itens[0].nome} · ${periodLabel(p.periodo)}`;
  return `Gerar ${quantos} cobranças · ${periodLabel(p.periodo)}`;
});

const resumoRevisao = computed(() => {
  const linhasDoLote = (processo.value?.itens || []).map((item) => item.linha);
  return {
    total: linhasDoLote.length,
    aFechar: linhasDoLote.filter((linha) => !linha.invoice?.closedAt).length,
    semValor: linhasDoLote.filter((linha) => !linha.invoice).length,
    semDocumento: linhasDoLote.filter((linha) => linha.faltaDocumento).length,
    divergentes: linhasDoLote.filter((linha) => linha.divergente).length,
    valorAtual: somar(linhasDoLote),
  };
});

const vencimentoValido = computed(() => {
  const valor = processo.value?.vencimento || '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const data = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === valor && valor >= hoje.value;
});

const podeIniciar = computed(() => Boolean(processo.value?.itens.length)
  && (processo.value.modo === 'fechar' || vencimentoValido.value));

const textoDeInicio = computed(() => {
  const p = processo.value;
  if (!p) return '';
  const quantos = p.itens.length;
  if (p.modo === 'fechar') return quantos === 1 ? 'Fechar competência' : `Fechar ${quantos} competências`;
  if (quantos > 1) return `Gerar ${quantos} cobranças`;
  return p.itens[0].linha.invoice?.closedAt ? 'Emitir cobrança' : 'Fechar e emitir';
});

function notaDaRevisao(linha) {
  const fechada = Boolean(linha.invoice?.closedAt);
  if (processo.value?.modo === 'emitir') {
    if (linha.faltaDocumento) return fechada ? 'Sem CPF/CNPJ: não será emitida' : 'Será fechada; sem CPF/CNPJ, a cobrança fica para depois';
    if (linha.divergente) return 'Itens não somam o total: emissão será recusada';
    if (!linha.linked) return fechada ? 'Será vinculada ao Asaas e emitida' : 'Será fechada, vinculada ao Asaas e emitida';
    return fechada ? 'Valor congelado: será emitida' : 'Será fechada e emitida';
  }
  return linha.invoice ? 'Será recalculada e fechada' : 'Será calculada e fechada';
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
    { modo: p.modo, periodo: p.periodo, vencimento: p.vencimento },
    { concorrencia: CONCORRENCIA, deveParar: () => p.cancelado }
  );
  p.fase = 'concluido';

  // Contado antes de recarregar: durante a recarga o master já pode ter
  // fechado o modal, e aí o resumo sairia zerado.
  const { ok, erros, pulados } = contagemDoProcesso.value;
  limparSelecao();
  await carregar({ silencioso: true });

  const feito = p.modo === 'fechar' ? 'fechada(s)' : 'concluída(s)';
  if (erros) notify.warning(`${ok} ${feito}, ${erros} com erro. O motivo de cada uma está na lista.`);
  else if (ok) notify.success(`${ok} ${feito}${pulados ? `, ${pulados} pulada(s)` : ''}.`);
  else notify.info('Nenhuma alteração: todos os clientes foram pulados.');
}

/** Repete os que falharam ou não chegaram a rodar, com a linha recarregada. */
async function repetirFalhas() {
  const p = processo.value;
  if (!p || processando.value) return;
  if (p.modo === 'emitir' && !vencimentoValido.value) {
    // Virou o dia com o modal aberto: a data escolhida ficou no passado.
    notify.warning('O vencimento escolhido já passou. Feche esta janela e gere de novo com outra data.');
    return;
  }
  const atuais = new Map(linhas.value.map((linha) => [linha.uid, linha]));
  repetiveis.value.forEach((item) => {
    item.linha = atuais.get(item.uid) || item.linha;
    lote.concluir(item, 'aguardando', '', { pendencia: null });
  });
  await executarProcesso();
}

function fecharProcesso() {
  if (processando.value) return;
  processo.value = null;
}

/* ============================ Rota e ciclo de vida ============================ */

/* A competência fica na URL: F5 e link compartilhado abrem o mesmo mês. */
function sincronizarRota() {
  if (route.name !== NOME_DA_ROTA || route.query.competencia === competencia.value) return;
  router.replace({ query: { ...route.query, competencia: competencia.value } }).catch(() => {});
}

watch(competencia, () => {
  limparSelecao();
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

/* keep-alive: a primeira ativação é a própria montagem. Nas seguintes (voltando
 * da tela de um cliente, por exemplo) os dados podem ter mudado. */
let ativadaUmaVez = false;
onActivated(() => {
  telaAtiva.value = true;
  if (!ativadaUmaVez) { ativadaUmaVez = true; return; }
  const daRota = competenciaDaRota();
  if (daRota !== competencia.value) competencia.value = daRota;
  else carregar({ silencioso: Boolean(visao.value) });
});

/* Modal teleportado para o body continuaria na tela depois de sair daqui. O lote
 * em andamento segue rodando e o modal volta a aparecer quando a tela voltar. */
onDeactivated(() => {
  telaAtiva.value = false;
  previa.value = null;
  if (!processando.value) processo.value = null;
});
</script>

<style scoped>
/* Mesmo vocabulário visual da tela de usuários (cabeçalho, faixa de
   indicadores, barra de ferramentas e tabela), para o master não trocar de
   linguagem ao passar de uma tela para a outra. */

/* ===================== BASE / LAYOUT ===================== */
.billing-wrapper {
  display: flex;
  min-height: 100vh;
  font-family: var(--font-sans);
  background-color: #f8fafc;
  color: #0f172a;
}
.main-content { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  width: 100%;
  max-width: 1640px;
  margin: 0 auto;
  padding: 1.25rem 1.5rem 2.5rem;
  box-sizing: border-box;
}
button, input, select, table { font-family: var(--font-sans); }

.sr-only {
  position: absolute !important; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}

/* ===================== CABEÇALHO ===================== */
.page-header {
  display: flex; justify-content: space-between; align-items: flex-end;
  gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem;
}
.page-header__text { min-width: 0; }
.page-eyebrow {
  display: inline-flex; align-items: center; gap: 0.35rem;
  padding: 0.2rem 0.55rem; margin-bottom: 0.45rem;
  border: 1px solid #bfdbfe; border-radius: 999px;
  background: #eff6ff; color: #1d4ed8;
  font-size: 0.68rem; font-weight: 750; letter-spacing: 0.02em; text-transform: uppercase;
}
.title {
  margin: 0; font-size: clamp(1.45rem, 2vw, 1.8rem); font-weight: 800;
  letter-spacing: -0.035em; color: #0f172a;
}
.subtitle { margin: 0.2rem 0 0; font-size: 0.86rem; color: #64748b; }
.header-actions { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }

.period-picker {
  display: inline-flex; align-items: center; min-height: 38px;
  border: 1px solid #dbe3ef; border-radius: 9px; background: #fff; overflow: hidden;
}
.period-picker__step {
  display: grid; place-items: center; width: 34px; height: 38px;
  border: none; background: transparent; color: #475569; cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.period-picker__step:hover:not(:disabled) { background: #eff6ff; color: #1d4ed8; }
.period-picker__step:disabled { opacity: 0.4; cursor: not-allowed; }
.period-picker__select {
  min-width: 11.5rem; height: 38px; padding: 0 0.5rem;
  border: none; border-left: 1px solid #eef2f7; border-right: 1px solid #eef2f7;
  background: #fff; color: #0f172a; font-size: 0.85rem; font-weight: 700; cursor: pointer;
}
.period-picker__select:focus-visible { outline: 2px solid #93c5fd; outline-offset: -2px; }
.period-picker__step:focus-visible { outline: 2px solid #93c5fd; outline-offset: -2px; }

/* ===================== INDICADORES ===================== */
.stats-strip {
  display: grid; grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.7rem; margin-bottom: 0.8rem;
}
.stat-tile {
  display: flex; align-items: center; gap: 0.7rem; min-width: 0;
  padding: 0.75rem 0.85rem;
  border: 1px solid #dbe3ef; border-radius: 10px; background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.035);
}
.stat-tile__icon {
  display: grid; place-items: center; width: 34px; height: 34px; flex: 0 0 auto;
  border-radius: 9px; background: #eff6ff; color: #2563eb;
}
.stat-tile.is-warning .stat-tile__icon { background: #fff7ed; color: #c2410c; }
.stat-tile.is-info .stat-tile__icon { background: #eff6ff; color: #1d4ed8; }
.stat-tile.is-sent .stat-tile__icon { background: #eef2ff; color: #4338ca; }
.stat-tile.is-success .stat-tile__icon { background: #ecfdf5; color: #059669; }
.stat-tile__body { min-width: 0; display: flex; flex-direction: column; }
.stat-tile__body strong {
  color: #0f172a; font-size: 1.15rem; font-weight: 800;
  letter-spacing: -0.02em; font-variant-numeric: tabular-nums; line-height: 1.15;
}
.stat-tile__body span {
  margin-top: 0.08rem; overflow: hidden; color: #64748b;
  font-size: 0.7rem; font-weight: 600; text-overflow: ellipsis; white-space: nowrap;
}

.page-hint {
  display: flex; align-items: flex-start; gap: 0.45rem;
  margin: 0 0 0.8rem; padding: 0.55rem 0.75rem;
  border: 1px solid #fde68a; border-radius: 9px; background: #fffbeb;
  color: #92400e; font-size: 0.78rem; line-height: 1.45;
}
.page-hint svg { flex: 0 0 auto; margin-top: 0.12rem; }

/* ===================== FERRAMENTAS ===================== */
.table-controls {
  display: flex; align-items: center; gap: 0.7rem; flex-wrap: wrap;
  padding: 0.6rem 0.7rem; margin-bottom: 0.7rem;
  border: 1px solid #dbe3ef; border-radius: 12px; background: #fff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}
.search-wrapper { position: relative; flex: 1 1 260px; min-width: 220px; max-width: 380px; }
.search-icon {
  position: absolute; left: 0.7rem; top: 50%; transform: translateY(-50%);
  width: 1rem; height: 1rem; color: #94a3b8; pointer-events: none;
}
.search-input {
  width: 100%; min-height: 38px; box-sizing: border-box;
  padding: 0.5rem 2rem 0.5rem 2.1rem;
  font-size: 0.85rem; color: #0f172a;
  border: 1px solid #dbe3ef; border-radius: 8px; background: #fff;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.search-input::placeholder { color: #94a3b8; }
.search-input:focus { outline: none; border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12); }
.search-clear {
  position: absolute; right: 0.45rem; top: 50%; transform: translateY(-50%);
  display: grid; place-items: center; width: 20px; height: 20px;
  border: none; border-radius: 999px; background: #eef2f7; color: #64748b; cursor: pointer;
}
.search-clear:hover { background: #dbeafe; color: #1d4ed8; }

.status-filter-wrapper { display: flex; align-items: center; gap: 0.5rem; min-width: 0; }
.filter-label {
  color: #64748b; font-size: 0.68rem; font-weight: 750;
  letter-spacing: 0.04em; text-transform: uppercase; white-space: nowrap;
}
.chip-row { display: flex; align-items: center; gap: 0.3rem; flex-wrap: wrap; }
.chip {
  display: inline-flex; align-items: center; gap: 0.35rem;
  min-height: 32px; padding: 0.32rem 0.62rem;
  border: 1px solid #dbe3ef; border-radius: 8px; background: #fff;
  color: #475569; font-size: 0.78rem; font-weight: 650; white-space: nowrap; cursor: pointer;
  transition: border-color 140ms, background 140ms, color 140ms;
}
.chip:hover { border-color: #93c5fd; background: #f8fbff; color: #1d4ed8; }
.chip.is-active { border-color: #93c5fd; background: #eff6ff; color: #1d4ed8; }
.chip__count {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 20px; padding: 0 0.25rem; border-radius: 999px;
  background: #f1f5f9; color: #64748b;
  font-size: 0.68rem; font-weight: 750; font-variant-numeric: tabular-nums;
}
.chip.is-active .chip__count { background: #2563eb; color: #fff; }

.toggle-inactive {
  display: inline-flex; align-items: center; gap: 0.4rem;
  color: #475569; font-size: 0.78rem; font-weight: 650; white-space: nowrap; cursor: pointer;
}
.toggle-inactive input { width: 15px; height: 15px; accent-color: #2563eb; cursor: pointer; }

.results-count {
  margin-left: auto; color: #64748b; font-size: 0.74rem; font-weight: 650; white-space: nowrap;
}

/* ===================== LOTE ===================== */
.bulk-bar {
  position: sticky; top: 0.5rem; z-index: 5;
  display: flex; align-items: center; justify-content: space-between; gap: 0.7rem; flex-wrap: wrap;
  margin-bottom: 0.7rem; padding: 0.55rem 0.75rem;
  border: 1px solid #93c5fd; border-radius: 12px; background: #eff6ff;
  box-shadow: 0 8px 22px rgba(37, 99, 235, 0.12);
}
.bulk-bar__info { color: #1e3a8a; font-size: 0.82rem; }
.bulk-bar__info strong { font-variant-numeric: tabular-nums; }
.bulk-bar__actions { display: flex; gap: 0.45rem; flex-wrap: wrap; }

/* ===================== TABELA ===================== */
.table-container {
  background-color: #fff; border: 1px solid #dbe3ef; border-radius: 12px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05); overflow: hidden;
}
.table-wrapper { width: 100%; max-width: 100%; max-height: min(70vh, 820px); overflow: auto; }
.billing-table { width: 100%; min-width: 1040px; border-collapse: separate; border-spacing: 0; }
.billing-table th, .billing-table td {
  padding: 0.65rem 0.9rem; text-align: left; border-bottom: 1px solid #eef2f7; vertical-align: middle;
}
.billing-table th {
  position: sticky; top: 0; z-index: 2;
  background-color: #f8fafc; color: #64748b;
  font-weight: 750; font-size: 0.68rem; letter-spacing: 0.05em; text-transform: uppercase;
  border-bottom: 1px solid #dbe3ef; white-space: nowrap;
}
.billing-table td { font-size: 0.85rem; color: #0f172a; }
.billing-table tbody tr:nth-child(even) { background-color: #fcfdff; }
.billing-table tbody tr:hover { background-color: #f8fbff; }
.billing-table tbody tr.is-selected { background-color: #eff6ff; }
.billing-table tbody tr:last-child td { border-bottom: none; }

.col-check { width: 2.25rem; padding-right: 0 !important; }
.col-check input { width: 16px; height: 16px; accent-color: #2563eb; cursor: pointer; }
.col-check input:disabled { cursor: not-allowed; }
.col-num { text-align: right !important; white-space: nowrap; }
.col-actions { width: 1%; text-align: right !important; }

.client-cell { display: flex; flex-direction: column; min-width: 0; max-width: 26rem; }
.client-cell__name {
  overflow: hidden; color: #0f172a; font-size: 0.86rem; font-weight: 700;
  text-overflow: ellipsis; white-space: nowrap;
}
.client-cell__meta {
  overflow: hidden; color: #94a3b8; font-size: 0.73rem; text-overflow: ellipsis; white-space: nowrap;
}
.client-cell__tags { display: flex; flex-wrap: wrap; gap: 0.25rem; margin-top: 0.25rem; }
.row-inactive .client-cell__name { color: #475569; }

.tag {
  display: inline-flex; align-items: center; padding: 0.08rem 0.4rem; border-radius: 5px;
  font-size: 0.66rem; font-weight: 750; letter-spacing: 0.01em; white-space: nowrap;
}
.tag.is-muted { background: #f1f5f9; color: #64748b; }
.tag.is-warning { background: #fff7ed; color: #c2410c; }
.tag.is-danger { background: #fef2f2; color: #b91c1c; }

.status-pill {
  display: inline-flex; align-items: center; gap: 0.35rem;
  padding: 0.22rem 0.55rem; border-radius: 999px; white-space: nowrap;
  font-size: 0.7rem; font-weight: 750; letter-spacing: 0.02em; text-transform: uppercase;
}
.status-dot { width: 6px; height: 6px; border-radius: 999px; background: currentColor; }
.status-pill.is-muted { background: #f1f5f9; color: #64748b; }
.status-pill.is-live { background: #fff7ed; color: #c2410c; }
.status-pill.is-ready { background: #eff6ff; color: #1d4ed8; }
.status-pill.is-sent { background: #eef2ff; color: #4338ca; }
.status-pill.is-overdue { background: #fef2f2; color: #b91c1c; }
.status-pill.is-paid { background: #ecfdf5; color: #047857; }

.money { font-weight: 750; font-variant-numeric: tabular-nums; }
.cell-hint { display: block; color: #c2410c; font-size: 0.68rem; font-weight: 650; }
.cell-muted { color: #94a3b8; font-size: 0.8rem; }
.cell-date { color: #475569; font-variant-numeric: tabular-nums; white-space: nowrap; }
.asaas-status { color: #4338ca; font-size: 0.8rem; font-weight: 650; }
.asaas-status.is-overdue { color: #b91c1c; }

.actions-cell { white-space: nowrap; }
.row-actions { display: inline-flex; align-items: center; justify-content: flex-end; gap: 0.35rem; }
.btn-icon-link {
  display: inline-grid; place-items: center; width: 30px; height: 30px;
  border: 1px solid #dbe3ef; border-radius: 8px; background: #fff; color: #64748b;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}
.btn-icon-link:hover { border-color: #93c5fd; background: #eff6ff; color: #1d4ed8; }
.btn-icon-link:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2); }

/* ===================== ESTADOS ===================== */
.feedback-state {
  display: flex; flex-direction: column; align-items: center; gap: 0.4rem;
  padding: 3rem 1rem; text-align: center; color: #64748b;
}
.feedback-state h3 { margin: 0; color: #0f172a; font-size: 0.98rem; font-weight: 750; }
.feedback-state p { margin: 0; font-size: 0.82rem; }
.feedback-state .btn { margin-top: 0.6rem; }
.feedback-icon {
  display: grid; place-items: center; width: 46px; height: 46px; margin-bottom: 0.3rem;
  border-radius: 999px; background: #eff6ff; color: #2563eb;
}
.feedback-icon.is-error { background: #fef2f2; color: #dc2626; }

.is-skeleton:hover { background: transparent !important; }
.sk-lines { display: flex; flex-direction: column; gap: 6px; }
.sk { position: relative; overflow: hidden; display: inline-block; height: 12px; border-radius: 6px; background: #eef1f5; }
.sk::after {
  content: ""; position: absolute; inset: 0; transform: translateX(-100%);
  background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.6) 50%, rgba(255, 255, 255, 0) 100%);
  animation: sk-shimmer 1.2s infinite;
}
.sk-text--sm { height: 9px; }
.sk-check { width: 16px; height: 16px; border-radius: 4px; }
.sk-pill { height: 24px; border-radius: 999px; }
.sk-btn { height: 30px; border-radius: 8px; }
@keyframes sk-shimmer { 100% { transform: translateX(100%); } }

.table-footer {
  display: flex; align-items: center; justify-content: space-between; gap: 0.8rem; flex-wrap: wrap;
  padding: 0.7rem 1rem; border-top: 1px solid #eef2f7; background: #fff;
}
.table-footer__info { color: #64748b; font-size: 0.76rem; }
.table-footer__info strong { color: #0f172a; font-weight: 750; font-variant-numeric: tabular-nums; }

/* ===================== BOTÕES ===================== */
.btn {
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 0.82rem; font-weight: 700; padding: 0.45rem 0.8rem; min-height: 38px;
  border-radius: 9px; border: 1px solid transparent; cursor: pointer; text-decoration: none; white-space: nowrap;
  transition: background-color 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s, opacity 0.15s;
}
.btn:disabled { opacity: 0.55; cursor: not-allowed; }
.btn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25); }
.btn-with-icon { gap: 0.4rem; }
.btn-primary { background-color: #2563eb; color: #fff; border-color: #2563eb; box-shadow: 0 6px 16px rgba(37, 99, 235, 0.18); }
.btn-primary:hover:not(:disabled) { background-color: #1d4ed8; border-color: #1d4ed8; }
.btn-secondary { background-color: #fff; color: #475569; border-color: #dbe3ef; }
.btn-secondary:hover:not(:disabled) { border-color: #93c5fd; background-color: #eff6ff; color: #1d4ed8; }
.btn-sm { min-height: 32px; padding: 0.3rem 0.65rem; font-size: 0.78rem; }
.btn-xs { min-height: 30px; padding: 0.25rem 0.6rem; font-size: 0.75rem; border-radius: 8px; box-shadow: none; }
.btn-icon { width: 38px; padding: 0; }
.is-spinning { animation: girar 0.9s linear infinite; }
@keyframes girar { to { transform: rotate(360deg); } }

/* ===================== MODAL DO LOTE ===================== */
.process { display: flex; flex-direction: column; gap: 0.85rem; }
.process__lead { margin: 0; color: #334155; font-size: 0.86rem; line-height: 1.5; }
.process__facts {
  display: flex; flex-direction: column; gap: 0.3rem; margin: 0; padding: 0.7rem 0.85rem;
  list-style: none; border: 1px solid #eef2f7; border-radius: 10px; background: #f8fafc;
  color: #334155; font-size: 0.8rem; line-height: 1.45;
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
  border: 1px solid #bfdbfe; border-radius: 9px; background: #eff6ff;
  color: #1e40af; font-size: 0.78rem; line-height: 1.45;
}
.process__notice svg { flex: 0 0 auto; margin-top: 0.1rem; }

.desc-preview { display: flex; flex-direction: column; gap: 0.35rem; }
.desc-preview__label {
  color: #64748b; font-size: 0.68rem; font-weight: 750; letter-spacing: 0.04em; text-transform: uppercase;
}
.desc-preview__text {
  margin: 0; padding: 0.7rem 0.8rem; max-height: 16rem; overflow: auto;
  border: 1px solid #dbe3ef; border-radius: 9px; background: #f8fafc;
  color: #0f172a; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.78rem; line-height: 1.55; white-space: pre-wrap; overflow-wrap: anywhere;
}
.desc-preview__meta { color: #64748b; font-size: 0.72rem; }
.desc-preview__meta.is-error { color: #b91c1c; font-weight: 650; }
.desc-preview__state { margin: 0; color: #475569; font-size: 0.8rem; line-height: 1.45; }
.desc-preview__state.is-error { color: #b91c1c; font-weight: 650; }

.progress { height: 8px; border-radius: 999px; background: #eef2f7; overflow: hidden; }
.progress__bar { display: block; height: 100%; border-radius: inherit; background: #2563eb; transition: width 0.25s ease; }
.process__counter { margin: 0; color: #475569; font-size: 0.8rem; font-variant-numeric: tabular-nums; }

.process__list {
  display: flex; flex-direction: column; margin: 0; padding: 0; list-style: none;
  max-height: 18rem; overflow: auto; border: 1px solid #eef2f7; border-radius: 10px;
}
.process__item {
  display: flex; align-items: center; gap: 0.6rem; padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #f1f5f9; font-size: 0.8rem;
}
.process__item:last-child { border-bottom: none; }
.process__item-icon {
  display: grid; place-items: center; width: 22px; height: 22px; flex: 0 0 auto;
  border-radius: 999px; background: #f1f5f9; color: #94a3b8;
}
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
.process__item-link { color: #1d4ed8; font-size: 0.75rem; font-weight: 700; white-space: nowrap; text-decoration: none; }
.process__item-link:hover { text-decoration: underline; }

.spinner {
  width: 12px; height: 12px; border-radius: 999px;
  border: 2px solid #bfdbfe; border-top-color: #2563eb; animation: girar 0.8s linear infinite;
}

/* ===================== RESPONSIVO ===================== */
@media (max-width: 1380px) {
  .stats-strip { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 860px) {
  .stats-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 760px) {
  .content-area { padding: 1rem; }
  .page-header { align-items: stretch; flex-direction: column; }
  .header-actions { width: 100%; }
  .period-picker { flex: 1 1 100%; }
  .period-picker__select { flex: 1; min-width: 0; }
  .stats-strip { grid-template-columns: 1fr; }
  .table-controls { align-items: stretch; flex-direction: column; }
  .search-wrapper { max-width: none; }
  .status-filter-wrapper { align-items: flex-start; flex-direction: column; gap: 0.35rem; }
  .results-count { margin-left: 0; }
  .bulk-bar { position: static; }
  .table-wrapper { max-height: none; }
  .billing-table th { position: static; }
}
@media (prefers-reduced-motion: reduce) {
  .is-spinning, .spinner, .sk::after { animation: none; }
  .progress__bar { transition: none; }
}
</style>
