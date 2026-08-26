<!--
  Contas conectadas de um cliente, na visão do master.

  Antes só existia a tela do próprio cliente (/contas). O master via um botão de
  excluir lá, mas o backend resolvia o dono pelo token dele: desconectar a conta
  de um cliente devolvia 404 e só saía com SQL na mão em produção — foi assim que
  a conta duplicada MIMALE_SP teve de ser removida.

  Aqui os dois canais aparecem juntos e a exclusão usa as rotas de master, que
  levam o uid do cliente na URL.
-->
<template>
  <section class="accounts-panel">
    <header class="panel-header">
      <div>
        <span class="panel-eyebrow">Integrações</span>
        <h2 class="panel-title">Contas conectadas</h2>
        <p class="panel-subtitle">
          Contas de marketplace vinculadas a este cliente. Excluir aqui desconecta
          a conta, e as vendas já sincronizadas continuam no histórico.
        </p>
      </div>
      <button class="refresh-btn" type="button" :disabled="isLoadingAny" @click="reload">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="23 4 23 10 17 10"></polyline>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
        </svg>
        {{ isLoadingAny ? 'Carregando...' : 'Atualizar' }}
      </button>
    </header>

    <p v-if="error" class="panel-alert" role="alert">{{ error }}</p>

    <div v-if="isLoadingAny && !totalAccounts" class="panel-empty">Carregando contas...</div>

    <div v-else-if="!totalAccounts" class="panel-empty">
      Este cliente não tem nenhuma conta de marketplace conectada.
    </div>

    <template v-else>
      <div v-if="accounts.length" class="channel-block">
        <h3 class="channel-title">
          <span class="channel-badge channel-badge--ml">ML</span>
          Mercado Livre
          <span class="channel-count">{{ accounts.length }}</span>
        </h3>
        <ul class="account-list">
          <li v-for="account in accounts" :key="`ml-${account.user_id}`" class="account-card">
            <div class="account-info">
              <strong class="account-name">{{ account.nickname || 'Conta sem apelido' }}</strong>
              <span class="account-meta">ID {{ account.user_id }}</span>
              <span class="account-meta" v-if="account.connected_at">
                Conectada em {{ formatDate(account.connected_at) }}
              </span>
            </div>
            <div class="account-side">
              <span :class="['status-pill', account.status === 'active' ? 'status-pill--on' : 'status-pill--off']">
                {{ account.status === 'active' ? 'Ativa' : (account.status || 'Indefinida') }}
              </span>
              <button
                class="delete-btn"
                type="button"
                :disabled="removing === `ml-${account.user_id}`"
                @click="askRemove('ml', account.user_id, account.nickname || `ID ${account.user_id}`)"
              >
                {{ removing === `ml-${account.user_id}` ? 'Excluindo...' : 'Excluir' }}
              </button>
            </div>
          </li>
        </ul>
      </div>

      <div v-if="shopeeAccounts.length" class="channel-block">
        <h3 class="channel-title">
          <span class="channel-badge channel-badge--shopee">SH</span>
          Shopee
          <span class="channel-count">{{ shopeeAccounts.length }}</span>
        </h3>
        <ul class="account-list">
          <li v-for="account in shopeeAccounts" :key="`shopee-${account.shop_id}`" class="account-card account-card--shopee">
            <div class="account-info">
              <strong class="account-name">{{ account.shop_name || 'Loja sem nome' }}</strong>
              <span class="account-meta">ID {{ account.shop_id }}</span>
              <span class="account-meta" v-if="account.connected_at">
                Conectada em {{ formatDate(account.connected_at) }}
              </span>
            </div>
            <div class="account-side">
              <span :class="['status-pill', account.status === 'active' ? 'status-pill--on' : 'status-pill--off']">
                {{ account.status === 'active' ? 'Ativa' : (account.status || 'Indefinida') }}
              </span>
              <button
                class="delete-btn"
                type="button"
                :disabled="removing === `shopee-${account.shop_id}`"
                @click="askRemove('shopee', account.shop_id, account.shop_name || `ID ${account.shop_id}`)"
              >
                {{ removing === `shopee-${account.shop_id}` ? 'Excluindo...' : 'Excluir' }}
              </button>
            </div>
          </li>
        </ul>
      </div>
    </template>

    <ToastNotification
      :is-visible="toast.visible"
      :title="toast.title"
      :description="toast.description"
      :type="toast.type"
      @close="toast.visible = false"
    />
  </section>
</template>

<script setup>
// `defineProps` importado de propósito: a configuração do eslint deste projeto
// não reconhece as macros do <script setup> como globais.
import { ref, toRefs, onUnmounted, defineProps } from 'vue';
import ToastNotification from '../components/ToastNotification.vue';
import { useUserAccounts } from '@/composables/useUserAccounts';
import { useConfirm } from '@/composables/useConfirm';

const props = defineProps({
  userId: { type: String, required: true },
});

const userIdRef = toRefs(props).userId;
// `shopee: true`: este painel é o único lugar que precisa dos dois canais.
const {
  accounts,
  shopeeAccounts,
  isLoadingAny,
  totalAccounts,
  error,
  fetchAllAccounts,
  removeAccount,
} = useUserAccounts(userIdRef, { shopee: true });

const { confirm } = useConfirm();

const removing = ref('');
const toast = ref({ visible: false, title: '', description: '', type: 'success' });
let toastTimer = null;

const mostrar = (description, type = 'success') => {
  toast.value = {
    visible: true,
    title: type === 'error' ? 'Não foi possível excluir' : 'Conta desconectada',
    description,
    type,
  };
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.value.visible = false; }, 5000);
};

onUnmounted(() => {
  if (toastTimer) clearTimeout(toastTimer);
});

const reload = () => fetchAllAccounts(props.userId);

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/**
 * Confirma antes de excluir, com o nome da conta no texto.
 *
 * Reconectar exige passar pelo OAuth do marketplace de novo, então a
 * confirmação diz isso em vez de um "tem certeza?" genérico.
 */
const askRemove = async (platform, accountId, label) => {
  const canal = platform === 'shopee' ? 'loja Shopee' : 'conta do Mercado Livre';
  const ok = await confirm({
    title: 'Desconectar conta',
    message: `Excluir a ${canal} "${label}" deste cliente?`,
    detail: 'As vendas já sincronizadas permanecem no histórico. Para voltar a sincronizar, o cliente precisa conectar a conta novamente pelo marketplace.',
    confirmText: 'Sim, excluir',
    tone: 'danger',
  });
  if (!ok) return;

  removing.value = `${platform}-${accountId}`;
  const result = await removeAccount(platform, accountId);
  removing.value = '';
  mostrar(result.message, result.success ? 'success' : 'error');
};
</script>

<style scoped>
.accounts-panel {
  background: #fff;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 14px;
  padding: 1.5rem;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
}

.panel-eyebrow {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}

.panel-title {
  margin: 0.2rem 0 0.35rem;
  font-size: 1.2rem;
  color: #0f172a;
}

.panel-subtitle {
  margin: 0;
  max-width: 62ch;
  font-size: 0.86rem;
  line-height: 1.45;
  color: #64748b;
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 0.9rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
  color: #334155;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}
.refresh-btn:hover:not(:disabled) { background: #f1f5f9; }
.refresh-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.panel-alert {
  margin: 0 0 1rem;
  padding: 0.7rem 0.9rem;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 0.85rem;
}

.panel-empty {
  padding: 2rem 1rem;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  text-align: center;
  color: #64748b;
  font-size: 0.9rem;
}

.channel-block + .channel-block { margin-top: 1.5rem; }

.channel-title {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin: 0 0 0.75rem;
  font-size: 0.95rem;
  color: #0f172a;
}

.channel-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 22px;
  border-radius: 5px;
  font-size: 0.68rem;
  font-weight: 800;
  color: #422006;
}
.channel-badge--ml { background: #ffe600; }
.channel-badge--shopee { background: #ee4d2d; color: #fff; }

.channel-count {
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  background: #eef2f7;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 700;
}

.account-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.7rem;
}

.account-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 0.9rem 1rem;
  border: 1px solid #e2e8f0;
  border-left: 4px solid #ffe600;
  border-radius: 10px;
  background: #fcfdff;
}
.account-card--shopee { border-left-color: #ee4d2d; }

.account-info { display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }
.account-name { font-size: 0.95rem; color: #0f172a; word-break: break-word; }
.account-meta { font-size: 0.78rem; color: #64748b; }

.account-side { display: flex; align-items: center; gap: 0.6rem; }

.status-pill {
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.status-pill--on { background: #dcfce7; color: #15803d; }
.status-pill--off { background: #fee2e2; color: #b91c1c; }

.delete-btn {
  padding: 0.45rem 0.85rem;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fff;
  color: #b91c1c;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}
.delete-btn:hover:not(:disabled) { background: #fef2f2; }
.delete-btn:disabled { opacity: 0.6; cursor: not-allowed; }

@media (max-width: 640px) {
  .account-card { align-items: flex-start; }
  .account-side { width: 100%; justify-content: space-between; }
}
</style>
