<template>
  <!--
    Painel de exemplo do hero. É uma ilustração e diz isso na própria tela:
    produtos genéricos, SKUs de exemplo e o vocabulário de status que o painel
    usa de verdade. O único número vem da tabela de preços (HERO_SIMULATION é
    calculado por utils/pricing.js), então nunca destoa dela.
  -->
  <figure
    class="mock"
    role="img"
    aria-label="Exemplo ilustrativo do painel: tabela de vendas com pedidos do Mercado Livre, Shopee e TikTok Shop e o status de cada um."
  >
    <div class="mock__window" aria-hidden="true">
      <div class="mock__bar">
        <span class="mock__dots"><i /><i /><i /></span>
        <span class="mock__title">
          <LandingIcon name="table" />
          Vendas
        </span>
      </div>

      <div class="mock__filters">
        <span class="mock__chip mock__chip--on">Todas</span>
        <span v-for="channel in CHANNELS" :key="channel.code" class="mock__chip">
          <img :src="channel.logo" alt="" height="14">
          {{ channel.shortLabel }}
        </span>
      </div>

      <ul class="mock__rows">
        <li v-for="(row, index) in MOCK_ROWS" :key="row.id" class="mock__row" :style="{ '--i': index }">
          <span class="mock__logo"><img :src="logoOf(row.channel)" alt=""></span>
          <span class="mock__product">
            <strong>{{ row.product }}</strong>
            <small>{{ row.sku }} · {{ row.quantity }} un</small>
          </span>
          <span class="mock__status" :class="`mock__status--${row.tone}`">{{ row.status }}</span>
        </li>
      </ul>

      <p class="mock__foot">
        <LandingIcon name="info" />
        <span class="mock__tag">Exemplo ilustrativo</span>
      </p>
    </div>

    <div class="mock__label" aria-hidden="true">
      <span class="mock__label-head">Etiqueta</span>
      <span class="mock__barcode" />
      <span class="mock__label-sku">SKU-A01 <b>× 2</b></span>
    </div>

    <div class="mock__sim" aria-hidden="true">
      <span class="mock__sim-kicker">
        <LandingIcon name="calculator" />
        Simulação de exemplo
      </span>
      <strong class="mock__sim-total">{{ HERO_SIMULATION.total }}<small>/mês</small></strong>
      <span class="mock__sim-caption">{{ HERO_SIMULATION.caption }}</span>
    </div>
  </figure>
</template>

<script setup>
import LandingIcon from '@/components/landing/LandingIcon.vue';
import { CHANNELS, HERO_SIMULATION, MOCK_ROWS } from '@/utils/landingContent';
import { marketplaceLogo } from '@/utils/marketplaces';

const logoOf = (channel) => marketplaceLogo(channel);
</script>

<style scoped>
.mock {
  position: relative;
  width: min(100%, 540px);
  margin: 0 auto;
  padding: 44px 0 96px;
}

.mock__window {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(5, 13, 26, 0.1);
  border-radius: var(--lp-radius-l);
  background: #fff;
  box-shadow: var(--lp-shadow-l);
}

.mock__bar {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--lp-line);
  background: linear-gradient(180deg, #fff, var(--lp-sky-2));
}

.mock__dots {
  display: inline-flex;
  gap: 6px;
}

.mock__dots i {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--lp-line);
}

.mock__dots i:first-child {
  background: var(--lp-blue);
}

.mock__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--lp-ink);
}

/* Rodapé do painel: o aviso de que é um exemplo fica sempre visível, no canto
 * oposto ao da simulação flutuante. */
.mock__foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 0 20px 16px;
  color: var(--lp-muted);
  font-size: 1rem;
}

.mock__tag {
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--lp-sky);
  color: var(--lp-blue-deep);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}

.mock__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 14px 20px 6px;
}

.mock__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--lp-line);
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--lp-muted);
}

.mock__chip img {
  width: auto;
  height: 14px;
}

.mock__chip--on {
  border-color: var(--lp-ink);
  background: var(--lp-ink);
  color: #fff;
}

.mock__rows {
  display: grid;
  padding: 6px 12px 14px;
}

.mock__row {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 12px 8px;
  border-bottom: 1px solid var(--lp-sky);
  opacity: 0;
  animation: lp-pop 0.6s var(--lp-ease) forwards;
  animation-delay: calc(0.55s + var(--i, 0) * 0.11s);
}

.mock__row:last-child {
  border-bottom: 0;
}

.mock__logo {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--lp-line);
  border-radius: 12px;
  background: #fff;
}

.mock__logo img {
  width: auto;
  height: 20px;
  max-width: 24px;
}

.mock__product {
  display: grid;
  min-width: 0;
}

.mock__product strong {
  overflow: hidden;
  font-size: 0.9375rem;
  font-weight: 650;
  color: var(--lp-ink);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mock__product small {
  font-size: 0.8125rem;
  color: var(--lp-muted);
}

/* Cores dos status: as mesmas famílias do painel (tokens --cd-*). */
.mock__status {
  padding: 5px 11px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
}

.mock__status--amber {
  background: var(--cd-warning-bg, #fff3cd);
  color: var(--cd-warning-ink, #9a5700);
}

.mock__status--blue {
  background: var(--cd-blue-100, #e0f2fe);
  color: var(--cd-blue-800, #075985);
}

.mock__status--violet {
  background: #ede9fe;
  color: #5b21b6;
}

.mock__status--green {
  background: var(--cd-success-bg, #dcfce7);
  color: var(--cd-success-ink, #166534);
}

/* Etiqueta solta por cima do painel. */
.mock__label {
  --lp-tilt: 4deg;

  position: absolute;
  top: 0;
  right: -14px;
  display: grid;
  gap: 8px;
  width: 152px;
  padding: 12px 14px;
  border: 1px solid rgba(5, 13, 26, 0.12);
  border-radius: 16px;
  background: #fff;
  box-shadow: var(--lp-shadow-m);
  transform: rotate(var(--lp-tilt));
  animation: lp-float 7s ease-in-out infinite;
}

.mock__label-head {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--lp-muted);
}

.mock__barcode {
  height: 34px;
  background: repeating-linear-gradient(
    90deg,
    var(--lp-ink) 0 2px,
    transparent 2px 4px,
    var(--lp-ink) 4px 5px,
    transparent 5px 8px,
    var(--lp-ink) 8px 11px,
    transparent 11px 13px
  );
}

.mock__label-sku {
  font-size: 0.8125rem;
  font-weight: 650;
  letter-spacing: 0.02em;
  color: var(--lp-ink);
}

.mock__label-sku b {
  color: var(--lp-blue-deep);
}

/* Simulação de exemplo, calculada pela tabela de preços. */
.mock__sim {
  --lp-tilt: -3deg;

  position: absolute;
  bottom: 0;
  left: -22px;
  display: grid;
  gap: 2px;
  padding: 16px 20px;
  border-radius: 20px;
  background: linear-gradient(140deg, var(--lp-ink) 0%, var(--lp-ink-3) 100%);
  color: #fff;
  box-shadow: 0 28px 50px -24px rgba(5, 13, 26, 0.8);
  transform: rotate(var(--lp-tilt));
  animation: lp-float 8.5s ease-in-out -2s infinite;
}

.mock__sim-kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  font-weight: 650;
  color: var(--lp-blue-bright);
}

.mock__sim-total {
  font-size: 1.875rem;
  font-weight: 780;
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.mock__sim-total small {
  margin-left: 4px;
  font-size: 0.9375rem;
  font-weight: 560;
  letter-spacing: 0;
  color: var(--lp-on-dark-muted);
}

.mock__sim-caption {
  font-size: 0.8125rem;
  color: var(--lp-on-dark-muted);
}

@media (max-width: 560px) {
  .mock {
    padding: 14px 0;
  }

  .mock__label {
    display: none;
  }

  .mock__sim {
    position: relative;
    left: auto;
    bottom: auto;
    margin: 12px 12px 0;
    padding: 16px;
    border-radius: 12px;
    transform: none;
    animation: none;
    box-shadow: none;
  }

  .mock__row {
    grid-template-columns: 30px minmax(0, 1fr) auto;
    gap: 8px;
    padding: 12px 0;
  }

  .mock__status {
    font-size: .625rem;
    padding: 5px 7px;
  }

  .mock__logo {
    width: 30px;
    height: 30px;
  }
  .mock__filters { gap: 5px; padding-inline: 12px; }
  .mock__chip { font-size: .6875rem; padding: 5px 8px; }
  .mock__product strong { font-size: .75rem; }
  .mock__product small { font-size: .6875rem; }
  .mock__foot { padding: 0 12px 12px; }
}

@media (prefers-reduced-motion: reduce) {
  .mock__row {
    opacity: 1;
  }
}
</style>
