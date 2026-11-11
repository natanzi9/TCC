// ============================================================
// _layout.jsx — Raiz do app com AuthProvider e navegação
// ============================================================
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '@/context/AuthContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: '#045cac' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="home" options={{ headerShown: false }} />
        <Stack.Screen name="estoque" options={{ headerShown: false }} />
        <Stack.Screen name="saidas" options={{ headerShown: false }} />
        <Stack.Screen name="adicionar-item" options={{ headerShown: false }} />
        <Stack.Screen name="registrar-saida" options={{ headerShown: false }} />
        <Stack.Screen name="usuarios" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}
