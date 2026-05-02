import React, { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/context/AuthContext";
import { Palette, Spacing, NunitoFont } from "@/constants/theme";

export default function LoginScreen() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = async () => {
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password);
      }
    } catch (e: any) {
      const msg: string = e?.message ?? "Something went wrong.";
      if (msg.includes("user-not-found") || msg.includes("wrong-password") || msg.includes("invalid-credential")) {
        setError("Incorrect email or password.");
      } else if (msg.includes("email-already-in-use")) {
        setError("An account with this email already exists.");
      } else if (msg.includes("weak-password")) {
        setError("Password must be at least 6 characters.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.inner}>
        <ThemedText style={styles.logo}>Equra AI</ThemedText>
        <ThemedText style={styles.sub}>EGX Portfolio Intelligence</ThemedText>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Palette.black400}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={Palette.black400}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {!!error && (
            <ThemedText style={styles.error}>{error}</ThemedText>
          )}

          <TouchableOpacity style={styles.btn} onPress={handle} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={Palette.black} />
            ) : (
              <ThemedText style={styles.btnText}>
                {mode === "login" ? "Sign In" : "Create Account"}
              </ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggle}
            onPress={() => { setMode(m => m === "login" ? "register" : "login"); setError(""); }}
          >
            <ThemedText style={styles.toggleText}>
              {mode === "login"
                ? "No account? Create one"
                : "Already have an account? Sign in"}
            </ThemedText>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.divLine} />
            <ThemedText style={styles.divText}>or</ThemedText>
            <View style={styles.divLine} />
          </View>

          <TouchableOpacity
            style={styles.googleBtn}
            onPress={async () => {
              setError("");
              setLoading(true);
              try {
                await signInWithGoogle();
              } catch (e: any) {
                const msg: string = e?.message ?? "";
                if (msg.includes("popup-closed")) {
                  // user dismissed — not an error
                } else if (msg.includes("operation-not-allowed")) {
                  setError("Google Sign-In is not enabled. Enable it in the Firebase console.");
                } else {
                  setError(msg || "Google sign-in failed.");
                }
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            <ThemedText style={styles.googleBtnText}>Continue with Google</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.black,
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  logo: {
    fontSize: 36,
    fontFamily: NunitoFont.black,
    color: Palette.gold,
    textAlign: "center",
    letterSpacing: -1,
  },
  sub: {
    fontSize: 14,
    color: Palette.black400,
    textAlign: "center",
    marginBottom: Spacing["4xl"],
    marginTop: 4,
  },
  form: {
    gap: Spacing.md,
  },
  input: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 12,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    fontSize: 15,
    color: "#fff",
    fontFamily: NunitoFont.regular,
  },
  error: {
    color: "#f87171",
    fontSize: 13,
    textAlign: "center",
  },
  btn: {
    backgroundColor: Palette.gold,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  btnText: {
    color: Palette.black,
    fontSize: 15,
    fontFamily: NunitoFont.bold,
    fontWeight: "700",
  },
  toggle: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  toggleText: {
    color: Palette.gold400,
    fontSize: 13,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: Spacing.sm,
  },
  divLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#333",
  },
  divText: {
    color: Palette.black400,
    fontSize: 12,
  },
  googleBtn: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  googleBtnText: {
    color: "#111",
    fontSize: 15,
    fontFamily: NunitoFont.bold,
    fontWeight: "700",
  },
});
