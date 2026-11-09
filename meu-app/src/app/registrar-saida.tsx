// ============================================================
// registrar-saida.tsx — Formulário para registrar saída de estoque
// ============================================================
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getEstoque, registrarSaida, EstoqueItem } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

const RED = '#C62828';
const BLUE = '#1565C0';

interface ItemSaida {
  id: number;
  nome: string;
  qtde: number;
  devolucao: 'Sim' | 'Não';
  maxQtde: number;
}

export default function RegistrarSaidaScreen() {
  const router = useRouter();
  const { username } = useAuth();

  const [estoque, setEstoque] = useState<EstoqueItem[]>([]);
  const [loadingEstoque, setLoadingEstoque] = useState(true);
  const [search, setSearch] = useState('');
  const [selecionarModal, setSelecionarModal] = useState(false);

  const [itensSaida, setItensSaida] = useState<ItemSaida[]>([]);
  const [solicitante, setSolicitante] = useState('');
  const [almoxarife, setAlmoxarife] = useState(username ?? '');
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [obs, setObs] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getEstoque()
      .then(setEstoque)
      .catch(() => Alert.alert('Erro', 'Falha ao carregar estoque.'))
      .finally(() => setLoadingEstoque(false));
  }, []);

  const filtrado = estoque.filter((i) =>
    i.nome.toLowerCase().includes(search.toLowerCase()),
  );

  function adicionarItemSaida(item: EstoqueItem) {
    const existe = itensSaida.find((i) => i.id === item.id);
    if (existe) {
      Alert.alert('Atenção', 'Este item já foi adicionado.');
      setSelecionarModal(false);
      return;
    }
    if (item.quantidade <= 0) {
      Alert.alert('Sem estoque', 'Este item não possui quantidade disponível.');
      return;
    }
    setItensSaida((prev) => [
      ...prev,
      { id: item.id, nome: item.nome, qtde: 1, devolucao: 'Não', maxQtde: item.quantidade },
    ]);
    setSelecionarModal(false);
    setSearch('');
  }

  function removerItem(id: number) {
    setItensSaida((prev) => prev.filter((i) => i.id !== id));
  }

  function atualizarQtde(id: number, qtde: string) {
    const n = parseInt(qtde, 10);
    setItensSaida((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const max = i.maxQtde;
        return { ...i, qtde: isNaN(n) ? 0 : Math.min(Math.max(0, n), max) };
      }),
    );
  }

  function toggleDevolucao(id: number) {
    setItensSaida((prev) =>
      prev.map((i) => (i.id === id ? { ...i, devolucao: i.devolucao === 'Sim' ? 'Não' : 'Sim' } : i)),
    );
  }

  async function handleRegistrar() {
    if (itensSaida.length === 0) {
      Alert.alert('Atenção', 'Adicione ao menos um item à saída.');
      return;
    }
    if (!solicitante.trim()) {
      Alert.alert('Atenção', 'Informe o solicitante.');
      return;
    }
    if (itensSaida.some((i) => i.qtde <= 0)) {
      Alert.alert('Atenção', 'Todos os itens precisam ter quantidade > 0.');
      return;
    }

    setLoading(true);
    try {
      await registrarSaida({
        itens: itensSaida.map((i) => ({
          id: i.id,
          nome: i.nome,
          qtde: i.qtde,
          devolucao: i.devolucao,
        })),
        solicitante: solicitante.trim(),
        almoxarife: almoxarife.trim(),
        data,
        obs: obs.trim(),
      });
      Alert.alert('Sucesso', 'Saída registrada com sucesso!', [
        { text: 'Ver Estoque', onPress: () => router.replace('/estoque') },
        { text: 'Nova Saída', onPress: () => { setItensSaida([]); setSolicitante(''); setObs(''); } },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registrar Saída</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Itens Selecionados */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>📤 Itens da Saída</Text>
              <TouchableOpacity
                style={styles.addItemBtn}
                onPress={() => setSelecionarModal(true)}
              >
                <Text style={styles.addItemBtnText}>+ Item</Text>
              </TouchableOpacity>
            </View>

            {itensSaida.length === 0 ? (
              <View style={styles.noItems}>
                <Text style={styles.noItemsText}>Toque em "+ Item" para adicionar produtos</Text>
              </View>
            ) : (
              itensSaida.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.itemRowLeft}>
                    <Text style={styles.itemNome} numberOfLines={1}>{item.nome}</Text>
                    <Text style={styles.itemMax}>Disponível: {item.maxQtde}</Text>
                  </View>

                  <View style={styles.itemQtdeBox}>
                    <TouchableOpacity
                      onPress={() => atualizarQtde(item.id, String(item.qtde - 1))}
                      style={styles.qtdeBtn}
                    >
                      <Text style={styles.qtdeBtnText}>−</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={styles.qtdeInput}
                      value={String(item.qtde)}
                      onChangeText={(v) => atualizarQtde(item.id, v)}
                      keyboardType="numeric"
                      textAlign="center"
                    />
                    <TouchableOpacity
                      onPress={() => atualizarQtde(item.id, String(item.qtde + 1))}
                      style={styles.qtdeBtn}
                    >
                      <Text style={styles.qtdeBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[styles.devToggle, item.devolucao === 'Sim' && styles.devToggleOn]}
                    onPress={() => toggleDevolucao(item.id)}
                  >
                    <Text style={[styles.devToggleText, item.devolucao === 'Sim' && styles.devToggleTextOn]}>
                      {item.devolucao === 'Sim' ? '↩ Dev.' : '↩'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => removerItem(item.id)} style={styles.removeBtn}>
                    <Text style={styles.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {/* Dados da saída */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📋 Dados da Saída</Text>

            <Field label="Solicitante *" value={solicitante} onChange={setSolicitante} placeholder="Nome do solicitante" />
            <Field label="Almoxarife" value={almoxarife} onChange={setAlmoxarife} placeholder="Nome do almoxarife" />
            <Field label="Data" value={data} onChange={setData} placeholder="AAAA-MM-DD" />
            <Field
              label="Finalidade / Observação"
              value={obs}
              onChange={setObs}
              placeholder="Para que será usado..."
              multiline
            />
          </View>

          {/* Botão Registrar */}
          <TouchableOpacity
            style={[styles.registerBtn, loading && { opacity: 0.6 }]}
            onPress={handleRegistrar}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerBtnText}>✓ Registrar Saída</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de seleção de item */}
      <Modal
        visible={selecionarModal}
        animationType="slide"
        transparent
        onRequestClose={() => setSelecionarModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Selecionar Item</Text>
              <TouchableOpacity onPress={() => setSelecionarModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar produto..."
                placeholderTextColor="#999"
                value={search}
                onChangeText={setSearch}
                autoFocus
              />
            </View>

            {loadingEstoque ? (
              <ActivityIndicator color={BLUE} style={{ marginTop: 24 }} />
            ) : (
              <FlatList
                data={filtrado}
                keyExtractor={(i) => String(i.id)}
                style={{ maxHeight: 400 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.estoqueItem, item.quantidade <= 0 && { opacity: 0.4 }]}
                    onPress={() => adicionarItemSaida(item)}
                    disabled={item.quantidade <= 0}
                  >
                    <Text style={styles.estoqueItemNome}>{item.nome}</Text>
                    <Text style={styles.estoqueItemQtde}>Qtd: {item.quantidade}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>Nenhum item encontrado.</Text>}
                ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#F0F0F0' }} />}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View style={{ marginBottom: 4 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMulti]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#999"
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4F8' },

  header: {
    backgroundColor: RED,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backBtn: { width: 60 },
  backText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  headerTitle: { flex: 1, color: '#fff', fontSize: 20, fontWeight: '700', textAlign: 'center' },

  scroll: { padding: 16, gap: 16 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  addItemBtn: {
    backgroundColor: RED,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  addItemBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  noItems: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    borderStyle: 'dashed',
  },
  noItemsText: { color: '#888', fontSize: 14 },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 6,
  },
  itemRowLeft: { flex: 1 },
  itemNome: { fontSize: 14, fontWeight: '600', color: '#222' },
  itemMax: { fontSize: 11, color: '#999', marginTop: 2 },

  itemQtdeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  qtdeBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  qtdeBtnText: { fontSize: 18, color: '#333', fontWeight: '700' },
  qtdeInput: {
    width: 36,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    paddingVertical: 4,
  },

  devToggle: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  devToggleOn: { backgroundColor: '#E8F5E9', borderColor: '#2E7D32' },
  devToggleText: { fontSize: 11, fontWeight: '700', color: '#888' },
  devToggleTextOn: { color: '#2E7D32' },

  removeBtn: { padding: 6 },
  removeBtnText: { fontSize: 16, color: '#E53935' },

  inputLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 12 },
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
  inputMulti: { height: 80, textAlignVertical: 'top' },

  registerBtn: {
    backgroundColor: RED,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: RED,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  registerBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A2E' },
  modalClose: { fontSize: 20, color: '#888', padding: 4 },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: { fontSize: 15, marginRight: 6 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15, color: '#222' },

  estoqueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  estoqueItemNome: { fontSize: 15, fontWeight: '600', color: '#222', flex: 1 },
  estoqueItemQtde: { fontSize: 14, color: '#666', fontWeight: '500', marginLeft: 8 },
  emptyText: { textAlign: 'center', color: '#AAA', fontSize: 14, paddingVertical: 24 },
});
