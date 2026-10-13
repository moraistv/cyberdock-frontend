// src/utils/loteDeCobranca.js
//
// Passo a passo de gerar a cobrança de um cliente, e o lote que repete isso
// para vários. Usado pela central de cobranças.
//
// Para quem opera, é uma ação só: "Gerar cobrança". Por baixo o backend exige
// três passos, e é aqui que eles são encadeados: calcular e travar o valor do
// mês (fechar a competência) -> cadastrar o cliente no Asaas -> criar a
// cobrança.
//
// Não há rota de lote no backend de propósito: ela seguraria a requisição por
// minutos (timeout do proxy) e prenderia conexões do pool. Aqui cada cliente
// passa pelas MESMAS rotas da tela dele e cada passo é curto e protegido pelo
// lock e pela idempotência do backend. Repetir qualquer passo é seguro: fechar
// de novo responde `already_closed`, cadastrar é idempotente e emitir de novo
// ADOTA a cobrança que o Asaas já tiver, em vez de criar outra.
//
// Sem Vue e sem chamadas diretas de rede: as rotas entram por injeção, o que
// permite testar o fluxo inteiro com dublês.

/* Condição passageira: lock ocupado, limite do Asaas, timeout, rede, ou
 * cobrança criada sem o vínculo local gravado (a repetição adota). */
export const CODIGOS_REPETIVEIS = new Set([
  'billing_busy', 'provider_rate_limited', 'timeout', 'network_error', 'link_failed',
]);
/* Sem `code`: proxy no meio do caminho. */
export const STATUS_REPETIVEIS = new Set([502, 503, 504, 524]);

export const codigoDoErro = (erro) => erro?.data?.code || null;

const esperarPadrao = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

export const PENDENCIA_DE_DADOS = 'Sem CPF/CNPJ: complete o cadastro do cliente para gerar a cobrança.';

/**
 * @param {object} deps
 * @param {object} deps.api  { closeInvoicePeriod, ensureAsaasCustomer, issueCharge }
 * @param {(valor:number)=>string} deps.formatarValor
 * @param {(iso:string)=>string}   deps.formatarData
 * @param {(erro:any, padrao:string)=>string} deps.mensagemDeErro
 * @param {(ms:number)=>Promise}   [deps.esperar]
 */
export function criarLoteDeCobranca({ api, formatarData, mensagemDeErro, esperar = esperarPadrao }) {
  function concluir(item, etapa, mensagem, extra = {}) {
    Object.assign(item, { etapa, mensagem }, extra);
  }

  /**
   * Repete UMA vez o que falhou por condição passageira. Sem `status` a
   * resposta nem chegou ao navegador. Todos os passos são idempotentes no
   * backend, então a repetição não duplica nada.
   */
  async function comRetentativa(operacao) {
    try {
      return await operacao();
    } catch (erro) {
      const codigo = codigoDoErro(erro);
      const repetivel = codigo
        ? CODIGOS_REPETIVEIS.has(codigo)
        : (!erro?.status || STATUS_REPETIVEIS.has(erro.status));
      if (!repetivel) throw erro;
      await esperar(codigo === 'provider_rate_limited' ? 20000 : 2500);
      return operacao();
    }
  }

  /** Trava o valor do mês; `already_closed` conta como sucesso. */
  async function fecharCompetencia(uid, periodo) {
    try {
      const resposta = await comRetentativa(() => api.closeInvoicePeriod(uid, periodo));
      return { total: resposta?.invoice?.total_amount ?? null };
    } catch (erro) {
      if (codigoDoErro(erro) === 'already_closed') return { total: null };
      throw erro;
    }
  }

  /** Cria a cobrança, resolvendo os dois desvios que têm saída automática. */
  async function emitirCobranca(uid, periodo, vencimento) {
    const emitir = () => comRetentativa(() => api.issueCharge(uid, periodo, { dueDate: vencimento }));
    try {
      return await emitir();
    } catch (erro) {
      const codigo = codigoDoErro(erro);
      if (codigo === 'missing_customer') {
        await comRetentativa(() => api.ensureAsaasCustomer(uid));
        return emitir();
      }
      // Reaberta por outra pessoa entre a carga da lista e agora.
      if (codigo === 'period_not_closed') {
        await fecharCompetencia(uid, periodo);
        return emitir();
      }
      throw erro;
    }
  }

  /**
   * Gera a cobrança de um cliente e grava o resultado no próprio `item`:
   * `etapa` (ok | pulado | erro), `mensagem`, `total`, `invoiceUrl` e
   * `pendencia` ('dados' quando falta CPF/CNPJ). Nunca lança.
   *
   * `item.linha` é a linha da visão geral: { uid, linked, hasDocument, total,
   * invoice: { closedAt } | null }.
   *
   * @param {{ periodo: string, vencimento: string }} opcoes
   */
  async function processarItem(item, { periodo, vencimento }) {
    const { linha } = item;
    try {
      /* Sem cadastro para cobrar, nada é feito. Travar o valor antes deixaria o
       * mês fechado sem cobrança, e quem opera nem sabe que existe "fechar". */
      if (!linha.linked && !linha.hasDocument) {
        return concluir(item, 'pulado', PENDENCIA_DE_DADOS, { pendencia: 'dados' });
      }

      let total = linha.total ?? null;
      if (!linha.invoice?.closedAt) {
        item.etapa = 'fechando';
        const fechamento = await fecharCompetencia(linha.uid, periodo);
        if (fechamento.total !== null) total = fechamento.total;
      }
      item.total = total;

      if (total !== null && !(Number(total) > 0)) {
        return concluir(item, 'pulado', 'Fatura zerada: nada a cobrar.');
      }

      if (!linha.linked) {
        item.etapa = 'vinculando';
        await comRetentativa(() => api.ensureAsaasCustomer(linha.uid));
      }

      item.etapa = 'emitindo';
      const resposta = await emitirCobranca(linha.uid, periodo, vencimento);
      return concluir(item, 'ok', resposta?.adopted
        ? 'Este mês já tinha cobrança no Asaas, então nenhuma outra foi criada.'
        : `Cobrança criada, vence em ${formatarData(resposta?.dueDate)}.`, {
        total: resposta?.value ?? item.total,
        invoiceUrl: resposta?.invoiceUrl || null,
      });
    } catch (erro) {
      switch (codigoDoErro(erro)) {
        case 'already_charged':
          return concluir(item, 'ok', 'Já tinha cobrança.', { invoiceUrl: erro.data?.invoiceUrl || null });
        case 'zero_amount':
          return concluir(item, 'pulado', 'Fatura zerada: nada a cobrar.');
        case 'missing_billing_info':
          return concluir(item, 'pulado', PENDENCIA_DE_DADOS, { pendencia: 'dados' });
        default:
          return concluir(item, 'erro', mensagemDeErro(erro, 'Não foi possível concluir.'));
      }
    }
  }

  /**
   * Processa os itens em `aguardando`, `concorrencia` por vez. `deveParar` é
   * consultado antes de cada cliente: o que já começou termina, o resto fica
   * como `cancelado`.
   */
  async function executar(itens, opcoes, { concorrencia = 2, deveParar = () => false } = {}) {
    const fila = itens.filter((item) => item.etapa === 'aguardando');
    let proximo = 0;
    const trabalhador = async () => {
      while (proximo < fila.length && !deveParar()) {
        const item = fila[proximo];
        proximo += 1;
        await processarItem(item, opcoes);
      }
    };
    await Promise.all(Array.from({ length: Math.min(concorrencia, fila.length) }, trabalhador));
    fila.filter((item) => item.etapa === 'aguardando')
      .forEach((item) => concluir(item, 'cancelado', 'Não processado: o lote foi interrompido.'));
  }

  return { processarItem, executar, concluir };
}
