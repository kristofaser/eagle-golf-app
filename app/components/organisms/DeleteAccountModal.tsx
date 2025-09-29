import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { UniversalAlert } from '@/utils/alert';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Text, Button } from '@/components/atoms';
import { Colors, Spacing } from '@/constants/theme';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
}

export function DeleteAccountModal({ visible, onClose }: DeleteAccountModalProps) {
  const router = useRouter();
  const { deleteAccount } = useAuth();
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    // Réinitialiser l'état
    setIsConfirmed(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!isConfirmed) return;

    UniversalAlert.show(
      'Dernière confirmation',
      'Êtes-vous absolument certain de vouloir supprimer votre compte ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await deleteAccount();
              handleClose();
              // Reset complet du stack de navigation et redirection vers la racine
              // Cela permet à l'app de gérer automatiquement la redirection vers login
              router.dismissAll();
              router.replace('/');
            } catch (error) {
              UniversalAlert.error('Erreur', 'Une erreur est survenue lors de la suppression du compte');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
      { forceNative: true } // Force l'utilisation de window.confirm sur web pour éviter les modals imbriquées
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Icône d'avertissement */}
            <View style={styles.iconContainer}>
              <Ionicons name="warning-outline" size={60} color={Colors.semantic.error.default} />
            </View>

            {/* Titre */}
            <Text variant="h3" color="charcoal" style={styles.title}>
              Supprimer votre compte
            </Text>

            {/* Description */}
            <Text variant="body" color="gray" style={styles.description}>
              Cette action est irréversible. Toutes vos données seront définitivement supprimées.
            </Text>

            {/* Liste des éléments qui seront supprimés */}
            <View style={styles.warningBox}>
              <Text variant="caption" color="error" style={styles.warningTitle}>
                Ce qui sera supprimé :
              </Text>
              <Text variant="caption" color="gray" style={styles.warningItem}>
                • Votre profil et informations personnelles
              </Text>
              <Text variant="caption" color="gray" style={styles.warningItem}>
                • Vos parcours et statistiques
              </Text>
              <Text variant="caption" color="gray" style={styles.warningItem}>
                • Vos disponibilités et réservations
              </Text>
              <Text variant="caption" color="gray" style={styles.warningItem}>
                • Tous vos avis et commentaires
              </Text>
            </View>

            {/* Toggle de confirmation */}
            <View style={styles.confirmContainer}>
              <Switch
                value={isConfirmed}
                onValueChange={setIsConfirmed}
                trackColor={{ false: Colors.neutral.lightGray, true: Colors.semantic.error.default }}
                thumbColor={Colors.neutral.white}
              />
              <Text
                variant="body"
                color={isConfirmed ? 'error' : 'gray'}
                style={styles.confirmText}
              >
                Je confirme vouloir supprimer mon compte
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <Button
                onPress={handleClose}
                variant="secondary"
                size="medium"
                style={styles.button}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Pressable
                onPress={handleDelete}
                style={({ pressed }) => [
                  styles.button,
                  styles.deleteButton,
                  !isConfirmed && styles.deleteButtonDisabled,
                  pressed && isConfirmed && { opacity: 0.7 }
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.neutral.white} size="small" />
                ) : (
                  <Text variant="body" style={styles.deleteButtonText}>
                    Supprimer
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: Colors.neutral.white,
    borderRadius: 16,
    zIndex: 1000, // Assure que la modal est au-dessus du backdrop
  },
  modalContent: {
    padding: Spacing.l,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.m,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.m,
  },
  description: {
    textAlign: 'center',
    marginBottom: Spacing.l,
    lineHeight: 22,
  },
  warningBox: {
    backgroundColor: Colors.semantic.error.default + '10',
    borderRadius: 8,
    padding: Spacing.m,
    marginBottom: Spacing.l,
  },
  warningTitle: {
    fontWeight: '600',
    marginBottom: Spacing.s,
  },
  warningItem: {
    marginBottom: Spacing.xs,
    lineHeight: 18,
  },
  confirmContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.lightGray + '30',
    padding: Spacing.m,
    borderRadius: 8,
    marginBottom: Spacing.l,
  },
  confirmText: {
    marginLeft: Spacing.m,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.m,
  },
  button: {
    flex: 1,
  },
  deleteButton: {
    backgroundColor: Colors.semantic.error.default,
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.s,
    minHeight: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001, // Assure que le bouton est cliquable
  },
  deleteButtonDisabled: {
    backgroundColor: Colors.neutral.lightGray,
    opacity: 0.6,
  },
  deleteButtonText: {
    color: Colors.neutral.white,
    fontWeight: '600',
    fontSize: 16,
  },
});
