// ============================================================
// index.tsx — Tela de Login SGA SENAI
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { checarAdm } from '@/services/api';
import { API_BASE } from '@/services/api';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [username, setUsername] = useState('');
  const [senha, setSenha] = useState('');
  const [tipo, setTipo] = useState<'user' | 'adm'>('user');
  const [loading, setLoading] = useState(false);
  const [showSenha, setShowSenha] = useState(false);

  async function handleLogin() {
    if (!username.trim() || !senha.trim()) {
      Alert.alert('Atenção', 'Preencha usuário e senha!');
      return;
    }

    setLoading(true);
    try {
      if (tipo === 'adm') {
        // Verifica ADM via API JSON
        const valido = await checarAdm(username.trim(), senha.trim());
        if (valido) {
          signIn(username.trim(), 'adm');
          router.replace('/home');
        } else {
          Alert.alert('Erro', 'Usuário ou senha incorretos (ADM)');
        }
      } else {
        // Verifica user comum via FormData
        const form = new FormData();
        form.append('username', username.trim());
        form.append('senha', senha.trim());
        form.append('tipo', 'user');

        const res = await fetch(`${API_BASE}/api/login`, {
          method: 'POST',
          body: form,
          redirect: 'manual',
        });

        // Flask redireciona para /home em sucesso — status 3xx ou o body HTML indica sucesso
        const text = await res.text();
        const isError = text.includes('alert(') || text.includes('incorretos');

        if (!isError || res.status === 302 || res.url?.includes('/home')) {
          signIn(username.trim(), 'user');
          router.replace('/home');
        } else {
          Alert.alert('Erro', 'Usuário ou senha incorretos');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert('Erro de conexão', `Não foi possível conectar ao servidor.\n${msg}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header azul */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>SGA</Text>
          </View>
          <Text style={styles.headerTitle}>SGA SENAI</Text>
          <Text style={styles.headerSubtitle}>Sistema de Gerenciamento de Almoxarifado</Text>
        </View>

        {/* Card de login */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Entrar</Text>

          {/* Campo Usuário */}
          <Text style={styles.label}>Usuário</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite seu usuário"
            placeholderTextColor="#999"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Campo Senha */}
          <Text style={styles.label}>Senha</Text>
          <View style={styles.senhaRow}>
            <TextInput
              style={[styles.input, styles.senhaInput]}
              placeholder="Digite sua senha"
              placeholderTextColor="#999"
              value={senha}
              onChangeText={setSenha}
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

          {/* Seleção de tipo */}
          <Text style={styles.label}>Perfil de acesso</Text>
          <View style={styles.tipoRow}>
            <TouchableOpacity
              style={[styles.tipoBtn, tipo === 'user' && styles.tipoBtnActive]}
              onPress={() => setTipo('user')}
            >
              <Text style={[styles.tipoBtnText, tipo === 'user' && styles.tipoBtnTextActive]}>
                👤 Usuário
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tipoBtn, tipo === 'adm' && styles.tipoBtnActive]}
              onPress={() => setTipo('adm')}
            >
              <Text style={[styles.tipoBtnText, tipo === 'adm' && styles.tipoBtnTextActive]}>
                🛡 Admin
              </Text>
            </TouchableOpacity>
          </View>

          {/* Botão Entrar */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>ENTRAR</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>SENAI © 2026</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const BLUE = '#1565C0';
const BLUE_LIGHT = '#1E88E5';

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F0F4F8' },
  scroll: { flexGrow: 1 },

  header: {
    backgroundColor: BLUE,
    paddingTop: 70,
    paddingBottom: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  logoText: { fontSize: 22, fontWeight: '800', color: BLUE },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 4 },
  headerSubtitle: { fontSize: 13, color: '#BBDEFB', textAlign: 'center', paddingHorizontal: 24 },

  card: {
    margin: 24,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: '#1A1A2E', marginBottom: 20 },

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
  senhaRow: { flexDirection: 'row', alignItems: 'center' },
  senhaInput: { flex: 1 },
  eyeBtn: { paddingHorizontal: 10, paddingVertical: 12 },
  eyeText: { fontSize: 18 },

  tipoRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  tipoBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#DDD',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  tipoBtnActive: { borderColor: BLUE, backgroundColor: '#E3F2FD' },
  tipoBtnText: { fontSize: 14, fontWeight: '600', color: '#777' },
  tipoBtnTextActive: { color: BLUE },

  loginBtn: {
    marginTop: 24,
    backgroundColor: BLUE,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: BLUE,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 1 },

  footer: { textAlign: 'center', color: '#AAA', fontSize: 12, marginBottom: 24 },
});
