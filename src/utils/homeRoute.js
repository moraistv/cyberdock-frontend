// src/utils/homeRoute.js
//
// Tela inicial de cada papel, num lugar só.
//
// O destino pós-login estava escrito à mão em cinco pontos: o guard do router,
// o App.vue, a PaginaInicial, o login do useAuth e o botão de modo admin. Com o
// master ganhando dashboard próprio, mudar quatro e esquecer o quinto deixaria
// um dos caminhos caindo na tela errada — e é o tipo de bug que só aparece no
// fluxo que ninguém testou.

/**
 * Rota inicial de um papel.
 *
 * O /dashboard é escopado no uid de quem está logado, então para o master ele
 * nasce vazio: a visão que interessa a ele é a soma de todos os clientes.
 */
export function homeRouteForRole(role) {
  return role === 'master' ? '/admin/dashboard' : '/dashboard';
}

/** Papel gravado no JWT, sem depender de estado reativo. */
export function roleFromToken(token) {
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]))?.role ?? null;
  } catch {
    return null;
  }
}

/** Rota inicial a partir do token guardado no navegador. */
export function homeRouteFromStorage() {
  let token = null;
  try {
    token = localStorage.getItem('authToken');
  } catch {
    /* storage indisponível (aba privada, permissão negada) */
  }
  return homeRouteForRole(roleFromToken(token));
}
