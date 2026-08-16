<template>
  <UniversalModal
    :open="isOpen"
    :title="request?.title || 'Confirmar ação'"
    size="sm"
    :close-on-overlay="true"
    :close-on-esc="true"
    @close="cancel"
  >
    <div class="confirm-body">
      <span class="confirm-mark" :class="`confirm-mark--${request?.tone || 'danger'}`" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round">
          <path v-if="request?.tone === 'primary'" d="M12 16v-4M12 8h.01" />
          <circle v-if="request?.tone === 'primary'" cx="12" cy="12" r="9" />
          <template v-else>
            <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </template>
        </svg>
      </span>

      <div class="confirm-text">
        <p class="confirm-message">{{ request?.message }}</p>
        <p v-if="request?.detail" class="confirm-detail">{{ request.detail }}</p>
      </div>
    </div>

    <template #footer>
      <div class="confirm-actions">
        <button type="button" class="confirm-btn confirm-btn--ghost" @click="cancel">
          {{ request?.cancelText || 'Cancelar' }}
        </button>
        <button
          ref="confirmButton"
          type="button"
          class="confirm-btn"
          :class="request?.tone === 'primary' ? 'confirm-btn--primary' : 'confirm-btn--danger'"
          @click="accept"
        >
          {{ request?.confirmText || 'Confirmar' }}
        </button>
      </div>
    </template>
  </UniversalModal>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue';
import UniversalModal from './UniversalModal.vue';
import { useConfirmState } from '@/composables/useConfirm';

const { request, accept, cancel } = useConfirmState();
const isOpen = computed(() => request.value !== null);
const confirmButton = ref(null);

// O botão de confirmação recebe foco: permite responder com Enter, como o
// diálogo nativo permitia.
watch(isOpen, async (open) => {
  if (!open) return;
  await nextTick();
  confirmButton.value?.focus();
});
</script>

<style scoped>
.confirm-body { display: flex; gap: 0.875rem; align-items: flex-start; }

.confirm-mark {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 999px;
}
.confirm-mark svg { width: 1.375rem; height: 1.375rem; }
.confirm-mark--danger { background: var(--cd-danger-bg, #fee2e2); color: var(--cd-danger, #dc2626); }
.confirm-mark--primary { background: var(--cd-blue-100, #e0f2fe); color: var(--cd-blue-700, #0369a1); }

.confirm-text { min-width: 0; }
.confirm-message {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.5;
  color: var(--cd-ink, #0f172a);
  overflow-wrap: anywhere;
}
.confirm-detail {
  margin: 0.5rem 0 0;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--cd-muted, #64748b);
}

.confirm-actions { display: flex; justify-content: flex-end; gap: 0.625rem; }
.confirm-btn {
  padding: 0.55rem 1.1rem;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: filter 0.15s ease, background-color 0.15s ease;
}
.confirm-btn:focus-visible { outline: 2px solid var(--cd-blue-600, #0284c7); outline-offset: 2px; }
.confirm-btn--ghost {
  background: var(--cd-surface, #fff);
  border-color: var(--cd-line, #dbe7f0);
  color: var(--cd-ink, #0f172a);
}
.confirm-btn--ghost:hover { background: var(--cd-bg, #f4f8fb); }
.confirm-btn--danger { background: var(--cd-danger, #dc2626); color: #fff; }
.confirm-btn--primary { background: var(--cd-blue-700, #0369a1); color: #fff; }
.confirm-btn--danger:hover, .confirm-btn--primary:hover { filter: brightness(0.94); }
</style>
