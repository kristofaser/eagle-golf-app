/**
 * BookingStepIndicator - Indicateur de progression des étapes de réservation
 *
 * ✅ EXTRAIT du BookingScreen pour améliorer la modularité
 */
import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { Text } from '@/components/atoms';

export type Step = 1 | 2 | 3 | 4 | 5;

interface StepConfig {
  id: Step;
  title: string;
  icon: string;
}

interface BookingStepIndicatorProps {
  currentStep: Step;
  steps: StepConfig[];
  showTitle?: boolean;
}

export const BookingStepIndicator = memo(function BookingStepIndicator({
  currentStep,
  steps,
  showTitle = false,
}: BookingStepIndicatorProps) {
  const currentStepInfo = steps.find((step) => step.id === currentStep);

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressSteps}>
        {steps.map((step, index) => (
          <View key={step.id} style={styles.stepContainer}>
            <View style={styles.stepWrapper}>
              <View
                style={[
                  styles.stepCircle,
                  currentStep >= step.id && styles.stepCircleActive,
                  currentStep === step.id && styles.stepCircleCurrent,
                ]}
              >
                {currentStep > step.id ? (
                  <Ionicons name="checkmark" size={16} color={Colors.neutral.white} />
                ) : (
                  <Text
                    variant="caption"
                    weight="semiBold"
                    color={currentStep >= step.id ? 'white' : 'iron'}
                  >
                    {step.id}
                  </Text>
                )}
              </View>
            </View>
            {index < steps.length - 1 && (
              <View style={[styles.stepLine, currentStep > step.id && styles.stepLineActive]} />
            )}
          </View>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  progressContainer: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
    backgroundColor: Colors.neutral.white,
  },
  progressSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.neutral.cloud,
    borderWidth: 2,
    borderColor: Colors.neutral.mist,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepCircleActive: {
    backgroundColor: Colors.primary.accent,
    borderColor: Colors.primary.accent,
  },
  stepCircleCurrent: {
    borderColor: Colors.primary.navy,
    borderWidth: 3,
  },
  stepTitle: {
    textAlign: 'center',
    marginHorizontal: 2,
    fontSize: 11,
  },
  stepLine: {
    height: 2,
    backgroundColor: Colors.neutral.mist,
    flex: 0.2,
    marginHorizontal: 2,
    marginBottom: 24,
  },
  stepLineActive: {
    backgroundColor: Colors.primary.accent,
  },
});
