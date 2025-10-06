import React from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground, TouchableOpacity, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Elevation } from '@/constants/theme';

export default function ContestDrivingScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: '',
          presentation: 'card',
          animation: 'default',
          gestureEnabled: true,
          headerLeft: Platform.OS === 'ios' ? () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ paddingLeft: 10 }}
            >
              <Ionicons name="chevron-back" size={28} color={Colors.neutral.white} />
            </TouchableOpacity>
          ) : () => null, // Sur Android, pas de bouton retour visible
        }}
      />

      <View style={styles.container}>
        {/* Image Hero avec overlay */}
        <View style={styles.heroContainer}>
          <ImageBackground
            source={require('@/assets/images/balle2golf.jpeg')}
            style={styles.heroImage}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.6)']}
              style={styles.heroOverlay}
            >
              <Text style={styles.heroTitle}>
                Concours de{'\n'}Driving/Précision
              </Text>
              <Text style={styles.heroDescription}>
                Les meilleurs scores de nos membres
              </Text>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* Contenu scrollable */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: Spacing.l }}
        >
          {/* Titre section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Classement</Text>
          </View>

          {/* Tableau unique avec 2 colonnes */}
          <View style={styles.tableContainer}>
            {/* Colonne Driving */}
            <View style={styles.column}>
              <Text style={styles.columnTitle}>Driving</Text>
              <View style={styles.winner}>
                <Text style={styles.name}>Gilbert</Text>
                <Text style={styles.score}>235m</Text>
              </View>
              <View style={styles.winner}>
                <Text style={styles.name}>Guillaume</Text>
                <Text style={styles.score}>226m</Text>
              </View>
              <View style={styles.winner}>
                <Text style={styles.name}>Thomas</Text>
                <Text style={styles.score}>200m</Text>
              </View>
            </View>

            {/* Colonne Précision */}
            <View style={styles.column}>
              <Text style={styles.columnTitle}>Précision</Text>
              <View style={styles.winner}>
                <Text style={styles.name}>Jean</Text>
                <Text style={styles.score}>3,53m</Text>
              </View>
              <View style={styles.winner}>
                <Text style={styles.name}>Claude</Text>
                <Text style={styles.score}>6,50m</Text>
              </View>
              <View style={styles.winner}>
                <Text style={styles.name}>Philippe</Text>
                <Text style={styles.score}>10,50m</Text>
              </View>
            </View>
          </View>

          {/* Informations complémentaires */}
          <View style={styles.section}>
            <Text style={styles.info}>
              Réservez une partie avec un pro pour participer au classement
            </Text>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  heroContainer: {
    height: 280,
    width: '100%',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.l,
  },
  heroTitle: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.white,
    textAlign: 'center',
    marginBottom: Spacing.m,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    lineHeight: Typography.lineHeight.h2,
  },
  heroDescription: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.neutral.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  section: {
    marginBottom: Spacing.l,
    paddingHorizontal: Spacing.l,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.charcoal,
    marginBottom: Spacing.m,
  },
  tableContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.m,
    paddingVertical: 0,
    gap: Spacing.s,
  },
  column: {
    flex: 1,
    backgroundColor: Colors.neutral.cloud,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.neutral.mist,
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
  },
  columnTitle: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.small,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.charcoal,
    marginBottom: Spacing.xxs,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  winner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  name: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.electric,
  },
  score: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.charcoal,
  },
  info: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.iron,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.s,
  },
});