import React, { useState } from 'react';
import { TextInput, TextInputProps, StyleSheet, View, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { Text } from './Text';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helper,
  containerStyle,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text variant="body" color="iron" style={styles.label}>
          {label}
        </Text>
      )}
      <TextInput
        style={[styles.input, isFocused && styles.inputFocused, error && styles.inputError, style]}
        placeholderTextColor={Colors.neutral.course}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        accessibilityRole="text"
        accessibilityLabel={label}
        accessibilityHint={helper || undefined}
        accessibilityState={{
          disabled: props.editable === false,
          invalid: !!error
        }}
        accessibilityValue={props.value ? { text: props.value } : undefined}
        {...props}
      />
      {error && (
        <Text variant="caption" color={Colors.semantic.error} style={styles.error}>
          {error}
        </Text>
      )}
      {helper && !error && (
        <Text variant="caption" color="course" style={styles.helper}>
          {helper}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.m,
  },
  label: {
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.neutral.white,
    borderWidth: 1,
    borderColor: Colors.neutral.mist,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    fontSize: Typography.fontSize.body,
    lineHeight: Typography.lineHeight.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primary.navy,
    minHeight: 48,
  },
  inputFocused: {
    borderColor: Colors.primary.electric,
    shadowColor: Colors.primary.electric,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputError: {
    borderColor: Colors.semantic.error,
  },
  error: {
    marginTop: Spacing.xxs,
  },
  helper: {
    marginTop: Spacing.xxs,
  },
});
