import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { API_BASE_URL } from '@/config';

const loggedInUser = ref(null);
const token = ref(localStorage.getItem('authToken'));
const isAuthReady = ref(false);

// ✅ NOVO: estado reativo das contas ML
const mlAccounts = ref([]);
// ✅ NOVO: estado reativo das lojas Shopee
const shopeeAccounts = ref([]);

// useAuth() é chamado por vários componentes na mesma página (Sidebar,
// Topbar, a própria view). Sem esta guarda, o onMounted abaixo roda uma vez
// por componente montado e refaz login/refreshUserData/fetchContas a cada
// vez — na prática, o mesmo boot de autenticação repetido 5+ vezes por
// navegação, sobrecarregando o log e a rede sem necessidade.
let authBootStarted = false;

export function useAuth() {
    const router = useRouter();

    const parseJwt = (tokenStr) => {
        try {
            return JSON.parse(atob(tokenStr.split('.')[1]));
        } catch {
            return null;
        }
    };

    const setUserSession = (newToken) => {
        console.log('🔐 [useAuth] setUserSession chamado com token:', !!newToken);
        
        if (newToken) {
            token.value = newToken;
            localStorage.setItem('authToken', newToken);
            const userData = parseJwt(newToken);
            console.log('🔐 [useAuth] Dados do token parseado:', userData);
            
            loggedInUser.value = {
                ...userData,
                name: userData?.name || userData?.displayName || '',
                displayName: userData?.displayName || userData?.name || '',
                email: userData?.email || '',
                role: userData?.role || 'usuario',
            };
            console.log('🔐 [useAuth] Usuário configurado:', loggedInUser.value);
        } else {
            console.log('🔐 [useAuth] Limpando sessão do usuário');
            token.value = null;
            localStorage.removeItem('authToken');
            loggedInUser.value = null;
            // ✅ limpa contas ao sair
            mlAccounts.value = [];
            shopeeAccounts.value = [];
        }
    };

    const refreshUserData = async () => {
        if (!loggedInUser.value?.uid) return;
        try {
            const response = await fetch(`${API_BASE_URL}/auth/user?uid=${loggedInUser.value.uid}`, {
                headers: { 'Authorization': `Bearer ${token.value}` }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.user) {
                    loggedInUser.value = { ...loggedInUser.value, ...data.user };
                }
            }
        } catch (error) {
            console.error('Erro ao atualizar dados do usuário:', error);
        }
    };

    const login = async (email, password) => {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Falha no login');

        setUserSession(data.token);
        await refreshUserData();
        // ✅ carrega contas após login
        await fetchMercadoLivreAccounts();

        if (router) await router.push('/dashboard');
    };

    const register = async (name, email, password) => {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Falha no registro');

        await login(email, password);
    };

    const logout = () => {
        setUserSession(null);
        if (router) router.push('/auth');
    };

    // ✅ Agora popula mlAccounts.value
    async function fetchMercadoLivreAccounts() {
        const uid = loggedInUser.value?.uid;
        if (!uid) {
            mlAccounts.value = [];
            return [];
        }
        try {
            const response = await fetch(`${API_BASE_URL}/ml/contas/${uid}`, {
                headers: { 'Authorization': `Bearer ${token.value}` } // ok mesmo sem exigir no backend
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data?.error || 'Erro ao buscar contas Mercado Livre');

            mlAccounts.value = Array.isArray(data) ? data : [];
            return mlAccounts.value;
        } catch (err) {
            console.error("Erro em fetchMercadoLivreAccounts:", err);
            mlAccounts.value = [];
            return { error: err.message };
        }
    }

    // ✅ Popula shopeeAccounts.value
    async function fetchShopeeAccounts() {
        const uid = loggedInUser.value?.uid;
        if (!uid) {
            shopeeAccounts.value = [];
            return [];
        }
        try {
            const response = await fetch(`${API_BASE_URL}/shopee/contas/${uid}`, {
                headers: { 'Authorization': `Bearer ${token.value}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data?.error || 'Erro ao buscar lojas Shopee');

            shopeeAccounts.value = Array.isArray(data) ? data : [];
            return shopeeAccounts.value;
        } catch (err) {
            console.error("Erro em fetchShopeeAccounts:", err);
            shopeeAccounts.value = [];
            return { error: err.message };
        }
    }

    // onMounted é registrado uma vez PARA CADA componente que chama useAuth()
    // (Sidebar, Topbar, a view da página...). A guarda `authBootStarted`
    // garante que o trabalho de boot (ler token, revalidar sessão, buscar
    // contas ML/Shopee) rode uma única vez por carregamento de página, e não
    // uma vez por componente.
    onMounted(async () => {
        if (authBootStarted) return;
        authBootStarted = true;

        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
            const userData = parseJwt(storedToken);
            if (userData && userData.exp * 1000 > Date.now()) {
                setUserSession(storedToken);
                await refreshUserData();
            } else {
                setUserSession(null);
            }
        }
        isAuthReady.value = true;

        // ✅ tenta carregar contas assim que possível
        if (loggedInUser.value?.uid) {
            await fetchMercadoLivreAccounts();
            await fetchShopeeAccounts();
        }
    });

    // ✅ ao mudar o usuário (login/logout/troca), refaz a lista de contas.
    // watch() acumularia um listener por componente também, mas aqui o custo
    // é apenas a checagem do uid — mantido simples e sem guarda extra.
    watch(() => loggedInUser.value?.uid, async (uid) => {
        if (uid) {
            await fetchMercadoLivreAccounts();
            await fetchShopeeAccounts();
        } else {
            mlAccounts.value = [];
            shopeeAccounts.value = [];
        }
    });

    const userRole = computed(() => loggedInUser.value?.role || 'usuario');
    const user = loggedInUser;

    return {
        loggedInUser,
        token,
        login,
        register,
        logout,
        userRole,
        user,
        isAuthReady,
        // ✅ expõe o estado reativo e a função
        mlAccounts,
        fetchMercadoLivreAccounts,
        shopeeAccounts,
        fetchShopeeAccounts,
        refreshUserData,
    };
}
