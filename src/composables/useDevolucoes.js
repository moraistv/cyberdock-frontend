// src/composables/useDevolucoes.js
//
// Estado da tela de devoluções do Mercado Livre (MasterDevolucoesView):
// filtros, lista paginada, números do período e o acompanhamento da
// sincronização com o ML. A sincronização roda no servidor, em segundo plano;
// aqui só pedimos para começar e acompanhamos até terminar.
//
// Na visão do cliente (`visao: 'cliente'`) tudo vem de /returns/minhas, que o
// backend prende ao usuário logado; não há filtro de cliente nem sincronização.

import { ref, reactive, computed } from 'vue';
import { useApi } from './useApi';
import { describeError } from './useNotification';

const LIMITE_POR_PAGINA = 25;
const INTERVALO_DO_ACOMPANHAMENTO = 2000;
/* Uma sincronização longa (a primeira lê 60 dias de todas as contas) leva
 * minutos; depois disso paramos de perguntar e a lista volta a ser lida
 * normalmente. */
const ACOMPANHAMENTO_MAXIMO = 60 * 60 * 1000;
const ATRASO_DA_BUSCA = 350;

export const FILTROS_PADRAO = Object.freeze({
  busca: '',
  periodo: '30d',
  situacao: '',
  resultado: '',
  recebimento: '',
  cliente: '',
  conta: '',
});

/** Parâmetros da consulta, só com o que foi preenchido. */
export function montarConsulta(filtros, extra = {}) {
  const params = new URLSearchParams();
  const busca = String(filtros.busca || '').trim();
  if (busca) params.set('busca', busca);
  params.set('periodo', filtros.periodo || FILTROS_PADRAO.periodo);
  for (const campo of ['situacao', 'resultado', 'recebimento', 'cliente', 'conta']) {
    if (filtros[campo]) params.set(campo, String(filtros[campo]));
  }
  for (const [chave, valor] of Object.entries(extra)) {
    if (valor !== undefined && valor !== null && valor !== '') params.set(chave, String(valor));
  }
  return params.toString();
}

export function useDevolucoes({ visao = 'master' } = {}) {
  const api = useApi();
  const doCliente = visao === 'cliente';
  const base = doCliente ? '/returns/minhas' : '/returns';

  const filtros = reactive({ ...FILTROS_PADRAO });
  /* O backend ignora `cliente` na rota do cliente; aqui ele nem sai. */
  const consultaDe = (extra) => montarConsulta(doCliente ? { ...filtros, cliente: '' } : filtros, extra);
  const pagina = ref(1);
  const lista = ref([]);
  const total = ref(0);
  const totalDePaginas = ref(1);
  const kpis = ref(null);
  const facetas = ref({ clientes: [], contas: [] });
  const ultimaSincronizacao = ref(null);
  const carregando = ref(false);
  const carregouUmaVez = ref(false);
  const erro = ref('');
  /** Estado público da sincronização (GET /returns/sync). */
  const sync = ref(null);

  const filtrosAtivos = computed(() => Object.keys(FILTROS_PADRAO)
    .filter((campo) => String(filtros[campo] || '').trim() !== FILTROS_PADRAO[campo]).length);
  const sincronizando = computed(() => Boolean(sync.value?.rodando));

  /* Lista: o pedido mais recente vence; um anterior que responda depois é descartado. */
  let controle = null;
  let ultimoPedido = 0;
  let atrasoDaBusca = null;

  /* Acompanhamento da sincronização (ver "Sincronização" abaixo). */
  let temporizador = null;
  let acompanhando = false;
  let inicioDoAcompanhamento = 0;
  let aoTerminar = null;

  /* ---------------- Lista ---------------- */

  /**
   * Lê a página atual com os filtros. `silencioso`: atualização de fundo
   * (depois de uma ação, da sincronização, na volta à tela). Ela não mostra
   * carregando e, se falhar, mantém a lista que já está na tela.
   */
  async function carregar({ silencioso = false } = {}) {
    controle?.abort();
    const meuControle = new AbortController();
    controle = meuControle;
    const pedido = ++ultimoPedido;
    if (!silencioso) carregando.value = true;
    try {
      const consulta = consultaDe({ page: pagina.value, limit: LIMITE_POR_PAGINA });
      const resposta = await api.get(`${base}?${consulta}`, { signal: meuControle.signal });
      if (pedido !== ultimoPedido) return;

      const paginas = Math.max(1, Number(resposta.totalPages) || 1);
      // A página pedida deixou de existir (filtro novo, devolução analisada):
      // vai para a última que existe em vez de mostrar uma lista vazia.
      if (pagina.value > paginas) {
        pagina.value = paginas;
        await carregar({ silencioso });
        return;
      }

      lista.value = Array.isArray(resposta.data) ? resposta.data : [];
      total.value = Number(resposta.total) || 0;
      totalDePaginas.value = paginas;
      kpis.value = resposta.kpis || null;
      facetas.value = {
        clientes: Array.isArray(resposta.facetas?.clientes) ? resposta.facetas.clientes : [],
        contas: Array.isArray(resposta.facetas?.contas) ? resposta.facetas.contas : [],
      };
      ultimaSincronizacao.value = resposta.ultimaSincronizacao || null;
      // Enquanto o acompanhamento roda, quem manda no estado da sincronização
      // é ele: uma lista pedida antes do clique viria com "parada".
      if (resposta.sync && !acompanhando) {
        sync.value = resposta.sync;
        // Terminou longe daqui (tela fora de cena): o aviso guardado já não vale.
        if (!resposta.sync.rodando) aoTerminar = null;
      }
      carregouUmaVez.value = true;
      erro.value = '';
    } catch (falha) {
      if (falha?.name === 'AbortError' || pedido !== ultimoPedido) return;
      if (silencioso && carregouUmaVez.value) return;
      erro.value = describeError(falha, 'Não foi possível carregar as devoluções.');
    } finally {
      if (pedido === ultimoPedido) carregando.value = false;
    }
  }

  /** Filtro de seleção mudou: volta para a primeira página. */
  function aplicarFiltros() {
    clearTimeout(atrasoDaBusca);
    pagina.value = 1;
    carregar();
  }

  /** Busca digitada: espera a pessoa parar de digitar. */
  function buscarComAtraso() {
    clearTimeout(atrasoDaBusca);
    atrasoDaBusca = setTimeout(() => {
      pagina.value = 1;
      carregar();
    }, ATRASO_DA_BUSCA);
  }

  function definirFiltros(valores) {
    Object.assign(filtros, valores);
    aplicarFiltros();
  }

  function limparFiltros() {
    Object.assign(filtros, FILTROS_PADRAO);
    aplicarFiltros();
  }

  function irParaPagina(numero) {
    const destino = Math.min(Math.max(1, Number(numero) || 1), totalDePaginas.value);
    if (destino === pagina.value) return;
    pagina.value = destino;
    carregar();
  }

  /** Todas as devoluções do filtro atual (planilha). O servidor limita a 5000. */
  async function buscarTodas() {
    const resposta = await api.get(`${base}?${consultaDe({ todas: 1 })}`);
    return {
      linhas: Array.isArray(resposta.data) ? resposta.data : [],
      total: Number(resposta.total) || 0,
    };
  }

  /* ---------------- Sincronização ---------------- */

  function pararAcompanhamento() {
    clearTimeout(temporizador);
    temporizador = null;
    acompanhando = false;
  }

  async function passoDoAcompanhamento() {
    if (!acompanhando) return;
    try {
      sync.value = await api.get('/returns/sync');
    } catch {
      /* Rede instável: tenta de novo no próximo passo. */
    }
    if (!acompanhando) return;

    const passouDoLimite = Date.now() - inicioDoAcompanhamento > ACOMPANHAMENTO_MAXIMO;
    if (sync.value?.rodando && !passouDoLimite) {
      temporizador = setTimeout(passoDoAcompanhamento, INTERVALO_DO_ACOMPANHAMENTO);
      return;
    }

    acompanhando = false;
    const callback = aoTerminar;
    aoTerminar = null;
    // O aviso usa o estado lido no fim do acompanhamento: a lista lida em
    // seguida também traz um estado, e ele não pode substituir este no aviso.
    const final = sync.value;
    await carregar({ silencioso: true });
    if (callback && !passouDoLimite) callback(final);
  }

  /** Acompanha a sincronização em andamento até ela terminar. */
  function acompanharSincronizacao(callback = null) {
    if (callback) aoTerminar = callback;
    if (acompanhando) return;
    acompanhando = true;
    inicioDoAcompanhamento = Date.now();
    temporizador = setTimeout(passoDoAcompanhamento, INTERVALO_DO_ACOMPANHAMENTO);
  }

  /** Pede ao servidor para ler agora as devoluções no ML (só o master). */
  async function sincronizar(callback = null) {
    if (doCliente) return;
    sync.value = await api.post('/returns/sync', {});
    acompanharSincronizacao(callback);
  }

  /** Tela saiu de cena (keep-alive) ou foi desmontada. */
  function pausar() {
    clearTimeout(atrasoDaBusca);
    controle?.abort();
    pararAcompanhamento();
  }

  return {
    filtros,
    pagina,
    lista,
    total,
    totalDePaginas,
    kpis,
    facetas,
    ultimaSincronizacao,
    carregando,
    carregouUmaVez,
    erro,
    sync,
    filtrosAtivos,
    sincronizando,
    limitePorPagina: LIMITE_POR_PAGINA,
    carregar,
    aplicarFiltros,
    buscarComAtraso,
    definirFiltros,
    limparFiltros,
    irParaPagina,
    buscarTodas,
    sincronizar,
    acompanharSincronizacao,
    pausar,
  };
}

export default useDevolucoes;
