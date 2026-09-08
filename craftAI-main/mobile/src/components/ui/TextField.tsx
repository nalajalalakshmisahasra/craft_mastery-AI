import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type {
  KeyboardTypeOptions,
  ReturnKeyTypeOptions,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { PALETTE, RADIUS, SPACING, TOUCH_TARGET, TYPOGRAPHY } from '../../theme/tokens';

export interface TextFieldProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  multiline?: boolean;
  numberOfLines?: number;
  secureTextEntry?: boolean;
  returnKeyType?: ReturnKeyTypeOptions;
  autoCorrect?: boolean;
  editable?: boolean;
  error?: string | null;
  helper?: string | null;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/**
 * Native text input with label, focus ring, inline error/helper text and a
 * disabled state. Focused state uses borderActive + a lighter surface so the
 * active field is obvious without any layout shift.
 */
export const TextField: React.FC<TextFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  maxLength,
  multiline = false,
  numberOfLines,
  secureTextEntry = false,
  returnKeyType,
  autoCorrect,
  editable = true,
  error,
  helper,
  style,
  accessibilityLabel,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasError = Boolean(error);

  return (
    <View style={style}>
      {label ? <Text style={[TYPOGRAPHY.caption, styles.label]}>{label}</Text> : null}

      <TextInput
        accessibilityLabel={accessibilityLabel || label || 'Text input'}
        accessibilityState={{ disabled: !editable }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={PALETTE.textMuted}
        keyboardType={keyboardType}
        maxLength={maxLength}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : undefined}
        secureTextEntry={secureTextEntry}
        returnKeyType={returnKeyType}
        autoCorrect={autoCorrect}
        editable={editable}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          isFocused && !hasError && styles.inputFocused,
          hasError && styles.inputError,
          !editable && styles.inputDisabled,
        ]}
      />

      {hasError ? (
        <Text style={[TYPOGRAPHY.footnote, styles.errorText]}>{error}</Text>
      ) : helper ? (
        <Text style={[TYPOGRAPHY.footnote, styles.helperText]}>{helper}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    marginBottom: SPACING.xs,
  },
  input: {
    minHeight: TOUCH_TARGET.minHeight,
    backgroundColor: PALETTE.inputBg,
    borderColor: PALETTE.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    color: PALETTE.textPrimary,
    fontSize: 15,
  },
  inputMultiline: {
    minHeight: 88,
    textAlignVertical: 'top',
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
  },
  inputFocused: {
    borderColor: PALETTE.borderActive,
    backgroundColor: PALETTE.surfaceHighlight,
  },
  inputError: {
    borderColor: PALETTE.error,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  errorText: {
    color: PALETTE.error,
    marginTop: SPACING.xs,
  },
  helperText: {
    color: PALETTE.textMuted,
    marginTop: SPACING.xs,
  },
});