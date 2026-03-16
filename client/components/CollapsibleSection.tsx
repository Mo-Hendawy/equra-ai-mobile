import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

interface CollapsibleSectionProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function CollapsibleSection({
  title,
  expanded,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[styles.header, { backgroundColor: theme.backgroundSecondary }]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <ThemedText type="subtitle">{title}</ThemedText>
        <Feather
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={theme.textSecondary}
        />
      </TouchableOpacity>
      {expanded && <View style={styles.content}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: 8,
  },
  content: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
});
