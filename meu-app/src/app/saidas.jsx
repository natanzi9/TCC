// ============================================================
// saidas.jsx — Histórico de Saídas e Controle de Devoluções SGA SENAI
// Estética idêntica ao saidas.html / stylesaida.css
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSaidas, registrarDevolucao } from '@/services/api';
import { SenaiColors } from '@/constants/theme';
import { SenaiHeader } from '@/components/SenaiHeader';

export default function SaidasScreen() {
  const router = useRouter();

  const [saidas, setSaidas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState('todas');

  // Modal para Devolução
  const [devModal, setDevModal] = useState(false);
  const [devSaida, setDevSaida] = useState(null);
  const [devQtde, setDevQtde] = useState('1');
  const [devStatus, setDevStatus] = useState('total');
  const [devLoading, setDevLoading] = useState(false);

  const carregarSaidas = useCallback(async () => {
    try {
      const data = await getSaidas();
      setSaidas(data);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar as saídas do servidor.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregarSaidas();
  }, [carregarSaidas]);

  const filtradas = saidas.filter((s) => {
    const matchSearch =
      s.item.toLowerCase().includes(search.toLowerCase()) ||
      (s.solicitante ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (s.almoxarife ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (s.descricao ?? '').toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;

    if (filtro === 'pendentes') {
      return s.devolucao === 'Sim' && s.status_devolucao !== 'total';
    }
    if (filtro === 'devolvidas') {
      return s.status_devolucao === 'total' || s.status_devolucao === 'parcial';
    }
    return true;
  });

  function abrirModalDevolucao(saida, tipo = 'total') {
    setDevSaida(saida);
    setDevStatus(tipo);
    setDevQtde(tipo === 'total' ? String(saida.qtde) : '1');
    setDevModal(true);
  }

  async function confirmarDevolucao() {
    if (!devSaida) return;
    const qtde = parseInt(devQtde, 10);
    if (isNaN(qtde) || qtde <= 0) {
      Alert.alert('Atenção', 'Informe uma quantidade válida!');
      return;
    }
    if (qtde > devSaida.qtde) {
      Alert.alert('Atenção', `A quantidade não pode exceder o total da saída (${devSaida.qtde}).`);
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
      Alert.alert('Sucesso', 'Devolução registrada no estoque com sucesso!');
      setDevModal(false);
      carregarSaidas();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert('Erro', `Falha ao registrar devolução: ${msg}`);
    } finally {
      setDevLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <SenaiHeader
        title="SAÍDAS DE INSUMOS"
        showBack={true}
        rightAction={
          <TouchableOpacity
            style={styles.btnNova}
            onPress={() => router.push('/registrar-saida')}
            activeOpacity={0.8}
          >
            <Text style={styles.btnNovaText}>+ Nova</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.container}>
        <View style={styles.quadrado}>
          {/* Busca */}
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por item, solicitante ou finalidade..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Text style={styles.clearSearch}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Filtros em Abas */}
          <View style={styles.filtrosRow}>
            <TouchableOpacity
              style={[styles.filtroBtn, filtro === 'todas' && styles.filtroBtnActive]}
              onPress={() => setFiltro('todas')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filtroText, filtro === 'todas' && styles.filtroTextActive]}>
                Todas ({saidas.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filtroBtn, filtro === 'pendentes' && styles.filtroBtnActive]}
              onPress={() => setFiltro('pendentes')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filtroText, filtro === 'pendentes' && styles.filtroTextActive]}>
                ⏳ Pendentes ({saidas.filter((s) => s.devolucao === 'Sim' && s.status_devolucao !== 'total').length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filtroBtn, filtro === 'devolvidas' && styles.filtroBtnActive]}
              onPress={() => setFiltro('devolvidas')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filtroText, filtro === 'devolvidas' && styles.filtroTextActive]}>
                ✅ Devolvidas
              </Text>
            </TouchableOpacity>
          </View>

          {/* Lista de Saídas */}
          {loading ? (
            <ActivityIndicator size="large" color={SenaiColors.orange} style={{ marginVertical: 36 }} />
          ) : (
            <FlatList
              data={filtradas}
              keyExtractor={(item) => String(item.id)}
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                carregarSaidas();
              }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isParcial = item.status_devolucao === 'parcial';
                const isTotal = item.status_devolucao === 'total';
                const hasDev = item.devolucao === 'Sim';
                const pendente = hasDev && !isTotal;

                return (
                  <View style={styles.cardSaida}>
                    <View style={styles.cardSaidaHead}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.saidaItemNome} numberOfLines={1}>
                          {item.item}
                        </Text>
                        <Text style={styles.saidaSub}>
                          Qtde: <Text style={{ fontWeight: 'bold', color: SenaiColors.textDark }}>{item.qtde} un.</Text> • Data: {item.data ?? 'Sem data'}
                        </Text>
                      </View>

                      {/* Badge de status */}
                      <View style={styles.statusBadgeContainer}>
                        {isTotal ? (
                          <View style={[styles.statusBadge, { backgroundColor: '#EFF6FF', borderColor: SenaiColors.primary }]}>
                            <Text style={[styles.statusBadgeText, { color: SenaiColors.primary }]}>✅ Total</Text>
                          </View>
                        ) : isParcial ? (
                          <View style={[styles.statusBadge, { backgroundColor: '#FFF7ED', borderColor: SenaiColors.orange }]}>
                            <Text style={[styles.statusBadgeText, { color: SenaiColors.orange }]}>
                              🔄 Parcial ({item.qtde_devolvida})
                            </Text>
                          </View>
                        ) : pendente ? (
                          <View style={[styles.statusBadge, { backgroundColor: '#FEF3C7', borderColor: '#D97706' }]}>
                            <Text style={[styles.statusBadgeText, { color: '#D97706' }]}>⏳ Pendente</Text>
                          </View>
                        ) : (
                          <View style={[styles.statusBadge, { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' }]}>
                            <Text style={[styles.statusBadgeText, { color: '#64748B' }]}>Sem Devolução</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={styles.cardSaidaInfoRow}>
                      <Text style={styles.infoLabel}>Solicitante: <Text style={styles.infoVal}>{item.solicitante || '—'}</Text></Text>
                      <Text style={styles.infoLabel}>Almoxarife: <Text style={styles.infoVal}>{item.almoxarife || '—'}</Text></Text>
                    </View>

                    {item.descricao ? (
                      <Text style={styles.descText} numberOfLines={2}>
                        📝 Finalidade: {item.descricao}
                      </Text>
                    ) : null}

                    {/* Botões de devolução direta caso pendente */}
                    {pendente && (
                      <View style={styles.devolucaoActionsRow}>
                        <TouchableOpacity
                          style={[styles.btnDevOption, { backgroundColor: SenaiColors.orange }]}
                          onPress={() => abrirModalDevolucao(item, 'parcial')}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.btnDevOptionText}>Devolução Parcial</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.btnDevOption, { backgroundColor: SenaiColors.primary }]}
                          onPress={() => abrirModalDevolucao(item, 'total')}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.btnDevOptionText, { color: '#FFFFFF' }]}>Devolução Total</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>Nenhuma saída encontrada.</Text>
                </View>
              }
            />
          )}
        </View>
      </View>

      {/* Modal Devolução */}
      <Modal visible={devModal} transparent animationType="slide" onRequestClose={() => setDevModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Registrar Devolução</Text>
              <TouchableOpacity onPress={() => setDevModal(false)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 14, color: '#334155', marginBottom: 6 }}>
              Item: <Text style={{ fontWeight: 'bold' }}>{devSaida?.item}</Text>
            </Text>
            <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>
              Quantidade retirada: {devSaida?.qtde} unidades
            </Text>

            <Text style={styles.inputLabel}>Tipo de Devolução:</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
              <TouchableOpacity
                style={[styles.tipoBtn, devStatus === 'total' && styles.tipoBtnActive]}
                onPress={() => {
                  setDevStatus('total');
                  setDevQtde(String(devSaida?.qtde ?? 1));
                }}
              >
                <Text style={[styles.tipoBtnText, devStatus === 'total' && styles.tipoBtnTextActive]}>
                  Total ({devSaida?.qtde} un.)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tipoBtn, devStatus === 'parcial' && styles.tipoBtnActive]}
                onPress={() => setDevStatus('parcial')}
              >
                <Text style={[styles.tipoBtnText, devStatus === 'parcial' && styles.tipoBtnTextActive]}>
                  Parcial
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Quantidade devolvida:</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={devQtde}
              onChangeText={setDevQtde}
              placeholder="Ex: 2"
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <TouchableOpacity
                style={[styles.actionBtnModal, { backgroundColor: '#CBD5E1' }]}
                onPress={() => setDevModal(false)}
              >
                <Text style={{ fontWeight: '700', color: '#334155' }}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtnModal, { backgroundColor: SenaiColors.orange, flex: 1.5 }]}
                onPress={confirmarDevolucao}
                disabled={devLoading}
              >
                {devLoading ? (
                  <ActivityIndicator color={SenaiColors.darkBlue} />
                ) : (
                  <Text style={{ fontWeight: '800', color: SenaiColors.darkBlue }}>CONFIRMAR</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: SenaiColors.pageBg,
  },
  container: {
    flex: 1,
    padding: 12,
  },
  btnNova: {
    backgroundColor: SenaiColors.orange,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  btnNovaText: {
    color: SenaiColors.darkBlue,
    fontWeight: '800',
    fontSize: 12,
  },
  quadrado: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: SenaiColors.cardRadius,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: SenaiColors.textDark,
  },
  clearSearch: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: 'bold',
    padding: 6,
  },
  filtrosRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  filtroBtn: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filtroBtnActive: {
    backgroundColor: SenaiColors.primary,
    borderColor: SenaiColors.primary,
  },
  filtroText: {
    fontSize: 11,
    fontWeight: '700',
    color: SenaiColors.secondary,
  },
  filtroTextActive: {
    color: '#FFFFFF',
  },
  cardSaida: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    borderLeftColor: SenaiColors.primary,
  },
  cardSaidaHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  saidaItemNome: {
    fontSize: 15,
    fontWeight: '800',
    color: SenaiColors.primary,
  },
  saidaSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadgeContainer: {
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  cardSaidaInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F6',
  },
  infoLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  infoVal: {
    fontWeight: '700',
    color: SenaiColors.textDark,
  },
  descText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 6,
    fontStyle: 'italic',
  },
  devolucaoActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  btnDevOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  btnDevOptionText: {
    fontSize: 12,
    fontWeight: '800',
    color: SenaiColors.darkBlue,
  },
  emptyBox: {
    padding: 36,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    elevation: 6,
  },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 8,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: SenaiColors.primary,
  },
  modalClose: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  tipoBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  tipoBtnActive: {
    backgroundColor: '#E0F2FE',
    borderColor: SenaiColors.primary,
  },
  tipoBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  tipoBtnTextActive: {
    color: SenaiColors.primary,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#F8FAFC',
  },
  actionBtnModal: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
