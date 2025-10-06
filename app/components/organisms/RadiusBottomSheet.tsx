import React, { forwardRef, useCallback } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/atoms';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { RadiusOption } from '@/stores/useLocationPreferences';

interface RadiusBottomSheetProps {
  selectedRadius: RadiusOption;
  onSelectRadius: (radius: RadiusOption) => void;
}

const RADIUS_OPTIONS: { value: RadiusOption; label: string }[] = [
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' },
  { value: 50, label: '50 km' },
  { value: 100, label: '100 km' },
  { value: 200, label: '200 km' },
  { value: 300, label: '300 km' },
];

export const RadiusBottomSheet = forwardRef<BottomSheetModal, RadiusBottomSheetProps>(
  function RadiusBottomSheet({ selectedRadius, onSelectRadius }, ref) {
    const snapPoints = ['70%'];
    const insets = useSafeAreaInsets();

    const handleSelect = useCallback(
      (radius: RadiusOption) => {
        onSelectRadius(radius);
        // Fermer automatiquement après la sélection
        setTimeout(() => {
          if (ref && typeof ref !== 'function' && ref.current) {
            ref.current.dismiss();
          }
        }, 200);
      },
      [onSelectRadius, ref]
    );

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
          pressBehavior="close"
          style={[
            props.style,
            {
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            },
          ]}
        />
      ),
      []
    );

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        enablePanDownToClose={true}
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.background}
        bottomInset={0}
      >
        <BottomSheetView style={styles.container}>
          <View style={styles.header}>
            <Text variant="h3" color="charcoal" style={styles.title}>
              Rayon de recherche
            </Text>
            <Text variant="body" color="course" style={styles.subtitle}>
              Sélectionnez la distance maximale
            </Text>
          </View>

          <View style={styles.optionsContainer}>
            {RADIUS_OPTIONS.map((option) => {
              const isSelected = option.value === selectedRadius;
              return (
                <Pressable
                  key={option.value ?? 'unlimited'}
                  style={({ pressed }) => [
                    styles.optionButton,
                    isSelected && styles.optionButtonSelected,
                    pressed && styles.optionButtonPressed,
                  ]}
                  onPress={() => handleSelect(option.value)}
                >
                  <View style={[styles.radio, isSelected && styles.radioSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                  <Text
                    variant="body"
                    color={isSelected ? 'accent' : 'charcoal'}
                    weight={isSelected ? 'semiBold' : 'regular'}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  handleIndicator: {
    backgroundColor: Colors.neutral.course,
    width: 40,
  },
  background: {
    backgroundColor: Colors.neutral.white,
  },
  container: {
    paddingTop: Spacing.m,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xl : Spacing.l,
    paddingHorizontal: Spacing.m,
  },
  header: {
    marginBottom: Spacing.l,
    alignItems: 'center',
  },
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
  },
  optionsContainer: {
    gap: Spacing.s,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.m,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.neutral.cream,
  },
  optionButtonSelected: {
    backgroundColor: Colors.primary.light,
  },
  optionButtonPressed: {
    opacity: 0.7,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.neutral.course,
    marginRight: Spacing.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: Colors.primary.accent,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary.accent,
  },
});
