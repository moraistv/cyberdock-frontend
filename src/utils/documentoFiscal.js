/**
 * Máscara e validação de CPF, CNPJ, CEP e telefone — lado do navegador.
 *
 * GÊMEO DO BACKEND. A mesma conta existe em `utils/documentoFiscal.js` na raiz
 * do projeto, e o BACKEND CONTINUA SENDO A AUTORIDADE: nada aqui dispensa a
 * validação de lá, porque requisição não passa obrigatoriamente por esta tela.
 *
 * Duplicar é aceitável neste caso específico porque o algoritmo do dígito
 * verificador de CPF e CNPJ é norma pública e fixa — não é regra de negócio que
 * muda com o produto. O que esta cópia entrega é o que só existe no navegador:
 * recusar o caractere errado no momento em que é digitado, em vez de deixar o
 * usuário preencher o formulário inteiro para descobrir o erro no submit.
 */

/** Só os dígitos. Aceita entrada com ponto, barra, traço ou espaço. */
export function apenasDigitos(valor) {
  return String(valor ?? '').replace(/\D+/g, '');
}

/** Todos os dígitos iguais (111.111.111-11 e afins) nunca é documento válido. */
function todosIguais(digitos) {
  return /^(\d)\1+$/.test(digitos);
}

function digitoPorPesos(digitos, pesos) {
  const soma = pesos.reduce((total, peso, i) => total + Number(digitos[i]) * peso, 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function validarCpf(valor) {
  const d = apenasDigitos(valor);
  if (d.length !== 11 || todosIguais(d)) return false;
  if (digitoPorPesos(d, [10, 9, 8, 7, 6, 5, 4, 3, 2]) !== Number(d[9])) return false;
  return digitoPorPesos(d, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(d[10]);
}

export function validarCnpj(valor) {
  const d = apenasDigitos(valor);
  if (d.length !== 14 || todosIguais(d)) return false;
  if (digitoPorPesos(d, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) !== Number(d[12])) return false;
  return digitoPorPesos(d, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(d[13]);
}

/* --------------------------------------------------------------------------
 * Máscaras PROGRESSIVAS.
 *
 * Formatam o que já foi digitado sem exigir o campo completo — máscara que só
 * aparece no último caractere faz o usuário achar que o campo não funciona. E
 * cada uma corta no limite do documento: era possível digitar quinze dígitos no
 * CPF e doze no CEP, e o erro só aparecia ao salvar.
 * ----------------------------------------------------------------------- */

/** CPF até 11 dígitos, CNPJ de 12 a 14. Corta em 14. */
export function mascaraDocumento(valor) {
  const d = apenasDigitos(valor).slice(0, 14);

  if (d.length <= 11) {
    return d
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
  }
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5');
}

/** CEP com oito dígitos: 00000-000. */
export function mascaraCep(valor) {
  const d = apenasDigitos(valor).slice(0, 8);
  return d.replace(/^(\d{5})(\d)/, '$1-$2');
}

/**
 * Telefone com DDD. Fixo (10) e celular (11).
 *
 * O 55 do início é descartado: provedor de cobrança espera DDD + número, e
 * "5511..." com 13 dígitos é recusado como número inválido.
 */
export function mascaraTelefone(valor) {
  let d = apenasDigitos(valor);
  if (d.length > 11 && d.startsWith('55')) d = d.slice(2);
  d = d.slice(0, 11);

  if (d.length <= 10) {
    return d
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/^\((\d{2})\) (\d{4})(\d)/, '($1) $2-$3');
  }
  return d
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/^\((\d{2})\) (\d{5})(\d)/, '($1) $2-$3');
}

/** Duas letras maiúsculas. */
export function mascaraUf(valor) {
  return String(valor ?? '').replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2);
}

/* --------------------------------------------------------------------------
 * Mensagens de erro por campo.
 *
 * Devolvem string vazia quando está tudo bem, e null nunca — assim o template
 * testa só a verdade da string. Campo vazio NÃO é erro aqui: quem decide o que é
 * obrigatório é a regra da operação (o CPF é sempre; CEP só para boleto), e
 * mostrar "campo obrigatório" antes de a pessoa terminar de preencher é ruído.
 * ----------------------------------------------------------------------- */

export function erroDocumento(valor) {
  const d = apenasDigitos(valor);
  if (!d) return '';
  if (d.length < 11) return 'Faltam dígitos: CPF tem 11, CNPJ tem 14.';
  if (d.length === 11) return validarCpf(d) ? '' : 'CPF inválido: confira os dígitos.';
  if (d.length < 14) return 'Faltam dígitos para completar o CNPJ.';
  return validarCnpj(d) ? '' : 'CNPJ inválido: confira os dígitos.';
}

export function erroCep(valor) {
  const d = apenasDigitos(valor);
  if (!d) return '';
  if (d.length !== 8) return `CEP tem 8 dígitos; faltam ${8 - d.length}.`;
  if (todosIguais(d)) return 'CEP inválido.';
  return '';
}

export function erroTelefone(valor) {
  const d = apenasDigitos(valor);
  if (!d) return '';
  if (d.length < 10) return 'Informe DDD + número (10 ou 11 dígitos).';
  if (Number(d.slice(0, 2)) < 11) return 'DDD inválido.';
  return '';
}

/** Tipo do documento pelo tamanho, para rotular a tela. */
export function tipoDocumento(valor) {
  const d = apenasDigitos(valor);
  if (d.length === 11) return 'CPF';
  if (d.length === 14) return 'CNPJ';
  return null;
}
