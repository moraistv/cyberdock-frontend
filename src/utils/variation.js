/**
 * Formatação da variação da venda para a operação de separação.
 *
 * O Mercado Livre devolve em `variation_attributes` TODOS os atributos da
 * variação, inclusive descritivos que não ajudam a separar o item na prateleira
 * (ex.: "Desenho do tecido: Olymp", "Modelo", "Material"). Aqui mantemos apenas
 * os atributos relevantes para a separação e descartamos o resto.
 *
 * Se o anúncio não tiver nenhum atributo relevante, retorna string vazia
 * (a tela mostra "—" em vez de exibir informação irrelevante).
 */

// Atributos que interessam na separação, na ordem de exibição.
const ATRIBUTOS_RELEVANTES = ['cor', 'tamanho', 'voltagem', 'sabor', 'fragrancia'];

/** Normaliza o nome do atributo: minúsculo, sem acento e sem espaços extras. */
function normalizar(nome) {
  return String(nome || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Índice de prioridade do atributo. Retorna -1 quando não é relevante.
 * Usa correspondência por início do nome para cobrir variações como
 * "Cor principal", "Tamanho da roupa", "Fragrância principal".
 */
function prioridade(nome) {
  const n = normalizar(nome);
  if (!n) return -1;
  return ATRIBUTOS_RELEVANTES.findIndex((chave) => n === chave || n.startsWith(chave));
}

/**
 * Monta o texto da variação (ex.: "Cor: Preto · Tamanho: 42 BR").
 * Aceita array de atributos ou string JSON.
 */
export function formatVariation(attrs) {
  let lista = attrs;
  if (typeof lista === 'string') {
    try {
      lista = JSON.parse(lista);
    } catch {
      return '';
    }
  }
  if (!Array.isArray(lista) || lista.length === 0) return '';

  return lista
    .map((attr) => ({
      nome: attr?.name ? String(attr.name).trim() : '',
      valor: attr?.value_name ? String(attr.value_name).trim() : '',
      ordem: prioridade(attr?.name),
    }))
    .filter((attr) => attr.valor && attr.ordem >= 0)
    .sort((a, b) => a.ordem - b.ordem)
    .map((attr) => (attr.nome ? `${attr.nome}: ${attr.valor}` : attr.valor))
    .join(' · ');
}

export default formatVariation;
