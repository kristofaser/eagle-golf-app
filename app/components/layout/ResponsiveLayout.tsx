import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAdaptiveLayout } from '@/hooks/useResponsiveLayout';
import { Colors, Spacing } from '@/constants/theme';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  sidebar,
  header,
  footer,
}) => {
  const { shouldShowSidebar, isWeb, contentPadding } = useAdaptiveLayout();

  if (!isWeb) {
    // Layout mobile natif - pas de sidebar
    return (
      <View style={styles.mobileContainer}>
        {header}
        <View style={[styles.content, { padding: contentPadding }]}>
          {children}
        </View>
        {footer}
      </View>
    );
  }

  return (
    <View style={styles.webContainer}>
      {header && <View style={styles.header}>{header}</View>}

      <View style={styles.body}>
        {shouldShowSidebar && sidebar && (
          <View style={styles.sidebar}>
            {sidebar}
          </View>
        )}

        <View style={[
          styles.mainContent,
          { padding: contentPadding },
          shouldShowSidebar && styles.mainContentWithSidebar
        ]}>
          {children}
        </View>
      </View>

      {footer && <View style={styles.footer}>{footer}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  mobileContainer: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
  },
  webContainer: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
    minHeight: '100vh',
  },
  header: {
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.divider,
    zIndex: 100,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 280,
    backgroundColor: Colors.neutral.white,
    borderRightWidth: 1,
    borderRightColor: Colors.ui.divider,
    flexShrink: 0,
  },
  mainContent: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
  },
  mainContentWithSidebar: {
    marginLeft: 0, // La sidebar prend déjà l'espace
  },
  content: {
    flex: 1,
  },
  footer: {
    backgroundColor: Colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.divider,
    padding: Spacing.m,
  },
});