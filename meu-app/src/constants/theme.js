import '@/global.css';
import { Platform } from 'react-native';

// Cores Oficiais da Identidade Visual SGA SENAI / FIEP
export const SenaiColors = {
  primary: '#045cac',        // Azul Royal FIEP / SENAI
  secondary: '#135E9F',      // Azul secundário / Títulos
  orange: '#F28B0C',         // Laranja de destaque / Botões principais
  darkBlue: '#1F3473',       // Azul escuro para texto dos botões laranja
  background: '#F4F7FB',     // Fundo suave para contraste com os cartões
  pageBg: '#045cac',         // Fundo azul das telas web
  surface: '#FFFFFF',        // Branco dos cartões arredondados (.quadrado)
  text: '#1F3473',           // Títulos e cabeçalhos
  textDark: '#2C3E50',       // Texto de leitura
  textMuted: '#718096',      // Texto secundário / labels
  textLight: '#FFFFFF',      // Branco
  border: '#E2E8F0',         // Borda padrão
  inputBorder: '#CBD5E1',    // Borda de campos
  inputFocus: '#F28B0C',     // Foco nos campos (brilho laranja da web)
  danger: '#E53E3E',         // Alerta / baixo estoque
  dangerBg: '#FFF5F5',
  success: '#38A169',        // Confirmação / status OK
  successBg: '#F0FFF4',
  warning: '#DD6B20',
  cardRadius: 20,            // border-radius 20px idêntico à classe .quadrado
  btnRadius: 8,              // cantos arredondados dos botões
};

export const Colors = {
  light: {
    text: '#1F3473',
    background: '#ffffff',
    backgroundElement: '#F4F7FB',
    backgroundSelected: '#E2E8F0',
    textSecondary: '#718096',
    primary: SenaiColors.primary,
    accent: SenaiColors.orange,
  },
  dark: {
    text: '#ffffff',
    background: '#045cac',
    backgroundElement: '#135E9F',
    backgroundSelected: '#1F3473',
    textSecondary: '#CBD5E1',
    primary: SenaiColors.primary,
    accent: SenaiColors.orange,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'Trebuchet MS, Arial, sans-serif',
    serif: 'serif',
    rounded: 'sans-serif',
    mono: 'monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
};

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
