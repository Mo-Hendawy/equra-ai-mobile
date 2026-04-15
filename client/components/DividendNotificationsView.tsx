import React from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Linking } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { useTheme } from "@/hooks/useTheme";
import { getQueryFn } from "@/lib/query-client";

interface ChangedEvent {
  id: number;
  title: string;
  start_date: string;
  symbol: string | null;
  type: "new" | "updated";
}

interface NotificationItem {
  id: number;
  sent_at: number;       // unix seconds
  title: string;
  body: string;
  new_count: number;
  updated_count: number;
  events: ChangedEvent[];
}

interface NotificationsResponse {
  notifications: NotificationItem[];
}

function formatRelativeTime(unixSec: number): string {
  const diff = Date.now() / 1000 - unixSec;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(unixSec * 1000).toLocaleDateString();
}

export default function DividendNotificationsView() {
  const { theme } = useTheme();
  const { data, isLoading, refetch, isRefetching, error } = useQuery<NotificationsResponse>({
    queryKey: ["api", "notifications"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: theme.backgroundRoot }]}>
        <Text style={{ color: theme.error }}>Could not load notifications.</Text>
      </View>
    );
  }

  const items = data?.notifications ?? [];
  if (items.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: theme.backgroundRoot }]}>
        <Text style={{ color: theme.textSecondary, textAlign: "center", paddingHorizontal: 32 }}>
          No notifications yet. You'll see updates here when new dividend events are added or changed.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ padding: 12, backgroundColor: theme.backgroundRoot }}
      style={{ backgroundColor: theme.backgroundRoot }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.primary} />}
      renderItem={({ item }) => (
        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.cardBorder },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{formatRelativeTime(item.sent_at)}</Text>
          </View>
          <Text style={{ color: theme.text, marginTop: 6 }}>{item.body}</Text>

          {item.events.length > 0 && (
            <View style={[styles.eventsWrap, { borderTopColor: theme.divider }]}>
              {item.events.slice(0, 10).map((evt) => (
                <View key={evt.id} style={styles.eventRow}>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: evt.type === "new" ? theme.primary : theme.warning },
                    ]}
                  >
                    <Text style={styles.badgeText}>{evt.type === "new" ? "NEW" : "UPD"}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontSize: 13 }} numberOfLines={2}>
                      {evt.symbol ? `${evt.symbol} · ` : ""}{evt.title}
                    </Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>
                      {evt.start_date.slice(0, 10)}
                    </Text>
                  </View>
                </View>
              ))}
              {item.events.length > 10 && (
                <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>
                  + {item.events.length - 10} more
                </Text>
              )}
            </View>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontWeight: "700",
    fontSize: 15,
  },
  eventsWrap: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 6,
    gap: 10,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 38,
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
