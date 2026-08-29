<template>
  <Teleport to="body">
    <Transition @enter="onEnter" @leave="onLeave" :css="false">
      <div
        v-if="openComputed"
        class="modal-overlay"
        :style="{ zIndex: String(zIndex) }"
        @mousedown.self="onBackdropPointerDown"
        @mouseup.self="onBackdropPointerUp"
        @click.self="onOverlayClick"
      >
        <div
          ref="dialog"
          class="modal-content"
          :class="sizeClass"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleIdAttr"
          :aria-describedby="descriptionIdAttr"
        >
          <!-- Header (slotável) -->
          <div class="modal-header" v-if="$slots.header || title">
            <slot name="header">
              <h2 :id="titleId" class="modal-title">{{ title }}</h2>
              <button
                v-if="showCloseButton"
                @click="requestClose('button')"
                class="close-button"
                type="button"
                aria-label="Fechar modal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                     viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </slot>
          </div>

          <!-- Body -->
          <div class="modal-body" :id="descriptionId">
            <slot />
          </div>

          <!-- Footer opcional -->
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </div>

          <!-- Sentinelas para trap de foco -->
          <span ref="sentinelStart" tabindex="0" class="sr-only" @focus="focusLast"></span>
          <span ref="sentinelEnd" tabindex="0" class="sr-only" @focus="focusFirst"></span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
/* ──────────────────────────────────────────────────────────────────────────
 * Estado COMPARTILHADO entre todas as instâncias de UniversalModal.
 *
 * Fica NESTE bloco, e não no <script setup>, de propósito: tudo que está no
 * <script setup> é compilado para dentro de setup() e portanto vira estado por
 * instância. Um contador por instância não coordena nada — foi exatamente esse
 * o defeito. Este bloco roda uma única vez, na avaliação do módulo.
 *
 * A coordenação é necessária porque o componente é teleportado para o body:
 * duas instâncias abertas disputam o mesmo `document.body` e o mesmo listener
 * de teclado, e nenhuma delas sabe da outra. O sistema empilha modais em vários
 * fluxos — KitFormModal é renderizada DENTRO do slot de KitManagementModal,
 * PackageTypeSelectModal abre sobre SkuFormModal, e o ConfirmDialog global abre
 * sobre qualquer um.
 * ────────────────────────────────────────────────────────────────────────── */

/* Pilha de instâncias abertas, na ordem em que abriram. O último é o do topo. */
const openInstances = []

/* Trava de rolagem do body, por CONTAGEM e não por instância.
 *
 * O modelo anterior era por instância: cada modal guardava o
 * `body.style.overflow` que ELE viu ao abrir e regravava esse valor ao fechar.
 * Com dois modais na tela, o de dentro capturava 'hidden' — valor sujo, deixado
 * pelo de fora — e, se fechasse por último, regravava 'hidden' no body. Aí não
 * havia mais modal nenhum na tela e a página não rolava mais: era exatamente o
 * que acontecia ao criar SKU ou kit, onde a página fica clicável mas sem rolar.
 *
 * A ordem de fechamento deixa de importar quando o valor original é capturado
 * uma única vez (0 -> 1) e restaurado uma única vez (1 -> 0).
 */
let lockCount = 0
let savedOverflow = ''
let savedPaddingRight = ''

function acquireBodyLock() {
  lockCount += 1
  // Já havia modal travando: o body está no estado certo e o valor original
  // guardado é o de quem travou primeiro. Não tocar em nada.
  if (lockCount > 1) return

  const body = document.body
  savedOverflow = body.style.overflow
  savedPaddingRight = body.style.paddingRight
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
  body.style.overflow = 'hidden'
  if (scrollbarWidth > 0) {
    const current = parseFloat(getComputedStyle(body).paddingRight || '0')
    body.style.paddingRight = `${current + scrollbarWidth}px`
  }
}

function releaseBodyLock() {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount > 0) return

  const body = document.body
  body.style.overflow = savedOverflow
  body.style.paddingRight = savedPaddingRight
  savedOverflow = ''
  savedPaddingRight = ''
}
</script>

<script setup>

/* global defineProps, defineEmits, defineExpose */

import { computed, onBeforeUnmount, onMounted, ref, watch, nextTick } from 'vue'
import gsap from 'gsap'

/* Props (JS) */
const props = defineProps({
  open: { type: Boolean, default: undefined }, // v-model:open
  isOpen: { type: Boolean, default: undefined }, // compat
  title: { type: String, default: 'Título do Modal' },
  ariaLabel: { type: String, default: '' },
  closeOnEsc: { type: Boolean, default: true },
  closeOnOverlay: { type: Boolean, default: true },
  preventClose: { type: Boolean, default: false },
  lockScroll: { type: Boolean, default: true },
  trapFocus: { type: Boolean, default: true },
  initialFocus: { type: String, default: '' },
  showCloseButton: { type: Boolean, default: true },
  size: { type: String, default: 'md' }, // 'sm'|'md'|'lg'|'xl'|'full'
  zIndex: { type: Number, default: 9999 }
})

const emit = defineEmits(['update:open', 'close', 'after-open', 'after-close'])

/* Refs e IDs estáveis */
const dialog = ref(null)
const sentinelStart = ref(null)
const sentinelEnd = ref(null)
const previouslyFocused = ref(null)
const overlayPointerDownOnSelf = ref(false)

/* Identidade desta instância na pilha e se ela detém uma unidade da trava.
 * `holdsLock` é o que torna lock/unlock idempotentes: o watcher com
 * `immediate: true`, o onMounted e o onBeforeUnmount podem chamar os dois em
 * sequência, e sem esse controle o contador dessincronizaria. */
const instanceId = Symbol('universal-modal')
let holdsLock = false

const uid = Math.random().toString(36).slice(2, 9)
const titleId = `modal-title-${uid}`
const descriptionId = `modal-desc-${uid}`
const titleIdAttr = computed(() => (props.title ? titleId : undefined))
const descriptionIdAttr = computed(() => descriptionId)

/* v-model (fallback para isOpen) */
const openComputed = computed({
  get() {
    // Defensive check to prevent null access issues
    if (props === null || props === undefined) return false
    if (typeof props.open === 'boolean') return props.open
    return !!props.isOpen
  },
  set(v) {
    emit('update:open', v)
  }
})

/* Classes de tamanho */
const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'modal--sm'
    case 'md': return 'modal--md'
    case 'lg': return 'modal--lg'
    case 'xl': return 'modal--xl'
    case 'full': return 'modal--full'
    default: return 'modal--md'
  }
})

/* Focusables util */
const FOCUS_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

function getFocusableElements(root) {
  if (!root) return []
  return Array.from(root.querySelectorAll(FOCUS_SELECTOR))
    .filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'))
}

/* Ações de fechar */
function requestClose(reason) {
  if (props.preventClose) return
  openComputed.value = false
  emit('close', reason)
}

function onOverlayClick() {
  if (!props.closeOnOverlay) return
  if (overlayPointerDownOnSelf.value) requestClose('overlay')
}
function onBackdropPointerDown() { overlayPointerDownOnSelf.value = true }
function onBackdropPointerUp() { requestAnimationFrame(() => { overlayPointerDownOnSelf.value = false }) }

/* Keydown: ESC + trap de foco */
function onKeydown(e) {
  if (!openComputed.value) return

  /* Só o modal do topo responde ao teclado.
   *
   * O listener é registrado em `document` na fase de captura por CADA instância
   * aberta. Com dois na tela, os dois handlers rodavam: um ESC fechava a pilha
   * inteira (o formulário de kit e a gestão de kits junto) e o trap de foco do
   * de baixo disputava o Tab com o de cima. */
  if (!isTopmost()) return

  if (props.closeOnEsc && e.key === 'Escape') {
    e.stopPropagation()
    e.preventDefault()
    requestClose('esc')
  }
  if (props.trapFocus && e.key === 'Tab' && dialog.value) {
    const focusables = getFocusableElements(dialog.value)
    if (focusables.length === 0) { e.preventDefault(); return }
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    const active = document.activeElement

    if (e.shiftKey) {
      if (active === first || active === dialog.value) { e.preventDefault(); last.focus() }
    } else {
      if (active === last) { e.preventDefault(); first.focus() }
    }
  }
}

/* Foco inicial/último */
function focusFirst() {
  if (!dialog.value) return
  const target = props.initialFocus
    ? dialog.value.querySelector(props.initialFocus)
    : getFocusableElements(dialog.value)[0] || dialog.value
  target && target.focus && target.focus()
}
function focusLast() {
  if (!dialog.value) return
  const focusables = getFocusableElements(dialog.value)
  const target = focusables[focusables.length - 1] || dialog.value
  target && target.focus && target.focus()
}

/* Trava de rolagem: esta instância pega e devolve UMA unidade do contador
 * compartilhado. A conta em si está no <script> do topo do arquivo. */
function lockBodyScroll() {
  if (!props.lockScroll || holdsLock) return
  holdsLock = true
  acquireBodyLock()
}

function unlockBodyScroll() {
  /* Sem `holdsLock` não há o que devolver, e é isso que impede o contador de
   * dessincronizar quando lock/unlock são chamados mais de uma vez pelo mesmo
   * modal (o watcher `immediate`, o onMounted e o onBeforeUnmount se sobrepõem).
   *
   * Também corrige um efeito colateral do `immediate: true`: montar com o modal
   * FECHADO caía no ramo do else e destravava o body de um modal que estava
   * aberto. A tela de armazenamento monta nove instâncias, então isso acontecia
   * nove vezes a cada visita. */
  if (!holdsLock) return
  holdsLock = false
  releaseBodyLock()
}

/* Entrada e saída da pilha de instâncias abertas. */
function pushInstance() {
  if (!openInstances.includes(instanceId)) openInstances.push(instanceId)
}
function popInstance() {
  const i = openInstances.indexOf(instanceId)
  if (i !== -1) openInstances.splice(i, 1)
}
function isTopmost() {
  return openInstances[openInstances.length - 1] === instanceId
}

/* Reagir à abertura/fechamento */
watch(() => openComputed.value, async (open) => {
  if (open) {
    previouslyFocused.value = document.activeElement
    document.addEventListener('keydown', onKeydown, true)
    pushInstance()
    lockBodyScroll()
    await nextTick()
    focusFirst()
    emit('after-open')
  } else {
    document.removeEventListener('keydown', onKeydown, true)
    popInstance()
    unlockBodyScroll()
    previouslyFocused.value && previouslyFocused.value.focus && previouslyFocused.value.focus()
    emit('after-close')
  }
}, { immediate: true })

/* Lifecycle */
onMounted(() => {
  if (openComputed.value) {
    document.addEventListener('keydown', onKeydown, true)
    pushInstance()
    lockBodyScroll()
    nextTick(() => focusFirst())
  }
})

/* Desmontar conta como fechar.
 *
 * KitManagementModal é renderizada com `v-if` e leva KitFormModal dentro dela:
 * fechar a de fora destrói as duas ainda abertas, e o Vue roda o
 * onBeforeUnmount de fora para dentro. É a ordem que prendia o body no modelo
 * antigo — com o contador, a ordem passa a ser irrelevante. */
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown, true)
  popInstance()
  unlockBodyScroll()
})

/* GSAP transitions */
function onEnter(el, done) {
  const container = el
  const modalContent = container.querySelector('.modal-content')
  const tl = gsap.timeline({ onComplete: done })
  tl.fromTo(container, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.22, ease: 'power2.out' })
    .fromTo(
      modalContent,
      { autoAlpha: 0, scale: 0.97, y: 12 },
      { autoAlpha: 1, scale: 1, y: 0, duration: 0.26, ease: 'power2.out' },
      '-=0.08'
    )
}
function onLeave(el, done) {
  const container = el
  const modalContent = container.querySelector('.modal-content')
  const tl = gsap.timeline({ onComplete: done })
  tl.to(modalContent, { autoAlpha: 0, scale: 0.97, y: 12, duration: 0.18, ease: 'power1.in' })
    .to(container, { autoAlpha: 0, duration: 0.16, ease: 'power1.inOut' }, '-=0.08')
}

/* Expor API opcional */
function close() { requestClose('programmatic') }
defineExpose({ close, focusFirst, focusLast })
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(10, 20, 30, 0.7);
}

.modal-content {
  background: #ffffff;
  width: 100%;
  max-height: calc(100vh - 2rem);
  overflow: auto;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 20px 60px rgba(2, 6, 23, 0.18);
}

/* Tamanhos */
.modal--sm { max-width: 420px; }
.modal--md { max-width: 560px; }
.modal--lg { max-width: 720px; }
.modal--xl { max-width: 900px; }
.modal--full { max-width: min(100vw, 1100px); width: 100%; }

/* Header */
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
}
.modal-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
}
.close-button {
  background: transparent; border: none; cursor: pointer;
  padding: 0.5rem; margin: -0.25rem; border-radius: 8px; color: #6b7280;
  transition: background-color .2s, color .2s;
}
.close-button:hover { background-color: rgba(59, 130, 246, 0.08); color: #0f172a; }

/* Body e Footer */
.modal-body { padding: 1rem 1.25rem 1.25rem; color: #374151; line-height: 1.55; }
.modal-footer {
  display: flex; gap: .5rem; justify-content: flex-end;
  padding: 0.75rem 1.25rem 1.25rem;
  border-top: 1px solid #e5e7eb;
}

/* Acessibilidade visual */
.sr-only {
  position: absolute !important;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,0,0);
  white-space: nowrap; border: 0;
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
</style>
