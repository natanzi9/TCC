// ============================================================
// API Service - SGA SENAI Mobile
// Centraliza todas as chamadas HTTP ao backend Flask
// ============================================================

// IP do servidor — ajuste se necessário
export const API_BASE = 'http://10.154.49.132:5000';

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

// ---- estoque ----

export async function getEstoque(): Promise<EstoqueItem[]> {
  const res = await fetch(`${API_BASE}/api/estoque`);
  const json = await handleResponse<{ sucesso: boolean; estoque: EstoqueItem[] }>(res);
  return json.estoque ?? [];
}

export async function adicionarItem(item: Omit<EstoqueItem, 'id'>): Promise<{ sucesso: boolean; id: number }> {
  const res = await fetch(`${API_BASE}/api/adicionarestoque`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  return handleResponse(res);
}

export async function getItemCompleto(id: number): Promise<EstoqueItem> {
  const res = await fetch(`${API_BASE}/api/item_completo/${id}`);
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

export async function registrarSaida(payload: RegistrarSaidaPayload): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_BASE}/api/registrarsaida`, {
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
  const res = await fetch(`${API_BASE}/api/devolucao`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

// ---- login ----

export async function checarAdm(username: string, senha: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/checar_adm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, senha }),
  });
  const json = await handleResponse<{ valido: boolean }>(res);
  return json.valido;
}

// ---- usuários ----

export async function getUsuarios(): Promise<{ sucesso: boolean; usuarios: Array<{ id: number; usuario: string }> }> {
  const res = await fetch(`${API_BASE}/api/mostraruser`);
  return handleResponse(res);
}

export async function criarUsuario(usuario: string, senha: string): Promise<{ sucesso: boolean; id: number }> {
  const res = await fetch(`${API_BASE}/api/adicionaruser`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, senha }),
  });
  return handleResponse(res);
}

export async function removerUsuario(id: number): Promise<{ sucesso: boolean }> {
  const res = await fetch(`${API_BASE}/api/remover/${id}`, { method: 'DELETE' });
  return handleResponse(res);
}
