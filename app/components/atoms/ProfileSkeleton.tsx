import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function ProfileSkeleton() {
  const shimmerValue = useSharedValue(0);

  useEffect(() => {
    shimmerValue.value = withRepeat(withTiming(1, { duration: 1500 }), -1, false);
  }, []);

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(shimmerValue.value, [0, 1], [-SCREEN_WIDTH, SCREEN_WIDTH]);
    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View style={styles.container}>
      {/* Image skeleton */}
      <View style={styles.imageSkeleton}>
        <Animated.View style={[styles.shimmer, shimmerStyle]} />
      </View>

      {/* Content container */}
      <View style={styles.content}>
        {/* Title skeleton */}
        <View style={styles.titleSkeleton}>
          <Animated.View style={[styles.shimmer, shimmerStyle]} />
        </View>

        {/* Availability indicator skeleton */}
        <View style={styles.availabilitySkeleton}>
          <View style={styles.dotSkeleton}>
            <Animated.View style={[styles.shimmer, shimmerStyle]} />
          </View>
          <View style={styles.textSmallSkeleton}>
            <Animated.View style={[styles.shimmer, shimmerStyle]} />
          </View>
        </View>

        {/* Cards skeleton */}
        {[1, 2, 3].map((index) => (
          <View key={index} style={styles.cardSkeleton}>
            <View style={styles.cardHeader}>
              <View style={styles.iconSkeleton}>
                <Animated.View style={[styles.shimmer, shimmerStyle]} />
              </View>
              <View style={styles.cardTitleSkeleton}>
                <Animated.View style={[styles.shimmer, shimmerStyle]} />
              </View>
            </View>
            <View style={styles.cardContentSkeleton}>
              <Animated.View style={[styles.shimmer, shimmerStyle]} />
            </View>
            <View style={styles.cardContentSkeleton}>
              <Animated.View style={[styles.shimmer, shimmerStyle]} />
            </View>
          </View>
        ))}
      </View>

      {/* Bottom button skeleton */}
      <View style={styles.bottomButtonSkeleton}>
        <View style={styles.priceSkeleton}>
          <Animated.View style={[styles.shimmer, shimmerStyle]} />
        </View>
        <View style={styles.buttonSkeleton}>
          <Animated.View style={[styles.shimmer, shimmerStyle]} />
        </View>
      </View>
    </View>
  );
}

export function ProCardSkeleton() {
  const shimmerValue = useSharedValue(0);

  useEffect(() => {
    shimmerValue.value = withRepeat(withTiming(1, { duration: 1500 }), -1, false);
  }, []);

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(shimmerValue.value, [0, 1], [-200, 200]);
    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View style={styles.proCard}>
      <View style={styles.proCardImage}>
        <Animated.View style={[styles.shimmer, shimmerStyle]} />
      </View>
      <View style={styles.proCardContent}>
        <View style={styles.proCardTitle}>
          <Animated.View style={[styles.shimmer, shimmerStyle]} />
        </View>
        <View style={styles.proCardSubtitle}>
          <Animated.View style={[styles.shimmer, shimmerStyle]} />
        </View>
        <View style={styles.proCardStats}>
          <Animated.View style={[styles.shimmer, shimmerStyle]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
  },
  imageSkeleton: {
    height: 300,
    backgroundColor: Colors.ui.veryLightGray,
    overflow: 'hidden',
  },
  content: {
    padding: Spacing.m,
    backgroundColor: Colors.neutral.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    paddingBottom: 100,
  },
  titleSkeleton: {
    height: 32,
    width: '70%',
    backgroundColor: Colors.ui.veryLightGray,
    borderRadius: BorderRadius.small,
    marginBottom: Spacing.s,
    overflow: 'hidden',
  },
  availabilitySkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.l,
  },
  dotSkeleton: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.ui.veryLightGray,
    marginRight: Spacing.s,
    overflow: 'hidden',
  },
  textSmallSkeleton: {
    height: 20,
    width: 80,
    backgroundColor: Colors.ui.veryLightGray,
    borderRadius: BorderRadius.small,
    overflow: 'hidden',
  },
  cardSkeleton: {
    backgroundColor: Colors.neutral.white,
    padding: Spacing.l,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.m,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.m,
  },
  iconSkeleton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.ui.veryLightGray,
    marginRight: Spacing.m,
    overflow: 'hidden',
  },
  cardTitleSkeleton: {
    height: 24,
    width: 150,
    backgroundColor: Colors.ui.veryLightGray,
    borderRadius: BorderRadius.small,
    overflow: 'hidden',
  },
  cardContentSkeleton: {
    height: 16,
    backgroundColor: Colors.ui.veryLightGray,
    borderRadius: BorderRadius.small,
    marginBottom: Spacing.s,
    overflow: 'hidden',
  },
  bottomButtonSkeleton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.inputBorder,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
    paddingBottom: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceSkeleton: {
    height: 32,
    width: 80,
    backgroundColor: Colors.ui.veryLightGray,
    borderRadius: BorderRadius.small,
    overflow: 'hidden',
  },
  buttonSkeleton: {
    height: 48,
    width: 120,
    backgroundColor: Colors.ui.veryLightGray,
    borderRadius: BorderRadius.small,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  // ProCard Skeleton styles
  proCard: {
    marginRight: Spacing.m,
  },
  proCardImage: {
    width: 180,
    height: 240,
    backgroundColor: Colors.ui.veryLightGray,
    borderRadius: BorderRadius.medium,
    overflow: 'hidden',
  },
  proCardContent: {
    paddingTop: Spacing.s,
  },
  proCardTitle: {
    height: 20,
    width: '80%',
    backgroundColor: Colors.ui.veryLightGray,
    borderRadius: BorderRadius.small,
    marginBottom: Spacing.xs,
    overflow: 'hidden',
  },
  proCardSubtitle: {
    height: 16,
    width: '60%',
    backgroundColor: Colors.ui.veryLightGray,
    borderRadius: BorderRadius.small,
    marginBottom: Spacing.xs,
    overflow: 'hidden',
  },
  proCardStats: {
    height: 14,
    width: '90%',
    backgroundColor: Colors.ui.veryLightGray,
    borderRadius: BorderRadius.small,
    overflow: 'hidden',
  },
});
