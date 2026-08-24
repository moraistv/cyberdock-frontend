<template>
  <header class="topbar" role="banner">
    <!-- Recolher no desktop, abrir a gaveta no mobile. No mobile é o único
         caminho para o menu, que fica fora da tela. -->
    <button
      type="button"
      class="menu-toggle"
      :title="menuToggleLabel"
      :aria-label="menuToggleLabel"
      @click="toggleSidebar"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="19" height="19">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>

    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <router-link
        v-for="(crumb, index) in breadcrumbs"
        :key="index"
        :to="crumb.path"
        class="breadcrumb-link"
      >
        <span class="breadcrumb-text">{{ crumb.name }}</span>
        <span v-if="index < breadcrumbs.length - 1" class="breadcrumb-separator">/</span>
      </router-link>
    </nav>

    <div class="actions">
      <!-- Modo admin: um botão só, que alterna e deixa claro o estado atual.
           Antes eram dois botões de texto, sem indicar em que modo você está. -->
      <button
        v-if="userRole === 'master'"
        @click="isAdminMode ? exitAdminMode() : enterAdminMode()"
        class="admin-switch"
        :class="{ 'is-on': isAdminMode }"
        type="button"
        :title="isAdminMode ? 'Voltar para a visão de cliente' : 'Entrar no modo administrador'"
      >
        <span class="admin-switch__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15">
            <path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1-8.5 15a12 12 0 0 1-8.5-15a12 12 0 0 0 8.5-3" />
            <path d="M12 11m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0" />
            <path d="M12 12l0 2.5" />
          </svg>
        </span>
        <span class="admin-switch__text">{{ isAdminMode ? 'Modo Admin' : 'Admin' }}</span>
        <span class="admin-switch__led" aria-hidden="true"></span>
      </button>

      <!-- Avatar -->
      <div class="avatar-wrap" ref="avatarWrap">
        <button
          class="avatar-btn"
          :aria-expanded="isDropdownOpen ? 'true' : 'false'"
          aria-haspopup="menu"
          @click="onAvatarClick"
          @keydown.down.prevent="openDropdown"
          @keydown.escape.prevent="closeDropdown"
          type="button"
        >
          <span
            class="avatar"
            :style="avatarStyle"
            aria-hidden="true"
            ref="avatarEl"
          >
            {{ userInitials }}
          </span>
          <span class="sr-only">Abrir menu do usuário</span>
        </button>

        <transition @before-enter="beforeEnter" @enter="enter" @leave="leave">
          <div
            v-if="isDropdownOpen"
            class="dropdown"
            role="menu"
            tabindex="-1"
            ref="dropdownEl"
          >
            <router-link to="/profile" class="dropdown-item" role="menuitem" @click="closeDropdown">
              Perfil
            </router-link>
            <button class="dropdown-item" role="menuitem" @click="logoutAndClose">
              Sair
            </button>
          </div>
        </transition>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { gsap } from 'gsap';
import { useAuth } from '@/composables/useAuth';
import { useAdminMode } from '@/composables/useAdminMode';
import { useSidebar } from '@/composables/useSidebar';

const router = useRouter();
const route = useRoute();
const { user, userRole, logout, refreshUserData } = useAuth();
const { isAdminMode, setAdminMode } = useAdminMode();
const { isMobile, isIconOnly, isMobileOpen, toggle: toggleSidebar } = useSidebar();

const menuToggleLabel = computed(() => {
  if (isMobile.value) return isMobileOpen.value ? 'Fechar menu' : 'Abrir menu';
  return isIconOnly.value ? 'Expandir menu' : 'Recolher menu';
});

const isDropdownOpen = ref(false);
const avatarWrap = ref(null);
const avatarEl = ref(null);
const dropdownEl = ref(null);

onMounted(async () => {
  if (user.value) await refreshUserData();
  if (avatarEl.value) {
    gsap.fromTo(
      avatarEl.value,
      { opacity: 0, y: -6, scale: 0.92 },
      { opacity: 1, y: 0, scale: 1, duration: 0.28, ease: 'power2.out', delay: 0.05 }
    );
  }
  document.addEventListener('click', handleOutsideClick, { capture: true });
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick, { capture: true });
});

watch(() => route.path, (path) => {
  setAdminMode(path.startsWith('/admin') || path.startsWith('/master'));
}, { immediate: true });

// ===== Avatar (iniciais, cor e animação) =====
const userInitials = computed(() => {
  if (!user.value) return 'U';
  const base = (user.value.name || user.value.displayName || user.value.email || '').trim();
  if (!base) return 'U';
  const parts = base.replace(/\s+/g, ' ').split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (base.includes('@')) return base[0].toUpperCase();
  return base[0].toUpperCase();
});

function hashHsl(str) {
  if (!str) return { h1: 230, h2: 260, s: 65, l1: 58, l2: 45 };
  const code = Array.from(str).reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const h1 = code % 360;
  const h2 = (code >> 3) % 360;
  return { h1, h2, s: 70, l1: 62, l2: 48 };
}

const avatarStyle = computed(() => {
  const base = user.value?.name || user.value?.displayName || user.value?.email || 'user';
  const { h1, h2, s, l1, l2 } = hashHsl(base);
  return {
    background: `linear-gradient(135deg, hsl(${h1} ${s}% ${l1}%) 0%, hsl(${h2} ${s}% ${l2}%) 100%)`,
  };
});

// ===== Breadcrumbs =====
const breadcrumbs = computed(() => {
  const map = {
    '/dashboard': 'Dashboard',
    '/tabela-vendas': 'Tabela de Vendas',
    '/contas': 'Contas',
    '/armazenamento': 'Armazenamento',
    '/resumo-cobranca': 'Resumo de Cobrança',
    '/profile': 'Perfil',
    '/admin': 'Painel Administrativo',
    '/admin/users': 'Usuários',
    '/master/servicos-avulsos': 'Histórico de Serviços' // ROTA ADICIONADA
  };
  const parts = route.path.split('/').filter(Boolean);
  let current = '';
  return parts.map((p) => {
    current += `/${p}`;
    return { name: map[current] || p, path: current };
  });
});

// ===== Dropdown controls =====
const openDropdown = () => (isDropdownOpen.value = true);
const closeDropdown = () => (isDropdownOpen.value = false);
const onAvatarClick = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
  if (avatarEl.value) {
    gsap.fromTo(
      avatarEl.value,
      { scale: 1 },
      { scale: 0.96, duration: 0.08, yoyo: true, repeat: 1, ease: 'power1.inOut' }
    );
  }
};
const logoutAndClose = () => { closeDropdown(); logout(); };

function handleOutsideClick(ev) {
  if (avatarWrap.value && !avatarWrap.value.contains(ev.target)) {
    closeDropdown();
  }
}

// ===== Admin actions =====
// Entra pelo dashboard master, não pelo tabelão: a visão geral vem primeiro.
const enterAdminMode = () => { setAdminMode(true); router.push('/admin/dashboard'); };
const exitAdminMode = () => { setAdminMode(false); router.push('/dashboard'); };

// ===== Dropdown animation =====
const beforeEnter = (el) => { gsap.set(el, { opacity: 0, y: -6, scale: 0.98 }); };
const enter = (el, done) => { gsap.to(el, { opacity: 1, y: 0, scale: 1, duration: 0.18, ease: 'power2.out', onComplete: done }); };
const leave = (el, done) => { gsap.to(el, { opacity: 0, y: -6, scale: 0.98, duration: 0.14, ease: 'power2.in', onComplete: done }); };
</script>

<style scoped>
.topbar{
  --border:#e5e7eb;
  --muted:#6b7280;
  --link:#2563eb;
  --link-hover:#1d4ed8;
  --bg:#ffffff;

  position: sticky; top: 0; z-index: 40;
  display: flex; align-items: center; justify-content: space-between;
  gap: .75rem;
  height: 56px;
  padding: 0 .875rem;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
  font-family: var(--font-sans);
}
.breadcrumbs{
  display: flex; align-items: center; min-width: 0; overflow: hidden;
  font-size: .875rem; color: var(--muted); font-weight: 500;
}
.breadcrumb-link{
  display: inline-flex; align-items: center; gap:.5rem;
  color: var(--link); text-decoration: none; white-space: nowrap;
}
.breadcrumb-link:hover{ color: var(--link-hover); }
.breadcrumb-text{ max-width: 22ch; overflow: hidden; text-overflow: ellipsis; }
.breadcrumb-separator{ margin: 0 .5rem; color: #9ca3af; user-select: none; }
.actions{ display:flex; align-items:center; gap:.5rem; }

/* Botão do menu, à esquerda do breadcrumb */
.menu-toggle{
  display:inline-flex; align-items:center; justify-content:center;
  flex:0 0 auto; width:34px; height:34px; margin-right:.15rem; padding:0;
  color:#4b5563; border:1px solid var(--border); border-radius:.5rem;
  background:#fff; cursor:pointer;
  transition: color .2s ease, background .2s ease, border-color .2s ease;
}
.menu-toggle:hover{ color: var(--cd-blue-700, #0369a1); border-color:#b9d3e3; background: var(--cd-blue-50, #f0f9ff); }
.menu-toggle:active{ transform: translateY(1px); }

/* Interruptor do modo admin: um controle só, com estado visível */
.admin-switch{
  display:inline-flex; align-items:center; gap:.4rem;
  height:32px; padding:0 .7rem; border-radius:999px;
  border:1px solid var(--border); background:#fff; color:#4b5563;
  font-size:.82rem; font-weight:650; cursor:pointer; white-space:nowrap;
  transition: color .2s ease, background .2s ease, border-color .2s ease, box-shadow .2s ease;
}
.admin-switch:hover{ border-color:#c7d2fe; background:#f8faff; color:#111827; }
.admin-switch__icon{ display:inline-flex; align-items:center; }
.admin-switch__led{
  width:7px; height:7px; border-radius:50%;
  background:#cbd5e1; box-shadow:none;
  transition: background .2s ease, box-shadow .2s ease;
}
/* Ligado: cor cheia e led aceso, para não haver dúvida do modo atual */
.admin-switch.is-on{
  color:#fff; border-color:transparent;
  background: linear-gradient(140deg, #4338ca, #6366f1);
  box-shadow: 0 4px 14px rgba(79, 70, 229, .28);
}
.admin-switch.is-on:hover{ background: linear-gradient(140deg, #3730a3, #4f46e5); color:#fff; }
.admin-switch.is-on .admin-switch__led{ background:#a5f3fc; box-shadow:0 0 0 3px rgba(165,243,252,.28); }

@media (max-width: 640px) {
  /* Em tela estreita o rótulo sai e fica só o escudo com o led. */
  .admin-switch__text{ display:none; }
  .admin-switch{ padding:0 .5rem; }
}

.btn-ghost{
  height: 32px; padding: 0 .75rem; border-radius: 999px;
  border: 1px solid var(--border); background: #fff; color:#111827;
  font-weight: 600; font-size: .75rem; line-height: 1;
  transition: transform .06s ease, background .2s ease, border-color .2s ease;
}
.btn-ghost:hover{ background:#f9fafb; border-color:#d1d5db; }
.btn-ghost:active{ transform: translateY(1px); }
.btn-ghost.danger{ color:#b91c1c; }
.avatar-wrap{ position: relative; display:flex; align-items:center; }
.avatar-btn{
  position: relative;
  display:flex; align-items:center; justify-content:center;
  width: 36px; height: 36px; padding:0; border:0; background: transparent; cursor: pointer;
  border-radius: 999px;
  outline: none;
}
.avatar-btn:focus-visible{ box-shadow: 0 0 0 3px rgba(37,99,235,.25); border-radius: 999px; }
.avatar{
  width: 36px; height: 36px; border-radius: 999px;
  color: #fff; font-weight: 700; font-size: .95rem;
  display:flex; align-items:center; justify-content:center;
  letter-spacing: .5px; text-transform: uppercase;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.25), 0 1px 2px rgba(0,0,0,.06);
}
.dropdown{
  position: absolute; top: calc(100% + 8px); right: 0;
  width: 180px;
  background: #fff; border: 1px solid var(--border);
  border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,.08);
  padding: .375rem; z-index: 50;
}
.dropdown-item{
  width: 100%; display:block; text-align:left;
  background: transparent; border: 0; cursor: pointer;
  padding: .5rem .625rem; border-radius: 8px;
  color:#111827; font-weight: 600; font-size: .85rem;
}
.dropdown-item:hover{ background:#f3f4f6; }
.sr-only{ position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
</style>
