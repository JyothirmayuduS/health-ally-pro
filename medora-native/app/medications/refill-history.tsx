import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import {
  cancelRefillRequest,
  formatRefillSubmitted,
  listRefillRequests,
  type RefillRequest,
} from "@/lib/refill-requests-store";
import { useTheme } from "@/theme/ThemeProvider";

export default function RefillHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [requests, setRequests] = useState<RefillRequest[]>([]);

  const refresh = useCallback(() => {
    setRequests(listRefillRequests().filter((r) => r.status === "pending"));
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const handleCancel = (id: string) => {
    cancelRefillRequest(id);
    refresh();
  };

  return (
    <View style={[s.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft size={24} color={colors.foreground} strokeWidth={2.5} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[s.title, { color: colors.foreground }]}>Refill history</Text>
          <Text style={[s.sub, { color: colors.inkMuted }]}>
            Requests submitted from this device
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}
      >
        <Text style={[s.section, { color: colors.foreground }]}>Pending</Text>
        {requests.length === 0 ? (
          <Text style={[s.empty, { color: colors.inkMuted }]}>No pending refill requests.</Text>
        ) : (
          requests.map((req) => (
            <View
              key={req.id}
              style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={s.cardTop}>
                <Text style={[s.medName, { color: colors.foreground }]}>{req.medicationName}</Text>
                <View style={s.pendingBadge}>
                  <Text style={s.pendingText}>PENDING</Text>
                </View>
              </View>
              <Text style={[s.submitted, { color: colors.inkMuted }]}>
                {formatRefillSubmitted(req.submittedAt)}
              </Text>
              <Pressable
                onPress={() => handleCancel(req.id)}
                style={[s.cancelBtn, { borderColor: "#D35E50" }]}
              >
                <Text style={s.cancelText}>Cancel request</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 4,
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 28, fontFamily: "Fraunces_500Medium", letterSpacing: -0.5 },
  sub: { fontSize: 14, fontFamily: "DMSans_400Regular", marginTop: 4 },
  section: { fontSize: 20, fontFamily: "Fraunces_500Medium", marginBottom: 14 },
  empty: { fontSize: 14, fontFamily: "DMSans_400Regular" },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  medName: { fontSize: 17, fontFamily: "DMSans_600SemiBold", flex: 1 },
  pendingBadge: {
    backgroundColor: "#FFF4DC",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pendingText: {
    fontSize: 10,
    fontFamily: "DMSans_700Bold",
    color: "#B8860B",
    letterSpacing: 0.5,
  },
  submitted: { fontSize: 13, fontFamily: "DMSans_400Regular", marginTop: 8 },
  cancelBtn: {
    alignSelf: "flex-start",
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  cancelText: { fontSize: 13, fontFamily: "DMSans_600SemiBold", color: "#D35E50" },
});
