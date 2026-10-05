<template>
  <div class="field">
    <div class="field__top">
      <label class="field__label" :for="inputId">{{ label }}</label>

      <div class="field__control">
        <button
          type="button"
          class="field__step"
          :aria-label="`Diminuir ${label}`"
          :disabled="modelValue <= min"
          @click="bump(-1)"
        >
          <LandingIcon name="minus" />
        </button>

        <input
          :id="inputId"
          class="field__input"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          spellcheck="false"
          :value="draft"
          :aria-describedby="hint ? hintId : null"
          @focus="editing = true"
          @input="onInput"
          @blur="commit"
          @keydown.enter.prevent="commit"
          @keydown.up.prevent="bump(1)"
          @keydown.down.prevent="bump(-1)"
        >

        <span v-if="unit" class="field__unit" aria-hidden="true">{{ unit }}</span>

        <button
          type="button"
          class="field__step"
          :aria-label="`Aumentar ${label}`"
          :disabled="modelValue >= max"
          @click="bump(1)"
        >
          <LandingIcon name="plus" />
        </button>
      </div>
    </div>

    <input
      class="field__range"
      type="range"
      :min="min"
      :max="top"
      :step="step"
      :value="Math.min(modelValue, top)"
      :aria-label="`${label}: controle deslizante`"
      :aria-valuetext="valueText"
      :style="{ '--fill': fill }"
      @input="onRange"
    >

    <p v-if="hint" :id="hintId" class="field__hint">{{ hint }}</p>
  </div>
</template>

<script setup>
/* global defineProps, defineEmits */
import { computed, ref, watch } from 'vue';

import LandingIcon from '@/components/landing/LandingIcon.vue';
import { formatInteger } from '@/utils/pricing';

const props = defineProps({
  modelValue: { type: Number, required: true },
  id: { type: String, required: true },
  label: { type: String, required: true },
  unit: { type: String, default: '' },
  min: { type: Number, default: 0 },
  max: { type: Number, required: true },
  /** Fim da régua. Pode ser menor que `max`: o campo numérico aceita valores maiores. */
  sliderMax: { type: Number, default: 0 },
  step: { type: Number, default: 1 },
  hint: { type: String, default: '' },
});

const emit = defineEmits(['update:modelValue']);

const inputId = computed(() => `${props.id}-numero`);
const hintId = computed(() => `${props.id}-dica`);
const top = computed(() => (props.sliderMax > 0 ? Math.min(props.sliderMax, props.max) : props.max));

const clamp = (value) => Math.min(props.max, Math.max(props.min, value));

const fill = computed(() => {
  const span = top.value - props.min;
  if (span <= 0) return '0%';
  const ratio = (Math.min(props.modelValue, top.value) - props.min) / span;
  return `${Math.min(1, Math.max(0, ratio)) * 100}%`;
});

const valueText = computed(() => `${formatInteger(props.modelValue)}${props.unit ? ` ${props.unit}` : ''}`);

/* `draft` é o texto do campo. Enquanto a pessoa digita, ele manda; ao sair do
 * campo, volta a refletir o valor validado. */
const draft = ref(String(props.modelValue));
const editing = ref(false);

watch(() => props.modelValue, (value) => {
  if (!editing.value) draft.value = String(value);
});

function onInput(event) {
  const digits = event.target.value.replace(/\D/g, '').slice(0, 7);
  draft.value = digits;
  event.target.value = digits;
  if (digits === '') return;

  const next = clamp(parseInt(digits, 10));
  if (String(next) !== digits) {
    draft.value = String(next);
    event.target.value = draft.value;
  }
  emit('update:modelValue', next);
}

function commit() {
  editing.value = false;
  const next = draft.value === '' ? props.modelValue : clamp(parseInt(draft.value, 10));
  draft.value = String(next);
  emit('update:modelValue', next);
}

function bump(direction) {
  emit('update:modelValue', clamp(props.modelValue + direction * props.step));
}

function onRange(event) {
  emit('update:modelValue', clamp(Number(event.target.value)));
}
</script>

<style scoped>
.field {
  display: grid;
  gap: 8px;
}

.field__top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px 16px;
}

.field__label {
  font-size: 0.9375rem;
  font-weight: 620;
  color: #fff;
}

.field__control {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.field__control:focus-within {
  border-color: var(--lp-blue-bright);
  background: rgba(77, 179, 240, 0.12);
  /* O campo numérico não desenha contorno próprio; o anel vai no conjunto. */
  outline: 3px solid var(--lp-blue-bright);
  outline-offset: 2px;
}

.field__input {
  width: 6.2ch;
  min-width: 0;
  padding: 6px 0;
  border: 0;
  background: transparent;
  color: #fff;
  font: inherit;
  font-size: 1.25rem;
  font-weight: 760;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  text-align: right;
}

.field__input:focus,
.field__input:focus-visible {
  outline: none;
}

.field__unit {
  min-width: 2.2ch;
  padding: 0 8px 0 6px;
  font-size: 0.875rem;
  font-weight: 560;
  color: var(--lp-on-dark-muted);
}

.field__step {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  flex: none;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s var(--lp-ease);
}

.field__step:hover:not(:disabled) {
  background: var(--lp-blue-bright);
  color: var(--lp-ink);
}

.field__step:active:not(:disabled) {
  transform: scale(0.92);
}

.field__step:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* --------------------------------------------------------------------------
 * Régua. A parte preenchida vem de --fill (calculado no script).
 * ------------------------------------------------------------------------ */
.field__range {
  width: 100%;
  height: 32px;
  margin: 0;
  background: transparent;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
}

.field__range:focus {
  outline: none;
}

.field__range::-webkit-slider-runnable-track {
  height: 8px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--lp-blue-bright) 0 var(--fill), rgba(255, 255, 255, 0.16) var(--fill) 100%);
}

.field__range::-webkit-slider-thumb {
  box-sizing: border-box;
  width: 26px;
  height: 26px;
  margin-top: -9px;
  border: 5px solid var(--lp-blue);
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
  transition: transform 0.2s var(--lp-ease), box-shadow 0.2s ease;
  -webkit-appearance: none;
  appearance: none;
}

.field__range:hover::-webkit-slider-thumb {
  transform: scale(1.1);
}

.field__range:active::-webkit-slider-thumb {
  transform: scale(1.18);
}

.field__range:focus-visible::-webkit-slider-thumb {
  box-shadow: 0 0 0 5px rgba(77, 179, 240, 0.75), 0 2px 10px rgba(0, 0, 0, 0.4);
}

.field__range::-moz-range-track {
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
}

.field__range::-moz-range-progress {
  height: 8px;
  border-radius: 999px;
  background: var(--lp-blue-bright);
}

.field__range::-moz-range-thumb {
  box-sizing: border-box;
  width: 26px;
  height: 26px;
  border: 5px solid var(--lp-blue);
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
}

.field__range:focus-visible::-moz-range-thumb {
  box-shadow: 0 0 0 5px rgba(77, 179, 240, 0.75), 0 2px 10px rgba(0, 0, 0, 0.4);
}

.field__hint {
  font-size: 0.8125rem;
  color: var(--lp-on-dark-muted);
}

@media (max-width: 560px) {
  .field__top { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; }
  .field__control { width: 100%; border-radius: 12px; }
  .field__input { flex: 1; width: 0; padding-inline: 8px; font-size: 1.125rem; }
  .field__unit { font-size: .8125rem; }
  .field__range { height: 44px; }
  .field__step { border-radius: 8px; }
}
</style>
