<!-- Painel completo de cobrança de UM cliente, aberto dentro da central de
     cobranças. Tudo que antes exigia ir à tela individual do cliente está aqui:
     composição da fatura, avulsos, fechar/reabrir, baixa manual, cobrança no
     Asaas (emitir, sincronizar, prazo, cancelar), descrição, histórico de
     faturas e dados de cobrança. Sem rolagem própria: o painel cresce dentro da
     página, que é a única coisa que rola. -->
<template>
  <section class="painel" :aria-label="`Cobrança de ${cliente.nome}`">
    <header class="painel__topo">
      <div class="painel__periodo">
        <span class="painel__rotulo">Competência</span>
        <strong>{{ periodLabel(periodo) }}</strong>
        <button v-if="periodo !== competencia" type="button" class="link-btn" @click="irPara(competencia)">
          Voltar para {{ periodLabel(competencia) }}
        </button>
      </div>

      <div class="abas" role="tablist" aria-label="Seções do cliente">
        <button
          v-for="opcao in ABAS"
          :id="`aba-${idBase}-${opcao.key}`"
          :key="opcao.key"
          type="button"
          role="tab"
          class="abas__item"
          :class="{ 'is-active': aba === opcao.key }"
          :aria-selected="aba === opcao.key"
          :aria-controls="`painel-${idBase}-${opcao.key}`"
          @click="aba = opcao.key"
        >
          {{ opcao.label }}
          <span v-if="opcao.key === 'historico' && invoices.length" class="abas__count">{{ invoices.length }}</span>
          <span v-if="opcao.key === 'cadastro' && !temDocumento" class="abas__alerta" title="Falta CPF/CNPJ">!</span>
        </button>
      </div>
    </header>

    <p v-if="aviso" class="aviso" :class="`is-${aviso.tipo}`" role="status">{{ aviso.texto }}</p>

    <!-- ============================ FATURA ============================ -->
    <div
      v-show="aba === 'fatura'"
      :id="`painel-${idBase}-fatura`"
      role="tabpanel"
      :aria-labelledby="`aba-${idBase}-fatura`"
      class="painel__corpo"
    >
      <p v-if="isLoading && !fatura" class="painel__estado">Carregando a fatura...</p>
      <p v-else-if="error && !fatura" class="painel__estado is-error">
        {{ error }}
        <button type="button" class="link-btn" @click="carregar()">Tentar de novo</button>
      </p>
      <p v-else-if="!fatura" class="painel__estado">Sem fatura nesta competência.</p>

      <template v-else>
        <div class="resumo">
          <div class="resumo__valor">
            <span class="painel__rotulo">Total da fatura</span>
            <strong>{{ formatarMoeda(fatura.totalAmount) }}</strong>
            <span class="pill" :class="situacao.classe">{{ situacao.label }}</span>
            <small v-if="valorEmAndamento" class="resumo__dica">Valor de agora. Pode mudar até gerar a cobrança.</small>
          </div>
          <dl class="resumo__fatos">
            <div>
              <dt>Vencimento</dt>
              <dd>{{ formatarData(isoDeData(fatura.due_date)) }}</dd>
            </div>
            <div>
              <dt>Valor do mês</dt>
              <dd>{{ fatura.isClosed ? 'Definitivo' : 'Pode mudar' }}</dd>
              <small v-if="fatura.isClosed && fatura.closedAtLabel">desde {{ fatura.closedAtLabel }}</small>
            </div>
            <div>
              <dt>Pagamento</dt>
              <dd>{{ fatura.paymentDate || 'Em aberto' }}</dd>
              <small v-if="fatura.paidBy">baixa por {{ fatura.paidBy }}</small>
            </div>
            <div>
              <dt>Cobrança no Asaas</dt>
              <dd :class="{ 'is-overdue': fatura.asaasStatus === 'OVERDUE' }">
                {{ fatura.asaasPaymentId ? (asaasStatusLabel(fatura.asaasStatus) || 'Cobrança criada') : 'Ainda não criada' }}
              </dd>
              <small v-if="fatura.asaasPaymentId">{{ fatura.asaasPaymentId }}</small>
            </div>
          </dl>
        </div>

        <div v-if="divergente" class="aviso is-erro aviso--acao">
          <span>
            Os serviços somam {{ formatarMoeda(somaDosItens) }}, mas o total da fatura é {{ formatarMoeda(fatura.totalAmount) }}.
            Reabra a fatura para recalcular antes de gerar a cobrança.
          </span>
          <button type="button" class="btn btn-secondary btn-sm btn-with-icon" :disabled="Boolean(ocupado)" @click="reabrir">
            <IconeSvg nome="destravar" :tamanho="14" />
            {{ ocupado === 'reabrir' ? 'Reabrindo...' : 'Reabrir para recalcular' }}
          </button>
        </div>

        <!-- Ações: só aparece o que faz sentido no estado atual da fatura. Todo
             botão tem ícone E nome. -->
        <div class="acoes">
          <button v-if="podeGerar" type="button" class="btn btn-primary btn-with-icon" :disabled="Boolean(ocupado)" @click="pedirEmissao">
            <IconeSvg nome="enviar" />
            Gerar cobrança
          </button>

          <button
            v-if="!fatura.isClosed && !fatura.asaasPaymentId && !paga"
            type="button"
            class="btn btn-secondary btn-with-icon"
            :disabled="Boolean(ocupado)"
            @click="abrirAvulso"
          >
            <IconeSvg nome="mais" />
            Lançar avulso
          </button>

          <template v-if="fatura.asaasPaymentId">
            <a
              v-if="fatura.asaasInvoiceUrl"
              class="btn btn-secondary btn-with-icon"
              :href="fatura.asaasInvoiceUrl"
              target="_blank"
              rel="noopener noreferrer"
              title="Abre a fatura no Asaas, do jeito que o cliente vê"
            >
              <IconeSvg nome="link" />
              Abrir fatura
            </a>
            <button
              type="button"
              class="btn btn-secondary btn-with-icon"
              :disabled="Boolean(ocupado)"
              title="Confere no Asaas se o cliente já pagou"
              @click="sincronizar"
            >
              <IconeSvg nome="atualizar" />
              {{ ocupado === 'sincronizar' ? 'Conferindo...' : 'Conferir pagamento' }}
            </button>
            <button v-if="!paga" type="button" class="btn btn-secondary btn-with-icon" :disabled="Boolean(ocupado)" @click="abrirVencimento">
              <IconeSvg nome="calendario" />
              Alterar vencimento
            </button>
          </template>

          <button
            v-if="!paga"
            type="button"
            class="btn btn-secondary btn-with-icon"
            :disabled="Boolean(ocupado)"
            title="Para pagamento recebido por fora do Asaas"
            @click="abrirBaixa"
          >
            <IconeSvg nome="check" />
            Marcar como paga
          </button>
          <button v-else type="button" class="btn btn-secondary btn-with-icon" :disabled="Boolean(ocupado)" @click="desfazerBaixa">
            <IconeSvg nome="desfazer" />
            {{ ocupado === 'baixa' ? 'Salvando...' : 'Desfazer baixa' }}
          </button>

          <button
            type="button"
            class="btn btn-ghost btn-with-icon"
            :disabled="carregandoDescricao"
            :aria-expanded="Boolean(descricao)"
            title="O texto que vai na cobrança do Asaas: cada serviço com quantidade e valor"
            @click="alternarDescricao"
          >
            <IconeSvg nome="documento" />
            {{ carregandoDescricao ? 'Montando...' : (descricao ? 'Ocultar descrição' : 'Ver descrição') }}
          </button>

          <span class="acoes__espaco"></span>

          <button
            v-if="fatura.isClosed && !paga && !divergente"
            type="button"
            class="btn btn-ghost btn-with-icon"
            :disabled="Boolean(ocupado)"
            title="Destrava o valor do mês para lançar avulso ou recalcular. Depois é só gerar a cobrança de novo"
            @click="reabrir"
          >
            <IconeSvg nome="destravar" />
            {{ ocupado === 'reabrir' ? 'Reabrindo...' : 'Reabrir para alterar' }}
          </button>
          <button
            v-if="fatura.asaasPaymentId && !paga"
            type="button"
            class="btn btn-danger-ghost btn-with-icon"
            :disabled="Boolean(ocupado)"
            @click="cancelarCobranca"
          >
            <IconeSvg nome="cancelar" />
            {{ ocupado === 'cancelar' ? 'Cancelando...' : 'Cancelar cobrança' }}
          </button>
        </div>

        <p v-if="semValor" class="nota">
          Nada a cobrar neste mês por enquanto.<template v-if="!fatura.isClosed"> Se faltar algum serviço, use "Lançar avulso".</template>
        </p>

        <!-- Formulários curtos, no lugar onde a decisão é tomada. -->
        <form v-if="vencimentoForm.aberto" class="mini-form" @submit.prevent="salvarVencimento">
          <label :for="`venc-${idBase}`">Novo vencimento</label>
          <input :id="`venc-${idBase}`" v-model="vencimentoForm.data" type="date" :min="hoje" required />
          <button type="submit" class="btn btn-primary btn-sm" :disabled="Boolean(ocupado)">
            {{ ocupado === 'vencimento' ? 'Salvando...' : 'Salvar vencimento' }}
          </button>
          <button type="button" class="btn btn-secondary btn-sm" @click="vencimentoForm.aberto = false">Cancelar</button>
          <small>Muda só a data no Asaas. O valor não muda por aqui.</small>
        </form>

        <form v-if="baixaForm.aberto" class="mini-form" @submit.prevent="confirmarBaixa">
          <label :for="`baixa-${idBase}`">Data do pagamento</label>
          <input :id="`baixa-${idBase}`" v-model="baixaForm.data" type="date" :max="hoje" required />
          <button type="submit" class="btn btn-primary btn-sm" :disabled="Boolean(ocupado)">
            {{ ocupado === 'baixa' ? 'Salvando...' : 'Confirmar baixa' }}
          </button>
          <button type="button" class="btn btn-secondary btn-sm" @click="baixaForm.aberto = false">Cancelar</button>
          <small v-if="fatura.asaasPaymentId">A cobrança no Asaas continua aberta: cancele-a se o cliente pagou por fora.</small>
        </form>

        <div v-if="descricao" class="descricao">
          <span class="painel__rotulo">Descrição que vai para o Asaas</span>
          <pre>{{ descricao.description }}</pre>
          <small :class="{ 'is-error': !descricao.matches }">
            {{ descricao.length }}/{{ descricao.limit }} caracteres
            <template v-if="descricao.groupedItems"> · {{ descricao.groupedItems }} serviços agrupados para caber no limite</template>
            <template v-if="!descricao.matches"> · os itens não somam o total: a emissão será recusada</template>
            <template v-else-if="!descricao.closed"> · competência aberta: ainda pode mudar</template>
          </small>
        </div>

        <!-- Composição por categoria. -->
        <div class="composicao">
          <article v-for="grupo in grupos" :key="grupo.key" class="grupo">
            <header class="grupo__topo">
              <h4>{{ grupo.label }}</h4>
              <span>{{ grupo.itens.length }} {{ grupo.itens.length === 1 ? 'item' : 'itens' }}</span>
              <strong>{{ formatarMoeda(grupo.subtotal) }}</strong>
            </header>
            <ul class="itens">
              <li v-for="item in grupo.itens" :key="item.id" class="item">
                <span class="item__desc">
                  {{ item.description }}
                  <small v-if="item.service_date">feito em {{ formatarData(isoDeData(item.service_date)) }}</small>
                </span>
                <span class="item__qtd">{{ quantidadeDoItem(item) }}</span>
                <span class="item__unit">{{ formatarMoeda(item.unit_price) }}</span>
                <span class="item__total">{{ formatarMoeda(item.total_price) }}</span>
                <button
                  v-if="item.type === 'manual' && !fatura.isClosed && !fatura.asaasPaymentId"
                  type="button"
                  class="item__remover"
                  :disabled="Boolean(ocupado)"
                  :title="`Remover ${item.description} desta fatura`"
                  @click="removerAvulso(item)"
                >
                  <IconeSvg nome="lixo" :tamanho="14" />
                  Remover
                </button>
              </li>
            </ul>
          </article>
          <p v-if="!grupos.length" class="painel__estado">Nenhum serviço nesta competência.</p>
        </div>

        <form v-if="avulsoForm.aberto" class="avulso" @submit.prevent="lancarAvulso">
          <h4 class="avulso__titulo">Lançar serviço avulso em {{ periodLabel(periodo) }}</h4>
          <div class="avulso__grade">
            <div class="campo campo--largo">
              <label :for="`av-servico-${idBase}`">Serviço</label>
              <select :id="`av-servico-${idBase}`" v-model="avulsoForm.serviceId" required>
                <option disabled value="">Selecione um serviço</option>
                <option v-for="servico in manualServices" :key="servico.id" :value="servico.id">
                  {{ servico.name }}{{ servico.type === 'avulso_simples' && servico.price !== null ? ` · ${formatarMoeda(servico.price)}` : '' }}
                </option>
              </select>
            </div>
            <div class="campo">
              <label :for="`av-data-${idBase}`">Feito em</label>
              <input :id="`av-data-${idBase}`" v-model="avulsoForm.serviceDate" type="date" required />
            </div>
            <div v-if="avulsoPorQuantidade" class="campo">
              <label :for="`av-qtd-${idBase}`">{{ servicoSelecionado?.config?.quantity_label || 'Quantidade' }}</label>
              <input :id="`av-qtd-${idBase}`" v-model.number="avulsoForm.quantity" type="number" min="1" step="1" required />
            </div>
          </div>
          <small v-if="servicoSelecionado?.config?.tiers?.length" class="avulso__dica">
            Preço por faixa:
            <template v-for="(faixa, i) in servicoSelecionado.config.tiers" :key="i">
              <template v-if="i"> · </template>{{ faixa.from }}{{ faixa.to ? `-${faixa.to}` : '+' }}: {{ formatarMoeda(faixa.price) }}
            </template>
          </small>
          <p v-if="avulsoForm.erro" class="avulso__erro">{{ avulsoForm.erro }}</p>
          <div class="avulso__acoes">
            <button type="button" class="btn btn-secondary btn-sm" @click="avulsoForm.aberto = false">Cancelar</button>
            <button type="submit" class="btn btn-primary btn-sm btn-with-icon" :disabled="Boolean(ocupado)">
              <IconeSvg nome="mais" :tamanho="14" />
              {{ ocupado === 'avulso' ? 'Lançando...' : 'Lançar na fatura' }}
            </button>
          </div>
        </form>
      </template>
    </div>

    <!-- ============================ HISTÓRICO ============================ -->
    <div
      v-show="aba === 'historico'"
      :id="`painel-${idBase}-historico`"
      role="tabpanel"
      :aria-labelledby="`aba-${idBase}-historico`"
      class="painel__corpo"
    >
      <div class="historico__resumo">
        <div><span class="painel__rotulo">Faturado (todas)</span><strong>{{ formatarMoeda(resumoHistorico.faturado) }}</strong></div>
        <div><span class="painel__rotulo">Em aberto</span><strong>{{ formatarMoeda(resumoHistorico.emAberto) }}</strong></div>
        <div><span class="painel__rotulo">Pagas</span><strong>{{ resumoHistorico.pagas }} de {{ invoices.length }}</strong></div>
      </div>
      <p v-if="!invoices.length" class="painel__estado">Nenhuma fatura registrada para este cliente.</p>
      <ul v-else class="historico">
        <li v-for="inv in historico" :key="inv.period">
          <button
            type="button"
            class="historico__linha"
            :class="{ 'is-atual': inv.period === periodo }"
            :aria-current="inv.period === periodo ? 'true' : undefined"
            @click="irPara(inv.period); aba = 'fatura'"
          >
            <span class="historico__periodo">{{ periodLabel(inv.period) }}</span>
            <span class="pill" :class="situacaoDaFatura(inv).classe">{{ situacaoDaFatura(inv).label }}</span>
            <span class="historico__venc">vence {{ formatarData(isoDeData(inv.due_date)) }}</span>
            <strong class="historico__valor">{{ formatarMoeda(inv.totalAmount) }}</strong>
          </button>
        </li>
      </ul>
    </div>

    <!-- ============================ CADASTRO ============================ -->
    <div
      v-show="aba === 'cadastro'"
      :id="`painel-${idBase}-cadastro`"
      role="tabpanel"
      :aria-labelledby="`aba-${idBase}-cadastro`"
      class="painel__corpo"
    >
      <p v-if="cadastro.carregando" class="painel__estado">Carregando os dados de cobrança...</p>
      <form v-else class="cadastro" @submit.prevent="salvarCadastro">
        <p class="cadastro__intro">
          O Asaas exige o <strong>CPF ou CNPJ</strong> do pagador. <strong>CEP e número</strong> só são exigidos para boleto.
        </p>
        <p v-if="cadastro.erro" class="aviso is-erro aviso--fixo">{{ cadastro.erro }}</p>

        <div class="cadastro__grade">
          <div class="campo" :class="{ 'is-invalid': erroDoc, 'is-missing': falta('cpfCnpj') }">
            <label :for="`cad-doc-${idBase}`">CPF ou CNPJ <span class="req">obrigatório</span> <span v-if="tipoDoc" class="tipo">{{ tipoDoc }}</span></label>
            <input
              :id="`cad-doc-${idBase}`"
              type="text"
              :value="cadastro.campos.cpfCnpj"
              inputmode="numeric"
              autocomplete="off"
              placeholder="000.000.000-00"
              @input="cadastro.campos.cpfCnpj = mascaraDocumento($event.target.value)"
            />
            <small v-if="erroDoc" class="campo__erro">{{ erroDoc }}</small>
          </div>
          <div class="campo" :class="{ 'is-invalid': erroFone }">
            <label :for="`cad-fone-${idBase}`">Telefone</label>
            <input
              :id="`cad-fone-${idBase}`"
              type="text"
              :value="cadastro.campos.phone"
              inputmode="numeric"
              autocomplete="off"
              placeholder="(11) 91234-5678"
              @input="cadastro.campos.phone = mascaraTelefone($event.target.value)"
            />
            <small v-if="erroFone" class="campo__erro">{{ erroFone }}</small>
          </div>
          <div class="campo" :class="{ 'is-invalid': erroDoCep, 'is-missing': falta('postalCode') }">
            <label :for="`cad-cep-${idBase}`">CEP</label>
            <input
              :id="`cad-cep-${idBase}`"
              type="text"
              :value="cadastro.campos.postalCode"
              inputmode="numeric"
              autocomplete="off"
              placeholder="00000-000"
              @input="cadastro.campos.postalCode = mascaraCep($event.target.value)"
            />
            <small v-if="erroDoCep" class="campo__erro">{{ erroDoCep }}</small>
          </div>
          <div class="campo" :class="{ 'is-missing': falta('addressNumber') }">
            <label :for="`cad-num-${idBase}`">Número</label>
            <input :id="`cad-num-${idBase}`" v-model="cadastro.campos.addressNumber" type="text" maxlength="20" placeholder="123" />
          </div>
          <div class="campo campo--largo">
            <label :for="`cad-rua-${idBase}`">Logradouro</label>
            <input :id="`cad-rua-${idBase}`" v-model="cadastro.campos.address" type="text" maxlength="255" placeholder="Rua, avenida..." />
          </div>
          <div class="campo">
            <label :for="`cad-compl-${idBase}`">Complemento</label>
            <input :id="`cad-compl-${idBase}`" v-model="cadastro.campos.addressComplement" type="text" maxlength="100" placeholder="Sala, bloco..." />
          </div>
          <div class="campo">
            <label :for="`cad-bairro-${idBase}`">Bairro</label>
            <input :id="`cad-bairro-${idBase}`" v-model="cadastro.campos.province" type="text" maxlength="100" />
          </div>
          <div class="campo">
            <label :for="`cad-cidade-${idBase}`">Cidade</label>
            <input :id="`cad-cidade-${idBase}`" v-model="cadastro.campos.cityName" type="text" maxlength="100" />
          </div>
          <div class="campo campo--curto">
            <label :for="`cad-uf-${idBase}`">UF</label>
            <input
              :id="`cad-uf-${idBase}`"
              type="text"
              :value="cadastro.campos.state"
              maxlength="2"
              autocomplete="off"
              placeholder="SP"
              @input="cadastro.campos.state = mascaraUf($event.target.value)"
            />
          </div>
        </div>

        <div class="cadastro__acoes">
          <button type="submit" class="btn btn-primary btn-with-icon" :disabled="cadastro.salvando || !podeSalvarCadastro">
            <IconeSvg nome="salvar" />
            {{ cadastro.salvando ? 'Salvando...' : 'Salvar dados' }}
          </button>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup>
/* global defineProps, defineEmits */
import { ref, computed, watch, onMounted } from 'vue';
import { useBilling } from '@/composables/useBilling';
import { useConfirm } from '@/composables/useConfirm';
import IconeSvg from '@/components/IconeSvg.vue';
import { asaasStatusLabel } from '@/utils/asaasStatus';
import {
  apenasDigitos, mascaraDocumento, mascaraCep, mascaraTelefone, mascaraUf,
  erroDocumento, erroCep, erroTelefone, tipoDocumento,
} from '@/utils/documentoFiscal';
import {
  periodLabel, formatarMoeda, formatarData, isoDeData, somarDias, dataValida,
  mensagemDeErro, paraCentavos, competenciaDeHoje,
} from '@/utils/cobrancaUi';
import { codigoDoErro } from '@/utils/loteDeCobranca';

const props = defineProps({
  /** Linha da visão geral: { uid, nome, linked, hasDocument, ... }. */
  cliente: { type: Object, required: true },
  /** Competência da página (AAAA-MM). O painel pode navegar para outras. */
  competencia: { type: String, required: true },
  /** "Hoje" de Brasília, AAAA-MM-DD. */
  hoje: { type: String, required: true },
  /** Incrementado pela página quando ela mudou algo deste cliente (lote, ação da linha). */
  versao: { type: Number, default: 0 },
  abaInicial: { type: String, default: 'fatura' },
});

/* `alterado`: a página recarrega a visão geral (status, total, flags).
 * `emitir`: a emissão passa pelo mesmo modal do lote, com revisão e progresso. */
const emit = defineEmits(['alterado', 'emitir']);

const {
  invoices,
  isLoading,
  error,
  manualServices,
  fetchInvoices,
  fetchManualServices,
  addManualService,
  deleteManualItem,
  setInvoiceStatus,
  reopenInvoicePeriod,
  fetchBillingInfo,
  saveBillingInfo,
  ensureAsaasCustomer,
  syncCharge,
  updateChargeDueDate,
  cancelCharge,
  fetchChargePreview,
} = useBilling();
const { confirm } = useConfirm();

const ABAS = [
  { key: 'fatura', label: 'Fatura' },
  { key: 'historico', label: 'Histórico' },
  { key: 'cadastro', label: 'Dados de cobrança' },
];

const uid = computed(() => props.cliente.uid);
/* ids únicos por painel para label/aria; o uid pode ter caractere ruim para id. */
const idBase = computed(() => String(props.cliente.uid).replace(/[^A-Za-z0-9_-]/g, '_'));

const periodo = ref(props.competencia);
const aba = ref(props.abaInicial);
const ocupado = ref('');
const aviso = ref(null);
const vinculado = ref(Boolean(props.cliente.linked));
const temDocumento = ref(Boolean(props.cliente.hasDocument));

watch(() => props.cliente.linked, (valor) => { vinculado.value = Boolean(valor); });
watch(() => props.cliente.hasDocument, (valor) => { temDocumento.value = Boolean(valor); });
watch(() => props.abaInicial, (valor) => { aba.value = valor; });

function avisar(tipo, texto) {
  aviso.value = texto ? { tipo, texto } : null;
}

/* ============================ Carga ============================ */

const fatura = computed(() => invoices.value.find((inv) => inv.period === periodo.value) || null);
const paga = computed(() => fatura.value?.status === 'paid');

/**
 * Lê as faturas do cliente. A rota recalcula a competência pedida se ela
 * estiver aberta (é o que a tela do cliente sempre fez), então o total aqui é
 * o de agora — e a lista da página é avisada para mostrar o mesmo número.
 */
async function carregar({ avisarPagina = true } = {}) {
  await fetchInvoices(uid.value, periodo.value);
  if (avisarPagina && periodo.value === props.competencia && fatura.value && !fatura.value.isClosed) {
    emit('alterado');
  }
}

function irPara(novoPeriodo) {
  if (!novoPeriodo || novoPeriodo === periodo.value) return;
  periodo.value = novoPeriodo;
  fecharFormularios();
  aviso.value = null;
  carregar();
}

watch(() => props.competencia, (nova) => {
  periodo.value = nova;
  fecharFormularios();
  carregar();
});
watch(() => props.versao, () => carregar({ avisarPagina: false }));

onMounted(() => carregar());

/* Devolvido pela operação que o master desistiu no meio (a segunda confirmação). */
const CANCELADO = Symbol('cancelado');

/**
 * Roda uma ação do painel: trava os botões, mostra o resultado e recarrega.
 * Devolve true quando deu certo, para o formulário de origem poder fechar.
 */
async function executar(nome, operacao, { sucesso } = {}) {
  if (ocupado.value) return false;
  ocupado.value = nome;
  aviso.value = null;
  try {
    const resultado = await operacao();
    if (resultado === CANCELADO) return false;
    avisar('ok', typeof sucesso === 'function' ? sucesso(resultado) : sucesso);
    await carregar({ avisarPagina: false });
    emit('alterado');
    return true;
  } catch (e) {
    avisar('erro', mensagemDeErro(e));
    return false;
  } finally {
    ocupado.value = '';
  }
}

/* ============================ Estado da fatura ============================ */

/* Os mesmos nomes da lista: A cobrar -> Aguardando -> Paga. */
function situacaoDaFatura(inv) {
  if (!inv) return { label: 'Sem fatura', classe: 'is-muted' };
  if (inv.status === 'paid') return { label: 'Paga', classe: 'is-paid' };
  if (inv.asaasPaymentId) {
    return inv.asaasStatus === 'OVERDUE'
      ? { label: 'Vencida', classe: 'is-overdue' }
      : { label: 'Aguardando', classe: 'is-sent' };
  }
  if (!(inv.totalAmount > 0)) return { label: 'Sem valor', classe: 'is-muted' };
  return { label: 'A cobrar', classe: 'is-ready' };
}
const situacao = computed(() => situacaoDaFatura(fatura.value));

/* Gerar a cobrança já calcula e trava o valor do mês: aqui basta haver valor e
 * ainda não haver cobrança nem pagamento. */
const podeGerar = computed(() => Boolean(fatura.value && !fatura.value.asaasPaymentId && !paga.value
  && fatura.value.totalAmount > 0));
const semValor = computed(() => Boolean(fatura.value && !fatura.value.asaasPaymentId && !paga.value
  && !(fatura.value.totalAmount > 0)));
const valorEmAndamento = computed(() => Boolean(fatura.value && !fatura.value.isClosed
  && !fatura.value.asaasPaymentId && !paga.value));

const somaDosItens = computed(() => (fatura.value?.items || [])
  .reduce((soma, item) => soma + paraCentavos(item.total_price), 0) / 100);

/* A mesma conferência que a emissão faz: competência fechada cujos itens não
 * somam o total é recusada pelo backend. Avisar antes poupa a tentativa. */
const divergente = computed(() => Boolean(fatura.value?.isClosed && !fatura.value.asaasPaymentId && !paga.value
  && paraCentavos(somaDosItens.value) !== paraCentavos(fatura.value.totalAmount)));

const GRUPOS = [
  { key: 'storage', label: 'Armazenamento' },
  { key: 'shipment', label: 'Expedição' },
  { key: 'manual', label: 'Serviços pontuais' },
];

const grupos = computed(() => {
  const itens = fatura.value?.items || [];
  const conhecidos = GRUPOS.map((g) => g.key);
  const lista = GRUPOS.map((g) => ({ ...g, itens: itens.filter((item) => item.type === g.key) }));
  const outros = itens.filter((item) => !conhecidos.includes(item.type));
  // Tipo novo no banco não some da fatura só por não estar mapeado.
  if (outros.length) lista.push({ key: 'outros', label: 'Outros lançamentos', itens: outros });
  return lista
    .filter((g) => g.itens.length)
    .map((g) => ({ ...g, subtotal: g.itens.reduce((soma, item) => soma + paraCentavos(item.total_price), 0) / 100 }));
});

const UNIDADES = { m3: 'm³', pacote: 'pacote', viagem: 'viagem', venda: 'venda', unidade: 'unidade' };
function quantidadeDoItem(item) {
  const quantidade = Number(item.quantity) || 0;
  const rotulo = UNIDADES[item.unit] || item.unit || '';
  const unidade = !rotulo || rotulo === 'm³' || quantidade <= 1 ? rotulo : `${rotulo}s`;
  return `${quantidade.toLocaleString('pt-BR')}${unidade ? ` ${unidade}` : ''}`;
}

/* ============================ Reabrir ============================
 *
 * Gerar a cobrança já trava o valor do mês, então não há botão de "fechar".
 * Reabrir é a volta: destrava o valor para lançar avulso ou recalcular, e
 * depois é só gerar a cobrança de novo. */

async function reabrir() {
  const confirmado = await confirm({
    title: `Reabrir ${periodLabel(periodo.value)}`,
    message: 'O valor do mês volta a ser recalculado.',
    detail: 'Serve para corrigir algo ou lançar o que faltou. Depois é só gerar a cobrança de novo.',
    confirmText: 'Reabrir',
    tone: 'danger',
  });
  if (!confirmado) return;
  await executar('reabrir', async () => {
    try {
      return await reopenInvoicePeriod(uid.value, periodo.value);
    } catch (e) {
      if (codigoDoErro(e) !== 'has_external_charge') throw e;
      const forcar = await confirm({
        title: 'Este mês já tem cobrança criada',
        message: 'Reabrir faz o valor voltar a mudar, e ele pode ficar diferente do que o cliente recebeu.',
        detail: 'Depois de corrigir, cancele a cobrança e gere de novo.',
        confirmText: 'Reabrir mesmo assim',
        tone: 'danger',
      });
      if (!forcar) return CANCELADO;
      return reopenInvoicePeriod(uid.value, periodo.value, { force: true });
    }
  }, { sucesso: 'Fatura reaberta: o valor volta a ser recalculado.' });
}

/* ============================ Baixa manual ============================ */

const baixaForm = ref({ aberto: false, data: '' });

function abrirBaixa() {
  fecharFormularios();
  baixaForm.value = { aberto: true, data: props.hoje };
}

async function confirmarBaixa() {
  const { data } = baixaForm.value;
  if (!dataValida(data) || data > props.hoje) {
    avisar('erro', 'Informe a data do pagamento (hoje ou antes).');
    return;
  }
  const ok = await executar('baixa', () => setInvoiceStatus(uid.value, periodo.value, 'paid', data), {
    sucesso: `Fatura marcada como paga em ${formatarData(data)}.`,
  });
  if (ok) baixaForm.value.aberto = false;
}

async function desfazerBaixa() {
  const veioDoAsaas = fatura.value?.paidBy === 'asaas';
  const confirmado = await confirm({
    title: 'Desfazer a baixa',
    message: `A fatura de ${periodLabel(periodo.value)} volta a constar como em aberto.`,
    detail: veioDoAsaas
      ? 'O pagamento foi confirmado pelo Asaas: a próxima sincronização marca a fatura como paga de novo.'
      : '',
    confirmText: 'Desfazer baixa',
    tone: 'danger',
  });
  if (!confirmado) return;
  await executar('baixa', () => setInvoiceStatus(uid.value, periodo.value, 'pending'), { sucesso: 'Baixa desfeita.' });
}

/* ============================ Cobrança no Asaas ============================ */

/** A emissão vai para o modal da página: revisão, vencimento, descrição e progresso. */
function pedirEmissao() {
  const f = fatura.value;
  if (!f) return;
  const vencimentoDaFatura = isoDeData(f.due_date);
  emit('emitir', {
    periodo: periodo.value,
    vencimentoPadrao: vencimentoDaFatura,
    vencimento: vencimentoDaFatura && vencimentoDaFatura >= props.hoje ? vencimentoDaFatura : somarDias(props.hoje, 5),
    linha: {
      uid: uid.value,
      nome: props.cliente.nome,
      linked: vinculado.value,
      hasDocument: temDocumento.value,
      faltaDocumento: !vinculado.value && !temDocumento.value,
      divergente: divergente.value,
      total: f.totalAmount,
      invoice: { closedAt: f.closed_at || null },
      selecionavel: true,
    },
  });
}

async function sincronizar() {
  await executar('sincronizar', () => syncCharge(uid.value, periodo.value), {
    sucesso: (r) => `Asaas: ${asaasStatusLabel(r?.status) || 'sem status'}`
      + (r?.statusLocal === 'paid' ? '. Fatura marcada como paga.' : '.'),
  });
}

const vencimentoForm = ref({ aberto: false, data: '' });

function abrirVencimento() {
  fecharFormularios();
  const atual = isoDeData(fatura.value?.due_date);
  vencimentoForm.value = { aberto: true, data: atual && atual >= props.hoje ? atual : somarDias(props.hoje, 5) };
}

async function salvarVencimento() {
  const { data } = vencimentoForm.value;
  if (!dataValida(data) || data < props.hoje) {
    avisar('erro', `Escolha uma data a partir de hoje (${formatarData(props.hoje)}): o Asaas recusa vencimento no passado.`);
    return;
  }
  const ok = await executar('vencimento', () => updateChargeDueDate(uid.value, periodo.value, data), {
    sucesso: `Vencimento alterado para ${formatarData(data)}.`,
  });
  if (ok) vencimentoForm.value.aberto = false;
}

async function cancelarCobranca() {
  const confirmado = await confirm({
    title: 'Cancelar a cobrança',
    message: 'A cobrança é removida no Asaas e a competência fica livre para emitir de novo.',
    detail: 'Cobrança paga não é cancelada por aqui: estorno é feito no painel do Asaas.',
    confirmText: 'Cancelar cobrança',
    tone: 'danger',
  });
  if (!confirmado) return;
  await executar('cancelar', () => cancelCharge(uid.value, periodo.value), { sucesso: 'Cobrança cancelada no Asaas.' });
}

/* ---------------- Descrição ---------------- */

const descricao = ref(null);
const carregandoDescricao = ref(false);

async function alternarDescricao() {
  if (descricao.value) {
    descricao.value = null;
    return;
  }
  carregandoDescricao.value = true;
  try {
    descricao.value = await fetchChargePreview(uid.value, periodo.value);
  } catch (e) {
    avisar('erro', mensagemDeErro(e, 'Não foi possível montar a descrição.'));
  } finally {
    carregandoDescricao.value = false;
  }
}

/* O texto mostrado vale para a fatura que estava na tela. */
watch(
  [() => periodo.value, () => fatura.value?.isClosed, () => fatura.value?.totalAmount, () => fatura.value?.asaasPaymentId],
  () => { descricao.value = null; }
);

/* ============================ Avulsos ============================ */

const avulsoForm = ref({ aberto: false, serviceId: '', quantity: 1, serviceDate: '', erro: '' });
const servicoSelecionado = computed(() => manualServices.value.find((s) => s.id === avulsoForm.value.serviceId) || null);
const avulsoPorQuantidade = computed(() => servicoSelecionado.value?.type === 'avulso_quantidade');

/* Data sugerida: hoje no mês corrente; numa competência passada, o último dia
 * dela — o serviço lançado ali foi feito naquele mês, não hoje. */
function dataSugeridaDoAvulso() {
  if (periodo.value >= competenciaDeHoje()) return props.hoje;
  const [ano, mes] = periodo.value.split('-').map(Number);
  return new Date(Date.UTC(ano, mes, 0)).toISOString().slice(0, 10);
}

async function abrirAvulso() {
  fecharFormularios();
  avulsoForm.value = { aberto: true, serviceId: '', quantity: 1, serviceDate: dataSugeridaDoAvulso(), erro: '' };
  if (!manualServices.value.length) await fetchManualServices();
}

async function lancarAvulso() {
  const form = avulsoForm.value;
  form.erro = '';
  if (!form.serviceId || !dataValida(form.serviceDate)) {
    form.erro = 'Escolha o serviço e a data em que ele foi feito.';
    return;
  }
  if (avulsoPorQuantidade.value && !(Number.isInteger(form.quantity) && form.quantity >= 1)) {
    form.erro = 'Informe a quantidade (número inteiro a partir de 1).';
    return;
  }
  const nome = servicoSelecionado.value?.name || 'Serviço';
  const ok = await executar('avulso', () => addManualService({
    uid: uid.value,
    period: periodo.value,
    serviceId: form.serviceId,
    quantity: avulsoPorQuantidade.value ? form.quantity : null,
    serviceDate: form.serviceDate,
  }), { sucesso: `${nome} lançado na fatura.` });
  if (ok) avulsoForm.value.aberto = false;
}

async function removerAvulso(item) {
  const confirmado = await confirm({
    title: 'Remover lançamento',
    message: `Remover "${item.description}" (${formatarMoeda(item.total_price)}) desta fatura?`,
    confirmText: 'Remover',
    tone: 'danger',
  });
  if (!confirmado) return;
  await executar(`remover-${item.id}`, () => deleteManualItem(item.id), { sucesso: 'Lançamento removido.' });
}

function fecharFormularios() {
  baixaForm.value.aberto = false;
  vencimentoForm.value.aberto = false;
  avulsoForm.value.aberto = false;
}

/* ============================ Histórico ============================ */

const historico = computed(() => [...invoices.value].sort((a, b) => (a.period < b.period ? 1 : -1)));
const resumoHistorico = computed(() => {
  const centavos = (lista) => lista.reduce((soma, inv) => soma + paraCentavos(inv.totalAmount), 0) / 100;
  return {
    faturado: centavos(invoices.value),
    emAberto: centavos(invoices.value.filter((inv) => inv.status !== 'paid')),
    pagas: invoices.value.filter((inv) => inv.status === 'paid').length,
  };
});

/* ============================ Dados de cobrança ============================ */

const CAMPOS_VAZIOS = {
  cpfCnpj: '', phone: '', postalCode: '', address: '', addressNumber: '',
  addressComplement: '', province: '', cityName: '', state: '',
};
const cadastro = ref({ carregado: false, carregando: false, salvando: false, erro: '', faltando: [], campos: { ...CAMPOS_VAZIOS } });

const falta = (campo) => cadastro.value.faltando.includes(campo);
/* Campo vazio não é erro (quem decide o obrigatório é a operação); o que se
 * acusa aqui é o valor ERRADO: dígito que não fecha, CEP curto, DDD inexistente. */
const erroDoc = computed(() => erroDocumento(cadastro.value.campos.cpfCnpj));
const erroFone = computed(() => erroTelefone(cadastro.value.campos.phone));
const erroDoCep = computed(() => erroCep(cadastro.value.campos.postalCode));
const tipoDoc = computed(() => tipoDocumento(cadastro.value.campos.cpfCnpj));
const podeSalvarCadastro = computed(() => Boolean(apenasDigitos(cadastro.value.campos.cpfCnpj))
  && !erroDoc.value && !erroFone.value && !erroDoCep.value);

async function carregarCadastro() {
  cadastro.value.carregando = true;
  cadastro.value.erro = '';
  try {
    const { user, faltando, linkedToProvider } = await fetchBillingInfo(uid.value);
    vinculado.value = Boolean(linkedToProvider);
    temDocumento.value = Boolean(user?.cpf_cnpj);
    cadastro.value.faltando = Array.isArray(faltando) ? faltando : [];
    cadastro.value.campos = {
      cpfCnpj: user?.cpfCnpjFormatted || '',
      phone: user?.phone || '',
      postalCode: user?.postalCodeFormatted || '',
      address: user?.address || '',
      addressNumber: user?.address_number || '',
      addressComplement: user?.address_complement || '',
      province: user?.province || '',
      cityName: user?.city_name || '',
      state: user?.state || '',
    };
    cadastro.value.carregado = true;
  } catch (e) {
    cadastro.value.erro = mensagemDeErro(e, 'Não foi possível carregar os dados de cobrança.');
  } finally {
    cadastro.value.carregando = false;
  }
}

watch(aba, (nova) => {
  if (nova === 'cadastro' && !cadastro.value.carregado && !cadastro.value.carregando) carregarCadastro();
}, { immediate: true });

/**
 * Salva no CyberDock e, se o cliente já existe no Asaas, leva os dados para lá
 * também — salvar só aqui deixaria o cadastro do Asaas desatualizado sem
 * ninguém saber. Cliente que ainda não existe no Asaas é cadastrado lá na hora
 * de gerar a cobrança, então não há passo manual de "vincular".
 */
async function salvarCadastro() {
  if (!podeSalvarCadastro.value || cadastro.value.salvando) return;
  cadastro.value.salvando = true;
  cadastro.value.erro = '';
  aviso.value = null;
  let salvo = false;
  try {
    const resposta = await saveBillingInfo(uid.value, { ...cadastro.value.campos });
    salvo = true;
    temDocumento.value = true;
    cadastro.value.faltando = [];
    if (vinculado.value || resposta?.user?.asaas_customer_id) {
      await ensureAsaasCustomer(uid.value);
      vinculado.value = true;
      avisar('ok', 'Dados salvos e cadastro atualizado no Asaas.');
    } else {
      avisar('ok', 'Dados de cobrança salvos.');
    }
    emit('alterado');
  } catch (e) {
    if (salvo) {
      avisar('erro', `Dados salvos aqui, mas o Asaas recusou a atualização: ${mensagemDeErro(e)}`);
      emit('alterado');
    } else {
      cadastro.value.erro = mensagemDeErro(e, 'Não foi possível salvar os dados.');
      if (e?.data?.field) cadastro.value.faltando = [e.data.field];
    }
  } finally {
    cadastro.value.salvando = false;
  }
}
</script>

<style scoped>
/* Sem altura máxima e sem overflow em lugar nenhum: o painel cresce com o
   conteúdo e a página é a única coisa que rola. */
.painel {
  /* Contêiner: o painel se ajusta à largura que tem dentro da lista, que muda
     com o menu lateral aberto ou recolhido. */
  container-type: inline-size; container-name: painel;
  display: flex; flex-direction: column; gap: 0.9rem;
  padding: 1rem 1.1rem 1.2rem;
  border-top: 1px solid #dbeafe;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 70%);
  font-family: var(--font-sans);
}
.painel__topo { display: flex; align-items: flex-end; justify-content: space-between; gap: 0.8rem; flex-wrap: wrap; }
.painel__periodo { display: flex; align-items: baseline; gap: 0.5rem; flex-wrap: wrap; }
.painel__periodo strong { color: #0f172a; font-size: 1rem; font-weight: 800; letter-spacing: -0.01em; }
.painel__rotulo {
  color: #64748b; font-size: 0.66rem; font-weight: 750; letter-spacing: 0.05em; text-transform: uppercase;
}
.painel__corpo { display: flex; flex-direction: column; gap: 0.9rem; }
.painel__estado { margin: 0; padding: 1rem; border: 1px dashed #cbd5e1; border-radius: 10px; color: #64748b; font-size: 0.82rem; text-align: center; }
.painel__estado.is-error { border-color: #fecaca; color: #b91c1c; }

.link-btn {
  padding: 0; border: none; background: none; color: #1d4ed8;
  font-size: 0.78rem; font-weight: 700; cursor: pointer; text-decoration: underline; text-underline-offset: 2px;
}

/* ---------------- Abas ---------------- */
.abas { display: inline-flex; gap: 0.25rem; padding: 0.2rem; border: 1px solid #dbe3ef; border-radius: 10px; background: #fff; }
.abas__item {
  display: inline-flex; align-items: center; gap: 0.35rem;
  min-height: 32px; padding: 0.3rem 0.75rem; border: none; border-radius: 8px;
  background: transparent; color: #475569; font-size: 0.8rem; font-weight: 700; cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.abas__item:hover { background: #f1f5f9; color: #0f172a; }
.abas__item.is-active { background: #2563eb; color: #fff; }
.abas__item:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25); }
.abas__count {
  min-width: 18px; padding: 0 0.3rem; border-radius: 999px; background: rgba(15, 23, 42, 0.08);
  font-size: 0.66rem; font-variant-numeric: tabular-nums; text-align: center;
}
.abas__item.is-active .abas__count { background: rgba(255, 255, 255, 0.25); }
.abas__alerta {
  display: inline-grid; place-items: center; width: 16px; height: 16px; border-radius: 999px;
  background: #f97316; color: #fff; font-size: 0.66rem; font-weight: 800;
}

/* ---------------- Avisos ---------------- */
.aviso {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 0.6rem;
  margin: 0; padding: 0.6rem 0.75rem; border-radius: 9px; font-size: 0.8rem; line-height: 1.45;
}
.aviso.is-ok { border: 1px solid #a7f3d0; background: #ecfdf5; color: #047857; }
.aviso.is-erro { border: 1px solid #fecaca; background: #fef2f2; color: #b91c1c; }
.aviso.is-info { border: 1px solid #bfdbfe; background: #eff6ff; color: #1e40af; }
.aviso--fixo { display: block; }
.aviso--acao { align-items: center; flex-wrap: wrap; }
.aviso--acao > span { flex: 1 1 18rem; }
.nota { margin: 0; color: #64748b; font-size: 0.8rem; }

/* ---------------- Resumo ---------------- */
.resumo {
  display: grid; grid-template-columns: minmax(12rem, 0.9fr) minmax(0, 2fr); gap: 1rem;
  padding: 0.9rem 1rem; border: 1px solid #dbe3ef; border-radius: 12px; background: #fff;
}
.resumo__valor { display: flex; flex-direction: column; align-items: flex-start; gap: 0.3rem; }
.resumo__valor strong {
  color: #0f172a; font-size: 1.6rem; font-weight: 850; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; line-height: 1.1;
}
.resumo__dica { color: #c2410c; font-size: 0.72rem; font-weight: 650; }
.resumo__fatos { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.75rem; margin: 0; }
.resumo__fatos div { min-width: 0; }
.resumo__fatos dt { color: #64748b; font-size: 0.66rem; font-weight: 750; letter-spacing: 0.05em; text-transform: uppercase; }
.resumo__fatos dd { margin: 0.15rem 0 0; color: #0f172a; font-size: 0.86rem; font-weight: 700; overflow-wrap: anywhere; }
.resumo__fatos dd.is-overdue { color: #b91c1c; }
.resumo__fatos small { display: block; color: #94a3b8; font-size: 0.7rem; overflow-wrap: anywhere; }

.pill {
  display: inline-flex; align-items: center; padding: 0.18rem 0.55rem; border-radius: 999px; white-space: nowrap;
  font-size: 0.68rem; font-weight: 750; letter-spacing: 0.02em; text-transform: uppercase;
}
.pill.is-muted { background: #f1f5f9; color: #64748b; }
.pill.is-ready { background: #eff6ff; color: #1d4ed8; }
.pill.is-sent { background: #eef2ff; color: #4338ca; }
.pill.is-overdue { background: #fef2f2; color: #b91c1c; }
.pill.is-paid { background: #ecfdf5; color: #047857; }

/* ---------------- Ações ---------------- */
.acoes { display: flex; align-items: center; gap: 0.45rem; flex-wrap: wrap; }
.acoes__espaco { flex: 1 1 auto; }

.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem;
  min-height: 36px; padding: 0.4rem 0.8rem; border: 1px solid transparent; border-radius: 9px;
  font-size: 0.8rem; font-weight: 700; white-space: nowrap; text-decoration: none; cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s, color 0.15s, opacity 0.15s;
}
.btn:disabled { opacity: 0.55; cursor: not-allowed; }
.btn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25); }
.btn-with-icon { gap: 0.4rem; }
.btn-primary { background: #2563eb; border-color: #2563eb; color: #fff; }
.btn-primary:hover:not(:disabled) { background: #1d4ed8; border-color: #1d4ed8; }
.btn-secondary { background: #fff; border-color: #dbe3ef; color: #334155; }
.btn-secondary:hover:not(:disabled) { border-color: #93c5fd; background: #eff6ff; color: #1d4ed8; }
.btn-ghost { background: transparent; border-color: transparent; color: #1d4ed8; }
.btn-ghost:hover:not(:disabled) { background: #eff6ff; }
.btn-danger-ghost { background: #fff; border-color: #fecaca; color: #b91c1c; }
.btn-danger-ghost:hover:not(:disabled) { background: #fef2f2; border-color: #fca5a5; }
.btn-sm { min-height: 32px; padding: 0.3rem 0.65rem; font-size: 0.76rem; }

.mini-form {
  display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;
  padding: 0.7rem 0.8rem; border: 1px solid #bfdbfe; border-radius: 10px; background: #eff6ff;
}
.mini-form label { color: #1e3a8a; font-size: 0.78rem; font-weight: 750; }
.mini-form input {
  min-height: 34px; padding: 0.3rem 0.55rem; border: 1px solid #bfdbfe; border-radius: 8px;
  background: #fff; color: #0f172a; font-size: 0.84rem;
}
.mini-form input:focus { outline: none; border-color: #60a5fa; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15); }
.mini-form small { flex: 1 1 100%; color: #1e40af; font-size: 0.72rem; }

/* ---------------- Descrição ---------------- */
.descricao { display: flex; flex-direction: column; gap: 0.35rem; }
.descricao pre {
  margin: 0; padding: 0.75rem 0.85rem; border: 1px solid #dbe3ef; border-radius: 10px; background: #0f172a;
  color: #e2e8f0; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.78rem; line-height: 1.6; white-space: pre-wrap; overflow-wrap: anywhere;
}
.descricao small { color: #64748b; font-size: 0.72rem; }
.descricao small.is-error { color: #b91c1c; font-weight: 650; }

/* ---------------- Composição ---------------- */
.composicao { display: grid; grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr)); gap: 0.75rem; }
.grupo { border: 1px solid #dbe3ef; border-radius: 12px; background: #fff; }
.grupo__topo {
  display: flex; align-items: baseline; gap: 0.5rem; padding: 0.6rem 0.8rem; border-bottom: 1px solid #eef2f7;
}
.grupo__topo h4 { margin: 0; color: #0f172a; font-size: 0.84rem; font-weight: 800; }
.grupo__topo span { color: #94a3b8; font-size: 0.72rem; font-weight: 650; }
.grupo__topo strong { margin-left: auto; color: #0f172a; font-size: 0.86rem; font-weight: 800; font-variant-numeric: tabular-nums; }
.itens { margin: 0; padding: 0; list-style: none; }
/* Colunas de números com largura fixa: cada item é a sua própria grade, e
   colunas `auto` ficariam desalinhadas de um item para outro. */
.item {
  display: grid; grid-template-columns: minmax(0, 1fr) 6.5rem 5.5rem 6rem auto; align-items: center; gap: 0.6rem;
  padding: 0.5rem 0.8rem; border-bottom: 1px solid #f1f5f9; font-size: 0.8rem;
}
.item:last-child { border-bottom: none; }
.item__desc { min-width: 0; color: #0f172a; font-weight: 650; overflow-wrap: anywhere; }
.item__desc small { display: block; color: #94a3b8; font-size: 0.7rem; font-weight: 600; }
.item__qtd { color: #475569; text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
.item__unit { color: #94a3b8; text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
.item__total { color: #0f172a; font-weight: 750; text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
.item__remover {
  display: inline-flex; align-items: center; gap: 0.3rem; min-height: 28px; padding: 0 0.5rem;
  border: 1px solid #e2e8f0; border-radius: 7px; background: #fff; color: #b91c1c;
  font-size: 0.72rem; font-weight: 700; white-space: nowrap; cursor: pointer;
}
.item__remover:hover:not(:disabled) { border-color: #fecaca; background: #fef2f2; }
.item__remover:disabled { opacity: 0.4; cursor: not-allowed; }

/* ---------------- Avulso ---------------- */
.avulso {
  display: flex; flex-direction: column; gap: 0.6rem;
  padding: 0.85rem 0.9rem; border: 1px solid #bfdbfe; border-radius: 12px; background: #fff;
}
.avulso__titulo { margin: 0; color: #0f172a; font-size: 0.86rem; font-weight: 800; }
.avulso__grade { display: grid; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); gap: 0.6rem; }
.avulso__dica { color: #64748b; font-size: 0.72rem; line-height: 1.45; }
.avulso__erro { margin: 0; color: #b91c1c; font-size: 0.78rem; font-weight: 650; }
.avulso__acoes { display: flex; justify-content: flex-end; gap: 0.45rem; }

.campo { display: flex; flex-direction: column; gap: 0.25rem; min-width: 0; }
.campo--largo { grid-column: span 2; }
.campo label { color: #334155; font-size: 0.76rem; font-weight: 750; }
.campo input, .campo select {
  width: 100%; min-height: 36px; box-sizing: border-box; padding: 0.35rem 0.6rem;
  border: 1px solid #dbe3ef; border-radius: 8px; background: #fff; color: #0f172a; font-size: 0.84rem;
}
.campo input:focus, .campo select:focus { outline: none; border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12); }
.campo.is-invalid input { border-color: #fca5a5; }
.campo.is-missing input { border-color: #fdba74; background: #fffbeb; }
.campo__erro { color: #b91c1c; font-size: 0.72rem; font-weight: 650; }
.req { color: #c2410c; font-size: 0.66rem; font-weight: 750; text-transform: uppercase; }
.tipo { padding: 0 0.3rem; border-radius: 4px; background: #eff6ff; color: #1d4ed8; font-size: 0.66rem; }

/* ---------------- Histórico ---------------- */
.historico__resumo { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.6rem; }
.historico__resumo div {
  display: flex; flex-direction: column; gap: 0.2rem; padding: 0.65rem 0.8rem;
  border: 1px solid #dbe3ef; border-radius: 10px; background: #fff;
}
.historico__resumo strong { color: #0f172a; font-size: 1rem; font-weight: 800; font-variant-numeric: tabular-nums; }
.historico { display: flex; flex-direction: column; margin: 0; padding: 0; list-style: none; border: 1px solid #dbe3ef; border-radius: 12px; background: #fff; }
.historico li + li { border-top: 1px solid #f1f5f9; }
.historico__linha {
  display: grid; grid-template-columns: minmax(9rem, 1fr) auto minmax(7rem, auto) minmax(6.5rem, auto); align-items: center; gap: 0.75rem;
  width: 100%; padding: 0.6rem 0.85rem; border: none; background: transparent; text-align: left; cursor: pointer;
  font-size: 0.82rem; color: #0f172a;
}
.historico__linha:hover { background: #f8fbff; }
.historico__linha.is-atual { background: #eff6ff; box-shadow: inset 3px 0 0 #2563eb; }
.historico__linha:focus-visible { outline: none; box-shadow: inset 0 0 0 2px #93c5fd; }
.historico__periodo { font-weight: 750; }
.historico__venc { color: #64748b; font-size: 0.76rem; white-space: nowrap; }
.historico__valor { text-align: right; font-variant-numeric: tabular-nums; }

/* ---------------- Cadastro ---------------- */
.cadastro { display: flex; flex-direction: column; gap: 0.8rem; }
.cadastro__intro { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin: 0; color: #475569; font-size: 0.8rem; line-height: 1.45; }
.cadastro__grade { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.65rem; }
.campo--curto { max-width: 6rem; }
.cadastro__acoes { display: flex; justify-content: flex-end; gap: 0.5rem; flex-wrap: wrap; }

@container painel (max-width: 820px) {
  .resumo { grid-template-columns: 1fr; }
  .resumo__fatos { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .cadastro__grade { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 640px) {
  .painel { padding: 0.85rem 0.75rem 1rem; }
}
@container painel (max-width: 560px) {
  .composicao { grid-template-columns: 1fr; }
  .item { grid-template-columns: minmax(0, 1fr) auto auto; }
  .item__unit { display: none; }
  .item__qtd { grid-column: 1; grid-row: 2; text-align: left; }
  .historico__resumo { grid-template-columns: 1fr; }
  .historico__linha { grid-template-columns: minmax(0, 1fr) auto; }
  .historico__venc { display: none; }
  .cadastro__grade { grid-template-columns: 1fr; }
  .campo--largo { grid-column: auto; }
  .acoes__espaco { display: none; }
}
</style>
