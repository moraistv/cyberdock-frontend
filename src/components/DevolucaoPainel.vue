<!-- Detalhes de uma devolução do Mercado Livre: resumo, inspeção (checklist,
     observação e fotos), histórico e a decisão apto / não apto. A decisão soma
     ao estoque do cliente as unidades aptas, na mesma transação no backend.
     "Confirmar recebimento" é o sinal de que a CyberDock está com o pacote: é o
     que o cliente vê na tela dele.
     Fica ao lado da lista em tela larga e vira gaveta em tela estreita; quem
     escolhe é a MasterDevolucoesView, pela prop `modo`. Com `visao="cliente"`
     o painel só mostra (dados de /returns/minhas, sem nenhuma ação). -->
<template>
  <aside
    ref="raiz"
    class="painel"
    :class="`is-${modo}`"
    :role="modo === 'gaveta' ? 'dialog' : 'region'"
    :aria-modal="modo === 'gaveta' ? 'true' : null"
    aria-labelledby="dev-painel-titulo"
    tabindex="-1"
    @keydown.esc="aoTeclarEsc"
  >
    <header class="painel__topo">
      <div class="painel__titulos">
        <h2 id="dev-painel-titulo" class="painel__titulo">Detalhes da Devolução</h2>
        <p v-if="detalhe" class="painel__sub">
          Pedido #{{ detalhe.order_id || '—' }} · Dev. #{{ detalhe.ml_return_id }}
        </p>
      </div>
      <button ref="botaoFechar" type="button" class="icone-btn" aria-label="Fechar detalhes" title="Fechar" @click="fechar">
        <IconeSvg nome="fechar" :tamanho="18" />
      </button>
    </header>

    <!-- Carregando -->
    <div v-if="carregando && !detalhe" class="painel__corpo" aria-busy="true">
      <span class="sr-only">Carregando a devolução...</span>
      <div class="sk-produto">
        <span class="sk sk-quadro" />
        <div class="sk-linhas"><span class="sk" style="width: 80%" /><span class="sk sk--sm" style="width: 45%" /></div>
      </div>
      <div class="sk-linhas sk-linhas--folga">
        <span v-for="n in 6" :key="n" class="sk" :style="{ width: `${92 - n * 7}%` }" />
      </div>
    </div>

    <!-- Erro -->
    <div v-else-if="erro && !detalhe" class="painel__corpo">
      <div class="estado is-erro" role="alert">
        <span class="estado__icone"><IconeSvg nome="alerta" :tamanho="22" /></span>
        <p>{{ erro }}</p>
        <button type="button" class="btn btn-secondary btn-sm btn-with-icon" @click="carregar()">
          <IconeSvg nome="atualizar" />
          Tentar de novo
        </button>
      </div>
    </div>

    <template v-else-if="detalhe">
      <div class="painel__corpo">
        <!-- Produto e situação -->
        <div class="produto">
          <span class="miniatura">
            <img
              v-if="miniaturaPrincipal && !miniaturaFalhou"
              :key="miniaturaPrincipal"
              :src="miniaturaPrincipal"
              alt=""
              loading="lazy"
              @error="aoFalharMiniatura"
            />
            <IconeSvg v-else nome="caixa" :tamanho="22" />
          </span>
          <div class="produto__texto">
            <strong class="produto__titulo" :title="tituloPrincipal">{{ tituloPrincipal }}</strong>
            <span class="produto__sku">
              SKU: {{ skuPrincipal }}
              <template v-if="itens.length > 1"> · +{{ itens.length - 1 }} {{ itens.length === 2 ? 'item' : 'itens' }}</template>
            </span>
          </div>
        </div>
        <div class="pilulas">
          <span class="status-pill" :class="situacao.classe" :title="situacao.dica">
            <span class="status-dot" />{{ situacao.rotulo }}
          </span>
          <span v-if="resultado" class="status-pill" :class="resultado.classe">{{ resultado.rotulo }}</span>
        </div>

        <p v-if="prazo" class="aviso" :class="prazo.classe">
          <IconeSvg nome="relogio" :tamanho="15" />
          <span>{{ prazo.texto }}. Se o produto chegou com problema, avise o Mercado Livre na página da venda.</span>
        </p>

        <!-- O ML disse que entregou; falta a equipe confirmar que o pacote está aqui. -->
        <div v-if="avisoDeRecebimento" class="aviso is-recebimento">
          <IconeSvg nome="recebido" :tamanho="15" />
          <div class="aviso__corpo">
            <span>O Mercado Livre informou a entrega. Confirme quando o pacote estiver no CD: o cliente passa a ver "Recebida pela CyberDock".</span>
            <button type="button" class="btn btn-secondary btn-sm btn-with-icon" :disabled="ocupado" @click="confirmarRecebimento">
              <IconeSvg nome="recebido" />
              {{ acao === 'recebimento' ? 'Confirmando...' : 'Confirmar recebimento' }}
            </button>
          </div>
        </div>

        <!-- Abas -->
        <div class="abas" role="tablist" aria-label="Seções da devolução" @keydown="aoTeclarAbas">
          <button
            v-for="item in ABAS"
            :id="`dev-painel-aba-${item.id}`"
            :key="item.id"
            type="button"
            role="tab"
            class="aba"
            :class="{ 'is-ativa': aba === item.id }"
            :aria-selected="aba === item.id ? 'true' : 'false'"
            :aria-controls="`dev-painel-secao-${item.id}`"
            :tabindex="aba === item.id ? 0 : -1"
            @click="aba = item.id"
          >
            {{ item.rotulo }}
            <span v-if="item.id === 'historico' && eventos.length" class="aba__contador">{{ eventos.length }}</span>
          </button>
        </div>

        <!-- Resumo -->
        <section
          v-show="aba === 'resumo'"
          id="dev-painel-secao-resumo"
          role="tabpanel"
          aria-labelledby="dev-painel-aba-resumo"
          class="secao"
        >
          <dl class="fatos">
            <div v-if="!ehCliente" class="fato">
              <dt>Cliente</dt>
              <dd>
                {{ nomeDoCliente(detalhe) }}
                <small v-if="detalhe.client_name && detalhe.client_email">{{ detalhe.client_email }}</small>
                <small v-if="!detalhe.uid" class="is-aviso">Sem cliente, nada volta ao estoque.</small>
              </dd>
            </div>
            <div class="fato">
              <dt>Conta do ML</dt>
              <dd>{{ detalhe.account_nickname || '—' }}</dd>
            </div>
            <div class="fato">
              <dt>Comprador</dt>
              <dd>{{ detalhe.buyer_name || '—' }}</dd>
            </div>
            <div v-if="itens.length === 1" class="fato">
              <dt>Produto</dt>
              <dd>
                {{ tituloPrincipal }}
                <small>SKU: {{ skuPrincipal }}</small>
              </dd>
            </div>
            <div class="fato">
              <dt>Quantidade</dt>
              <dd>{{ quantidade }} {{ quantidade === 1 ? 'unidade' : 'unidades' }}</dd>
            </div>
            <div class="fato">
              <dt>Data da devolução</dt>
              <dd>{{ formatarDataHora(detalhe.ml_created_at || detalhe.created_at) }}</dd>
            </div>
            <div class="fato">
              <dt>Status no Mercado Livre</dt>
              <dd>{{ statusNoMl(detalhe.ml_status) }}</dd>
            </div>
            <div v-if="detalhe.claim_reason_text" class="fato">
              <dt>Motivo do comprador</dt>
              <dd>{{ detalhe.claim_reason_text }}</dd>
            </div>
            <div v-if="detalhe.tracking_number" class="fato">
              <dt>Rastreio</dt>
              <dd class="mono">{{ detalhe.tracking_number }}</dd>
            </div>
            <div v-if="detalhe.received_at" class="fato">
              <dt>Chegou ao CD</dt>
              <dd>
                {{ formatarDataHora(detalhe.received_at) }}
                <small>{{ detalhe.received_by ? `por ${detalhe.received_by}` : 'informado pelo Mercado Livre' }}</small>
              </dd>
            </div>
            <div v-if="recebimento" class="fato">
              <dt>Recebimento</dt>
              <dd v-if="recebimento.confirmado" class="is-ok">
                Confirmado em {{ formatarDataHora(detalhe.receipt_confirmed_at) }}
                <small>{{ !ehCliente && detalhe.receipt_confirmed_by ? `por ${detalhe.receipt_confirmed_by}` : 'pela CyberDock' }}</small>
              </dd>
              <dd v-else-if="recebimento.etiqueta" class="is-aviso">
                Aguardando confirmação
                <small>{{ ehCliente
                  ? 'O Mercado Livre informou a entrega. A CyberDock confirma assim que conferir o pacote.'
                  : 'O Mercado Livre informou a entrega. Confirme quando o pacote estiver no CD.' }}</small>
              </dd>
              <dd v-else>{{ recebimento.texto }}</dd>
            </div>
            <div v-if="!ehCliente && itens.length === 1" class="fato">
              <dt>Estoque do SKU</dt>
              <dd :class="{ 'is-aviso': !principal.estoque?.encontrado }">{{ textoDoEstoque(principal) }}</dd>
            </div>
            <div class="fato">
              <dt>Pedido</dt>
              <dd>
                #{{ detalhe.order_id || '—' }}
                <a v-if="linkDaVenda" :href="linkDaVenda" target="_blank" rel="noopener noreferrer" class="link">
                  Abrir no ML
                  <IconeSvg nome="link" :tamanho="12" />
                  <span class="sr-only">(abre em outra aba)</span>
                </a>
              </dd>
            </div>
          </dl>

          <ul v-if="itens.length > 1" class="itens" aria-label="Itens devolvidos">
            <li v-for="item in itens" :key="item.id" class="item">
              <div class="item__texto">
                <strong :title="item.title">{{ item.title || 'Produto sem título' }}</strong>
                <span>SKU: {{ item.sku || 'não identificado' }} · {{ item.quantity }} {{ Number(item.quantity) === 1 ? 'unidade' : 'unidades' }}</span>
                <span v-if="!ehCliente" class="item__estoque" :class="{ 'is-aviso': !item.estoque?.encontrado }">{{ textoDoEstoque(item) }}</span>
              </div>
              <span v-if="item.qty_apt !== null && item.qty_apt !== undefined" class="item__decisao">
                {{ item.qty_apt }} {{ Number(item.qty_apt) === 1 ? 'apta' : 'aptas' }}
                · {{ item.qty_not_apt || 0 }} {{ Number(item.qty_not_apt) === 1 ? 'não apta' : 'não aptas' }}
              </span>
            </li>
          </ul>
        </section>

        <!-- Inspeção -->
        <section
          v-show="aba === 'inspecao'"
          id="dev-painel-secao-inspecao"
          role="tabpanel"
          aria-labelledby="dev-painel-aba-inspecao"
          class="secao"
        >
          <template v-if="podeAnalisar">
            <fieldset class="checklist">
              <legend>Conferência do produto</legend>
              <label v-for="item in CHECKLIST" :key="item.chave" class="check">
                <input v-model="checklist[item.chave]" type="checkbox" :disabled="ocupado" />
                <span>{{ item.rotulo }}</span>
              </label>
            </fieldset>
            <div class="campo">
              <label for="dev-painel-observacao">Observação</label>
              <textarea
                id="dev-painel-observacao"
                v-model="observacao"
                rows="3"
                maxlength="2000"
                :disabled="ocupado"
                placeholder="Ex.: caixa amassada, produto sem uso, faltou o carregador."
              />
              <small class="campo__dica">{{ observacao.length }}/2000</small>
            </div>
          </template>

          <template v-else-if="etapa === 'analisado'">
            <ul class="checklist-lida" aria-label="Conferência registrada">
              <li v-for="item in CHECKLIST" :key="item.chave" :class="checklist[item.chave] ? 'is-ok' : 'is-vazio'">
                <IconeSvg :nome="checklist[item.chave] ? 'certo' : 'fechar'" :tamanho="14" />
                <span>{{ item.rotulo }}</span>
                <span class="sr-only">{{ checklist[item.chave] ? ': conferido' : ': não marcado' }}</span>
              </li>
            </ul>
            <div v-if="!ehCliente" class="lido">
              <span class="lido__rotulo">Observação</span>
              <p>{{ detalhe.notes || 'Sem observação.' }}</p>
            </div>
            <div class="lido">
              <span class="lido__rotulo">Decisão</span>
              <p>
                {{ unidadesAptas }} {{ unidadesAptas === 1 ? 'unidade apta' : 'unidades aptas' }}
                · {{ unidadesNaoAptas }} {{ unidadesNaoAptas === 1 ? 'não apta' : 'não aptas' }}
              </p>
              <p v-if="detalhe.not_apt_reason">
                Motivo: {{ rotuloDe(MOTIVOS_NAO_APTO, detalhe.not_apt_reason) || detalhe.not_apt_reason }}
                · Destino: {{ rotuloDe(DESTINOS_NAO_APTO, detalhe.not_apt_destination) || detalhe.not_apt_destination || '—' }}
              </p>
            </div>
            <div v-if="movimentosDeEstoque.length" class="lido">
              <span class="lido__rotulo">Estoque</span>
              <p v-for="mov in movimentosDeEstoque" :key="mov.id">{{ mov.note }}</p>
            </div>
          </template>

          <p v-else class="nota">{{ notaSemInspecao }}</p>
        </section>

        <!-- Histórico -->
        <section
          v-show="aba === 'historico'"
          id="dev-painel-secao-historico"
          role="tabpanel"
          aria-labelledby="dev-painel-aba-historico"
          class="secao"
        >
          <ol v-if="eventos.length" class="linha-do-tempo">
            <li v-for="evento in eventos" :key="evento.id" class="evento" :class="`is-${evento.source || 'sistema'}`">
              <span class="evento__icone"><IconeSvg :nome="iconeDoEvento(evento)" :tamanho="14" /></span>
              <div class="evento__corpo">
                <p class="evento__texto">{{ textoDoEvento(evento) }}</p>
                <p class="evento__meta">{{ formatarDataHora(evento.created_at) }} · {{ origemDoEvento(evento, visao) }}</p>
              </div>
            </li>
          </ol>
          <p v-else class="nota">Nada registrado ainda.</p>
        </section>

        <!-- Fotos -->
        <section v-if="aba !== 'historico' && aceitaFotos" class="fotos" aria-labelledby="dev-painel-fotos">
          <div class="fotos__topo">
            <h3 id="dev-painel-fotos" class="fotos__titulo">
              Fotos do produto recebido
              <span>{{ fotos.length }}/{{ MAX_FOTOS }}</span>
            </h3>
            <button
              v-if="podeAdicionarFoto"
              type="button"
              class="btn btn-secondary btn-sm btn-with-icon"
              :disabled="ocupado || fotos.length >= MAX_FOTOS"
              :title="fotos.length >= MAX_FOTOS ? `Cada devolução aceita até ${MAX_FOTOS} fotos` : 'Tirar ou escolher fotos'"
              @click="escolherFotos"
            >
              <IconeSvg nome="camera" />
              {{ enviando ? `Enviando ${Math.min(enviando.feitas + 1, enviando.total)}/${enviando.total}...` : 'Adicionar' }}
            </button>
            <input
              ref="campoDeFoto"
              type="file"
              accept="image/*"
              multiple
              class="sr-only"
              tabindex="-1"
              aria-hidden="true"
              @change="aoEscolherFotos"
            />
          </div>
          <ul v-if="fotos.length" class="fotos__grade">
            <li v-for="(foto, indice) in fotos" :key="foto.id">
              <button type="button" class="foto" :aria-label="`Ver foto ${indice + 1} de ${fotos.length}`" @click="fotoAberta = foto">
                <img v-if="urls[foto.id]" :src="urls[foto.id]" alt="" />
                <IconeSvg v-else nome="imagem" :tamanho="18" />
              </button>
            </li>
          </ul>
          <p v-else class="nota">{{ notaSemFotos }}</p>
        </section>
      </div>

      <!-- Ações da etapa -->
      <footer class="painel__acoes">
        <template v-if="podeAnalisar">
          <div class="acoes-decisao">
            <button type="button" class="btn btn-sucesso btn-with-icon" :disabled="ocupado || !itens.length" @click="abrirDecisao('apto')">
              <IconeSvg nome="check" />
              Apto a voltar ao estoque
            </button>
            <button type="button" class="btn btn-perigo-contorno btn-with-icon" :disabled="ocupado || !itens.length" @click="abrirDecisao('nao_apto')">
              <IconeSvg nome="cancelar" />
              Não apto
            </button>
          </div>
          <button
            type="button"
            class="btn btn-primary btn-with-icon btn-cheio"
            :disabled="ocupado || !alterado"
            :title="alterado ? 'Guarda o checklist e a observação sem decidir' : 'Nada mudou desde o último salvamento'"
            @click="salvarAnalise"
          >
            <IconeSvg nome="salvar" />
            {{ acao === 'salvar' ? 'Salvando...' : 'Salvar análise' }}
          </button>
          <p v-if="!itens.length" class="painel__dica is-aviso">Esta devolução não tem itens identificados. Sincronize com o Mercado Livre e tente de novo.</p>
        </template>

        <template v-else-if="podeConfirmarChegada">
          <button type="button" class="btn btn-primary btn-with-icon btn-cheio" :disabled="ocupado" @click="confirmarRecebimento">
            <IconeSvg nome="recebido" />
            {{ acao === 'recebimento' ? 'Confirmando...' : 'Confirmar recebimento' }}
          </button>
          <p class="painel__dica">Use quando o pacote chegar, mesmo que o Mercado Livre ainda não tenha atualizado. O cliente vê na tela dele que a CyberDock recebeu.</p>
        </template>

        <div v-else-if="etapa === 'analisado'" class="concluida">
          <span class="concluida__icone" :class="resultado?.classe">
            <IconeSvg :nome="detalhe.result === 'nao_apto' ? 'cancelar' : 'check'" :tamanho="18" />
          </span>
          <div class="concluida__texto">
            <strong>Análise concluída: {{ resultado?.rotulo || '—' }}</strong>
            <span>{{ formatarDataHora(detalhe.decided_at) }}<template v-if="detalhe.decided_by"> · {{ detalhe.decided_by }}</template></span>
          </div>
        </div>

        <!-- Cliente: a CyberDock está com o pacote e ainda vai conferir. -->
        <div v-else-if="ehCliente && recebimento?.confirmado" class="concluida">
          <span class="concluida__icone is-paid">
            <IconeSvg nome="recebido" :tamanho="18" />
          </span>
          <div class="concluida__texto">
            <strong>Recebida pela CyberDock</strong>
            <span>{{ formatarDataHora(detalhe.receipt_confirmed_at) }} · a equipe confere o produto e decide se volta ao estoque.</span>
          </div>
        </div>

        <p v-else class="painel__dica">{{ notaSemInspecao }}</p>
      </footer>
    </template>

    <!-- ================= DECISÃO ================= -->
    <UniversalModal
      :is-open="decisao.aberta && ativa"
      title="Concluir análise"
      size="md"
      :prevent-close="acao === 'decisao'"
      :close-on-overlay="acao !== 'decisao'"
      :close-on-esc="acao !== 'decisao'"
      @close="decisao.aberta = false"
    >
      <div v-if="detalhe" class="decisao">
        <p class="decisao__intro">
          Diga quantas unidades voltam ao estoque. As que não estiverem aptas precisam de motivo e destino.
        </p>

        <ul class="decisao__itens">
          <li v-for="item in itens" :key="item.id" class="decisao__item">
            <div class="decisao__produto">
              <strong :title="item.title">{{ item.title || 'Produto sem título' }}</strong>
              <span>SKU: {{ item.sku || 'não identificado' }} · {{ item.quantity }} {{ Number(item.quantity) === 1 ? 'unidade devolvida' : 'unidades devolvidas' }}</span>
            </div>

            <div v-if="Number(item.quantity) === 1" class="segmento" role="radiogroup" :aria-label="`Situação de ${nomeDoItem(item)}`">
              <label class="segmento__opcao" :class="{ 'is-apto': aptasDe(item) === 1 }">
                <input type="radio" class="sr-only" :name="`dev-apta-${item.id}`" :checked="aptasDe(item) === 1" :disabled="acao === 'decisao'" @change="definirAptas(item, 1)" />
                <IconeSvg nome="certo" :tamanho="14" />
                Apta
              </label>
              <label class="segmento__opcao" :class="{ 'is-nao': aptasDe(item) === 0 }">
                <input type="radio" class="sr-only" :name="`dev-apta-${item.id}`" :checked="aptasDe(item) === 0" :disabled="acao === 'decisao'" @change="definirAptas(item, 0)" />
                <IconeSvg nome="fechar" :tamanho="14" />
                Não apta
              </label>
            </div>

            <div v-else class="passo" role="group" :aria-label="`Unidades aptas de ${nomeDoItem(item)}`">
              <button type="button" class="passo__btn" :disabled="aptasDe(item) <= 0 || acao === 'decisao'" aria-label="Uma unidade apta a menos" @click="definirAptas(item, aptasDe(item) - 1)">−</button>
              <output class="passo__valor" aria-live="polite">{{ aptasDe(item) }}</output>
              <button type="button" class="passo__btn" :disabled="aptasDe(item) >= Number(item.quantity) || acao === 'decisao'" aria-label="Uma unidade apta a mais" @click="definirAptas(item, aptasDe(item) + 1)">+</button>
              <span class="passo__rotulo">de {{ item.quantity }} aptas</span>
            </div>
          </li>
        </ul>

        <p class="decisao__resultado">
          Resultado:
          <span class="status-pill" :class="previsto.classe">{{ previsto.rotulo }}</span>
          <span>{{ totalAptas }} {{ totalAptas === 1 ? 'apta' : 'aptas' }} · {{ totalNaoAptas }} {{ totalNaoAptas === 1 ? 'não apta' : 'não aptas' }}</span>
        </p>

        <template v-if="totalNaoAptas > 0">
          <fieldset class="opcoes">
            <legend>Motivo das unidades não aptas</legend>
            <label v-for="opcao in MOTIVOS_NAO_APTO" :key="opcao.valor" class="opcao" :class="{ 'is-on': decisao.motivo === opcao.valor }">
              <input v-model="decisao.motivo" type="radio" name="dev-motivo" :value="opcao.valor" :disabled="acao === 'decisao'" />
              {{ opcao.rotulo }}
            </label>
          </fieldset>
          <fieldset class="opcoes">
            <legend>O que fazer com elas</legend>
            <label v-for="opcao in DESTINOS_NAO_APTO" :key="opcao.valor" class="opcao" :class="{ 'is-on': decisao.destino === opcao.valor }">
              <input v-model="decisao.destino" type="radio" name="dev-destino" :value="opcao.valor" :disabled="acao === 'decisao'" />
              {{ opcao.rotulo }}
            </label>
          </fieldset>
        </template>

        <div class="impacto">
          <span class="impacto__rotulo">O que muda no estoque</span>
          <ul v-if="previa.length" class="impacto__lista">
            <li v-for="(linha, indice) in previa" :key="indice" :class="linha.classe">
              <IconeSvg :nome="linha.classe === 'is-ok' ? 'certo' : 'alerta'" :tamanho="14" />
              <span>{{ linha.texto }}</span>
            </li>
          </ul>
          <p v-else class="impacto__vazio">Nenhuma unidade volta ao estoque.</p>
        </div>

        <p v-if="faltaNaDecisao" class="decisao__falta" role="status">{{ faltaNaDecisao }}</p>
      </div>

      <template #footer>
        <button type="button" class="btn btn-secondary" :disabled="acao === 'decisao'" @click="decisao.aberta = false">Cancelar</button>
        <button type="button" class="btn btn-with-icon" :class="classeDoConfirmar" :disabled="Boolean(faltaNaDecisao) || ocupado" @click="confirmarDecisao">
          <IconeSvg nome="check" />
          {{ acao === 'decisao' ? 'Concluindo...' : `Concluir: ${previsto.rotulo.toLowerCase()}` }}
        </button>
      </template>
    </UniversalModal>

    <!-- ================= FOTO ================= -->
    <UniversalModal
      :is-open="Boolean(fotoAberta) && ativa"
      title="Foto do produto recebido"
      size="lg"
      @close="fotoAberta = null"
    >
      <figure v-if="fotoAberta" class="visualizador">
        <img v-if="urls[fotoAberta.id]" :src="urls[fotoAberta.id]" :alt="`Foto ${indiceDaFotoAberta + 1} do produto devolvido`" />
        <span v-else class="visualizador__vazio"><IconeSvg nome="imagem" :tamanho="28" /> Carregando a foto...</span>
        <figcaption>
          Foto {{ indiceDaFotoAberta + 1 }} de {{ fotos.length }} · {{ ehCliente ? 'tirada pela CyberDock em' : 'enviada em' }} {{ formatarDataHora(fotoAberta.created_at) }}
          <template v-if="!ehCliente && fotoAberta.uploaded_by"> por {{ fotoAberta.uploaded_by }}</template>
        </figcaption>
      </figure>
      <template #footer>
        <button v-if="podeRemoverFoto" type="button" class="btn btn-perigo-contorno btn-with-icon btn-esquerda" :disabled="ocupado" @click="removerFoto(fotoAberta)">
          <IconeSvg nome="lixo" />
          {{ acao === 'remover' ? 'Removendo...' : 'Remover foto' }}
        </button>
        <template v-if="fotos.length > 1">
          <button type="button" class="btn btn-secondary btn-with-icon" @click="verOutraFoto(-1)">
            <IconeSvg nome="chevron" class="gira-esquerda" />
            Anterior
          </button>
          <button type="button" class="btn btn-secondary btn-with-icon" @click="verOutraFoto(1)">
            Próxima
            <IconeSvg nome="chevron" class="gira-direita" />
          </button>
        </template>
        <button type="button" class="btn btn-secondary" @click="fotoAberta = null">Fechar</button>
      </template>
    </UniversalModal>
  </aside>
</template>

<script setup>
/* global defineProps, defineEmits, defineExpose */
import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import IconeSvg from '@/components/IconeSvg.vue';
import UniversalModal from '@/components/UniversalModal.vue';
import { useApi } from '@/composables/useApi';
import { useNotification, describeError } from '@/composables/useNotification';
import { useConfirm } from '@/composables/useConfirm';
import {
  RESULTADOS, CHECKLIST, MOTIVOS_NAO_APTO, DESTINOS_NAO_APTO, MOTIVOS_SEM_ENTRADA, MAX_FOTOS,
  rotuloDe, statusNoMl, situacaoDa, resultadoDa, recebimentoDa, podeConfirmarRecebimento, perguntaDoRecebimento,
  situacaoDoPrazo, nomeDoCliente, quantidadeTotal,
  linkDaVendaNoMl, formatarDataHora, miniaturaSegura, tentarMiniaturaPeloProxy,
  textoDoEvento, origemDoEvento, iconeDoEvento, resultadoPrevisto, previaDoEstoque,
  reduzirFoto, base64ParaBlob,
} from '@/utils/devolucoesUi';

const props = defineProps({
  devolucaoId: { type: [String, Number], required: true },
  /** 'lado' (ao lado da lista) ou 'gaveta' (por cima da tela, em tela estreita). */
  modo: { type: String, default: 'lado' },
  /** Falso quando a tela sai de cena (keep-alive): os modais, que vão para o body, somem junto. */
  ativa: { type: Boolean, default: true },
  /** 'master' (análise e ações) ou 'cliente' (só leitura, dados de /returns/minhas). */
  visao: { type: String, default: 'master' },
});
const emit = defineEmits(['fechar', 'alterada']);

const api = useApi();
const notify = useNotification();
const { confirm } = useConfirm();

const ABAS = [
  { id: 'resumo', rotulo: 'Resumo' },
  { id: 'inspecao', rotulo: 'Inspeção' },
  { id: 'historico', rotulo: 'Histórico' },
];
/* Mesmas regras do backend (confirmarRecebimento / adicionarFoto). */
const PODEM_CHEGAR = new Set(['aguardando_envio', 'em_transito', 'cancelada']);
const FORA_DO_CD = new Set(['no_ml', 'sem_devolucao']);
const JA_CHEGARAM = new Set(['no_cd', 'analisado']);

const NOTAS_SEM_INSPECAO = {
  aguardando_envio: 'O comprador ainda não enviou o pacote. A inspeção começa quando ele chegar ao CD.',
  em_transito: 'O pacote está a caminho. A inspeção começa quando ele chegar ao CD.',
  cancelada: 'O Mercado Livre cancelou esta devolução. Se o pacote chegar mesmo assim, confirme o recebimento.',
  no_ml: 'Este pacote vai para o depósito do Mercado Livre (Full) e não passa pelo CD. Não há nada a fazer aqui.',
  sem_devolucao: 'O Mercado Livre reembolsou o comprador sem pedir o produto de volta. Não existe pacote para receber.',
};

/* Visão do cliente: o que está acontecendo, sem instrução de trabalho do CD. */
const NOTAS_DO_CLIENTE = {
  aguardando_envio: 'O comprador ainda não enviou o pacote. A CyberDock confere o produto quando ele chegar.',
  em_transito: 'O pacote está a caminho da CyberDock. A conferência começa quando ele chegar.',
  no_cd: 'O Mercado Livre informou a entrega. A CyberDock confirma o recebimento e confere o produto.',
  cancelada: 'O Mercado Livre cancelou esta devolução. O pacote não deve chegar à CyberDock.',
  no_ml: 'Este pacote vai para o depósito do Mercado Livre (Full) e não passa pela CyberDock.',
  sem_devolucao: 'O Mercado Livre reembolsou o comprador sem pedir o produto de volta. Não há pacote a receber.',
};

/* ---------------- Estado ---------------- */

const raiz = ref(null);
const botaoFechar = ref(null);
const campoDeFoto = ref(null);

const detalhe = ref(null);
const carregando = ref(false);
const erro = ref('');
const aba = ref('resumo');
/** Ação em andamento: 'recebimento' | 'salvar' | 'decisao' | 'foto' | 'remover'. */
const acao = ref('');
const checklist = reactive(Object.fromEntries(CHECKLIST.map((item) => [item.chave, false])));
const observacao = ref('');
/** Retrato do checklist e da observação como estão no servidor. */
const salvo = ref('');
/** URL local (blob:) de cada foto, por id. */
const urls = reactive({});
const enviando = ref(null);
const fotoAberta = ref(null);
const decisao = reactive({ aberta: false, aptas: {}, motivo: '', destino: '' });
const miniaturaFalhou = ref(false);

/* ---------------- Derivados ---------------- */

const itens = computed(() => detalhe.value?.items || []);
const eventos = computed(() => detalhe.value?.events || []);
const fotos = computed(() => detalhe.value?.photos || []);
const etapa = computed(() => detalhe.value?.stage || '');
const situacao = computed(() => situacaoDa(detalhe.value));
const resultado = computed(() => resultadoDa(detalhe.value));
const quantidade = computed(() => quantidadeTotal(detalhe.value));
const principal = computed(() => itens.value[0] || {});
const tituloPrincipal = computed(() => principal.value.title || 'Produto sem título');
const skuPrincipal = computed(() => principal.value.sku || 'não identificado');
const miniaturaPrincipal = computed(() => miniaturaSegura(principal.value.thumbnail));
const linkDaVenda = computed(() => linkDaVendaNoMl(detalhe.value));
/* Prazo de revisão do ML: só interessa enquanto o produto pode ter problema
 * (não depois de analisado como apto). */
const prazo = computed(() => {
  if (!detalhe.value || FORA_DO_CD.has(etapa.value) || etapa.value === 'cancelada') return null;
  if (detalhe.value.result === 'apto') return null;
  return situacaoDoPrazo(detalhe.value.review_due_at);
});

const ehCliente = computed(() => props.visao === 'cliente');
/* O cliente lê pela rota dele, que o backend prende ao usuário logado. */
const base = computed(() => (ehCliente.value ? '/returns/minhas' : '/returns'));
const recebimento = computed(() => recebimentoDa(detalhe.value));

const podeAnalisar = computed(() => !ehCliente.value && etapa.value === 'no_cd');
const podeConfirmar = computed(() => !ehCliente.value && podeConfirmarRecebimento(detalhe.value));
/* Ainda a caminho no ML: o botão principal do rodapé registra a chegada junto. */
const podeConfirmarChegada = computed(() => podeConfirmar.value && PODEM_CHEGAR.has(etapa.value));
/* Já chegou pelo ML: a confirmação fica em destaque no topo, sem tirar o lugar da análise. */
const avisoDeRecebimento = computed(() => podeConfirmar.value && JA_CHEGARAM.has(etapa.value));
const aceitaFotos = computed(() => {
  if (!detalhe.value || FORA_DO_CD.has(etapa.value)) return false;
  return !ehCliente.value || JA_CHEGARAM.has(etapa.value) || fotos.value.length > 0;
});
const podeAdicionarFoto = computed(() => !ehCliente.value && JA_CHEGARAM.has(etapa.value));
/* Depois da análise as fotos são prova e o backend não deixa remover. */
const podeRemoverFoto = computed(() => !ehCliente.value && etapa.value === 'no_cd');
const ocupado = computed(() => Boolean(acao.value));
const notaSemInspecao = computed(() => (ehCliente.value ? NOTAS_DO_CLIENTE : NOTAS_SEM_INSPECAO)[etapa.value] || '');
const notaSemFotos = computed(() => {
  if (ehCliente.value) return 'A CyberDock fotografa o produto na conferência. As fotos aparecem aqui.';
  return podeAdicionarFoto.value
    ? 'Fotografe o produto e a embalagem. As fotos ficam guardadas como prova da análise.'
    : 'As fotos entram depois que o pacote chegar ao CD.';
});

const retratoDaEdicao = () => JSON.stringify({
  c: CHECKLIST.map((item) => Boolean(checklist[item.chave])),
  o: observacao.value.trim(),
});
const alterado = computed(() => podeAnalisar.value && retratoDaEdicao() !== salvo.value);

const unidadesAptas = computed(() => itens.value.reduce((soma, item) => soma + (Number(item.qty_apt) || 0), 0));
const unidadesNaoAptas = computed(() => itens.value.reduce((soma, item) => soma + (Number(item.qty_not_apt) || 0), 0));
const movimentosDeEstoque = computed(() => eventos.value.filter((evento) => evento.kind === 'estoque'));
const indiceDaFotoAberta = computed(() => fotos.value.findIndex((foto) => String(foto.id) === String(fotoAberta.value?.id)));

const nomeDoItem = (item) => item?.sku || item?.title || 'item';

function textoDoEstoque(item) {
  if (!item?.sku) return 'Item sem SKU identificado.';
  const estoque = item.estoque;
  if (!estoque) return 'Sem cliente identificado para conferir o estoque.';
  if (!estoque.encontrado) {
    return estoque.duplicado
      ? `SKU ${item.sku} duplicado no armazenamento do cliente.`
      : `SKU ${item.sku} não está ativo no armazenamento do cliente.`;
  }
  if (estoque.kit) {
    const pecas = (estoque.componentes || []).map((c) => `${c.sku}: ${c.quantidade}`).join(' · ');
    return pecas ? `Kit. Peças em estoque: ${pecas}` : 'Kit sem componentes cadastrados.';
  }
  return `${estoque.quantidade} ${estoque.quantidade === 1 ? 'unidade' : 'unidades'} em estoque agora`;
}

/* ---------------- Carregamento ---------------- */

let controle = null;
/* Muda a cada troca de devolução: resposta de uma ação antiga não pode cair na nova. */
let geracao = 0;

function revogarUrls() {
  Object.keys(urls).forEach((id) => {
    URL.revokeObjectURL(urls[id]);
    delete urls[id];
  });
}

const fotosBaixando = new Set();

function sincronizarFotos() {
  const devolucao = detalhe.value?.id ? String(detalhe.value.id) : '';
  const atuais = new Set(fotos.value.map((foto) => String(foto.id)));
  Object.keys(urls).forEach((id) => {
    if (!atuais.has(id)) {
      URL.revokeObjectURL(urls[id]);
      delete urls[id];
    }
  });
  if (!devolucao) return;
  const minha = geracao;
  fotos.value.forEach((foto) => {
    const id = String(foto.id);
    if (urls[id] || fotosBaixando.has(id)) return;
    fotosBaixando.add(id);
    api.get(`${base.value}/${devolucao}/fotos/${id}`, { responseType: 'blob' })
      .then((blob) => {
        const aindaExiste = fotos.value.some((f) => String(f.id) === id);
        if (minha !== geracao || !aindaExiste || urls[id] || !(blob instanceof Blob)) return;
        urls[id] = URL.createObjectURL(blob);
      })
      .catch(() => { /* fica o ícone de imagem no lugar */ })
      .finally(() => fotosBaixando.delete(id));
  });
}

function aplicarDetalhe(novo, { manterEdicao = false } = {}) {
  const preservar = manterEdicao && alterado.value;
  detalhe.value = novo;
  if (!preservar) {
    let doServidor = novo?.checklist || {};
    if (typeof doServidor === 'string') {
      try { doServidor = JSON.parse(doServidor); } catch { doServidor = {}; }
    }
    CHECKLIST.forEach((item) => { checklist[item.chave] = doServidor?.[item.chave] === true; });
    observacao.value = novo?.notes || '';
    salvo.value = retratoDaEdicao();
  }
  sincronizarFotos();
}

async function carregar({ silencioso = false } = {}) {
  const id = String(props.devolucaoId || '');
  if (!id) return;
  controle?.abort();
  const meuControle = new AbortController();
  controle = meuControle;
  if (!silencioso) {
    carregando.value = true;
    erro.value = '';
  }
  try {
    const novo = await api.get(`${base.value}/${id}`, { signal: meuControle.signal });
    if (meuControle !== controle) return;
    aplicarDetalhe(novo, { manterEdicao: silencioso });
  } catch (falha) {
    if (falha?.name === 'AbortError' || meuControle !== controle) return;
    if (!silencioso || !detalhe.value) erro.value = describeError(falha, 'Não foi possível abrir a devolução.');
  } finally {
    if (meuControle === controle) carregando.value = false;
  }
}

watch(() => props.devolucaoId, () => {
  geracao += 1;
  acao.value = '';
  enviando.value = null;
  decisao.aberta = false;
  fotoAberta.value = null;
  revogarUrls();
  detalhe.value = null;
  erro.value = '';
  aba.value = 'resumo';
  miniaturaFalhou.value = false;
  carregar();
}, { immediate: true });

/* ---------------- Ações ---------------- */

/** Uma ação por vez; `aindaAqui()` diz se a devolução mostrada ainda é a mesma. */
async function executar(nome, tarefa) {
  if (acao.value) return;
  const minha = geracao;
  acao.value = nome;
  try {
    await tarefa(() => minha === geracao);
  } finally {
    if (minha === geracao) acao.value = '';
  }
}

/**
 * A CyberDock confirma que está com o pacote. Ainda a caminho no ML, a
 * devolução passa para "No CD" junto; já entregue pelo ML, só fica confirmada.
 * O cliente vê "Recebida pela CyberDock" na tela dele.
 */
async function confirmarRecebimento() {
  if (!detalhe.value || acao.value || !podeConfirmar.value) return;
  const chegando = PODEM_CHEGAR.has(etapa.value);
  if (!(await confirm(perguntaDoRecebimento(detalhe.value)))) return;
  const id = String(props.devolucaoId);
  await executar('recebimento', async (aindaAqui) => {
    try {
      const novo = await api.post(`/returns/${id}/confirmar-recebimento`, {});
      if (!aindaAqui()) return;
      // Já "No CD": o checklist que estava sendo preenchido continua na tela.
      aplicarDetalhe(novo, { manterEdicao: true });
      if (chegando) aba.value = 'inspecao';
      notify.success(chegando ? 'Recebimento confirmado. Agora faça a inspeção.' : 'Recebimento confirmado.');
      emit('alterada', novo);
    } catch (falha) {
      notify.fromError(falha, 'Não foi possível confirmar o recebimento.');
      if (falha?.status === 409 && aindaAqui()) carregar({ silencioso: true });
    }
  });
}

async function salvarAnalise() {
  if (!podeAnalisar.value) return;
  const id = String(props.devolucaoId);
  await executar('salvar', async (aindaAqui) => {
    try {
      const novo = await api.put(`/returns/${id}/analise`, { checklist: { ...checklist }, observacao: observacao.value });
      if (!aindaAqui()) return;
      aplicarDetalhe(novo);
      notify.success('Análise salva. Falta decidir se volta ao estoque.');
      emit('alterada', novo);
    } catch (falha) {
      notify.fromError(falha, 'Não foi possível salvar a análise.');
      if (falha?.status === 409 && aindaAqui()) carregar({ silencioso: true });
    }
  });
}

/* ---------------- Decisão ---------------- */

const aptasDe = (item) => Number(decisao.aptas[String(item.id)]) || 0;
const totalAptas = computed(() => itens.value.reduce((soma, item) => soma + aptasDe(item), 0));
const totalNaoAptas = computed(() => itens.value.reduce(
  (soma, item) => soma + Math.max(0, (Number(item.quantity) || 0) - aptasDe(item)), 0
));
const previsto = computed(() => resultadoPrevisto(totalAptas.value, totalNaoAptas.value));
const previa = computed(() => (decisao.aberta && detalhe.value ? previaDoEstoque(detalhe.value, aptasDe) : []));
const faltaNaDecisao = computed(() => {
  if (!itens.value.length) return 'Esta devolução não tem itens identificados. Sincronize com o Mercado Livre e tente de novo.';
  const bloqueio = previa.value.find((linha) => linha.bloqueia);
  if (bloqueio) return bloqueio.texto;
  if (totalNaoAptas.value > 0 && !decisao.motivo) return 'Escolha o motivo das unidades não aptas.';
  if (totalNaoAptas.value > 0 && !decisao.destino) return 'Escolha o que fazer com as unidades não aptas.';
  return '';
});
const classeDoConfirmar = computed(() => {
  if (previsto.value === RESULTADOS.apto) return 'btn-sucesso';
  if (previsto.value === RESULTADOS.nao_apto) return 'btn-perigo';
  return 'btn-primary';
});

function definirAptas(item, valor) {
  const maximo = Number(item.quantity) || 0;
  decisao.aptas[String(item.id)] = Math.min(maximo, Math.max(0, Math.round(Number(valor) || 0)));
}

function abrirDecisao(tipo) {
  if (!podeAnalisar.value || !itens.value.length || acao.value) return;
  const aptas = {};
  itens.value.forEach((item) => {
    aptas[String(item.id)] = tipo === 'apto' ? (Number(item.quantity) || 0) : 0;
  });
  decisao.aptas = aptas;
  decisao.motivo = detalhe.value.not_apt_reason || '';
  decisao.destino = detalhe.value.not_apt_destination || '';
  decisao.aberta = true;
}

function avisarEfeito(efeito) {
  const rotulo = RESULTADOS[efeito?.resultado]?.rotulo || 'concluída';
  const entradas = Array.isArray(efeito?.entradas) ? efeito.entradas : [];
  const semEntrada = Array.isArray(efeito?.semEntrada) ? efeito.semEntrada : [];
  if (entradas.length) {
    const partes = entradas.map((mov) => `+${mov.quantidade} em ${mov.sku}`).join(', ');
    notify.success(`Análise concluída (${rotulo}). Estoque: ${partes}.`, 6500);
  } else {
    notify.success(`Análise concluída (${rotulo}).`);
  }
  if (semEntrada.length) {
    const motivos = semEntrada
      .map((falta) => `${falta.sku || 'item'}: ${MOTIVOS_SEM_ENTRADA[falta.motivo] || 'sem entrada'}`)
      .join('; ');
    notify.warning(`Nada entrou no estoque para ${motivos}.`, 9000);
  }
}

async function confirmarDecisao() {
  if (faltaNaDecisao.value || acao.value || !podeAnalisar.value) return;
  const id = String(props.devolucaoId);
  const naoAptas = totalNaoAptas.value > 0;
  const corpo = {
    itens: itens.value.map((item) => ({ id: String(item.id), qtyApt: aptasDe(item) })),
    motivo: naoAptas ? decisao.motivo : null,
    destino: naoAptas ? decisao.destino : null,
    checklist: { ...checklist },
    observacao: observacao.value,
  };
  await executar('decisao', async (aindaAqui) => {
    try {
      const { efeito, ...novo } = await api.post(`/returns/${id}/decisao`, corpo);
      if (!aindaAqui()) return;
      aplicarDetalhe(novo);
      decisao.aberta = false;
      aba.value = 'inspecao';
      avisarEfeito(efeito);
      emit('alterada', novo);
    } catch (falha) {
      notify.fromError(falha, 'Não foi possível concluir a análise.');
      if (falha?.status === 409 && aindaAqui()) {
        // Já analisada em outra aba, ou o estoque mudou: mostra como está agora.
        decisao.aberta = false;
        carregar({ silencioso: true });
      }
    }
  });
}

/* ---------------- Fotos ---------------- */

function escolherFotos() {
  if (acao.value || fotos.value.length >= MAX_FOTOS) return;
  campoDeFoto.value?.click();
}

async function aoEscolherFotos(evento) {
  const campo = evento.target;
  const arquivos = Array.from(campo.files || []);
  campo.value = ''; // permite escolher a mesma foto de novo
  if (!arquivos.length || acao.value) return;

  const vagas = MAX_FOTOS - fotos.value.length;
  if (vagas <= 0) {
    notify.warning(`Cada devolução aceita até ${MAX_FOTOS} fotos.`);
    return;
  }
  const fila = arquivos.slice(0, vagas);
  if (arquivos.length > vagas) {
    notify.warning(`Só cabem mais ${vagas} ${vagas === 1 ? 'foto' : 'fotos'}. As outras ficaram de fora.`);
  }

  const id = String(props.devolucaoId);
  await executar('foto', async (aindaAqui) => {
    let enviadas = 0;
    enviando.value = { feitas: 0, total: fila.length };
    try {
      for (const arquivo of fila) {
        if (!aindaAqui()) return;
        try {
          const base64 = await reduzirFoto(arquivo);
          const foto = await api.post(`/returns/${id}/fotos`, { imagem: base64 });
          if (!aindaAqui()) return;
          detalhe.value.photos = [...fotos.value, foto];
          urls[String(foto.id)] = URL.createObjectURL(base64ParaBlob(base64, 'image/jpeg'));
          enviadas += 1;
        } catch (falha) {
          notify.fromError(falha, 'Não foi possível guardar uma das fotos.');
        } finally {
          if (enviando.value) enviando.value = { ...enviando.value, feitas: enviando.value.feitas + 1 };
        }
      }
    } finally {
      if (aindaAqui()) enviando.value = null;
    }
    if (!enviadas || !aindaAqui()) return;
    notify.success(enviadas === 1 ? 'Foto guardada.' : `${enviadas} fotos guardadas.`);
    await carregar({ silencioso: true });
    if (aindaAqui() && detalhe.value) emit('alterada', detalhe.value);
  });
}

function verOutraFoto(passo) {
  const lista = fotos.value;
  if (lista.length < 2) return;
  const atual = Math.max(0, indiceDaFotoAberta.value);
  fotoAberta.value = lista[(atual + passo + lista.length) % lista.length];
}

async function removerFoto(foto) {
  if (!foto || acao.value || !podeRemoverFoto.value) return;
  const ok = await confirm({
    title: 'Remover foto?',
    message: 'A foto sai da inspeção desta devolução.',
    detail: 'Depois que a análise é concluída as fotos ficam guardadas e não podem mais ser removidas.',
    confirmText: 'Remover foto',
    tone: 'danger',
  });
  if (!ok) return;
  const id = String(props.devolucaoId);
  const fotoId = String(foto.id);
  await executar('remover', async (aindaAqui) => {
    try {
      await api.delete(`/returns/${id}/fotos/${fotoId}`);
      if (!aindaAqui()) return;
      detalhe.value.photos = fotos.value.filter((f) => String(f.id) !== fotoId);
      if (urls[fotoId]) {
        URL.revokeObjectURL(urls[fotoId]);
        delete urls[fotoId];
      }
      if (String(fotoAberta.value?.id) === fotoId) fotoAberta.value = null;
      notify.success('Foto removida.');
      await carregar({ silencioso: true });
      if (aindaAqui() && detalhe.value) emit('alterada', detalhe.value);
    } catch (falha) {
      notify.fromError(falha, 'Não foi possível remover a foto.');
    }
  });
}

/* ---------------- Navegação ---------------- */

function aoFalharMiniatura(evento) {
  if (!tentarMiniaturaPeloProxy(evento.target)) miniaturaFalhou.value = true;
}

function aoTeclarAbas(evento) {
  const atual = ABAS.findIndex((item) => item.id === aba.value);
  const destinos = { ArrowRight: (atual + 1) % ABAS.length, ArrowLeft: (atual - 1 + ABAS.length) % ABAS.length, Home: 0, End: ABAS.length - 1 };
  if (!(evento.key in destinos)) return;
  evento.preventDefault();
  const proxima = ABAS[destinos[evento.key]].id;
  aba.value = proxima;
  nextTick(() => document.getElementById(`dev-painel-aba-${proxima}`)?.focus());
}

/**
 * Pode trocar de devolução ou fechar? Bloqueia com ação em andamento e pede
 * confirmação se o checklist ou a observação mudaram sem salvar.
 */
async function podeSair() {
  if (acao.value) {
    notify.warning('Espere terminar o que está sendo salvo.');
    return false;
  }
  if (!alterado.value) return true;
  return confirm({
    title: 'Sair sem salvar a análise?',
    message: 'O checklist ou a observação desta devolução mudaram e não foram salvos.',
    detail: 'Para guardar sem decidir, use "Salvar análise".',
    confirmText: 'Sair sem salvar',
    tone: 'danger',
  });
}

/* Quem fecha é a tela (tirando ?devolucao= da URL); a guarda da rota chama
 * `podeSair`, então a pergunta sobre o que não foi salvo aparece uma vez só. */
function fechar() {
  emit('fechar');
}

/* Esc fecha só a gaveta. Ao lado da lista, Esc no meio da observação não deve
 * tirar o painel da tela. */
function aoTeclarEsc(evento) {
  if (props.modo !== 'gaveta') return;
  evento.preventDefault();
  fechar();
}

function focar() {
  (botaoFechar.value || raiz.value)?.focus?.();
}

/** Lê de novo a devolução sem perder o checklist ainda não salvo (ex.: depois de sincronizar). */
const recarregar = () => carregar({ silencioso: true });

defineExpose({ podeSair, focar, recarregar });

onMounted(() => {
  if (props.modo === 'gaveta') nextTick(focar);
});

onBeforeUnmount(() => {
  geracao += 1;
  controle?.abort();
  revogarUrls();
});
</script>

<style scoped>
.painel {
  display: flex; flex-direction: column; min-height: 0; box-sizing: border-box;
  border: 1px solid #dbe3ef; border-radius: 14px; background: #fff; color: #0f172a;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05); font-family: var(--font-sans);
}
.painel:focus { outline: none; }
/* Ao lado da lista o painel gruda abaixo da barra do topo (56px) e nunca passa
   da altura da janela: cabeçalho e botões ficam sempre à vista e só o miolo
   rola, e só quando o conteúdo não cabe. */
.painel.is-lado { max-height: calc(100vh - 88px); }
/* Na gaveta, quem posiciona é a tela; o painel ocupa a gaveta inteira. */
.painel.is-gaveta { height: 100%; border: none; border-radius: 0; box-shadow: none; }
button, input, select, textarea { font-family: var(--font-sans); }
.sr-only {
  position: absolute !important; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}

/* ---------------- Topo ---------------- */
.painel__topo {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 0.6rem;
  padding: 0.9rem 1rem 0.75rem; border-bottom: 1px solid #eef2f7;
}
.painel__titulos { min-width: 0; }
.painel__titulo { margin: 0; color: #0f172a; font-size: 1rem; font-weight: 800; letter-spacing: -0.01em; }
.painel__sub { margin: 0.15rem 0 0; color: #64748b; font-size: 0.76rem; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.icone-btn {
  display: grid; place-items: center; flex: 0 0 auto; width: 34px; height: 34px;
  border: 1px solid #dbe3ef; border-radius: 9px; background: #fff; color: #475569; cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.icone-btn:hover { border-color: #93c5fd; background: #eff6ff; color: #1d4ed8; }
.icone-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25); }

/* ---------------- Corpo ---------------- */
.painel__corpo {
  flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain;
  display: flex; flex-direction: column; gap: 0.8rem; padding: 0.9rem 1rem 1rem;
}

.produto { display: flex; align-items: center; gap: 0.7rem; min-width: 0; }
.miniatura {
  display: grid; place-items: center; flex: 0 0 auto; width: 52px; height: 52px; overflow: hidden;
  border: 1px solid #e2e8f0; border-radius: 10px; background: #f8fafc; color: #94a3b8;
}
.miniatura img { width: 100%; height: 100%; object-fit: contain; background: #fff; }
.produto__texto { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
.produto__titulo {
  display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2;
  color: #0f172a; font-size: 0.86rem; font-weight: 750; line-height: 1.3;
}
.produto__sku { color: #64748b; font-size: 0.75rem; overflow-wrap: anywhere; }
.pilulas { display: flex; flex-wrap: wrap; gap: 0.35rem; }

.aviso {
  display: flex; align-items: flex-start; gap: 0.45rem; margin: 0; padding: 0.5rem 0.65rem;
  border: 1px solid #e2e8f0; border-radius: 9px; background: #f8fafc; color: #475569; font-size: 0.76rem; line-height: 1.45;
}
.aviso > svg { flex: 0 0 auto; margin-top: 0.1rem; }
.aviso.is-warning { border-color: #fed7aa; background: #fff7ed; color: #9a3412; }
.aviso.is-overdue { border-color: #fecaca; background: #fef2f2; color: #b91c1c; }
.aviso.is-recebimento { border-color: #bfdbfe; background: #eff6ff; color: #1e3a8a; }
.aviso__corpo { display: flex; flex-direction: column; align-items: flex-start; gap: 0.45rem; min-width: 0; }

/* ---------------- Abas ---------------- */
.abas { display: flex; gap: 0.25rem; border-bottom: 1px solid #e2e8f0; }
.aba {
  display: inline-flex; align-items: center; gap: 0.35rem; margin-bottom: -1px; padding: 0.5rem 0.7rem;
  border: none; border-bottom: 2px solid transparent; background: none; color: #64748b;
  font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: color 0.15s, border-color 0.15s;
}
.aba:hover { color: #1d4ed8; }
.aba.is-ativa { border-bottom-color: #2563eb; color: #1d4ed8; }
.aba:focus-visible { outline: none; border-radius: 6px 6px 0 0; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25); }
.aba__contador {
  min-width: 18px; padding: 0 0.3rem; border-radius: 999px; background: #eef2f7; color: #475569;
  font-size: 0.66rem; font-weight: 800; line-height: 18px; text-align: center;
}
.aba.is-ativa .aba__contador { background: #dbeafe; color: #1d4ed8; }

.secao { display: flex; flex-direction: column; gap: 0.75rem; }
.nota { margin: 0; color: #64748b; font-size: 0.8rem; line-height: 1.5; }

/* ---------------- Resumo ---------------- */
.fatos { display: flex; flex-direction: column; margin: 0; }
.fato {
  display: grid; grid-template-columns: minmax(7.5rem, 40%) minmax(0, 1fr); gap: 0.6rem;
  padding: 0.45rem 0; border-bottom: 1px solid #f1f5f9; font-size: 0.8rem;
}
.fato:last-child { border-bottom: none; }
.fato dt { color: #64748b; font-weight: 600; }
.fato dd { display: flex; flex-direction: column; gap: 0.1rem; margin: 0; color: #0f172a; font-weight: 650; overflow-wrap: anywhere; }
.fato dd small { color: #64748b; font-size: 0.72rem; font-weight: 500; }
.fato .is-aviso, .fato dd.is-aviso { color: #c2410c; }
.fato dd.is-ok { color: #047857; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.78rem; }
.link {
  display: inline-flex; align-items: center; gap: 0.2rem; width: fit-content;
  color: #1d4ed8; font-size: 0.74rem; font-weight: 700; text-decoration: none;
}
.link:hover { text-decoration: underline; }
.link:focus-visible { outline: none; border-radius: 4px; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25); }

.itens { display: flex; flex-direction: column; gap: 0.45rem; margin: 0; padding: 0; list-style: none; }
.item {
  display: flex; flex-direction: column; gap: 0.3rem; padding: 0.55rem 0.65rem;
  border: 1px solid #eef2f7; border-radius: 10px; background: #f8fafc;
}
.item__texto { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; font-size: 0.76rem; color: #64748b; }
.item__texto strong { overflow: hidden; color: #0f172a; font-size: 0.8rem; text-overflow: ellipsis; white-space: nowrap; }
.item__estoque.is-aviso { color: #c2410c; }
.item__decisao { color: #334155; font-size: 0.74rem; font-weight: 700; }

/* ---------------- Inspeção ---------------- */
.checklist { display: flex; flex-direction: column; gap: 0.15rem; margin: 0; padding: 0; border: none; }
.checklist legend { margin-bottom: 0.35rem; padding: 0; color: #334155; font-size: 0.78rem; font-weight: 750; }
.check {
  display: flex; align-items: center; gap: 0.55rem; padding: 0.4rem 0.5rem; border-radius: 8px;
  color: #0f172a; font-size: 0.8rem; cursor: pointer; transition: background 0.15s;
}
.check:hover { background: #f8fafc; }
.check input { flex: 0 0 auto; width: 17px; height: 17px; margin: 0; accent-color: #2563eb; cursor: pointer; }
.check input:disabled { cursor: not-allowed; }

.campo { display: flex; flex-direction: column; gap: 0.3rem; }
.campo label { color: #334155; font-size: 0.78rem; font-weight: 750; }
.campo textarea {
  width: 100%; box-sizing: border-box; min-height: 76px; padding: 0.55rem 0.65rem; resize: vertical;
  border: 1px solid #dbe3ef; border-radius: 9px; color: #0f172a; font-size: 0.82rem; line-height: 1.45;
}
.campo textarea:focus { outline: none; border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12); }
.campo__dica { align-self: flex-end; color: #64748b; font-size: 0.68rem; font-variant-numeric: tabular-nums; }

.checklist-lida { display: flex; flex-direction: column; gap: 0.3rem; margin: 0; padding: 0; list-style: none; }
.checklist-lida li { display: flex; align-items: center; gap: 0.45rem; font-size: 0.79rem; }
.checklist-lida li.is-ok { color: #0f172a; }
.checklist-lida li.is-ok svg { color: #059669; }
.checklist-lida li.is-vazio { color: #64748b; }
.lido { display: flex; flex-direction: column; gap: 0.2rem; padding: 0.55rem 0.65rem; border: 1px solid #eef2f7; border-radius: 10px; background: #f8fafc; }
.lido__rotulo { color: #64748b; font-size: 0.66rem; font-weight: 750; letter-spacing: 0.04em; text-transform: uppercase; }
.lido p { margin: 0; color: #0f172a; font-size: 0.8rem; line-height: 1.45; overflow-wrap: anywhere; white-space: pre-line; }

/* ---------------- Histórico ---------------- */
.linha-do-tempo { position: relative; display: flex; flex-direction: column; gap: 0.75rem; margin: 0; padding: 0; list-style: none; }
.linha-do-tempo::before { content: ""; position: absolute; top: 6px; bottom: 6px; left: 13px; width: 2px; background: #eef2f7; }
.evento { position: relative; display: flex; gap: 0.6rem; }
.evento__icone {
  position: relative; display: grid; place-items: center; flex: 0 0 auto; width: 28px; height: 28px;
  border: 2px solid #fff; border-radius: 999px; background: #eef2f7; color: #475569;
}
.evento.is-mercadolivre .evento__icone { background: #fef9c3; color: #854d0e; }
.evento.is-cd .evento__icone { background: #dbeafe; color: #1d4ed8; }
.evento.is-sistema .evento__icone { background: #dcfce7; color: #047857; }
.evento__corpo { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; padding-top: 0.2rem; }
.evento__texto { margin: 0; color: #0f172a; font-size: 0.8rem; line-height: 1.4; overflow-wrap: anywhere; }
.evento__meta { margin: 0; color: #64748b; font-size: 0.7rem; overflow-wrap: anywhere; }

/* ---------------- Fotos ---------------- */
.fotos { display: flex; flex-direction: column; gap: 0.55rem; padding-top: 0.75rem; border-top: 1px solid #eef2f7; }
.fotos__topo { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.fotos__titulo { display: flex; align-items: baseline; gap: 0.4rem; margin: 0; color: #0f172a; font-size: 0.82rem; font-weight: 750; }
.fotos__titulo span { color: #64748b; font-size: 0.7rem; font-weight: 700; font-variant-numeric: tabular-nums; }
.fotos__grade { display: grid; grid-template-columns: repeat(auto-fill, minmax(68px, 1fr)); gap: 0.45rem; margin: 0; padding: 0; list-style: none; }
.foto {
  display: grid; place-items: center; width: 100%; aspect-ratio: 1; padding: 0; overflow: hidden;
  border: 1px solid #e2e8f0; border-radius: 9px; background: #f8fafc; color: #94a3b8; cursor: zoom-in;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.foto img { width: 100%; height: 100%; object-fit: cover; }
.foto:hover { border-color: #93c5fd; }
.foto:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.3); }

/* ---------------- Ações ---------------- */
.painel__acoes {
  display: flex; flex-direction: column; gap: 0.5rem; padding: 0.8rem 1rem 0.9rem;
  border-top: 1px solid #eef2f7; border-radius: 0 0 14px 14px; background: #fff;
}
.painel.is-gaveta .painel__acoes { border-radius: 0; }
.acoes-decisao { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 0.5rem; }
.painel__dica { margin: 0; color: #64748b; font-size: 0.75rem; line-height: 1.45; }
.painel__dica.is-aviso { color: #c2410c; }
.concluida { display: flex; align-items: center; gap: 0.6rem; }
.concluida__icone { display: grid; place-items: center; flex: 0 0 auto; width: 36px; height: 36px; border-radius: 999px; background: #f1f5f9; color: #64748b; }
.concluida__icone.is-paid { background: #ecfdf5; color: #047857; }
.concluida__icone.is-warning { background: #fff7ed; color: #c2410c; }
.concluida__icone.is-overdue { background: #fef2f2; color: #b91c1c; }
.concluida__texto { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; }
.concluida__texto strong { color: #0f172a; font-size: 0.84rem; }
.concluida__texto span { color: #64748b; font-size: 0.74rem; overflow-wrap: anywhere; }

/* ---------------- Estados ---------------- */
.estado { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 2.5rem 1rem; text-align: center; color: #64748b; }
.estado p { margin: 0; font-size: 0.82rem; }
.estado__icone { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 999px; background: #fef2f2; color: #dc2626; }
.sk-produto { display: flex; align-items: center; gap: 0.7rem; }
.sk-linhas { display: flex; flex: 1; flex-direction: column; gap: 8px; }
.sk-linhas--folga { gap: 14px; margin-top: 0.6rem; }
.sk { position: relative; display: block; height: 12px; overflow: hidden; border-radius: 6px; background: #eef1f5; }
.sk::after {
  content: ""; position: absolute; inset: 0; transform: translateX(-100%);
  background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.6) 50%, rgba(255, 255, 255, 0) 100%);
  animation: sk-brilho 1.2s infinite;
}
.sk--sm { height: 9px; }
.sk-quadro { width: 52px; height: 52px; flex: 0 0 auto; border-radius: 10px; }
@keyframes sk-brilho { 100% { transform: translateX(100%); } }

/* ---------------- Pílulas ---------------- */
.status-pill {
  display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.22rem 0.55rem; border-radius: 999px; white-space: nowrap;
  font-size: 0.72rem; font-weight: 750; line-height: 1.25;
}
.status-dot { flex: 0 0 auto; width: 6px; height: 6px; border-radius: 999px; background: currentColor; }
.status-pill.is-muted { background: #f1f5f9; color: #64748b; }
.status-pill.is-ready { background: #eff6ff; color: #1d4ed8; }
.status-pill.is-sent { background: #eef2ff; color: #4338ca; }
.status-pill.is-warning { background: #fff7ed; color: #c2410c; }
.status-pill.is-overdue { background: #fef2f2; color: #b91c1c; }
.status-pill.is-paid { background: #ecfdf5; color: #047857; }

/* ---------------- Botões ---------------- */
.btn {
  display: inline-flex; align-items: center; justify-content: center;
  min-height: 38px; padding: 0.45rem 0.8rem; border: 1px solid transparent; border-radius: 9px;
  font-size: 0.82rem; font-weight: 700; line-height: 1.2; text-align: center; text-decoration: none; cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s, opacity 0.15s;
}
.btn:disabled { opacity: 0.55; cursor: not-allowed; }
.btn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25); }
.btn-with-icon { gap: 0.4rem; }
.btn-with-icon svg { flex: 0 0 auto; }
.btn-cheio { width: 100%; }
.btn-sm { min-height: 32px; padding: 0.3rem 0.65rem; font-size: 0.78rem; }
.btn-primary { background-color: #2563eb; border-color: #2563eb; color: #fff; }
.btn-primary:hover:not(:disabled) { background-color: #1d4ed8; border-color: #1d4ed8; }
.btn-secondary { background-color: #fff; border-color: #dbe3ef; color: #475569; }
.btn-secondary:hover:not(:disabled) { border-color: #93c5fd; background-color: #eff6ff; color: #1d4ed8; }
.btn-sucesso { background-color: #059669; border-color: #059669; color: #fff; }
.btn-sucesso:hover:not(:disabled) { background-color: #047857; border-color: #047857; }
.btn-sucesso:focus-visible { box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.3); }
.btn-perigo { background-color: #dc2626; border-color: #dc2626; color: #fff; }
.btn-perigo:hover:not(:disabled) { background-color: #b91c1c; border-color: #b91c1c; }
.btn-perigo-contorno { background-color: #fff; border-color: #fca5a5; color: #b91c1c; }
.btn-perigo-contorno:hover:not(:disabled) { background-color: #fef2f2; border-color: #f87171; }
.btn-perigo:focus-visible, .btn-perigo-contorno:focus-visible { box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.25); }
.btn-esquerda { margin-right: auto; }
.gira-esquerda { transform: rotate(90deg); }
.gira-direita { transform: rotate(-90deg); }

/* ---------------- Modal de decisão ---------------- */
.decisao { display: flex; flex-direction: column; gap: 0.85rem; }
.decisao__intro { margin: 0; color: #334155; font-size: 0.85rem; line-height: 1.5; }
.decisao__itens { display: flex; flex-direction: column; gap: 0.5rem; margin: 0; padding: 0; list-style: none; }
.decisao__item {
  display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap;
  padding: 0.6rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 10px; background: #f8fafc;
}
.decisao__produto { display: flex; flex: 1 1 14rem; flex-direction: column; gap: 0.1rem; min-width: 0; }
.decisao__produto strong { overflow: hidden; color: #0f172a; font-size: 0.84rem; text-overflow: ellipsis; white-space: nowrap; }
.decisao__produto span { color: #64748b; font-size: 0.74rem; }

.segmento { display: inline-flex; overflow: hidden; border: 1px solid #dbe3ef; border-radius: 9px; background: #fff; }
.segmento__opcao {
  display: inline-flex; align-items: center; gap: 0.3rem; min-height: 34px; padding: 0 0.75rem;
  color: #475569; font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: background 0.15s, color 0.15s;
}
.segmento__opcao + .segmento__opcao { border-left: 1px solid #dbe3ef; }
.segmento__opcao:hover { background: #f8fafc; }
.segmento__opcao:focus-within { box-shadow: inset 0 0 0 2px #93c5fd; }
.segmento__opcao.is-apto { background: #ecfdf5; color: #047857; }
.segmento__opcao.is-nao { background: #fef2f2; color: #b91c1c; }

.passo { display: inline-flex; align-items: center; gap: 0.35rem; }
.passo__btn {
  display: grid; place-items: center; width: 32px; height: 32px; border: 1px solid #dbe3ef; border-radius: 8px;
  background: #fff; color: #334155; font-size: 1.05rem; font-weight: 800; cursor: pointer;
}
.passo__btn:hover:not(:disabled) { border-color: #93c5fd; background: #eff6ff; color: #1d4ed8; }
.passo__btn:disabled { opacity: 0.45; cursor: not-allowed; }
.passo__btn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25); }
.passo__valor { min-width: 2ch; color: #0f172a; font-size: 0.95rem; font-weight: 800; text-align: center; font-variant-numeric: tabular-nums; }
.passo__rotulo { color: #64748b; font-size: 0.74rem; font-weight: 650; }

.decisao__resultado { display: flex; align-items: center; gap: 0.45rem; flex-wrap: wrap; margin: 0; color: #334155; font-size: 0.8rem; font-weight: 650; }

.opcoes { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 0; padding: 0; border: none; }
.opcoes legend { width: 100%; margin-bottom: 0.35rem; padding: 0; color: #334155; font-size: 0.78rem; font-weight: 750; }
.opcao {
  display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.65rem;
  border: 1px solid #dbe3ef; border-radius: 999px; background: #fff; color: #334155;
  font-size: 0.78rem; font-weight: 650; cursor: pointer; transition: border-color 0.15s, background 0.15s;
}
.opcao input { margin: 0; accent-color: #dc2626; }
.opcao:hover { border-color: #fca5a5; }
.opcao.is-on { border-color: #f87171; background: #fef2f2; color: #991b1b; }
.opcao:focus-within { box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.18); }

.impacto { display: flex; flex-direction: column; gap: 0.4rem; padding: 0.65rem 0.8rem; border: 1px solid #e2e8f0; border-radius: 10px; background: #f8fafc; }
.impacto__rotulo { color: #64748b; font-size: 0.66rem; font-weight: 750; letter-spacing: 0.04em; text-transform: uppercase; }
.impacto__lista { display: flex; flex-direction: column; gap: 0.3rem; margin: 0; padding: 0; list-style: none; }
.impacto__lista li { display: flex; align-items: flex-start; gap: 0.4rem; font-size: 0.79rem; line-height: 1.4; }
.impacto__lista li svg { flex: 0 0 auto; margin-top: 0.12rem; }
.impacto__lista .is-ok { color: #065f46; }
.impacto__lista .is-aviso { color: #9a3412; }
.impacto__lista .is-erro { color: #b91c1c; font-weight: 650; }
.impacto__vazio { margin: 0; color: #64748b; font-size: 0.79rem; }
.decisao__falta { margin: 0; padding: 0.5rem 0.65rem; border: 1px solid #fed7aa; border-radius: 9px; background: #fff7ed; color: #9a3412; font-size: 0.78rem; line-height: 1.45; }

/* ---------------- Visualizador de foto ---------------- */
.visualizador { display: flex; flex-direction: column; align-items: center; gap: 0.6rem; margin: 0; }
.visualizador img { display: block; max-width: 100%; max-height: 68vh; border-radius: 10px; background: #f8fafc; object-fit: contain; }
.visualizador figcaption { color: #64748b; font-size: 0.78rem; text-align: center; overflow-wrap: anywhere; }
.visualizador__vazio { display: flex; align-items: center; gap: 0.5rem; padding: 3rem 1rem; color: #64748b; font-size: 0.85rem; }

@media (prefers-reduced-motion: reduce) {
  .sk::after { animation: none; }
  .btn, .aba, .foto, .check, .icone-btn { transition: none; }
}
</style>
