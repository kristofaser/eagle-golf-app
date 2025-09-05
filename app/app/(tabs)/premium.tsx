import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function PremiumScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.simpleHeader}>
          <Text style={styles.headerTitle}>Eagle Premium</Text>
          <Text style={styles.headerSubtitle}>Accédez au contenu exclusif des professionnels</Text>
        </View>
        {/* Section Vidéos de Swing */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="videocam" size={24} color="#2E7D32" />
            <Text style={styles.sectionTitle}>Vidéos de Swing Complètes</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <View style={styles.videoTypes}>
                <View style={styles.videoType}>
                  <Ionicons name="golf" size={20} color="#666" />
                  <Text style={styles.videoTypeText}>Driving</Text>
                </View>
                <View style={styles.videoType}>
                  <Ionicons name="golf" size={20} color="#666" />
                  <Text style={styles.videoTypeText}>Fers</Text>
                </View>
                <View style={styles.videoType}>
                  <Ionicons name="golf" size={20} color="#666" />
                  <Text style={styles.videoTypeText}>Approche</Text>
                </View>
                <View style={styles.videoType}>
                  <Ionicons name="golf" size={20} color="#666" />
                  <Text style={styles.videoTypeText}>Putting</Text>
                </View>
              </View>
              <Text style={styles.cardDescription}>
                Analysez chaque aspect de votre jeu avec des vidéos détaillées de professionnels
              </Text>
            </View>
          </View>
        </View>

        {/* Section In the Bag */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="golf-outline" size={24} color="#2E7D32" />
            <Text style={styles.sectionTitle}>In the Bag du Pro</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>EXCLUSIF</Text>
              </View>
              <Text style={styles.cardDescription}>
                Découvrez le contenu du sac des vainqueurs de tournois et des joueurs du Top 10
              </Text>
              <Text style={styles.cardSubtext}>
                Matériel, réglages, stratégie - tout est révélé en détail
              </Text>
            </View>
          </View>
        </View>

        {/* Section Tips de la semaine */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bulb" size={24} color="#2E7D32" />
            <Text style={styles.sectionTitle}>Tips de la Semaine</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <View style={styles.frequency}>
                <Ionicons name="calendar" size={16} color="#FFA500" />
                <Text style={styles.frequencyText}>Nouveau contenu tous les 10 jours</Text>
              </View>
              <Text style={styles.cardDescription}>
                Vidéos explicatives de situations particulières par des professionnels
              </Text>
              <Text style={styles.cardSubtext}>
                Techniques avancées, gestion du parcours, stratégies mentales
              </Text>
            </View>
          </View>
        </View>

        {/* Section Parcours Vidéo */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flag" size={24} color="#2E7D32" />
            <Text style={styles.sectionTitle}>Parcours Vidéo 3 Trous</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <View style={styles.scoreIntegration}>
                <Ionicons name="stats-chart" size={16} color="#2E7D32" />
                <Text style={styles.scoreText}>Score intégré en temps réel</Text>
              </View>
              <Text style={styles.cardDescription}>
                Suivez le pro trou par trou avec analyse complète de chaque coup
              </Text>
              <Text style={styles.cardSubtext}>
                Stratégie, club selection, lecture du green - vivez l'expérience pro
              </Text>
            </View>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaCard}
          >
            <Text style={styles.ctaIcon}>👑</Text>
            <Text style={styles.ctaTitle}>Devenez Premium</Text>
            <Text style={styles.ctaSubtitle}>
              Rejoignez l'élite du golf et progressez comme jamais
            </Text>
            <TouchableOpacity style={styles.ctaButton} activeOpacity={0.8}>
              <Text style={styles.ctaButtonText}>Bientôt disponible</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  simpleHeader: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  scrollContent: {
    paddingTop: 20,
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardContent: {
    position: 'relative',
  },
  videoTypes: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  videoType: {
    alignItems: 'center',
  },
  videoTypeText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  cardDescription: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 8,
  },
  cardSubtext: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#FF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  frequency: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#FFF3E0',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  frequencyText: {
    fontSize: 12,
    color: '#E65100',
    marginLeft: 6,
    fontWeight: '500',
  },
  scoreIntegration: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#E8F5E9',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scoreText: {
    fontSize: 12,
    color: '#2E7D32',
    marginLeft: 6,
    fontWeight: '500',
  },
  ctaSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  ctaCard: {
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  ctaIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  ctaTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  ctaSubtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 25,
    opacity: 0.95,
    paddingHorizontal: 20,
  },
  ctaButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  ctaButtonText: {
    color: '#FFA500',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
