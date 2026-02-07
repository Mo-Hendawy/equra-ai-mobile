import React, { forwardRef } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

interface FormInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const FormInput = forwardRef<TextInput, FormInputProps>(
  ({ label, error, containerStyle, style, ...props }, ref) => {
    const { theme } = useTheme();

    return (
      <View style={[styles.container, containerStyle]}>
        {label ? (
          <ThemedText
            type="small"
            style={[styles.label, { color: theme.textSecondary }]}
          >
            {label}
          </ThemedText>
        ) : null}
        <TextInput
          ref={ref}
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundSecondary,
              color: theme.text,
              borderColor: error ? theme.error : theme.divider,
            },
            style,
          ]}
          placeholderTextColor={theme.textSecondary}
          {...props}
        />
        {error ? (
          <ThemedText type="small" style={[styles.error, { color: theme.error }]}>
            {error}
          </ThemedText>
        ) : null}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.sm,
    fontWeight: "500",
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    borderWidth: 1,
  },
  error: {
    marginTop: Spacing.xs,
  },
});
