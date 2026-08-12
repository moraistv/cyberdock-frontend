<template>
    <div class="auth-container">
        <Toast />
        <div v-if="loggedInUser" class="logged-in-view">
            <span class="logged-in-view__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            </span>
            <span class="form-eyebrow">Sessão ativa</span>
            <h2 class="form-title">Tudo certo por aqui.</h2>
            <p class="form-subtitle">Você já está conectado como</p>
            <p class="user-email">{{ loggedInUser.email }}</p>
            <button @click="logout" class="logout-button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                Sair desta conta
            </button>
        </div>

        <div v-else class="form-container">
            <div class="mode-tabs" role="tablist" aria-label="Acesso à CyberDock">
                <button type="button" role="tab" class="mode-tab" :class="{ 'is-active': isLoginView }"
                    :aria-selected="isLoginView" @click="setMode(true)">Entrar</button>
                <button type="button" role="tab" class="mode-tab" :class="{ 'is-active': !isLoginView }"
                    :aria-selected="!isLoginView" @click="setMode(false)">Criar conta</button>
            </div>

            <div class="form-header">
                <span class="form-eyebrow">{{ isLoginView ? 'Bem-vindo de volta' : 'Comece agora' }}</span>
                <h2 class="form-title">{{ isLoginView ? 'Acesse sua operação.' : 'Crie seu acesso.' }}</h2>
                <p class="form-subtitle">
                    {{ isLoginView ? 'Entre com o e-mail usado no seu cadastro.' : 'Preencha seus dados para configurar a CyberDock.' }}
                </p>
            </div>

            <form @submit.prevent="handleSubmit" :aria-busy="isLoading">
                <transition @before-enter="beforeEnter" @enter="enter" @leave="leave">
                    <div v-if="!isLoginView" class="input-group" key="name">
                        <label for="name" class="label">Nome completo</label>
                        <div class="input-wrap">
                            <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            <input v-model.trim="formData.name" id="name" type="text" required autocomplete="name"
                                placeholder="Como devemos chamar você?" class="input-field">
                        </div>
                    </div>
                </transition>

                <div class="input-group">
                    <label for="email" class="label">E-mail</label>
                    <div class="input-wrap">
                        <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
                        <input v-model.trim="formData.email" id="email" type="email" required autocomplete="email"
                            autocapitalize="none" spellcheck="false" inputmode="email"
                            placeholder="nome@empresa.com" class="input-field">
                    </div>
                </div>

                <div class="input-group">
                    <label for="password" class="label">Senha</label>
                    <div class="input-wrap">
                        <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                        <input v-model="formData.password" id="password" :type="showPassword ? 'text' : 'password'"
                            required :minlength="isLoginView ? undefined : 6" :autocomplete="isLoginView ? 'current-password' : 'new-password'"
                            placeholder="Digite sua senha" class="input-field input-field--with-action">
                        <button type="button" class="input-action" @click="showPassword = !showPassword"
                            :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
                            :title="showPassword ? 'Ocultar senha' : 'Mostrar senha'">
                            <svg v-if="!showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></svg>
                            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 3 18 18" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.4 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a16.3 16.3 0 0 1-2.1 3.1" /><path d="M6.6 6.6C3.6 8.3 2 12 2 12s3.5 7 10 7c1 0 2-.2 2.8-.5" /></svg>
                        </button>
                    </div>
                    <p v-if="!isLoginView" class="field-hint">Use pelo menos 6 caracteres.</p>
                </div>

                <button type="submit" class="submit-button" :disabled="isLoading">
                    <span v-if="isLoading" class="loader" aria-hidden="true"></span>
                    <span v-else class="submit-button__label">
                        {{ isLoginView ? 'Entrar na CyberDock' : 'Criar minha conta' }}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                    </span>
                </button>
            </form>

            <div class="form-assurance">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></svg>
                <span>Seus dados são protegidos e usados somente para operar a plataforma.</span>
            </div>

            <p class="toggle-text">
                {{ isLoginView ? 'Ainda não usa a CyberDock?' : 'Já possui uma conta?' }}
                <button type="button" @click="toggleMode" class="toggle-link">
                    {{ isLoginView ? 'Crie seu acesso' : 'Entre agora' }}
                </button>
            </p>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { gsap } from 'gsap';
import AlertService from '../services/AlertService';
import Toast from './ToastComponent.vue';
import { useAuth } from '@/composables/useAuth';

const { loggedInUser, login, register, logout: authLogout } = useAuth();
const router = useRouter();
const isLoginView = ref(true);
const isLoading = ref(false);
const showPassword = ref(false);
const formData = reactive({ name: '', email: '', password: '' });

// Redireciona para o dashboard sempre que loggedInUser for preenchido
onMounted(() => {
  if (loggedInUser.value) {
    router.push('/dashboard');
  }
});

// Observa mudanças em loggedInUser para redirecionar imediatamente após login/registro
watch(() => loggedInUser.value, (val) => {
  if (val) {
    router.push('/dashboard');
  }
});

const clearForms = () => {
    formData.name = '';
    formData.email = '';
    formData.password = '';
};

const setMode = (loginMode) => {
    if (isLoginView.value === loginMode) return;
    isLoginView.value = loginMode;
    showPassword.value = false;
};

const toggleMode = () => setMode(!isLoginView.value);

const handleSubmit = async () => {
    isLoading.value = true;
    try {
        if (isLoginView.value) {
            await login(formData.email, formData.password);
            AlertService.success('Login realizado com sucesso!');
        } else {
            await register(formData.name, formData.email, formData.password);
            AlertService.success('Conta criada com sucesso!');
            // Após o registro, muda para a tela de login
            isLoginView.value = true; 
        }
        clearForms();
    } catch (error) {
        // O erro já vem tratado do composable de autenticação
        AlertService.error(error.message || 'Ocorreu um erro.');
    } finally {
        isLoading.value = false;
    }
};

const logout = async () => {
    await authLogout();
    AlertService.info('Você saiu da sua conta.');
    // A lógica de redirecionamento já está no composable
};

// Animações GSAP (sem alteração)
const beforeEnter = (el) => {
    gsap.set(el, { opacity: 0, y: -20 });
};
const enter = (el, done) => {
    gsap.to(el, { opacity: 1, y: 0, duration: 0.3, onComplete: done });
};
const leave = (el, done) => {
    gsap.to(el, { opacity: 0, y: -20, duration: 0.3, onComplete: done });
};
</script>

<style scoped>
/* O componente vive dentro do layout editorial de AuthComponent; por isso
   não precisa parecer um cartão flutuante pesado. */
.auth-container {
    width: min(100%, 460px);
    max-width: 460px;
    padding: 0;
    overflow: visible;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    box-sizing: border-box;
}

.mode-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    width: 100%;
    margin-bottom: clamp(2rem, 6vh, 3.25rem);
    padding: 4px;
    border: 1px solid #e7ebf1;
    border-radius: 14px;
    background: #f4f6f9;
}
.mode-tab {
    min-height: 40px;
    padding: 0.55rem 0.8rem;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: #748196;
    font: inherit;
    font-size: 0.82rem;
    font-weight: 650;
    cursor: pointer;
    transition: color 160ms ease, background 160ms ease, box-shadow 160ms ease;
}
.mode-tab.is-active {
    background: #fff;
    color: #172033;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.09), 0 4px 12px rgba(15, 23, 42, 0.04);
}
.mode-tab:focus-visible { outline: 3px solid rgba(37, 99, 235, 0.18); outline-offset: 1px; }

.form-header { margin-bottom: 2rem; }
.form-eyebrow {
    display: block;
    margin-bottom: 0.65rem;
    color: #2563eb;
    font-size: 0.72rem;
    font-weight: 750;
    letter-spacing: 0.1em;
    text-transform: uppercase;
}
.form-title {
    margin: 0 0 0.65rem;
    color: #111827;
    font-size: clamp(2rem, 4vw, 2.55rem);
    font-weight: 650;
    line-height: 1.08;
    letter-spacing: -0.045em;
}
.form-subtitle {
    max-width: 380px;
    margin: 0;
    color: #657186;
    font-size: 0.94rem;
    line-height: 1.55;
}

.input-group { margin-bottom: 1.15rem; }
.label {
    display: block;
    margin: 0 0 0.45rem;
    color: #344054;
    font-size: 0.8rem;
    font-weight: 650;
    text-align: left;
}
.input-wrap { position: relative; display: flex; align-items: center; }
.input-icon {
    position: absolute;
    left: 1rem;
    width: 18px;
    height: 18px;
    color: #98a2b3;
    pointer-events: none;
    transition: color 160ms ease;
}
.input-field {
    width: 100%;
    height: 54px;
    padding: 0 1rem 0 3rem;
    border: 1px solid #dce2ea;
    border-radius: 13px;
    box-sizing: border-box;
    background: #fbfcfd;
    color: #172033;
    font: inherit;
    font-size: 0.92rem;
    font-weight: 450;
    outline: none;
    transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
}
.input-field--with-action { padding-right: 3.25rem; }
.input-field::placeholder { color: #a4adba; opacity: 1; }
.input-wrap:focus-within .input-icon { color: #2563eb; }
.input-field:focus {
    border-color: #4b83e8;
    background: #fff;
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.11);
}
.input-field:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 1000px #fff inset;
    -webkit-text-fill-color: #172033;
}
.input-action {
    position: absolute;
    right: 0.72rem;
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    padding: 0;
    border: 0;
    border-radius: 9px;
    background: transparent;
    color: #8a96a8;
    cursor: pointer;
    transition: color 150ms ease, background 150ms ease;
}
.input-action svg { width: 18px; height: 18px; }
.input-action:hover { color: #344054; background: #eef3fa; }
.input-action:focus-visible { outline: 3px solid rgba(37, 99, 235, 0.18); }
.field-hint { margin: 0.42rem 0 0; color: #8a96a8; font-size: 0.72rem; }

.submit-button {
    width: 100%;
    min-height: 54px;
    margin-top: 0.55rem;
    padding: 0.8rem 1.15rem;
    border: 0;
    border-radius: 13px;
    background: #1d64d8;
    color: #fff;
    font: inherit;
    font-size: 0.92rem;
    font-weight: 680;
    cursor: pointer;
    box-shadow: 0 9px 22px rgba(29, 100, 216, 0.2);
    transition: transform 160ms ease, background 160ms ease, box-shadow 160ms ease;
}
.submit-button__label { display: inline-flex; align-items: center; justify-content: center; gap: 0.55rem; }
.submit-button__label svg { width: 17px; height: 17px; transition: transform 160ms ease; }
.submit-button:hover:not(:disabled) {
    background: #1859c3;
    transform: translateY(-1px);
    box-shadow: 0 12px 26px rgba(29, 100, 216, 0.25);
}
.submit-button:hover:not(:disabled) .submit-button__label svg { transform: translateX(2px); }
.submit-button:focus-visible { outline: 4px solid rgba(37, 99, 235, 0.18); outline-offset: 2px; }
.submit-button:disabled { background: #9ab8e8; cursor: wait; box-shadow: none; }

.form-assurance {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    margin-top: 1.15rem;
    color: #8490a2;
    font-size: 0.7rem;
    line-height: 1.45;
}
.form-assurance svg { width: 15px; height: 15px; flex: 0 0 auto; margin-top: 1px; color: #4b83e8; }
.toggle-text { margin: 1.65rem 0 0; color: #6d788a; font-size: 0.82rem; text-align: center; }
.toggle-link {
    margin: 0 0 0 0.2rem;
    padding: 0;
    border: 0;
    background: none;
    color: #1d64d8;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
}
.toggle-link:hover { color: #164ba6; text-decoration: underline; text-underline-offset: 3px; }
.toggle-link:focus-visible { outline: 3px solid rgba(37, 99, 235, 0.18); border-radius: 3px; }

.logged-in-view { text-align: center; color: #344054; }
.logged-in-view__icon {
    display: grid;
    place-items: center;
    width: 54px;
    height: 54px;
    margin: 0 auto 1.2rem;
    border-radius: 16px;
    background: #ecfdf3;
    color: #168352;
}
.logged-in-view__icon svg { width: 25px; height: 25px; }
.logged-in-view .form-eyebrow { text-align: center; }
.logged-in-view .form-title { font-size: 2rem; }
.logged-in-view .form-subtitle { margin-inline: auto; }
.user-email {
    margin: 1rem 0 0;
    padding: 0.75rem 1rem;
    border: 1px solid #e5eaf1;
    border-radius: 12px;
    background: #f8fafc;
    color: #344054;
    font-size: 0.86rem;
    font-weight: 650;
    word-break: break-word;
}
.logout-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    min-height: 50px;
    margin-top: 1.25rem;
    border: 1px solid #e5eaf1;
    border-radius: 12px;
    background: #fff;
    color: #344054;
    font: inherit;
    font-size: 0.85rem;
    font-weight: 650;
    cursor: pointer;
}
.logout-button svg { width: 16px; height: 16px; }
.logout-button:hover { background: #f8fafc; color: #b42318; transform: none; box-shadow: none; }

.loader {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255,255,255,0.4);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.75s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 820px) {
    .auth-container { width: min(100%, 460px); }
    .mode-tabs { margin-bottom: 2.25rem; }
}
@media (max-width: 480px) {
    .auth-container { padding: 0; border-radius: 0; }
    .mode-tabs { margin-bottom: 1.9rem; }
    .form-header { margin-bottom: 1.65rem; }
    .form-title { font-size: 2rem; }
    .input-field { height: 52px; font-size: 16px; }
    .submit-button { min-height: 52px; }
}
@media (prefers-reduced-motion: reduce) {
    .auth-container * { transition: none !important; animation-duration: 0.01ms !important; }
}
</style>
