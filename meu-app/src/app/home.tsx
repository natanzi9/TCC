// ============================================================
// home.tsx — Dashboard principal
// ============================================================
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { getEstoque, EstoqueItem } from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

const BLUE = '#1565C0';
const GREEN = '#2E7D32';
const ORANGE = '#E65100';
const RED = '#C62828';

function StatCard({
  label,
  value,
  color,
  emoji,
}: {
  label: string;
  value: string | number;
  color: string;
  emoji: string;
}) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ItemCard({ item }: { item: EstoqueItem }) {
  const low = (item.estoque_min ?? 0) > 0 && item.quantidade <= (item.estoque_min ?? 0);
  return (
    <View style={[styles.itemCard, low && styles.itemCardLow]}>
      <View style={styles.itemCardIcon}>
        <Text style={styles.itemCardIconText}>📦</Text>
      </View>
      <View style={styles.itemCardInfo}>
        <Text style={styles.itemCardName} numberOfLines={1}>{item.nome}</Text>
        <Text style={styles.itemCardCat}>{item.categoria ?? 'Sem categoria'}</Text>
      </View>
      <View style={styles.itemCardQtde}>
        <Text style={[styles.itemCardQtdeNum, low && { color: RED }]}>{item.quantidade}</Text>
        <Text style={styles.itemCardQtdeLabel}>un.</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { username, isAdm, signOut } = useAuth();
  const router = useRouter();

  const [itens, setItens] = useState<EstoqueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const data = await getEstoque();
      setItens(data);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar o estoque.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const totalItens = itens.length;
  const totalUnidades = itens.reduce((s, i) => s + (i.quantidade ?? 0), 0);
  const itensBaixos = itens.filter(
    (i) => (i.estoque_min ?? 0) > 0 && i.quantidade <= (i.estoque_min ?? 0),
  ).length;

  const ultimos = [...itens].reverse().slice(0, 8);

  function handleLogout() {
    Alert.alert('Sair', 'Deseja encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => {
          signOut();
          router.replace('/');
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreet}>Olá, {username} 👋</Text>
          <Text style={styles.headerRole}>{isAdm ? '🛡 Administrador' : '👤 Usuário'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); carregar(); }} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Estatísticas */}
        <Text style={styles.sectionTitle}>Resumo do Estoque</Text>
        {loading ? (
          <ActivityIndicator color={BLUE} size="large" style={{ marginVertical: 32 }} />
        ) : (
          <View style={styles.statsRow}>
            <StatCard label="Produtos" value={totalItens} color={BLUE} emoji="📦" />
            <StatCard label="Unidades" value={totalUnidades} color={GREEN} emoji="✅" />
            <StatCard label="Estoque Baixo" value={itensBaixos} color={itensBaixos > 0 ? RED : GREEN} emoji="⚠️" />
          </View>
        )}

        {/* Ações rápidas */}
        <Text style={styles.sectionTitle}>Ações Rápidas</Text>
        <View style={styles.actionsGrid}>
          <QuickAction
            emoji="📋"
            label="Estoque"
            color={BLUE}
            onPress={() => router.push('/estoque')}
          />
          <QuickAction
            emoji="📤"
            label="Saídas"
            color={ORANGE}
            onPress={() => router.push('/saidas')}
          />
          {isAdm && (
            <QuickAction
              emoji="➕"
              label="Adicionar Item"
              color={GREEN}
              onPress={() => router.push('/adicionar-item')}
            />
          )}
          {isAdm && (
            <QuickAction
              emoji="👥"
              label="Usuários"
              color="#6A1B9A"
              onPress={() => router.push('/usuarios')}
            />
          )}
          <QuickAction
            emoji="📝"
            label="Registrar Saída"
            color={RED}
            onPress={() => router.push('/registrar-saida')}
          />
        </View>

        {/* Últimos itens */}
        <Text style={styles.sectionTitle}>Últimos Itens Cadastrados</Text>
        {loading ? (
          <ActivityIndicator color={BLUE} />
        ) : ultimos.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Nenhum item cadastrado ainda.</Text>
          </View>
        ) : (
          ultimos.map((item) => <ItemCard key={item.id} item={item} />)
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickAction({
  emoji,
  label,
  color,
  onPress,
}: {
  emoji: string;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.quickAction, { borderTopColor: color }]} onPress={onPress}>
      <Text style={styles.quickEmoji}>{emoji}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4F8' },
  scroll: { flex: 1 },

  header: {
    backgroundColor: BLUE,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerGreet: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerRole: { fontSize: 13, color: '#BBDEFB', marginTop: 2 },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },

  statsRow: { flexDirection: 'row', marginHorizontal: 12, gap: 8 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    alignItems: 'center',
  },
  statEmoji: { fontSize: 22 },
  statValue: { fontSize: 24, fontWeight: '800', marginTop: 4 },
  statLabel: { fontSize: 11, color: '#777', marginTop: 2 },

  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 12,
    gap: 10,
  },
  quickAction: {
    width: '30%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderTopWidth: 3,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    minWidth: 90,
  },
  quickEmoji: { fontSize: 26 },
  quickLabel: { fontSize: 12, fontWeight: '600', color: '#444', marginTop: 6, textAlign: 'center' },

  itemCard: {
    marginHorizontal: 16,
    marginBottom: 8,
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
  itemCardLow: { borderColor: RED, borderWidth: 1.5 },
  itemCardIcon: {
    width: 42,
    height: 42,
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemCardIconText: { fontSize: 20 },
  itemCardInfo: { flex: 1 },
  itemCardName: { fontSize: 15, fontWeight: '600', color: '#222' },
  itemCardCat: { fontSize: 12, color: '#888', marginTop: 2 },
  itemCardQtde: { alignItems: 'center' },
  itemCardQtdeNum: { fontSize: 20, fontWeight: '800', color: '#333' },
  itemCardQtdeLabel: { fontSize: 10, color: '#999' },

  emptyBox: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: { color: '#AAA', fontSize: 14 },
});
