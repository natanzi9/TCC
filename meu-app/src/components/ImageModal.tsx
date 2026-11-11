import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SenaiColors } from '@/constants/theme';
import { getItemImageUrl } from '@/services/api';

interface ImageModalProps {
  visible: boolean;
  onClose: () => void;
  imageName?: string | null;
  itemName?: string;
}

export function ImageModal({ visible, onClose, imageName, itemName }: ImageModalProps) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const imageUrl = imageName ? getItemImageUrl(imageName) : null;

  React.useEffect(() => {
    if (visible) {
      setLoading(true);
      setError(false);
    }
  }, [visible, imageName]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {itemName ?? 'Imagem do Item'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.imageContainer}>
            {imageUrl && !error ? (
              <>
                {loading && (
                  <View style={styles.loader}>
                    <ActivityIndicator size="large" color={SenaiColors.orange} />
                  </View>
                )}
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.image}
                  resizeMode="contain"
                  onLoadEnd={() => setLoading(false)}
                  onError={() => {
                    setLoading(false);
                    setError(true);
                  }}
                />
              </>
            ) : (
              <View style={styles.noImageBox}>
                <Text style={styles.noImageIcon}>📷</Text>
                <Text style={styles.noImageText}>
                  {imageName ? `Arquivo: ${imageName}\n(Imagem não encontrada no servidor)` : 'Item sem foto cadastrada'}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>FECHAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 420,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: SenaiColors.text,
    flex: 1,
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize: 20,
    color: '#888888',
    fontWeight: 'bold',
  },
  imageContainer: {
    width: '100%',
    height: 260,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  noImageBox: {
    alignItems: 'center',
    padding: 20,
  },
  noImageIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  noImageText: {
    color: '#718096',
    textAlign: 'center',
    fontSize: 14,
  },
  button: {
    marginTop: 18,
    backgroundColor: SenaiColors.orange,
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: SenaiColors.darkBlue,
    fontSize: 16,
    fontWeight: '800',
  },
});
