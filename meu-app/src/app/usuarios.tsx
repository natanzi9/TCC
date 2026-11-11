// ============================================================
// usuarios.tsx — Gestão de Usuários SGA SENAI (Somente ADM)
// Estética idêntica ao criarconta.html / stylecc.css
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getUsuarios, criarUsuario, removerUsuario } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { SenaiColors } from '@/constants/theme';
import { SenaiHeader } from '@/components/SenaiHeader';

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

  // Modal para Criar Novo Usuário
  const [criarModal, setCriarModal] = useState(false);
  const [novoUser, setNovoUser] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [criarLoading, setCriarLoading] = useState(false);

  useEffect(() => {
    if (!isAdm) {
      Alert.alert('Acesso Restrito', 'Esta funcionalidade é exclusiva para administradores.');
      router.replace('/home');
    }
  }, [isAdm]);

  const carregar = useCallback(async () => {
    try {
      const res = await getUsuarios();
      setUsuarios(res.usuarios ?? []);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar a lista de usuários.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function handleCriarUsuario() {
    if (!novoUser.trim()) {
      Alert.alert('Atenção', 'Informe o nome de usuário!');
      return;
    }
    if (novaSenha.length < 4) {
      Alert.alert('Atenção', 'A senha deve conter ao menos 4 caracteres.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      Alert.alert('Atenção', 'As senhas não coincidem!');
      return;
    }

    setCriarLoading(true);
    try {
      await criarUsuario(novoUser.trim(), novaSenha);
      Alert.alert('Sucesso!', `Usuário "${novoUser}" cadastrado com sucesso!`);
      setCriarModal(false);
      setNovoUser('');
      setNovaSenha('');
      setConfirmarSenha('');
      carregar();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert('Erro', `Falha ao cadastrar: ${msg}`);
    } finally {
      setCriarLoading(false);
    }
  }

  function handleRemover(user: Usuario) {
    if (user.usuario === username) {
      Alert.alert('Atenção', 'Você não pode remover seu próprio usuário logado!');
      return;
    }
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir o usuário "${user.usuario}" (ID: ${user.id})?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await removerUsuario(user.id);
              Alert.alert('Sucesso', 'Usuário removido com sucesso.');
              setUsuarios((prev) => prev.filter((u) => u.id !== user.id));
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err);
              Alert.alert('Erro', `Falha ao remover usuário: ${msg}`);
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <SenaiHeader
        title="GESTÃO DE USUÁRIOS"
        showBack={true}
        rightAction={
          <TouchableOpacity
            style={styles.btnNovoUser}
            onPress={() => setCriarModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.btnNovoUserText}>+ Criar</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.container}>
        <View style={styles.quadrado}>
          <Text style={styles.tituloSecao}>USUÁRIOS DO SISTEMA</Text>
          <Text style={styles.subtituloSecao}>
            Total cadastrado: {usuarios.length} {usuarios.length === 1 ? 'usuário' : 'usuários'}
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color={SenaiColors.orange} style={{ marginVertical: 36 }} />
          ) : (
            <FlatList
              data={usuarios}
              keyExtractor={(item) => String(item.id)}
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                carregar();
              }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => {
                const isCurrentUser = item.usuario === username;
                return (
                  <View style={[styles.userRow, index % 2 === 1 && styles.userRowAlt]}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>👤</Text>
                    </View>

                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.userName}>{item.usuario}</Text>
                      <Text style={styles.userId}>
                        ID: {item.id} {isCurrentUser ? '• (Você logado)' : ''}
                      </Text>
                    </View>

                    {!isCurrentUser && (
                      <TouchableOpacity
                        style={styles.btnExcluir}
                        onPress={() => handleRemover(item)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.btnExcluirText}>Excluir</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>Nenhum usuário cadastrado.</Text>
                </View>
              }
            />
          )}

          <TouchableOpacity
            style={styles.btnCriarGrande}
            onPress={() => setCriarModal(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.btnCriarGrandeText}>+ CRIAR NOVA CONTA</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal Criar Conta (idêntico ao criarconta.html) */}
      <Modal visible={criarModal} transparent animationType="slide" onRequestClose={() => setCriarModal(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>CRIAR CONTA</Text>
              <TouchableOpacity onPress={() => setCriarModal(false)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                <strong>Usuário:</strong>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Digite o login do usuário"
                placeholderTextColor="#94A3B8"
                value={novoUser}
                onChangeText={setNovoUser}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                <strong>Senha:</strong>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Digite a senha"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                value={novaSenha}
                onChangeText={setNovaSenha}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                <strong>CONFIRMAR SENHA:</strong>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Confirme a senha"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
              />
            </View>

            <TouchableOpacity
              style={[styles.btnCriarConfirmar, criarLoading && { opacity: 0.6 }]}
              onPress={handleCriarUsuario}
              disabled={criarLoading}
              activeOpacity={0.85}
            >
              {criarLoading ? (
                <ActivityIndicator color={SenaiColors.darkBlue} />
              ) : (
                <Text style={styles.btnCriarConfirmarText}>CRIAR CONTA</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
  btnNovoUser: {
    backgroundColor: SenaiColors.orange,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  btnNovoUserText: {
    color: SenaiColors.darkBlue,
    fontWeight: '800',
    fontSize: 12,
  },
  quadrado: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: SenaiColors.cardRadius,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  tituloSecao: {
    fontSize: 20,
    fontWeight: '800',
    color: SenaiColors.secondary,
    textAlign: 'center',
  },
  subtituloSecao: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 2,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  userRowAlt: {
    backgroundColor: '#F8FAFC',
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    fontSize: 18,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: SenaiColors.textDark,
  },
  userId: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  btnExcluir: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnExcluirText: {
    color: SenaiColors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  btnCriarGrande: {
    backgroundColor: SenaiColors.orange,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
    shadowColor: SenaiColors.orange,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 3,
  },
  btnCriarGrandeText: {
    color: SenaiColors.darkBlue,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
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
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: SenaiColors.cardRadius,
    padding: 22,
    width: '100%',
    maxWidth: 400,
    elevation: 8,
  },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 8,
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
  inputGroup: {
    marginBottom: 12,
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
  btnCriarConfirmar: {
    backgroundColor: SenaiColors.orange,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  btnCriarConfirmarText: {
    color: SenaiColors.darkBlue,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
