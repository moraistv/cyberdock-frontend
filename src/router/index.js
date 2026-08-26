import { createRouter, createWebHistory } from 'vue-router';
import { homeRouteForRole } from '../utils/homeRoute';
const PaginaInicial = () => import('../views/PaginaInicial.vue');
const AuthComponent = () => import('../views/AuthComponent.vue');
const DashboardView = () => import('../views/DashboardView.vue');
const ContasView = () => import('../views/ContasView.vue');
const TabelaVendas = () => import('../views/TabelaVendas.vue');
const SeparacaoItensView = () => import('../views/SeparacaoItensView.vue');
const ArmazenamentoView = () => import('../views/ArmazenamentoView.vue');
const KitParentView = () => import('../views/KitParentView.vue');
const ResumoCobranca = () => import('../views/ResumoCobranca.vue');
const AdminView = () => import('../views/AdminView.vue');
const MasterDashboardView = () => import('../views/MasterDashboardView.vue');
const ManageUsersView = () => import('../views/ManageUsersView.vue');
const ShopeeCallbackView = () => import('../views/ShopeeCallbackView.vue');
// MasterResumoCobranca e ServiceHistory NÃO têm rota própria: são componentes
// embutidos na tela de usuários, que é quem monta Sidebar e Topbar. Como rota
// solta, abriam sem menu e sem caminho de volta — e o resumo de cobrança ainda
// recebia userId nulo, então não carregava nada.

const routes = [
  {
    path: '/',
    name: 'PaginaInicial',
    component: PaginaInicial,
  },
  {
    // noCache: o login precisa do ciclo de vida limpo a cada visita, para não
    // reexibir estado (erros, campos) de uma tentativa anterior.
    path: '/auth',
    name: 'Auth',
    component: AuthComponent,
    meta: { guest: true, noCache: true }
  },
  {
    path: '/dashboard',
    name: 'DashboardView',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  {
    // Primeira tela do master: métricas somadas de todos os clientes.
    path: '/admin/dashboard',
    name: 'MasterDashboardView',
    component: MasterDashboardView,
    meta: { requiresAuth: true, requiresMaster: true }
  },
  {
    // O tabelão continua em /admin para não invalidar link salvo nem histórico;
    // o que mudou é que ele deixou de ser a porta de entrada do master.
    path: '/admin',
    name: 'AdminView',
    component: AdminView,
    meta: { requiresAuth: true, requiresMaster: true }
  },
  {
    path: '/admin/users',
    name: 'ManageUsersView',
    component: ManageUsersView,
    meta: { requiresAuth: true, requiresMaster: true }
  },
  {
    // Cada aba de um cliente tem endereço próprio, então o link pode ser
    // compartilhado, o F5 mantém onde você estava e o botão voltar do navegador
    // funciona. Antes tudo isso vivia em estado interno de /admin/users e
    // qualquer recarga jogava o usuário de volta para a lista.
    // `tab` é validado no componente; valor inválido cai na lista.
    path: '/admin/users/:uid/:tab(vendas|armazenamento|cobranca|contas)',
    name: 'ManageUserDetail',
    component: ManageUsersView,
    meta: { requiresAuth: true, requiresMaster: true }
  },
  {
    // Resumo de cobrança é sempre de UM cliente. Sem cliente escolhido não há
    // fatura para mostrar, então o endereço leva à lista, onde a aba Cobrança
    // de cada cliente abre este mesmo painel já com o uid.
    path: '/admin/billing-summary',
    redirect: { name: 'ManageUsersView' },
  },
  {
    path: '/contas',
    name: 'ContasView',
    component: ContasView,
    meta: { requiresAuth: true }
  },
  {
    // Retorno da autorização da Shopee. A página é pública porque o JWT pode
    // vencer durante a ida ao provedor; o backend só conclui usando a tentativa
    // opaca, curta e de uso único criada no início do OAuth. Depois, /contas
    // exige login.
    path: '/shopee/callback',
    name: 'ShopeeCallback',
    component: ShopeeCallbackView,
    // noCache: processa o retorno do OAuth no onMounted, o que exige uma
    // montagem nova a cada visita.
    meta: { noCache: true }
  },
  {
    path: '/tabela-vendas',
    name: 'TabelaVendas',
    component: TabelaVendas,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/separacao-itens',
    name: 'SeparacaoItensView',
    component: SeparacaoItensView,
    meta: { requiresAuth: true, requiresMaster: true }
  },
  {
    path: '/armazenamento',
    name: 'ArmazenamentoView',
    component: ArmazenamentoView,
    meta: { requiresAuth: true }
  },
  {
    path: '/kits-pai',
    name: 'KitParentView',
    component: KitParentView,
    meta: { requiresAuth: true }
  },
  {
    path: '/resumo-cobranca',
    name: 'ResumoCobranca',
    component: ResumoCobranca,
    meta: { requiresAuth: true }
  },
  {
    // Histórico de serviços renderizado DENTRO da tela de usuários, para herdar
    // Sidebar e Topbar. Endereço próprio para F5 e link compartilhado.
    path: '/admin/history',
    name: 'ServiceHistory',
    component: ManageUsersView,
    meta: { requiresAuth: true, requiresMaster: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    // Idealmente, teria seu próprio componente, mas redirecionando para o dashboard
    component: DashboardView,
    meta: { requiresAuth: true }
  },
];

const router = createRouter({
  history: createWebHistory('/'),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresMaster = to.matched.some(record => record.meta.requiresMaster);
  const isGuestRoute = to.matched.some(record => record.meta.guest);
  const token = localStorage.getItem('authToken');

  function parseJwt(token) {
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  }

  const payload = parseJwt(token);
  const isAuthenticated = payload && payload.exp * 1000 > Date.now();
  const userRole = payload ? payload.role : null;

  // A raiz é apenas um portão: manda para a tela inicial do papel quando
  // logado, senão para o login. Resolver aqui evita renderizar a tela
  // intermediária.
  if (to.path === '/') {
    next(isAuthenticated ? homeRouteForRole(userRole) : '/auth');
  } else if (requiresAuth && !isAuthenticated) {
    /* Guarda o destino COMPLETO, com query string.
     *
     * O retorno do OAuth da Shopee carrega `code` e `shop_id` apenas na URL, e
     * o `code` é de uso único. Mandar só '/auth' descartava a autorização
     * inteira sem erro e sem rastro: a loja aparecia como autorizada na Shopee
     * e simplesmente não existia aqui. Guardando o destino, o login retoma o
     * callback e conclui a conexão. */
    next({ path: '/auth', query: { redirect: to.fullPath } });
  } else if (requiresMaster && userRole !== 'master') {
    next('/dashboard'); // Redireciona se não for master
  } else if (isGuestRoute && isAuthenticated) {
    next(homeRouteForRole(userRole));
  } else {
    next();
  }
});

export default router;
