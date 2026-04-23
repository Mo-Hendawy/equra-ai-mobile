import { Text, StyleSheet, type TextProps } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { Typography, NunitoFont } from "@/constants/theme";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "h1" | "h2" | "h3" | "h4" | "body" | "small" | "link" | "caption" | "display";
};

function nunitoFor(weight?: string | number): string {
  switch (String(weight ?? "500")) {
    case "900":
      return NunitoFont.black;
    case "800":
      return NunitoFont.extrabold;
    case "700":
      return NunitoFont.bold;
    case "600":
      return NunitoFont.semibold;
    case "500":
      return NunitoFont.medium;
    case "400":
    default:
      return NunitoFont.regular;
  }
}

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "body",
  ...rest
}: ThemedTextProps) {
  const { theme, isDark } = useTheme();

  const getColor = () => {
    if (isDark && darkColor) return darkColor;
    if (!isDark && lightColor) return lightColor;
    if (type === "link") return theme.link;
    return theme.text;
  };

  const typeStyle: any = (() => {
    switch (type) {
      case "h1": return Typography.h1;
      case "h2": return Typography.h2;
      case "h3": return Typography.h3;
      case "h4": return Typography.h4;
      case "body": return Typography.body;
      case "small": return Typography.small;
      case "caption": return Typography.caption;
      case "link": return Typography.link;
      case "display": return Typography.display;
      default: return Typography.body;
    }
  })();

  // Flatten style safely via StyleSheet.flatten — handles arrays, nested
  // arrays, Animated styles, null/false entries without throwing.
  const flat: any = StyleSheet.flatten(style) ?? {};
  const weight = flat.fontWeight ?? typeStyle.fontWeight;
  const fontFamily = flat.fontFamily ?? nunitoFor(weight);

  return (
    <Text
      style={[{ color: getColor() }, typeStyle, { fontFamily }, style]}
      {...rest}
    />
  );
}
