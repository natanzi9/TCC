// ============================================================
// home.jsx — Dashboard Principal SGA SENAI
// Estética idêntica ao home.html e home.css do sistema web
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
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { getEstoque, getSaidas, registrarDevolucao } from '@/services/api';
import { SenaiColors } from '@/constants/theme';
import { ImageModal } from '@/components/ImageModal';

export default function HomeScreen() {
  const { username, isAdm, signOut } = useAuth();
  const router = useRouter();

  const [itens, setItens] = useState([]);
  const [saidas, setSaidas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal para visualização de foto
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedItemName, setSelectedItemName] = useState('');

  // Modal para devolução rápida
  const [devModalVisible, setDevModalVisible] = useState(false);
  const [selectedSaida, setSelectedSaida] = useState(null);
  const [devQtde, setDevQtde] = useState('1');
  const [devTipo, setDevTipo] = useState('total');
  const [devLoading, setDevLoading] = useState(false);

  const carregarDados = useCallback(async () => {
    try {
      const [itensData, saidasData] = await Promise.all([
        getEstoque().catch(() => []),
        getSaidas().catch(() => []),
      ]);
      setItens(itensData);
      setSaidas(saidasData);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os dados do painel.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const totalItens = itens.length;
  const totalUnidades = itens.reduce((s, i) => s + (i.quantidade ?? 0), 0);
  const itensBaixos = itens.filter(
    (i) => (i.estoque_min ?? 0) > 0 && i.quantidade <= (i.estoque_min ?? 0),
  ).length;

  const ultimosItens = [...itens].reverse().slice(0, 8);
  const ultimasSaidas = saidas.slice(0, 8);

  function handleLogout() {
    Alert.alert('Sair', 'Deseja encerrar a sessão do sistema?', [
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

  function abrirFoto(item) {
    setSelectedImage(item.imagem ?? null);
    setSelectedItemName(item.nome);
    setImageModalVisible(true);
  }

  function abrirDevolucaoRapida(saida, tipo) {
    setSelectedSaida(saida);
    setDevTipo(tipo);
    setDevQtde(tipo === 'total' ? String(saida.qtde) : '1');
    setDevModalVisible(true);
  }

  async function confirmarDevolucao() {
    if (!selectedSaida) return;
    const qtdeNum = parseInt(devQtde, 10);
    if (isNaN(qtdeNum) || qtdeNum <= 0) {
      Alert.alert('Atenção', 'Informe uma quantidade válida!');
      return;
    }
    if (qtdeNum > selectedSaida.qtde) {
      Alert.alert('Atenção', `A quantidade não pode ser maior que o total da saída (${selectedSaida.qtde}).`);
      return;
    }

    setDevLoading(true);
    try {
      await registrarDevolucao({
        nome: selectedSaida.item,
        qtde: qtdeNum,
        status: devTipo,
        saida_id: selectedSaida.id,
      });
      Alert.alert('Sucesso', `Devolução ${devTipo} registrada com sucesso!`);
      setDevModalVisible(false);
      carregarDados();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert('Erro', `Falha ao registrar devolução: ${msg}`);
    } finally {
      setDevLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Barra Superior com Logo e Identidade FIEP / SENAI */}
      <View style={styles.topHeader}>
        <View style={styles.topHeaderRow}>
          <Image
            source={require('@/assets/images/images.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <TouchableOpacity onPress={handleLogout} style={styles.btnSair} activeOpacity={0.7}>
            <Text style={styles.btnSairText}>FECHAR</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.bemVindo}>BEM VINDO, {username ? username.toUpperCase() : 'USUÁRIO'} 👋</Text>
        <Text style={styles.sistemaTitulo}>SISTEMA DE ALMOXARIFADO</Text>
        <Text style={styles.perfilBadge}>{isAdm ? '🛡 PERFIL ADMINISTRADOR' : '👤 PERFIL PADRÃO'}</Text>
      </View>

      {/* Barra de Navegação Rápida (Navbar de Botões Arredondados Idêntica ao Web) */}
      <View style={styles.navbarScrollContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navbar}>
          <TouchableOpacity style={[styles.navBtn, styles.navBtnActive]} activeOpacity={0.8}>
            <Text style={[styles.navBtnText, styles.navBtnTextActive]}>🏠 HOME</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => router.push('/estoque')}
            activeOpacity={0.8}
          >
            <Text style={styles.navBtnText}>📋 ESTOQUE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => router.push('/saidas')}
            activeOpacity={0.8}
          >
            <Text style={styles.navBtnText}>📤 SAÍDAS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => router.push('/registrar-saida')}
            activeOpacity={0.8}
          >
            <Text style={styles.navBtnText}>📝 REGISTRAR</Text>
          </TouchableOpacity>

          {isAdm && (
            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => router.push('/adicionar-item')}
              activeOpacity={0.8}
            >
              <Text style={styles.navBtnText}>➕ ITENS</Text>
            </TouchableOpacity>
          )}

          {isAdm && (
            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => router.push('/usuarios')}
              activeOpacity={0.8}
            >
              <Text style={styles.navBtnText}>👥 USUÁRIOS</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              carregarDados();
            }}
            colors={[SenaiColors.orange, SenaiColors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Cartão Branco Arredondado (.quadrado do web) */}
        <View style={styles.quadrado}>
          <Text style={styles.resumoEstoque}>RESUMO DO ESTOQUE</Text>

          {/* Cards de Métricas */}
          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, { borderTopColor: SenaiColors.primary }]}>
              <Text style={styles.metricEmoji}>📦</Text>
              <Text style={[styles.metricNumber, { color: SenaiColors.primary }]}>{totalItens}</Text>
              <Text style={styles.metricLabel}>PRODUTOS</Text>
            </View>

            <View style={[styles.metricCard, { borderTopColor: SenaiColors.success }]}>
              <Text style={styles.metricEmoji}>✅</Text>
              <Text style={[styles.metricNumber, { color: SenaiColors.success }]}>{totalUnidades}</Text>
              <Text style={styles.metricLabel}>UNIDADES</Text>
            </View>

            <View style={[styles.metricCard, { borderTopColor: itensBaixos > 0 ? SenaiColors.danger : SenaiColors.orange }]}>
              <Text style={styles.metricEmoji}>⚠️</Text>
              <Text style={[styles.metricNumber, { color: itensBaixos > 0 ? SenaiColors.danger : SenaiColors.orange }]}>
                {itensBaixos}
              </Text>
              <Text style={styles.metricLabel}>ESTOQUE BAIXO</Text>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={SenaiColors.orange} style={{ marginVertical: 32 }} />
          ) : (
            <>
              {/* Tabela 1: ÚLTIMOS ITENS CADASTRADOS (mesmo estilo do web) */}
              <View style={styles.tableSection}>
                <View style={styles.tableHeaderBar}>
                  <Text style={styles.tableSectionTitle}>ÚLTIMOS ITENS CADASTRADOS</Text>
                  <TouchableOpacity onPress={() => router.push('/estoque')}>
                    <Text style={styles.verMaisLink}>Ver todos ›</Text>
                  </TouchableOpacity>
                </View>

                {/* Cabeçalho da Tabela (Laranja #F28B0C do web) */}
                <View style={styles.tableHeadRow}>
                  <Text style={[styles.tableHeadCell, { flex: 2 }]}>ITEM</Text>
                  <Text style={[styles.tableHeadCell, { flex: 1, textAlign: 'center' }]}>QTDE</Text>
                  <Text style={[styles.tableHeadCell, { flex: 1, textAlign: 'center' }]}>FOTO</Text>
                </View>

                {ultimosItens.length === 0 ? (
                  <View style={styles.emptyTableRow}>
                    <Text style={styles.emptyTableText}>Nenhum item cadastrado ainda.</Text>
                  </View>
                ) : (
                  ultimosItens.map((item, idx) => {
                    const low = (item.estoque_min ?? 0) > 0 && item.quantidade <= (item.estoque_min ?? 0);
                    return (
                      <View
                        key={`item-${item.id}-${idx}`}
                        style={[styles.tableBodyRow, idx % 2 === 1 && styles.tableBodyRowAlt]}
                      >
                        <View style={{ flex: 2 }}>
                          <Text style={styles.itemName} numberOfLines={1}>
                            {item.nome}
                          </Text>
                          {item.categoria ? (
                            <Text style={styles.itemCat} numberOfLines={1}>
                              {item.categoria}
                            </Text>
                          ) : null}
                        </View>

                        <Text style={[styles.tableBodyCell, { flex: 1, textAlign: 'center', fontWeight: 'bold' }, low && { color: SenaiColors.danger }]}>
                          {item.quantidade}
                        </Text>

                        <View style={{ flex: 1, alignItems: 'center' }}>
                          <TouchableOpacity
                            style={[styles.btnFoto, !item.imagem && styles.btnFotoDisabled]}
                            onPress={() => abrirFoto(item)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.btnFotoText}>{item.imagem ? '📷 Ver' : 'Sem foto'}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>

              {/* Tabela 2: HISTÓRICO DE SAÍDAS (mesmo estilo do web com botões P e T) */}
              <View style={[styles.tableSection, { marginTop: 24 }]}>
                <View style={styles.tableHeaderBar}>
                  <Text style={styles.tableSectionTitle}>HISTÓRICO DE SAÍDAS</Text>
                  <TouchableOpacity onPress={() => router.push('/saidas')}>
                    <Text style={styles.verMaisLink}>Ver todas ›</Text>
                  </TouchableOpacity>
                </View>

                {/* Cabeçalho da Tabela de Saídas */}
                <View style={styles.tableHeadRow}>
                  <Text style={[styles.tableHeadCell, { flex: 2 }]}>ITEM</Text>
                  <Text style={[styles.tableHeadCell, { flex: 1, textAlign: 'center' }]}>QTDE</Text>
                  <Text style={[styles.tableHeadCell, { flex: 1.6, textAlign: 'center' }]}>DEVOLUÇÃO</Text>
                </View>

                {ultimasSaidas.length === 0 ? (
                  <View style={styles.emptyTableRow}>
                    <Text style={styles.emptyTableText}>Nenhuma saída registrada.</Text>
                  </View>
                ) : (
                  ultimasSaidas.map((saida, idx) => {
                    const isParcial = saida.status_devolucao === 'parcial';
                    const isTotal = saida.status_devolucao === 'total';
                    const hasDevolucao = saida.devolucao === 'Sim';

                    return (
                      <View
                        key={`saida-${saida.id}-${idx}`}
                        style={[styles.tableBodyRow, idx % 2 === 1 && styles.tableBodyRowAlt]}
                      >
                        <View style={{ flex: 2 }}>
                          <Text style={styles.itemName} numberOfLines={1}>
                            {saida.item}
                          </Text>
                          <Text style={styles.itemCat} numberOfLines={1}>
                            {saida.solicitante ? `Por: ${saida.solicitante}` : (saida.data ?? '—')}
                          </Text>
                        </View>

                        <Text style={[styles.tableBodyCell, { flex: 1, textAlign: 'center', fontWeight: 'bold' }]}>
                          {saida.qtde}
                        </Text>

                        <View style={{ flex: 1.6, alignItems: 'center', justifyContent: 'center' }}>
                          {isTotal ? (
                            <Text style={styles.badgeTotal}>Total</Text>
                          ) : isParcial ? (
                            <Text style={styles.badgeParcial}>Parcial ({saida.qtde_devolvida})</Text>
                          ) : hasDevolucao ? (
                            <View style={styles.btnDevRow}>
                              <TouchableOpacity
                                style={styles.btnDevP}
                                onPress={() => abrirDevolucaoRapida(saida, 'parcial')}
                                activeOpacity={0.8}
                              >
                                <Text style={styles.btnDevText}>P</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.btnDevT}
                                onPress={() => abrirDevolucaoRapida(saida, 'total')}
                                activeOpacity={0.8}
                              >
                                <Text style={styles.btnDevText}>T</Text>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <Text style={styles.badgeNao}>Não</Text>
                          )}
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </>
          )}
        </View>

        <Text style={styles.footerNote}>SGA SENAI Almoxarifado • Conectado a {getEstoque.name ? 'MySQL / Flask' : ''}</Text>
      </ScrollView>

      {/* Modal de Foto */}
      <ImageModal
        visible={imageModalVisible}
        onClose={() => setImageModalVisible(false)}
        imageName={selectedImage}
        itemName={selectedItemName}
      />

      {/* Modal de Devolução Rápida */}
      <Modal visible={devModalVisible} transparent animationType="fade" onRequestClose={() => setDevModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Registrar Devolução ({devTipo === 'total' ? 'Total' : 'Parcial'})
            </Text>
            <Text style={styles.modalSubtitle}>
              Item: <Text style={{ fontWeight: 'bold', color: SenaiColors.textDark }}>{selectedSaida?.item}</Text>
            </Text>

            <Text style={styles.inputLabel}>Quantidade a devolver:</Text>
            <TextInput
              style={styles.inputModal}
              keyboardType="numeric"
              value={devQtde}
              onChangeText={setDevQtde}
              placeholder="Ex: 1"
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#CBD5E1' }]}
                onPress={() => setDevModalVisible(false)}
              >
                <Text style={{ fontWeight: '700', color: '#334155' }}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: devTipo === 'total' ? SenaiColors.primary : SenaiColors.orange, flex: 1.5 }]}
                onPress={confirmarDevolucao}
                disabled={devLoading}
              >
                {devLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={{ fontWeight: '800', color: devTipo === 'total' ? '#FFFFFF' : SenaiColors.darkBlue }}>
                    Confirmar
                  </Text>
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
  topHeader: {
    backgroundColor: SenaiColors.primary,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 42,
  },
  btnSair: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  btnSairText: {
    color: SenaiColors.primary,
    fontWeight: '800',
    fontSize: 12,
  },
  bemVindo: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  sistemaTitulo: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  perfilBadge: {
    color: '#E0F2FE',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  navbarScrollContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  navbar: {
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  navBtnActive: {
    backgroundColor: SenaiColors.primary,
    borderColor: SenaiColors.primary,
  },
  navBtnText: {
    color: SenaiColors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  navBtnTextActive: {
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
    backgroundColor: SenaiColors.pageBg,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 28,
  },
  quadrado: {
    backgroundColor: '#FFFFFF',
    borderRadius: SenaiColors.cardRadius,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  resumoEstoque: {
    color: SenaiColors.secondary,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderTopWidth: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricEmoji: {
    fontSize: 18,
  },
  metricNumber: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  tableSection: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
  },
  tableSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: SenaiColors.secondary,
  },
  verMaisLink: {
    fontSize: 12,
    fontWeight: '700',
    color: SenaiColors.orange,
  },
  tableHeadRow: {
    flexDirection: 'row',
    backgroundColor: SenaiColors.orange, // Cor oficial das tabelas do home.css
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableHeadCell: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  tableBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  tableBodyRowAlt: {
    backgroundColor: '#F8FAFC',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: SenaiColors.textDark,
  },
  itemCat: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  tableBodyCell: {
    fontSize: 13,
    color: SenaiColors.textDark,
  },
  btnFoto: {
    backgroundColor: SenaiColors.orange,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  btnFotoDisabled: {
    backgroundColor: '#E2E8F0',
  },
  btnFotoText: {
    color: SenaiColors.darkBlue,
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTotal: {
    color: SenaiColors.primary,
    fontWeight: '800',
    fontSize: 12,
  },
  badgeParcial: {
    color: SenaiColors.orange,
    fontWeight: '800',
    fontSize: 11,
  },
  badgeNao: {
    color: '#94A3B8',
    fontSize: 12,
  },
  btnDevRow: {
    flexDirection: 'row',
    gap: 4,
  },
  btnDevP: {
    backgroundColor: SenaiColors.orange,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  btnDevT: {
    backgroundColor: SenaiColors.primary,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  btnDevText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 11,
  },
  emptyTableRow: {
    padding: 16,
    alignItems: 'center',
  },
  emptyTableText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  footerNote: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    marginTop: 14,
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
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: SenaiColors.primary,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  inputModal: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#F8FAFC',
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
