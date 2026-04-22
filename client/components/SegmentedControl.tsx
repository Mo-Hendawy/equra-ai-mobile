import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, NunitoFont } from "@/constants/theme";

interface Segment {
  id: string;
  label: string;
}

interface SegmentedControlProps {
  segments: Segment[];
  selectedId: string;
  onSelect: (id: string) => void;
}

// Filled-segment control — handoff AI screen uses inactive=bg-secondary,
// active=bg-default (white) with primary-green label + soft drop shadow.
export function SegmentedControl({
  segments,
  selectedId,
  onSelect,
}: SegmentedControlProps) {
  const { theme } = useTheme();

  const handlePress = (id: string) => {
    if (id !== selectedId) {
      Haptics.selectionAsync();
      onSelect(id);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}
    >
      {segments.map((segment) => {
        const isSelected = segment.id === selectedId;
        return (
          <Pressable
            key={segment.id}
            onPress={() => handlePress(segment.id)}
            style={[
              styles.segment,
              isSelected && [
                styles.selectedSegment,
                { backgroundColor: theme.backgroundDefault },
              ],
            ]}
          >
            <ThemedText
              style={[
                styles.label,
                {
                  color: isSelected ? theme.primary : theme.textSecondary,
                  fontFamily: isSelected ? NunitoFont.bold : NunitoFont.semibold,
                },
              ]}
            >
              {segment.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: BorderRadius.sm,
    padding: 3,
    marginBottom: Spacing.lg,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: BorderRadius.xs,
  },
  selectedSegment: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: -0.1,
  },
});
