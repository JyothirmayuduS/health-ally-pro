import React, { useMemo } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { format, isSameDay } from "date-fns";
import { useTheme } from "@/theme/ThemeProvider";
import { appointments, doctors } from "@/lib/mock-data";

function statusLabel(status: string) {
  if (status === "in-queue") return "In queue";
  if (status === "upcoming") return "Upcoming";
  if (status === "completed") return "Completed";
  return status;
}

export default function VisitsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const today = new Date();

  const sorted = useMemo(
    () =>
      [...appointments].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [],
  );

  const upcoming = sorted.filter(
    (a) => a.status === "upcoming" || a.status === "in-queue",
  );
  const past = sorted.filter(
    (a) => a.status === "completed" || a.status === "cancelled",
  );

  const renderVisit = (appt: (typeof appointments)[0]) => {
    const doc = doctors.find((d) => d.id === appt.doctorId);
    if (!doc) return null;
    const dateText = isSameDay(new Date(appt.date), today)
      ? `Today, ${appt.time}`
      : `${format(new Date(appt.date), "MMM d")}, ${appt.time}`;

    return (
      <Pressable
        key={appt.id}
        onPress={() => router.push(`/visits/${appt.id}`)}
        style={[s.row, { borderColor: colors.border, backgroundColor: colors.surface }]}
      >
        <View style={[s.avatar, { backgroundColor: colors.clay + "22" }]}>
          <Text style={[s.avatarText, { color: colors.foreground }]}>{doc.initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.rowTitle, { color: colors.foreground }]}>{doc.name}</Text>
          <Text style={[s.rowMeta, { color: colors.inkMuted }]}>
            {appt.reason} · {dateText}
          </Text>
        </View>
        <View style={[s.badge, { backgroundColor: colors.background }]}>
          <Text style={[s.badgeText, { color: colors.inkMuted }]}>{statusLabel(appt.status)}</Text>
        </View>
        <ChevronRight size={16} color={colors.inkMuted} strokeWidth={1.75} />
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <ChevronLeft size={24} color={colors.foreground} strokeWidth={2.25} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[s.eyebrow, { color: colors.clay }]}>Care history</Text>
          <Text style={[s.title, { color: colors.foreground }]}>Past visits</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {upcoming.length > 0 ? (
          <>
            <Text style={[s.section, { color: colors.foreground }]}>Upcoming</Text>
            {upcoming.map(renderVisit)}
          </>
        ) : null}

        <Text style={[s.section, { color: colors.foreground, marginTop: upcoming.length ? 20 : 0 }]}>
          Completed
        </Text>
        {past.length ? past.map(renderVisit) : (
          <Text style={[s.empty, { color: colors.inkMuted }]}>No completed visits yet.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: "DMSans_500Medium",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: "Fraunces_500Medium",
    fontSize: 32,
    marginTop: 4,
  },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  section: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 16,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: "Fraunces_500Medium",
    fontSize: 14,
  },
  rowTitle: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 15,
  },
  rowMeta: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 10,
    textTransform: "uppercase",
  },
  empty: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 24,
  },
});
