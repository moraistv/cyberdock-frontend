<template>
    <div class="auth-page">
        <div class="auth-page__ambient auth-page__ambient--one" aria-hidden="true"></div>
        <div class="auth-page__ambient auth-page__ambient--two" aria-hidden="true"></div>

        <aside class="auth-story">
            <div class="auth-story__top">
                <img src="@/assets/logo.png" alt="CyberDock" class="brand-logo" />
                <span class="brand-tag">Operação conectada</span>
            </div>

            <div class="auth-story__content">
                <span class="eyebrow">Fulfillment multicanal</span>
                <h1>Da venda à expedição, tudo no mesmo ritmo.</h1>
                <p>
                    Acompanhe pedidos, estoque e operação de Mercado Livre e Shopee
                    em um painel feito para quem precisa ganhar tempo.
                </p>

                <div class="operation-card" aria-hidden="true">
                    <div class="operation-card__head">
                        <div>
                            <span class="operation-card__label">Visão da operação</span>
                            <strong>Hoje</strong>
                        </div>
                        <span class="live-pill"><i></i> Atualizado</span>
                    </div>
                    <div class="operation-stats">
                        <div class="operation-stat">
                            <span>Vendas</span>
                            <strong>1.284</strong>
                            <small class="is-positive">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m18 15-6-6-6 6" /></svg>
                                12,4%
                            </small>
                        </div>
                        <div class="operation-stat">
                            <span>A despachar</span>
                            <strong>86</strong>
                            <small>em andamento</small>
                        </div>
                        <div class="operation-stat">
                            <span>Processadas</span>
                            <strong>1.198</strong>
                            <small>93,3% do total</small>
                        </div>
                    </div>
                    <div class="flow-line">
                        <span class="flow-line__fill"></span>
                    </div>
                    <div class="flow-legend">
                        <span>Pedidos recebidos</span>
                        <span>Estoque atualizado</span>
                    </div>
                </div>

                <div class="benefits">
                    <div class="benefit">
                        <span class="benefit__icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                        </span>
                        <span><strong>Uma fila única</strong> para seus canais de venda</span>
                    </div>
                    <div class="benefit">
                        <span class="benefit__icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                        </span>
                        <span><strong>Estoque e custos</strong> sempre visíveis</span>
                    </div>
                </div>
            </div>

            <div class="auth-story__bottom">
                <span>Integrações oficiais</span>
                <div class="marketplaces">
                    <span class="marketplace" title="Mercado Livre">
                        <img src="/img/ml-logo.svg" alt="Mercado Livre" />
                        Mercado Livre
                    </span>
                    <span class="marketplace" title="Shopee">
                        <img src="/img/shopee-logo.svg" alt="Shopee" />
                        Shopee
                    </span>
                </div>
            </div>
        </aside>

        <main class="auth-main">
            <header class="mobile-brand">
                <img src="@/assets/logo.png" alt="CyberDock" />
                <div class="mobile-marketplaces" aria-label="Marketplaces integrados">
                    <img src="/img/ml-logo.svg" alt="Mercado Livre" />
                    <img src="/img/shopee-logo.svg" alt="Shopee" />
                </div>
            </header>

            <div class="auth-main__content">
                <AutenticacaoComponent />
            </div>

            <footer class="auth-footer">
                <span class="secure-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    Ambiente seguro
                </span>
                <span>© {{ currentYear }} CyberDock</span>
            </footer>
        </main>
    </div>
</template>

<script setup>
import AutenticacaoComponent from '../components/AutenticacaoComponent.vue';

const currentYear = new Date().getFullYear();
</script>

<style scoped>
.auth-page {
    position: relative;
    isolation: isolate;
    min-height: 100vh;
    min-height: 100svh;
    display: grid;
    grid-template-columns: minmax(430px, 0.94fr) minmax(500px, 1.06fr);
    overflow: hidden;
    background: #f8fafc;
    color: #162033;
}

.auth-page__ambient {
    position: absolute;
    z-index: -1;
    border-radius: 9999px;
    pointer-events: none;
    filter: blur(2px);
}
.auth-page__ambient--one {
    width: 420px;
    height: 420px;
    right: -240px;
    top: -220px;
    background: rgba(96, 165, 250, 0.12);
}
.auth-page__ambient--two {
    width: 340px;
    height: 340px;
    right: 12%;
    bottom: -270px;
    background: rgba(129, 140, 248, 0.1);
}

.auth-story {
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: calc(100svh - 32px);
    margin: 16px;
    padding: clamp(2rem, 4vw, 4.5rem);
    overflow: hidden;
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 28px;
    background:
        radial-gradient(circle at 85% 12%, rgba(255,255,255,0.92), transparent 31%),
        linear-gradient(145deg, #eef4ff 0%, #e7f5fa 48%, #edf1ff 100%);
    box-shadow: 0 20px 70px rgba(37, 59, 96, 0.08);
}
.auth-story::before {
    content: '';
    position: absolute;
    width: 290px;
    height: 290px;
    right: -120px;
    bottom: 17%;
    border: 1px solid rgba(37, 99, 235, 0.12);
    border-radius: 50%;
    box-shadow: 0 0 0 46px rgba(37, 99, 235, 0.035), 0 0 0 92px rgba(37, 99, 235, 0.025);
}

.auth-story__top,
.auth-story__bottom,
.auth-story__content { position: relative; z-index: 1; }
.auth-story__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}
.brand-logo { width: auto; height: 34px; object-fit: contain; }
.brand-tag {
    padding: 0.42rem 0.72rem;
    border: 1px solid rgba(71, 85, 105, 0.14);
    border-radius: 999px;
    background: rgba(255,255,255,0.66);
    color: #526078;
    font-size: 0.72rem;
    font-weight: 650;
    letter-spacing: 0.02em;
}

.auth-story__content {
    width: min(100%, 570px);
    margin: auto 0;
    padding: clamp(2rem, 7vh, 4.5rem) 0;
}
.eyebrow {
    display: inline-flex;
    align-items: center;
    margin-bottom: 1.15rem;
    color: #2563eb;
    font-size: 0.74rem;
    font-weight: 750;
    letter-spacing: 0.11em;
    text-transform: uppercase;
}
.auth-story h1 {
    max-width: 560px;
    margin: 0;
    color: #101828;
    font-size: clamp(2.15rem, 4.3vw, 4.25rem);
    font-weight: 660;
    line-height: 1.01;
    letter-spacing: -0.055em;
}
.auth-story__content > p {
    max-width: 510px;
    margin: 1.25rem 0 1.8rem;
    color: #536176;
    font-size: clamp(0.94rem, 1.3vw, 1.08rem);
    line-height: 1.65;
}

.operation-card {
    width: min(100%, 510px);
    padding: 1.1rem;
    border: 1px solid rgba(148, 163, 184, 0.24);
    border-radius: 18px;
    background: rgba(255,255,255,0.8);
    box-shadow: 0 18px 45px rgba(51, 65, 85, 0.08);
    backdrop-filter: blur(14px);
}
.operation-card__head,
.flow-legend {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}
.operation-card__head > div { display: flex; flex-direction: column; gap: 0.15rem; }
.operation-card__label { color: #7a879a; font-size: 0.68rem; }
.operation-card__head strong { color: #1e293b; font-size: 0.88rem; }
.live-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.28rem 0.48rem;
    border-radius: 999px;
    background: #ecfdf3;
    color: #168352;
    font-size: 0.64rem;
    font-weight: 650;
}
.live-pill i { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; }
.operation-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.65rem; margin: 1rem 0; }
.operation-stat { padding: 0.75rem; border-radius: 12px; background: #f8fafc; }
.operation-stat > span,
.operation-stat > small { display: block; color: #8491a3; font-size: 0.62rem; }
.operation-stat strong { display: block; margin: 0.2rem 0; color: #162033; font-size: 1.05rem; }
.operation-stat small { white-space: nowrap; }
.operation-stat small.is-positive { display: flex; align-items: center; color: #15955d; }
.operation-stat small svg { width: 10px; height: 10px; }
.flow-line { height: 5px; overflow: hidden; border-radius: 999px; background: #e7edf5; }
.flow-line__fill { display: block; width: 87%; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #2563eb, #5aa6e8); }
.flow-legend { margin-top: 0.45rem; color: #8491a3; font-size: 0.6rem; }

.benefits { display: flex; flex-wrap: wrap; gap: 0.65rem 1.4rem; margin-top: 1.4rem; }
.benefit { display: flex; align-items: center; gap: 0.55rem; color: #526078; font-size: 0.78rem; }
.benefit strong { color: #26354b; font-weight: 650; }
.benefit__icon {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    flex: 0 0 auto;
    border-radius: 8px;
    background: rgba(255,255,255,0.82);
    color: #2563eb;
}
.benefit__icon svg { width: 14px; height: 14px; }

.auth-story__bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    color: #758399;
    font-size: 0.7rem;
}
.marketplaces { display: flex; flex-wrap: wrap; gap: 0.45rem; }
.marketplace {
    display: inline-flex;
    align-items: center;
    gap: 0.38rem;
    padding: 0.36rem 0.58rem;
    border: 1px solid rgba(148,163,184,0.2);
    border-radius: 999px;
    background: rgba(255,255,255,0.72);
    color: #4b5a70;
    font-size: 0.68rem;
    font-weight: 600;
}
.marketplace img { width: 15px; height: 15px; object-fit: contain; }

.auth-main {
    display: grid;
    grid-template-rows: auto 1fr auto;
    min-width: 0;
    padding: clamp(1.25rem, 4vw, 3.25rem);
}
.auth-main__content {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 2rem 0;
}
.mobile-brand { display: none; }
.auth-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    width: min(100%, 460px);
    margin: 0 auto;
    color: #8a96a8;
    font-size: 0.7rem;
}
.secure-label { display: inline-flex; align-items: center; gap: 0.35rem; }
.secure-label svg { width: 13px; height: 13px; }

@media (max-width: 1040px) {
    .auth-page { grid-template-columns: minmax(380px, 0.82fr) minmax(450px, 1.18fr); }
    .auth-story { padding: 2.5rem; }
    .operation-card { display: none; }
    .auth-story h1 { font-size: clamp(2.15rem, 4.7vw, 3.4rem); }
}

@media (max-width: 820px) {
    .auth-page {
        display: block;
        overflow: auto;
        background: #fff;
    }
    .auth-story { display: none; }
    .auth-main {
        min-height: 100vh;
        min-height: 100svh;
        padding: 1.25rem clamp(1.25rem, 5vw, 2.25rem);
        background:
            radial-gradient(circle at 100% 0%, rgba(219,234,254,0.7), transparent 35%),
            #fff;
    }
    .mobile-brand {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        width: min(100%, 460px);
        margin: 0 auto;
    }
    .mobile-brand > img { width: auto; height: 29px; object-fit: contain; }
    .mobile-marketplaces { display: flex; align-items: center; gap: 0.45rem; }
    .mobile-marketplaces img {
        width: 29px;
        height: 29px;
        padding: 6px;
        box-sizing: border-box;
        border: 1px solid #e6ebf2;
        border-radius: 9px;
        background: rgba(255,255,255,0.85);
        object-fit: contain;
    }
    .auth-main__content { padding: 2.25rem 0; }
}

@media (max-width: 480px) {
    .auth-main { padding: 1rem 1.1rem; }
    .auth-main__content { align-items: flex-start; padding: 2rem 0 1.5rem; }
    .auth-footer { padding-top: 1rem; border-top: 1px solid #eef1f5; }
}

@media (max-height: 720px) and (min-width: 821px) {
    .auth-story { padding: 2.2rem; }
    .auth-story__content { padding: 1.5rem 0; }
    .auth-story h1 { font-size: 2.5rem; }
    .auth-story__content > p { margin: 0.8rem 0 1rem; }
    .operation-card { display: none; }
}

@media (prefers-reduced-motion: reduce) {
    .auth-page *, .auth-page *::before, .auth-page *::after { scroll-behavior: auto !important; transition: none !important; animation: none !important; }
}
</style>
