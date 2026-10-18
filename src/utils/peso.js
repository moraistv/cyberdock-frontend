// src/utils/peso.js
//
// Peso por unidade do SKU, em kg com até 3 casas decimais (ex.: 0,350).
// Opcional: vazio é "sem peso". Kit não tem peso próprio: o backend manda a
// soma do peso das peças em `peso_kg` e, se faltar peso em alguma peça, a
// lista delas em `pecas_sem_peso`. As regras de leitura são as mesmas do
// backend (router/storage.js, normalizarPesoKg); mudar uma exige mudar a outra.

export const PESO_MAXIMO_KG = 99999.999;

/* Acima disto vale conferir se a pessoa não digitou gramas no campo de kg. */
const PESO_PARA_CONFERIR_KG = 30;

const FORMATO = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

/**
 * Peso digitado → kg. Devolve null quando está vazio e NaN quando não serve
 * (texto, zero, negativo ou acima do limite). Com vírgula, ela é a casa
 * decimal e o ponto é milhar ("1.250,5"); sem vírgula, o ponto é decimal
 * ("0.35"). Grava com até 3 casas.
 */
export function lerPesoKg(valor) {
  if (valor === null || valor === undefined) return null;
  const texto = String(valor).trim();
  if (texto === '') return null;
  const normalizado = texto.includes(',') ? texto.replace(/\./g, '').replace(',', '.') : texto;
  if (!/^\d+(\.\d+)?$/.test(normalizado)) return NaN;
  const numero = Math.round(Number(normalizado) * 1000) / 1000;
  if (!Number.isFinite(numero) || numero <= 0 || numero > PESO_MAXIMO_KG) return NaN;
  return numero;
}

/** Mensagem de erro do campo, ou null quando o peso serve (inclusive vazio). */
export function erroDoPeso(valor) {
  return Number.isNaN(lerPesoKg(valor))
    ? 'Peso inválido. Use kg, maior que zero, com até 3 casas (ex.: 0,350), ou deixe em branco.'
    : null;
}

/** Texto de apoio embaixo do campo: como o peso vai ser salvo. */
export function dicaDoPeso(valor) {
  const peso = lerPesoKg(valor);
  if (peso === null) return 'Opcional. Em kg, com até 3 casas decimais. Ex.: 350 g = 0,350.';
  if (Number.isNaN(peso)) return '';
  const salvo = `Será salvo como ${FORMATO.format(peso)} kg.`;
  return peso > PESO_PARA_CONFERIR_KG
    ? `${salvo} Confira: o peso é em kg (350 g = 0,350).`
    : salvo;
}

/** Célula de tabela: 0.35 → "0,350"; sem peso → "—". */
export function formatarPeso(valor) {
  if (valor === null || valor === undefined || valor === '') return '—';
  const numero = Number(valor);
  return Number.isFinite(numero) ? FORMATO.format(numero) : '—';
}

/** Campo do formulário na edição: 0.35 → "0,350"; sem peso → "". */
export function pesoParaCampo(valor) {
  if (valor === null || valor === undefined || valor === '') return '';
  const numero = Number(valor);
  return Number.isFinite(numero) ? FORMATO.format(numero) : '';
}

/** Dica (title) da célula de peso: diz de onde vem o peso do kit e o que falta. */
export function tituloDoPeso(item) {
  if (!item) return null;
  if (item.is_kit) {
    const faltando = Array.isArray(item.pecas_sem_peso) ? item.pecas_sem_peso.filter(Boolean) : [];
    if (faltando.length) return `Falta o peso de: ${faltando.join(', ')}`;
    if (!Array.isArray(item.kit_components) || item.kit_components.length === 0) return 'Kit sem peças';
    return 'Soma do peso das peças do kit';
  }
  return item.peso_kg === null || item.peso_kg === undefined ? 'Peso não informado' : null;
}
