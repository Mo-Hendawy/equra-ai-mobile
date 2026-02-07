import React, { useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
  FlatList,
  SafeAreaView,
  TextInput,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface Option {
  id: string;
  label: string;
  sublabel?: string;
}

interface SelectPickerProps {
  label: string;
  options: Option[];
  selectedId?: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  searchable?: boolean;
}

export function SelectPicker({
  label,
  options,
  selectedId,
  onSelect,
  placeholder = "Select...",
  searchable = true,
}: SelectPickerProps) {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedOption = options.find((o) => o.id === selectedId);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.id.toLowerCase().includes(query) ||
        opt.label.toLowerCase().includes(query) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(query))
    );
  }, [options, searchQuery]);

  const handleSelect = (id: string) => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    onSelect(id);
    setVisible(false);
    setSearchQuery("");
  };

  const handleClose = () => {
    setVisible(false);
    setSearchQuery("");
  };

  return (
    <View style={styles.container}>
      <ThemedText
        type="small"
        style={[styles.label, { color: theme.textSecondary }]}
      >
        {label}
      </ThemedText>
      <Pressable
        onPress={() => setVisible(true)}
        style={[
          styles.selector,
          {
            backgroundColor: theme.backgroundSecondary,
            borderColor: theme.divider,
          },
        ]}
      >
        <ThemedText
          style={[
            styles.selectorText,
            !selectedOption && { color: theme.textSecondary },
          ]}
          numberOfLines={1}
        >
          {selectedOption?.label ?? placeholder}
        </ThemedText>
        <Feather name="chevron-down" size={20} color={theme.textSecondary} />
      </Pressable>

      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <SafeAreaView
          style={[styles.modal, { backgroundColor: theme.backgroundRoot }]}
        >
          <View style={[styles.modalHeader, { borderBottomColor: theme.divider }]}>
            <ThemedText type="h4">{label}</ThemedText>
            <Pressable onPress={handleClose}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          {searchable ? (
            <View style={styles.searchContainer}>
              <View
                style={[
                  styles.searchInputContainer,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    borderColor: theme.divider,
                  },
                ]}
              >
                <Feather
                  name="search"
                  size={18}
                  color={theme.textSecondary}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={[styles.searchInput, { color: theme.text }]}
                  placeholder="Search..."
                  placeholderTextColor={theme.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                  clearButtonMode="while-editing"
                />
                {searchQuery.length > 0 ? (
                  <Pressable onPress={() => setSearchQuery("")}>
                    <Feather name="x-circle" size={18} color={theme.textSecondary} />
                  </Pressable>
                ) : null}
              </View>
            </View>
          ) : null}

          <FlatList
            data={filteredOptions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ThemedText style={{ color: theme.textSecondary }}>
                  No results found for "{searchQuery}"
                </ThemedText>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleSelect(item.id)}
                style={[
                  styles.option,
                  {
                    backgroundColor:
                      item.id === selectedId
                        ? theme.primary + "15"
                        : theme.backgroundDefault,
                  },
                ]}
              >
                <View style={styles.optionContent}>
                  <ThemedText
                    style={[
                      styles.optionLabel,
                      item.id === selectedId && { color: theme.primary },
                    ]}
                  >
                    {item.label}
                  </ThemedText>
                  {item.sublabel ? (
                    <ThemedText
                      type="small"
                      style={{ color: theme.textSecondary }}
                    >
                      {item.sublabel}
                    </ThemedText>
                  ) : null}
                </View>
                {item.id === selectedId ? (
                  <Feather name="check" size={20} color={theme.primary} />
                ) : null}
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.sm,
    fontWeight: "500",
  },
  selector: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
  },
  selectorText: {
    flex: 1,
    fontSize: 16,
  },
  modal: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  listContent: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  emptyContainer: {
    paddingVertical: Spacing["3xl"],
    alignItems: "center",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  optionContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
});
