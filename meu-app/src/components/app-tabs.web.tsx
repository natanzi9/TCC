// app-tabs.web.tsx — Versão web dos tabs para o SGA SENAI
// Este componente não é utilizado no app mobile (Expo Go), mas precisa compilar sem erros.
// Foi simplificado para remover referências às rotas removidas.

import { Tabs, TabList, TabTrigger, TabSlot } from 'expo-router/ui';
import { View, StyleSheet } from 'react-native';

import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <View style={styles.tabListContainer}>
          <TabTrigger name="index" href="/" />
        </View>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    maxWidth: MaxContentWidth,
  },
});
