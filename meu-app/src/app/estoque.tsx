// ============================================================
// estoque.tsx — Listagem e busca de itens do estoque
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
import { getEstoque, getItemCompleto, EstoqueItem } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

const BLUE = '#1565C0';
const GREEN = '#2E7D32';
const RED = '#C62828';

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{text}</Text>
    </View>
  );
}

function ItemRow({
  item,
  onPress,
  isAdm,
}: {
  item: EstoqueItem;
  onPress: () => void;
  isAdm: boolean;
}) {
  const low = (item.estoque_min ?? 0) > 0 && item.quantidade <= (item.estoque_min ?? 0);
  return (
    <TouchableOpacity style={styles.itemRow} onPress={onPress}>
      <View style={[styles.itemIcon, { backgroundColor: low ? '#FFEBEE' : '#E8F5E9' }]}>
        <Text style={styles.itemIconText}>{low ? '⚠️' : '📦'}</Text>
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.nome}</Text>
        <Text style={styles.itemSub} numberOfLines={1}>
          {item.categoria ?? '—'} {item.descricao ? `· ${item.descricao}` : ''}
        </Text>
        <View style={styles.itemBadges}>
          <Badge text={`Qtd: ${item.quantidade}`} color={low ? RED : GREEN} />
          {item.preco != null && (
            <Badge text={`R$ ${Number(item.preco).toFixed(2)}`} color={BLUE} />
          )}
        </View>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

function DetalheModal({
  item,
  visible,
  onClose,
}: {
  item: EstoqueItem | null;
  visible: boolean;
  onClose: () => void;
}) {
  if (!item) return null;
  const low = (item.estoque_min ?? 0) > 0 && item.quantidade <= (item.estoque_min ?? 0);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle} numberOfLines={2}>{item.nome}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <InfoRow label="ID" value={String(item.id)} />
            <InfoRow label="Categoria" value={item.categoria ?? '—'} />
            <InfoRow label="Descrição" value={item.descricao ?? '—'} />
            <InfoRow
              label="Quantidade"
              value={String(item.quantidade)}
              valueColor={low ? RED : GREEN}
            />
            <InfoRow label="Estoque Mín." value={String(item.estoque_min ?? 0)} />
            <InfoRow
              label="Preço"
              value={item.preco != null ? `R$ ${Number(item.preco).toFixed(2)}` : '—'}
            />
            {low && (
              <View style={styles.alertBox}>
                <Text style={styles.alertBoxText}>⚠️ Estoque abaixo do mínimo!</Text>
              </View>
            )}
          </ScrollView>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function InfoRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
    </View>
  );
}

export default function EstoqueScreen() {
  const router = useRouter();
  const { isAdm } = useAuth();

  const [itens, setItens] = useState<EstoqueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<EstoqueItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const data = await getEstoque();
      setItens(data);
    } catch {
      Alert.alert('Erro', 'Falha ao carregar estoque.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const filtrados = itens.filter(
    (i) =>
      i.nome.toLowerCase().includes(search.toLowerCase()) ||
      (i.categoria ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  async function handlePress(item: EstoqueItem) {
    try {
      const full = await getItemCompleto(item.id);
      setSelected(full);
      setModalVisible(true);
    } catch {
      setSelected(item);
      setModalVisible(true);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Estoque</Text>
        {isAdm && (
          <TouchableOpacity onPress={() => router.push('/adicionar-item')} style={styles.addBtn}>
            <Text style={styles.addText}>+ Adicionar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Busca */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar produto ou categoria..."
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

      {/* Resumo */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>{filtrados.length} itens encontrados</Text>
        {filtrados.some((i) => (i.estoque_min ?? 0) > 0 && i.quantidade <= (i.estoque_min ?? 0)) && (
          <View style={styles.alertBadge}>
            <Text style={styles.alertBadgeText}>
              ⚠️ {filtrados.filter((i) => (i.estoque_min ?? 0) > 0 && i.quantidade <= (i.estoque_min ?? 0)).length} abaixo do mínimo
            </Text>
          </View>
        )}
      </View>

      {/* Lista */}
      {loading ? (
        <ActivityIndicator color={BLUE} size="large" style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          data={filtrados}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ItemRow item={item} onPress={() => handlePress(item)} isAdm={isAdm} />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          onRefresh={() => { setRefreshing(true); carregar(); }}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Nenhum item encontrado.</Text>
            </View>
          }
        />
      )}

      {/* Modal de detalhe */}
      <DetalheModal
        item={selected}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4F8' },

  header: {
    backgroundColor: BLUE,
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

  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    gap: 8,
  },
  summaryText: { fontSize: 13, color: '#666', fontWeight: '500' },
  alertBadge: { backgroundColor: '#FFEBEE', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  alertBadgeText: { fontSize: 12, color: RED, fontWeight: '600' },

  itemRow: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemIconText: { fontSize: 20 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#222' },
  itemSub: { fontSize: 12, color: '#888', marginTop: 2 },
  itemBadges: { flexDirection: 'row', gap: 6, marginTop: 6 },
  badge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
  arrow: { fontSize: 24, color: '#CCC', marginLeft: 8 },

  empty: { alignItems: 'center', paddingTop: 48 },
  emptyText: { color: '#AAA', fontSize: 15 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  modalTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: '#1A1A2E' },
  modalClose: { padding: 4 },
  modalCloseText: { fontSize: 18, color: '#888' },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: { fontSize: 14, color: '#888', fontWeight: '500' },
  infoValue: { fontSize: 14, color: '#222', fontWeight: '600', maxWidth: '55%', textAlign: 'right' },

  alertBox: {
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  alertBoxText: { color: RED, fontWeight: '700', fontSize: 14 },

  closeBtn: {
    marginTop: 20,
    backgroundColor: BLUE,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
