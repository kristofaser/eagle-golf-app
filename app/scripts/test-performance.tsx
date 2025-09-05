import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';

/**
 * Composant de test pour visualiser les améliorations de performance
 * À intégrer temporairement dans l'app pour tester
 */
export function PerformanceTestPanel() {
  const [metrics, setMetrics] = useState({
    cacheHits: 0,
    cacheMisses: 0,
    apiCalls: 0,
    averageLoadTime: 0,
    lastLoadTime: 0,
    prefetchedProfiles: new Set<string>(),
  });

  // Observer les requêtes React Query
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Intercepter les fetch pour compter les appels API
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const startTime = Date.now();

        // Compter l'appel API
        setMetrics((prev) => ({
          ...prev,
          apiCalls: prev.apiCalls + 1,
        }));

        const result = await originalFetch(...args);

        const loadTime = Date.now() - startTime;
        setMetrics((prev) => ({
          ...prev,
          lastLoadTime: loadTime,
          averageLoadTime: (prev.averageLoadTime * prev.apiCalls + loadTime) / (prev.apiCalls + 1),
        }));

        return result;
      };

      // Cleanup
      return () => {
        window.fetch = originalFetch;
      };
    }
  }, []);

  const resetMetrics = () => {
    setMetrics({
      cacheHits: 0,
      cacheMisses: 0,
      apiCalls: 0,
      averageLoadTime: 0,
      lastLoadTime: 0,
      prefetchedProfiles: new Set(),
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Performance Monitor</Text>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{metrics.apiCalls}</Text>
          <Text style={styles.metricLabel}>API Calls</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>
            {metrics.cacheHits > 0
              ? `${Math.round((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100)}%`
              : '0%'}
          </Text>
          <Text style={styles.metricLabel}>Cache Hit Rate</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{Math.round(metrics.averageLoadTime)}ms</Text>
          <Text style={styles.metricLabel}>Avg Load Time</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{metrics.prefetchedProfiles.size}</Text>
          <Text style={styles.metricLabel}>Prefetched</Text>
        </View>
      </View>

      <View style={styles.lastLoad}>
        <Text style={styles.lastLoadText}>Last Load: {metrics.lastLoadTime}ms</Text>
      </View>

      <TouchableOpacity style={styles.resetButton} onPress={resetMetrics}>
        <Text style={styles.resetButtonText}>Reset Metrics</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: Spacing.m,
    borderRadius: 10,
    width: 200,
    zIndex: 9999,
  },
  title: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: Spacing.s,
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  metricCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: Spacing.xs,
    borderRadius: 5,
    width: '48%',
    alignItems: 'center',
  },
  metricValue: {
    color: Colors.primary.accent,
    fontSize: 18,
    fontWeight: 'bold',
  },
  metricLabel: {
    color: 'white',
    fontSize: 10,
    marginTop: 2,
  },
  lastLoad: {
    marginTop: Spacing.s,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  lastLoadText: {
    color: 'white',
    fontSize: 11,
    textAlign: 'center',
  },
  resetButton: {
    backgroundColor: Colors.primary.accent,
    padding: Spacing.xs,
    borderRadius: 5,
    marginTop: Spacing.s,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
});
