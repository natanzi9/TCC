// ============================================================
// adicionar-item.tsx — Formulário para adicionar item ao estoque (ADM)
// ============================================================
import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adicionarItem } from '@/services/api';

const GREEN = '#2E7D32';

interface FormData {
  nome: string;
  categoria: string;
  descricao: string;
  preco: string;
  quantidade: string;
  estoque_min: string;
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  multiline?: boolean;
  required?: boolean;
}) {
  return (
    <View style={styles.fieldBox}>
      <Text style={styles.label}>
        {label} {required && <Text style={{ color: '#C62828' }}>*</Text>}
      </Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMulti]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? `Informe ${label.toLowerCase()}`}
        placeholderTextColor="#999"
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
}

export default function AdicionarItemScreen() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    nome: '',
    categoria: '',
    descricao: '',
    preco: '',
    quantidade: '',
    estoque_min: '',
  });
  const [loading, setLoading] = useState(false);

  function set(field: keyof FormData) {
    return (value: string) => setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSalvar() {
    if (!form.nome.trim()) {
      Alert.alert('Atenção', 'O nome do item é obrigatório.');
      return;
    }
    const quantidade = parseInt(form.quantidade, 10);
    const preco = parseFloat(form.preco.replace(',', '.'));

    if (isNaN(quantidade) || quantidade < 0) {
      Alert.alert('Atenção', 'Informe uma quantidade válida.');
      return;
    }
    if (isNaN(preco)) {
      Alert.alert('Atenção', 'Informe um preço válido (ex: 12.50).');
      return;
    }

    setLoading(true);
    try {
      await adicionarItem({
        nome: form.nome.trim(),
        categoria: form.categoria.trim() || undefined,
        descricao: form.descricao.trim() || undefined,
        preco,
        quantidade,
        estoque_min: parseInt(form.estoque_min, 10) || 0,
      } as any);
      Alert.alert('Sucesso', 'Item cadastrado com sucesso!', [
        { text: 'Ver Estoque', onPress: () => router.replace('/estoque') },
        { text: 'Adicionar outro', onPress: () => setForm({ nome: '', categoria: '', descricao: '', preco: '', quantidade: '', estoque_min: '' }) },
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
        <Text style={styles.headerTitle}>Adicionar Item</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📦 Dados do Produto</Text>

            <FormField
              label="Nome"
              value={form.nome}
              onChange={set('nome')}
              placeholder="Ex: Álcool 70% 1L"
              required
            />
            <FormField
              label="Categoria"
              value={form.categoria}
              onChange={set('categoria')}
              placeholder="Ex: Limpeza, EPI, Ferramenta..."
            />
            <FormField
              label="Descrição"
              value={form.descricao}
              onChange={set('descricao')}
              placeholder="Descrição opcional"
              multiline
            />

            <View style={styles.row}>
              <View style={styles.halfField}>
                <FormField
                  label="Preço (R$)"
                  value={form.preco}
                  onChange={set('preco')}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.halfField}>
                <FormField
                  label="Quantidade"
                  value={form.quantidade}
                  onChange={set('quantidade')}
                  placeholder="0"
                  keyboardType="numeric"
                  required
                />
              </View>
            </View>

            <FormField
              label="Estoque Mínimo"
              value={form.estoque_min}
              onChange={set('estoque_min')}
              placeholder="0 (opcional)"
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={[styles.saveBtn, loading && { opacity: 0.6 }]}
              onPress={handleSalvar}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>✓ Salvar Item</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4F8' },

  header: {
    backgroundColor: GREEN,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backBtn: { width: 60 },
  backText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  headerTitle: { flex: 1, color: '#fff', fontSize: 20, fontWeight: '700', textAlign: 'center' },

  scroll: { padding: 16 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 16 },

  fieldBox: { marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 12 },
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

  row: { flexDirection: 'row', gap: 10 },
  halfField: { flex: 1 },

  saveBtn: {
    marginTop: 24,
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: GREEN,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 10 },
  cancelBtnText: { color: '#888', fontSize: 14 },
});
