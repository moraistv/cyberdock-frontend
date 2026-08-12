import { createRouter, createWebHistory } from 'vue-router';
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
const ManageUsersView = () => import('../views/ManageUsersView.vue');
const MasterResumoCobranca = () => import('../views/MasterResumoCobranca.vue');
const ServiceHistory = () => import('../views/ServiceHistory.vue');
const ShopeeCallbackView = () => import('../views/ShopeeCallbackView.vue');

const routes = [
  {
    path: '/',
    name: 'PaginaInicial',
    component: PaginaInicial,
  },
  {
    path: '/auth',
    name: 'Auth',
    component: AuthComponent,
    meta: { guest: true }
  },
  {
    path: '/dashboard',
    name: 'DashboardView',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  {
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
    path: '/admin/billing-summary',
    name: 'MasterResumoCobranca',
    component: MasterResumoCobranca,
    meta: { requiresAuth: true, requiresMaster: true }
  },
  {
    path: '/contas',
    name: 'ContasView',
    component: ContasView,
    meta: { requiresAuth: true }
  },
  {
    // Retorno da autorização da Shopee. Precisa estar sob o domínio do
    // frontend porque é o domínio declarado no console do parceiro Shopee.
    path: '/shopee/callback',
    name: 'ShopeeCallback',
    component: ShopeeCallbackView,
    meta: { requiresAuth: true }
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
    path: '/admin/history',
    name: 'ServiceHistory',
    component: ServiceHistory,
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

  // A raiz é apenas um portão: manda para o dashboard quando logado, senão
  // para o login. Resolver aqui evita renderizar a tela intermediária.
  if (to.path === '/') {
    next(isAuthenticated ? '/dashboard' : '/auth');
  } else if (requiresAuth && !isAuthenticated) {
    next('/auth');
  } else if (requiresMaster && userRole !== 'master') {
    next('/dashboard'); // Redireciona se não for master
  } else if (isGuestRoute && isAuthenticated) {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;
