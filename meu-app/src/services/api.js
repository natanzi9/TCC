// ============================================================
// API Service - SGA SENAI Mobile
// Centraliza todas as chamadas HTTP ao backend Flask
// ============================================================
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const BACKEND_PORT = 5001;
const DEFAULT_TIMEOUT_MS = 8000;

export function resolveDefaultApiBase() {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      return 'http://' + window.location.hostname + ':' + BACKEND_PORT;
    }
    return 'http://localhost:' + BACKEND_PORT;
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest?.debuggerHost;

  if (hostUri && typeof hostUri === 'string') {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return 'http://' + ip + ':' + BACKEND_PORT;
    }
  }

  return 'http://192.168.0.17:' + BACKEND_PORT;
}

let currentApiBase = resolveDefaultApiBase();

export function getApiBase() {
  return currentApiBase;
}

export function setApiBase(newUrl) {
  if (!newUrl) return;
  currentApiBase = newUrl.replace(/\/+$/, '');
}

export const API_BASE = currentApiBase;

// ---- helpers de rede ----

export async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error(
        'Tempo limite excedido (' + (timeoutMs / 1000) + 's) ao conectar no servidor (' + getApiBase() + '). Verifique se o servidor está ligado e se o celular está no mesmo Wi-Fi.'
      );
    }
    throw new Error('Falha de conexão com ' + getApiBase() + ': ' + (err?.message || 'Servidor inacessível'));
  } finally {
    clearTimeout(timer);
  }
}

async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => 'Erro desconhecido');
    try {
      const parsed = JSON.parse(text);
      if (parsed?.erro) throw new Error(parsed.erro);
    } catch (e) {
      if (e?.message && e.message !== text) throw e;
    }
    throw new Error('HTTP ' + res.status + ': ' + text);
  }
  return res.json();
}

export function getItemImageUrl(imagem) {
  if (!imagem || typeof imagem !== 'string' || imagem.trim() === '') return null;
  return getApiBase() + '/static/uploads/' + imagem;
}

// ---- autenticação / login ----

export async function autenticar(username, senha, tipo) {
  try {
    const res = await fetchWithTimeout(getApiBase() + '/api/checar_login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, senha, tipo }),
    });

    const json = await res.json().catch(() => ({}));
    if (res.ok && json.valido) {
      return {
        valido: true,
        tipo: json.tipo === 'adm' ? 'adm' : 'user',
        usuario: json.usuario || username,
      };
    }

    return {
      valido: false,
      tipo: 'user',
      usuario: username,
      erro: json.erro || 'Usuário ou senha incorretos.',
    };
  } catch (err) {
    throw new Error(err?.message || 'Erro de conexão com o servidor');
  }
}

export async function checarAdm(username, senha) {
  const res = await autenticar(username, senha, 'adm');
  return res.valido && res.tipo === 'adm';
}

export async function loginUsuario(username, senha) {
  const res = await autenticar(username, senha, 'user');
  return res.valido;
}

// ---- estoque ----

export async function getEstoque() {
  const res = await fetchWithTimeout(getApiBase() + '/api/estoque');
  const json = await handleResponse(res);
  return json.estoque ?? [];
}

export async function adicionarItem(item) {
  const res = await fetchWithTimeout(getApiBase() + '/api/adicionarestoque', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  return handleResponse(res);
}

export async function alterarItem(id, item) {
  const res = await fetchWithTimeout(getApiBase() + '/api/alteraritem/' + id, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  return handleResponse(res);
}

export async function removerItem(id) {
  const res = await fetchWithTimeout(getApiBase() + '/api/removeritem/' + id, {
    method: 'DELETE',
  });
  return handleResponse(res);
}

export async function getItemCompleto(id) {
  const res = await fetchWithTimeout(getApiBase() + '/api/item_completo/' + id);
  return handleResponse(res);
}

// ---- saídas ----

export async function getSaidas() {
  const res = await fetchWithTimeout(getApiBase() + '/api/saidas');
  const json = await handleResponse(res);
  return json.saidas ?? [];
}

export async function registrarSaida(payload) {
  const res = await fetchWithTimeout(getApiBase() + '/api/registrarsaida', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function registrarDevolucao(payload) {
  const res = await fetchWithTimeout(getApiBase() + '/api/devolucao', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

// ---- usuários ----

export async function getUsuarios() {
  const res = await fetchWithTimeout(getApiBase() + '/api/mostraruser');
  return handleResponse(res);
}

export async function criarUsuario(usuario, senha) {
  const res = await fetchWithTimeout(getApiBase() + '/api/adicionaruser', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, senha }),
  });
  return handleResponse(res);
}

export async function removerUsuario(id) {
  const res = await fetchWithTimeout(getApiBase() + '/api/remover/' + id, { method: 'DELETE' });
  return handleResponse(res);
}
