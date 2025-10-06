import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { usePremium } from '@/hooks/usePremium';
import { useWeeklyTips } from '@/hooks/usePremiumContent';
import { SKILL_ACCESS_RULES, SkillType } from '@/types/premium';

const SKILLS: SkillType[] = ['driving', 'irons', 'wedging', 'chipping', 'putting', 'mental'];

export default function TestPremiumScreen() {
  const insets = useSafeAreaInsets();
  const { isPremium, subscription, loading, error, refresh, canAccessSkill } = usePremium();
  const { tips, loading: tipsLoading, refresh: refreshTips } = useWeeklyTips();

  const [skillAccess, setSkillAccess] = useState<Record<string, boolean | null>>({});
  const [testingSkills, setTestingSkills] = useState(false);

  const testAllSkills = async () => {
    setTestingSkills(true);
    const results: Record<string, boolean | null> = {};

    for (const skill of SKILLS) {
      const access = await canAccessSkill(skill);
      results[skill] = access;
    }

    setSkillAccess(results);
    setTestingSkills(false);
  };

  const handleRefresh = () => {
    refresh();
    refreshTips();
  };

  const getAccessIcon = (access: boolean | null) => {
    if (access === null) return '❓';
    return access ? '✅' : '🔒';
  };

  const getAccessColor = (access: boolean | null) => {
    if (access === null) return '#999';
    return access ? '#4CAF50' : '#F44336';
  };

  const getRuleColor = (rule: string) => {
    switch (rule) {
      case 'free':
        return '#4CAF50'; // Vert - gratuit
      case 'premium':
        return '#FF9800'; // Orange - premium requis
      case 'no_content':
        return '#9E9E9E'; // Gris - pas de contenu disponible
      default:
        return '#999';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🧪 Test Premium Services</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefresh} />}
      >
        {/* Section Premium Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Statut Premium</Text>
          <View style={styles.card}>
            {loading ? (
              <ActivityIndicator size="small" color="#2E7D32" />
            ) : error ? (
              <Text style={styles.errorText}>Erreur: {error.message}</Text>
            ) : (
              <>
                <View style={styles.statusRow}>
                  <Text style={styles.label}>Est Premium:</Text>
                  <Text style={[styles.value, { color: isPremium ? '#4CAF50' : '#F44336' }]}>
                    {isPremium ? '✅ OUI' : '❌ NON'}
                  </Text>
                </View>

                {subscription && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.statusRow}>
                      <Text style={styles.label}>Source:</Text>
                      <Text style={styles.value}>{subscription.source}</Text>
                    </View>
                    <View style={styles.statusRow}>
                      <Text style={styles.label}>Statut:</Text>
                      <Text style={styles.value}>{subscription.status}</Text>
                    </View>
                    {subscription.platform && (
                      <View style={styles.statusRow}>
                        <Text style={styles.label}>Plateforme:</Text>
                        <Text style={styles.value}>{subscription.platform}</Text>
                      </View>
                    )}
                    <View style={styles.statusRow}>
                      <Text style={styles.label}>Auto-renew:</Text>
                      <Text style={styles.value}>{subscription.auto_renew ? 'Oui' : 'Non'}</Text>
                    </View>
                    <View style={styles.statusRow}>
                      <Text style={styles.label}>Achat:</Text>
                      <Text style={styles.value}>
                        {new Date(subscription.purchase_date).toLocaleDateString('fr-FR')}
                      </Text>
                    </View>
                    {subscription.expires_date && (
                      <View style={styles.statusRow}>
                        <Text style={styles.label}>Expiration:</Text>
                        <Text style={styles.value}>
                          {new Date(subscription.expires_date).toLocaleDateString('fr-FR')}
                        </Text>
                      </View>
                    )}
                  </>
                )}

                {!subscription && !isPremium && (
                  <>
                    <View style={styles.divider} />
                    <Text style={styles.infoText}>
                      Aucun abonnement actif. Les pros ont automatiquement premium gratuitement.
                    </Text>
                  </>
                )}
              </>
            )}
          </View>
        </View>

        {/* Section Skill Access */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Accès aux Skills</Text>

          <TouchableOpacity
            style={styles.testButton}
            onPress={testAllSkills}
            disabled={testingSkills}
          >
            {testingSkills ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.testButtonText}>Tester tous les skills</Text>
            )}
          </TouchableOpacity>

          {SKILLS.map((skill) => {
            const rule = SKILL_ACCESS_RULES[skill];
            const access = skillAccess[skill];

            return (
              <View key={skill} style={styles.skillCard}>
                <View style={styles.skillHeader}>
                  <Text style={styles.skillName}>{skill.toUpperCase()}</Text>
                  <View style={[styles.ruleBadge, { backgroundColor: getRuleColor(rule) }]}>
                    <Text style={styles.ruleBadgeText}>{rule}</Text>
                  </View>
                </View>

                <View style={styles.skillFooter}>
                  <Text style={styles.skillAccessLabel}>Accès:</Text>
                  {access !== undefined && access !== null && (
                    <Text style={[styles.skillAccessValue, { color: getAccessColor(access) }]}>
                      {getAccessIcon(access)} {access ? 'Autorisé' : 'Bloqué'}
                    </Text>
                  )}
                  {access === undefined && (
                    <Text style={styles.skillAccessValue}>❓ Non testé</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Section Weekly Tips */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>💡 Tips de la Semaine</Text>
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>🔒 PREMIUM</Text>
            </View>
          </View>
          <View style={styles.card}>
            {tipsLoading ? (
              <ActivityIndicator size="small" color="#2E7D32" />
            ) : tips.length === 0 ? (
              <Text style={styles.infoText}>Aucun tip disponible</Text>
            ) : (
              <>
                <Text style={styles.tipsCount}>
                  {tips.length} tip{tips.length > 1 ? 's' : ''} actif{tips.length > 1 ? 's' : ''}
                </Text>
                <View style={styles.divider} />
                {tips.map((tip, index) => (
                  <View key={tip.id} style={styles.tipItem}>
                    <Text style={styles.tipTitle}>
                      {index + 1}. {tip.title}
                    </Text>
                    <Text style={styles.tipAuthor}>Par: {tip.author_name}</Text>
                    <Text style={styles.tipViews}>👁️ {tip.view_count} vues</Text>
                    <Text style={styles.tipDate}>
                      Publié: {new Date(tip.published_at).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </View>
        </View>

        {/* Section Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ Informations</Text>
          <View style={styles.card}>
            <Text style={styles.infoText}>
              Cet écran de test permet de vérifier le bon fonctionnement des services premium.
            </Text>
            <View style={styles.divider} />
            <Text style={styles.infoItem}>• Cache: 5 minutes TTL</Text>
            <Text style={styles.infoItem}>• Realtime: Écoute active sur subscriptions</Text>
            <Text style={styles.infoItem}>• RPC: is_user_premium()</Text>
          </View>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 15,
    color: '#333',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  testButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skillCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  skillName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  ruleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ruleBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  skillFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skillAccessLabel: {
    fontSize: 14,
    color: '#666',
  },
  skillAccessValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  tipsCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  tipItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  tipAuthor: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  tipViews: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  tipDate: {
    fontSize: 12,
    color: '#999',
  },
  infoItem: {
    fontSize: 14,
    color: '#666',
    marginVertical: 4,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  premiumBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  premiumBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
