// src/utils/devolucoesUi.js
//
// Textos, cores e formatação da tela de devoluções do Mercado Livre
// (MasterDevolucoesView e DevolucaoPainel, na visão do master e na do
// cliente). As chaves batem com o backend (utils/mlReturns.js); mudar uma aqui
// exige mudar lá.

import { API_BASE_URL } from '@/config';

/* Situação da devolução no CyberDock. `classe` usa as mesmas cores das pílulas
 * da central de cobranças. */
export const SITUACOES = Object.freeze({
  aguardando_envio: { rotulo: 'Aguardando envio', classe: 'is-muted', dica: 'O comprador ainda não postou o pacote.' },
  em_transito: { rotulo: 'Em trânsito', classe: 'is-ready', dica: 'O pacote está a caminho do CD.' },
  no_cd: { rotulo: 'No CD', classe: 'is-warning', dica: 'Chegou ao CD e espera a análise.' },
  analisado: { rotulo: 'Analisado', classe: 'is-sent', dica: 'A análise foi concluída.' },
  cancelada: { rotulo: 'Cancelada', classe: 'is-muted', dica: 'A devolução foi cancelada ou o pacote não vem.' },
  no_ml: { rotulo: 'Vai para o ML', classe: 'is-muted', dica: 'O pacote vai para o depósito do Mercado Livre, não para o CD.' },
  sem_devolucao: { rotulo: 'Sem devolução física', classe: 'is-muted', dica: 'O Mercado Livre reembolsou sem pedir o produto de volta.' },
});

export const RESULTADOS = Object.freeze({
  pendente: { rotulo: 'Pendente', classe: 'is-muted' },
  apto: { rotulo: 'Apto', classe: 'is-paid' },
  parcial: { rotulo: 'Parcial', classe: 'is-warning' },
  nao_apto: { rotulo: 'Não apto', classe: 'is-overdue' },
});

/** Resultado mostrado na lista: só existe pendência depois que o pacote chegou. */
export function resultadoDa(devolucao) {
  if (devolucao?.result && RESULTADOS[devolucao.result]) return RESULTADOS[devolucao.result];
  if (devolucao?.stage === 'no_cd') return RESULTADOS.pendente;
  return null;
}

/* Status da devolução no Mercado Livre, em português. */
const STATUS_ML = {
  pending: 'Aberta',
  opened: 'Aberta',
  label_generated: 'Etiqueta gerada',
  scheduled: 'Coleta agendada',
  shipped: 'Enviada pelo comprador',
  pending_delivered: 'Entregando',
  delivered: 'Entregue ao CD',
  not_delivered: 'Não entregue',
  return_to_buyer: 'Voltando ao comprador',
  closed: 'Encerrada',
  cancelled: 'Cancelada',
  pending_cancel: 'Cancelando',
  expired: 'Expirada',
  pending_expiration: 'Expirando',
  failed: 'Falhou',
  pending_failure: 'Falhando',
};
export const statusNoMl = (status) => STATUS_ML[String(status || '').toLowerCase()] || (status ? String(status) : '—');

export const OPCOES_DE_PERIODO = Object.freeze([
  { valor: '7d', rotulo: 'Últimos 7 dias' },
  { valor: '30d', rotulo: 'Últimos 30 dias' },
  { valor: '90d', rotulo: 'Últimos 90 dias' },
  { valor: 'all', rotulo: 'Todo o período' },
]);

export const OPCOES_DE_SITUACAO = Object.freeze([
  { valor: '', rotulo: 'Status: Todos' },
  { valor: 'a_caminho', rotulo: 'A caminho do CD' },
  { valor: 'aguardando_envio', rotulo: 'Aguardando envio' },
  { valor: 'em_transito', rotulo: 'Em trânsito' },
  { valor: 'no_cd', rotulo: 'No CD' },
  { valor: 'analisado', rotulo: 'Analisado' },
  { valor: 'cancelada', rotulo: 'Cancelada' },
  { valor: 'no_ml', rotulo: 'Vai para o ML (Full)' },
  { valor: 'sem_devolucao', rotulo: 'Sem devolução física' },
]);

export const OPCOES_DE_RESULTADO = Object.freeze([
  { valor: '', rotulo: 'Resultado: Todos' },
  { valor: 'pendente', rotulo: 'Pendente' },
  { valor: 'aptos', rotulo: 'Apto ou parcial' },
  { valor: 'apto', rotulo: 'Apto' },
  { valor: 'parcial', rotulo: 'Parcial' },
  { valor: 'nao_apto', rotulo: 'Não apto' },
]);

/* Modalidade de envio da VENDA que gerou a devolução (filtro `envio` do
 * backend, utils/mlReturns.js). Full + "todas, menos Full" somam o total;
 * "não identificada" é venda que não está nas vendas sincronizadas. */
export const OPCOES_DE_ENVIO = Object.freeze([
  { valor: '', rotulo: 'Mod. envio: Todas' },
  { valor: 'full', rotulo: 'Full' },
  { valor: 'sem_full', rotulo: 'Todas, menos Full' },
  { valor: 'flex', rotulo: 'Flex' },
  { valor: 'coleta', rotulo: 'Coleta' },
  { valor: 'agencia', rotulo: 'Agência' },
  { valor: 'correios', rotulo: 'Correios' },
  { valor: 'padrao', rotulo: 'Envio padrão' },
  { valor: 'outras', rotulo: 'Outras' },
  { valor: 'nao_identificada', rotulo: 'Não identificada' },
]);

/* Valor gravado na venda (o mesmo da Tabela de vendas) → como aparece aqui. */
const MODALIDADES_DE_ENVIO = Object.freeze({
  FULL: { rotulo: 'Full', classe: 'is-full', dica: 'Venda Full: o produto saiu do depósito do Mercado Livre.' },
  FLEX: { rotulo: 'Flex', classe: 'is-envio', dica: '' },
  Coleta: { rotulo: 'Coleta', classe: 'is-envio', dica: '' },
  'Agência': { rotulo: 'Agência', classe: 'is-envio', dica: '' },
  Correios: { rotulo: 'Correios', classe: 'is-envio', dica: '' },
  'Envio Padrão': { rotulo: 'Envio padrão', classe: 'is-envio', dica: '' },
  Outros: { rotulo: 'Outra', classe: 'is-envio', dica: '' },
});

/**
 * Modalidade de envio da venda (`sale_shipping_mode`). `conhecida` falso: a
 * venda não está nas vendas sincronizadas e não há o que mostrar na linha.
 * null: o backend ainda não manda o campo (versão anterior no ar); a tela não
 * mostra nada em vez de dizer "não identificada" para todas.
 */
export function envioDa(d) {
  if (!d || !Object.prototype.hasOwnProperty.call(d, 'sale_shipping_mode')) return null;
  const valor = d.sale_shipping_mode;
  if (!valor) {
    return {
      conhecida: false,
      full: false,
      rotulo: 'Não identificada',
      classe: 'is-envio',
      dica: 'A venda não foi encontrada nas vendas sincronizadas.',
    };
  }
  const conhecida = MODALIDADES_DE_ENVIO[valor];
  return {
    conhecida: true,
    full: valor === 'FULL',
    rotulo: conhecida ? conhecida.rotulo : String(valor),
    classe: conhecida ? conhecida.classe : 'is-envio',
    dica: conhecida ? conhecida.dica : '',
  };
}

/* Recebimento confirmado pela CyberDock (filtro `recebimento` do backend).
 * "Aguardando" é o que ainda vem ou já chegou pelo ML sem confirmação. */
export const OPCOES_DE_RECEBIMENTO = Object.freeze([
  { valor: '', rotulo: 'Recebimento: Todos' },
  { valor: 'confirmado', rotulo: 'Recebimento confirmado' },
  { valor: 'aguardando', rotulo: 'Aguardando confirmação' },
]);

/* Mesmas regras do backend (confirmarRecebimento): o que ainda vem pelo ML
 * passa para "No CD" ao confirmar; o que já chegou pelo ML só é confirmado. */
const PODEM_CHEGAR = new Set(['aguardando_envio', 'em_transito', 'cancelada']);
const JA_CHEGARAM = new Set(['no_cd', 'analisado']);

/** O master ainda pode confirmar o recebimento desta devolução? */
export function podeConfirmarRecebimento(d) {
  if (!d || d.receipt_confirmed_at) return false;
  return PODEM_CHEGAR.has(d.stage) || JA_CHEGARAM.has(d.stage);
}

/** Pergunta antes de confirmar o recebimento (useConfirm), da lista ou do painel. */
export function perguntaDoRecebimento(d) {
  let detalhe = 'O cliente passa a ver na tela dele que a CyberDock recebeu a devolução.';
  if (d?.stage === 'cancelada') {
    detalhe = 'O Mercado Livre marcou esta devolução como cancelada. Confirme só se o pacote estiver mesmo aqui.';
  } else if (PODEM_CHEGAR.has(d?.stage)) {
    detalhe = 'A devolução passa para "No CD", fica pronta para a inspeção e o cliente vê que a CyberDock recebeu.';
  }
  return {
    title: 'Confirmar recebimento',
    message: `O pacote do pedido #${d?.order_id || d?.ml_return_id || '—'} está no CD?`,
    detail: detalhe,
    confirmText: 'Confirmar recebimento',
    tone: 'primary',
  };
}

/**
 * Recebimento pela CyberDock, para a lista e o painel. `etiqueta` é o que vai
 * na linha da lista, e só enquanto a devolução está "No CD": a caminho, o
 * status já diz que não chegou; analisada, o resultado já diz que chegou.
 * Devolução que não vem para o CD não tem recebimento.
 */
export function recebimentoDa(d) {
  if (!d || d.stage === 'no_ml' || d.stage === 'sem_devolucao') return null;
  if (d.receipt_confirmed_at) {
    return {
      confirmado: true,
      classe: 'is-paid',
      etiqueta: d.stage === 'no_cd' ? 'Recebida' : '',
      texto: `Recebida pela CyberDock em ${formatarDataHora(d.receipt_confirmed_at)}`,
    };
  }
  if (JA_CHEGARAM.has(d.stage)) {
    return {
      confirmado: false,
      classe: 'is-warning',
      etiqueta: 'Aguardando confirmação',
      texto: 'O Mercado Livre informou a entrega. Falta a CyberDock confirmar o recebimento.',
    };
  }
  return {
    confirmado: false,
    classe: 'is-muted',
    etiqueta: '',
    texto: d.stage === 'cancelada'
      ? 'Devolução cancelada no Mercado Livre. O pacote não deve chegar.'
      : 'O pacote ainda não chegou à CyberDock.',
  };
}

/* Conferência da inspeção: as chaves são as do backend. */
export const CHECKLIST = Object.freeze([
  { chave: 'mesmo_produto', rotulo: 'É o mesmo produto e a mesma variação' },
  { chave: 'quantidade_confere', rotulo: 'A quantidade confere' },
  { chave: 'sem_avarias', rotulo: 'Sem quebra, risco ou amassado' },
  { chave: 'sem_uso', rotulo: 'Sem sinais de uso' },
  { chave: 'completo', rotulo: 'Peças e acessórios completos' },
  { chave: 'embalagem_ok', rotulo: 'Embalagem em condição de venda' },
]);

export const MOTIVOS_NAO_APTO = Object.freeze([
  { valor: 'danificado', rotulo: 'Chegou danificado' },
  { valor: 'incompleto', rotulo: 'Veio incompleto' },
  { valor: 'diferente', rotulo: 'Produto diferente do enviado' },
  { valor: 'vazio', rotulo: 'Pacote sem o produto' },
  { valor: 'usado', rotulo: 'Com sinais de uso' },
  { valor: 'outro', rotulo: 'Outro problema' },
]);

export const DESTINOS_NAO_APTO = Object.freeze([
  { valor: 'avaria', rotulo: 'Guardar como avaria' },
  { valor: 'devolver_cliente', rotulo: 'Devolver ao cliente' },
  { valor: 'descarte', rotulo: 'Descartar' },
]);

export const rotuloDe = (lista, valor) => lista.find((o) => o.valor === valor)?.rotulo || '';

/* Datas e horas sempre no horário de Brasília, não no fuso do navegador. */
const FORMATO_DATA = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric',
});
const FORMATO_HORA = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit',
});

function comoData(valor) {
  if (!valor) return null;
  const data = valor instanceof Date ? valor : new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data;
}

export function formatarData(valor) {
  const data = comoData(valor);
  return data ? FORMATO_DATA.format(data) : '—';
}

export function formatarHora(valor) {
  const data = comoData(valor);
  return data ? FORMATO_HORA.format(data) : '';
}

export function formatarDataHora(valor) {
  const data = comoData(valor);
  return data ? `${FORMATO_DATA.format(data)}, ${FORMATO_HORA.format(data)}` : '—';
}

/** Tempo médio de análise: "5 h" abaixo de um dia, "1,4 dia" acima. */
export function formatarDuracaoEmHoras(horas) {
  const valor = Number(horas);
  if (horas === null || horas === undefined || !Number.isFinite(valor)) return null;
  if (valor < 1) return 'menos de 1 h';
  if (valor < 24) return `${Math.round(valor)} h`;
  const dias = Math.round((valor / 24) * 10) / 10;
  return `${dias.toLocaleString('pt-BR')} ${dias === 1 ? 'dia' : 'dias'}`;
}

/**
 * Prazo que o ML dá para o vendedor revisar o produto devolvido (avisar que
 * chegou com problema). Vencido ou nas próximas 24 h pede atenção.
 * `curto` vai na linha da lista; `texto`, no painel.
 */
export function situacaoDoPrazo(valor, agora = new Date()) {
  const data = comoData(valor);
  if (!data) return null;
  const horas = (data.getTime() - agora.getTime()) / 3600000;
  if (horas < 0) {
    return {
      classe: 'is-overdue',
      curto: 'Prazo do ML vencido',
      texto: `O prazo do Mercado Livre para revisar o produto venceu em ${formatarDataHora(data)}`,
    };
  }
  return {
    classe: horas <= 24 ? 'is-warning' : 'is-muted',
    curto: `Prazo do ML: ${formatarDataHora(data)}`,
    texto: `Prazo do Mercado Livre para revisar o produto: até ${formatarDataHora(data)}`,
  };
}

/** Variação em relação ao período anterior: "+12%". Sem base, sem número. */
export function variacaoPercentual(atual, anterior) {
  const a = Number(atual);
  const b = Number(anterior);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= 0) return null;
  const pct = Math.round(((a - b) / b) * 100);
  return { valor: pct, texto: `${pct > 0 ? '+' : ''}${pct}%` };
}

export const nomeDoCliente = (d) => d?.client_name || d?.client_email || 'Cliente não identificado';

export const quantidadeTotal = (d) => (d?.items || []).reduce((soma, i) => soma + (Number(i.quantity) || 0), 0);

export const situacaoDa = (d) => SITUACOES[d?.stage] || { rotulo: d?.stage || '—', classe: 'is-muted', dica: '' };

export const rotuloDaSituacao = (chave) => SITUACOES[chave]?.rotulo || chave || '—';

/** Venda no painel do vendedor no ML (o pack agrupa pedidos do mesmo carrinho). */
export function linkDaVendaNoMl(d) {
  const id = d?.pack_id || d?.order_id;
  return id ? `https://www.mercadolivre.com.br/vendas/${id}/detalhe` : null;
}

/* ---------------- Miniaturas do ML ---------------- */

/** O ML ainda devolve miniatura em http://; na página em https ela seria bloqueada. */
export const miniaturaSegura = (url) => (url ? String(url).replace(/^http:\/\//i, 'https://') : '');

/**
 * O CDN do ML às vezes recusa a imagem fora do site deles. Tenta uma única vez
 * pelo proxy do backend (o mesmo da tabela de vendas). Devolve false quando não
 * há mais o que tentar e a tela deve mostrar o ícone no lugar.
 */
export function tentarMiniaturaPeloProxy(img) {
  if (!img) return false;
  const original = img.getAttribute('src') || '';
  if (img.dataset.proxy === '1' || !original || original.includes('/ml/img-proxy')) return false;
  img.dataset.proxy = '1';
  img.src = `${API_BASE_URL}/ml/img-proxy?url=${encodeURIComponent(original)}`;
  return true;
}

/* ---------------- Histórico ---------------- */

const ORIGENS = { mercadolivre: 'Mercado Livre', cd: 'CD', sistema: 'Sistema' };
/* O cliente não vê quem da equipe fez (o backend já tira o nome): o CD e o
 * sistema aparecem como CyberDock. */
const ORIGENS_PARA_O_CLIENTE = { mercadolivre: 'Mercado Livre', cd: 'CyberDock', sistema: 'CyberDock' };

const ICONES_DO_EVENTO = {
  aberta: 'devolucao',
  situacao: 'caminhao',
  status_ml: 'caminhao',
  chegada: 'caixa',
  recebimento: 'recebido',
  analise_salva: 'salvar',
  analise_concluida: 'check',
  estoque: 'caixa',
  foto: 'camera',
};

const TEXTOS_PADRAO_DO_EVENTO = {
  aberta: 'Devolução aberta no Mercado Livre.',
  chegada: 'Chegada registrada no CD.',
  recebimento: 'Recebimento confirmado pela CyberDock.',
  analise_salva: 'Análise salva sem decisão.',
  analise_concluida: 'Análise concluída.',
  foto: 'Foto adicionada.',
};

export const iconeDoEvento = (evento) => ICONES_DO_EVENTO[evento?.kind] || 'relogio';

/** Texto de uma linha do histórico, sem termo técnico. */
export function textoDoEvento(evento) {
  if (!evento) return '';
  if (evento.kind === 'situacao') {
    return evento.from_value
      ? `Situação: ${rotuloDaSituacao(evento.from_value)} → ${rotuloDaSituacao(evento.to_value)}.`
      : `Situação: ${rotuloDaSituacao(evento.to_value)}.`;
  }
  if (evento.kind === 'status_ml') {
    return evento.from_value
      ? `No Mercado Livre: ${statusNoMl(evento.from_value)} → ${statusNoMl(evento.to_value)}.`
      : `No Mercado Livre: ${statusNoMl(evento.to_value)}.`;
  }
  return evento.note || TEXTOS_PADRAO_DO_EVENTO[evento.kind] || 'Atualização registrada.';
}

/** "Mercado Livre", ou quem fez no CD. Na visão do cliente, só "CyberDock". */
export function origemDoEvento(evento, visao = 'master') {
  if (visao === 'cliente') return ORIGENS_PARA_O_CLIENTE[evento?.source] || 'CyberDock';
  const origem = ORIGENS[evento?.source] || 'Sistema';
  return evento?.actor && evento.source !== 'mercadolivre' ? `${origem} · ${evento.actor}` : origem;
}

/* ---------------- Decisão ---------------- */

/** Por que unidades aptas não entraram no estoque (efeito da decisão). */
export const MOTIVOS_SEM_ENTRADA = Object.freeze({
  sem_cliente: 'a devolução não tem cliente identificado',
  sem_sku: 'o item não tem SKU identificado',
  venda_sem_baixa: 'a venda não tinha tirado estoque no CyberDock',
});

/** Apto, parcial ou não apto, pelo total de unidades. */
export function resultadoPrevisto(aptas, naoAptas) {
  if (naoAptas <= 0) return RESULTADOS.apto;
  if (aptas <= 0) return RESULTADOS.nao_apto;
  return RESULTADOS.parcial;
}

/**
 * Prévia do que a decisão faz no estoque, item a item. As regras são as do
 * backend (devolverAoEstoque): sem cliente, sem SKU ou sem baixa na venda, a
 * análise fica registrada sem entrada; SKU ausente, duplicado ou kit sem
 * componentes impede concluir.
 *
 * @param {object} detalhe  devolução de GET /returns/:id
 * @param {(item: object) => number} aptasDe
 * @returns {{ classe: string, texto: string, bloqueia?: boolean }[]}
 */
export function previaDoEstoque(detalhe, aptasDe) {
  const linhas = [];
  for (const item of detalhe?.items || []) {
    const aptas = aptasDe(item);
    if (aptas <= 0) continue;
    const nome = item.sku || item.title || 'Item';
    if (!detalhe.uid) {
      linhas.push({ classe: 'is-aviso', texto: `${nome}: devolução sem cliente identificado. A análise fica registrada, sem entrada no estoque.` });
      continue;
    }
    if (!item.sku) {
      linhas.push({ classe: 'is-aviso', texto: `${nome}: item sem SKU identificado. A análise fica registrada, sem entrada no estoque.` });
      continue;
    }
    if (!item.vendaBaixouEstoque) {
      linhas.push({ classe: 'is-aviso', texto: `${nome}: a venda não tirou estoque no CyberDock, então nada é somado.` });
      continue;
    }
    const estoque = item.estoque || {};
    if (!estoque.encontrado) {
      linhas.push({
        classe: 'is-erro',
        bloqueia: true,
        texto: estoque.duplicado
          ? `O SKU ${item.sku} aparece duplicado no armazenamento do cliente. Corrija antes de concluir.`
          : `O SKU ${item.sku} não está ativo no armazenamento do cliente. Cadastre ou reative antes de concluir.`,
      });
      continue;
    }
    if (estoque.kit) {
      const componentes = estoque.componentes || [];
      if (!componentes.length) {
        linhas.push({ classe: 'is-erro', bloqueia: true, texto: `O kit ${item.sku} não tem componentes cadastrados. Cadastre a composição antes de concluir.` });
        continue;
      }
      for (const componente of componentes) {
        const soma = Math.max(1, Math.round((Number(componente.porKit) || 1) * aptas));
        const antes = Number(componente.quantidade) || 0;
        linhas.push({ classe: 'is-ok', texto: `+${soma} em ${componente.sku} (de ${antes} para ${antes + soma}), peça do kit ${item.sku}` });
      }
      continue;
    }
    const antes = Number(estoque.quantidade) || 0;
    linhas.push({ classe: 'is-ok', texto: `+${aptas} em ${estoque.sku || item.sku} (de ${antes} para ${antes + aptas})` });
  }
  return linhas;
}

/* ---------------- Sincronização ---------------- */

const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

/**
 * O que aconteceu com as contas que não foram lidas, e o que fazer. `falha`
 * vem do backend (router/returns.js): tipo acesso, consulta, instavel ou outro.
 */
export function motivoDaFalhaDeSincronizacao(falha) {
  const detalhe = falha?.detalhe ? ` (${String(falha.detalhe).slice(0, 160)})` : '';
  switch (falha?.tipo) {
    case 'acesso':
      return 'o Mercado Livre recusou o acesso. Reconecte a conta em Contas.';
    case 'consulta':
      return `o Mercado Livre recusou a busca de devoluções${detalhe}. Não é problema na conexão das contas: precisa de ajuste no sistema.`;
    case 'instavel':
      return 'o Mercado Livre não respondeu a tempo. O sistema tenta de novo sozinho em até 30 minutos.';
    default:
      return 'aconteceu um erro inesperado. O detalhe ficou no registro do servidor.';
  }
}

/**
 * Avisos do fim da sincronização pedida pelo botão. Se nenhuma conta foi
 * lida, é erro: "concluída" com tudo falhando escondia o problema.
 * @returns {{ tipo: 'success'|'warning'|'error', texto: string, duracao?: number }[]}
 */
export function avisosDaSincronizacao(estado) {
  if (!estado) return [];
  if (estado.erro) return [{ tipo: 'error', texto: estado.erro }];
  const contas = Number(estado.contas) || 0;
  if (!contas) return [{ tipo: 'warning', texto: 'Nenhuma conta do Mercado Livre conectada e ativa para buscar devoluções.' }];

  const comFalha = Math.min(contas, Number(estado.contasComFalha) || 0);
  if (comFalha >= contas) {
    return [{ tipo: 'error', texto: `Não foi possível buscar as devoluções: ${motivoDaFalhaDeSincronizacao(estado.falha)}`, duracao: 12000 }];
  }

  const lidas = Number(estado.devolucoes) || 0;
  const novas = Number(estado.novas) || 0;
  const partes = [plural(lidas, 'devolução atualizada', 'devoluções atualizadas')];
  if (novas) partes.push(plural(novas, 'nova', 'novas'));
  const avisos = [{ tipo: 'success', texto: `Sincronização concluída: ${partes.join(', ')}.`, duracao: 5000 }];
  if (comFalha) {
    avisos.push({ tipo: 'warning', texto: `${comFalha} de ${contas} contas não foram lidas: ${motivoDaFalhaDeSincronizacao(estado.falha)}`, duracao: 10000 });
  }
  const reclamacoes = Number(estado.reclamacoesComFalha) || 0;
  if (reclamacoes) {
    avisos.push({
      tipo: 'warning',
      texto: `${plural(reclamacoes, 'reclamação não pôde ser lida', 'reclamações não puderam ser lidas')} agora. O sistema tenta de novo na próxima busca.`,
      duracao: 8000,
    });
  }
  return avisos;
}

/**
 * Linha fixa no topo quando a última busca (do botão ou automática) deixou
 * contas sem ler. Some quando uma busca lê todas.
 */
export function avisoDaUltimaBusca(sync) {
  if (!sync || sync.rodando || !sync.fim) return null;
  const contas = Number(sync.contas) || 0;
  const comFalha = Math.min(contas, Number(sync.contasComFalha) || 0);
  if (!contas || !comFalha) return null;
  const hora = formatarHora(sync.fim);
  const quando = hora ? `Última busca (${hora})` : 'Última busca';
  if (comFalha >= contas) {
    return { classe: 'is-erro', texto: `${quando} não leu nenhuma conta: ${motivoDaFalhaDeSincronizacao(sync.falha)}` };
  }
  const motivo = motivoDaFalhaDeSincronizacao(sync.falha);
  return { classe: 'is-aviso', texto: `${quando}: ${comFalha} de ${contas} contas não foram lidas. ${motivo.charAt(0).toUpperCase()}${motivo.slice(1)}` };
}

/* ---------------- Datas para arquivo ---------------- */

/** Data de hoje no horário de Brasília, AAAA-MM-DD (nome de arquivo). */
export const hojeEmBrasilia = (agora = new Date()) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(agora);

/** Data e hora para a planilha; vazio em vez de travessão. */
export const dataParaPlanilha = (valor) => {
  const texto = formatarDataHora(valor);
  return texto === '—' ? '' : texto;
};

/* ---------------- Planilha ---------------- */

/** Texto que começa com = + - @ vira fórmula no Excel: o apóstrofo neutraliza. */
export function celulaCsv(valor) {
  let texto = valor === null || valor === undefined ? '' : String(valor);
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

export function montarCsv(cabecalho, linhas) {
  return `\ufeff${[cabecalho, ...linhas].map((l) => l.map(celulaCsv).join(';')).join('\r\n')}`;
}

const quantidadeOuVazio = (valor) => (valor === null || valor === undefined ? '' : valor);

/* Colunas da planilha, na ordem. `soMaster`: fica fora da planilha do cliente
 * (dados do cadastro, quem da equipe fez e a observação interna). */
const COLUNAS_DA_PLANILHA = Object.freeze([
  { titulo: 'Pedido', valor: (d, item) => item?.orderId || d.order_id || '' },
  { titulo: 'Carrinho', valor: (d) => d.pack_id || '' },
  { titulo: 'Devolução', valor: (d) => d.ml_return_id || '' },
  { titulo: 'Reclamação', valor: (d) => d.claim_id || '' },
  { titulo: 'Cliente', soMaster: true, valor: (d) => d.client_name || '' },
  { titulo: 'E-mail do cliente', soMaster: true, valor: (d) => d.client_email || '' },
  { titulo: 'Conta do ML', valor: (d) => d.account_nickname || '' },
  { titulo: 'Mod. envio', valor: (d) => envioDa(d)?.rotulo ?? '' },
  { titulo: 'Comprador', valor: (d) => d.buyer_name || '' },
  { titulo: 'SKU', valor: (d, item) => item?.sku || '' },
  { titulo: 'Produto', valor: (d, item) => item?.title || '' },
  { titulo: 'Quantidade', valor: (d, item) => (item ? Number(item.quantity) || 0 : '') },
  { titulo: 'Aptas', valor: (d, item) => (item ? quantidadeOuVazio(item.qtyApt) : '') },
  { titulo: 'Não aptas', valor: (d, item) => (item ? quantidadeOuVazio(item.qtyNotApt) : '') },
  { titulo: 'Situação', valor: (d) => rotuloDaSituacao(d.stage) },
  { titulo: 'Status no ML', valor: (d) => (d.ml_status ? statusNoMl(d.ml_status) : '') },
  { titulo: 'Resultado', valor: (d) => resultadoDa(d)?.rotulo || '' },
  { titulo: 'Motivo (não apto)', valor: (d) => rotuloDe(MOTIVOS_NAO_APTO, d.not_apt_reason) || d.not_apt_reason || '' },
  { titulo: 'Destino (não apto)', valor: (d) => rotuloDe(DESTINOS_NAO_APTO, d.not_apt_destination) || d.not_apt_destination || '' },
  { titulo: 'Aberta em', valor: (d) => dataParaPlanilha(d.ml_created_at || d.created_at) },
  { titulo: 'Chegou ao CD em', valor: (d) => dataParaPlanilha(d.received_at) },
  { titulo: 'Recebimento confirmado em', valor: (d) => dataParaPlanilha(d.receipt_confirmed_at) },
  { titulo: 'Recebimento confirmado por', soMaster: true, valor: (d) => d.receipt_confirmed_by || '' },
  { titulo: 'Analisada em', valor: (d) => dataParaPlanilha(d.decided_at) },
  { titulo: 'Analisada por', soMaster: true, valor: (d) => d.decided_by || '' },
  { titulo: 'Rastreio', valor: (d) => d.tracking_number || '' },
  { titulo: 'Motivo do comprador', valor: (d) => d.claim_reason_text || '' },
  { titulo: 'Observação', soMaster: true, valor: (d) => d.notes || '' },
  { titulo: 'Fotos', valor: (d) => Number(d.photo_count) || 0 },
]);

/**
 * Planilha das devoluções da lista: uma linha por item devolvido, para dar
 * para somar por SKU e por cliente. Devolução sem item vira uma linha só.
 * Na visão do cliente saem as colunas `soMaster`.
 */
export function linhasDaPlanilha(devolucoes, { visao = 'master' } = {}) {
  const colunas = COLUNAS_DA_PLANILHA.filter((coluna) => visao !== 'cliente' || !coluna.soMaster);
  const linhas = [];
  for (const d of devolucoes || []) {
    const itens = Array.isArray(d.items) && d.items.length ? d.items : [null];
    for (const item of itens) linhas.push(colunas.map((coluna) => coluna.valor(d, item)));
  }
  return { cabecalho: colunas.map((coluna) => coluna.titulo), linhas };
}

/* ---------------- Fotos ---------------- */

/** Limite do backend (utils/mlReturns.js, MAX_FOTOS). */
export const MAX_FOTOS = 10;

const LADO_MAXIMO = 1600;
const QUALIDADE = 0.82;

/** Base64 (sem prefixo) para Blob: a foto recém-enviada aparece sem baixar de novo. */
export function base64ParaBlob(base64, tipo = 'image/jpeg') {
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i += 1) bytes[i] = binario.charCodeAt(i);
  return new Blob([bytes], { type: tipo });
}

/**
 * Reduz a foto no navegador antes de enviar: o celular gera 4–8 MB e a
 * inspeção precisa de algo legível, não do arquivo original.
 * Devolve o JPEG em base64 (sem o prefixo data:).
 */
export function reduzirFoto(arquivo) {
  return new Promise((resolver, rejeitar) => {
    if (!arquivo || !/^image\//.test(arquivo.type || '')) {
      rejeitar(new Error('Escolha uma imagem (JPG, PNG ou WEBP).'));
      return;
    }
    const url = URL.createObjectURL(arquivo);
    const imagem = new Image();
    imagem.onload = () => {
      try {
        const escala = Math.min(1, LADO_MAXIMO / Math.max(imagem.naturalWidth, imagem.naturalHeight));
        const largura = Math.max(1, Math.round(imagem.naturalWidth * escala));
        const altura = Math.max(1, Math.round(imagem.naturalHeight * escala));
        const tela = document.createElement('canvas');
        tela.width = largura;
        tela.height = altura;
        const contexto = tela.getContext('2d');
        contexto.fillStyle = '#ffffff';
        contexto.fillRect(0, 0, largura, altura);
        contexto.drawImage(imagem, 0, 0, largura, altura);
        const dataUrl = tela.toDataURL('image/jpeg', QUALIDADE);
        resolver(dataUrl.slice(dataUrl.indexOf(',') + 1));
      } catch (erro) {
        rejeitar(erro);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    imagem.onerror = () => {
      URL.revokeObjectURL(url);
      rejeitar(new Error('Não foi possível abrir esta imagem. Tente uma foto em JPG ou PNG.'));
    };
    imagem.src = url;
  });
}
