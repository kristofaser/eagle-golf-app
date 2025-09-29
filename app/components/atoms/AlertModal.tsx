import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { Text } from './Text';
import { Button } from './Button';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export interface AlertModalButton {
  text?: string;
  onPress?: () => void | Promise<void>;
  style?: 'default' | 'cancel' | 'destructive';
  isPreferred?: boolean;
}

interface AlertModalProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertModalButton[];
  onDismiss?: () => void;
  cancelable?: boolean;
  type?: 'info' | 'success' | 'error' | 'warning';
}

const { width: screenWidth } = Dimensions.get('window');

export const AlertModal: React.FC<AlertModalProps> = ({
  visible,
  title,
  message,
  buttons = [{ text: 'OK', style: 'default' }],
  onDismiss,
  cancelable = true,
  type = 'info',
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getIconForType = () => {
    switch (type) {
      case 'success':
        return { name: 'checkmark-circle', color: Colors.semantic.success };
      case 'error':
        return { name: 'alert-circle', color: Colors.semantic.error };
      case 'warning':
        return { name: 'warning', color: Colors.semantic.warning };
      case 'info':
      default:
        return { name: 'information-circle', color: Colors.primary.accent };
    }
  };

  const handleBackdropPress = () => {
    if (cancelable && onDismiss) {
      onDismiss();
    }
  };

  const handleButtonPress = async (button: AlertModalButton) => {
    if (button.onPress) {
      await button.onPress();
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  const renderButton = (button: AlertModalButton, index: number) => {
    const isDestructive = button.style === 'destructive';
    const isCancel = button.style === 'cancel';
    const isPreferred = button.isPreferred;

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.button,
          isCancel && styles.cancelButton,
          isDestructive && styles.destructiveButton,
          isPreferred && styles.preferredButton,
          buttons.length > 2 && styles.stackedButton,
        ]}
        onPress={() => handleButtonPress(button)}
        activeOpacity={0.8}
      >
        <Text
          variant="button"
          style={[
            styles.buttonText,
            isCancel && styles.cancelButtonText,
            isDestructive && styles.destructiveButtonText,
            isPreferred && styles.preferredButtonText,
          ]}
        >
          {button.text || 'OK'}
        </Text>
      </TouchableOpacity>
    );
  };

  // Sur mobile natif, utiliser le Modal de React Native
  if (Platform.OS !== 'web') {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onDismiss}
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <View style={styles.backdrop}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.modalContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
              >
                <View style={styles.modalContent}>
                  {/* Icon */}
                  {type && (
                    <View style={styles.iconContainer}>
                      <Ionicons
                        name={getIconForType().name as any}
                        size={48}
                        color={getIconForType().color}
                      />
                    </View>
                  )}

                  {/* Title */}
                  <Text variant="h3" style={styles.title}>
                    {title}
                  </Text>

                  {/* Message */}
                  {message && (
                    <Text variant="body" style={styles.message}>
                      {message}
                    </Text>
                  )}

                  {/* Buttons */}
                  <View
                    style={[
                      styles.buttonContainer,
                      buttons.length > 2 && styles.stackedButtonContainer,
                    ]}
                  >
                    {buttons.map(renderButton)}
                  </View>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  }

  // Sur web, utiliser un div portal
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={handleBackdropPress}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: 16,
          padding: 24,
          maxWidth: 400,
          width: '90%',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          animation: 'slideUp 0.3s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        {type && (
          <View style={styles.iconContainer}>
            <Ionicons
              name={getIconForType().name as any}
              size={48}
              color={getIconForType().color}
            />
          </View>
        )}

        {/* Title */}
        <Text variant="h3" style={styles.title}>
          {title}
        </Text>

        {/* Message */}
        {message && (
          <Text variant="body" style={styles.message}>
            {message}
          </Text>
        )}

        {/* Buttons */}
        <View
          style={[
            styles.buttonContainer,
            buttons.length > 2 && styles.stackedButtonContainer,
          ]}
        >
          {buttons.map(renderButton)}
        </View>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            transform: translateY(20px) scale(0.95);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxWidth: Math.min(screenWidth * 0.9, 400),
    width: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalContent: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: Spacing.m,
  },
  title: {
    textAlign: 'center',
    color: Colors.neutral.charcoal,
    marginBottom: Spacing.s,
    fontWeight: '600',
  },
  message: {
    textAlign: 'center',
    color: Colors.neutral.gray,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: Spacing.m,
  },
  stackedButtonContainer: {
    flexDirection: 'column',
    gap: Spacing.s,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.l,
    borderRadius: BorderRadius.m,
    backgroundColor: Colors.neutral.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  stackedButton: {
    flex: undefined,
    width: '100%',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.neutral.lightGray,
  },
  destructiveButton: {
    backgroundColor: Colors.semantic.error,
  },
  preferredButton: {
    backgroundColor: Colors.primary.accent,
  },
  buttonText: {
    fontSize: Typography.fontSize.button,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.neutral.charcoal,
  },
  cancelButtonText: {
    color: Colors.neutral.gray,
  },
  destructiveButtonText: {
    color: Colors.neutral.white,
  },
  preferredButtonText: {
    color: Colors.neutral.white,
  },
});