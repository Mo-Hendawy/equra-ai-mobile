import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/useTheme";
import {
  getPlaybook,
  savePlaybook,
  resetPlaybookToDefault,
  type PlaybookSection,
} from "@/lib/playbook-storage";

export default function PlaybookDrawerContent() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [sections, setSections] = useState<PlaybookSection[]>([]);
  const [editingRule, setEditingRule] = useState<{
    sectionId: string;
    ruleIdx: number;
  } | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    getPlaybook().then(setSections);
  }, []);

  const persist = useCallback(
    async (updated: PlaybookSection[]) => {
      setSections(updated);
      await savePlaybook(updated);
    },
    []
  );

  function startEdit(sectionId: string, ruleIdx: number, currentText: string) {
    setEditingRule({ sectionId, ruleIdx });
    setEditText(currentText);
  }

  function commitEdit() {
    if (!editingRule) return;
    const updated = sections.map((s) => {
      if (s.id !== editingRule.sectionId) return s;
      const rules = [...s.rules];
      const trimmed = editText.trim();
      if (trimmed) {
        rules[editingRule.ruleIdx] = trimmed;
      } else {
        rules.splice(editingRule.ruleIdx, 1); // delete empty rule
      }
      return { ...s, rules };
    });
    persist(updated);
    setEditingRule(null);
  }

  function addRule(sectionId: string) {
    const updated = sections.map((s) => {
      if (s.id !== sectionId) return s;
      return { ...s, rules: [...s.rules, "New rule…"] };
    });
    persist(updated);
    const section = updated.find((s) => s.id === sectionId);
    if (section) startEdit(sectionId, section.rules.length - 1, "");
  }

  function handleReset() {
    Alert.alert(
      "Reset playbook?",
      "This will replace all your edits with the original rules.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            const def = await resetPlaybookToDefault();
            setSections(def);
          },
        },
      ]
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 16,
      }}
    >
      <Text style={[styles.header, { color: theme.text }]}>
        Investment Playbook
      </Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Tap any rule to edit. Swipe right to close.
      </Text>

      {sections.map((section) => (
        <View
          key={section.id}
          style={[
            styles.section,
            {
              backgroundColor: isDark
                ? theme.backgroundSecondary
                : `${section.color}08`,
              borderLeftColor: section.color,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: section.color }]}>
            {section.title}
          </Text>

          {section.rules.map((rule, idx) => {
            const isEditing =
              editingRule?.sectionId === section.id &&
              editingRule?.ruleIdx === idx;

            return isEditing ? (
              <View key={idx} style={styles.editRow}>
                <TextInput
                  value={editText}
                  onChangeText={setEditText}
                  onBlur={commitEdit}
                  onSubmitEditing={commitEdit}
                  autoFocus
                  multiline
                  style={[
                    styles.editInput,
                    {
                      color: theme.text,
                      borderColor: section.color,
                      backgroundColor: theme.backgroundDefault,
                    },
                  ]}
                />
              </View>
            ) : (
              <Pressable
                key={idx}
                onPress={() => startEdit(section.id, idx, rule)}
                style={styles.ruleRow}
              >
                <View
                  style={[styles.bullet, { backgroundColor: section.color }]}
                />
                <Text style={[styles.ruleText, { color: theme.text }]}>
                  {rule}
                </Text>
              </Pressable>
            );
          })}

          <Pressable
            onPress={() => addRule(section.id)}
            style={styles.addBtn}
          >
            <Text style={{ color: section.color, fontSize: 12, fontWeight: "600" }}>
              + Add rule
            </Text>
          </Pressable>
        </View>
      ))}

      <Pressable onPress={handleReset} style={styles.resetBtn}>
        <Text style={{ color: theme.error, fontSize: 12, fontWeight: "600" }}>
          Reset to defaults
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 20,
  },
  section: {
    borderLeftWidth: 4,
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 6,
  },
  bullet: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 10,
  },
  ruleText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  editRow: {
    marginVertical: 4,
  },
  editInput: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  addBtn: {
    paddingVertical: 6,
    marginTop: 4,
  },
  resetBtn: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 8,
  },
});
