// ============================================================
// usuarios.tsx — Gestão de usuários (somente ADM)
// ============================================================
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getUsuarios, criarUsuario, removerUsuario } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

const PURPLE = '#6A1B9A';
const RED = '#C62828';

interface Usuario {
  id: number;
  usuario: string;
}

export default function UsuariosScreen() {
  const router = useRouter();
  const { isAdm, username } = useAuth();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal criar
  const [criarModal, setCriarModal] = useState(false);
  const [novoUser, setNovoUser] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [criarLoading, setCriarLoading] = useState(false);
  const [showSenha, setShowSenha] = useState(false);

  // Redirecionar se não for ADM
  useEffect(() => {
    if (!isAdm) {
      Alert.alert('Acesso negado', 'Esta tela é exclusiva para administradores.');
      router.replace('/home');
    }
  }, [isAdm]);

  const carregar = useCallback(async () => {
    try {
      const res = await getUsuarios();
      setUsuarios(res.usuarios ?? []);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os usuários.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function handleCriar() {
    if (!novoUser.trim()) {
      Alert.alert('Atenção', 'Informe o nome de usuário.');
      return;
    }
    if (novaSenha.length < 4) {
      Alert.alert('Atenção', 'A senha deve ter ao menos 4 caracteres.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      Alert.alert('Atenção', 'As senhas não coincidem.');
      return;
    }

    setCriarLoading(true);
    try {
      await criarUsuario(novoUser.trim(), novaSenha);
      Alert.alert('Sucesso', `Usuário "${novoUser}" criado!`);
      setCriarModal(false);
      setNovoUser('');
      setNovaSenha('');
      setConfirmarSenha('');
      carregar();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert('Erro', msg);
    } finally {
      setCriarLoading(false);
    }
  }

  function handleRemover(user: Usuario) {
    if (user.usuario === username) {
      Alert.alert('Atenção', 'Você não pode remover sua própria conta.');
      return;
    }
    Alert.alert(
      'Confirmar exclusão',
      `Deseja remover o usuário "${user.usuario}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await removerUsuario(user.id);
              setUsuarios((prev) => prev.filter((u) => u.id !== user.id));
            } catch {
              Alert.alert('Erro', 'Falha ao remover usuário.');
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Usuários</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setCriarModal(true)}
        >
          <Text style={styles.addBtnText}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      {/* Resumo */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>👥 {usuarios.length} usuário(s) cadastrado(s)</Text>
      </View>

      {/* Lista */}
      {loading ? (
        <ActivityIndicator color={PURPLE} size="large" style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          data={usuarios}
          keyExtractor={(u) => String(u.id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          onRefresh={() => { setRefreshing(true); carregar(); }}
          refreshing={refreshing}
          renderItem={({ item }) => (
            <View style={styles.userRow}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>{item.usuario.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.usuario}</Text>
                <Text style={styles.userId}>ID #{item.id}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemover(item)}
              >
                <Text style={styles.removeBtnText}>Remover</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Nenhum usuário cadastrado.</Text>
            </View>
          }
        />
      )}

      {/* Modal Criar Usuário */}
      <Modal visible={criarModal} transparent animationType="slide" onRequestClose={() => setCriarModal(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Novo Usuário</Text>
                <TouchableOpacity onPress={() => setCriarModal(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Usuário *</Text>
              <TextInput
                style={styles.input}
                value={novoUser}
                onChangeText={setNovoUser}
                placeholder="Nome de usuário"
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.inputLabel}>Senha *</Text>
              <View style={styles.senhaRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={novaSenha}
                  onChangeText={setNovaSenha}
                  placeholder="Mínimo 4 caracteres"
                  placeholderTextColor="#999"
                  secureTextEntry={!showSenha}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowSenha(!showSenha)} style={styles.eyeBtn}>
                  <Text style={styles.eyeText}>{showSenha ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Confirmar Senha *</Text>
              <TextInput
                style={styles.input}
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
                placeholder="Repita a senha"
                placeholderTextColor="#999"
                secureTextEntry={!showSenha}
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={[styles.createBtn, criarLoading && { opacity: 0.6 }]}
                onPress={handleCriar}
                disabled={criarLoading}
              >
                {criarLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.createBtnText}>✓ Criar Usuário</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCriarModal(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4F8' },

  header: {
    backgroundColor: PURPLE,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backBtn: { width: 60 },
  backText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  headerTitle: { flex: 1, color: '#fff', fontSize: 20, fontWeight: '700', textAlign: 'center' },
  addBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    width: 60,
    alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  summary: { padding: 16, paddingBottom: 8 },
  summaryText: { fontSize: 14, color: '#666', fontWeight: '500' },

  userRow: {
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
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '600', color: '#222' },
  userId: { fontSize: 12, color: '#AAA', marginTop: 2 },
  removeBtn: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  removeBtnText: { color: RED, fontWeight: '700', fontSize: 13 },

  empty: { alignItems: 'center', paddingTop: 48 },
  emptyText: { color: '#AAA', fontSize: 15 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A2E' },
  modalClose: { fontSize: 20, color: '#888', padding: 4 },

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
  senhaRow: { flexDirection: 'row', alignItems: 'center' },
  eyeBtn: { paddingHorizontal: 10, paddingVertical: 12 },
  eyeText: { fontSize: 18 },

  createBtn: {
    marginTop: 20,
    backgroundColor: PURPLE,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: PURPLE,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelBtn: { marginTop: 10, alignItems: 'center', paddingVertical: 10, marginBottom: 8 },
  cancelBtnText: { color: '#888', fontSize: 14 },
});
