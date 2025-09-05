import React, { useCallback, useRef } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Colors, BorderRadius, Elevation, Spacing } from '@/constants/theme';
import { Text, Icon } from '@/components/atoms';

const SEARCH_BAR_HEIGHT = 48;

interface SearchBarProps {
  isCardSelected?: boolean;
  onSearchPress?: (layout: { width: number; height: number; x: number; y: number }) => void;
}

export const SearchBar = ({ isCardSelected = false, onSearchPress }: SearchBarProps) => {
  const containerRef = useRef<View>(null);

  const handleSearchPress = useCallback(() => {
    if (containerRef.current && onSearchPress) {
      containerRef.current.measure((x, y, width, height, pageX, pageY) => {
        onSearchPress({
          width,
          height,
          x: pageX,
          y: pageY,
        });
      });
    }
  }, [onSearchPress]);

  return (
    <View style={styles.rootContainer}>
      <View ref={containerRef} style={styles.container}>
        <Pressable
          onPress={handleSearchPress}
          style={styles.pressableOverlay}
          disabled={isCardSelected}
        >
          <View style={styles.contentWrapper}>
            <Icon name="search" size={20} color={Colors.neutral.course} family="FontAwesome" />
            <Text variant="body" color="course" style={styles.placeholderText}>
              Rechercher un parcours ou un joueur...
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    height: SEARCH_BAR_HEIGHT + Spacing.m,
    marginHorizontal: Spacing.m,
    marginTop: Spacing.m,
  },
  container: {
    height: SEARCH_BAR_HEIGHT,
    backgroundColor: Colors.neutral.ball,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    ...Elevation.small,
  },
  pressableOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.l,
    height: '100%',
    gap: Spacing.s,
  },
  placeholderText: {
    flex: 1,
  },
});
