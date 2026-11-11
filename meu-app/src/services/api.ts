// ============================================================
// API Service - SGA SENAI Mobile
// Centraliza todas as chamadas HTTP ao backend Flask
// ============================================================
import { Platform } from 'react-native';

export function resolveDefaultApiBase(): string {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      return `http://${window.location.hostname}:5000`;
    }
    return 'http://localhost:5000';
  }
  // IP da máquina na rede local Wi-Fi
  return 'http://10.154.49.255:5000';
}

let currentApiBase = resolveDefaultApiBase();

export function getApiBase(): string {
  return currentApiBase;
}

export function setApiBase(newUrl: string): void {
  currentApiBase = newUrl.replace(/\/+$/, '');
}

export const API_BASE = currentApiBase;

// ---- tipos ----

export interface EstoqueItem {
  id: number;
  nome: string;
  categoria?: string;
  descricao?: string;
  preco?: number;
  quantidade: number;
  estoque_min?: number;
  imagem?: string;
}

export interface Saida {
  id: number;
  item: string;
  qtde: number;
  data?: string;
  solicitante?: string;
  almoxarife?: string;
  descricao?: string;
  categoria?: string;
  devolucao?: string;
  qtde_devolvida?: number;
  status_devolucao?: string;
}

export interface LoginPayload {
  username: string;
  senha: string;
  tipo: 'user' | 'adm';
}

// ---- helpers ----

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => 'Erro desconhecido');
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export function getItemImageUrl(imagem?: string | null): string | null {
  if (!imagem || imagem.trim() === '') return null;
  return `${getApiBase()}/static/uploads/${imagem}`;
}

// ---- estoque ----

export async function getEstoque(): Promise<EstoqueItem[]> {
  const res = await fetch(`${getApiBase()}/api/estoque`);
  const json = await handleResponse<{ sucesso: boolean; estoque: EstoqueItem[] }>(res);
  return json.estoque ?? [];
}

export async function adicionarItem(item: Omit<EstoqueItem, 'id'>): Promise<{ sucesso: boolean; id: number }> {
  const res = await fetch(`${getApiBase()}/api/adicionarestoque`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  return handleResponse(res);
}

export async function alterarItem(
  id: number,
  item: Partial<EstoqueItem>,
): Promise<{ sucesso: boolean; mensagem: string }> {
  const res = await fetch(`${getApiBase()}/api/alteraritem/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  return handleResponse(res);
}

export async function removerItem(id: number): Promise<{ sucesso: boolean; mensagem: string }> {
  const res = await fetch(`${getApiBase()}/api/removeritem/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(res);
}

export async function getItemCompleto(id: number): Promise<EstoqueItem> {
  const res = await fetch(`${getApiBase()}/api/item_completo/${id}`);
  return handleResponse(res);
}

// ---- saídas ----

export interface RegistrarSaidaPayload {
  itens: Array<{ id: number; nome: string; qtde: number; devolucao: string }>;
  solicitante: string;
  almoxarife: string;
  data: string;
  obs: string;
}

export async function getSaidas(): Promise<Saida[]> {
  const res = await fetch(`${getApiBase()}/api/saidas`);
  const json = await handleResponse<{ sucesso: boolean; saidas: Saida[] }>(res);
  return json.saidas ?? [];
}

export async function registrarSaida(payload: RegistrarSaidaPayload): Promise<{ ok: boolean }> {
  const res = await fetch(`${getApiBase()}/api/registrarsaida`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function registrarDevolucao(payload: {
  nome: string;
  qtde: number;
  status: 'parcial' | 'total';
  saida_id: number;
}): Promise<{ ok: boolean }> {
  const res = await fetch(`${getApiBase()}/api/devolucao`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

// ---- login ----

export async function checarAdm(username: string, senha: string): Promise<boolean> {
  const res = await fetch(`${getApiBase()}/api/checar_adm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, senha }),
  });
  const json = await handleResponse<{ valido: boolean }>(res);
  return !!json.valido;
}

export async function loginUsuario(username: string, senha: string): Promise<boolean> {
  const form = new FormData();
  form.append('username', username);
  form.append('senha', senha);
  form.append('tipo', 'user');

  const res = await fetch(`${getApiBase()}/api/login`, {
    method: 'POST',
    body: form,
  });

  const text = await res.text();
  const isError = text.includes('alert(') || text.includes('incorretos');
  return !isError;
}

// ---- usuários ----

export async function getUsuarios(): Promise<{ sucesso: boolean; usuarios: Array<{ id: number; usuario: string }> }> {
  const res = await fetch(`${getApiBase()}/api/mostraruser`);
  return handleResponse(res);
}

export async function criarUsuario(usuario: string, senha: string): Promise<{ sucesso: boolean; id: number }> {
  const res = await fetch(`${getApiBase()}/api/adicionaruser`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, senha }),
  });
  return handleResponse(res);
}

export async function removerUsuario(id: number): Promise<{ sucesso: boolean }> {
  const res = await fetch(`${getApiBase()}/api/remover/${id}`, { method: 'DELETE' });
  return handleResponse(res);
}
