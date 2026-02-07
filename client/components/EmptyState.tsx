import React from "react";
import { View, StyleSheet, Image, ImageSourcePropType } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

interface EmptyStateProps {
  image: ImageSourcePropType;
  title: string;
  message: string;
}

export function EmptyState({ image, title, message }: EmptyStateProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <Image source={image} style={styles.image} resizeMode="contain" />
      <ThemedText type="h4" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText
        type="body"
        style={[styles.message, { color: theme.textSecondary }]}
      >
        {message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["3xl"],
    paddingVertical: Spacing["4xl"],
  },
  image: {
    width: 180,
    height: 180,
    marginBottom: Spacing["2xl"],
    opacity: 0.9,
  },
  title: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  message: {
    textAlign: "center",
    opacity: 0.7,
  },
});
