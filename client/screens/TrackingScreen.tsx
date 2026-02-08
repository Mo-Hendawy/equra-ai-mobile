import React, { useState, useCallback } from "react";
import { View, FlatList, StyleSheet, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { SegmentedControl } from "@/components/SegmentedControl";
import { CertificateItem } from "@/components/CertificateItem";
import { MonthlyCertificateIncome } from "@/components/MonthlyCertificateIncome";
import { ExpenseItem } from "@/components/ExpenseItem";
import { DividendItem } from "@/components/DividendItem";
import { FAB } from "@/components/FAB";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import {
  certificatesStorage,
  expensesStorage,
  expenseCategoriesStorage,
  dividendsStorage,
} from "@/lib/storage";
import type { Certificate, Expense, Dividend, ExpenseCategory } from "@/types";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SEGMENTS = [
  { id: "certificates", label: "Certificates" },
  { id: "expenses", label: "Expenses" },
  { id: "dividends", label: "Dividends" },
];

export default function TrackingScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();

  const [selectedSegment, setSelectedSegment] = useState("certificates");
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      // Seed HSBC certificates on first load
      await certificatesStorage.seedHSBCCertificates();
      
      const [certsData, expensesData, dividendsData, catsData] = await Promise.all([
        certificatesStorage.getAll(),
        expensesStorage.getAll(),
        dividendsStorage.getAll(),
        expenseCategoriesStorage.getAll(),
      ]);
      setCertificates(certsData);
      setExpenses(expensesData);
      setDividends(dividendsData);
      setCategories(catsData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleDeleteExpense = async (id: string) => {
    await expensesStorage.delete(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const handleFabPress = () => {
    switch (selectedSegment) {
      case "certificates":
        navigation.navigate("AddCertificate");
        break;
      case "expenses":
        navigation.navigate("AddExpense");
        break;
      case "dividends":
        navigation.navigate("AddDividend");
        break;
    }
  };

  const getFabIcon = () => {
    switch (selectedSegment) {
      case "certificates":
        return "file-plus";
      case "expenses":
        return "dollar-sign";
      case "dividends":
        return "calendar";
      default:
        return "plus";
    }
  };

  const renderContent = () => {
    switch (selectedSegment) {
      case "certificates":
        if (certificates.length === 0 && !loading) {
          return (
            <EmptyState
              image={require("../../assets/images/empty-certificates.png")}
              title="No Certificates Yet"
              message="Track your bank saving certificates and interest payments"
            />
          );
        }
        return (
          <FlatList
            data={certificates}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={<MonthlyCertificateIncome certificates={certificates} />}
            renderItem={({ item }) => (
              <CertificateItem
                certificate={item}
                onPress={() => navigation.navigate("AddCertificate", { certificate: item })}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.primary}
              />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        );

      case "expenses":
        if (expenses.length === 0 && !loading) {
          return (
            <EmptyState
              image={require("../../assets/images/empty-expenses.png")}
              title="No Expenses Yet"
              message="Track your investment-related expenses like brokerage fees"
            />
          );
        }
        return (
          <FlatList
            data={expenses.sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            )}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const category = categories.find((c) => c.name === item.category);
              return (
                <ExpenseItem
                  expense={item}
                  categoryColor={category?.color}
                  onDelete={() => handleDeleteExpense(item.id)}
                />
              );
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.primary}
              />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        );

      case "dividends":
        if (dividends.length === 0 && !loading) {
          return (
            <EmptyState
              image={require("../../assets/images/empty-dividends.png")}
              title="No Dividends Yet"
              message="Track dividend announcements and payments from your holdings"
            />
          );
        }
        return (
          <FlatList
            data={dividends.sort(
              (a, b) =>
                new Date(b.paymentDate).getTime() -
                new Date(a.paymentDate).getTime()
            )}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <DividendItem dividend={item} onPress={() => {}} />
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.primary}
              />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: Spacing.xl,
          },
        ]}
      >
        <SegmentedControl
          segments={SEGMENTS}
          selectedId={selectedSegment}
          onSelect={setSelectedSegment}
        />
      </View>

      <View
        style={[
          styles.content,
          { paddingBottom: tabBarHeight + Spacing["4xl"] },
        ]}
      >
        {renderContent()}
      </View>

      <FAB
        onPress={handleFabPress}
        icon={getFabIcon() as any}
        bottom={tabBarHeight + 20}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  listContent: {
    flexGrow: 1,
  },
});
