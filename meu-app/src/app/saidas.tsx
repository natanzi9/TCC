// ============================================================
// saidas.tsx — Histórico de saídas e devoluções
// ============================================================
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getEstoque, registrarDevolucao, EstoqueItem, Saida, API_BASE } from '@/services/api';

const BLUE = '#1565C0';
const ORANGE = '#E65100';
const GREEN = '#2E7D32';
const RED = '#C62828';
const PURPLE = '#6A1B9A';

function statusDevolucaoColor(status?: string): string {
  if (status === 'total') return GREEN;
  if (status === 'parcial') return ORANGE;
  return '#AAA';
}

function statusDevolucaoLabel(status?: string | null, devolucao?: string): string {
  if (devolucao === 'Não') return 'Sem devolução';
  if (status === 'total') return '✅ Total';
  if (status === 'parcial') return '🔄 Parcial';
  return '⏳ Pendente';
}

function SaidaCard({ saida, onDevolucao }: { saida: Saida; onDevolucao: (s: Saida) => void }) {
  const color = statusDevolucaoColor(saida.status_devolucao ?? undefined);
  return (
    <View style={styles.saidaCard}>
      <View style={styles.saidaCardTop}>
        <View style={styles.saidaIconBox}>
          <Text style={styles.saidaIcon}>📤</Text>
        </View>
        <View style={styles.saidaInfo}>
          <Text style={styles.saidaNome} numberOfLines={1}>{saida.item}</Text>
          <Text style={styles.saidaSub}>
            Qtde: <Text style={styles.bold}>{saida.qtde}</Text>  •  {saida.data ?? 'Sem data'}
          </Text>
          {saida.solicitante && (
            <Text style={styles.saidaSub}>Solicitante: {saida.solicitante}</Text>
          )}
        </View>
        <View style={[styles.devBadge, { backgroundColor: color + '22', borderColor: color }]}>
          <Text style={[styles.devBadgeText, { color }]}>
            {statusDevolucaoLabel(saida.status_devolucao, saida.devolucao)}
          </Text>
        </View>
      </View>

      {saida.descricao && (
        <Text style={styles.saidaDesc} numberOfLines={1}>📝 {saida.descricao}</Text>
      )}

      {saida.devolucao === 'Sim' && saida.status_devolucao !== 'total' && (
        <TouchableOpacity style={styles.devBtn} onPress={() => onDevolucao(saida)}>
          <Text style={styles.devBtnText}>Registrar Devolução</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function SaidasScreen() {
  const router = useRouter();

  const [saidas, setSaidas] = useState<Saida[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Modal de devolução
  const [devModal, setDevModal] = useState(false);
  const [devSaida, setDevSaida] = useState<Saida | null>(null);
  const [devQtde, setDevQtde] = useState('');
  const [devStatus, setDevStatus] = useState<'parcial' | 'total'>('total');
  const [devLoading, setDevLoading] = useState(false);

  const carregar = useCallback(async () => {
    try {
      // Reutilizamos a rota /home para pegar saídas via endpoint dedicado
      const res = await fetch(`${API_BASE}/home`);
      // O backend retorna HTML. Precisamos usar o endpoint de saídas da API
      // Como o backend não tem GET /api/saidas, fazemos via endpoint de home parseado
      // Alternativa: vamos usar um endpoint auxiliar que adicionamos
      // Por ora, buscamos via endpoint não padronizado — retornamos vazio e mostramos aviso
      setSaidas([]);
    } catch {
      // Silencia
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Tenta buscar saídas por endpoint customizado
  const carregarSaidas = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/saidas`);
      if (res.ok) {
        const json: { saidas: Saida[] } = await res.json();
        setSaidas(json.saidas ?? []);
      } else {
        // Endpoint não existe ainda — indica ao usuário
        setSaidas([]);
      }
    } catch {
      setSaidas([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregarSaidas();
  }, [carregarSaidas]);

  const filtradas = saidas.filter(
    (s) =>
      s.item.toLowerCase().includes(search.toLowerCase()) ||
      (s.solicitante ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  function abrirDevolucao(saida: Saida) {
    setDevSaida(saida);
    setDevQtde(String(saida.qtde));
    setDevStatus('total');
    setDevModal(true);
  }

  async function confirmarDevolucao() {
    if (!devSaida) return;
    const qtde = parseInt(devQtde, 10);
    if (isNaN(qtde) || qtde <= 0) {
      Alert.alert('Atenção', 'Informe uma quantidade válida.');
      return;
    }
    setDevLoading(true);
    try {
      await registrarDevolucao({
        nome: devSaida.item,
        qtde,
        status: devStatus,
        saida_id: devSaida.id,
      });
      Alert.alert('Sucesso', 'Devolução registrada!');
      setDevModal(false);
      carregarSaidas();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert('Erro', msg);
    } finally {
      setDevLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saídas</Text>
        <TouchableOpacity onPress={() => router.push('/registrar-saida')} style={styles.addBtn}>
          <Text style={styles.addText}>+ Nova</Text>
        </TouchableOpacity>
      </View>

      {/* Busca */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar item ou solicitante..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearSearch}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Info */}
      <View style={styles.infoBar}>
        <Text style={styles.infoText}>{filtradas.length} saídas registradas</Text>
        <TouchableOpacity onPress={() => { setRefreshing(true); carregarSaidas(); }}>
          <Text style={styles.refreshBtn}>🔄 Atualizar</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={BLUE} size="large" style={{ marginTop: 48 }} />
      ) : saidas.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyTitle}>Nenhuma saída registrada</Text>
          <Text style={styles.emptyDesc}>
            O endpoint /api/saidas precisa ser adicionado ao backend Flask para listar saídas aqui.
          </Text>
          <TouchableOpacity style={styles.newSaidaBtn} onPress={() => router.push('/registrar-saida')}>
            <Text style={styles.newSaidaBtnText}>Registrar Nova Saída</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtradas}
          keyExtractor={(s) => String(s.id)}
          renderItem={({ item }) => <SaidaCard saida={item} onDevolucao={abrirDevolucao} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          onRefresh={() => { setRefreshing(true); carregarSaidas(); }}
          refreshing={refreshing}
        />
      )}

      {/* Modal Devolução */}
      <Modal visible={devModal} transparent animationType="slide" onRequestClose={() => setDevModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Registrar Devolução</Text>
            <Text style={styles.modalItem}>Item: <Text style={styles.bold}>{devSaida?.item}</Text></Text>
            <Text style={styles.modalItem}>Qtde saída: <Text style={styles.bold}>{devSaida?.qtde}</Text></Text>

            <Text style={styles.inputLabel}>Quantidade devolvida</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={devQtde}
              onChangeText={setDevQtde}
              placeholder="Ex: 2"
              placeholderTextColor="#999"
            />

            <Text style={styles.inputLabel}>Tipo de devolução</Text>
            <View style={styles.statusRow}>
              <TouchableOpacity
                style={[styles.statusBtn, devStatus === 'total' && styles.statusBtnActive]}
                onPress={() => setDevStatus('total')}
              >
                <Text style={[styles.statusBtnText, devStatus === 'total' && styles.statusBtnTextActive]}>
                  ✅ Total
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusBtn, devStatus === 'parcial' && styles.statusBtnActive]}
                onPress={() => setDevStatus('parcial')}
              >
                <Text style={[styles.statusBtnText, devStatus === 'parcial' && styles.statusBtnTextActive]}>
                  🔄 Parcial
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.confirmBtn, devLoading && { opacity: 0.6 }]}
              onPress={confirmarDevolucao}
              disabled={devLoading}
            >
              {devLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmBtnText}>Confirmar Devolução</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDevModal(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4F8' },

  header: {
    backgroundColor: ORANGE,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backBtn: { marginRight: 8 },
  backText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  headerTitle: { flex: 1, color: '#fff', fontSize: 20, fontWeight: '700', textAlign: 'center' },
  addBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  addText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#222' },
  clearSearch: { fontSize: 16, color: '#999', paddingLeft: 8 },

  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
  },
  infoText: { fontSize: 13, color: '#666', fontWeight: '500' },
  refreshBtn: { fontSize: 13, color: BLUE, fontWeight: '600' },

  saidaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  saidaCardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  saidaIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  saidaIcon: { fontSize: 20 },
  saidaInfo: { flex: 1 },
  saidaNome: { fontSize: 15, fontWeight: '700', color: '#222' },
  saidaSub: { fontSize: 12, color: '#888', marginTop: 2 },
  bold: { fontWeight: '700', color: '#333' },
  devBadge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginLeft: 4,
  },
  devBadgeText: { fontSize: 11, fontWeight: '700' },
  saidaDesc: { fontSize: 12, color: '#777', marginTop: 8, fontStyle: 'italic' },
  devBtn: {
    marginTop: 10,
    backgroundColor: PURPLE + '15',
    borderColor: PURPLE,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  devBtnText: { color: PURPLE, fontWeight: '700', fontSize: 13 },

  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#555', marginTop: 16 },
  emptyDesc: { fontSize: 13, color: '#888', textAlign: 'center', marginTop: 10, lineHeight: 20 },
  newSaidaBtn: {
    marginTop: 24,
    backgroundColor: ORANGE,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  newSaidaBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A2E', marginBottom: 12 },
  modalItem: { fontSize: 14, color: '#555', marginBottom: 4 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginTop: 16, marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: '#DDD',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#222',
    backgroundColor: '#FAFAFA',
  },
  statusRow: { flexDirection: 'row', gap: 10 },
  statusBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#DDD',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  statusBtnActive: { borderColor: GREEN, backgroundColor: '#E8F5E9' },
  statusBtnText: { fontSize: 14, fontWeight: '600', color: '#777' },
  statusBtnTextActive: { color: GREEN },
  confirmBtn: {
    marginTop: 20,
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelBtn: { marginTop: 10, alignItems: 'center', paddingVertical: 10 },
  cancelBtnText: { color: '#888', fontSize: 14 },
});
