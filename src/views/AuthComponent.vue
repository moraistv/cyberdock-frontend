<template>
    <div class="auth-page">
        <!-- Painel de marca: só decorativo, escondido em telas estreitas -->
        <aside class="auth-brand" aria-hidden="true">
            <div class="auth-brand__glow"></div>
            <div class="auth-brand__content">
                <img src="@/assets/logo.png" alt="" class="auth-brand__logo" />
                <h2 class="auth-brand__title">Fulfillment e gestão de vendas em um só lugar</h2>
                <p class="auth-brand__text">
                    Centralize estoque, expedição e faturamento das suas contas de marketplace.
                </p>
                <div class="auth-brand__marketplaces">
                    <span class="mk-pill">
                        <img src="/img/ml-logo.svg" alt="" class="mk-pill__logo" />
                        Mercado Livre
                    </span>
                    <span class="mk-pill">
                        <img src="/img/shopee-logo.svg" alt="" class="mk-pill__logo" />
                        Shopee
                    </span>
                </div>
            </div>
        </aside>

        <main class="auth-panel">
            <AutenticacaoComponent />
        </main>
    </div>
</template>

<script setup>
import AutenticacaoComponent from '../components/AutenticacaoComponent.vue';
</script>

<style scoped>
.auth-page {
    min-height: 100vh;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    background-color: #f6f7fb;
}

/* ===== Painel de marca (metade esquerda) ===== */
.auth-brand {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    overflow: hidden;
    background: linear-gradient(155deg, #0f172a 0%, #1e293b 55%, #111827 100%);
}
.auth-brand__glow {
    position: absolute;
    inset: -20% -20% auto auto;
    width: 60%;
    height: 60%;
    border-radius: 50%;
    background: radial-gradient(closest-side, rgba(99, 102, 241, 0.35), transparent 70%);
    filter: blur(10px);
}
.auth-brand__content {
    position: relative;
    max-width: 420px;
    color: #f8fafc;
}
.auth-brand__logo {
    height: 34px;
    object-fit: contain;
    margin-bottom: 2.5rem;
    filter: brightness(0) invert(1);
}
.auth-brand__title {
    font-size: 1.85rem;
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: -0.01em;
    margin: 0 0 0.9rem;
}
.auth-brand__text {
    font-size: 0.95rem;
    line-height: 1.6;
    color: #cbd5e1;
    margin: 0 0 2rem;
}
.auth-brand__marketplaces {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
}
.mk-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.9rem;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.14);
    font-size: 0.82rem;
    font-weight: 600;
    color: #e2e8f0;
}
.mk-pill__logo {
    width: 18px;
    height: 18px;
    object-fit: contain;
    border-radius: 4px;
}

/* ===== Painel do formulário (metade direita) ===== */
.auth-panel {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 1.5rem;
}

@media (max-width: 900px) {
    .auth-page {
        grid-template-columns: 1fr;
    }
    .auth-brand {
        display: none;
    }
}
</style>
