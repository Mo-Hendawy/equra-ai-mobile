import React from "react";
import { StyleSheet, Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { Palette, Shadows } from "@/constants/theme";

interface FABProps {
  onPress: () => void;
  icon?: keyof typeof Feather.glyphMap;
  bottom?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Gold orb with subtle highlight — faked radial gradient with layered tones.
export function FAB({ onPress, icon = "plus", bottom = 100 }: FABProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 220 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 220 });
  };
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.wrap, { bottom }, Shadows.float, animatedStyle]}
    >
      <View style={styles.orb}>
        <View style={styles.highlight} />
        <Feather name={icon} size={24} color={Palette.black} />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  orb: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Palette.gold,
    borderWidth: 1,
    borderColor: Palette.goldDeep,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  highlight: {
    position: "absolute",
    top: 6,
    left: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Palette.gold400,
    opacity: 0.85,
  },
});
