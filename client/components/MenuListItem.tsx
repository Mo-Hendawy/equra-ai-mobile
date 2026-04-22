import React from "react";
import { StyleSheet, Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, NunitoFont } from "@/constants/theme";

interface MenuListItemProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  iconColor?: string;
  showChevron?: boolean;
  rightContent?: React.ReactNode;
  // When true, suppresses the bottom divider — use for the last row in a
  // grouped card. Defaults to false so rows stack cleanly inside a group.
  isLast?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function MenuListItem({
  icon,
  title,
  subtitle,
  onPress,
  iconColor,
  showChevron = true,
  rightContent,
  isLast = false,
}: MenuListItemProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.99, { damping: 15, stiffness: 150 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const tintColor = iconColor || theme.primary;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.row,
        {
          borderBottomColor: theme.divider,
          borderBottomWidth: isLast ? 0 : 1,
        },
        animatedStyle,
      ]}
    >
      <View
        style={[
          styles.iconTile,
          { backgroundColor: tintColor + "22" },
        ]}
      >
        <Feather name={icon} size={18} color={tintColor} strokeWidth={2} />
      </View>

      <View style={styles.content}>
        <ThemedText style={[styles.title, { color: theme.text }]}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText
            style={[styles.subtitle, { color: theme.textSecondary }]}
          >
            {subtitle}
          </ThemedText>
        ) : null}
      </View>

      {rightContent}

      {showChevron ? (
        <Feather
          name="chevron-right"
          size={18}
          color={theme.textSecondary}
          style={styles.chevron}
        />
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontFamily: NunitoFont.medium,
    fontWeight: "500",
  },
  subtitle: {
    fontSize: 12,
    fontFamily: NunitoFont.regular,
    marginTop: 2,
    lineHeight: 16,
  },
  chevron: {
    opacity: 0.5,
    marginLeft: 8,
  },
});
