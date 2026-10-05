<template>
  <section id="calculadora" class="lp-section lp-dark calc" aria-labelledby="calc-titulo" tabindex="-1">
    <div class="calc__bg" aria-hidden="true">
      <div class="calc__glow calc__glow--a" />
      <div class="calc__glow calc__glow--b" />
      <div class="calc__grid" />
    </div>

    <div class="lp-container calc__inner">
      <header class="calc__head">
        <p v-reveal class="lp-eyebrow">Calculadora</p>
        <h2 id="calc-titulo" v-reveal="60" class="lp-h2">
          Quanto a sua operação custa <span class="lp-grad">por mês?</span>
        </h2>
        <p v-reveal="120" class="lp-lead">
          Ajuste os números e veja a estimativa na hora, com a mesma tabela de preços desta página.
        </p>
      </header>

      <div class="calc__layout">
        <!-- ===================== ENTRADAS ===================== -->
        <div v-reveal="80" class="calc__panel">
          <!-- Celular: o total fica preso logo abaixo do menu enquanto se rola pelas
               entradas. Está no topo do painel (e não no pé) porque um elemento
               sticky de rodapé fica grudado no início do contêiner quando a tela
               ainda está acima dele, e cobria os primeiros campos. -->
          <button type="button" class="minibar" @click="goToResult">
            <span class="minibar__label">Estimativa</span>
            <strong class="minibar__value">{{ formatCents(estimate.totalCents) }}<small>/mês</small></strong>
            <span class="minibar__go">
              <span class="minibar__go-text">Detalhes</span>
              <LandingIcon name="arrow-down" />
            </span>
          </button>

          <div class="presets" role="group" aria-labelledby="presets-titulo">
            <p id="presets-titulo" class="presets__label">Comece por um cenário</p>
            <div class="presets__list">
              <button
                v-for="preset in CALCULATOR_PRESETS"
                :key="preset.id"
                type="button"
                class="preset"
                :class="{ 'is-active': activePreset === preset.id }"
                :aria-pressed="activePreset === preset.id ? 'true' : 'false'"
                @click="applyPreset(preset)"
              >
                <strong>{{ preset.label }}</strong>
                <small>{{ preset.hint }}</small>
              </button>
            </div>
          </div>

          <section class="block" aria-labelledby="bloco-armazenamento">
            <h3 id="bloco-armazenamento" class="block__title">
              <LandingIcon name="warehouse" />
              Armazenamento
            </h3>
            <LandingRangeField
              id="calc-m3"
              v-model="state.cubicMeters"
              label="Espaço ocupado"
              unit="m³"
              :min="limits.cubicMeters.min"
              :max="limits.cubicMeters.max"
              :slider-max="20"
              :hint="storageHint"
            />
          </section>

          <section class="block" aria-labelledby="bloco-expedicao">
            <h3 id="bloco-expedicao" class="block__title">
              <LandingIcon name="package-check" />
              Expedição
            </h3>

            <div class="plans" role="radiogroup" aria-labelledby="bloco-expedicao">
              <label v-for="plan in plans" :key="plan.id" class="plan">
                <input v-model="state.shippingPlan" class="plan__input" type="radio" name="calc-plano" :value="plan.id">
                <span class="plan__box">
                  <span class="plan__name">{{ plan.shortName }}</span>
                  <span class="plan__price">{{ formatCents(plan.cents) }} <small>por venda</small></span>
                </span>
              </label>
            </div>

            <LandingRangeField
              id="calc-vendas"
              v-model="state.monthlySales"
              label="Vendas por mês"
              unit="vendas"
              :min="limits.monthlySales.min"
              :max="limits.monthlySales.max"
              :slider-max="3000"
              :step="10"
              hint="Embalagem padrão CYBER e envio em cada venda."
            />
          </section>

          <section class="block" aria-labelledby="bloco-full">
            <h3 id="bloco-full" class="block__title">
              <LandingIcon name="layers" />
              Montagem de Full
            </h3>

            <LandingRangeField
              id="calc-pacotes"
              v-model="state.assemblyPackages"
              label="Pacotes em cada montagem"
              unit="pacotes"
              :min="limits.assemblyPackages.min"
              :max="limits.assemblyPackages.max"
              :slider-max="1000"
              :step="10"
              :hint="assemblyHint"
            />

            <LandingRangeField
              v-if="state.assemblyPackages > 0"
              id="calc-montagens"
              v-model="state.assemblyBatches"
              label="Montagens no mês"
              unit="montagens"
              :min="limits.assemblyBatches.min"
              :max="limits.assemblyBatches.max"
              :slider-max="10"
            />
          </section>

          <section class="block" aria-labelledby="bloco-viagens">
            <h3 id="bloco-viagens" class="block__title">
              <LandingIcon name="truck" />
              Viagens
            </h3>

            <LandingRangeField
              id="calc-transbordo"
              v-model="state.fullTrips"
              label="Transbordo Full"
              unit="viagens"
              :min="limits.fullTrips.min"
              :max="limits.fullTrips.max"
              :slider-max="10"
              :hint="`${formatCents(PRICE_CENTS.fullTransferTrip)} por viagem ao C.D. do Mercado Livre em São Paulo.`"
            />

            <LandingRangeField
              id="calc-coleta"
              v-model="state.collectionTrips"
              label="Coleta CyberSegura"
              unit="viagens"
              :min="limits.collectionTrips.min"
              :max="limits.collectionTrips.max"
              :slider-max="10"
              :hint="`${formatCents(PRICE_CENTS.secureCollectionTrip)} por viagem, até 1 m³ e 40 km da sede.`"
            />
          </section>
        </div>

        <!-- ===================== RESULTADO ===================== -->
        <aside id="calc-resultado" v-reveal="160" class="receipt" aria-labelledby="calc-resultado-titulo" tabindex="-1">
          <h3 id="calc-resultado-titulo" class="receipt__kicker">
            <LandingIcon name="receipt" />
            Estimativa mensal
          </h3>

          <p class="receipt__total" aria-hidden="true">
            <span class="receipt__currency">R$</span>
            <span class="receipt__whole">{{ totalParts.whole }}</span>
            <span class="receipt__fraction">,{{ totalParts.fraction }}</span>
            <span class="receipt__per-month">/mês</span>
          </p>

          <p class="lp-sr-only" role="status" aria-live="polite" aria-atomic="true">{{ announcement }}</p>

          <div class="bar" aria-hidden="true">
            <span
              v-for="line in estimate.lines"
              :key="line.key"
              class="bar__part"
              :style="{ flexGrow: line.cents, background: LINE_COLORS[line.key] }"
            />
          </div>

          <transition-group name="line" tag="ul" class="lines" role="list">
            <li v-for="line in estimate.lines" :key="line.key" class="line">
              <span class="line__dot" :style="{ background: LINE_COLORS[line.key] }" aria-hidden="true" />
              <span class="line__text">
                <strong>{{ line.label }}</strong>
                <small>{{ line.detail }}</small>
              </span>
              <span class="line__value">{{ formatCents(line.cents) }}</span>
            </li>
          </transition-group>

          <p v-if="estimate.perSaleCents !== null" class="receipt__sale">
            <span>
              Custo médio por venda
              <small>total do mês dividido pelas vendas</small>
            </span>
            <strong>{{ formatCents(estimate.perSaleCents) }}</strong>
          </p>

          <div class="receipt__actions">
            <a
              v-if="contact"
              class="lp-btn lp-btn--blue"
              :href="contact.href"
              :target="contact.external ? '_blank' : null"
              :rel="contact.external ? 'noopener noreferrer' : null"
            >
              <LandingIcon name="message" />
              Enviar esta simulação
            </a>
            <button type="button" class="lp-btn" :class="{ 'lp-btn--ghost': contact }" @click="copySummary">
              <LandingIcon :name="copied ? 'check' : 'copy'" />
              {{ copied ? 'Simulação copiada' : 'Copiar simulação' }}
            </button>
            <router-link to="/auth" class="receipt__login">
              Já sou cliente: entrar no painel
              <LandingIcon name="arrow-right" />
            </router-link>
          </div>

          <p class="receipt__fine">
            Simulação com base na tabela de preços desta página. Serve como referência, não como proposta.
          </p>
        </aside>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';

import LandingIcon from '@/components/landing/LandingIcon.vue';
import LandingRangeField from '@/components/landing/LandingRangeField.vue';
import { scrollToSection } from '@/composables/useLandingScroll';
import { useAnimatedNumber, vReveal } from '@/composables/useReveal';
import { CALCULATOR_DEFAULTS, CALCULATOR_PRESETS, contactAction } from '@/utils/landingContent';
import {
  INPUT_LIMITS,
  PRICE_CENTS,
  SHIPPING_PLANS,
  calculateEstimate,
  describeEstimate,
  formatCents,
  splitCents,
} from '@/utils/pricing';

const limits = INPUT_LIMITS;
const plans = Object.values(SHIPPING_PLANS);

/* Uma cor por linha do orçamento, do azul mais fundo ao mais claro. */
const LINE_COLORS = {
  storage: '#0369a1',
  shipping: '#1e90d6',
  assembly: '#4db3f0',
  transfer: '#8ccdf3',
  collection: '#c3e4f8',
};

const state = reactive({ ...CALCULATOR_DEFAULTS });
const estimate = computed(() => calculateEstimate(state));

/* O total caminha até o valor novo; o texto lido por leitor de tela espera a
 * pessoa parar de mexer (debounce), senão cada passo da régua seria anunciado. */
const animatedTotal = useAnimatedNumber(computed(() => estimate.value.totalCents));
const totalParts = computed(() => splitCents(animatedTotal.value));

const announcement = ref(`Total estimado: ${formatCents(estimate.value.totalCents)} por mês.`);
let announceTimer = 0;

watch(() => estimate.value.totalCents, (cents) => {
  clearTimeout(announceTimer);
  announceTimer = setTimeout(() => {
    announcement.value = `Total estimado: ${formatCents(cents)} por mês.`;
  }, 700);
});

/* ---- Cenários ---- */
const activePreset = computed(() => {
  const match = CALCULATOR_PRESETS.find((preset) => (
    Object.keys(preset.values).every((key) => state[key] === preset.values[key])
  ));
  return match ? match.id : '';
});

function applyPreset(preset) {
  Object.assign(state, preset.values);
}

/* ---- Dicas dos campos ---- */
const storageHint = computed(() => (
  `${formatCents(PRICE_CENTS.storageFirstCubicMeter)} pelo 1º m³ e ${formatCents(PRICE_CENTS.storageAdditionalCubicMeter)} por m³ adicional.`
));

const assemblyHint = computed(() => {
  const { tier } = estimate.value;
  if (!tier) return 'Informe os pacotes de uma montagem. Quanto maior ela for, menor o preço por pacote.';
  return `Faixa de ${tier.label.toLowerCase()}: ${formatCents(tier.cents)} por pacote, valendo para todos os pacotes da montagem.`;
});

/* ---- Contato (some quando não há canal configurado) ---- */
const contact = computed(() => contactAction(describeEstimate(estimate.value)));

/* ---- Copiar ---- */
const copied = ref(false);
let copiedTimer = 0;

function legacyCopy(text) {
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  let done = false;
  try {
    done = document.execCommand('copy');
  } catch {
    done = false;
  }
  document.body.removeChild(area);
  return done;
}

async function copySummary() {
  const text = describeEstimate(estimate.value);
  let done = false;

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      done = true;
    }
  } catch {
    done = false;
  }
  if (!done) done = legacyCopy(text);

  copied.value = done;
  announcement.value = done
    ? 'Simulação copiada para a área de transferência.'
    : 'Não foi possível copiar. Anote os valores do detalhamento.';

  clearTimeout(copiedTimer);
  copiedTimer = setTimeout(() => {
    copied.value = false;
  }, 2600);
}

function goToResult() {
  scrollToSection('calc-resultado', { updateHash: false });
}

onBeforeUnmount(() => {
  clearTimeout(announceTimer);
  clearTimeout(copiedTimer);
});
</script>

<style scoped>
/* Sem overflow aqui: um ancestral com overflow:hidden viraria o "viewport" do
 * position:sticky da nota e ela deixaria de acompanhar a rolagem. Quem corta os
 * brilhos é o .calc__bg. */
.calc {
  background: var(--lp-ink);
  color: #fff;
}

.calc__bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.calc__glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
}

.calc__glow--a {
  top: -160px;
  left: -120px;
  width: 560px;
  height: 560px;
  background: rgba(30, 144, 214, 0.42);
}

.calc__glow--b {
  right: -180px;
  bottom: -200px;
  width: 620px;
  height: 620px;
  background: rgba(3, 105, 161, 0.5);
}

.calc__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.045) 1px, transparent 1px);
  background-size: 56px 56px;
  -webkit-mask-image: radial-gradient(80% 70% at 50% 40%, #000 0%, transparent 100%);
  mask-image: radial-gradient(80% 70% at 50% 40%, #000 0%, transparent 100%);
}

.calc__inner {
  position: relative;
  z-index: 1;
}

.calc__head {
  display: grid;
  justify-items: start;
  max-width: 820px;
}

.calc__layout {
  display: grid;
  /* minmax(0, 1fr): sem isto a coluna única cresce até o menor conteúdo que não
   * quebra e a nota passava da margem direita no celular. */
  grid-template-columns: minmax(0, 1fr);
  gap: 28px;
  margin-top: clamp(40px, 5vw, 64px);
}

/* --------------------------------------------------------------------------
 * Painel de entradas
 * ------------------------------------------------------------------------ */
.calc__panel {
  padding: clamp(20px, 3vw, 36px);
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: var(--lp-radius-xl);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.03));
}

.presets__label {
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--lp-on-dark-muted);
}

.presets__list {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
  margin-top: 12px;
}

.preset {
  display: grid;
  gap: 2px;
  padding: 12px 18px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 18px;
  background: transparent;
  color: #fff;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.25s ease, color 0.25s ease, border-color 0.25s ease, transform 0.3s var(--lp-ease);
}

.preset strong {
  font-size: 1rem;
  font-weight: 700;
}

.preset small {
  font-size: 0.8125rem;
  color: var(--lp-on-dark-muted);
  transition: color 0.25s ease;
}

.preset:hover {
  border-color: var(--lp-blue-bright);
  transform: translateY(-2px);
}

.preset.is-active {
  border-color: #fff;
  background: #fff;
  color: var(--lp-ink);
}

.preset.is-active small {
  color: var(--lp-muted);
}

.block {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
  margin-top: 30px;
  padding-top: 30px;
  border-top: 1px solid rgba(255, 255, 255, 0.11);
}

.block__title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.0625rem;
  font-weight: 720;
  letter-spacing: -0.01em;
  color: #fff;
}

.block__title .lp-icon {
  color: var(--lp-blue-bright);
}

/* Planos de expedição: rádios de verdade, com o cartão como rótulo. */
.plans {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.plan {
  position: relative;
  display: block;
  cursor: pointer;
}

.plan__input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}

.plan__box {
  display: grid;
  gap: 2px;
  padding: 14px 18px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 18px;
  transition: border-color 0.25s ease, background-color 0.25s ease, color 0.25s ease;
}

.plan__name {
  font-weight: 700;
}

.plan__price {
  font-size: 1.125rem;
  font-weight: 780;
  letter-spacing: -0.02em;
}

.plan__price small {
  font-size: 0.8125rem;
  font-weight: 560;
  color: var(--lp-on-dark-muted);
}

.plan:hover .plan__box {
  border-color: var(--lp-blue-bright);
}

.plan__input:checked + .plan__box {
  border-color: #fff;
  background: #fff;
  color: var(--lp-ink);
}

.plan__input:checked + .plan__box .plan__price small {
  color: var(--lp-muted);
}

.plan__input:focus-visible + .plan__box {
  outline: 3px solid var(--lp-blue-bright);
  outline-offset: 3px;
}

/* Barra de total presa logo abaixo do menu (só no celular). */
.minibar {
  position: sticky;
  top: calc(var(--lp-nav-h) + 10px);
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  margin-bottom: 26px;
  padding: 10px 10px 10px 20px;
  border: 0;
  border-radius: 999px;
  background: #fff;
  color: var(--lp-ink);
  font: inherit;
  text-align: left;
  box-shadow: 0 18px 40px -14px rgba(0, 0, 0, 0.75);
  cursor: pointer;
}

/* Com a barra presa no topo, o foco por teclado precisa parar abaixo dela. */
@media (max-width: 979px) {
  .calc__panel .preset,
  .calc__panel .plan,
  .calc__panel .field,
  .calc__panel .block__title {
    scroll-margin-top: 160px;
  }
}

.minibar__label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--lp-muted);
}

.minibar__value {
  margin-left: auto;
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.minibar__value small {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--lp-muted);
}

.minibar__go {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  background: var(--lp-ink);
  color: #fff;
  font-size: 0.8125rem;
  font-weight: 650;
}

/* --------------------------------------------------------------------------
 * Resultado: a "nota" com borda serrilhada
 * ------------------------------------------------------------------------ */
.receipt {
  position: relative;
  margin-bottom: 14px;
  padding: clamp(24px, 3vw, 36px);
  border-radius: var(--lp-radius-xl) var(--lp-radius-xl) 0 0;
  background: #fff;
  color: var(--lp-ink);
  box-shadow: 0 40px 80px -30px rgba(0, 0, 0, 0.75);
}

.receipt::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  height: 14px;
  background:
    linear-gradient(135deg, #fff 10px, transparent 0) left top / 20px 20px repeat-x,
    linear-gradient(225deg, #fff 10px, transparent 0) left top / 20px 20px repeat-x;
  filter: drop-shadow(0 18px 14px rgba(0, 0, 0, 0.35));
}

.receipt__kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--lp-blue-deep);
}

.receipt__total {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 4px;
  margin-top: 10px;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.receipt__currency {
  margin-right: 4px;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--lp-muted);
}

.receipt__whole {
  font-size: clamp(3.25rem, 7vw, 4.75rem);
  font-weight: 780;
  letter-spacing: -0.03em;
  color: var(--lp-ink);
}

.receipt__fraction {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 760;
  letter-spacing: -0.03em;
  color: var(--lp-blue-deep);
}

.receipt__per-month {
  margin-left: 6px;
  font-size: 1rem;
  font-weight: 600;
  color: var(--lp-muted);
}

.bar {
  display: flex;
  gap: 3px;
  height: 12px;
  margin-top: 22px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--lp-sky);
}

.bar__part {
  flex-basis: 0;
  min-width: 6px;
  border-radius: 999px;
  transition: flex-grow 0.5s var(--lp-ease);
}

.lines {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  margin-top: 8px;
}

.line {
  display: grid;
  grid-template-columns: 12px minmax(0, 1fr) auto;
  align-items: start;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px dashed var(--lp-line);
}

.line__dot {
  width: 12px;
  height: 12px;
  margin-top: 6px;
  border-radius: 50%;
}

.line__text {
  display: grid;
  min-width: 0;
}

.line__text strong {
  font-weight: 700;
}

.line__text small {
  font-size: 0.8125rem;
  line-height: 1.4;
  color: var(--lp-muted);
}

.line__value {
  font-weight: 760;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.line-enter-active,
.line-leave-active {
  transition: opacity 0.35s ease, transform 0.45s var(--lp-ease);
}

.line-enter-from,
.line-leave-to {
  opacity: 0;
  transform: translateX(16px);
}

.line-leave-active {
  position: absolute;
  left: 0;
  right: 0;
}

.line-move {
  transition: transform 0.45s var(--lp-ease);
}

.lines {
  position: relative;
}

.receipt__sale {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 18px;
  padding: 14px 18px;
  border-radius: 18px;
  background: var(--lp-sky);
}

.receipt__sale span {
  display: grid;
  font-weight: 650;
}

.receipt__sale small {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--lp-muted);
}

.receipt__sale strong {
  font-size: 1.375rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--lp-blue-deep);
  font-variant-numeric: tabular-nums;
}

.receipt__actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  margin-top: 24px;
}

.receipt__actions .lp-btn {
  width: 100%;
}

.receipt__login {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  font-size: 0.9375rem;
  font-weight: 650;
  color: var(--lp-blue-deep);
  text-decoration: none;
}

.receipt__login:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
}

.receipt__fine {
  margin-top: 8px;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--lp-muted);
}

/* --------------------------------------------------------------------------
 * Telas largas: entradas à esquerda, nota fixa à direita
 * ------------------------------------------------------------------------ */
@media (min-width: 640px) {
  .presets__list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 980px) {
  .calc__layout {
    grid-template-columns: minmax(0, 1.12fr) minmax(360px, 0.88fr);
    align-items: start;
    gap: 40px;
  }

  .receipt {
    position: sticky;
    top: calc(var(--lp-nav-h) + 24px);
  }

  .minibar {
    display: none;
  }
}

@media (max-width: 420px) {
  .plans {
    grid-template-columns: minmax(0, 1fr);
  }

  /* Sem espaço para o texto: fica só a seta, que ainda indica que é um botão. */
  .minibar__go-text {
    display: none;
  }

  .minibar__go {
    padding: 8px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .preset:hover {
    transform: none;
  }
}
</style>
