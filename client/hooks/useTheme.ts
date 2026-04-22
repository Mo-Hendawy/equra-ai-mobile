import { Colors } from "@/constants/theme";

// Black / gold / white palette is dark-first. Force dark regardless of
// system appearance so every screen renders against the near-black canvas.
export function useTheme() {
  return {
    theme: Colors.dark,
    isDark: true,
  };
}
