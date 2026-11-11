// ============================================================
// registrar-saida.jsx — Registrar Saída de Insumos SGA SENAI
// Estética e fluxo idênticos ao saidas.html / stylesaida.css
// ============================================================
import React, { useEffect, useState } from 'react';
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
import { getEstoque, registrarSaida } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { SenaiColors } from '@/constants/theme';
import { SenaiHeader } from '@/components/SenaiHeader';

export default function RegistrarSaidaScreen() {
  const router = useRouter();
  const { username } = useAuth();

  const [estoque, setEstoque] = useState([]);
  const [loadingEstoque, setLoadingEstoque] = useState(true);

  // Campos do Solicitante / Saída
  const [solicitante, setSolicitante] = useState('');
  const [almoxarife, setAlmoxarife] = useState(username ?? 'admin');
  const [dataRetirada, setDataRetirada] = useState(new Date().toISOString().slice(0, 10));
  const [finalidade, setFinalidade] = useState('');

  // Item selecionado para adicionar
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [itemQtde, setItemQtde] = useState('1');
  const [temDevolucao, setTemDevolucao] = useState('Não');

  // Modal para escolher item
  const [modalItemPicker, setModalItemPicker] = useState(false);
  const [itemSearch, setItemSearch] = useState('');

  // Lista de itens adicionados à saída (rascunho da tabela do web)
  const [itensAdicionados, setItensAdicionados] = useState([]);
  const [loadingSalvar, setLoadingSalvar] = useState(false);

  useEffect(() => {
    getEstoque()
      .then(setEstoque)
      .catch(() => Alert.alert('Erro', 'Não foi possível buscar o estoque.'))
      .finally(() => setLoadingEstoque(false));
  }, []);

  const itensFiltrados = estoque.filter(
    (i) =>
      i.nome.toLowerCase().includes(itemSearch.toLowerCase()) ||
      String(i.id).includes(itemSearch) ||
      (i.categoria ?? '').toLowerCase().includes(itemSearch.toLowerCase()),
  );

  function handleSelecionarItem(item) {
    if (item.quantidade <= 0) {
      Alert.alert('Sem Estoque', `O item "${item.nome}" não possui saldo disponível.`);
      return;
    }
    setItemSelecionado(item);
    setItemQtde('1');
    setModalItemPicker(false);
  }

  function handleAdicionarNaTabela() {
    if (!itemSelecionado) {
      Alert.alert('Atenção', 'Selecione um item do estoque!');
      return;
    }
    const q = parseInt(itemQtde, 10);
    if (isNaN(q) || q <= 0) {
      Alert.alert('Atenção', 'Informe uma quantidade válida maior que zero.');
      return;
    }
    if (q > itemSelecionado.quantidade) {
      Alert.alert(
        'Saldo Insuficiente',
        `A quantidade solicitada (${q}) é maior que o saldo em estoque (${itemSelecionado.quantidade}).`,
      );
      return;
    }

    const jaExiste = itensAdicionados.find((i) => i.id === itemSelecionado.id);
    if (jaExiste) {
      Alert.alert('Atenção', 'Este item já foi adicionado à tabela abaixo. Remova-o antes de alterar.');
      return;
    }

    setItensAdicionados((prev) => [
      ...prev,
      {
        id: itemSelecionado.id,
        nome: itemSelecionado.nome,
        qtde: q,
        devolucao: temDevolucao,
        maxQtde: itemSelecionado.quantidade,
      },
    ]);

    // Limpa a seleção do item atual
    setItemSelecionado(null);
    setItemQtde('1');
    setTemDevolucao('Não');
  }

  function handleRemoverDaTabela(id) {
    setItensAdicionados((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleRegistrarTudo() {
    if (!solicitante.trim()) {
      Alert.alert('Atenção', 'Por favor, informe o Nome do Solicitante!');
      return;
    }
    if (itensAdicionados.length === 0) {
      Alert.alert('Atenção', 'Adicione pelo menos um item à lista antes de registrar!');
      return;
    }

    setLoadingSalvar(true);
    try {
      await registrarSaida({
        itens: itensAdicionados.map((i) => ({
          id: i.id,
          nome: i.nome,
          qtde: i.qtde,
          devolucao: i.devolucao,
        })),
        solicitante: solicitante.trim(),
        almoxarife: almoxarife.trim(),
        data: dataRetirada,
        obs: finalidade.trim(),
      });

      Alert.alert('Sucesso!', 'Saída registrada com sucesso no sistema!', [
        {
          text: 'Ver Histórico',
          onPress: () => router.replace('/saidas'),
        },
        {
          text: 'Nova Saída',
          onPress: () => {
            setItensAdicionados([]);
            setSolicitante('');
            setFinalidade('');
            setItemSelecionado(null);
          },
        },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert('Erro', `Falha ao registrar saída: ${msg}`);
    } finally {
      setLoadingSalvar(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <SenaiHeader title="REGISTRAR SAÍDAS" showBack={true} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Card 1: Formulário de Saída */}
          <View style={styles.quadrado}>
            <Text style={styles.sectionHeaderTitle}>DADOS DA RETIRADA</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome do solicitante:</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: João Silva"
                placeholderTextColor="#94A3B8"
                value={solicitante}
                onChangeText={setSolicitante}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome do almoxarife:</Text>
              <TextInput
                style={styles.input}
                placeholder="Almoxarife responsável"
                placeholderTextColor="#94A3B8"
                value={almoxarife}
                onChangeText={setAlmoxarife}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Data de retirada:</Text>
              <TextInput
                style={styles.input}
                placeholder="AAAA-MM-DD"
                placeholderTextColor="#94A3B8"
                value={dataRetirada}
                onChangeText={setDataRetirada}
              />
            </View>

            {/* Seleção do Item */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Item do estoque:</Text>
              <TouchableOpacity
                style={styles.itemPickerBtn}
                onPress={() => setModalItemPicker(true)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.itemPickerText,
                    !itemSelecionado && { color: '#94A3B8', fontStyle: 'italic' },
                  ]}
                  numberOfLines={1}
                >
                  {itemSelecionado
                    ? `[ID ${itemSelecionado.id}] ${itemSelecionado.nome} (Disp: ${itemSelecionado.quantidade})`
                    : 'Toque para selecionar um item...'}
                </Text>
                <Text style={styles.itemPickerArrow}>🔍</Text>
              </TouchableOpacity>
            </View>

            {/* Quantidade e Devolução */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>QTDE:</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="1"
                  value={itemQtde}
                  onChangeText={setItemQtde}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1.4 }]}>
                <Text style={styles.label}>ITEM COM DEVOLUÇÃO?</Text>
                <View style={styles.devolucaoToggleRow}>
                  <TouchableOpacity
                    style={[styles.toggleBtn, temDevolucao === 'Sim' && styles.toggleBtnActive]}
                    onPress={() => setTemDevolucao('Sim')}
                  >
                    <Text style={[styles.toggleBtnText, temDevolucao === 'Sim' && styles.toggleBtnTextActive]}>
                      Sim
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.toggleBtn, temDevolucao === 'Não' && styles.toggleBtnActive]}
                    onPress={() => setTemDevolucao('Não')}
                  >
                    <Text style={[styles.toggleBtnText, temDevolucao === 'Não' && styles.toggleBtnTextActive]}>
                      Não
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Finalidade */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Finalidade:</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Descreva a finalidade ou observação..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                value={finalidade}
                onChangeText={setFinalidade}
              />
            </View>

            {/* Botão ADICIONAR ITEM NA TABELA */}
            <TouchableOpacity
              style={styles.btnAdicionar}
              onPress={handleAdicionarNaTabela}
              activeOpacity={0.8}
            >
              <Text style={styles.btnAdicionarText}>+ ADICIONAR ITEM</Text>
            </TouchableOpacity>
          </View>

          {/* Card 2: ITENS ADICIONADOS */}
          <View style={[styles.quadrado, { marginTop: 14 }]}>
            <Text style={styles.sectionHeaderTitle}>ITENS ADICIONADOS ({itensAdicionados.length})</Text>

            {/* Cabeçalho da Tabela */}
            <View style={styles.tableHead}>
              <Text style={[styles.th, { width: 36, textAlign: 'center' }]}>ID</Text>
              <Text style={[styles.th, { flex: 2 }]}>Nome</Text>
              <Text style={[styles.th, { width: 44, textAlign: 'center' }]}>Qtd</Text>
              <Text style={[styles.th, { width: 48, textAlign: 'center' }]}>Dev?</Text>
              <Text style={[styles.th, { width: 36, textAlign: 'center' }]}>Excluir</Text>
            </View>

            {itensAdicionados.length === 0 ? (
              <View style={styles.emptyTable}>
                <Text style={styles.emptyTableText}>Nenhum item adicionado ainda.</Text>
                <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
                  Selecione o insumo acima e toque em "ADICIONAR ITEM".
                </Text>
              </View>
            ) : (
              itensAdicionados.map((item, index) => (
                <View
                  key={`draft-${item.id}-${index}`}
                  style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}
                >
                  <Text style={[styles.td, { width: 36, textAlign: 'center', fontWeight: 'bold' }]}>
                    {item.id}
                  </Text>
                  <Text style={[styles.td, { flex: 2 }]} numberOfLines={1}>
                    {item.nome}
                  </Text>
                  <Text style={[styles.td, { width: 44, textAlign: 'center', fontWeight: 'bold' }]}>
                    {item.qtde}
                  </Text>
                  <Text
                    style={[
                      styles.td,
                      { width: 48, textAlign: 'center', fontWeight: 'bold' },
                      item.devolucao === 'Sim' ? { color: SenaiColors.orange } : { color: '#64748B' },
                    ]}
                  >
                    {item.devolucao}
                  </Text>
                  <TouchableOpacity
                    style={styles.btnLixeira}
                    onPress={() => handleRemoverDaTabela(item.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.lixeiraText}>🗑</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}

            {/* Botão Final REGISTRAR SAÍDA */}
            <TouchableOpacity
              style={[
                styles.btnRegistrar,
                (itensAdicionados.length === 0 || loadingSalvar) && styles.btnDisabled,
              ]}
              onPress={handleRegistrarTudo}
              disabled={itensAdicionados.length === 0 || loadingSalvar}
              activeOpacity={0.85}
            >
              {loadingSalvar ? (
                <ActivityIndicator color={SenaiColors.darkBlue} size="small" />
              ) : (
                <Text style={styles.btnRegistrarText}>REGISTRAR SAÍDA</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal para Escolher Item do Estoque */}
      <Modal visible={modalItemPicker} transparent animationType="slide" onRequestClose={() => setModalItemPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Selecionar Item do Estoque</Text>
              <TouchableOpacity onPress={() => setModalItemPicker(false)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalSearchInput}
              placeholder="Buscar insumo por nome ou ID..."
              placeholderTextColor="#94A3B8"
              value={itemSearch}
              onChangeText={setItemSearch}
            />

            {loadingEstoque ? (
              <ActivityIndicator color={SenaiColors.orange} style={{ marginVertical: 32 }} />
            ) : (
              <FlatList
                data={itensFiltrados}
                keyExtractor={(item) => String(item.id)}
                style={{ maxHeight: 350 }}
                renderItem={({ item }) => {
                  const semSaldo = item.quantidade <= 0;
                  return (
                    <TouchableOpacity
                      style={[styles.pickerItemRow, semSaldo && { opacity: 0.5 }]}
                      onPress={() => handleSelecionarItem(item)}
                      disabled={semSaldo}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pickerItemNome}>
                          {item.nome}
                        </Text>
                        <Text style={styles.pickerItemCat}>
                          ID: {item.id} • {item.categoria || 'Sem categoria'}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text
                          style={[
                            styles.pickerItemQtd,
                            semSaldo ? { color: SenaiColors.danger } : { color: SenaiColors.success },
                          ]}
                        >
                          {semSaldo ? 'Esgotado' : `${item.quantidade} un.`}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={{ padding: 24, alignItems: 'center' }}>
                    <Text style={{ color: '#94A3B8' }}>Nenhum item encontrado.</Text>
                  </View>
                }
              />
            )}
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
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 32,
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
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: SenaiColors.secondary,
    textAlign: 'center',
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: SenaiColors.primary,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#F8FAFC',
    color: SenaiColors.textDark,
  },
  textarea: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  itemPickerBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
  },
  itemPickerText: {
    fontSize: 14,
    color: SenaiColors.textDark,
    fontWeight: '600',
    flex: 1,
  },
  itemPickerArrow: {
    fontSize: 16,
    marginLeft: 6,
  },
  devolucaoToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  toggleBtnActive: {
    backgroundColor: SenaiColors.orange,
    borderColor: SenaiColors.orange,
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  toggleBtnTextActive: {
    color: SenaiColors.darkBlue,
    fontWeight: '900',
  },
  btnAdicionar: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1.5,
    borderColor: SenaiColors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  btnAdicionarText: {
    color: SenaiColors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: SenaiColors.secondary,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 6,
    marginBottom: 4,
  },
  th: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  tableRowAlt: {
    backgroundColor: '#F8FAFC',
  },
  td: {
    fontSize: 13,
    color: SenaiColors.textDark,
  },
  btnLixeira: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  lixeiraText: {
    fontSize: 16,
  },
  emptyTable: {
    padding: 24,
    alignItems: 'center',
  },
  emptyTableText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  btnRegistrar: {
    backgroundColor: SenaiColors.orange,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: SenaiColors.orange,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 3,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnRegistrarText: {
    color: SenaiColors.darkBlue,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    width: '100%',
    maxWidth: 420,
    elevation: 6,
  },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
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
  modalSearchInput: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 10,
    backgroundColor: '#F8FAFC',
  },
  pickerItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pickerItemNome: {
    fontSize: 14,
    fontWeight: '700',
    color: SenaiColors.textDark,
  },
  pickerItemCat: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  pickerItemQtd: {
    fontSize: 13,
    fontWeight: '800',
  },
});
