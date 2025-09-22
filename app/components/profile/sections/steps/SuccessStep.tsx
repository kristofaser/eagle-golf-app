import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SuccessStepProps {
  proName: string;
  courseName: string;
  bookingData: {
    players: number;
    holes: number;
    date: Date | null;
    timeSlot: string | null;
    totalPrice: number;
  };
}

export const SuccessStep: React.FC<SuccessStepProps> = ({
  proName,
  courseName,
  bookingData,
}) => {
  // Animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Animation d'entrée
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Récupérer le créneau formaté (simulé pour l'instant)
  const getFormattedTimeSlot = () => {
    return bookingData.timeSlot || '08:00 - 12:00';
  };

  return (
    <View style={styles.container}>
      {/* Icône animée de succès */}
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        <View style={styles.successCircle}>
          <Ionicons name="checkmark" size={60} color={Colors.neutral.white} />
        </View>
      </Animated.View>

      {/* Message de succès */}
      <Animated.View
        style={[
          styles.messageContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.successTitle}>Félicitations !</Text>
        <Text style={styles.successMessage}>
          Votre réservation est en cours de traitement
        </Text>
      </Animated.View>

      {/* Détails de la réservation */}
      <Animated.View
        style={[
          styles.detailsContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>Récapitulatif de votre réservation</Text>

          <View style={styles.detailRow}>
            <Ionicons name="person" size={18} color={Colors.primary.electric} />
            <Text style={styles.detailText}>
              {proName}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="golf" size={18} color={Colors.primary.electric} />
            <Text style={styles.detailText}>
              {courseName}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={18} color={Colors.primary.electric} />
            <Text style={styles.detailText}>
              {bookingData.date ? format(bookingData.date, 'd MMMM yyyy', { locale: fr }) : '-'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time" size={18} color={Colors.primary.electric} />
            <Text style={styles.detailText}>
              {getFormattedTimeSlot()}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="people" size={18} color={Colors.primary.electric} />
            <Text style={styles.detailText}>
              {bookingData.players} {bookingData.players === 1 ? 'joueur' : 'joueurs'} • {bookingData.holes} trous
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Montant total payé</Text>
            <Text style={styles.priceValue}>{bookingData.totalPrice}€</Text>
          </View>
        </View>
      </Animated.View>

      {/* Information importante */}
      <Animated.View
        style={[
          styles.infoCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Ionicons name="information-circle" size={20} color={Colors.primary.electric} />
        <View style={styles.infoTextContainer}>
          <Text style={styles.infoTitle}>Prochaines étapes</Text>
          <Text style={styles.infoText}>
            Eagle va contacter le golf pour valider votre réservation.
            Vous recevrez une confirmation définitive sous 24h.
          </Text>
        </View>
      </Animated.View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary.electric,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary.electric,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.neutral.charcoal,
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 15,
    color: Colors.neutral.slate,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  detailsContainer: {
    width: '100%',
    marginBottom: 16,
  },
  detailCard: {
    backgroundColor: Colors.neutral.snow,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
  },
  detailTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.slate,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  detailText: {
    fontSize: 14,
    color: Colors.neutral.charcoal,
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.pearl,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.slate,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary.navy,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primary.lightBlue,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    marginBottom: 20,
    gap: 10,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary.navy,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: Colors.primary.navy,
    lineHeight: 18,
  },
});