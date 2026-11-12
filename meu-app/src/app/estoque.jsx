// ============================================================
// estoque.jsx — Listagem e Busca de Itens do Estoque SGA SENAI
// Estética idêntica ao estoque.html / styleestoque.css
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
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getEstoque, getItemCompleto, removerItem, getItemImageUrl, getApiBase } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { SenaiColors } from '@/constants/theme';
import { SenaiHeader } from '@/components/SenaiHeader';
import { ImageModal } from '@/components/ImageModal';

export default function EstoqueScreen() {
  const router = useRouter();
  const { isAdm } = useAuth();

  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // Modal de Detalhes
  const [selected, setSelected] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal de Foto
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedItemName, setSelectedItemName] = useState('');

  const carregar = useCallback(async () => {
    try {
      const data = await getEstoque();
      setItens(data);
    } catch {
      Alert.alert('Erro', 'Falha ao buscar os itens do estoque no servidor.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const filtrados = itens.filter(
    (i) =>
      i.nome.toLowerCase().includes(search.toLowerCase()) ||
      (i.categoria ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (i.descricao ?? '').toLowerCase().includes(search.toLowerCase()) ||
      String(i.id).includes(search),
  );

  async function handlePressItem(item) {
    try {
      const full = await getItemCompleto(item.id);
      setSelected(full);
    } catch {
      setSelected(item);
    }
    setModalVisible(true);
  }

  function handleVerFoto(item) {
    setSelectedImage(item.imagem ?? null);
    setSelectedItemName(item.nome);
    setImageModalVisible(true);
  }

  function handleRemoverItem(item) {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente remover o item "${item.nome}" (ID: ${item.id}) do estoque?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await removerItem(item.id);
              Alert.alert('Sucesso', 'Item removido do estoque.');
              setModalVisible(false);
              carregar();
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              Alert.alert('Erro', `Não foi possível remover: ${msg}`);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  }

  function handleExportarCSV() {
    const csvUrl = `${getApiBase()}/api/exportarcsv`;
    Share.share({
      title: 'Estoque SENAI CSV',
      message: `Acesse ou baixe o CSV completo do estoque no link:\n${csvUrl}`,
      url: csvUrl,
    }).catch(() => {});
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <SenaiHeader
        title="ESTOQUE"
        showBack={true}
        rightAction={
          isAdm ? (
            <TouchableOpacity
              style={styles.btnAddHeader}
              onPress={() => router.push('/adicionar-item')}
              activeOpacity={0.8}
            >
              <Text style={styles.btnAddHeaderText}>+ Adicionar</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <View style={styles.container}>
        {/* Cartão Branco .quadrado */}
        <View style={styles.quadrado}>
          {/* Campo de Pesquisa (estilo do web) */}
          <View style={styles.searchSection}>
            <Text style={styles.searchLabel}>Pesquisa:</Text>
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="pesquise um item..."
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
                  <Text style={styles.clearText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Subtítulo informativo */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>
              {filtrados.length} {filtrados.length === 1 ? 'item exibido' : 'itens exibidos'}
            </Text>
            {filtrados.some((i) => (i.estoque_min ?? 0) > 0 && i.quantidade <= (i.estoque_min ?? 0)) && (
              <View style={styles.lowBadge}>
                <Text style={styles.lowBadgeText}>
                  ⚠️ {filtrados.filter((i) => (i.estoque_min ?? 0) > 0 && i.quantidade <= (i.estoque_min ?? 0)).length} baixo
                </Text>
              </View>
            )}
          </View>

          {/* Cabeçalho da Tabela (Azul FIEP / SENAI #135E9F igual styleestoque.css) */}
          <View style={styles.tableHeader}>
            <Text style={[styles.thText, { width: 44, textAlign: 'center' }]}>ID</Text>
            <Text style={[styles.thText, { flex: 2 }]}>ITEM</Text>
            <Text style={[styles.thText, { width: 50, textAlign: 'center' }]}>QTD</Text>
            <Text style={[styles.thText, { width: 58, textAlign: 'center' }]}>FOTO</Text>
          </View>

          {/* Lista de Itens */}
          {loading && itens.length === 0 ? (
            <ActivityIndicator size="large" color={SenaiColors.orange} style={{ marginVertical: 36 }} />
          ) : (
            <FlatList
              data={filtrados}
              keyExtractor={(item) => String(item.id)}
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                carregar();
              }}
              tintColor={SenaiColors.orange}
              colors={[SenaiColors.orange, SenaiColors.primary]}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => {
                const isLow = (item.estoque_min ?? 0) > 0 && item.quantidade <= (item.estoque_min ?? 0);
                return (
                  <TouchableOpacity
                    style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}
                    onPress={() => handlePressItem(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.tdText, { width: 44, textAlign: 'center', fontWeight: 'bold' }]}>
                      {item.id}
                    </Text>

                    <View style={{ flex: 2, paddingRight: 4 }}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.nome}
                      </Text>
                      <Text style={styles.itemDesc} numberOfLines={1}>
                        {item.categoria ? `[${item.categoria}] ` : ''}
                        {item.descricao || 'Sem descrição'}
                      </Text>
                    </View>

                    <View style={{ width: 50, alignItems: 'center' }}>
                      <Text
                        style={[
                          styles.itemQty,
                          isLow && { color: SenaiColors.danger, fontWeight: '900' },
                        ]}
                      >
                        {item.quantidade}
                      </Text>
                      {isLow && <Text style={styles.baixoBadge}>baixo</Text>}
                    </View>

                    <View style={{ width: 58, alignItems: 'center' }}>
                      <TouchableOpacity
                        style={[styles.btnFoto, !item.imagem && styles.btnFotoDisabled]}
                        onPress={() => handleVerFoto(item)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.btnFotoText}>{item.imagem ? '📷' : '—'}</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Nenhum item encontrado.</Text>
                </View>
              }
            />
          )}

          {/* Botões de Ação na base do cartão (Exportar CSV) */}
          <View style={styles.actionsBar}>
            <TouchableOpacity style={styles.btnAction} onPress={handleExportarCSV} activeOpacity={0.8}>
              <Text style={styles.btnActionText}>📥 Exportar CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnAction, { backgroundColor: '#F1F5F9' }]} onPress={carregar} activeOpacity={0.8}>
              <Text style={[styles.btnActionText, { color: SenaiColors.primary }]}>🔄 Atualizar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Modal de Detalhes do Item */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {selected?.nome}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              <DetailRow label="ID do Item" value={String(selected?.id ?? '')} />
              <DetailRow label="Nome" value={selected?.nome ?? ''} />
              <DetailRow label="Categoria" value={selected?.categoria || '—'} />
              <DetailRow label="Descrição" value={selected?.descricao || '—'} />
              <DetailRow
                label="Quantidade"
                value={`${selected?.quantidade ?? 0} unidades`}
                highlight={
                  (selected?.estoque_min ?? 0) > 0 && (selected?.quantidade ?? 0) <= (selected?.estoque_min ?? 0)
                }
              />
              <DetailRow label="Estoque Mínimo" value={`${selected?.estoque_min ?? 0} unidades`} />
              <DetailRow
                label="Preço"
                value={selected?.preco != null ? `R$ ${Number(selected.preco).toFixed(2)}` : 'R$ 0,00'}
              />

              {selected?.imagem && (
                <TouchableOpacity
                  style={styles.modalVerFotoBtn}
                  onPress={() => {
                    if (selected) handleVerFoto(selected);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalVerFotoText}>📷 Visualizar Foto do Item</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            <View style={styles.modalActionButtons}>
              {isAdm && selected && (
                <>
                  <TouchableOpacity
                    style={[styles.modalBtnOrange, { flex: 1 }]}
                    onPress={() => {
                      setModalVisible(false);
                      router.push('/adicionar-item');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalBtnOrangeText}>✏️ Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalBtnDanger, { flex: 1 }]}
                    onPress={() => handleRemoverItem(selected)}
                    disabled={actionLoading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalBtnDangerText}>🗑 Excluir</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity
                style={[styles.modalBtnClose, isAdm ? { width: 80 } : { width: '100%' }]}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalBtnCloseText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Foto */}
      <ImageModal
        visible={imageModalVisible}
        onClose={() => setImageModalVisible(false)}
        imageName={selectedImage}
        itemName={selectedItemName}
      />
    </SafeAreaView>
  );
}

function DetailRow({ label, value, highlight = false }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={[styles.detailValue, highlight && { color: SenaiColors.danger, fontWeight: '900' }]}>
        {value}
      </Text>
    </View>
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
  btnAddHeader: {
    backgroundColor: SenaiColors.orange,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  btnAddHeaderText: {
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
  searchSection: {
    marginBottom: 8,
  },
  searchLabel: {
    fontSize: 14,
    color: SenaiColors.primary,
    marginBottom: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: SenaiColors.textDark,
  },
  clearBtn: {
    padding: 6,
  },
  clearText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
    paddingHorizontal: 2,
  },
  summaryText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  lowBadge: {
    backgroundColor: SenaiColors.dangerBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SenaiColors.danger,
  },
  lowBadgeText: {
    color: SenaiColors.danger,
    fontSize: 11,
    fontWeight: '700',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: SenaiColors.secondary, // th background do styleestoque.css
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  thText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  tableRowAlt: {
    backgroundColor: '#F8FAFC',
  },
  tdText: {
    fontSize: 13,
    color: SenaiColors.textDark,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: SenaiColors.textDark,
  },
  itemDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  itemQty: {
    fontSize: 14,
    fontWeight: '700',
    color: SenaiColors.textDark,
  },
  baixoBadge: {
    fontSize: 9,
    color: SenaiColors.danger,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  btnFoto: {
    backgroundColor: SenaiColors.orange,
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnFotoDisabled: {
    backgroundColor: '#E2E8F0',
  },
  btnFotoText: {
    fontSize: 14,
    color: SenaiColors.darkBlue,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  actionsBar: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  btnAction: {
    flex: 1,
    backgroundColor: SenaiColors.orange,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActionText: {
    color: SenaiColors.darkBlue,
    fontSize: 13,
    fontWeight: '800',
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
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: SenaiColors.primary,
    flex: 1,
  },
  modalClose: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  detailRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: SenaiColors.textDark,
    marginTop: 2,
  },
  modalVerFotoBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: SenaiColors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 12,
  },
  modalVerFotoText: {
    color: SenaiColors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  modalActionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  modalBtnOrange: {
    backgroundColor: SenaiColors.orange,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalBtnOrangeText: {
    color: SenaiColors.darkBlue,
    fontWeight: '800',
    fontSize: 14,
  },
  modalBtnDanger: {
    backgroundColor: SenaiColors.danger,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalBtnDangerText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  modalBtnClose: {
    backgroundColor: '#CBD5E1',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCloseText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 14,
  },
});
