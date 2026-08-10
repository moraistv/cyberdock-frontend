<template>
    <div class="auth-container">
        <Toast />
        <div v-if="loggedInUser" class="logged-in-view">
            <span class="logged-in-view__icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            </span>
            <h2 class="title">Bem-vindo(a)!</h2>
            <p class="subtitle">Você está logado como:</p>
            <p class="user-email">{{ loggedInUser.email }}</p>
            <button @click="logout" class="logout-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                Sair
            </button>
        </div>

        <div v-else class="form-container">
            <div class="form-header">
                <h2 class="form-title">{{ isLoginView ? 'Entrar' : 'Criar conta' }}</h2>
                <p class="form-subtitle">{{ isLoginView ? 'Acesse o painel da sua operação.' : 'Leva menos de um minuto.' }}</p>
            </div>

            <form @submit.prevent="handleSubmit" novalidate>
                <transition @before-enter="beforeEnter" @enter="enter" @leave="leave">
                    <div v-if="!isLoginView" class="input-group" key="name">
                        <label for="name" class="label">Nome</label>
                        <div class="input-wrap">
                            <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            <input
                                v-model="formData.name" id="name" type="text" required
                                autocomplete="name" placeholder="Seu nome completo"
                                class="input-field"
                            >
                        </div>
                    </div>
                </transition>

                <div class="input-group">
                    <label for="email" class="label">E-mail</label>
                    <div class="input-wrap">
                        <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                        <input
                            v-model="formData.email" id="email" type="email" required
                            autocomplete="email" placeholder="voce@empresa.com"
                            class="input-field"
                        >
                    </div>
                </div>

                <div class="input-group">
                    <div class="label-row">
                        <label for="password" class="label">Senha</label>
                    </div>
                    <div class="input-wrap">
                        <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                        <input
                            v-model="formData.password" id="password" :type="showPassword ? 'text' : 'password'" required
                            :autocomplete="isLoginView ? 'current-password' : 'new-password'"
                            placeholder="••••••••"
                            class="input-field input-field--with-action"
                        >
                        <button
                            type="button" class="input-action" @click="showPassword = !showPassword"
                            :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
                            :title="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
                        >
                            <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                            <svg v-else xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 4.22-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                        </button>
                    </div>
                </div>

                <button type="submit" class="submit-button" :disabled="isLoading">
                    <span v-if="isLoading" class="loader" aria-hidden="true"></span>
                    <span v-else class="submit-button__label">
                        {{ isLoginView ? 'Entrar' : 'Cadastrar' }}
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                    </span>
                </button>
            </form>

            <p class="toggle-text">
                {{ isLoginView ? 'Não tem uma conta?' : 'Já tem uma conta?' }}
                <a @click.prevent="toggleMode" href="#" class="toggle-link">
                    {{ isLoginView ? 'Cadastre-se' : 'Faça login' }}
                </a>
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

const toggleMode = () => {
    isLoginView.value = !isLoginView.value;
    showPassword.value = false;
};

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
.auth-container {
    background-color: #ffffff;
    padding: 2.75rem;
    border-radius: 1.25rem;
    border: 1px solid #e5e7eb;
    box-shadow: 0 20px 45px -20px rgba(15, 23, 42, 0.18), 0 2px 4px -2px rgb(0 0 0 / 0.05);
    position: relative;
    overflow: hidden;
    max-width: 420px;
    width: 100%;
    box-sizing: border-box;
}

/* ===== Estado logado ===== */
.logged-in-view {
    text-align: center;
    color: #374151;
}
.logged-in-view__icon {
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    margin: 0 auto 1.1rem;
    border-radius: 50%;
    background: #ecfdf5;
    color: #059669;
}
.title {
    font-size: 1.6rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 0.6rem;
}
.subtitle {
    color: #6b7280;
    margin-bottom: 1rem;
    font-size: 0.9rem;
}
.user-email {
    font-weight: 600;
    color: #4f46e5;
    word-break: break-all;
    background-color: #f0f0f8;
    padding: 0.6rem 1rem;
    border-radius: 0.6rem;
    font-size: 0.9rem;
}
.logout-button {
    margin-top: 2rem;
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background-color: #ef4444;
    color: #ffffff;
    padding: 0.75rem 0;
    border-radius: 0.6rem;
    border: none;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s ease-in-out;
}
.logout-button:hover {
    background-color: #dc2626;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(239, 68, 68, 0.2);
}

/* ===== Formulário ===== */
.form-container {
    position: relative;
}
.form-header { margin-bottom: 1.9rem; }
.form-title {
    font-size: 1.7rem;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.01em;
    margin: 0 0 0.35rem;
}
.form-subtitle {
    color: #6b7280;
    margin: 0;
    font-size: 0.9rem;
}

.input-group { margin-bottom: 1.15rem; }
.label-row { display: flex; align-items: baseline; justify-content: space-between; }
.label {
    display: block;
    font-size: 0.82rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.4rem;
    text-align: left;
}

/* Campo com ícone à esquerda (e ação opcional à direita, ex: mostrar senha) */
.input-wrap {
    position: relative;
    display: flex;
    align-items: center;
}
.input-icon {
    position: absolute;
    left: 0.85rem;
    color: #9ca3af;
    pointer-events: none;
    flex-shrink: 0;
}
.input-field {
    width: 100%;
    padding: 0.7rem 0.9rem 0.7rem 2.55rem;
    border: 1px solid #d1d5db;
    border-radius: 0.6rem;
    box-sizing: border-box;
    background-color: #f9fafb;
    color: #1f2937;
    font-size: 0.925rem;
    transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
}
.input-field--with-action { padding-right: 2.6rem; }
.input-field::placeholder { color: #9ca3af; }
.input-field:focus {
    outline: none;
    border-color: #6366f1;
    background-color: #fff;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}
.input-field:focus ~ .input-icon,
.input-wrap:focus-within .input-icon { color: #6366f1; }

.input-action {
    position: absolute;
    right: 0.6rem;
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    color: #9ca3af;
    border-radius: 0.4rem;
    cursor: pointer;
    transition: color 0.15s, background-color 0.15s;
}
.input-action:hover { color: #4b5563; background-color: #eef2ff; }
.input-action:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2); }

.submit-button {
    margin-top: 0.5rem;
    width: 100%;
    background-color: #4f46e5;
    color: #ffffff;
    padding: 0.85rem 0;
    border-radius: 0.6rem;
    border: none;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.975rem;
    transition: all 0.2s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
}
.submit-button__label {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
}
.submit-button:disabled {
    background-color: #a5b4fc;
    cursor: not-allowed;
}
.submit-button:hover:not(:disabled) {
    background-color: #4338ca;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px -4px rgba(79, 70, 229, 0.4);
}
.submit-button:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.35);
}

.loader {
    border: 2px solid rgba(255, 255, 255, 0.4);
    border-top: 2px solid #ffffff;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.toggle-text {
    text-align: center;
    font-size: 0.875rem;
    color: #4b5563;
    margin-top: 1.6rem;
}
.toggle-link {
    font-weight: 600;
    color: #4f46e5;
    text-decoration: none;
    cursor: pointer;
    transition: color 0.2s;
}
.toggle-link:hover { color: #4338ca; }

@media (max-width: 480px) {
    .auth-container { padding: 2rem 1.5rem; border-radius: 1rem; }
}
</style>
