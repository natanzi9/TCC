// ============================================================
// adicionar-item.jsx — Cadastro e Alteração de Itens SGA SENAI
// Estética e campos idênticos ao adicionaritens.html / style+itens.css
// ============================================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adicionarItem, alterarItem, getEstoque, uploadImagem, getItemImageUrl } from '@/services/api';
import { SenaiColors } from '@/constants/theme';
import { SenaiHeader } from '@/components/SenaiHeader';

export default function AdicionarItemScreen() {
  const router = useRouter();

  const [modo, setModo] = useState('adicionar');

  // Campos do formulário
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [estoqueMinimo, setEstoqueMinimo] = useState('');

  // Imagem: guardamos a URI local para visualização e o nome do arquivo já enviado
  const [imagemUri, setImagemUri] = useState(null);   // URI local (visualização prévia)
  const [imagemNome, setImagemNome] = useState('');   // nome salvo no servidor

  const [loading, setLoading] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  // Seleção de item para alterar
  const [estoqueItens, setEstoqueItens] = useState([]);
  const [modalItemPicker, setModalItemPicker] = useState(false);
  const [itemSelecionadoParaEditar, setItemSelecionadoParaEditar] = useState(null);
  const [pickerSearch, setPickerSearch] = useState('');

  useEffect(() => {
    getEstoque()
      .then(setEstoqueItens)
      .catch(() => {});
  }, []);

  // ---- Galeria de imagem ----
  async function selecionarFoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos de acesso à galeria para selecionar uma imagem.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (result.canceled) return;

    const uri = result.assets[0].uri;
    setImagemUri(uri);
    setImagemNome('');   // será preenchido após o upload

    // Faz upload imediatamente ao selecionar
    setUploadingImg(true);
    try {
      const res = await uploadImagem(uri);
      if (res?.nome_arquivo) {
        setImagemNome(res.nome_arquivo);
      } else {
        Alert.alert('Aviso', 'Upload feito, mas nome do arquivo não retornou. Tente novamente.');
        setImagemUri(null);
      }
    } catch (err) {
      Alert.alert('Erro no upload', err?.message || 'Não foi possível enviar a imagem.');
      setImagemUri(null);
    } finally {
      setUploadingImg(false);
    }
  }

  function removerFoto() {
    setImagemUri(null);
    setImagemNome('');
  }

  // ---- Seleção de item para editar ----
  function handleSelecionarItemParaEditar(item) {
    setItemSelecionadoParaEditar(item);
    setNome(item.nome);
    setCategoria(item.categoria ?? '');
    setDescricao(item.descricao ?? '');
    setPreco(item.preco != null ? String(item.preco) : '');
    setQuantidade(String(item.quantidade ?? 0));
    setEstoqueMinimo(String(item.estoque_min ?? 0));
    // Restaura a imagem existente no servidor como visualização prévia (via URL)
    if (item.imagem) {
      setImagemNome(item.imagem);
      setImagemUri(null); // usaremos imagemNome para montar a URL de visualização
    } else {
      setImagemNome('');
      setImagemUri(null);
    }
    setModalItemPicker(false);
  }

  function limparFormulario() {
    setNome('');
    setCategoria('');
    setDescricao('');
    setPreco('');
    setQuantidade('');
    setEstoqueMinimo('');
    setImagemUri(null);
    setImagemNome('');
    setItemSelecionadoParaEditar(null);
  }

  // ---- Salvar ----
  async function handleSalvar() {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'O campo NOME é obrigatório!');
      return;
    }
    const q = parseInt(quantidade, 10);
    if (isNaN(q) || q < 0) {
      Alert.alert('Atenção', 'Informe uma QUANTIDADE válida (número maior ou igual a zero).');
      return;
    }
    const p = parseFloat(preco.replace(',', '.'));
    if (isNaN(p) || p < 0) {
      Alert.alert('Atenção', 'Informe um PREÇO válido (ex: 15.50).');
      return;
    }
    const min = parseInt(estoqueMinimo, 10) || 0;

    if (uploadingImg) {
      Alert.alert('Aguarde', 'A imagem ainda está sendo enviada. Aguarde um instante.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nome: nome.trim(),
        categoria: categoria.trim(),
        descricao: descricao.trim(),
        preco: p,
        quantidade: q,
        estoque_min: min,
        imagem: imagemNome || undefined,
      };

      if (modo === 'adicionar') {
        await adicionarItem(payload);
        Alert.alert('Sucesso!', 'Item adicionado ao estoque com sucesso!', [
          { text: 'Ver Estoque', onPress: () => router.replace('/estoque') },
          { text: 'Adicionar Outro', onPress: limparFormulario },
        ]);
      } else {
        if (!itemSelecionadoParaEditar) {
          Alert.alert('Atenção', 'Selecione qual item deseja alterar primeiro!');
          setLoading(false);
          return;
        }
        await alterarItem(itemSelecionadoParaEditar.id, payload);
        Alert.alert('Sucesso!', 'Item atualizado com sucesso!', [
          { text: 'Ver Estoque', onPress: () => router.replace('/estoque') },
          { text: 'OK', onPress: () => {} },
        ]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert('Erro', `Falha ao salvar item: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  const itensFiltrados = estoqueItens.filter(
    (i) =>
      i.nome.toLowerCase().includes(pickerSearch.toLowerCase()) ||
      String(i.id).includes(pickerSearch) ||
      (i.categoria ?? '').toLowerCase().includes(pickerSearch.toLowerCase()),
  );

  // Visualização: URI local tem prioridade; senão usa URL do servidor
  const previewSource = imagemUri
    ? { uri: imagemUri }
    : imagemNome
    ? { uri: getItemImageUrl(imagemNome) }
    : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <SenaiHeader
        title={modo === 'adicionar' ? 'ADICIONAR ITENS' : 'ALTERAR ITEM'}
        showBack={true}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Card Arredondado (.quadrado do style+itens.css) */}
          <View style={styles.quadrado}>
            {/* Seletor de Modo: ADICIONAR NOVO vs ALTERAR EXISTENTE */}
            <View style={styles.modoTabs}>
              <TouchableOpacity
                style={[styles.modoTab, modo === 'adicionar' && styles.modoTabActive]}
                onPress={() => {
                  setModo('adicionar');
                  limparFormulario();
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.modoTabText, modo === 'adicionar' && styles.modoTabTextActive]}>
                  ➕ NOVO ITEM
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modoTab, modo === 'alterar' && styles.modoTabActive]}
                onPress={() => {
                  setModo('alterar');
                  setModalItemPicker(true);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.modoTabText, modo === 'alterar' && styles.modoTabTextActive]}>
                  ✏️ ALTERAR ITEM
                </Text>
              </TouchableOpacity>
            </View>

            {modo === 'alterar' && (
              <View style={styles.itemSelecionadoBox}>
                <Text style={styles.itemSelecionadoLabel}>Item selecionado para alteração:</Text>
                <TouchableOpacity
                  style={styles.btnTrocarItem}
                  onPress={() => setModalItemPicker(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnTrocarItemText} numberOfLines={1}>
                    {itemSelecionadoParaEditar
                      ? `[ID ${itemSelecionadoParaEditar.id}] ${itemSelecionadoParaEditar.nome}`
                      : 'Toque para selecionar o item...'}
                  </Text>
                  <Text style={{ fontSize: 13, color: SenaiColors.primary, fontWeight: 'bold' }}>Trocar</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Campo NOME */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>NOME:</Text>
              <TextInput
                style={styles.input}
                placeholder="Nome do produto / material"
                placeholderTextColor="#94A3B8"
                value={nome}
                onChangeText={setNome}
              />
            </View>

            {/* Campo CATEGORIA */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CATEGORIA:</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Ferramentas, EPI, Eletrônicos..."
                placeholderTextColor="#94A3B8"
                value={categoria}
                onChangeText={setCategoria}
              />
            </View>

            {/* Campo DESCRIÇÃO */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>DESCRIÇÃO:</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Detalhes ou especificações do item"
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                value={descricao}
                onChangeText={setDescricao}
              />
            </View>

            {/* Campo PREÇO e QUANTIDADE */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>PREÇO (R$):</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#94A3B8"
                  value={preco}
                  onChangeText={setPreco}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>QUANTIDADE:</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                  value={quantidade}
                  onChangeText={setQuantidade}
                />
              </View>
            </View>

            {/* Campo ESTOQUE MÍNIMO */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>ESTOQUE MÍNIMO:</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Quantidade mínima para alerta (ex: 5)"
                placeholderTextColor="#94A3B8"
                value={estoqueMinimo}
                onChangeText={setEstoqueMinimo}
              />
            </View>

            {/* Campo IMAGEM — seletor da galeria */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>📷 IMAGEM:</Text>

              {/* Preview */}
              {previewSource ? (
                <View style={styles.previewContainer}>
                  <Image source={previewSource} style={styles.previewImg} resizeMode="cover" />
                  {uploadingImg && (
                    <View style={styles.previewOverlay}>
                      <ActivityIndicator color="#fff" />
                      <Text style={styles.previewOverlayText}>Enviando...</Text>
                    </View>
                  )}
                  <TouchableOpacity style={styles.btnRemoverFoto} onPress={removerFoto}>
                    <Text style={styles.btnRemoverFotoText}>✕ Remover foto</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.btnGaleria, uploadingImg && styles.btnDisabled]}
                  onPress={selecionarFoto}
                  disabled={uploadingImg}
                  activeOpacity={0.8}
                >
                  {uploadingImg ? (
                    <ActivityIndicator color={SenaiColors.primary} />
                  ) : (
                    <Text style={styles.btnGaleriaText}>🖼️  Selecionar da Galeria</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Botões de Ação */}
            <View style={styles.botoesContainer}>
              <TouchableOpacity
                style={[styles.btnSalvar, (loading || uploadingImg) && styles.btnDisabled]}
                onPress={handleSalvar}
                disabled={loading || uploadingImg}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={SenaiColors.darkBlue} />
                ) : (
                  <Text style={styles.btnSalvarText}>
                    {modo === 'adicionar' ? 'ADICIONAR' : 'SALVAR ALTERAÇÃO'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnLimpar}
                onPress={limparFormulario}
                activeOpacity={0.8}
              >
                <Text style={styles.btnLimparText}>LIMPAR CAMPOS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal para Escolher Item a Alterar */}
      <Modal visible={modalItemPicker} transparent animationType="slide" onRequestClose={() => setModalItemPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Escolha o item a alterar</Text>
              <TouchableOpacity onPress={() => setModalItemPicker(false)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalSearch}
              placeholder="Pesquise por nome ou ID..."
              placeholderTextColor="#94A3B8"
              value={pickerSearch}
              onChangeText={setPickerSearch}
            />

            <FlatList
              data={itensFiltrados}
              keyExtractor={(item) => String(item.id)}
              style={{ maxHeight: 360 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.itemPickerRow}
                  onPress={() => handleSelecionarItemParaEditar(item)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemPickerNome}>{item.nome}</Text>
                    <Text style={styles.itemPickerInfo}>
                      ID: {item.id} • {item.categoria || 'Sem categoria'} • Saldo: {item.quantidade}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 16, color: SenaiColors.orange, fontWeight: 'bold' }}>›</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={{ padding: 24, alignItems: 'center' }}>
                  <Text style={{ color: '#94A3B8' }}>Nenhum item cadastrado.</Text>
                </View>
              }
            />
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
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  modoTabs: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  modoTab: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  modoTabActive: {
    backgroundColor: SenaiColors.primary,
    borderColor: SenaiColors.primary,
  },
  modoTabText: {
    fontSize: 13,
    fontWeight: '800',
    color: SenaiColors.secondary,
  },
  modoTabTextActive: {
    color: '#FFFFFF',
  },
  itemSelecionadoBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  itemSelecionadoLabel: {
    fontSize: 11,
    color: '#1E40AF',
    fontWeight: '700',
    marginBottom: 4,
  },
  btnTrocarItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  btnTrocarItemText: {
    fontSize: 14,
    fontWeight: '800',
    color: SenaiColors.primary,
    flex: 1,
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
  // ---- galeria / imagem ----
  btnGaleria: {
    borderWidth: 1.5,
    borderColor: SenaiColors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
  },
  btnGaleriaText: {
    fontSize: 15,
    fontWeight: '700',
    color: SenaiColors.primary,
  },
  previewContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  previewImg: {
    width: '100%',
    height: 180,
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  previewOverlayText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  btnRemoverFoto: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 8,
    alignItems: 'center',
  },
  btnRemoverFotoText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 13,
  },
  // ---- botões ----
  botoesContainer: {
    marginTop: 10,
    gap: 8,
  },
  btnSalvar: {
    backgroundColor: SenaiColors.orange,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: SenaiColors.orange,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 3,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnSalvarText: {
    color: SenaiColors.darkBlue,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1,
  },
  btnLimpar: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  btnLimparText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  // ---- modal ----
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
  modalSearch: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 10,
    backgroundColor: '#F8FAFC',
  },
  itemPickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemPickerNome: {
    fontSize: 14,
    fontWeight: '700',
    color: SenaiColors.textDark,
  },
  itemPickerInfo: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
});
