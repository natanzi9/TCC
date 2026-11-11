// ============================================================
// index.tsx — Tela de Login SGA SENAI
// Estética idêntica ao index.html / style.css do sistema web
// ============================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { checarAdm, loginUsuario, getApiBase, setApiBase, criarUsuario } from '@/services/api';
import { SenaiColors } from '@/constants/theme';

function showAlert(title: string, message?: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
}

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [username, setUsername] = useState('admin');
  const [senha, setSenha] = useState('123');
  const [tipo, setTipo] = useState<'user' | 'adm'>('adm');
  const [loading, setLoading] = useState(false);
  const [showSenha, setShowSenha] = useState(false);
  const [erroMsg, setErroMsg] = useState('');

  // Modal para configurar IP do servidor
  const [configModal, setConfigModal] = useState(false);
  const [serverUrl, setServerUrl] = useState(getApiBase());

  // Modal para criar conta (idêntico a criarconta.html)
  const [criarModal, setCriarModal] = useState(false);
  const [novoUser, setNovoUser] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [criarLoading, setCriarLoading] = useState(false);
  const [criarErro, setCriarErro] = useState('');

  async function handleLogin() {
    setErroMsg('');
    const u = username.trim();
    const s = senha.trim();

    if (!u || !s) {
      setErroMsg('Por favor, preencha o usuário e a senha!');
      showAlert('Atenção', 'Preencha usuário e senha!');
      return;
    }

    setLoading(true);
    try {
      if (tipo === 'adm') {
        const valido = await checarAdm(u, s);
        if (valido) {
          signIn(u, 'adm');
          router.replace('/home');
          return;
        } else {
          setErroMsg('Usuário ou senha incorretos para Administrador.');
          showAlert('Erro de Acesso', 'Usuário ou senha incorretos para Administrador.');
        }
      } else {
        // Tenta login como usuário comum
        const sucesso = await loginUsuario(u, s);
        if (sucesso) {
          signIn(u, 'user');
          router.replace('/home');
          return;
        }

        // Se falhou como usuário, mas digitou credenciais de administrador, tenta como ADM
        const isAdmin = await checarAdm(u, s);
        if (isAdmin) {
          signIn(u, 'adm');
          router.replace('/home');
          return;
        }

        setErroMsg('Usuário ou senha incorretos.');
        showAlert('Erro de Acesso', 'Usuário ou senha incorretos.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const aviso = `Falha ao conectar no servidor (${getApiBase()}):\n${msg}`;
      setErroMsg(aviso);
      showAlert('Erro de Conexão', aviso);
    } finally {
      setLoading(false);
    }
  }

  async function handleCriarConta() {
    setCriarErro('');
    if (!novoUser.trim()) {
      setCriarErro('Informe o nome de usuário.');
      return;
    }
    if (novaSenha.length < 3) {
      setCriarErro('A senha deve ter pelo menos 3 caracteres.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setCriarErro('As senhas não coincidem!');
      return;
    }

    setCriarLoading(true);
    try {
      await criarUsuario(novoUser.trim(), novaSenha);
      showAlert('Sucesso!', 'Conta criada com sucesso! Você já pode entrar.');
      setCriarModal(false);
      setUsername(novoUser.trim());
      setSenha(novaSenha);
      setTipo('user');
      setNovoUser('');
      setNovaSenha('');
      setConfirmarSenha('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setCriarErro(msg);
      showAlert('Erro', msg);
    } finally {
      setCriarLoading(false);
    }
  }

  function salvarConfigUrl() {
    if (!serverUrl.trim()) {
      showAlert('Atenção', 'O endereço do servidor não pode ser vazio.');
      return;
    }
    setApiBase(serverUrl.trim());
    setConfigModal(false);
    showAlert('Servidor Atualizado', `Novo endereço:\n${getApiBase()}`);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Banner do Almoxarifado superior (imagem real almoxarifa.jpg) */}
        <View style={styles.bannerContainer}>
          <Image
            source={require('@/assets/images/almoxarifa.jpg')}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.bannerOverlay} />

          {/* Botão de configuração do servidor IP */}
          <TouchableOpacity
            style={styles.configBtn}
            onPress={() => setConfigModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.configBtnText}>⚙️ Servidor: {getApiBase().replace('http://', '')}</Text>
          </TouchableOpacity>
        </View>

        {/* Card do formulário de login (estética .quadrado do web) */}
        <View style={styles.card}>
          {/* Logo SENAI */}
          <View style={styles.logoRow}>
            <Image
              source={require('@/assets/images/images.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>SGA SENAI</Text>
          <Text style={styles.subtitle}>Sistema de Gerenciamento de Almoxarifado</Text>

          {/* Banner de erro inline para nunca falhar silenciosamente no web */}
          {erroMsg !== '' && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>⚠️ {erroMsg}</Text>
            </View>
          )}

          {/* Campo Usuário */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username:</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite seu login"
              placeholderTextColor="#94A3B8"
              value={username}
              onChangeText={(t) => {
                setUsername(t);
                setErroMsg('');
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Campo Senha */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>SENHA:</Text>
            <View style={styles.senhaRow}>
              <TextInput
                style={[styles.input, styles.senhaInput]}
                placeholder="Digite sua Senha"
                placeholderTextColor="#94A3B8"
                value={senha}
                onChangeText={(t) => {
                  setSenha(t);
                  setErroMsg('');
                }}
                secureTextEntry={!showSenha}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowSenha(!showSenha)}
              >
                <Text style={styles.eyeText}>{showSenha ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Permissão / Perfil (User vs ADM, idêntico aos checkboxes do web) */}
          <View style={styles.permissaoRow}>
            <TouchableOpacity
              style={[styles.permissaoItem, tipo === 'user' && styles.permissaoItemActive]}
              onPress={() => setTipo('user')}
              activeOpacity={0.7}
            >
              <View style={[styles.radioDot, tipo === 'user' && styles.radioDotActive]} />
              <Text style={[styles.permissaoText, tipo === 'user' && styles.permissaoTextActive]}>
                User
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.permissaoItem, tipo === 'adm' && styles.permissaoItemActive]}
              onPress={() => setTipo('adm')}
              activeOpacity={0.7}
            >
              <View style={[styles.radioDot, tipo === 'adm' && styles.radioDotActive]} />
              <Text style={[styles.permissaoText, tipo === 'adm' && styles.permissaoTextActive]}>
                ADM
              </Text>
            </TouchableOpacity>
          </View>

          {/* Botão ENTRAR (estilo idêntico ao botão laranja do web) */}
          <TouchableOpacity
            style={[styles.btnEntrar, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={SenaiColors.darkBlue} size="small" />
            ) : (
              <Text style={styles.btnEntrarText}>ENTRAR</Text>
            )}
          </TouchableOpacity>

          {/* Link Crie uma conta (idêntico ao web) */}
          <TouchableOpacity
            style={styles.linkCriar}
            onPress={() => setCriarModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.linkCriarText}>Crie uma conta</Text>
          </TouchableOpacity>
        </View>

        {/* Atalhos Rápidos para Testar */}
        <View style={styles.quickFillRow}>
          <TouchableOpacity
            style={styles.quickFillBtn}
            onPress={() => {
              setUsername('admin');
              setSenha('123');
              setTipo('adm');
              setErroMsg('');
            }}
          >
            <Text style={styles.quickFillText}>🔑 Admin (admin / 123)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickFillBtn}
            onPress={() => {
              setUsername('aluno');
              setSenha('123');
              setTipo('user');
              setErroMsg('');
            }}
          >
            <Text style={styles.quickFillText}>👤 Aluno (aluno / 123)</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>SENAI Almoxarifado © 2026</Text>
      </ScrollView>

      {/* Modal para Criar Conta */}
      <Modal visible={criarModal} transparent animationType="slide" onRequestClose={() => setCriarModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>CRIAR CONTA</Text>
              <TouchableOpacity onPress={() => setCriarModal(false)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {criarErro !== '' && (
              <View style={styles.errorBannerModal}>
                <Text style={styles.errorBannerText}>⚠️ {criarErro}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.labelModal}>Usuário:</Text>
              <TextInput
                style={styles.inputModal}
                placeholder="Nome do usuário"
                value={novoUser}
                onChangeText={setNovoUser}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.labelModal}>Senha:</Text>
              <TextInput
                style={styles.inputModal}
                placeholder="Senha"
                secureTextEntry
                value={novaSenha}
                onChangeText={setNovaSenha}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.labelModal}>CONFIRMAR SENHA:</Text>
              <TextInput
                style={styles.inputModal}
                placeholder="Confirme sua senha"
                secureTextEntry
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
              />
            </View>

            <TouchableOpacity
              style={[styles.btnEntrar, { marginTop: 20 }]}
              onPress={handleCriarConta}
              disabled={criarLoading}
            >
              {criarLoading ? (
                <ActivityIndicator color={SenaiColors.darkBlue} />
              ) : (
                <Text style={styles.btnEntrarText}>CRIAR CONTA</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: 14, alignItems: 'center' }}
              onPress={() => setCriarModal(false)}
            >
              <Text style={{ color: SenaiColors.primary, fontWeight: '700' }}>Voltar para o login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal para Configuração do Endereço IP do Servidor */}
      <Modal visible={configModal} transparent animationType="fade" onRequestClose={() => setConfigModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configurar Servidor</Text>
              <TouchableOpacity onPress={() => setConfigModal(false)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>
              Endereço do backend Flask (ex: http://localhost:5000 no navegador web, ou http://10.154.49.255:5000 no celular):
            </Text>

            <TextInput
              style={styles.inputModal}
              value={serverUrl}
              onChangeText={setServerUrl}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="http://10.154.49.255:5000"
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={[styles.btnEntrar, { flex: 1, marginTop: 0 }]}
                onPress={salvarConfigUrl}
              >
                <Text style={styles.btnEntrarText}>SALVAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SenaiColors.pageBg,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  bannerContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(4, 92, 172, 0.45)',
  },
  configBtn: {
    position: 'absolute',
    top: 40,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  configBtnText: {
    color: SenaiColors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  card: {
    backgroundColor: SenaiColors.primary,
    marginHorizontal: 16,
    marginTop: -28,
    borderRadius: SenaiColors.cardRadius,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 220,
    height: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 13,
    color: '#E0F2FE',
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 2,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#EF4444',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  errorBannerModal: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#EF4444',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  errorBannerText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  labelModal: {
    fontSize: 14,
    fontWeight: '800',
    color: SenaiColors.primary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: SenaiColors.textDark,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  inputModal: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: SenaiColors.textDark,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  senhaRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  senhaInput: {
    paddingRight: 44,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center',
  },
  eyeText: {
    fontSize: 18,
  },
  permissaoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginVertical: 12,
  },
  permissaoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  permissaoItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  radioDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginRight: 8,
  },
  radioDotActive: {
    backgroundColor: SenaiColors.orange,
    borderColor: SenaiColors.orange,
  },
  permissaoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  permissaoTextActive: {
    color: SenaiColors.orange,
    fontWeight: '800',
  },
  btnEntrar: {
    backgroundColor: SenaiColors.orange,
    borderRadius: 8,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    shadowColor: SenaiColors.orange,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnEntrarText: {
    color: SenaiColors.darkBlue,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  linkCriar: {
    marginTop: 18,
    alignItems: 'center',
  },
  linkCriarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontStyle: 'italic',
    textDecorationLine: 'underline',
  },
  quickFillRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 14,
    paddingHorizontal: 16,
  },
  quickFillBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  quickFillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  footerText: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 14,
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
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: SenaiColors.primary,
  },
  modalClose: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 20,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
});
