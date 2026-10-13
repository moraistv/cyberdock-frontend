// src/utils/cobrancaUi.js
//
// Formatação e mensagens da central de cobranças, compartilhadas entre a lista
// (MasterCobrancasView) e o painel de cada cliente (CobrancaClientePainel).
// Datas civis são tratadas como texto AAAA-MM-DD: passar por `new Date()` no
// fuso do navegador fazia o dia escorregar.

import { codigoDoErro } from './loteDeCobranca';

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export const PERIODO_VALIDO = /^\d{4}-(0[1-9]|1[0-2])$/;

/** "2026-08" -> "Agosto de 2026". */
export function periodLabel(period) {
  const [ano, mes] = String(period || '').split('-').map(Number);
  if (!ano || !mes || mes < 1 || mes > 12) return period || '';
  const nome = MESES[mes - 1];
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} de ${ano}`;
}

/** "2026-08" -> "ago/2026", para listas compactas. */
export function periodLabelCurto(period) {
  const [ano, mes] = String(period || '').split('-').map(Number);
  if (!ano || !mes || mes < 1 || mes > 12) return period || '';
  return `${MESES[mes - 1].slice(0, 3)}/${ano}`;
}

/** Competência AAAA-MM deslocada `delta` meses. */
export function deslocarCompetencia(period, delta) {
  const [ano, mes] = period.split('-').map(Number);
  const data = new Date(Date.UTC(ano, mes - 1 + delta, 1));
  return `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, '0')}`;
}

/* Datas de Brasília, as mesmas que o backend usa para recusar vencimento no
 * passado. O fuso do navegador não entra na conta. */
function partesDeHojeNoBrasil() {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const valor = (tipo) => partes.find((p) => p.type === tipo)?.value;
  return { ano: valor('year'), mes: valor('month'), dia: valor('day') };
}
export const competenciaDeHoje = () => { const { ano, mes } = partesDeHojeNoBrasil(); return `${ano}-${mes}`; };
export const dataDeHoje = () => { const { ano, mes, dia } = partesDeHojeNoBrasil(); return `${ano}-${mes}-${dia}`; };

export const formatarMoeda = (valor) => (Number(valor) || 0)
  .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Soma de dinheiro sem acumular erro de float: tudo em centavos. */
export const paraCentavos = (valor) => Math.round((Number(valor) || 0) * 100);

/** "2026-09-10" (ou ISO com hora) -> "10/09/2026". */
export function formatarData(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '—';
}

/**
 * Coluna DATE vinda da API -> "AAAA-MM-DD".
 *
 * O node-postgres entrega DATE como meia-noite e o JSON a leva como
 * "2026-09-10T00:00:00.000Z"; ler em UTC devolve o mesmo dia civil gravado.
 */
export function isoDeData(valor) {
  if (!valor) return '';
  const texto = String(valor);
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;
  const data = new Date(texto);
  return Number.isNaN(data.getTime()) ? '' : data.toISOString().slice(0, 10);
}

export function somarDias(iso, dias) {
  const data = new Date(`${iso}T00:00:00Z`);
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}

/** Data civil real em AAAA-MM-DD (2026-02-31 não passa). */
export function dataValida(valor) {
  const texto = String(valor || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const data = new Date(`${texto}T00:00:00Z`);
  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === texto;
}

/** Texto para o master, a partir do `code` do backend quando a mensagem crua não diz o que fazer. */
export function mensagemDeErro(e, padrao = 'Não foi possível concluir a operação.') {
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
    case 'items_total_mismatch':
      // O texto cru do backend fala em "competência congelada"; aqui vai o que fazer.
      return `Os serviços da fatura somam ${formatarMoeda(e?.data?.itemsTotal)}, mas o total é ${formatarMoeda(e?.data?.invoiceTotal)}. `
        + 'Abra o cliente, reabra a fatura para recalcular e gere a cobrança de novo.';
    default:
      // Sem status HTTP: a requisição nem chegou ao servidor.
      if (e && !e.status && e.name === 'TypeError') return 'Sem resposta do servidor. Confira a conexão e tente de novo.';
      return e?.data?.error || e?.message || padrao;
  }
}
