<template>
  <div class="dashboard-wrapper" :class="{ 'is-modal-view': isModalView }">
    <div class="main-content">
      <div class="dashboard-content" ref="contentArea">

        <div v-if="isLoading" class="skeleton-loader">
          <div class="sk-header"></div>
          <div class="sk-filters">
            <div class="sk-filter-group"></div>
            <div class="sk-action-button"></div>
          </div>
          <div class="sk-grid-5">
            <div class="sk-card" v-for="n in 5" :key="n">
              <div class="sk-card-title"></div>
              <div class="sk-card-value"></div>
              <div class="sk-card-description"></div>
            </div>
          </div>
          <div class="sk-table-header">
            <div class="sk-table-title"></div>
          </div>
          <div class="sk-table">
            <div class="sk-table-head">
              <div class="sk-head-cell" v-for="m in 5" :key="m"></div>
            </div>
            <div class="sk-row" v-for="n in 5" :key="n">
              <div class="sk-cell" v-for="m in 5" :key="m"></div>
            </div>
          </div>
        </div>

        <div v-else-if="error" class="error-state">{{ error }}</div>

        <template v-else>
          <div class="filters-and-actions">
            <div class="filters">
              <div class="filter-group">
                <label for="period-filter">Selecione a Competência:</label>
                <select id="period-filter" v-model="selectedPeriod" @change="handlePeriodChange" class="filter-select">
                  <option v-for="p in availablePeriods" :key="p" :value="p">
                    {{ p }}
                  </option>
                </select>
              </div>
            </div>
            <div class="actions">
              <!-- SVG inline: o projeto nunca carregou o CSS do Font Awesome,
                   então as tags <i class="fas ..."> daqui não desenhavam nada.
                   O botão aparecia só com o texto e um espaço vazio na frente. -->
              <button
                @click="openManualServiceModal"
                class="action-button action-button--ghost"
                :disabled="isPeriodClosed"
                :title="isPeriodClosed
                  ? 'A competência está fechada: o valor não muda mais. Reabra para lançar'
                  : 'Lança um serviço pontual nesta competência'"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                Lançar avulso
              </button>

              <!-- Baixa do PAGAMENTO. Rótulo antigo era "Reabrir fatura", que
                   se confundia com reabrir a competência: são coisas
                   diferentes, uma mexe no status e a outra no congelamento. -->
              <button
                v-if="currentInvoice"
                @click="toggleInvoicePayment"
                class="action-button"
                :class="isCurrentInvoicePaid ? 'action-button--ghost' : 'action-button--pay'"
                :disabled="isUpdatingStatus"
              >
                <svg v-if="isCurrentInvoicePaid" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v5h5"></path><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"></path></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                {{ isUpdatingStatus ? 'Salvando...' : (isCurrentInvoicePaid ? 'Desfazer baixa' : 'Marcar como paga') }}
              </button>

              <!-- Fechar a competência é o que "gera" a fatura: congela o valor.
                   A rota existia no backend desde o commit do fechamento e nunca
                   teve botão, então só dava para chamar por API. -->
              <button
                v-if="currentInvoice"
                @click="togglePeriodClosure"
                class="action-button"
                :class="isPeriodClosed ? 'action-button--ghost' : 'action-button--primary'"
                :disabled="isUpdatingClosure"
              >
                <svg v-if="isPeriodClosed" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                {{ isUpdatingClosure ? 'Salvando...' : (isPeriodClosed ? 'Reabrir competência' : 'Fechar e gerar fatura') }}
              </button>
            </div>
          </div>

          <p v-if="statusError" class="inline-error">{{ statusError }}</p>

          <!-- ================= Fatura da competência ================= -->
          <section v-if="currentInvoice" class="invoice-hero">
            <div class="invoice-hero__main">
              <span class="invoice-hero__label">Fatura de {{ periodLabel(currentInvoice.period) }}</span>
              <strong class="invoice-hero__value">{{ formatCurrency(currentInvoice.totalAmount) }}</strong>
              <div class="invoice-hero__badges">
                <span :class="['status-badge', getStatusClass(currentInvoice.status)]">
                  {{ getStatusLabel(currentInvoice.status) }}
                </span>
                <span class="status-badge" :class="isPeriodClosed ? 'status-frozen' : 'status-live'">
                  {{ isPeriodClosed ? 'Valor congelado' : 'Ainda pode mudar' }}
                </span>
              </div>
            </div>

            <dl class="invoice-hero__facts">
              <div>
                <dt>Vencimento</dt>
                <dd>{{ currentInvoice.dueDate }}</dd>
              </div>
              <div>
                <dt>Competência</dt>
                <dd>{{ isPeriodClosed ? 'Fechada' : 'Aberta' }}</dd>
                <small v-if="currentInvoice.closedAtLabel">
                  {{ currentInvoice.closedAtLabel }}<template v-if="currentInvoice.closedBy"> · {{ currentInvoice.closedBy }}</template>
                </small>
              </div>
              <div>
                <dt>Pagamento</dt>
                <dd>{{ currentInvoice.paymentDate || 'Em aberto' }}</dd>
                <small v-if="currentInvoice.paidBy">baixa por {{ currentInvoice.paidBy }}</small>
              </div>
              <div>
                <dt>Itens</dt>
                <dd>{{ currentInvoice.items.length }}</dd>
                <small>{{ composicao.length }} categoria(s)</small>
              </div>
            </dl>

            <!-- Enquanto a competência está aberta o total é recalculado em toda
                 abertura da tela. Dizer isso evita a pergunta "por que o valor
                 mudou depois que eu mandei para o cliente". -->
            <p class="invoice-hero__hint">
              <template v-if="isPeriodClosed">
                O valor está congelado: novas vendas e avulsos deste mês entram na competência seguinte.
              </template>
              <template v-else>
                O total é recalculado a cada abertura desta tela. Feche a competência antes de cobrar o cliente.
              </template>
            </p>

            <!-- ============ Cobrança no provedor ============
                 Emitir exige a competência fechada, porque a emissão manda o
                 valor para fora do sistema e com o mês aberto ele ainda muda. -->
            <div class="charge-box">
              <div class="charge-box__head">
                <span class="charge-box__label">Cobrança</span>
                <span v-if="temCobranca" class="charge-box__status">
                  {{ currentInvoice.asaasStatus || 'emitida' }}
                </span>
                <span v-else class="charge-box__status is-off">não emitida</span>
              </div>

              <div class="charge-box__actions">
                <template v-if="!temCobranca">
                  <!-- Sem botão de simular: era um passo a mais para chegar no
                       mesmo lugar. O ?dryRun=1 continua existindo na API para
                       teste, mas quem opera a tela quer emitir. -->
                  <button
                    class="charge-btn charge-btn--solid"
                    :disabled="isChargeBusy || !isPeriodClosed"
                    :title="isPeriodClosed
                      ? 'Cria a cobrança no provedor. O cliente é notificado por ele'
                      : 'Feche a competência primeiro: com o mês aberto o total ainda muda'"
                    @click="emitirCobranca()"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    {{ isChargeBusy ? 'Enviando...' : 'Emitir cobrança' }}
                  </button>
                </template>

                <template v-else>
                  <a
                    v-if="currentInvoice.asaasInvoiceUrl"
                    class="charge-btn charge-btn--solid"
                    :href="currentInvoice.asaasInvoiceUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Abre a fatura no provedor, do jeito que o cliente vê"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    Abrir
                  </a>
                  <button
                    class="charge-btn charge-btn--ghost"
                    :disabled="isChargeBusy"
                    title="Relê o estado no provedor. Use se o pagamento entrou e a fatura não atualizou"
                    @click="sincronizarCobranca"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                    {{ isChargeBusy ? '...' : 'Sincronizar' }}
                  </button>
                  <button
                    class="charge-btn charge-btn--ghost"
                    :disabled="isChargeBusy"
                    title="Muda só a data de vencimento. O valor não muda por aqui"
                    @click="alterarVencimento"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Alterar prazo
                  </button>
                  <button
                    class="charge-btn charge-btn--danger"
                    :disabled="isChargeBusy"
                    title="Remove a cobrança no provedor e libera a competência para emitir de novo"
                    @click="cancelarCobranca"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    Cancelar
                  </button>
                </template>
              </div>

              <button
                class="charge-btn charge-btn--ghost"
                title="CPF/CNPJ, telefone e endereço usados na cobrança"
                @click="abrirDadosDeCobranca()"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Dados de cobrança
              </button>

              <p v-if="!isPeriodClosed && !temCobranca" class="charge-box__hint">
                Feche a competência para poder emitir.
              </p>
              <p v-if="chargeMessage" class="charge-box__msg">{{ chargeMessage }}</p>
              <p v-if="chargeError" class="charge-box__msg is-error">{{ chargeError }}</p>
            </div>
          </section>

          <!-- ================= Composição, por categoria ================= -->
          <section v-if="currentInvoice && composicao.length" class="breakdown">
            <article v-for="grupo in composicao" :key="grupo.key" class="breakdown-card">
              <header class="breakdown-card__head">
                <h3>{{ grupo.label }}</h3>
                <strong>{{ formatCurrency(grupo.subtotal) }}</strong>
              </header>
              <p class="breakdown-card__share">
                {{ grupo.percentual }}% da fatura · {{ grupo.items.length }} linha(s)
              </p>
              <div class="breakdown-card__bar" aria-hidden="true">
                <span :style="{ width: `${grupo.percentual}%` }"></span>
              </div>
              <ul class="breakdown-card__list">
                <li v-for="item in grupo.items" :key="item.id || item.description">
                  <span class="breakdown-card__desc">{{ item.description }}</span>
                  <span class="breakdown-card__total">{{ formatCurrency(item.total_price) }}</span>
                  <span class="breakdown-card__qty">
                    {{ item.quantity }} {{ unitLabel(item.unit, item.quantity) || 'un.' }} × {{ formatCurrency(item.unit_price) }}
                    <template v-if="item.service_date"> · {{ formatDate(item.service_date) }}</template>
                  </span>
                  <!-- Só avulso pode ser removido: storage e shipment são
                       recriados pelo recálculo, e o backend recusa. Com a
                       competência fechada o botão sai de cena porque a rota
                       responde 409 period_closed. -->
                  <button
                    v-if="item.type === 'manual' && !isPeriodClosed"
                    class="breakdown-card__remove"
                    :disabled="removingItemId === item.id"
                    :title="`Remover ${item.description}`"
                    @click="removeManualItem(item)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    Remover
                  </button>
                </li>
              </ul>
            </article>
          </section>

          <div v-if="!currentInvoice" class="empty-state-full-page">
            <h3>Nenhuma fatura encontrada para {{ selectedPeriod }}</h3>
            <p>Você pode lançar um serviço avulso para criar uma nova fatura para este período.</p>
          </div>

          <div class="table-container" v-if="invoices.length > 0">
            <div class="table-head-row">
              <h2 class="table-title table-title--flush">Histórico de Faturas</h2>
              <span class="table-summary">
                {{ invoices.length }} competência(s) · {{ formatCurrency(historicoTotal) }} no total
                <template v-if="historicoAberto > 0"> · {{ formatCurrency(historicoAberto) }} em aberto</template>
              </span>
            </div>
            <table class="history-table">
              <thead>
                <tr>
                  <th>Competência</th>
                  <th class="num">Valor Total</th>
                  <th>Vencimento</th>
                  <th>Pagamento</th>
                  <th>Competência</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="invoice in invoices"
                  :key="invoice.id"
                  :class="{ 'is-selected': invoice.period === selectedPeriod }"
                >
                  <td class="period-code">{{ periodLabel(invoice.period) }}</td>
                  <td class="num strong">{{ formatCurrency(invoice.totalAmount) }}</td>
                  <td>{{ invoice.dueDate }}</td>
                  <td>
                    <span :class="['status-badge', getStatusClass(invoice.status)]">
                      {{ getStatusLabel(invoice.status) }}
                    </span>
                    <small v-if="invoice.paymentDate" class="cell-note">em {{ invoice.paymentDate }}</small>
                  </td>
                  <td>
                    <span class="status-badge" :class="invoice.isClosed ? 'status-frozen' : 'status-live'">
                      {{ invoice.isClosed ? 'Fechada' : 'Aberta' }}
                    </span>
                    <small v-if="invoice.closedAtLabel" class="cell-note">{{ invoice.closedAtLabel }}</small>
                  </td>
                  <td>
                    <button @click="openDetailsModal(invoice)" class="details-button">
                      Ver Detalhes
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <!-- Modal de Detalhes.
             Abrir uma linha do histórico TROCA a competência selecionada, então
             as ações do modal são as mesmas do cartão do topo, agindo sobre a
             mesma fatura. Sem isso existiriam dois caminhos para a mesma
             operação, e um deles ficaria desatualizado. -->
        <UniversalModal
          :is-open="isDetailsModalOpen"
          @close="closeDetailsModal"
          :title="`Fatura de ${periodLabel(detailsPeriod)}`"
          size="lg"
        >
          <!-- Agrupado por categoria, com subtotal por seção e total geral.
               Antes era um bloco por item, com o tipo cru em inglês no título
               ("Storage", "Shipment", "Manual") e sem nenhum somatório. -->
          <div v-if="detailsInvoice" class="invoice-details-content">
            <div class="invoice-meta">
              <div>
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Vencimento
                </span>
                <strong>{{ detailsInvoice.dueDate }}</strong>
              </div>
              <div>
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                  Pagamento
                </span>
                <strong :class="['status-badge', getStatusClass(detailsInvoice.status)]">
                  {{ getStatusLabel(detailsInvoice.status) }}
                </strong>
              </div>
              <div>
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Competência
                </span>
                <strong class="status-badge" :class="detailsInvoice.isClosed ? 'status-frozen' : 'status-live'">
                  {{ detailsInvoice.isClosed ? 'Fechada' : 'Aberta' }}
                </strong>
              </div>
              <div v-if="detailsInvoice.paymentDate">
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Pago em
                </span>
                <strong>{{ detailsInvoice.paymentDate }}</strong>
              </div>
              <div v-if="detailsInvoice.asaasStatus">
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><polyline points="22 6 12 13 2 6"/></svg>
                  Cobrança
                </span>
                <strong>{{ detailsInvoice.asaasStatus }}</strong>
              </div>
            </div>

            <section v-for="group in groupedItems(detailsInvoice)" :key="group.key" class="detail-group">
              <header class="detail-group__head">
                <!-- Ícone por categoria: armazenamento, expedição e avulso são
                     naturezas diferentes de cobrança, e a forma ajuda a bater o
                     olho mais rápido que ler o rótulo. -->
                <span class="detail-group__icon" v-html="ICONES_GRUPO[group.key] || ICONES_GRUPO.outros"></span>
                <h5>{{ group.label }}</h5>
                <strong>{{ formatCurrency(group.subtotal) }}</strong>
              </header>
              <table class="detail-table">
                <tbody>
                  <tr v-for="item in group.items" :key="item.id || item.description">
                    <td class="detail-table__desc">
                      {{ item.description }}
                      <small v-if="item.service_date">Realizado em {{ formatDate(item.service_date) }}</small>
                    </td>
                    <td class="detail-table__qty">{{ item.quantity }} {{ unitLabel(item.unit, item.quantity) }}</td>
                    <td class="detail-table__unit">{{ formatCurrency(item.unit_price) }}</td>
                    <td class="detail-table__total">{{ formatCurrency(item.total_price) }}</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <footer class="detail-total">
              <span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="13" x2="15" y2="13"/></svg>
                Total da fatura
              </span>
              <strong>{{ formatCurrency(detailsInvoice.totalAmount) }}</strong>
            </footer>
          </div>

          <!-- Ações da competência, dentro do modal: quem abriu a linha do
               histórico quer AGIR nela, não voltar ao topo da página para achar
               o botão. São os mesmos handlers do cartão, porque abrir o modal
               troca a competência selecionada. -->
          <template #footer>
            <div v-if="detailsInvoice" class="details-actions">
              <!-- Guia de próximo passo. A ordem fechar -> simular -> emitir não
                   é preferência: o backend recusa emitir com a competência
                   aberta. Dizer qual é o passo atual evita o clique que só
                   devolve erro. -->
              <p class="details-actions__step">
                <span class="details-actions__step-icon" v-html="passoAtual.icone"></span>
                <span><strong>{{ passoAtual.titulo }}</strong> {{ passoAtual.texto }}</span>
              </p>

              <p v-if="chargeMessage" class="details-actions__msg">{{ chargeMessage }}</p>
              <p v-if="chargeError" class="details-actions__msg is-error">{{ chargeError }}</p>
              <p v-if="statusError" class="details-actions__msg is-error">{{ statusError }}</p>

              <div class="details-actions__row">
                <!-- Fechar vem primeiro porque é pré-requisito de emitir. -->
                <button
                  class="action-button btn-ico"
                  :class="isPeriodClosed ? 'action-button--ghost' : 'action-button--primary'"
                  :disabled="isUpdatingClosure"
                  :title="isPeriodClosed
                    ? 'Volta o total a ser recalculado, para corrigir um fechamento feito antes da hora'
                    : 'Congela o valor da competência. Depois disso, venda e avulso atrasados entram no mês seguinte'"
                  @click="togglePeriodClosure"
                >
                  <svg v-if="isPeriodClosed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  {{ isUpdatingClosure ? 'Salvando...' : (isPeriodClosed ? 'Reabrir competência' : 'Fechar e gerar fatura') }}
                </button>

                <template v-if="!temCobranca">
                  <button
                    class="action-button btn-ico"
                    :disabled="isChargeBusy || !isPeriodClosed"
                    :title="isPeriodClosed
                      ? 'Cria a cobrança no provedor. O cliente é notificado por ele'
                      : 'Feche a competência primeiro: com o mês aberto o total ainda muda'"
                    @click="emitirCobranca()"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    {{ isChargeBusy ? 'Enviando...' : 'Emitir cobrança' }}
                  </button>
                </template>

                <template v-else>
                  <a
                    v-if="detailsInvoice.asaasInvoiceUrl"
                    class="action-button btn-ico"
                    :href="detailsInvoice.asaasInvoiceUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Abre a fatura no provedor, do jeito que o cliente vê"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    Abrir cobrança
                  </a>
                  <button
                    class="action-button action-button--ghost btn-ico"
                    :disabled="isChargeBusy"
                    title="Relê o estado no provedor. Use se o pagamento entrou e a fatura não atualizou"
                    @click="sincronizarCobranca"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                    {{ isChargeBusy ? '...' : 'Sincronizar' }}
                  </button>
                  <button
                    class="action-button action-button--ghost btn-ico"
                    :disabled="isChargeBusy"
                    title="Muda só a data de vencimento. O valor não muda por aqui"
                    @click="alterarVencimento"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Alterar prazo
                  </button>
                  <button
                    class="action-button action-button--danger btn-ico"
                    :disabled="isChargeBusy"
                    title="Remove a cobrança no provedor e libera a competência para emitir de novo"
                    @click="cancelarCobranca"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    Cancelar cobrança
                  </button>
                </template>

                <button
                  class="action-button btn-ico"
                  :class="isCurrentInvoicePaid ? 'action-button--ghost' : 'action-button--pay'"
                  :disabled="isUpdatingStatus"
                  :title="isCurrentInvoicePaid
                    ? 'Desfaz a baixa manual e devolve a fatura para em aberto'
                    : 'Dá baixa à mão. Use quando o cliente pagou por fora do provedor'"
                  @click="toggleInvoicePayment"
                >
                  <svg v-if="isCurrentInvoicePaid" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/></svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  {{ isUpdatingStatus ? 'Salvando...' : (isCurrentInvoicePaid ? 'Desfazer baixa' : 'Marcar como paga') }}
                </button>
              </div>
            </div>
          </template>
        </UniversalModal>

        <!-- Dados de cobrança do cliente.
             Abre sozinho quando a emissão é recusada por dado faltando, com o
             campo que falta destacado. Antes esse caso era um beco sem saída: a
             tela dizia "não tem CPF/CNPJ" e não havia onde preencher. -->
        <UniversalModal
          :is-open="isBillingInfoModalOpen"
          @close="closeBillingInfoModal"
          title="Dados de cobrança do cliente"
          size="lg"
        >
          <div class="billing-form">
            <p class="billing-form__intro">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <span>
                O provedor de cobrança exige o <strong>CPF ou CNPJ</strong> do pagador.
                <strong>CEP e número</strong> são exigidos só para <strong>boleto</strong> — PIX e cartão funcionam sem eles.
              </span>
            </p>

            <fieldset class="billing-fieldset">
              <legend>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><rect x="2" y="4" width="20" height="16" rx="2"/><circle cx="8" cy="10" r="2"/><path d="M12 14h6M12 10h6M6 15c1.2-1 2.8-1 4 0"/></svg>
                Identificação
              </legend>
              <div class="billing-grid">
                <div class="form-group form-group--wide" :class="{ 'is-missing': faltaCampo('cpfCnpj') }">
                  <label for="bf-doc">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    CPF ou CNPJ <span class="req">obrigatório</span>
                  </label>
                  <input id="bf-doc" type="text" v-model="billingForm.cpfCnpj" placeholder="Só números, com ou sem pontuação" inputmode="numeric">
                  <small class="form-hint">Validado pelo dígito verificador, não só pelo tamanho.</small>
                </div>
                <div class="form-group">
                  <label for="bf-fone">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    Telefone
                  </label>
                  <input id="bf-fone" type="text" v-model="billingForm.phone" placeholder="DDD + número" inputmode="numeric">
                </div>
              </div>
            </fieldset>

            <fieldset class="billing-fieldset">
              <legend>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                Endereço
                <small>necessário para boleto</small>
              </legend>
              <div class="billing-grid">
                <div class="form-group" :class="{ 'is-missing': faltaCampo('postalCode') }">
                  <label for="bf-cep">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                    CEP
                  </label>
                  <input id="bf-cep" type="text" v-model="billingForm.postalCode" placeholder="00000-000" inputmode="numeric">
                </div>
                <div class="form-group" :class="{ 'is-missing': faltaCampo('addressNumber') }">
                  <label for="bf-num">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>
                    Número
                  </label>
                  <input id="bf-num" type="text" v-model="billingForm.addressNumber" placeholder="123">
                </div>
                <div class="form-group form-group--wide">
                  <label for="bf-rua">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>
                    Logradouro
                  </label>
                  <input id="bf-rua" type="text" v-model="billingForm.address" placeholder="Rua, avenida...">
                </div>
                <div class="form-group">
                  <label for="bf-compl">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                    Complemento
                  </label>
                  <input id="bf-compl" type="text" v-model="billingForm.addressComplement" placeholder="Sala, bloco...">
                </div>
                <div class="form-group">
                  <label for="bf-bairro">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    Bairro
                  </label>
                  <input id="bf-bairro" type="text" v-model="billingForm.province">
                </div>
                <div class="form-group">
                  <label for="bf-cidade">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M18 21V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16"/><path d="M2 21h20"/><path d="M10 7h4M10 11h4M10 15h4"/></svg>
                    Cidade
                  </label>
                  <input id="bf-cidade" type="text" v-model="billingForm.cityName">
                </div>
                <div class="form-group">
                  <label for="bf-uf">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
                    UF
                  </label>
                  <input id="bf-uf" type="text" v-model="billingForm.state" placeholder="SP" maxlength="2">
                </div>
              </div>
            </fieldset>

            <p v-if="billingFormError" class="billing-form__error">{{ billingFormError }}</p>
          </div>

          <template #footer>
            <button class="btn-secondary btn-ico" @click="closeBillingInfoModal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Cancelar
            </button>
            <button class="btn-primary btn-ico" :disabled="isSavingBillingInfo" @click="salvarDadosDeCobranca">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              {{ isSavingBillingInfo ? 'Salvando...' : (retomarEmissaoAoSalvar ? 'Salvar e emitir' : 'Salvar dados') }}
            </button>
          </template>
        </UniversalModal>

        <!-- Modal Lançar Serviço Avulso -->
        <UniversalModal
          :is-open="isManualServiceModalOpen"
          @close="closeManualServiceModal"
          title="Lançar Serviço Avulso na Fatura"
          size="md"
        >
          <div class="manual-service-form">
            <!-- Onde o lançamento vai cair. Ficava em dois campos desabilitados
                 que pareciam preenchíveis; virou um resumo, que é o que eles
                 sempre foram. -->
            <p class="manual-target">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span>
                Lançando para <strong>{{ clientName }}</strong>
                na competência <strong>{{ periodLabel(selectedPeriod) }}</strong>
              </span>
            </p>

            <div class="form-group">
              <label for="manual-service">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                Serviço
              </label>
              <select id="manual-service" v-model="manualService.serviceId">
                <option disabled value="">Selecione um serviço</option>
                <option v-for="service in manualServices" :key="service.id" :value="service.id">
                  {{ service.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="manual-date">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Data de realização do serviço
              </label>
              <input id="manual-date" type="date" v-model="manualService.serviceDate">
              <!-- A data fica gravada no item e é o que responde "quando foi
                   feito" numa conferência com o cliente. Não é a data de hoje. -->
              <small class="form-hint">Quando o serviço foi executado, não a data de hoje.</small>
            </div>

            <div class="form-group" v-if="isQuantityServiceSelected">
              <label for="manual-quantity">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3"/><path d="M12 12l8-4.5"/><path d="M12 12v9"/><path d="M12 12 4 7.5"/></svg>
                {{ selectedService?.config?.quantity_label || 'Quantidade' }}
              </label>
              <input
                id="manual-quantity"
                type="number"
                v-model.number="manualService.quantity"
                :placeholder="selectedService?.config?.placeholder || 'Ex: 1'"
                min="1"
              >
              <!-- Serviço com faixas: o preço unitário sai da quantidade, então
                   dizer as faixas aqui evita a surpresa no total da fatura. -->
              <small v-if="selectedService?.config?.tiers?.length" class="form-hint">
                Preço por faixa:
                <template v-for="(tier, ti) in selectedService.config.tiers" :key="ti">
                  <template v-if="ti"> · </template>{{ tier.from }}{{ tier.to ? `-${tier.to}` : '+' }}: {{ formatCurrency(tier.price) }}
                </template>
              </small>
            </div>

            <p v-if="manualServiceError" class="error-text">{{ manualServiceError }}</p>
          </div>

          <template #footer>
            <button @click="closeManualServiceModal" class="btn-secondary btn-ico">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Cancelar
            </button>
            <button @click="submitManualService" class="btn-primary btn-ico" :disabled="isSubmittingManualService">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              {{ isSubmittingManualService ? 'Lançando...' : 'Lançar serviço' }}
            </button>
          </template>
        </UniversalModal>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, defineProps } from 'vue';
import { useBilling } from '@/composables/useBilling';
import { useConfirm } from '@/composables/useConfirm';
import UniversalModal from '@/components/UniversalModal.vue';

const props = defineProps({
  userId: { type: String, default: null },
  clientName: { type: String, default: 'Cliente' }
});

const {
  invoices,
  isLoading,
  error,
  fetchInvoices,
  addManualService,
  manualServices,
  fetchManualServices,
  setInvoiceStatus,
  deleteManualItem,
  closeInvoicePeriod,
  reopenInvoicePeriod,
  fetchBillingInfo,
  saveBillingInfo,
  ensureAsaasCustomer,
  issueCharge,
  syncCharge,
  updateChargeDueDate,
  cancelCharge
} = useBilling();

const { confirm } = useConfirm();

/** Rótulos das seções da fatura, no lugar de "Storage"/"Shipment"/"Manual". */
const ITEM_GROUPS = [
  { key: 'storage', label: 'Armazenamento' },
  { key: 'shipment', label: 'Expedição' },
  { key: 'manual', label: 'Serviços pontuais' },
];

/* Ícone por categoria de item. Injetados por v-html num ponto só; repetir quatro
 * <svg> com v-if no template deixaria o cabeçalho do grupo ilegível.
 * `outros` cobre tipo novo que apareça no banco e ainda não esteja mapeado. */
const ICONES_GRUPO = {
  // Caixa: armazenamento.
  storage: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
  // Caminhão: expedição.
  shipment: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
  // Mais dentro de círculo: lançamento pontual, feito à mão.
  manual: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
  // Etiqueta: categoria não mapeada.
  outros: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
};

const UNIT_LABELS = { m3: 'm³', pacote: 'pacote', viagem: 'viagem', venda: 'venda', unidade: 'unidade' };

function unitLabel(unit, quantity = 1) {
  const label = UNIT_LABELS[unit] || unit || '';
  if (!label || label === 'm³') return label;
  return Number(quantity) > 1 ? `${label}s` : label;
}

/** Agrupa os itens da fatura por categoria, com subtotal por seção. */
function groupedItems(invoice) {
  const items = invoice?.items || [];
  const groups = ITEM_GROUPS.map(({ key, label }) => {
    const groupItems = items.filter((i) => i.type === key);
    return {
      key,
      label,
      items: groupItems,
      subtotal: groupItems.reduce((sum, i) => sum + parseFloat(i.total_price || 0), 0),
    };
  }).filter((g) => g.items.length);

  // Tipo desconhecido não pode desaparecer da fatura só por não estar mapeado.
  const known = ITEM_GROUPS.map((g) => g.key);
  const others = items.filter((i) => !known.includes(i.type));
  if (others.length) {
    groups.push({
      key: 'outros',
      label: 'Outros lançamentos',
      items: others,
      subtotal: others.reduce((sum, i) => sum + parseFloat(i.total_price || 0), 0),
    });
  }
  return groups;
}

const selectedPeriod = ref('');
const contentArea = ref(null);
const isDetailsModalOpen = ref(false);
/* A competência aberta no modal. Guardo o PERÍODO e não o objeto: o objeto vira
 * uma cópia congelada no instante do clique, e depois de emitir ou fechar a
 * fatura o modal continuaria mostrando o estado antigo. Com o período, o
 * computed abaixo relê da lista recarregada. */
const detailsPeriod = ref('');
const isManualServiceModalOpen = ref(false);
const isSubmittingManualService = ref(false);
const manualServiceError = ref('');
const manualService = ref({
  serviceId: '',
  quantity: 1,
  serviceDate: new Date().toISOString().split('T')[0]
});

const isModalView = computed(() => !!props.userId);
const targetUserId = computed(() => props.userId);
const currentInvoice = computed(() => invoices.value.find(inv => inv.period === selectedPeriod.value) || null);

/* A fatura do modal, resolvida da lista a cada leitura. Depois de emitir ou
 * fechar, `fetchInvoices` recarrega e isto reflete na hora. */
const detailsInvoice = computed(() =>
  invoices.value.find(inv => inv.period === detailsPeriod.value) || null
);

const availablePeriods = computed(() => {
  const periods = invoices.value.map(inv => inv.period);
  if (!periods.includes(selectedPeriod.value) && selectedPeriod.value) {
    periods.unshift(selectedPeriod.value);
  }
  return [...new Set(periods)].sort().reverse();
});

const isQuantityServiceSelected = computed(() => {
  const service = manualServices.value.find(s => s.id === manualService.value.serviceId);
  return service?.type === 'avulso_quantidade';
});

/* `manualItems`/`manualTotal` saíram junto com a seção separada de serviços
 * pontuais: o grupo "Serviços pontuais" da composição já traz os mesmos
 * lançamentos, com subtotal e com o botão de remover em cada linha. Manter os
 * dois deixava o mesmo item na tela duas vezes. */

/** "2026-08" -> "agosto de 2026". O código cru fica no title da célula. */
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
function periodLabel(period) {
  const [ano, mes] = String(period || '').split('-').map(Number);
  if (!ano || !mes || mes < 1 || mes > 12) return period || '';
  const nome = MESES[mes - 1];
  /* Só a primeira letra. Deixar isso para o CSS com `text-transform: capitalize`
   * maiusculava cada palavra e produzia "Agosto De 2026". */
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} de ${ano}`;
}

/**
 * Composição da fatura por categoria, com subtotal e peso de cada uma.
 *
 * Reaproveita `groupedItems`, que já trata tipo desconhecido, e acrescenta o
 * percentual. O percentual usa a soma dos grupos como base, não
 * `totalAmount`: se algum item ficar fora de um grupo por tipo novo, dividir
 * pelo total daria barras que não fecham 100% sem explicação.
 *
 * Isto substitui os cartões fixos de "Expedição Comum" e "Expedição Premium",
 * que procuravam o item por `description` literal. Tipo de pacote é
 * cadastrável, então qualquer nome diferente desses dois nunca aparecia.
 */
const composicao = computed(() => {
  const grupos = groupedItems(currentInvoice.value);
  const base = grupos.reduce((sum, g) => sum + g.subtotal, 0);
  return grupos.map((g) => ({
    ...g,
    percentual: base > 0 ? Math.round((g.subtotal / base) * 100) : 0,
  }));
});

const historicoTotal = computed(() =>
  invoices.value.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0)
);
const historicoAberto = computed(() =>
  invoices.value
    .filter((inv) => inv.status !== 'paid')
    .reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0)
);

// --- Baixa da fatura (master) ---
const isUpdatingStatus = ref(false);
const statusError = ref('');
const removingItemId = ref(null);
const isCurrentInvoicePaid = computed(() => currentInvoice.value?.status === 'paid');

// --- Fechamento da competência (master) ---
const isUpdatingClosure = ref(false);
const isPeriodClosed = computed(() => currentInvoice.value?.isClosed === true);

/**
 * Fecha ou reabre a competência.
 *
 * Fechar é a ação que congela o valor, então a confirmação diz o que muda de
 * fato em vez de só perguntar "confirma?". Reabrir com cobrança já emitida no
 * provedor devolve 409 `has_external_charge`; nesse caso a segunda confirmação
 * é explícita sobre a divergência com o documento enviado, e só então repete
 * com `force`.
 */
async function togglePeriodClosure() {
  if (!currentInvoice.value || !targetUserId.value) return;
  const periodo = currentInvoice.value.period;
  const fechando = !isPeriodClosed.value;

  const confirmed = await confirm(fechando
    ? {
      title: `Fechar ${periodLabel(periodo)}`,
      message: `O valor de ${formatCurrency(currentInvoice.value.totalAmount)} passa a ser definitivo.`,
      detail: 'O sistema recalcula uma última vez antes de congelar. Depois disso, venda processada com '
        + 'data retroativa e serviço avulso entram na competência seguinte.',
      confirmText: 'Fechar competência',
      tone: 'primary',
    }
    : {
      title: `Reabrir ${periodLabel(periodo)}`,
      message: 'O total volta a ser recalculado a cada abertura da tela.',
      detail: 'Serve para corrigir um fechamento feito antes da hora.',
      confirmText: 'Reabrir competência',
      tone: 'danger',
    });
  if (!confirmed) return;

  statusError.value = '';
  isUpdatingClosure.value = true;
  try {
    if (fechando) {
      await closeInvoicePeriod(targetUserId.value, periodo);
    } else {
      try {
        await reopenInvoicePeriod(targetUserId.value, periodo);
      } catch (e) {
        if (e?.data?.code !== 'has_external_charge') throw e;
        const forcar = await confirm({
          title: 'Esta competência já tem cobrança emitida',
          message: 'Reabrir faz o total voltar a mudar, e ele pode ficar diferente do documento que o cliente recebeu.',
          detail: 'Quem reabrir agora precisa cancelar ou reemitir a cobrança no provedor.',
          confirmText: 'Reabrir mesmo assim',
          tone: 'danger',
        });
        if (!forcar) return;
        await reopenInvoicePeriod(targetUserId.value, periodo, { force: true });
      }
    }
    await fetchInvoices(targetUserId.value, selectedPeriod.value);
  } catch (e) {
    statusError.value = e.message || 'Não foi possível atualizar a competência.';
  } finally {
    isUpdatingClosure.value = false;
  }
}

async function toggleInvoicePayment() {
  if (!currentInvoice.value || !targetUserId.value) return;
  const goingToPaid = !isCurrentInvoicePaid.value;
  const label = goingToPaid ? 'marcar como paga' : 'reabrir';
  const confirmed = await confirm({
    title: goingToPaid ? 'Marcar fatura como paga' : 'Reabrir fatura',
    message: `Confirma ${label} a fatura de ${currentInvoice.value.period}?`,
    confirmText: goingToPaid ? 'Marcar como paga' : 'Reabrir fatura',
    tone: 'primary',
  });
  if (!confirmed) return;

  statusError.value = '';
  isUpdatingStatus.value = true;
  try {
    await setInvoiceStatus(targetUserId.value, currentInvoice.value.period, goingToPaid ? 'paid' : 'pending');
    await fetchInvoices(targetUserId.value, selectedPeriod.value);
  } catch (e) {
    statusError.value = e.message || 'Não foi possível atualizar o status da fatura.';
  } finally {
    isUpdatingStatus.value = false;
  }
}

/* ========================= Cobrança no provedor =========================
 *
 * O backend recusa o que não pode ser feito e devolve um `code`. A tela usa o
 * code para oferecer a saída em vez de só repetir a mensagem: cliente sem
 * vínculo vira "quer vincular agora?", vencimento vencido vira "qual a data
 * nova?". Sem isso o master lê um erro e não sabe o que fazer com ele.
 * ===================================================================== */

const isChargeBusy = ref(false);
const chargeError = ref('');
const chargeMessage = ref('');
const temCobranca = computed(() => Boolean(currentInvoice.value?.asaasPaymentId));

/* Ícones do guia de passo. Ficam aqui como string porque são injetados por
 * v-html num único ponto — repetir cinco <svg> no template com v-if faria o
 * bloco de orientação virar a maior parte do arquivo. */
const ICONES_PASSO = {
  cadeadoAberto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>',
  aviao: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
  relogio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
};

/**
 * Qual é o passo atual desta competência.
 *
 * A ordem fechar -> simular -> emitir -> receber não é preferência de tela: o
 * backend RECUSA emitir com a competência aberta, porque o total ainda muda.
 * Dizer em que ponto do caminho a fatura está evita o clique que só devolve
 * erro, e é a diferença entre a tela ensinar e a tela deixar adivinhar.
 */
const passoAtual = computed(() => {
  const fatura = detailsInvoice.value;

  if (fatura?.status === 'paid') {
    return {
      icone: ICONES_PASSO.ok,
      titulo: 'Fatura paga.',
      texto: fatura.paidBy === 'asaas'
        ? 'A baixa veio do provedor de cobrança.'
        : `Baixa manual${fatura.paidBy ? ` por ${fatura.paidBy}` : ''}.`,
    };
  }

  if (!fatura?.isClosed) {
    return {
      icone: ICONES_PASSO.cadeadoAberto,
      titulo: 'Passo 1 de 3: fechar a competência.',
      texto: 'Enquanto o mês está aberto o total é recalculado a cada visita, então ainda não dá para cobrar. '
        + 'Fechar congela o valor.',
    };
  }

  if (!temCobranca.value) {
    return {
      icone: ICONES_PASSO.aviao,
      titulo: 'Passo 2 de 3: emitir a cobrança.',
      texto: 'O valor está congelado e pode ser cobrado. Clique em "Emitir cobrança".',
    };
  }

  return {
    icone: ICONES_PASSO.relogio,
    titulo: 'Passo 3 de 3: aguardando o pagamento.',
    texto: `Cobrança emitida${fatura.asaasStatus ? ` (${fatura.asaasStatus})` : ''}. `
      + 'O provedor avisa quando o cliente pagar; "Sincronizar" confere na hora.',
  };
});

/** Código de erro do backend, quando existir. */
const codigoDoErro = (e) => e?.data?.code || null;

/* ---------------- Dados de cobrança do cliente (modal) ----------------
 *
 * Antes, emitir sem CPF/CNPJ era um beco sem saída: a tela dizia "este cliente
 * não tem CPF/CNPJ" e não existia lugar nenhum para preencher — a rota
 * PUT /users/:uid/billing-info existia no backend sem nenhuma interface.
 *
 * Agora a recusa ABRE o formulário, já apontando o campo que falta, e salvar
 * retoma a emissão de onde parou.
 * -------------------------------------------------------------------- */

const isBillingInfoModalOpen = ref(false);
const isSavingBillingInfo = ref(false);
const billingFormError = ref('');
/** Campos que o backend apontou como faltando, para destacar no formulário. */
const camposFaltando = ref([]);
/** Quando o modal foi aberto por uma emissão recusada, salvar continua o fluxo. */
const retomarEmissaoAoSalvar = ref(false);

const billingForm = ref({
  cpfCnpj: '', phone: '',
  postalCode: '', address: '', addressNumber: '',
  addressComplement: '', province: '', cityName: '', state: '',
});

const faltaCampo = (campo) => camposFaltando.value.includes(campo);

/**
 * Abre o formulário de dados de cobrança.
 *
 * Carrega o que já existe para o master corrigir em vez de redigitar, e usa o
 * `faltando` que o backend devolve — quem decide o que é obrigatório é a regra
 * do provedor, do lado do servidor, não uma cópia dela aqui.
 */
async function abrirDadosDeCobranca({ retomarEmissao = false, faltando = [] } = {}) {
  billingFormError.value = '';
  retomarEmissaoAoSalvar.value = retomarEmissao;
  camposFaltando.value = faltando;
  isBillingInfoModalOpen.value = true;

  try {
    const { user, faltando: doServidor } = await fetchBillingInfo(targetUserId.value);
    billingForm.value = {
      cpfCnpj: user.cpfCnpjFormatted || '',
      phone: user.phone || '',
      postalCode: user.postalCodeFormatted || '',
      address: user.address || '',
      addressNumber: user.address_number || '',
      addressComplement: user.address_complement || '',
      province: user.province || '',
      cityName: user.city_name || '',
      state: user.state || '',
    };
    // O do servidor é mais completo que o que veio no erro da emissão.
    if (Array.isArray(doServidor) && doServidor.length) camposFaltando.value = doServidor;
  } catch (e) {
    billingFormError.value = e.message || 'Não foi possível carregar os dados atuais.';
  }
}

function closeBillingInfoModal() {
  isBillingInfoModalOpen.value = false;
  retomarEmissaoAoSalvar.value = false;
  camposFaltando.value = [];
  billingFormError.value = '';
}

/**
 * Grava os dados e, se o modal veio de uma emissão recusada, retoma a emissão.
 *
 * A sequência é gravar -> vincular no provedor -> emitir. O vínculo entra no
 * meio porque é ele que leva o documento e o endereço para lá; salvar no nosso
 * banco não atualiza o cadastro do provedor por conta própria.
 */
async function salvarDadosDeCobranca() {
  billingFormError.value = '';
  isSavingBillingInfo.value = true;
  try {
    await saveBillingInfo(targetUserId.value, { ...billingForm.value });
    const eraRetomada = retomarEmissaoAoSalvar.value;
    closeBillingInfoModal();

    if (!eraRetomada) {
      chargeMessage.value = 'Dados de cobrança salvos.';
      return;
    }

    chargeMessage.value = 'Dados salvos. Vinculando o cliente e emitindo...';
    await ensureAsaasCustomer(targetUserId.value);
    isSavingBillingInfo.value = false;
    await emitirCobranca();
  } catch (e) {
    /* O backend responde 400 com `field`, e 409 com `code: document_already_used`
     * quando o documento está em outro cadastro — que quase sempre é cliente
     * duplicado, e a mensagem já diz de quem é. */
    billingFormError.value = e.message || 'Não foi possível salvar os dados.';
    camposFaltando.value = e?.data?.field ? [e.data.field] : camposFaltando.value;
  } finally {
    isSavingBillingInfo.value = false;
  }
}

function limparAvisosDeCobranca() {
  chargeError.value = '';
  chargeMessage.value = '';
}

async function recarregarFatura() {
  await fetchInvoices(targetUserId.value, selectedPeriod.value);
}

/**
 * Emite a cobrança da competência.
 *
 * `dryRun` não cria nada no provedor e não notifica ninguém — serve para
 * conferir valor, vencimento e destinatário antes de mandar de verdade.
 *
 * Dois desvios tratados aqui, e os dois vêm do backend por `code`:
 *   missing_customer  -> oferece vincular o cliente e repete a emissão;
 *   due_date_in_past  -> pede a data nova, porque o provedor recusa vencimento
 *                        no passado e trocar a data em silêncio faria a cobrança
 *                        vencer num dia diferente do que a tela mostra.
 */
async function emitirCobranca({ dryRun = false, dueDate = null } = {}) {
  if (!currentInvoice.value || !targetUserId.value) return;
  const periodo = currentInvoice.value.period;

  if (!dryRun) {
    const confirmado = await confirm({
      title: `Emitir cobrança de ${periodLabel(periodo)}`,
      message: `${formatCurrency(currentInvoice.value.totalAmount)} para ${props.clientName}.`,
      detail: 'A cobrança é criada no provedor e o cliente é notificado por ele. '
        + 'Use "Simular" antes se quiser conferir sem enviar.',
      confirmText: 'Emitir cobrança',
      tone: 'primary',
    });
    if (!confirmado) return;
  }

  limparAvisosDeCobranca();
  isChargeBusy.value = true;
  try {
    const resposta = await issueCharge(targetUserId.value, periodo, { dryRun, dueDate });

    if (dryRun) {
      const p = resposta?.wouldSend || {};
      chargeMessage.value = `Simulação: ${formatCurrency(p.value)} com vencimento em `
        + `${p.dueDate}, forma ${p.billingType}. Nada foi criado e ninguém foi notificado.`;
      return;
    }

    chargeMessage.value = resposta?.adopted
      ? `Já existia uma cobrança no provedor (${resposta.paymentId}); ela foi vinculada a esta competência.`
      : `Cobrança ${resposta.paymentId} emitida.`;
    await recarregarFatura();
  } catch (e) {
    const code = codigoDoErro(e);

    /* Falta dado de cadastro: abre o formulário em vez de só informar. Este era
     * o beco sem saída — a mensagem aparecia e não havia onde preencher. */
    if (code === 'missing_billing_info') {
      isChargeBusy.value = false;
      await abrirDadosDeCobranca({
        retomarEmissao: true,
        faltando: e?.data?.faltando || ['cpfCnpj'],
      });
      return;
    }

    if (code === 'missing_customer') {
      isChargeBusy.value = false;
      try {
        // Vincula direto: procurar por documento antes de criar já evita
        // duplicidade, então não há decisão para o master tomar aqui.
        await ensureAsaasCustomer(targetUserId.value);
        return await emitirCobranca({ dryRun, dueDate });
      } catch (erroCliente) {
        /* O vínculo também recusa por dado faltando. Mesmo tratamento: abre o
         * formulário apontando o campo. */
        if (codigoDoErro(erroCliente) === 'missing_billing_info') {
          await abrirDadosDeCobranca({
            retomarEmissao: true,
            faltando: erroCliente?.data?.faltando || ['cpfCnpj'],
          });
          return;
        }
        chargeError.value = erroCliente.message;
        return;
      }
    }

    if (code === 'due_date_in_past') {
      const sugestao = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
      // eslint-disable-next-line no-alert
      const nova = window.prompt(
        `O vencimento desta competência (${e.data?.invoiceDueDate || ''}) já passou e o provedor recusa `
        + 'cobrança com data no passado.\n\nInforme a nova data de vencimento (AAAA-MM-DD):',
        sugestao
      );
      if (!nova) { chargeError.value = e.message; return; }
      isChargeBusy.value = false;
      return await emitirCobranca({ dryRun, dueDate: nova.trim() });
    }

    chargeError.value = e.message || 'Não foi possível emitir a cobrança.';
  } finally {
    isChargeBusy.value = false;
  }
}

/** Relê o estado no provedor. Usar quando um evento se perdeu. */
async function sincronizarCobranca() {
  limparAvisosDeCobranca();
  isChargeBusy.value = true;
  try {
    const r = await syncCharge(targetUserId.value, currentInvoice.value.period);
    chargeMessage.value = `Provedor: ${r.status}`
      + (r.statusLocal ? ` — fatura marcada como ${r.statusLocal === 'paid' ? 'paga' : 'em aberto'}.` : '.');
    await recarregarFatura();
  } catch (e) {
    chargeError.value = e.message || 'Não foi possível sincronizar.';
  } finally {
    isChargeBusy.value = false;
  }
}

/**
 * Altera só o vencimento.
 *
 * Valor não muda por aqui de propósito: mudaria o documento do cliente sem
 * mudar o total congelado da competência, e os dois passariam a discordar.
 */
async function alterarVencimento() {
  const atual = currentInvoice.value?.dueDate || '';
  // eslint-disable-next-line no-alert
  const nova = window.prompt(`Nova data de vencimento (AAAA-MM-DD).\nVencimento atual: ${atual}`, '');
  if (!nova) return;

  limparAvisosDeCobranca();
  isChargeBusy.value = true;
  try {
    const r = await updateChargeDueDate(targetUserId.value, currentInvoice.value.period, nova.trim());
    chargeMessage.value = `Vencimento alterado para ${r.dueDate}.`;
    await recarregarFatura();
  } catch (e) {
    chargeError.value = e.message || 'Não foi possível alterar o vencimento.';
  } finally {
    isChargeBusy.value = false;
  }
}

/** Cancela no provedor e desfaz o vínculo, deixando a competência reemitível. */
async function cancelarCobranca() {
  const confirmado = await confirm({
    title: 'Cancelar a cobrança',
    message: 'A cobrança é removida no provedor e a competência volta a poder ser emitida.',
    detail: 'Se o cliente já tiver pago, o cancelamento é recusado — devolver dinheiro é estorno, '
      + 'e isso se faz no painel do provedor.',
    confirmText: 'Cancelar cobrança',
    tone: 'danger',
  });
  if (!confirmado) return;

  limparAvisosDeCobranca();
  isChargeBusy.value = true;
  try {
    await cancelCharge(targetUserId.value, currentInvoice.value.period);
    chargeMessage.value = 'Cobrança cancelada.';
    await recarregarFatura();
  } catch (e) {
    chargeError.value = e.message || 'Não foi possível cancelar a cobrança.';
  } finally {
    isChargeBusy.value = false;
  }
}

async function removeManualItem(item) {
  const confirmed = await confirm({
    title: 'Remover lançamento',
    message: `Remover o lançamento "${item.description}" desta fatura?`,
    detail: 'Esta ação não pode ser desfeita.',
    confirmText: 'Remover lançamento',
    tone: 'danger',
  });
  if (!confirmed) return;

  statusError.value = '';
  removingItemId.value = item.id;
  try {
    await deleteManualItem(item.id);
    await fetchInvoices(targetUserId.value, selectedPeriod.value);
  } catch (e) {
    statusError.value = e.message || 'Não foi possível remover o lançamento.';
  } finally {
    removingItemId.value = null;
  }
}

// NOVO: serviço selecionado para usar config (rótulos/placeholder)
const selectedService = computed(() =>
  manualServices.value.find(s => s.id === manualService.value.serviceId) || null
);

const formatCurrency = (value) => {
  if (typeof value !== 'number') value = parseFloat(value || 0);
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (d) => {
  if (!d) return '';
  const date = new Date(d);
  date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
  return date.toLocaleDateString('pt-BR');
};

const handlePeriodChange = () => {
  if (targetUserId.value) {
    fetchInvoices(targetUserId.value, selectedPeriod.value);
  }
};

/**
 * Abre o detalhe de uma competência do histórico.
 *
 * Além de abrir, TROCA a competência selecionada para a da linha clicada. É o
 * que permite ao modal usar exatamente os mesmos handlers do cartão do topo
 * (fechar, emitir, sincronizar, baixar) em vez de manter um segundo conjunto de
 * ações — e dois conjuntos é como um deles fica desatualizado.
 *
 * Efeito colateral desejado: o cartão do topo passa a mostrar a mesma
 * competência, então fechar o modal não deixa a tela contando outra história.
 */
const openDetailsModal = (invoice) => {
  detailsPeriod.value = invoice.period;
  if (selectedPeriod.value !== invoice.period) {
    selectedPeriod.value = invoice.period;
    handlePeriodChange();
  }
  limparAvisosDeCobranca();
  statusError.value = '';
  isDetailsModalOpen.value = true;
};

const closeDetailsModal = () => {
  isDetailsModalOpen.value = false;
  detailsPeriod.value = '';
};

const openManualServiceModal = async () => {
  manualService.value = {
    serviceId: '',
    quantity: 1,
    serviceDate: new Date().toISOString().split('T')[0]
  };
  manualServiceError.value = '';
  // garante que lista vem do /services?manualOnly=1
  await fetchManualServices();
  isManualServiceModalOpen.value = true;
};

const closeManualServiceModal = () => {
  isManualServiceModalOpen.value = false;
};

const submitManualService = async () => {
  manualServiceError.value = '';
  if (!manualService.value.serviceId || !manualService.value.serviceDate) {
    manualServiceError.value = 'Por favor, selecione um serviço e uma data.';
    return;
  }

  isSubmittingManualService.value = true;
  try {
    await addManualService({
      uid: targetUserId.value,
      period: selectedPeriod.value,
      serviceId: manualService.value.serviceId,
      quantity: isQuantityServiceSelected.value ? manualService.value.quantity : null,
      serviceDate: manualService.value.serviceDate
    });
    closeManualServiceModal();
    await fetchInvoices(targetUserId.value, selectedPeriod.value);
  } catch (e) {
    manualServiceError.value = e.message || 'Falha ao lançar serviço.';
  } finally {
    isSubmittingManualService.value = false;
  }
};

const getStatusClass = (status) => {
  const s = status?.toLowerCase();
  if (s === 'paid') return 'status-paid';
  if (s === 'pending') return 'status-open';
  return 'status-default';
};

const getStatusLabel = (status) => {
  const s = status?.toLowerCase();
  if (s === 'paid') return 'Pago';
  if (s === 'pending') return 'Em Aberto';
  return status;
};

const loadInitialData = async () => {
  if (targetUserId.value) {
    const currentPeriod = new Date().toISOString().slice(0, 7);
    selectedPeriod.value = currentPeriod;
    await fetchInvoices(targetUserId.value, currentPeriod);
    await fetchManualServices(); // pré-carrega lista do catálogo
  }
};

onMounted(() => {
  if (props.userId) {
    loadInitialData();
  }
});

watch(() => props.userId, (newId) => {
  if (newId) {
    loadInitialData();
  }
});
</script>

<style scoped>
.dashboard-wrapper { display: flex; min-height: 100vh; font-family: var(--font-sans); }
.main-content { flex: 1; display: flex; flex-direction: column; }
.dashboard-content { flex: 1; }
.error-state { padding: 2rem; text-align: center; font-size: 1rem; color: #b91c1c; background-color: #fee2e2; border-radius: 0.5rem; }
.empty-state-full-page { text-align: center; padding: 4rem 1rem; color: #6b7280; }
.filters-and-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; background-color: #fff; padding: 1rem; border-radius: 0.75rem; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); }
.filter-group { display: flex; align-items: center; gap: 0.5rem; }
.filter-group label { font-size: 0.875rem; font-weight: 500; color: #374151; }
.filter-group select { padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.875rem; background-color: #fff; }
/* Antes todos os botões eram verdes (#10b981), inclusive num app de paleta azul:
   dois verdes lado a lado sem hierarquia entre eles. Agora o verde é reservado
   para a baixa de pagamento, onde significa algo; a ação estrutural (fechar a
   competência) usa o azul da marca e o resto fica neutro. */
.action-button { background-color: var(--cd-blue-700, #0369a1); color: white; border: none; padding: 0.6rem 1.1rem; border-radius: 8px; font-weight: 650; font-size: 0.85rem; cursor: pointer; transition: background-color 0.15s, box-shadow 0.15s, opacity 0.15s; display: inline-flex; align-items: center; gap: 0.45rem; white-space: nowrap; }
.action-button:hover:not(:disabled) { background-color: var(--cd-blue-800, #075985); }
.action-button:disabled { opacity: 0.45; cursor: not-allowed; }
.action-button--primary { background-image: var(--cd-gradient, linear-gradient(140deg, #0c3f68, #0369a1)); box-shadow: 0 6px 16px rgba(7, 89, 133, 0.24); }
.action-button--primary:hover:not(:disabled) { box-shadow: 0 8px 20px rgba(7, 89, 133, 0.32); }
.action-button--ghost { background-color: #fff; color: var(--cd-blue-800, #075985); border: 1px solid var(--cd-line, #dbe7f0); }
.action-button--ghost:hover:not(:disabled) { background-color: #f0f9ff; }
.stats-cards-grid-5 { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem; }
.stat-card { background-color: #ffffff; border-radius: 0.75rem; padding: 1.5rem; border: 1px solid #e5e7eb; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
.card-title { font-size: 0.875rem; font-weight: 600; color: #374151; margin: 0 0 0.75rem 0; }
.metric-value { font-size: 2.25rem; font-weight: 700; color: #111827; margin: 0; line-height: 1.2; }
.card-description { font-size: 0.875rem; color: #6b7280; margin: 0.5rem 0 0 0; }
.metric-value.status-text { font-size: 1.25rem; font-weight: 600; }
.table-container { background-color: #ffffff; border-radius: 0.75rem; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); overflow-x: auto; margin-top: 2rem; }
.table-title { font-size: 1.25rem; font-weight: 600; color: #111827; padding: 1.5rem; margin: 0; border-bottom: 1px solid #e5e7eb; }
.history-table { width: 100%; border-collapse: collapse; text-align: left; }
.history-table th, .history-table td { padding: 1rem 1.5rem; border-bottom: 1px solid #e5e7eb; }
.status-badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.8rem; font-weight: 600; display: inline-block; }
.status-paid { background-color: #dcfce7; color: #166534; }
.status-open { background-color: #fef3c7; color: #92400e; }
.details-button { background-color: #2563eb; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 500; cursor: pointer; }
.invoice-details-content { padding: 1.25rem 1.5rem; background-color: #f9fafb; }

/* Cabeçalho com competência, vencimento e status */
.invoice-meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); gap: 0.75rem; margin-bottom: 1.25rem; padding-bottom: 1rem; border-bottom: 1px solid var(--cd-line, #e5e7eb); }
.invoice-meta div { display: flex; flex-direction: column; gap: 0.25rem; min-width: 0; }
.invoice-meta span { display: inline-flex; align-items: center; gap: 0.28rem; color: var(--cd-muted, #6b7280); font-size: 0.7rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
.invoice-meta span svg { flex: 0 0 auto; }
.invoice-meta strong { color: var(--cd-ink, #111827); font-size: 0.9rem; }
.invoice-meta .status-badge { align-self: flex-start; }

/* Seções por categoria, com subtotal */
.detail-group { margin-bottom: 1rem; overflow: hidden; border: 1px solid var(--cd-line, #e5e7eb); border-radius: 0.6rem; background: #fff; }
.detail-group__head { display: flex; align-items: center; gap: 0.45rem; padding: 0.6rem 0.85rem; background: var(--cd-blue-50, #f0f9ff); }
.detail-group__head h5 { flex: 1 1 auto; margin: 0; color: var(--cd-blue-800, #075985); font-size: 0.85rem; font-weight: 750; }
.detail-group__icon { display: inline-flex; flex: 0 0 auto; color: var(--cd-blue-700, #0369a1); }
.detail-group__head strong { color: var(--cd-blue-900, #0c3f68); font-size: 0.9rem; font-variant-numeric: tabular-nums; }
.detail-table { width: 100%; border-collapse: collapse; }
.detail-table td { padding: 0.55rem 0.85rem; border-top: 1px solid #f1f5f9; color: #4b5563; font-size: 0.83rem; vertical-align: top; }
.detail-table__desc { width: 50%; color: var(--cd-ink, #111827); font-weight: 600; }
.detail-table__desc small { display: block; margin-top: 0.15rem; color: #94a3b8; font-weight: 500; font-style: normal; }
.detail-table__qty, .detail-table__unit { white-space: nowrap; text-align: right; font-variant-numeric: tabular-nums; }
.detail-table__total { white-space: nowrap; text-align: right; color: var(--cd-ink, #111827); font-weight: 750; font-variant-numeric: tabular-nums; }

/* Total geral da fatura */
.detail-total { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.85rem 1rem; border-radius: 0.6rem; background: var(--cd-gradient, linear-gradient(140deg, #0c3f68, #0369a1)); box-shadow: var(--cd-shadow, 0 10px 24px rgba(7, 89, 133, 0.22)); color: #fff; }
.detail-total span { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
.detail-total span svg { flex: 0 0 auto; }
.detail-total strong { font-size: 1.15rem; font-variant-numeric: tabular-nums; }

/* Remoção de lançamento avulso, dentro da linha da composição. Substituiu os
   cards .punctual-*, que mostravam os mesmos itens numa seção à parte. */
.breakdown-card__remove { grid-column: 1 / -1; justify-self: start; display: inline-flex; align-items: center; gap: 0.3rem; margin-top: 0.15rem; padding: 0.2rem 0.45rem; border: none; border-radius: 0.35rem; background: var(--cd-danger-bg, #fee2e2); color: var(--cd-danger-ink, #991b1b); font-size: 0.7rem; font-weight: 650; line-height: 1; cursor: pointer; }
.breakdown-card__remove:hover:not(:disabled) { background: #fecaca; }
.breakdown-card__remove:disabled { opacity: 0.5; cursor: wait; }

.action-button--pay { background-color: var(--cd-success, #059669); }
.action-button--pay:hover:not(:disabled) { background-color: #047857; }

/* ===================== Fatura da competência ===================== */
.invoice-hero { display: grid; grid-template-columns: minmax(13rem, 20rem) 1fr; gap: 1.25rem 2rem; align-items: start; margin-bottom: 1.75rem; padding: 1.5rem; border-radius: 0.9rem; background: var(--cd-gradient, linear-gradient(140deg, #0c3f68, #0369a1)); box-shadow: var(--cd-shadow, 0 10px 24px rgba(7, 89, 133, 0.22)); color: #fff; }
.invoice-hero__main { min-width: 0; }
.invoice-hero__label { display: block; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(255, 255, 255, 0.72); }
.invoice-hero__value { display: block; margin-top: 0.3rem; font-size: 2.4rem; font-weight: 780; line-height: 1.1; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.invoice-hero__badges { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.7rem; }

.invoice-hero__facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr)); gap: 1rem; margin: 0; }
.invoice-hero__facts > div { min-width: 0; }
.invoice-hero__facts dt { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(255, 255, 255, 0.66); }
.invoice-hero__facts dd { margin: 0.2rem 0 0; font-size: 0.95rem; font-weight: 650; font-variant-numeric: tabular-nums; }
.invoice-hero__facts small { display: block; margin-top: 0.15rem; font-size: 0.7rem; color: rgba(255, 255, 255, 0.6); overflow-wrap: anywhere; }
.invoice-hero__hint { grid-column: 1 / -1; margin: 0; padding-top: 0.9rem; border-top: 1px solid rgba(255, 255, 255, 0.16); font-size: 0.78rem; line-height: 1.45; color: rgba(255, 255, 255, 0.78); }
/* Cobrança no provedor, dentro do cartão da fatura: é ali que se decide se o
   valor vai para fora, e ficar longe do valor separaria a decisão do número. */
.charge-box { grid-column: 1 / -1; display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 0.75rem; padding-top: 0.9rem; border-top: 1px solid rgba(255, 255, 255, 0.16); }
.charge-box__head { display: flex; align-items: baseline; gap: 0.45rem; }
.charge-box__label { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(255, 255, 255, 0.66); }
.charge-box__status { font-size: 0.82rem; font-weight: 700; color: #fff; }
.charge-box__status.is-off { color: rgba(255, 255, 255, 0.6); font-weight: 600; }
.charge-box__actions { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-left: auto; }
.charge-btn { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.4rem 0.8rem; border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 6px; background: transparent; color: #fff; font-size: 0.78rem; font-weight: 650; cursor: pointer; text-decoration: none; transition: background-color 0.15s, opacity 0.15s; }
.charge-btn:hover:not(:disabled) { background: rgba(255, 255, 255, 0.16); }
.charge-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.charge-btn--solid { background: #fff; border-color: #fff; color: var(--cd-blue-800, #075985); }
.charge-btn--solid:hover:not(:disabled) { background: #e0f2fe; }
.charge-btn--danger { border-color: rgba(254, 202, 202, 0.55); color: #fecaca; }
.charge-btn--danger:hover:not(:disabled) { background: rgba(185, 28, 28, 0.35); }
.charge-box__hint, .charge-box__msg { flex: 1 1 100%; margin: 0; font-size: 0.76rem; line-height: 1.45; color: rgba(255, 255, 255, 0.78); }
.charge-box__msg.is-error { color: #fecaca; font-weight: 650; }

/* Congelada x ainda mutável: informação que já chegava do backend e nenhuma
   tela mostrava, e é ela que responde "posso cobrar este valor?". */
.status-frozen { background-color: #e0e7ff; color: #3730a3; }
.status-live { background-color: #fef3c7; color: #92400e; }
.invoice-hero .status-frozen, .invoice-hero .status-live { background-color: rgba(255, 255, 255, 0.18); color: #fff; }

/* ===================== Composição por categoria ===================== */
.breakdown { display: grid; grid-template-columns: repeat(auto-fit, minmax(19rem, 1fr)); gap: 1rem; margin-bottom: 1.75rem; }
.breakdown-card { display: flex; flex-direction: column; padding: 1.1rem; border: 1px solid var(--cd-line, #dbe7f0); border-radius: 0.8rem; background: #fff; box-shadow: 0 4px 14px rgba(15, 71, 105, 0.05); }
.breakdown-card__head { display: flex; align-items: baseline; justify-content: space-between; gap: 0.75rem; }
.breakdown-card__head h3 { margin: 0; font-size: 0.9rem; font-weight: 700; color: var(--cd-ink, #0f172a); }
.breakdown-card__head strong { font-size: 1.15rem; font-weight: 780; color: var(--cd-blue-700, #0369a1); font-variant-numeric: tabular-nums; }
.breakdown-card__share { margin: 0.3rem 0 0.6rem; font-size: 0.76rem; color: var(--cd-muted, #64748b); }
.breakdown-card__bar { height: 5px; border-radius: 999px; background: #eef4f9; overflow: hidden; }
.breakdown-card__bar span { display: block; height: 100%; border-radius: 999px; background: var(--cd-gradient, linear-gradient(140deg, #0c3f68, #0369a1)); }
.breakdown-card__list { margin: 0.85rem 0 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 0.5rem; }
.breakdown-card__list li { display: grid; grid-template-columns: 1fr auto; gap: 0.15rem 0.75rem; padding-top: 0.5rem; border-top: 1px solid #f1f5f9; }
.breakdown-card__list li:first-child { padding-top: 0; border-top: none; }
.breakdown-card__desc { font-size: 0.82rem; font-weight: 600; color: var(--cd-ink, #0f172a); overflow-wrap: anywhere; }
.breakdown-card__total { font-size: 0.85rem; font-weight: 750; color: var(--cd-ink, #0f172a); text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
.breakdown-card__qty { grid-column: 1 / -1; font-size: 0.73rem; color: var(--cd-muted, #64748b); font-variant-numeric: tabular-nums; }

/* ===================== Histórico ===================== */
.table-head-row { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 0.5rem; padding: 1.25rem 1.5rem; border-bottom: 1px solid #e5e7eb; }
.table-title--flush { padding: 0; border-bottom: none; font-size: 1.1rem; }
.table-summary { font-size: 0.8rem; font-weight: 600; color: var(--cd-muted, #64748b); font-variant-numeric: tabular-nums; }
.history-table th { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: var(--cd-muted, #64748b); background: #f8fafc; }
.history-table td { font-size: 0.85rem; color: #334155; vertical-align: top; }
.history-table .num { text-align: right; font-variant-numeric: tabular-nums; }
.history-table .strong { font-weight: 700; color: var(--cd-ink, #0f172a); }
.history-table tr.is-selected { background: #f0f9ff; }
.history-table tr.is-selected .period-code { color: var(--cd-blue-800, #075985); font-weight: 750; }

/* `text-transform: capitalize` saiu daqui: ele maiúscula CADA palavra e
   produzia "Agosto De 2026". A primeira letra agora é tratada em periodLabel. */
.period-code { font-weight: 600; }

/* Ações no rodapé do modal de detalhes. Rolam com o modal e ficam agrupadas à
   direita, com as mensagens ocupando a linha inteira acima. */
.details-actions { width: 100%; }
.details-actions__row { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 0.5rem; }

/* Guia de passo: fica acima dos botões, ocupando a linha, porque é o que se lê
   ANTES de decidir qual botão apertar. */
.details-actions__step { display: flex; align-items: flex-start; gap: 0.5rem; margin: 0 0 0.7rem; padding: 0.6rem 0.75rem; border: 1px solid var(--cd-line, #dbe7f0); border-left: 3px solid var(--cd-blue-600, #0284c7); border-radius: 0.45rem; background: #f8fbfe; color: #475569; font-size: 0.79rem; line-height: 1.5; }
.details-actions__step strong { color: var(--cd-ink, #0f172a); }
.details-actions__step-icon { display: inline-flex; flex: 0 0 auto; margin-top: 0.05rem; color: var(--cd-blue-700, #0369a1); }

/* Ícone dentro do botão. `flex: 0 0 auto` impede que ele encolha quando o
   rótulo é longo e a barra de ações quebra em duas linhas. */
.btn-ico { display: inline-flex; align-items: center; gap: 0.4rem; }
.btn-ico svg { flex: 0 0 auto; }
.details-actions__msg { margin: 0 0 0.6rem; padding: 0.5rem 0.7rem; border-radius: 0.45rem; background: #f0f9ff; color: var(--cd-blue-800, #075985); font-size: 0.8rem; line-height: 1.45; }
.details-actions__msg.is-error { background: var(--cd-danger-bg, #fee2e2); color: var(--cd-danger-ink, #991b1b); font-weight: 650; }
.action-button--danger { background-color: #b91c1c; }
.action-button--danger:hover:not(:disabled) { background-color: #991b1b; }
.cell-note { display: block; margin-top: 0.2rem; font-size: 0.7rem; color: #94a3b8; }
.details-button:hover { background-color: #1d4ed8; }

@media (max-width: 720px) {
  .invoice-hero { grid-template-columns: 1fr; }
  .invoice-hero__value { font-size: 2rem; }
  .filters-and-actions { flex-direction: column; align-items: stretch; gap: 0.75rem; }
  .actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
}
.inline-error { margin: 0 0 1rem; padding: 0.6rem 0.8rem; border-radius: 0.45rem; background: var(--cd-danger-bg, #fee2e2); color: var(--cd-danger-ink, #991b1b); font-size: 0.83rem; font-weight: 600; }
.manual-service-form { padding: 0.25rem 0 0; display: flex; flex-direction: column; gap: 1.1rem; }
/* Destino do lançamento: substituiu dois campos desabilitados que pareciam
   preenchíveis e só repetiam informação que a tela já mostra. */
.manual-target { display: flex; align-items: center; gap: 0.5rem; margin: 0; padding: 0.65rem 0.8rem; border: 1px solid var(--cd-line, #dbe7f0); border-radius: 0.5rem; background: #f8fbfe; color: #475569; font-size: 0.82rem; line-height: 1.45; }
.manual-target svg { flex: 0 0 auto; color: var(--cd-blue-700, #0369a1); }
.manual-target strong { color: var(--cd-ink, #0f172a); }
.form-hint { margin-top: 0.35rem; color: #94a3b8; font-size: 0.73rem; line-height: 1.4; }

/* ---------------- Formulário de dados de cobrança ---------------- */
.billing-form { display: flex; flex-direction: column; gap: 1rem; padding-top: 0.25rem; }
.billing-form__intro { display: flex; align-items: flex-start; gap: 0.5rem; margin: 0; padding: 0.65rem 0.8rem; border: 1px solid var(--cd-line, #dbe7f0); border-left: 3px solid var(--cd-blue-600, #0284c7); border-radius: 0.45rem; background: #f8fbfe; color: #475569; font-size: 0.79rem; line-height: 1.5; }
.billing-form__intro svg { flex: 0 0 auto; margin-top: 0.1rem; color: var(--cd-blue-700, #0369a1); }
.billing-form__intro strong { color: var(--cd-ink, #0f172a); }
.billing-form__error { margin: 0; padding: 0.6rem 0.8rem; border-radius: 0.45rem; background: var(--cd-danger-bg, #fee2e2); color: var(--cd-danger-ink, #991b1b); font-size: 0.82rem; font-weight: 650; line-height: 1.45; }

.billing-fieldset { margin: 0; padding: 0.9rem 1rem 0.4rem; border: 1px solid var(--cd-line, #dbe7f0); border-radius: 0.6rem; }
.billing-fieldset legend { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0 0.4rem; color: var(--cd-blue-800, #075985); font-size: 0.82rem; font-weight: 750; }
.billing-fieldset legend svg { flex: 0 0 auto; }
.billing-fieldset legend small { color: #94a3b8; font-size: 0.7rem; font-weight: 600; }
.billing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr)); gap: 0 0.75rem; }
.billing-grid .form-group--wide { grid-column: 1 / -1; }
.billing-grid .form-group { margin-bottom: 0.85rem; }

/* Campo que o backend apontou como faltando. O destaque é a diferença entre
   "deu erro" e "preencha ISTO". */
.form-group.is-missing input { border-color: #f59e0b; background: #fffbeb; }
.form-group.is-missing label { color: #9a5700; }
.req { padding: 0.05rem 0.35rem; border-radius: 999px; background: var(--cd-danger-bg, #fee2e2); color: var(--cd-danger-ink, #991b1b); font-size: 0.63rem; font-weight: 750; letter-spacing: 0.03em; text-transform: uppercase; }

@media (min-width: 34rem) {
  .billing-grid { grid-template-columns: 1fr 1fr 1fr; }
}
.form-group { display: flex; flex-direction: column; }
.form-group label { display: inline-flex; align-items: center; gap: 0.32rem; margin-bottom: 0.5rem; font-weight: 600; color: #374151; font-size: 0.85rem; }
.form-group label svg { flex: 0 0 auto; color: var(--cd-blue-700, #0369a1); }
.form-group input, .form-group select { padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 1rem; }
.form-group input:disabled { background-color: #f3f4f6; }
/* `.form-actions` saiu: os botões do modal de avulso passaram para o slot
   #footer do UniversalModal, que já alinha à direita com espaçamento. */
.btn-primary { background-color: #2563eb; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; font-weight: 600; cursor: pointer; }
.btn-primary:disabled { background-color: #9ca3af; cursor: wait; }
.btn-secondary { background-color: #e5e7eb; color: #374151; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; font-weight: 600; cursor: pointer; }
.error-text { color: #ef4444; font-size: 0.875rem; text-align: center; }

/* Estilos para skeleton loader */
@keyframes pulse {
  50% { opacity: 0.6; }
}
.skeleton-loader { padding: 1rem; }
.sk-header, .sk-card, .sk-row, .sk-filters, .sk-table-header, .sk-card-title, .sk-card-value, .sk-card-description, .sk-cell,
.sk-detail-block, .sk-detail-title, .sk-detail-item, .sk-filter-group, .sk-action-button, .sk-table-title, .sk-table-head, .sk-head-cell { 
  background-color: #e5e7eb; 
  border-radius: 6px; 
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; 
}
.sk-header { height: 38px; width: 40%; margin-bottom: 2rem; }
.sk-filters { height: 60px; margin-bottom: 2rem; border-radius: 0.75rem; display: flex; justify-content: space-between; padding: 1rem; }
.sk-filter-group { width: 200px; height: 36px; }
.sk-action-button { width: 150px; height: 36px; }
.sk-grid-5 { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem; }
.sk-card { height: 140px; border-radius: 0.75rem; padding: 1rem; display: flex; flex-direction: column; }
.sk-card-title { height: 16px; width: 70%; margin-bottom: 1rem; }
.sk-card-value { height: 36px; width: 60%; margin-bottom: 1rem; }
.sk-card-description { height: 14px; width: 80%; }
.sk-table-header { height: 80px; margin-bottom: 0; border-radius: 0.75rem 0.75rem 0 0; display: flex; flex-direction: column; }
.sk-table-title { height: 24px; width: 30%; margin: 1rem; }
.sk-table-head { display: flex; padding: 0 1rem; gap: 1rem; height: 40px; }
.sk-head-cell { flex: 1; height: 20px; }
.sk-table { width: 100%; border-radius: 0 0 0.75rem 0.75rem; }
.sk-row { height: 48px; margin-bottom: 0.5rem; display: flex; gap: 1rem; padding: 0 1rem; }
.sk-cell { flex: 1; height: 20px; }
.sk-row:last-child { margin-bottom: 0; }

/* Estilos para o skeleton do modal de detalhes */
.invoice-details-skeleton { padding: 0; }
.sk-detail-block { padding: 1rem; margin-bottom: 1rem; border-radius: 0.5rem; }
.sk-detail-title { height: 20px; width: 40%; margin-bottom: 1rem; }
.sk-detail-item { height: 16px; width: 80%; margin-bottom: 0.5rem; }
.sk-detail-item:last-child { margin-bottom: 0; }
</style>
