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
let authWatcherStarted = false;
let mlAccountsRequest = null;
let shopeeAccountsRequest = null;

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
        if (newToken) {
            token.value = newToken;
            localStorage.setItem('authToken', newToken);
            const userData = parseJwt(newToken);

            loggedInUser.value = {
                ...userData,
                name: userData?.name || userData?.displayName || '',
                displayName: userData?.displayName || userData?.name || '',
                email: userData?.email || '',
                role: userData?.role || 'usuario',
            };
        } else {
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
        // As duas listas são compartilhadas por toda a aplicação.
        await Promise.all([fetchMercadoLivreAccounts(true), fetchShopeeAccounts(true)]);

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
    async function fetchMercadoLivreAccounts(force = false) {
        const uid = loggedInUser.value?.uid;
        if (!uid) {
            mlAccounts.value = [];
            return [];
        }
        if (!force && mlAccounts.value.length) return mlAccounts.value;
        if (mlAccountsRequest) return mlAccountsRequest;

        mlAccountsRequest = (async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/ml/contas/${uid}`, {
                    headers: { 'Authorization': `Bearer ${token.value}` }
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data?.error || 'Erro ao buscar contas Mercado Livre');
                mlAccounts.value = Array.isArray(data) ? data : [];
                return mlAccounts.value;
            } catch (err) {
                console.error('Erro em fetchMercadoLivreAccounts:', err);
                mlAccounts.value = [];
                return { error: err.message };
            } finally {
                mlAccountsRequest = null;
            }
        })();
        return mlAccountsRequest;
    }

    // ✅ Popula shopeeAccounts.value
    async function fetchShopeeAccounts(force = false) {
        const uid = loggedInUser.value?.uid;
        if (!uid) {
            shopeeAccounts.value = [];
            return [];
        }
        if (!force && shopeeAccounts.value.length) return shopeeAccounts.value;
        if (shopeeAccountsRequest) return shopeeAccountsRequest;

        shopeeAccountsRequest = (async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/shopee/contas/${uid}`, {
                    headers: { 'Authorization': `Bearer ${token.value}` }
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data?.error || 'Erro ao buscar lojas Shopee');
                shopeeAccounts.value = Array.isArray(data) ? data : [];
                return shopeeAccounts.value;
            } catch (err) {
                console.error('Erro em fetchShopeeAccounts:', err);
                shopeeAccounts.value = [];
                return { error: err.message };
            } finally {
                shopeeAccountsRequest = null;
            }
        })();
        return shopeeAccountsRequest;
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
            await Promise.all([fetchMercadoLivreAccounts(), fetchShopeeAccounts()]);
        }
    });

    // Registra um único watcher global, mesmo que Sidebar, Topbar e view usem
    // o composable simultaneamente. Requests em andamento também são deduplicados.
    if (!authWatcherStarted) {
        authWatcherStarted = true;
        watch(() => loggedInUser.value?.uid, async (uid, previousUid) => {
            if (uid && uid !== previousUid && isAuthReady.value) {
                await Promise.all([fetchMercadoLivreAccounts(), fetchShopeeAccounts()]);
            } else if (!uid) {
                mlAccounts.value = [];
                shopeeAccounts.value = [];
            }
        });
    }

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
