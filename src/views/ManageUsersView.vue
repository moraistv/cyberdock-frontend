<template>
  <div class="users-wrapper">
    <SidebarComponent />
    <div class="main-content">
      <TopbarComponent />
      <div class="content-area">
        <!-- ================= CABEÇALHO ================= -->
        <header class="page-header">
          <div class="page-header__text">
            <span class="page-eyebrow">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              Área do administrador
            </span>
            <h1 class="title">Administrar Usuários</h1>
            <p class="subtitle">Gerencie permissões, status de acesso e serviços contratados dos usuários do sistema.</p>
          </div>
          <div class="header-actions">
            <button @click="setView('history')" class="btn btn-secondary btn-with-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v5h5"></path><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"></path><path d="M12 7v5l4 2"></path></svg>
              Histórico de Serviços
            </button>
          </div>
        </header>

        <!-- ================= FAIXA DE INDICADORES ================= -->
        <div v-if="currentView === 'users'" class="stats-strip">
          <div class="stat-tile">
            <span class="stat-tile__icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </span>
            <div class="stat-tile__body">
              <strong>{{ userStats.total }}</strong>
              <span>Usuários cadastrados</span>
            </div>
          </div>
          <div class="stat-tile is-success">
            <span class="stat-tile__icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </span>
            <div class="stat-tile__body">
              <strong>{{ userStats.active }}</strong>
              <span>Com acesso ativo</span>
            </div>
          </div>
          <div class="stat-tile is-muted">
            <span class="stat-tile__icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
            </span>
            <div class="stat-tile__body">
              <strong>{{ userStats.inactive }}</strong>
              <span>Acesso suspenso</span>
            </div>
          </div>
          <div class="stat-tile">
            <span class="stat-tile__icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>
            </span>
            <div class="stat-tile__body">
              <strong>{{ userStats.masters }}</strong>
              <span>Perfis master</span>
            </div>
          </div>
        </div>

        <div v-if="currentView !== 'users' && selectedUser" class="user-context-panel">
          <div class="user-context-header">
            <button @click="setView('users')" class="btn-back" title="Voltar para lista">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <span class="user-avatar user-avatar--lg">{{ getUserInitials(selectedUser) }}</span>
            <div class="user-context-info">
              <span class="user-context-name">{{ selectedUser.name || selectedUser.mlNickname || selectedUser.email }}</span>
              <span class="user-context-email" v-if="selectedUser.name || selectedUser.mlNickname">{{ selectedUser.email }}</span>
            </div>
          </div>
          <nav class="user-tabs">
            <button 
              :class="['user-tab', { active: currentView === 'sales' }]" 
              @click="switchUserView('sales')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              Vendas
            </button>
            <button 
              :class="['user-tab', { active: currentView === 'storage' }]" 
              @click="switchUserView('storage')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
              Armazenamento
            </button>
            <button 
              :class="['user-tab', { active: currentView === 'billing' }]" 
              @click="switchUserView('billing')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
              Cobrança
            </button>
            <button
              :class="['user-tab', { active: currentView === 'accounts' }]"
              @click="switchUserView('accounts')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
              Contas
            </button>
          </nav>
        </div>
        <div v-else-if="currentView !== 'users'" class="breadcrumbs">
          <button @click="setView('users')" class="breadcrumb-link">Todos os Usuários</button>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-active">{{ breadcrumbTitle }}</span>
        </div>

        <!-- Visão: Lista de Usuários e Cadastros Globais -->
        <div v-if="currentView === 'users'" class="users-view">
          <!-- PAINEL DE CADASTROS GLOBAIS -->
          <div class="global-settings-panel">
            <div class="panel-head">
              <h3 class="panel-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6 1.65 1.65 0 0 0 10 3.09V3a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.6.62 1.06 1.22 1.18l.29.06A2 2 0 0 1 21 14h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                Cadastros Globais
              </h3>
              <span class="panel-hint">Replicáveis para todos os clientes</span>
            </div>
            <div class="panel-buttons">
              <button @click="openServiceCatalogueModal" class="btn-global">
                <div class="btn-icon bg-blue"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg></div>
                <div class="btn-info">
                  <span class="btn-title">Catálogo de Serviços</span>
                  <span class="btn-desc">Planos e limites para clientes</span>
                </div>
                <svg class="btn-global__arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
              
              <button @click="openStatusManagerModal" class="btn-global">
                <div class="btn-icon bg-blue-soft"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></div>
                <div class="btn-info">
                  <span class="btn-title">Status de Vendas</span>
                  <span class="btn-desc">Etiquetas globais para pedidos</span>
                </div>
                <svg class="btn-global__arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>

              <button @click="openPackageTypesModal" class="btn-global">
                <div class="btn-icon bg-blue-soft"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg></div>
                <div class="btn-info">
                  <span class="btn-title">Tipos de Pacote</span>
                  <span class="btn-desc">Custo de expedição e embalagens</span>
                </div>
                <svg class="btn-global__arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
          </div>

          <!-- ================= BARRA DE FERRAMENTAS ================= -->
          <div class="table-controls">
            <div class="search-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" v-model="userSearchQuery" placeholder="Buscar por nome, apelido ou e-mail..." class="search-input" />
              <button v-if="userSearchQuery" class="search-clear" title="Limpar busca" @click="userSearchQuery = ''">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div class="status-filter-wrapper">
              <span class="filter-label">Status</span>
              <div class="chip-row">
                <button
                  type="button"
                  class="chip"
                  :class="{ 'is-active': userStatusFilter === 'all' }"
                  @click="userStatusFilter = 'all'"
                >
                  Todos
                  <span class="chip__count">{{ userStats.total }}</span>
                </button>
                <button
                  type="button"
                  class="chip"
                  :class="{ 'is-active': userStatusFilter === 'active' }"
                  @click="userStatusFilter = 'active'"
                >
                  Ativos
                  <span class="chip__count">{{ userStats.active }}</span>
                </button>
                <button
                  type="button"
                  class="chip"
                  :class="{ 'is-active': userStatusFilter === 'inactive' }"
                  @click="userStatusFilter = 'inactive'"
                >
                  Inativos
                  <span class="chip__count">{{ userStats.inactive }}</span>
                </button>
              </div>
            </div>

            <span class="results-count">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
              {{ filteredUsers.length }} {{ filteredUsers.length === 1 ? 'resultado' : 'resultados' }}
            </span>
          </div>

          <p v-if="passwordSuccess" class="password-success" role="status">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            {{ passwordSuccess }}
          </p>

          <div class="table-container" ref="tableContainer">
            <div class="table-wrapper">
               <template v-if="isLoadingUsers">
                <table class="users-table">
                  <thead>
                    <tr>
                      <th class="col-user">Usuário</th>
                      <th>Status</th>
                      <th>Permissão</th>
                      <th>Serviços Contratados</th>
                      <th>Data de Criação</th>
                      <th class="col-actions">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="n in 8" :key="'sk-'+n" class="is-skeleton">
                      <td>
                        <div class="user-cell">
                          <div class="sk sk-avatar"></div>
                          <div class="sk-lines">
                            <div class="sk sk-text" style="width: 130px"></div>
                            <div class="sk sk-text sk-text--sm" style="width: 180px"></div>
                          </div>
                        </div>
                      </td>
                      <td><div class="sk sk-pill" style="width: 68px"></div></td>
                      <td><div class="sk sk-btn" style="width: 118px"></div></td>
                      <td><div class="sk sk-btn" style="width: 104px"></div></td>
                      <td><div class="sk sk-text" style="width: 76px"></div></td>
                      <td><div class="sk sk-btn" style="width: 84px"></div></td>
                    </tr>
                  </tbody>
                </table>
              </template>

              <div v-else-if="usersError" class="feedback-state error-state">
                <span class="feedback-icon is-error">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                </span>
                <h3>Não foi possível carregar os usuários</h3>
                <p>{{ usersError }}</p>
              </div>
              <div v-else-if="filteredUsers.length === 0" class="feedback-state empty-state">
                <span class="feedback-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </span>
                <h3>Nenhum usuário encontrado</h3>
                <p>Ajuste a busca ou troque o filtro de status para ver mais resultados.</p>
                <button
                  v-if="userSearchQuery || userStatusFilter !== 'all'"
                  class="btn btn-secondary btn-sm"
                  @click="userSearchQuery = ''; userStatusFilter = 'all'"
                >
                  Limpar filtros
                </button>
              </div>
              
              <div v-else>
                <table class="users-table" aria-live="polite">
                  <thead>
                    <tr>
                      <th class="col-user">Usuário</th>
                      <th>Status</th>
                      <th>Permissão</th>
                      <th>Serviços Contratados</th>
                      <th>Data de Criação</th>
                      <th class="col-actions">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="user in paginatedUsers"
                      :key="user.uid"
                      class="row-anim"
                      :class="{ 'row-inactive': !user.active }"
                    >
                      <td data-label="Usuário">
                        <div class="user-cell">
                          <span class="user-avatar" :class="{ 'user-avatar--master': user.role === 'master' }">
                            {{ getUserInitials(user) }}
                          </span>
                          <div class="user-cell__info">
                            <span class="user-cell__name">{{ user.name || user.mlNickname || user.email }}</span>
                            <span class="user-cell__email">{{ user.mlNickname && user.name ? user.mlNickname + ' · ' + user.email : user.email }}</span>
                          </div>
                        </div>
                      </td>
                      <td data-label="Status">
                        <span :class="['status-pill', user.active ? 'pill-active' : 'pill-inactive']">
                          <span class="status-dot"></span>
                          {{ user.active ? 'Ativo' : 'Inativo' }}
                        </span>
                      </td>
                      <td data-label="Permissão">
                        <div class="role-control" :class="user.role === 'master' ? 'role-control--master' : 'role-control--client'">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                          <select
                            class="role-select"
                            :value="user.role"
                            @change="handleRoleChange(user, $event.target.value)"
                          >
                            <option value="cliente">Cliente</option>
                            <option value="master">Master</option>
                          </select>
                          <svg class="role-control__chevron" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </div>
                      </td>
                      <td data-label="Serviços Contratados">
                        <button @click="openContractModal(user)" class="btn btn-ghost-blue btn-sm btn-with-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                          Gerenciar
                        </button>
                      </td>
                      <td data-label="Data de Criação" class="cell-date">{{ formatDate(user.createdAt) }}</td>
                      <td data-label="Ações" class="actions-cell">
                        <button
                          class="actions-button"
                          @click.stop="toggleActionsMenu(user, $event)"
                          @keydown.enter.stop="toggleActionsMenu(user, $event)"
                          aria-haspopup="menu"
                          :aria-expanded="!!activeMenu.user && activeMenu.user.uid === user.uid"
                        >
                          Ações
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="table-footer" v-if="!isLoadingUsers && !usersError && filteredUsers.length > 0">
              <span class="table-footer__info">
                Exibindo <strong>{{ resultRange.start }}</strong>–<strong>{{ resultRange.end }}</strong>
                de <strong>{{ filteredUsers.length }}</strong> usuários
              </span>
              <div class="pagination-controls" v-if="totalPages > 1">
                <button @click="prevPage" :disabled="currentPage === 1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                  Anterior
                </button>
                <span class="page-indicator">Página {{ currentPage }} de {{ totalPages }}</span>
                <button @click="nextPage" :disabled="currentPage === totalPages">
                  Próximo
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Outras Visões (Renderização Condicional) -->
        <UserSalesTable v-if="currentView === 'sales' && selectedUser" :user-id="selectedUser.uid" />
        <UserStorageView v-if="currentView === 'storage' && selectedUser" :user-id="selectedUser.uid" />
        <MasterResumoCobranca v-if="currentView === 'billing' && selectedUser" :user-id="selectedUser.uid" />
        <UserAccountsPanel v-if="currentView === 'accounts' && selectedUser" :user-id="selectedUser.uid" />
        <ServiceHistory v-if="currentView === 'history'" />


        <!-- Dropdown de Ações -->
        <div
          v-if="activeMenu.user"
          class="actions-dropdown-floating"
          :style="activeMenu.style"
          ref="actionsDropdown"
        >
          <span class="dropdown-heading">{{ activeMenu.user.name || activeMenu.user.mlNickname || activeMenu.user.email }}</span>
          <a @click="openPasswordModal(activeMenu.user)">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            Alterar Senha
          </a>
          <a @click="openEditNameModal(activeMenu.user)">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            Editar Nome
          </a>
          <a @click="editUserSales(activeMenu.user)">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            Editar Vendas
          </a>
          <a @click="editUserStorage(activeMenu.user)">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
            Editar Armazenamento
          </a>
          <a @click="editUserBilling(activeMenu.user)">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
            Gerenciar Cobrança
          </a>
          <a @click="editUserAccounts(activeMenu.user)">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            Contas Conectadas
          </a>
          <div class="dropdown-divider"></div>
          <a v-if="activeMenu.user.active" @click="handleToggleActive(activeMenu.user)" class="action-suspend">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
            Suspender Acesso
          </a>
          <a v-else @click="handleToggleActive(activeMenu.user)" class="action-activate">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            Ativar Acesso
          </a>
          <a @click="openDeleteUserModal(activeMenu.user)" class="action-delete">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            Excluir Usuário
          </a>
        </div>

        <!-- Modais (lógica preservada) -->
        <UniversalModal title="Gerenciar Status de Venda (Global)" :is-open="isStatusManagerOpen" @close="closeStatusManagerModal">
          <div class="status-manager">
            <div class="status-creator">
              <input type="text" v-model="newStatusName" @keyup.enter="handleAddNewStatus" placeholder="Nome do novo status" class="status-input" />
              <button @click="handleAddNewStatus" class="btn btn-primary">Adicionar</button>
            </div>
            <p v-if="statusError" class="error-text">{{ statusError }}</p>
            <h4 class="modal-subtitle">Status Atuais</h4>
            <ul class="status-list">
              <li v-for="status in allUserStatuses" :key="status.value" class="status-item">
                <div v-if="editingStatus?.value !== status.value" class="status-display-mode">
                  <span>{{ status.label }}</span>
                  <div class="status-actions">
                    <button @click="startEditing(status)" class="btn-action edit" title="Editar"><svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                    <button @click="handleDeleteStatus(status)" class="btn-action delete" title="Excluir"><svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                  </div>
                </div>
                <div v-else class="status-edit-mode">
                  <input type="text" v-model="editedStatusName" @keyup.enter="handleUpdateStatus(status)" @keyup.esc="cancelEditing" class="status-input-edit" />
                  <div class="status-actions">
                     <button @click="handleUpdateStatus(status)" class="btn-action save" title="Salvar"><svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg></button>
                     <button @click="cancelEditing" class="btn-action cancel" title="Cancelar"><svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </UniversalModal>

        <UniversalModal title="Gerenciar Tipos de Pacote (Global)" :is-open="isPackageTypesModalOpen" @close="closePackageTypesModal">
            <div class="plan-manager-content">
                <form v-if="editingPackageType" @submit.prevent="handleSavePackageType" class="service-form" style="margin-bottom: 1.5rem;">
                  <h4 class="modal-subtitle" style="margin-top: 0;">{{ packageTypeForm.id ? 'Editar Pacote' : 'Novo Pacote' }}</h4>
                  <div class="form-group"><label>Nome do Pacote</label><input type="text" v-model="packageTypeForm.name" required /></div>
                  <div class="form-group"><label>Preço por Unidade (R$)</label><input type="number" v-model.number="packageTypeForm.price" min="0" step="0.01" required /></div>
                  <div class="modal-actions">
                    <button @click="cancelEditPackageType" type="button" class="btn btn-secondary">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Salvar Pacote</button>
                  </div>
                </form>
                <button v-else @click="startNewPackageType" class="btn btn-primary btn-full-width">Adicionar Novo Tipo de Pacote</button>
                
                <h4 class="modal-subtitle">Tipos Existentes</h4>
                <div class="table-wrapper-modal">
                <table class="services-table-modal">
                    <thead><tr><th>Embalagem</th><th>Preço</th><th>Ações</th></tr></thead>
                    <tbody>
                    <tr v-if="isLoadingPackageTypes"><td colspan="3" class="feedback-cell">Carregando...</td></tr>
                    <tr v-else-if="allPackageTypes.length === 0"><td colspan="3" class="feedback-cell">Nenhum pacote cadastrado.</td></tr>
                    <tr v-for="pkg in allPackageTypes" :key="pkg.id">
                        <td><div class="service-name">{{ pkg.name }}</div></td>
                        <td>{{ formatCurrency(pkg.price) }}</td>
                        <td>
                        <button @click="editExistingPackageType(pkg)" class="btn-action edit" title="Editar"><svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                        <button @click="handleDeletePackageType(pkg.id)" class="btn-action delete" title="Excluir"><svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                        </td>
                    </tr>
                    </tbody>
                </table>
                </div>
            </div>
        </UniversalModal>

        <UniversalModal title="Gerenciar Catálogo de Serviços" :is-open="isServiceCatalogueOpen" @close="closeServiceCatalogueModal">
            <!-- Cards no lugar da tabela: dentro do modal a tabela já estourava
                 a largura e criava scroll horizontal, e com a coluna de cobrança
                 ficaria pior. Cada serviço mostra ícone do tipo, unidade e as
                 faixas de preço sem cortar nada. -->
            <div class="plan-manager-content">
                <button @click="openServiceModal()" class="btn btn-primary btn-full-width btn-with-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="17" height="17"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Adicionar Novo Serviço
                </button>

                <div class="catalogue-head">
                    <h4 class="modal-subtitle">Serviços Existentes</h4>
                    <span v-if="!isLoadingServices" class="catalogue-count">{{ availableServices.length }}</span>
                </div>

                <p v-if="untypedServicesCount" class="catalogue-alert">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    <span><strong>{{ untypedServicesCount }} serviço(s) sem tipo de cobrança.</strong> Eles não entram em nenhuma fatura. Edite e defina o tipo.</span>
                </p>

                <div v-if="isLoadingServices" class="catalogue-feedback">Carregando...</div>
                <div v-else-if="availableServices.length === 0" class="catalogue-feedback">Nenhum serviço cadastrado.</div>

                <ul v-else class="catalogue-list">
                    <li v-for="service in availableServices" :key="service.id" class="catalogue-item" :class="{ 'is-untyped': !service.type }">
                        <span class="catalogue-item__icon" :class="`icon--${service.type || 'none'}`" v-html="serviceTypeIcon(service.type)"></span>

                        <div class="catalogue-item__body">
                            <div class="catalogue-item__title">
                                {{ service.name }}
                                <span class="type-badge" :class="service.type ? 'is-set' : 'is-missing'">{{ serviceTypeLabel(service.type) }}</span>
                            </div>
                            <p v-if="service.description" class="catalogue-item__desc">{{ service.description }}</p>

                            <!-- Faixas por quantidade: o sistema escolhe sozinho na hora do lançamento -->
                            <div v-if="service.type === 'avulso_quantidade' && service.config?.tiers?.length" class="catalogue-tiers">
                                <span v-for="(tier, ti) in service.config.tiers" :key="ti" class="tier-chip">
                                    {{ tierRangeLabel(tier) }} · <strong>{{ formatCurrency(tier.price) }}</strong>
                                </span>
                            </div>
                            <div v-else class="catalogue-item__price">
                                {{ formatCurrency(service.price) }}
                                <small v-if="service.unit">por {{ unitLabel(service.unit) }}</small>
                            </div>

                            <!-- Foi assim que um armazenamento de R$ 397 ficou meses sem ser cobrado -->
                            <div v-if="!service.type" class="service-warning">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" width="13" height="13"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                Não é faturado
                            </div>
                        </div>

                        <div class="catalogue-item__actions">
                            <button @click="openServiceModal(service)" class="btn-action edit" title="Editar"><svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="17" height="17" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                            <button @click="openDeleteServiceModal(service)" class="btn-action delete" title="Excluir"><svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="17" height="17" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                        </div>
                    </li>
                </ul>
            </div>
        </UniversalModal>
        <UniversalModal :title="isEditingService ? 'Editar Serviço' : 'Adicionar Novo Serviço'" :is-open="isServiceModalOpen" @close="closeServiceModal">
          <form v-if="currentService" @submit.prevent="handleSaveService" class="service-form">
            <div class="form-group"><label>Nome do Serviço</label><input type="text" v-model="currentService.name" required /></div>

            <div class="form-group">
              <label>Tipo de cobrança</label>
              <select v-model="currentService.type" required>
                <option disabled value="">Selecione como este serviço é cobrado</option>
                <option v-for="opt in serviceTypeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
              <small class="field-hint">{{ selectedTypeHint }}</small>
            </div>

            <div class="form-group">
              <label>Unidade de medida</label>
              <select v-model="currentService.unit">
                <option v-for="opt in unitOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>

            <div class="form-group"><label>Descrição</label><input type="text" v-model="currentService.description" placeholder="Aparece no catálogo" /></div>

            <!-- Preço único: para tudo que não é cobrado por faixa de quantidade -->
            <div class="form-group" v-if="currentService.type !== 'avulso_quantidade'">
              <label>Preço (R$)</label>
              <input type="number" v-model.number="currentService.price" min="0" step="0.01" required />
            </div>

            <!-- Faixas por quantidade: o sistema escolhe a faixa sozinho na hora
                 do lançamento, conforme a quantidade informada -->
            <div class="tiers-block" v-else>
              <div class="tiers-head">
                <label>Faixas de preço por quantidade</label>
                <button type="button" class="btn-tier-add" @click="addTier">+ Adicionar faixa</button>
              </div>
              <p class="field-hint">A faixa é escolhida automaticamente pela quantidade lançada. Deixe o campo "até" da última faixa vazio para cobrir qualquer quantidade acima.</p>
              <div v-for="(tier, index) in currentService.config.tiers" :key="index" class="tier-row">
                <div class="tier-field"><span>De</span><input type="number" v-model.number="tier.from" min="1" step="1" /></div>
                <div class="tier-field"><span>até</span><input type="number" v-model.number="tier.to" min="1" step="1" placeholder="∞" /></div>
                <div class="tier-field tier-price"><span>R$</span><input type="number" v-model.number="tier.price" min="0" step="0.01" /></div>
                <button type="button" class="btn-tier-remove" @click="removeTier(index)" :disabled="currentService.config.tiers.length <= 1" title="Remover faixa">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            </div>

            <p v-if="serviceFormError" class="form-error">{{ serviceFormError }}</p>
          </form>
          <div class="modal-actions"><button @click="closeServiceModal" type="button" class="btn btn-secondary">Cancelar</button><button @click="handleSaveService" type="button" class="btn btn-primary">Salvar</button></div>
        </UniversalModal>
        <UniversalModal title="Confirmar Exclusão" :is-open="isDeleteServiceModalOpen" @close="closeDeleteServiceModal">
          <div v-if="serviceToDelete"><p>Tem certeza que deseja excluir o serviço <strong>"{{ serviceToDelete.name }}"</strong>?</p></div>
          <div class="modal-actions"><button @click="closeDeleteServiceModal" class="btn btn-secondary">Cancelar</button><button @click="handleConfirmDeleteService" class="btn btn-danger">Excluir</button></div>
        </UniversalModal>
        <UniversalModal title="Confirmar Exclusão de Usuário" :is-open="isDeleteUserModalOpen" @close="closeDeleteUserModal">
            <div v-if="userToDelete">
                <p>Tem certeza que deseja excluir o usuário <strong>{{ userToDelete.mlNickname || userToDelete.email }}</strong>?</p>
                <p class="warning-text"><strong>Atenção:</strong> Esta ação é irreversível e irá apagar permanentemente todos os dados associados a este usuário, incluindo vendas, contas, SKUs e históricos.</p>
            </div>
            <div class="modal-actions"><button @click="closeDeleteUserModal" class="btn btn-secondary">Cancelar</button><button @click="confirmDeleteUser" class="btn btn-danger">Sim, Excluir</button></div>
        </UniversalModal>
        <UniversalModal title="Alterar Senha do Usuário" :is-open="isPasswordModalOpen" @close="closePasswordModal">
          <div v-if="passwordTarget">
            <p style="margin-bottom: 0.75rem; color: #6b7280;">
              Usuário: <strong>{{ passwordTarget.name || passwordTarget.mlNickname || passwordTarget.email }}</strong>
            </p>
            <div class="form-group">
              <label>Nova senha</label>
              <input type="password" v-model="passwordValue" autocomplete="new-password"
                     placeholder="Mínimo de 8 caracteres" @keyup.enter="handleSavePassword" />
            </div>
            <div class="form-group">
              <label>Confirmar nova senha</label>
              <input type="password" v-model="passwordConfirm" autocomplete="new-password"
                     placeholder="Repita a nova senha" @keyup.enter="handleSavePassword" />
            </div>
            <p class="password-hint">
              O acesso do cliente passa a usar esta senha imediatamente. Informe a ele por um canal seguro.
            </p>
            <p v-if="passwordError" class="password-error">{{ passwordError }}</p>
          </div>
          <div class="modal-actions">
            <button @click="closePasswordModal" class="btn btn-secondary">Cancelar</button>
            <button @click="handleSavePassword" class="btn btn-primary" :disabled="isSavingPassword">
              {{ isSavingPassword ? 'Salvando...' : 'Salvar senha' }}
            </button>
          </div>
        </UniversalModal>
        <UniversalModal title="Editar Nome do Usuário" :is-open="isEditNameModalOpen" @close="closeEditNameModal">
          <div v-if="editNameUser">
            <p style="margin-bottom: 0.75rem; color: #6b7280;">Usuário: <strong>{{ editNameUser.mlNickname || editNameUser.email }}</strong></p>
            <div class="form-group">
              <label>Novo Nome</label>
              <input type="text" v-model="editNameValue" @keyup.enter="handleSaveName" placeholder="Digite o nome do usuário" />
            </div>
          </div>
          <div class="modal-actions">
            <button @click="closeEditNameModal" class="btn btn-secondary">Cancelar</button>
            <button @click="handleSaveName" class="btn btn-primary" :disabled="isSavingName">{{ isSavingName ? 'Salvando...' : 'Salvar' }}</button>
          </div>
        </UniversalModal>
        <!-- size="lg" (720px): a tabela antiga tinha `min-width: 600px` dentro
             de um modal de 560px, então a barra de rolagem horizontal era
             garantida em qualquer tela. A lista abaixo não tem largura mínima,
             então o scroll deixa de existir por construção e não por sorte. -->
        <UniversalModal
          :title="`Gerenciar Serviços de ${currentUser?.mlNickname || currentUser?.email}`"
          :is-open="isContractModalOpen"
          size="lg"
          @close="closeContractModal"
        >
          <div class="contract-modal-content">
            <div class="contract-section-head">
              <h4 class="modal-subtitle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>
                Serviços contratados
              </h4>
              <span v-if="!isLoadingClientServices" class="catalogue-count">{{ clientServices.length }}</span>
            </div>

            <p v-if="isLoadingClientServices" class="contract-feedback">Carregando...</p>

            <p v-else-if="clientServices.length === 0" class="contract-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><path d="M20.91 8.84 8.56 2.23a1.93 1.93 0 0 0-1.81 0L3.1 4.13a2.02 2.02 0 0 0-.1 3.5l12.35 6.61a1.93 1.93 0 0 0 1.81 0l3.65-1.9a2.02 2.02 0 0 0 .1-3.5Z"/><path d="m3.09 8.84 12.35-6.61"/><line x1="12" y1="22" x2="12" y2="13"/></svg>
              <span>Nenhum serviço contratado. Use o formulário abaixo para começar.</span>
            </p>

            <ul v-else class="contract-list">
              <li v-for="service in clientServices" :key="service.id" class="contract-item">
                <!-- Ícone por tipo de cobrança, o mesmo do catálogo. -->
                <span
                  class="contract-item__icon"
                  :class="`icon--${contractType(service) || 'none'}`"
                  v-html="serviceTypeIcon(contractType(service))"
                ></span>

                <div class="contract-item__body">
                  <div class="contract-item__title">
                    {{ service.name }}
                    <!-- O tipo aparece aqui porque é ele que decide se o serviço
                         entra na fatura. Serviço criado pela tela do catálogo
                         nasce sem tipo, e sem tipo o cliente NÃO é cobrado: foi
                         assim que um armazenamento de R$ 397 passou meses sem
                         cobrança, e nada na tela denunciava. -->
                    <span class="type-badge" :class="contractType(service) ? 'is-set' : 'is-missing'">
                      {{ serviceTypeLabel(contractType(service)) }}
                    </span>
                  </div>

                  <div class="contract-item__meta">
                    <span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      Desde {{ formatDate(service.startDate, true) }}
                    </span>
                    <span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3"/><path d="M12 12l8-4.5"/><path d="M12 12v9"/><path d="M12 12 4 7.5"/></svg>
                      {{ service.volume || 1 }} {{ contractUnitLabel(service) }}
                    </span>
                    <span v-if="service.price != null" class="contract-item__price">
                      {{ formatCurrency(service.price) }}
                    </span>
                  </div>

                  <p v-if="!contractType(service)" class="contract-item__warning">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" width="13" height="13"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    Sem tipo de cobrança: não entra na fatura.
                  </p>
                </div>

                <button
                  @click="handleRemoveClientService(service.id)"
                  class="btn-action delete contract-item__remove"
                  title="Remover este serviço do cliente"
                >
                  <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </li>
            </ul>

            <h4 class="modal-subtitle contract-add-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Adicionar novo serviço
            </h4>
            <form @submit.prevent="handleAddClientService" class="add-service-form">
              <div class="add-service-form__grid">
                <div class="form-group form-group--wide">
                  <label>Serviço</label>
                  <select v-model="newContract.serviceId" required>
                    <option disabled value="">Selecione</option>
                    <option v-for="s in availableServices" :key="s.id" :value="s.id">{{ s.name }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Volume / Qtd</label>
                  <input type="number" v-model.number="newContract.volume" min="1" required />
                </div>
                <div class="form-group">
                  <label>Data de início</label>
                  <input type="date" v-model="newContract.startDate" required />
                </div>
              </div>

              <!-- A data de início não é detalhe de cadastro: é ela que define o
                   proporcional do mês de entrada e o que a fatura de uma
                   competência passada continua cobrando. -->
              <p class="add-service-form__hint">
                A data de início define o proporcional do primeiro mês e mantém as competências passadas corretas.
              </p>

              <div class="add-service-form__actions">
                <button type="button" class="btn btn-secondary" @click="closeContractModal">Fechar</button>
                <button type="submit" class="btn btn-primary btn-with-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Adicionar serviço
                </button>
              </div>
            </form>
          </div>
        </UniversalModal>
        <UniversalModal :title="syncResults.title || 'Resultados da Sincronização'" :is-open="isSyncResultsModalOpen" @close="closeSyncResultsModal">
          <div class="sync-results-content">
            <div v-if="syncResults.message" class="sync-message" :class="syncResults.type"><p>{{ syncResults.message }}</p></div>
            <div v-if="syncResults.summary" class="sync-summary">
              <h4 class="modal-subtitle">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                Resumo Geral
              </h4>
              <div class="summary-stats">
                <div class="stat-item"><span class="stat-label">Total de usuários processados</span><span class="stat-value">{{ syncResults.summary.totalUsers }}</span></div>
                <div class="stat-item"><span class="stat-label">Usuários sem contas ML</span><span class="stat-value">{{ syncResults.summary.usersWithoutAccounts }}</span></div>
                <div class="stat-item"><span class="stat-label">Total de contas encontradas</span><span class="stat-value">{{ syncResults.summary.totalAccountsFound }}</span></div>
                <div class="stat-item success"><span class="stat-label">Sincronizadas com sucesso</span><span class="stat-value">{{ syncResults.summary.successCount }}</span></div>
                <div class="stat-item error" v-if="syncResults.summary.errorCount > 0"><span class="stat-label">Falharam</span><span class="stat-value">{{ syncResults.summary.errorCount }}</span></div>
              </div>
              <div v-if="syncResults.details && syncResults.details.length > 0" class="user-details">
                <h4 class="modal-subtitle">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  Detalhes por Usuário
                </h4>
                <div class="details-list">
                  <div v-for="detail in syncResults.details" :key="detail" class="detail-item">{{ detail }}</div>
                  <div v-if="syncResults.hasMoreUsers" class="detail-item more-users">... e mais {{ syncResults.remainingCount }} usuários</div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-actions"><button @click="closeSyncResultsModal" class="btn btn-primary">Fechar</button></div>
        </UniversalModal>
      </div>
    </div>
  </div>
  <ToastNotification 
    :is-visible="syncState.isVisible" 
    :title="syncState.title"
    :description="syncState.description" 
    :progress="syncState.progress" 
    :type="syncState.type" 
  />
</template>

<script setup>
import { ref, onMounted, onUnmounted, onActivated, computed, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { gsap } from 'gsap';

import SidebarComponent from '../components/SidebarComponent.vue';
import TopbarComponent from '../components/TopbarComponent.vue';
import UniversalModal from '../components/UniversalModal.vue';
import UserSalesTable from '../components/UserSalesTable.vue';
import UserStorageView from './UserStorageView.vue';
import MasterResumoCobranca from './MasterResumoCobranca.vue';
import UserAccountsPanel from './UserAccountsPanel.vue';
import ServiceHistory from './ServiceHistory.vue';
import ToastNotification from '../components/ToastNotification.vue';
import { useUsers } from '@/composables/useUsers';
import { useGlobalStatuses } from '@/composables/useGlobalStatuses';
import { usePackageTypes } from '@/composables/usePackageTypes';
import { useServices } from '@/composables/useServices.js';
import { useSyncManager } from '@/composables/useSyncManager';
import { useNotification } from '@/composables/useNotification';
import { useConfirm } from '@/composables/useConfirm';
import { API_BASE_URL } from '@/config';

const notify = useNotification();
const { confirm } = useConfirm();

/** Rótulos das permissões, para a confirmação falar a língua da tela. */
const ROLE_LABELS = { cliente: 'Cliente', master: 'Master' };
const { users, isLoading: isLoadingUsers, error: usersError, fetchUsers, updateUserRole, toggleUserActiveStatus, updateUserPassword, deleteUser } = useUsers();
const { syncState } = useSyncManager();
const {
  services: availableServices, isLoadingServices, isEditingService, currentService, isServiceModalOpen,
  isDeleteServiceModalOpen, serviceToDelete, openServiceModal, closeServiceModal, handleSaveService,
  openDeleteServiceModal, closeDeleteServiceModal, handleConfirmDeleteService, fetchServices, formatCurrency,
  clientServices, isLoadingClientServices, addClientService, fetchClientServices, removeClientService,
  serviceFormError, serviceTypeOptions, unitOptions, selectedTypeHint, addTier, removeTier,
  serviceTypeLabel, unitLabel, tierRangeLabel, serviceTypeIcon, untypedServicesCount
} = useServices();

const route = useRoute();
const router = useRouter();

const currentView = ref('users');
const selectedUser = ref(null);
const activeMenu = ref({ user: null, style: {} });
const userSearchQuery = ref('');
const userStatusFilter = ref('all');
const currentPage = ref(1);
const itemsPerPage = ref(10);
const tableContainer = ref(null);
const actionsDropdown = ref(null);

const isStatusManagerOpen = ref(false);
const newStatusName = ref('');
const statusError = ref('');
const { globalStatuses: allUserStatuses, addGlobalStatus: addStatus, deleteGlobalStatus: deleteStatus, updateGlobalStatus: updateStatus, fetchGlobalStatuses } = useGlobalStatuses();
const editingStatus = ref(null);
const editedStatusName = ref('');

// Gerenciamento de Modal de Pacotes
const isPackageTypesModalOpen = ref(false);
const editingPackageType = ref(false);
const packageTypeForm = ref({ id: null, name: '', price: 0 });
const { packageTypes: allPackageTypes, isLoading: isLoadingPackageTypes, fetchPackageTypes, addPackageType, updatePackageType, deletePackageType } = usePackageTypes();

const isServiceCatalogueOpen = ref(false);
const isContractModalOpen = ref(false);
const currentUser = ref(null);
const newContract = ref({ serviceId: '', volume: 1, startDate: new Date().toISOString().split('T')[0] });
const isDeleteUserModalOpen = ref(false);
const userToDelete = ref(null);
const isSyncResultsModalOpen = ref(false);
const isEditNameModalOpen = ref(false);
const editNameUser = ref(null);
const editNameValue = ref('');
const isSavingName = ref(false);
const syncResults = ref({});

const filteredUsers = computed(() => {
  let list = users.value;

  // Filtro por status ativo/inativo
  if (userStatusFilter.value === 'active') {
    list = list.filter(u => u.active !== false);
  } else if (userStatusFilter.value === 'inactive') {
    list = list.filter(u => u.active === false);
  }

  // Filtro por texto
  if (userSearchQuery.value.trim()) {
    const query = userSearchQuery.value.toLowerCase();
    list = list.filter(u => 
      u.email.toLowerCase().includes(query) ||
      (u.mlNickname && u.mlNickname.toLowerCase().includes(query)) ||
      (u.name && u.name.toLowerCase().includes(query))
    );
  }

  return list;
});
const totalPages = computed(() => Math.ceil(filteredUsers.value.length / itemsPerPage.value));
const paginatedUsers = computed(() =>
  filteredUsers.value.slice((currentPage.value - 1) * itemsPerPage.value, currentPage.value * itemsPerPage.value)
);

// Indicadores derivados da lista já carregada (apenas apresentação)
const userStats = computed(() => {
  const list = users.value || [];
  const active = list.filter(u => u.active !== false).length;
  return {
    total: list.length,
    active,
    inactive: list.length - active,
    masters: list.filter(u => u.role === 'master').length,
  };
});

// Intervalo exibido na paginação (apenas apresentação)
const resultRange = computed(() => {
  const total = filteredUsers.value.length;
  if (total === 0) return { start: 0, end: 0 };
  const start = (currentPage.value - 1) * itemsPerPage.value + 1;
  return { start, end: Math.min(start + itemsPerPage.value - 1, total) };
});

// Iniciais para o avatar do usuário (nome, apelido ou e-mail)
const getUserInitials = (user) => {
  if (!user) return '?';
  const source = (user.name || user.mlNickname || user.email || '').trim();
  if (!source) return '?';
  const parts = source.replace(/[._-]+/g, ' ').split(/[\s@]+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

// Atualizando o breadcrumb para incluir a nova visão
const breadcrumbTitle = computed(() => {
  const displayName = selectedUser.value ? (selectedUser.value.mlNickname || selectedUser.value.email) : '';
  if (currentView.value === 'sales') return `Vendas de ${displayName}`;
  if (currentView.value === 'storage') return `Armazenamento de ${displayName}`;
  if (currentView.value === 'billing') return `Resumo de Faturamento de ${displayName}`;
  if (currentView.value === 'accounts') return `Contas conectadas de ${displayName}`;
  if (currentView.value === 'history') return 'Histórico de Serviços';
  return '';
});

const formatDate = (timestamp, isDateString = false) => {
  if (!timestamp) return 'N/A';

  /* BUG QUE ISTO CORRIGE: a coluna "Contratado em" mostrava "Invalid Date".
   *
   * O caminho antigo era `new Date(timestamp.replace(/-/g, '/'))`. Esse truque
   * existe para ler 'AAAA-MM-DD' em hora LOCAL, porque `new Date('2026-05-01')`
   * é interpretado como UTC e, num fuso a oeste de Greenwich, exibe 30/04.
   *
   * Só que ele funciona apenas numa data pura. `start_date` é DATE no Postgres
   * e chega serializado como ISO completo ('2026-05-01T00:00:00.000Z'); trocar
   * os hifens produzia '2026/05/01T00:00:00.000Z', que não é data nenhuma.
   *
   * Agora o valor é sempre parseado como veio, e `isDateString` passou a
   * significar "isto é data de calendário, leia em UTC" — que resolve o mesmo
   * problema de fuso sem depender do formato exato da string.
   */
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'N/A';

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    ...(isDateString ? { timeZone: 'UTC' } : {}),
  });
};

/* -------------------------------------------------------------------------- */
/* Contrato do cliente x catálogo                                             */
/*                                                                            */
/* GET /users/contracts/:uid devolve id, serviceId, name, price, volume e      */
/* startDate — e NÃO o tipo de cobrança nem a unidade, que moram em            */
/* public.services. O modal já carrega o catálogo (fetchServices no            */
/* openContractModal), então o cruzamento é feito aqui pelo serviceId em vez   */
/* de mudar a rota do backend.                                                 */
/* -------------------------------------------------------------------------- */

function catalogoDoContrato(contract) {
  if (!contract?.serviceId) return null;
  return availableServices.value.find((s) => s.id === contract.serviceId) || null;
}

/** Tipo de cobrança do serviço contratado, ou null quando não tem. */
function contractType(contract) {
  return catalogoDoContrato(contract)?.type || null;
}

/** Unidade do serviço, já no plural quando faz sentido. */
function contractUnitLabel(contract) {
  const servico = catalogoDoContrato(contract);
  return unitLabel(servico?.unit, contract?.volume || 1) || 'un.';
}

/**
 * A aba de um cliente vive na URL (/admin/users/:uid/vendas). Estes mapas
 * traduzem entre o segmento da URL, legível, e o nome interno da visão.
 */
const TAB_TO_VIEW = { vendas: 'sales', armazenamento: 'storage', cobranca: 'billing', contas: 'accounts' };
const VIEW_TO_TAB = { sales: 'vendas', storage: 'armazenamento', billing: 'cobranca', accounts: 'contas' };

/** Aplica o que está na URL ao estado da tela. */
const applyRoute = () => {
  // Histórico de serviços é global: não pertence a um cliente e tem endereço
  // próprio (/admin/history), mas roda DENTRO desta tela para herdar Sidebar e
  // Topbar. Antes existia como rota solta para o componente embutido, e abria
  // sem menu, sem barra do topo e sem nenhum caminho de volta.
  if (route.name === 'ServiceHistory') {
    currentView.value = 'history';
    selectedUser.value = null;
    return;
  }

  const uid = route.params.uid;
  const view = TAB_TO_VIEW[route.params.tab];

  if (!uid || !view) {
    currentView.value = 'users';
    selectedUser.value = null;
    return;
  }

  // A lista pode ainda não ter carregado (link aberto direto ou F5). Nesse
  // caso guarda o uid e o watch de `users` conclui quando os dados chegarem.
  const found = users.value.find((u) => u.uid === uid);
  selectedUser.value = found || { uid, email: uid, name: null, mlNickname: null };
  currentView.value = view;
};

// Reage ao endereço: cobre F5, link colado e o botão voltar do navegador.
// `route.name` entra na lista porque /admin/users e /admin/history não diferem
// em nenhum parâmetro — só no nome da rota.
watch(() => [route.name, route.params.uid, route.params.tab], applyRoute, { immediate: true });

// Quando a lista chega depois, completa nome e e-mail do cabeçalho.
watch(users, (list) => {
  const uid = route.params.uid;
  if (!uid || !list?.length) return;
  const found = list.find((u) => u.uid === uid);
  if (found) selectedUser.value = found;
});

const setView = (view) => {
  activeMenu.value.user = null;

  // Voltar para a lista é voltar para /admin/users.
  if (view === 'users') {
    currentView.value = 'users';
    selectedUser.value = null;
    if (route.name !== 'ManageUsersView') router.push({ name: 'ManageUsersView' });
    nextTick(() => animateRows());
    return;
  }

  // O histórico tem endereço próprio, então F5 e link compartilhado funcionam.
  if (view === 'history') {
    currentView.value = 'history';
    selectedUser.value = null;
    if (route.name !== 'ServiceHistory') router.push({ name: 'ServiceHistory' });
    return;
  }

  currentView.value = view;
  nextTick(() => animateRows());
};

/** Troca de aba do cliente navegando, para o endereço acompanhar. */
const switchUserView = (view) => {
  if (!selectedUser.value) return;
  const tab = VIEW_TO_TAB[view];
  if (tab && route.params.tab !== tab) {
    activeMenu.value.user = null;
    router.push({ name: 'ManageUserDetail', params: { uid: selectedUser.value.uid, tab } });
    return;
  }
  activeMenu.value.user = null;
  currentView.value = view;
};

/**
 * Troca a permissão do usuário depois de confirmação explícita.
 *
 * Ao cancelar, o <select> precisa voltar ao valor anterior. Como o campo é
 * ligado por `:value="user.role"` e essa propriedade não mudou, o patch do Vue
 * não tocaria no DOM já alterado pelo clique — por isso a propriedade reativa é
 * movida para o novo valor e devolvida ao original no tick seguinte.
 */
const handleRoleChange = async (user, newRole) => {
  const originalRole = user.role;
  if (newRole === originalRole) return;

  const confirmed = await confirm({
    title: 'Alterar permissão do usuário',
    message: `Alterar a permissão de ${user.name || user.mlNickname || user.email} de "${ROLE_LABELS[originalRole] || originalRole}" para "${ROLE_LABELS[newRole] || newRole}"?`,
    detail: newRole === 'master'
      ? 'Como Master, o usuário passa a ver e editar dados de todos os clientes.'
      : 'Como Cliente, o usuário perde o acesso às telas de administração.',
    confirmText: 'Alterar permissão',
    tone: newRole === 'master' ? 'danger' : 'primary',
  });

  if (!confirmed) {
    user.role = newRole;
    await nextTick();
    user.role = originalRole;
    return;
  }

  const result = await updateUserRole(user.uid, newRole);
  if (result.success) {
    notify.success(`Permissão de ${user.name || user.email} alterada para ${ROLE_LABELS[newRole] || newRole}.`);
  } else {
    notify.error(`Falha ao atualizar permissão: ${result.message}`);
  }
};

const toggleActionsMenu = async (user, event) => {
  const isSame = activeMenu.value.user && activeMenu.value.user.uid === user.uid;
  if (isSame) {
    activeMenu.value = { user: null, style: {} };
    return;
  }

  const rect = event.currentTarget.getBoundingClientRect();

  // Abre invisível só para medir: o menu é `position: fixed` e, alinhado pela
  // borda esquerda do botão, saía pela direita da janela — os itens apareciam
  // cortados ("Gerenciar Cobranç...", "Suspender Acess..."). Com a medida real
  // dá para encostar o menu na borda do botão e virá-lo para cima quando não
  // houver espaço embaixo.
  activeMenu.value = {
    user,
    style: { top: `${rect.bottom + 6}px`, left: `${rect.left}px`, visibility: 'hidden' },
  };
  await nextTick();

  const el = actionsDropdown.value;
  if (!el) return;

  const menu = el.getBoundingClientRect();
  const margin = 8;

  let left = rect.left;
  if (left + menu.width > window.innerWidth - margin) {
    left = Math.max(margin, rect.right - menu.width);
  }

  let top = rect.bottom + 6;
  if (top + menu.height > window.innerHeight - margin) {
    const above = rect.top - menu.height - 6;
    top = above >= margin ? above : Math.max(margin, window.innerHeight - menu.height - margin);
  }

  activeMenu.value = { user, style: { top: `${top}px`, left: `${left}px` } };
  await nextTick();
  if (actionsDropdown.value) {
    gsap.fromTo(actionsDropdown.value, { opacity: 0, y: -6, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.18, ease: 'power1.out' });
  }
};

// Menu fixo não acompanha a rolagem da tabela: fechar evita que ele fique
// flutuando desalinhado da linha que o abriu.
const closeActionsMenu = () => { activeMenu.value = { user: null, style: {} }; };

/* ------------------------- Alteração de senha ---------------------------- */
const isPasswordModalOpen = ref(false);
const passwordTarget = ref(null);
const passwordValue = ref('');
const passwordConfirm = ref('');
const passwordError = ref('');
const passwordSuccess = ref('');
const isSavingPassword = ref(false);

const openPasswordModal = (user) => {
  passwordTarget.value = user;
  passwordValue.value = '';
  passwordConfirm.value = '';
  passwordError.value = '';
  isPasswordModalOpen.value = true;
  closeActionsMenu();
};

const closePasswordModal = () => {
  isPasswordModalOpen.value = false;
  passwordTarget.value = null;
  // Não deixa a senha digitada viva em memória depois de fechar.
  passwordValue.value = '';
  passwordConfirm.value = '';
};

const handleSavePassword = async () => {
  passwordError.value = '';
  const senha = passwordValue.value.trim();

  if (senha.length < 8) {
    passwordError.value = 'A senha deve ter ao menos 8 caracteres.';
    return;
  }
  if (senha !== passwordConfirm.value.trim()) {
    passwordError.value = 'As senhas não coincidem.';
    return;
  }

  isSavingPassword.value = true;
  const result = await updateUserPassword(passwordTarget.value.uid, senha);
  isSavingPassword.value = false;

  if (result.success) {
    passwordSuccess.value = `Senha de ${passwordTarget.value.email} atualizada.`;
    closePasswordModal();
    setTimeout(() => { passwordSuccess.value = ''; }, 6000);
  } else {
    passwordError.value = result.message;
  }
};

/** Abrir um cliente é navegar até a URL dele; o watch de rota faz o resto. */
const openUserTab = (user, view) => {
  if (!user?.uid) return;
  activeMenu.value.user = null;
  selectedUser.value = user;
  router.push({ name: 'ManageUserDetail', params: { uid: user.uid, tab: VIEW_TO_TAB[view] } });
};

const editUserSales = (user) => openUserTab(user, 'sales');
const editUserStorage = (user) => openUserTab(user, 'storage');
const editUserBilling = (user) => openUserTab(user, 'billing');
const editUserAccounts = (user) => openUserTab(user, 'accounts');
const openDeleteUserModal = (user) => { userToDelete.value = user; isDeleteUserModalOpen.value = true; activeMenu.value.user = null; };
const closeDeleteUserModal = () => { isDeleteUserModalOpen.value = false; userToDelete.value = null; };

const handleToggleActive = async (user) => {
  activeMenu.value.user = null;
  const result = await toggleUserActiveStatus(user.uid, user.active);
  if (!result.success) {
    notify.error(result.message || 'Erro ao alterar status do usuário.');
  }
};
const closeSyncResultsModal = () => { isSyncResultsModalOpen.value = false; syncResults.value = {}; };

const openEditNameModal = (user) => {
  editNameUser.value = user;
  editNameValue.value = user.name || '';
  isEditNameModalOpen.value = true;
  activeMenu.value.user = null;
};
const closeEditNameModal = () => {
  isEditNameModalOpen.value = false;
  editNameUser.value = null;
  editNameValue.value = '';
};
const handleSaveName = async () => {
  if (!editNameUser.value || !editNameValue.value.trim()) return;
  isSavingName.value = true;
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/users/${editNameUser.value.uid}/name`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: editNameValue.value.trim() }),
    });
    if (!response.ok) throw new Error('Falha ao atualizar nome');
    // Atualiza o nome localmente na lista
    const userInList = users.value.find(u => u.uid === editNameUser.value.uid);
    if (userInList) userInList.name = editNameValue.value.trim();
    closeEditNameModal();
  } catch (error) {
    console.error('Erro ao salvar nome:', error);
    notify.fromError(error, 'Erro ao salvar o nome. Tente novamente.');
  } finally {
    isSavingName.value = false;
  }
};

const confirmDeleteUser = async () => {
    if (!userToDelete.value) return;
    await deleteUser(userToDelete.value.uid);
    closeDeleteUserModal();
};

const openStatusManagerModal = async () => { 
  await fetchGlobalStatuses(); 
  isStatusManagerOpen.value = true; 
  await nextTick(); 
  animateModal(); 
};
const closeStatusManagerModal = () => { isStatusManagerOpen.value = false; newStatusName.value = ''; statusError.value = ''; cancelEditing(); };

const openPackageTypesModal = async () => {
  await fetchPackageTypes();
  isPackageTypesModalOpen.value = true;
  await nextTick();
  animateModal();
};
const closePackageTypesModal = () => { 
  isPackageTypesModalOpen.value = false; 
  cancelEditPackageType();
};
const startNewPackageType = () => {
  packageTypeForm.value = { id: null, name: '', price: 0 };
  editingPackageType.value = true;
};
const editExistingPackageType = (pkg) => {
  packageTypeForm.value = { id: pkg.id, name: pkg.name, price: pkg.price };
  editingPackageType.value = true;
};
const cancelEditPackageType = () => {
  editingPackageType.value = false;
  packageTypeForm.value = { id: null, name: '', price: 0 };
};
const handleSavePackageType = async () => {
  try {
    if (packageTypeForm.value.id) {
      await updatePackageType(packageTypeForm.value.id, { name: packageTypeForm.value.name, price: packageTypeForm.value.price });
    } else {
      await addPackageType({ name: packageTypeForm.value.name, price: packageTypeForm.value.price });
    }
    cancelEditPackageType();
  } catch (err) {
    notify.fromError(err, 'Erro ao salvar tipo de pacote.');
  }
};
const handleDeletePackageType = async (id) => {
  const target = allPackageTypes.value.find((pkg) => pkg.id === id);
  const confirmed = await confirm({
    title: 'Excluir tipo de pacote',
    message: target
      ? `Excluir o tipo de pacote "${target.name}"?`
      : 'Excluir este tipo de pacote?',
    detail: 'O custo de expedição deixa de ser aplicado aos SKUs que usavam este tipo.',
    confirmText: 'Excluir tipo',
    tone: 'danger',
  });
  if (!confirmed) return;

  try {
    await deletePackageType(id);
    notify.success('Tipo de pacote excluído.');
  } catch (err) {
    notify.fromError(err, 'Erro ao excluir o tipo de pacote.');
  }
};

const handleAddNewStatus = async () => {
  statusError.value = '';
  try { await addStatus(newStatusName.value); newStatusName.value = ''; } 
  catch (e) { statusError.value = e.message; }
};

const handleDeleteStatus = async (status) => {
  // O status é global: excluir afeta a expedição de todos os clientes, então a
  // ação passou a exigir confirmação explícita.
  const confirmed = await confirm({
    title: 'Excluir status de venda',
    message: `Excluir o status "${status.label}"?`,
    detail: 'Ele deixa de aparecer nas telas de expedição de todos os clientes.',
    confirmText: 'Excluir status',
    tone: 'danger',
  });
  if (!confirmed) return;

  try {
    await deleteStatus(status);
    notify.success('Status excluído.');
  } catch (err) {
    statusError.value = err.message;
    notify.fromError(err, 'Não foi possível excluir o status.');
  }
};

const startEditing = (status) => { editingStatus.value = status; editedStatusName.value = status.label; };
const cancelEditing = () => { editingStatus.value = null; editedStatusName.value = ''; statusError.value = ''; };

const handleUpdateStatus = async (status) => {
  statusError.value = '';
  try { await updateStatus(status.value, editedStatusName.value); cancelEditing(); } 
  catch (e) { statusError.value = e.message; }
};

const openServiceCatalogueModal = async () => { fetchServices(); isServiceCatalogueOpen.value = true; await nextTick(); animateModal(); };
const closeServiceCatalogueModal = () => { isServiceCatalogueOpen.value = false; closeServiceModal(); };
const openContractModal = async (user) => { currentUser.value = user; fetchClientServices(user.uid); fetchServices(); isContractModalOpen.value = true; await nextTick(); animateModal(); };
const closeContractModal = () => { isContractModalOpen.value = false; currentUser.value = null; clientServices.value = []; };

const handleAddClientService = async () => {
  if (!currentUser.value) return;
  const service = availableServices.value.find(s => s.id === newContract.value.serviceId);
  if (!service) return;
  const contractData = { serviceId: newContract.value.serviceId, name: service.name, price: service.price, volume: newContract.value.volume, startDate: newContract.value.startDate };
  await addClientService(currentUser.value.uid, contractData);
  newContract.value = { serviceId: '', volume: 1, startDate: new Date().toISOString().split('T')[0] };
};
const handleRemoveClientService = async (contractId) => {
  if (!currentUser.value) return;
  // Usar um modal de confirmação
  await removeClientService(currentUser.value.uid, contractId);
};



const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++; };
const prevPage = () => { if (currentPage.value > 1) currentPage.value--; };

const animateRows = () => {
  const rows = tableContainer.value?.querySelectorAll('tbody .row-anim');
  if (rows?.length) {
    gsap.fromTo(rows, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.28, ease: 'power1.out', stagger: 0.03 });
  }
};
const animateModal = () => {
  gsap.fromTo('.table-wrapper-modal, .service-form, .contract-modal-content, .status-manager',
    { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.22, ease: 'power1.out' });
};

/** Fecha o menu ao clicar fora dele e do botão que o abriu. */
const handleMenuClickOutside = (event) => {
  if (!activeMenu.value.user) return;
  const menu = actionsDropdown.value;
  if (menu && menu.contains(event.target)) return;
  if (event.target.closest && event.target.closest('.actions-button')) return;
  closeActionsMenu();
};

onMounted(async () => {
  document.addEventListener('click', handleMenuClickOutside);
  // `capture` para pegar a rolagem da tabela, que não borbulha.
  window.addEventListener('scroll', closeActionsMenu, true);
  window.addEventListener('resize', closeActionsMenu);
  await fetchUsers();
  nextTick(() => animateRows());
});

/* Tela em keep-alive: sem isto, um usuário criado, desativado ou com serviço
 * contratado em outra aba não aparecia ao voltar para a lista. */
let usersActivated = false;
onActivated(() => {
  if (!usersActivated) {
    usersActivated = true;
    return;
  }
  fetchUsers();
});

onUnmounted(() => {
  document.removeEventListener('click', handleMenuClickOutside);
  window.removeEventListener('scroll', closeActionsMenu, true);
  window.removeEventListener('resize', closeActionsMenu);
});
watch([paginatedUsers, currentPage], () => nextTick(() => animateRows()));
watch([userSearchQuery, userStatusFilter], () => { currentPage.value = 1; });
watch(() => syncState.value.isSyncing, (isSyncing, wasSyncing) => {
  if (wasSyncing && !isSyncing && syncState.value.progress === 100 && syncState.value.type !== 'error') {
    fetchUsers();
  }
});
</script>

<style scoped>
/* ===================== BASE / LAYOUT ===================== */
.users-wrapper {
  display: flex;
  min-height: 100vh;
  font-family: var(--font-sans);
  background-color: #f8fafc;
  color: #0f172a;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  /* Contém o overflow dos filhos */
  min-width: 0;
}

/* width + box-sizing juntos evitam scroll horizontal na página.
   max-width/margin alinham a tela às demais (TabelaVendas/Armazenamento). */
.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  width: 100%;
  max-width: 1640px;
  margin: 0 auto;
  padding: 1.25rem 1.5rem 2.5rem;
  box-sizing: border-box;
}

button, input, select, table { font-family: var(--font-sans); }

/* ===================== CABEÇALHO ===================== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}
.page-header__text { min-width: 0; }
.page-eyebrow {
  display: inline-flex; align-items: center; gap: 0.35rem;
  padding: 0.2rem 0.55rem; margin-bottom: 0.45rem;
  border: 1px solid #bfdbfe; border-radius: 999px;
  background: #eff6ff; color: #1d4ed8;
  font-size: 0.68rem; font-weight: 750; letter-spacing: 0.02em; text-transform: uppercase;
}
.title {
  margin: 0;
  font-size: clamp(1.45rem, 2vw, 1.8rem);
  font-weight: 800;
  letter-spacing: -0.035em;
  color: #0f172a;
}
.subtitle { margin: 0.2rem 0 0; font-size: 0.86rem; color: #64748b; }
.header-actions { display: flex; gap: .6rem; flex-wrap: wrap; }

/* ===================== FAIXA DE INDICADORES ===================== */
.stats-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.7rem;
  margin-bottom: 0.9rem;
}
.stat-tile {
  display: flex; align-items: center; gap: 0.7rem; min-width: 0;
  padding: 0.75rem 0.85rem;
  border: 1px solid #dbe3ef; border-radius: 10px; background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.035);
}
.stat-tile__icon {
  display: grid; place-items: center; width: 34px; height: 34px; flex: 0 0 auto;
  border-radius: 9px; background: #eff6ff; color: #2563eb;
}
.stat-tile.is-success .stat-tile__icon { background: #ecfdf5; color: #059669; }
.stat-tile.is-muted .stat-tile__icon { background: #f1f5f9; color: #64748b; }
.stat-tile__body { min-width: 0; display: flex; flex-direction: column; }
.stat-tile__body strong {
  color: #0f172a; font-size: 1.15rem; font-weight: 800;
  letter-spacing: -0.02em; font-variant-numeric: tabular-nums; line-height: 1.15;
}
.stat-tile__body span {
  margin-top: 0.08rem; overflow: hidden; color: #64748b;
  font-size: 0.7rem; font-weight: 600; text-overflow: ellipsis; white-space: nowrap;
}

/* ===================== BREADCRUMBS / CONTEXTO ===================== */
.breadcrumbs { display: flex; align-items: center; font-size: .85rem; margin-bottom: 1rem; }
.breadcrumb-link { color: #2563eb; font-weight: 600; text-decoration: none; background: none; border: none; cursor: pointer; padding: 0; }
.breadcrumb-link:hover { color: #1d4ed8; text-decoration: underline; }
.breadcrumb-separator { margin: 0 .5rem; color: #94a3b8; }
.breadcrumb-active { color: #334155; font-weight: 600; }

.user-context-panel {
  background: #ffffff;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  margin-bottom: 1rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
}
.user-context-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.9rem 1.1rem;
  border-bottom: 1px solid #eef2f7;
}
.btn-back {
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; flex-shrink: 0;
  border-radius: 9px; border: 1px solid #dbe3ef; background: #f8fafc;
  color: #64748b; cursor: pointer; transition: all 0.15s;
}
.btn-back:hover { border-color: #93c5fd; background: #eff6ff; color: #1d4ed8; }
.user-context-info { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; }
.user-context-name { font-size: 1rem; font-weight: 750; color: #0f172a; }
.user-context-email { font-size: 0.78rem; color: #94a3b8; }
.user-tabs { display: flex; padding: 0 0.4rem; gap: 0.2rem; background: #f8fafc; overflow-x: auto; }
.user-tab {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.7rem 0.95rem;
  font-size: 0.82rem; font-weight: 650; color: #64748b;
  background: none; border: none; border-bottom: 2px solid transparent;
  cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.user-tab:hover { color: #334155; background: #eef2f7; }
.user-tab.active { color: #1d4ed8; border-bottom-color: #2563eb; background: #eff6ff; }

/* ===================== CADASTROS GLOBAIS ===================== */
.global-settings-panel {
  background: #ffffff; border: 1px solid #dbe3ef; border-radius: 12px;
  padding: 0.85rem; margin-bottom: 0.8rem;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}
.panel-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: 0.6rem; flex-wrap: wrap; margin-bottom: 0.7rem;
}
.panel-title {
  display: inline-flex; align-items: center; gap: 0.4rem;
  margin: 0; color: #0f172a; font-size: 0.86rem; font-weight: 800;
  letter-spacing: -0.01em; text-transform: uppercase;
}
.panel-title svg { color: #2563eb; flex: 0 0 auto; }
.panel-hint { color: #94a3b8; font-size: 0.72rem; font-weight: 600; }
.panel-buttons {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.65rem;
}
.btn-global {
  display: flex; align-items: center; gap: 0.7rem; min-width: 0;
  padding: 0.7rem 0.8rem; text-align: left;
  background: #fff; border: 1px solid #dbe3ef; border-radius: 10px;
  cursor: pointer; transition: border-color 0.15s, background 0.15s, box-shadow 0.15s, transform 0.15s;
}
.btn-global:hover {
  border-color: #93c5fd; background: #f8fbff; transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(37, 99, 235, 0.08);
}
.btn-global:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2); }
.btn-icon {
  display: grid; place-items: center;
  width: 38px; height: 38px; flex: 0 0 auto; border-radius: 10px;
}
.bg-blue { background: #2563eb; color: #fff; }
.bg-blue-soft { background: #eff6ff; color: #2563eb; }
.btn-icon svg { width: 19px; height: 19px; }
.btn-info { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; flex: 1; }
.btn-title { color: #0f172a; font-size: 0.85rem; font-weight: 750; }
.btn-desc {
  overflow: hidden; color: #64748b; font-size: 0.72rem; line-height: 1.3;
  text-overflow: ellipsis; white-space: nowrap;
}
.btn-global__arrow { color: #cbd5e1; flex: 0 0 auto; transition: color 0.15s, transform 0.15s; }
.btn-global:hover .btn-global__arrow { color: #2563eb; transform: translateX(2px); }

/* ===================== BARRA DE FERRAMENTAS ===================== */
.table-controls {
  display: flex; align-items: center; gap: 0.7rem; flex-wrap: wrap;
  padding: 0.6rem 0.7rem; margin-bottom: 0.7rem;
  border: 1px solid #dbe3ef; border-radius: 12px; background: #fff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}
.search-wrapper { position: relative; flex: 1 1 260px; min-width: 220px; max-width: 380px; }
.search-icon {
  position: absolute; left: .7rem; top: 50%; transform: translateY(-50%);
  width: 1rem; height: 1rem; color: #94a3b8; pointer-events: none;
}
.search-input {
  width: 100%; min-height: 38px; box-sizing: border-box;
  padding: .5rem 2rem .5rem 2.1rem;
  font-size: .85rem; color: #0f172a;
  border: 1px solid #dbe3ef; border-radius: 8px; background: #fff;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.search-input::placeholder { color: #94a3b8; }
.search-input:focus { outline: none; border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12); }
.search-clear {
  position: absolute; right: .45rem; top: 50%; transform: translateY(-50%);
  display: grid; place-items: center; width: 20px; height: 20px;
  border: none; border-radius: 999px; background: #eef2f7; color: #64748b; cursor: pointer;
}
.search-clear:hover { background: #dbeafe; color: #1d4ed8; }

.status-filter-wrapper { display: flex; align-items: center; gap: 0.5rem; min-width: 0; }
.filter-label {
  color: #64748b; font-size: 0.68rem; font-weight: 750;
  letter-spacing: 0.04em; text-transform: uppercase; white-space: nowrap;
}
.chip-row { display: flex; align-items: center; gap: 0.3rem; flex-wrap: wrap; }
.chip {
  display: inline-flex; align-items: center; gap: 0.35rem;
  min-height: 32px; padding: 0.32rem 0.62rem;
  border: 1px solid #dbe3ef; border-radius: 8px; background: #fff;
  color: #475569; font-size: 0.78rem; font-weight: 650; white-space: nowrap; cursor: pointer;
  transition: border-color 140ms, background 140ms, color 140ms;
}
.chip:hover { border-color: #93c5fd; background: #f8fbff; color: #1d4ed8; }
.chip.is-active { border-color: #93c5fd; background: #eff6ff; color: #1d4ed8; }
.chip__count {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 20px; padding: 0 0.25rem; border-radius: 999px;
  background: #f1f5f9; color: #64748b;
  font-size: 0.68rem; font-weight: 750; font-variant-numeric: tabular-nums;
}
.chip.is-active .chip__count { background: #2563eb; color: #fff; }

.results-count {
  display: inline-flex; align-items: center; gap: 0.35rem; margin-left: auto;
  color: #64748b; font-size: 0.74rem; font-weight: 650; white-space: nowrap;
}
.results-count svg { color: #94a3b8; }

/* ===================== TABELA ===================== */
.table-container {
  background-color: #ffffff; border: 1px solid #dbe3ef; border-radius: 12px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05); overflow: hidden;
}
.table-wrapper { width: 100%; max-width: 100%; max-height: min(68vh, 760px); overflow: auto; }
.users-table { width: 100%; min-width: 940px; border-collapse: separate; border-spacing: 0; }
.users-table th, .users-table td {
  padding: .7rem 1rem; text-align: left; border-bottom: 1px solid #eef2f7; vertical-align: middle;
}
.users-table th {
  position: sticky; top: 0; z-index: 2;
  background-color: #f8fafc; color: #64748b;
  font-weight: 750; font-size: .68rem; letter-spacing: 0.05em; text-transform: uppercase;
  border-bottom: 1px solid #dbe3ef; white-space: nowrap;
}
.users-table td { font-size: .85rem; color: #0f172a; }
.users-table tbody tr:nth-child(even) { background-color: #fcfdff; }
.users-table tbody tr:hover { background-color: #f8fbff; }
.users-table tbody tr:last-child td { border-bottom: none; }
.col-user { width: 34%; }
.col-actions { width: 96px; text-align: right; }
.actions-cell { text-align: right; }
.cell-date { color: #64748b; font-variant-numeric: tabular-nums; white-space: nowrap; }

.user-cell { display: flex; align-items: center; gap: 0.6rem; min-width: 0; }
.user-avatar {
  display: grid; place-items: center; width: 34px; height: 34px; flex: 0 0 auto;
  border-radius: 999px; border: 1px solid #bfdbfe; background: #eff6ff; color: #1d4ed8;
  font-size: 0.72rem; font-weight: 800; letter-spacing: 0.02em; text-transform: uppercase;
}
.user-avatar--master { border-color: #1d4ed8; background: #2563eb; color: #fff; }
.user-avatar--lg { width: 40px; height: 40px; font-size: 0.82rem; }
.user-cell__info { display: flex; flex-direction: column; min-width: 0; }
.user-cell__name {
  overflow: hidden; color: #0f172a; font-size: 0.86rem; font-weight: 700;
  text-overflow: ellipsis; white-space: nowrap;
}
.user-cell__email {
  overflow: hidden; color: #94a3b8; font-size: 0.73rem;
  text-overflow: ellipsis; white-space: nowrap;
}

.status-pill {
  display: inline-flex; align-items: center; gap: 0.35rem;
  padding: 0.22rem 0.55rem; border-radius: 999px;
  font-size: 0.7rem; font-weight: 750; letter-spacing: 0.02em; text-transform: uppercase;
}
.status-dot { width: 6px; height: 6px; border-radius: 999px; background: currentColor; }
.pill-active { background-color: #ecfdf5; color: #059669; }
.pill-inactive { background-color: #f1f5f9; color: #64748b; }
.row-inactive .user-cell__name { color: #475569; }
.row-inactive .user-avatar { border-color: #e2e8f0; background: #f1f5f9; color: #94a3b8; }

.role-control {
  position: relative; display: inline-flex; align-items: center; gap: 0.35rem;
  padding: 0 0.5rem; min-height: 32px;
  border: 1px solid #dbe3ef; border-radius: 8px; background: #fff;
  transition: border-color 0.15s, background 0.15s;
}
.role-control:hover { border-color: #93c5fd; }
.role-control svg { flex: 0 0 auto; }
.role-control--client { color: #475569; }
.role-control--master { border-color: #bfdbfe; background: #eff6ff; color: #1d4ed8; }
.role-select {
  appearance: none; -webkit-appearance: none;
  padding: 0 1.1rem 0 0; border: none; background: transparent;
  color: inherit; font-size: 0.78rem; font-weight: 700; cursor: pointer;
}
.role-select:focus { outline: none; }
.role-control__chevron {
  position: absolute; right: 0.45rem; top: 50%; transform: translateY(-50%);
  color: #94a3b8; pointer-events: none;
}

.actions-button {
  display: inline-flex; align-items: center; justify-content: center;
  min-height: 32px; padding: 0.3rem 0.7rem;
  background-color: #fff; color: #475569;
  border: 1px solid #dbe3ef; border-radius: 8px;
  font-size: 0.78rem; font-weight: 700; cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}
.actions-button:hover { border-color: #93c5fd; background: #eff6ff; color: #1d4ed8; }

/* ===================== ESTADOS ===================== */
.feedback-state {
  display: flex; flex-direction: column; align-items: center; gap: 0.4rem;
  padding: 3rem 1rem; text-align: center; color: #64748b;
}
.feedback-state h3 { margin: 0; color: #0f172a; font-size: 0.98rem; font-weight: 750; }
.feedback-state p { margin: 0; font-size: 0.82rem; }
.feedback-state .btn { margin-top: 0.6rem; }
.feedback-icon {
  display: grid; place-items: center; width: 46px; height: 46px; margin-bottom: 0.3rem;
  border-radius: 999px; background: #eff6ff; color: #2563eb;
}
.feedback-icon.is-error { background: #fef2f2; color: #dc2626; }

.is-skeleton td { border-bottom-color: #eef2f7; }
.is-skeleton:hover { background: transparent !important; }
.sk-lines { display: flex; flex-direction: column; gap: 6px; }
.sk { position: relative; overflow: hidden; display: inline-block; height: 12px; border-radius: 6px; background: #eef1f5; }
.sk::after { content: ""; position: absolute; inset: 0; transform: translateX(-100%); background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.6) 50%, rgba(255,255,255,0) 100%); animation: sk-shimmer 1.2s infinite; }
.sk-text { height: 12px; }
.sk-text--sm { height: 9px; }
.sk-avatar { width: 34px; height: 34px; border-radius: 999px; flex: 0 0 auto; }
.sk-pill { height: 24px; border-radius: 999px; }
.sk-btn { height: 30px; border-radius: 8px; }
@keyframes sk-shimmer { 100% { transform: translateX(100%); } }

/* ===================== RODAPÉ / PAGINAÇÃO ===================== */
.table-footer {
  display: flex; align-items: center; justify-content: space-between;
  gap: 0.8rem; flex-wrap: wrap;
  padding: 0.7rem 1rem; border-top: 1px solid #eef2f7; background: #fff;
}
.table-footer__info { color: #64748b; font-size: 0.76rem; }
.table-footer__info strong { color: #0f172a; font-weight: 750; font-variant-numeric: tabular-nums; }
.pagination-controls { display: flex; align-items: center; gap: .45rem; }
.pagination-controls button {
  display: inline-flex; align-items: center; gap: 0.3rem;
  min-height: 32px; padding: .35rem .7rem;
  border: 1px solid #dbe3ef; border-radius: 8px; background-color: #ffffff;
  color: #475569; font-size: 0.78rem; font-weight: 700; cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}
.pagination-controls button:hover:not(:disabled) { border-color: #93c5fd; background: #eff6ff; color: #1d4ed8; }
.pagination-controls button:disabled { opacity: .45; cursor: not-allowed; }
.page-indicator {
  padding: 0 0.4rem; color: #64748b; font-size: 0.76rem; font-weight: 650;
  font-variant-numeric: tabular-nums; white-space: nowrap;
}

/* ===================== BOTÕES ===================== */
.btn {
  font-size: 0.82rem; font-weight: 700; padding: 0.45rem 0.8rem; min-height: 38px;
  border-radius: 9px; border: 1px solid transparent; cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s;
}
.btn-with-icon { display: inline-flex; align-items: center; gap: 0.4rem; }
.btn-primary { background-color: #2563eb; color: #ffffff; border-color: #2563eb; box-shadow: 0 6px 16px rgba(37, 99, 235, 0.18); }
.btn-primary:hover { background-color: #1d4ed8; border-color: #1d4ed8; }
.btn-secondary { background-color: #ffffff; color: #475569; border-color: #dbe3ef; }
.btn-secondary:hover { border-color: #93c5fd; background-color: #eff6ff; color: #1d4ed8; }
.btn-ghost-blue { background-color: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
.btn-ghost-blue:hover { background-color: #dbeafe; border-color: #93c5fd; }
.btn-danger { background-color: #ef4444; color: #ffffff; border-color: #ef4444; }
.btn-danger:hover { background-color: #dc2626; border-color: #dc2626; }
.btn-action { background: none; border: none; padding: 0; cursor: pointer; color: #64748b; }
.btn-action.delete { color: #dc2626; }
.btn-action.save { color: #059669; }
.btn-sm { min-height: 30px; padding: .28rem .6rem; font-size: .76rem; }
.btn-full-width { width: 100%; }

/* Modal de senha */
.password-hint {
  margin: 0.25rem 0 0; padding: 0.55rem 0.65rem;
  border: 1px solid #dbeafe; border-radius: 8px; background: #eff6ff;
  color: #1d4ed8; font-size: 0.74rem; line-height: 1.35;
}
.password-error {
  margin: 0.6rem 0 0; color: #dc2626; font-size: 0.78rem; font-weight: 600;
}
.password-success {
  display: flex; align-items: center; gap: 0.4rem;
  margin: 0 0 0.75rem; padding: 0.6rem 0.75rem;
  border: 1px solid #a7f3d0; border-radius: 9px; background: #ecfdf5;
  color: #047857; font-size: 0.8rem; font-weight: 650;
}

/* ===================== DROPDOWN DE AÇÕES ===================== */
.actions-dropdown-floating {
  position: fixed; z-index: 1000; min-width: 214px; padding: 0.3rem;
  background-color: #ffffff; border: 1px solid #dbe3ef; border-radius: 10px;
  box-shadow: 0 16px 36px rgba(15, 23, 42, .14);
}
.dropdown-heading {
  display: block; padding: .4rem .55rem .5rem; overflow: hidden;
  color: #94a3b8; font-size: .68rem; font-weight: 750;
  letter-spacing: 0.04em; text-transform: uppercase; text-overflow: ellipsis; white-space: nowrap;
}
.actions-dropdown-floating a {
  display: flex; align-items: center; gap: 0.5rem;
  padding: .5rem .55rem; border-radius: 7px;
  color: #334155; font-size: .82rem; font-weight: 600; text-decoration: none; cursor: pointer;
}
.actions-dropdown-floating a svg { color: #94a3b8; flex: 0 0 auto; }
.actions-dropdown-floating a:hover { background-color: #eff6ff; color: #1d4ed8; }
.actions-dropdown-floating a:hover svg { color: #2563eb; }
.dropdown-divider { height: 1px; background-color: #eef2f7; margin: 0.3rem 0; }
.action-delete, .action-suspend { color: #dc2626 !important; }
.action-delete svg, .action-suspend svg { color: #f87171 !important; }
.action-delete:hover, .action-suspend:hover { background-color: #fef2f2 !important; color: #b91c1c !important; }
.action-activate { color: #059669 !important; }
.action-activate svg { color: #34d399 !important; }
.action-activate:hover { background-color: #ecfdf5 !important; color: #047857 !important; }

/* ===================== MODAIS ===================== */
.form-group input, .form-group select, .status-input {
  width: 100%; box-sizing: border-box; padding: .5rem .75rem;
  border: 1px solid #dbe3ef; border-radius: 8px; font-size: 0.85rem;
}
.form-group input:focus, .form-group select:focus, .status-input:focus {
  outline: none; border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}
.modal-actions { display: flex; justify-content: flex-end; gap: .5rem; margin-top: 1rem; }
.warning-text { margin-top: 1rem; padding: 0.75rem; background-color: #fffbeb; border-left: 4px solid #f59e0b; color: #b45309; border-radius: 0 6px 6px 0; }
.plan-manager-content, .status-manager, .contract-modal-content { padding: .5rem 0; }
.table-wrapper-modal { max-height: 320px; overflow: auto; border: 1px solid #dbe3ef; border-radius: 8px; }
.services-table-modal { width: 100%; min-width: 600px; border-collapse: collapse; }
.services-table-modal th, .services-table-modal td { padding: .7rem; text-align: left; border-bottom: 1px solid #eef2f7; }
.services-table-modal th { background-color: #f8fafc; color: #64748b; font-weight: 750; font-size: .7rem; letter-spacing: 0.04em; text-transform: uppercase; }
.service-name { font-weight: 650; color: #0f172a; }
.service-description { color: #94a3b8; font-size: 0.76rem; }
.service-unit { margin-top: 0.2rem; color: #94a3b8; font-size: 0.72rem; }

/* --- Catálogo de serviços em cards (antes tabela com scroll horizontal) --- */
.btn-with-icon { display: inline-flex; align-items: center; justify-content: center; gap: 0.45rem; }
.catalogue-head { display: flex; align-items: center; gap: 0.5rem; margin: 1.25rem 0 0.65rem; }
.catalogue-head .modal-subtitle { margin: 0; }
.catalogue-count { padding: 0.1rem 0.45rem; border-radius: 999px; background: var(--cd-blue-50, #f0f9ff); color: var(--cd-blue-700, #0369a1); font-size: 0.72rem; font-weight: 750; }
.catalogue-alert { display: flex; align-items: flex-start; gap: 0.45rem; margin: 0 0 0.75rem; padding: 0.55rem 0.7rem; border: 1px solid #f5d68a; border-radius: 0.5rem; background: var(--cd-warning-bg, #fff3cd); color: var(--cd-warning-ink, #9a5700); font-size: 0.78rem; line-height: 1.45; }
.catalogue-alert svg { flex: 0 0 auto; margin-top: 0.12rem; }
.catalogue-feedback { padding: 1.5rem; border: 1px dashed var(--cd-line, #dbe7f0); border-radius: 0.6rem; color: #64748b; font-size: 0.82rem; text-align: center; }

.catalogue-list { display: flex; flex-direction: column; gap: 0.55rem; margin: 0; padding: 0; max-height: 26rem; overflow-y: auto; list-style: none; }
.catalogue-item { display: grid; grid-template-columns: 2.4rem minmax(0, 1fr) auto; align-items: flex-start; gap: 0.7rem; padding: 0.75rem; border: 1px solid var(--cd-line, #dbe7f0); border-radius: 0.65rem; background: #fff; transition: border-color 0.15s, box-shadow 0.15s; }
.catalogue-item:hover { border-color: #b9d3e3; box-shadow: 0 4px 14px rgba(15, 71, 105, 0.07); }
.catalogue-item.is-untyped { border-color: #f5d68a; background: #fffdf6; }

.catalogue-item__icon { display: inline-flex; align-items: center; justify-content: center; width: 2.4rem; height: 2.4rem; border-radius: 0.55rem; background: var(--cd-blue-50, #f0f9ff); color: var(--cd-blue-700, #0369a1); }
.catalogue-item__icon svg { width: 1.15rem; height: 1.15rem; }
.catalogue-item__icon.icon--none { background: var(--cd-warning-bg, #fff3cd); color: var(--cd-warning-ink, #9a5700); }
.catalogue-item__icon.icon--avulso_quantidade, .catalogue-item__icon.icon--avulso_simples { background: #eef6fb; color: var(--cd-blue-800, #075985); }

.catalogue-item__body { min-width: 0; }
.catalogue-item__title { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem; color: #0f172a; font-size: 0.86rem; font-weight: 700; line-height: 1.35; }
.catalogue-item__desc { margin: 0.25rem 0 0; color: #94a3b8; font-size: 0.76rem; line-height: 1.45; }
.catalogue-item__price { margin-top: 0.4rem; color: var(--cd-blue-700, #0369a1); font-size: 0.95rem; font-weight: 780; font-variant-numeric: tabular-nums; }
.catalogue-item__price small { margin-left: 0.25rem; color: #94a3b8; font-size: 0.72rem; font-weight: 600; }
.catalogue-tiers { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.45rem; }
.tier-chip { padding: 0.18rem 0.45rem; border: 1px solid #cfe6f4; border-radius: 0.35rem; background: #f7fcff; color: #075985; font-size: 0.72rem; white-space: nowrap; }
.tier-chip strong { font-variant-numeric: tabular-nums; }
.catalogue-item__actions { display: flex; gap: 0.25rem; }
.service-warning { display: inline-flex; align-items: center; gap: 0.3rem; margin-top: 0.3rem; padding: 0.15rem 0.4rem; border-radius: 0.3rem; background: var(--cd-warning-bg, #fff3cd); color: var(--cd-warning-ink, #9a5700); font-size: 0.7rem; font-weight: 650; }
.type-badge { display: inline-block; padding: 0.2rem 0.45rem; border-radius: 0.35rem; font-size: 0.7rem; font-weight: 700; line-height: 1.3; }
.type-badge.is-set { background: var(--cd-blue-50, #f0f9ff); color: var(--cd-blue-700, #0369a1); }
.type-badge.is-missing { background: var(--cd-warning-bg, #fff3cd); color: var(--cd-warning-ink, #9a5700); }
.tier-line { color: #475569; font-size: 0.76rem; line-height: 1.5; white-space: nowrap; }
.field-hint { display: block; margin-top: 0.3rem; color: #64748b; font-size: 0.73rem; line-height: 1.4; }
.form-error { margin: 0.5rem 0 0; padding: 0.5rem 0.65rem; border-radius: 0.4rem; background: var(--cd-danger-bg, #fee2e2); color: var(--cd-danger-ink, #991b1b); font-size: 0.78rem; font-weight: 600; }
.tiers-block { margin-bottom: 1rem; padding: 0.75rem; border: 1px solid var(--cd-line, #dbe7f0); border-radius: 0.5rem; background: #f8fbfd; }
.tiers-head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.tiers-head label { color: #0f172a; font-size: 0.82rem; font-weight: 700; }
.btn-tier-add { padding: 0.25rem 0.5rem; border: 1px solid var(--cd-blue-700, #0369a1); border-radius: 0.35rem; background: #fff; color: var(--cd-blue-700, #0369a1); font-size: 0.73rem; font-weight: 700; cursor: pointer; }
.btn-tier-add:hover { background: var(--cd-blue-50, #f0f9ff); }
.tier-row { display: flex; align-items: center; gap: 0.4rem; margin-top: 0.5rem; }
.tier-field { display: flex; align-items: center; gap: 0.3rem; min-width: 0; }
.tier-field span { color: #64748b; font-size: 0.75rem; white-space: nowrap; }
.tier-field input { width: 100%; min-width: 4rem; padding: 0.35rem 0.45rem; border: 1px solid #cbd5e1; border-radius: 0.35rem; font-size: 0.8rem; }
.tier-price input { min-width: 5rem; }
.btn-tier-remove { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; width: 1.6rem; height: 1.6rem; border: none; border-radius: 0.3rem; background: var(--cd-danger-bg, #fee2e2); color: var(--cd-danger-ink, #991b1b); line-height: 1; cursor: pointer; }
.btn-tier-remove:disabled { opacity: 0.4; cursor: not-allowed; }
.feedback-cell { text-align: center; color: #64748b; }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; font-size: .8rem; font-weight: 700; color: #334155; margin-bottom: .25rem; }
/* ---------------- Serviços contratados do cliente ----------------
   Substituiu a tabela com `min-width: 600px`, que dentro de um modal de 560px
   garantia barra de rolagem horizontal em qualquer tela. Lista sem largura
   mínima: o scroll deixa de existir por construção. */
.contract-section-head { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.65rem; }
.contract-section-head .modal-subtitle { margin: 0; flex: 1 1 auto; }
.contract-feedback { margin: 0 0 1rem; color: #64748b; font-size: 0.85rem; }
.contract-empty { display: flex; align-items: center; gap: 0.6rem; margin: 0 0 1rem; padding: 1rem; border: 1px dashed #cbd5e1; border-radius: 0.6rem; color: #64748b; font-size: 0.83rem; line-height: 1.45; }
.contract-empty svg { flex: 0 0 auto; color: #94a3b8; }

.contract-list { list-style: none; margin: 0 0 0.5rem; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.contract-item { display: grid; grid-template-columns: auto 1fr auto; gap: 0.75rem; align-items: start; padding: 0.75rem 0.85rem; border: 1px solid var(--cd-line, #dbe7f0); border-radius: 0.65rem; background: #fff; }
.contract-item__icon { display: inline-flex; align-items: center; justify-content: center; width: 2rem; height: 2rem; border-radius: 0.5rem; background: #f0f9ff; color: var(--cd-blue-700, #0369a1); flex: 0 0 auto; }
.contract-item__icon :deep(svg) { width: 16px; height: 16px; }
.contract-item__icon.icon--none { background: #fff3cd; color: #9a5700; }
.contract-item__body { min-width: 0; }
.contract-item__title { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem; color: #0f172a; font-size: 0.87rem; font-weight: 700; line-height: 1.35; }
.contract-item__meta { display: flex; flex-wrap: wrap; gap: 0.25rem 0.9rem; margin-top: 0.3rem; color: #64748b; font-size: 0.76rem; }
.contract-item__meta span { display: inline-flex; align-items: center; gap: 0.28rem; }
.contract-item__meta svg { flex: 0 0 auto; color: #94a3b8; }
.contract-item__price { font-weight: 700; color: var(--cd-blue-700, #0369a1); font-variant-numeric: tabular-nums; }
.contract-item__warning { display: flex; align-items: center; gap: 0.3rem; margin: 0.4rem 0 0; color: var(--cd-warning-ink, #9a5700); font-size: 0.74rem; font-weight: 650; }
.contract-item__warning svg { flex: 0 0 auto; }
.contract-item__remove { align-self: center; }

.contract-add-title { margin-top: 1.35rem; }
.add-service-form { border-top: 1px solid #eef2f7; padding-top: 1rem; }
.add-service-form__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); gap: 0 0.75rem; }
.add-service-form__grid .form-group--wide { grid-column: 1 / -1; }
.add-service-form__hint { margin: 0 0 0.9rem; color: #64748b; font-size: 0.75rem; line-height: 1.45; }
.add-service-form__actions { display: flex; justify-content: flex-end; gap: 0.5rem; }

@media (min-width: 34rem) {
  /* Serviço ocupa a linha inteira; volume e data dividem a de baixo. */
  .add-service-form__grid { grid-template-columns: 1fr 1fr; }
}
.status-creator { display: flex; gap: .5rem; margin-bottom: 1rem; }
.modal-subtitle {
  display: flex; align-items: center; gap: 0.4rem;
  font-size: .92rem; font-weight: 750; color: #0f172a;
  margin-top: 1.25rem; margin-bottom: .75rem;
  border-bottom: 1px solid #eef2f7; padding-bottom: .5rem;
}
.modal-subtitle svg { color: #2563eb; flex: 0 0 auto; }
.status-list { list-style: none; padding: 0; max-height: 250px; overflow-y: auto; }
.status-item { display: flex; justify-content: space-between; align-items: center; padding: .55rem .25rem; border-bottom: 1px solid #f1f5f9; }
.status-display-mode, .status-edit-mode { display: flex; justify-content: space-between; align-items: center; width: 100%; gap: 0.5rem; }
.status-actions { display: flex; gap: 0.5rem; }
.status-input-edit { flex-grow: 1; padding: .4rem .6rem; border: 1px solid #dbe3ef; border-radius: 8px; }
.error-text { color: #dc2626; font-size: .82rem; margin-bottom: .75rem; }
.sync-results-content { max-height: 500px; overflow-y: auto; }
.sync-message { padding: 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.86rem; }
.sync-message.warning { background-color: #fffbeb; border-left: 4px solid #f59e0b; color: #b45309; }
.sync-message.error { background-color: #fef2f2; border-left: 4px solid #ef4444; color: #dc2626; }
.sync-message.success { background-color: #ecfdf5; border-left: 4px solid #10b981; color: #047857; }
.sync-summary { margin-bottom: 1rem; }
.summary-stats { background-color: #f8fafc; border: 1px solid #eef2f7; border-radius: 8px; padding: 0.85rem; margin-bottom: 1.5rem; }
.stat-item { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 0.45rem 0; border-bottom: 1px solid #eef2f7; font-size: 0.82rem; }
.stat-item:last-child { border-bottom: none; }
.stat-label { color: #64748b; }
.stat-value { font-weight: 750; color: #0f172a; font-variant-numeric: tabular-nums; }
.stat-item.success .stat-value { color: #059669; }
.stat-item.error .stat-value { color: #dc2626; }
.user-details { margin-top: 1.5rem; }
.details-list { background-color: #f8fafc; border: 1px solid #eef2f7; border-radius: 8px; padding: 0.85rem; max-height: 200px; overflow-y: auto; }
.detail-item { padding: 0.4rem 0; font-size: 0.8rem; border-bottom: 1px solid #eef2f7; font-family: 'Monaco', monospace; }
.detail-item:last-child { border-bottom: none; }
.more-users { color: #94a3b8; }

/* ===================== RESPONSIVO ===================== */
@media (max-width: 1280px) {
  .stats-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .panel-buttons { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 760px) {
  .content-area { padding: 1rem; }
  .page-header { align-items: stretch; flex-direction: column; }
  .header-actions, .header-actions .btn { width: 100%; justify-content: center; }
  .stats-strip { grid-template-columns: 1fr; }
  .panel-buttons { grid-template-columns: 1fr; }
  .table-controls { align-items: stretch; flex-direction: column; }
  .search-wrapper { max-width: none; }
  .status-filter-wrapper { align-items: flex-start; flex-direction: column; gap: 0.35rem; }
  .chip-row { width: 100%; }
  .chip { flex: 1 1 auto; justify-content: center; }
  .results-count { margin-left: 0; }
  .table-footer { align-items: stretch; flex-direction: column; text-align: center; }
  .pagination-controls { justify-content: center; }
  .table-wrapper { max-height: none; }
  .users-table th { position: static; }
}
</style>
