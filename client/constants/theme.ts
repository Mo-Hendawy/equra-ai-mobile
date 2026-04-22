import { Platform } from "react-native";

// Equra AI — Black / Gold / White palette only, with degrees.
// No other hues. P/L direction uses gold (positive) + muted-black (negative).
export const Colors = {
  light: {
    // Text
    text: "#0A0A09",
    textSecondary: "#6A6A66",
    buttonText: "#0A0A09",
    // Tab bar
    tabIconDefault: "#9A9A94",
    tabIconSelected: "#B08830",
    // Accents
    link: "#B08830",
    primary: "#B08830",
    primaryVariant: "#8B6A1F",
    accent: "#D4A85A",
    // Semantic (black/gold/white only)
    success: "#B08830",
    error: "#2E2E33",
    warning: "#D4A85A",
    // Surfaces
    backgroundRoot: "#FAFAFA",
    backgroundDefault: "#FFFFFF",
    backgroundSecondary: "#F4F3EF",
    backgroundTertiary: "#E8E6E0",
    divider: "#E8E6E0",
    cardBorder: "#E8E6E0",
  },
  dark: {
    // Text
    text: "#FFFFFF",
    textSecondary: "#8C8A82",
    buttonText: "#0A0A09",
    // Tab bar
    tabIconDefault: "rgba(255,255,255,0.45)",
    tabIconSelected: "#D4A85A",
    // Accents
    link: "#D4A85A",
    primary: "#D4A85A",
    primaryVariant: "#E5C277",
    accent: "#D4A85A",
    // Semantic (black/gold/white only)
    success: "#D4A85A",
    error: "#6A6A66",
    warning: "#E5C277",
    // Surfaces
    backgroundRoot: "#0A0A09",
    backgroundDefault: "#111112",
    backgroundSecondary: "#1A1A1C",
    backgroundTertiary: "#242428",
    divider: "rgba(255,255,255,0.08)",
    cardBorder: "rgba(255,255,255,0.06)",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  full: 9999,
};

export const Typography = {
  h1: { fontSize: 32, lineHeight: 40, fontWeight: "700" as const, letterSpacing: -0.5 },
  h2: { fontSize: 28, lineHeight: 36, fontWeight: "700" as const, letterSpacing: -0.3 },
  h3: { fontSize: 24, lineHeight: 32, fontWeight: "600" as const, letterSpacing: -0.2 },
  h4: { fontSize: 20, lineHeight: 28, fontWeight: "600" as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: "400" as const },
  small: { fontSize: 14, lineHeight: 20, fontWeight: "400" as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "400" as const },
  link: { fontSize: 16, lineHeight: 24, fontWeight: "400" as const },
  mono: {
    fontSize: 16, lineHeight: 24, fontWeight: "400" as const,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
  },
  display: { fontSize: 36, lineHeight: 40, fontWeight: "800" as const, letterSpacing: -0.5 },
  sectionLabel: { fontSize: 11, lineHeight: 14, fontWeight: "700" as const, letterSpacing: 1 },
};

export const Fonts = Platform.select({
  ios: { sans: "system-ui", serif: "ui-serif", rounded: "ui-rounded", mono: "ui-monospace" },
  default: { sans: "normal", serif: "serif", rounded: "normal", mono: "monospace" },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Shadows = {
  small:  { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.18, shadowRadius: 2,  elevation: 1 },
  medium: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 3 },
  large:  { shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.38, shadowRadius: 24, elevation: 8 },
  // Gold glow used by FAB / primary accents.
  float:  { shadowColor: "#D4A85A", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.40, shadowRadius: 20, elevation: 10 },
};

// Nunito weights loaded in App.tsx via @expo-google-fonts/nunito.
export const NunitoFont = {
  regular: "Nunito_400Regular",
  medium: "Nunito_500Medium",
  semibold: "Nunito_600SemiBold",
  bold: "Nunito_700Bold",
  extrabold: "Nunito_800ExtraBold",
  black: "Nunito_900Black",
};

// Raw palette — black / gold / white with degrees only.
export const Palette = {
  // Black degrees
  black:      "#0A0A09",  // ink black
  black900:   "#111112",  // card on dark
  black800:   "#1A1A1C",  // secondary surface
  black700:   "#242428",  // tertiary surface
  black600:   "#2E2E33",  // borders / muted negative
  black500:   "#4A4A48",  // subtle text on dark
  black400:   "#6A6A66",  // muted text
  black300:   "#8C8A82",  // secondary text

  // Gold degrees
  goldDeep:   "#8B6A1F",  // pressed / darkest accent
  gold900:    "#B08830",  // primary on light bg
  gold:       "#D4A85A",  // THE gold (brand accent)
  gold400:    "#E5C277",  // hover / highlight
  gold200:    "#F5E5B8",  // pill fills
  gold100:    "#FAF3DB",  // softest tint

  // White degrees
  white:      "#FFFFFF",  // pure
  white50:    "#FAFAFA",  // root bg light
  white100:   "#F4F3EF",  // panel tint
  white200:   "#E8E6E0",  // dividers light

  // Semantic reds (used sparingly — destructive / negative direction)
  whisperRed: "#FF6B6B",
};
