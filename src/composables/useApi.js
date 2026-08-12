// src/composables/useApi.js
import { useAuth } from './useAuth';
import { API_BASE_URL } from '../config';

// evita // duplo ou falta de /
function joinUrl(base, path) {
  const b = String(base || '').replace(/\/+$/, '');
  const p = String(path || '').replace(/^\/+/, '');
  return `${b}/${p}`;
}

export function useApi() {
  const { token } = useAuth();

  const request = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token?.value) {
      headers.Authorization = `Bearer ${token.value}`;
    }

    const url = joinUrl(API_BASE_URL, endpoint);

    try {
      const res = await fetch(url, { ...options, headers });

      if (res.status === 204) return {};

      if (res.ok) {
        // Se a resposta é um blob (arquivo), retorna o blob diretamente
        if (options.responseType === 'blob') {
          return await res.blob();
        }

        try {
          return await res.json();
        } catch {
          // Resposta sem corpo JSON válido: trata como vazia.
          return {};
        }
      }

      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      const msg =
        (data && (data.message || data.error)) ||
        `Erro ${res.status} ${res.statusText}`;

      const err = new Error(msg);
      err.status = res.status;
      err.data = data;
      err.url = url;
      throw err;
    } catch (fetchError) {
      // Cancelamentos são parte normal de filtros rápidos e navegação entre
      // rotas; não poluem o console nem representam falha para o usuário.
      if (fetchError?.name !== 'AbortError') {
        console.error(`[useApi] ${options.method || 'GET'} ${endpoint} falhou:`, fetchError.message);
      }
      throw fetchError;
    }
  };

  return {
    get: (endpoint, options) =>
      request(endpoint, { ...options, method: 'GET' }),
    post: (endpoint, body, options) =>
      request(endpoint, {
        ...options,
        method: 'POST',
        body: JSON.stringify(body),
      }),
    put: (endpoint, body, options) =>
      request(endpoint, {
        ...options,
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    patch: (endpoint, body, options) =>
      request(endpoint, {
        ...options,
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
      }),
    delete: (endpoint, options) =>
      request(endpoint, { ...options, method: 'DELETE' }),
  };
}
