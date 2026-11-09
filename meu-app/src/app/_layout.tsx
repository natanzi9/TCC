// ============================================================
// _layout.tsx — Raiz do app com AuthProvider e navegação
// ============================================================
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '@/context/AuthContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
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
      </ThemeProvider>
    </AuthProvider>
  );
}
