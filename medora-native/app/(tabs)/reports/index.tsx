/**
 * Reports Screen – Clinical archive with search & filter
 * Visual hierarchy: Stats strip → Search → Filter chips → Report list
 */
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  Search,
  FileText,
  Share2,
  Plus,
  ChevronRight,
  Lock,
} from "lucide-react-native";
import { reports, doctors } from "@/lib/mock-data";
import { useTheme } from "@/theme/ThemeProvider";
import { ScrollView } from "react-native";

const TYPES = ["All", "Lab", "Imaging", "Prescription", "Summary"] as const;
type ReportType = (typeof TYPES)[number];

const TYPE_COLORS: Record<string, string> = {
  Lab: "#4CAF7D",
  Imaging: "#5B8FF9",
  Prescription: "#B6785C",
  Summary: "#9B7EBD",
};

export default function ReportsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<ReportType>("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter((r) => {
      const matchQ =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.doctor.toLowerCase().includes(q);
      const matchT = type === "All" || r.type === type;
      return matchQ && matchT;
    });
  }, [query, type]);

  const totalShared = new Set(reports.flatMap((r) => r.shared)).size;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={s.header}>
            {/* Page title + upload */}
            <Animated.View entering={FadeInDown.duration(500)} style={s.titleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[s.eyebrow, { color: colors.clay }]}>CLINICAL ARCHIVE</Text>
                <Text style={[s.heading, { color: colors.foreground }]}>
                  Your{" "}
                  <Text style={{ fontStyle: "italic" }}>reports</Text>
                </Text>
              </View>
              <Pressable 
                style={[s.uploadBtn, { backgroundColor: colors.ink }]}
                onPress={() => router.push("/upload")}
              >
                <Plus size={16} color={colors.primaryForeground} strokeWidth={2} />
                <Text style={[s.uploadText, { color: colors.primaryForeground }]}>Upload</Text>
              </Pressable>
            </Animated.View>

            {/* Privacy note */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(60)}
              style={[s.privacyBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Lock size={13} color={colors.inkMuted} strokeWidth={1.75} />
              <Text style={[s.privacyText, { color: colors.inkMuted }]}>
                Encrypted at rest · Shareable on your terms · Revoke access anytime
              </Text>
            </Animated.View>

            {/* Stat strip */}
            <Animated.View entering={FadeInDown.duration(400).delay(100)} style={s.statRow}>
              {[
                { label: "Total", value: String(reports.length).padStart(2, "0") },
                { label: "Shared", value: String(totalShared).padStart(2, "0") },
                { label: "Storage", value: "34.9 MB" },
              ].map(({ label, value }) => (
                <View
                  key={label}
                  style={[s.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Text style={[s.statValue, { color: colors.foreground }]}>{value}</Text>
                  <Text style={[s.statLabel, { color: colors.inkMuted }]}>{label}</Text>
                </View>
              ))}
            </Animated.View>

            {/* Search bar */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(140)}
              style={[s.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Search size={17} color={colors.inkMuted} strokeWidth={1.75} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search reports…"
                placeholderTextColor={colors.inkMuted}
                style={[s.searchInput, { color: colors.foreground }]}
              />
            </Animated.View>

            {/* Type filter */}
            <Animated.View entering={FadeInDown.duration(400).delay(180)}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
                {TYPES.map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => setType(t)}
                    style={[
                      s.chip,
                      {
                        backgroundColor: type === t ? colors.ink : colors.surface,
                        borderColor: type === t ? colors.ink : colors.border,
                      },
                    ]}
                  >
                    {t !== "All" && (
                      <View style={[s.chipDot, { backgroundColor: TYPE_COLORS[t] ?? colors.clay }]} />
                    )}
                    <Text
                      style={[
                        s.chipText,
                        { color: type === t ? colors.primaryForeground : colors.inkMuted },
                      ]}
                    >
                      {t}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </Animated.View>

            <Text style={[s.resultCount, { color: colors.inkMuted }]}>
              {filtered.length} report{filtered.length !== 1 ? "s" : ""}
            </Text>
          </View>
        }
        renderItem={({ item: r, index }) => {
          const sharedDocs = doctors.filter((d) => r.shared.includes(d.id));
          const typeColor = TYPE_COLORS[r.type] ?? colors.inkMuted;

          return (
            <Animated.View entering={FadeInDown.duration(400).delay(index * 40)}>
              <Pressable
                onPress={() =>
                  router.push({ pathname: "/(tabs)/reports/[reportId]", params: { reportId: r.id } })
                }
                style={[
                  s.reportRow,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                {/* File icon with type color accent */}
                <View style={[s.fileIcon, { backgroundColor: typeColor + "18", borderColor: typeColor + "40" }]}>
                  <FileText size={18} color={typeColor} strokeWidth={1.75} />
                </View>

                {/* Info */}
                <View style={s.reportInfo}>
                  <View style={s.reportTitleRow}>
                    <Text style={[s.reportTitle, { color: colors.foreground }]} numberOfLines={1}>
                      {r.title}
                    </Text>
                    <View style={[s.typePill, { backgroundColor: typeColor + "18" }]}>
                      <Text style={[s.typePillText, { color: typeColor }]}>{r.type}</Text>
                    </View>
                  </View>
                  <Text style={[s.reportMeta, { color: colors.inkMuted }]}>
                    {r.doctor}{"  ·  "}
                    {new Date(r.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    {"  ·  "}{r.size}
                  </Text>

                  {/* Shared avatars */}
                  {sharedDocs.length > 0 && (
                    <View style={s.sharedRow}>
                      <Share2 size={10} color={colors.inkMuted} strokeWidth={1.75} />
                      <Text style={[s.sharedText, { color: colors.inkMuted }]}>
                        Shared with {sharedDocs.map((d) => d.name.split(" ")[1]).join(", ")}
                      </Text>
                    </View>
                  )}
                </View>

                <ChevronRight size={16} color={colors.inkMuted} strokeWidth={1.75} />
              </Pressable>
            </Animated.View>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListFooterComponent={
          <Animated.View entering={FadeInDown.duration(400).delay(300)} style={{ marginTop: 24 }}>
            <Pressable
              onPress={() =>
                router.push({ pathname: "/(tabs)/reports/[reportId]", params: { reportId: reports[0]?.id } })
              }
              style={[s.shareCard, { backgroundColor: colors.claySoft, borderColor: colors.clay + "40" }]}
            >
              <Share2 size={22} color={colors.clay} strokeWidth={1.5} />
              <View style={{ flex: 1 }}>
                <Text style={[s.shareTitle, { color: colors.foreground }]}>
                  Share with a specialist
                </Text>
                <Text style={[s.shareSub, { color: colors.inkMuted }]}>
                  Set expiry, add watermark, or revoke access anytime.
                </Text>
              </View>
              <ChevronRight size={18} color={colors.clay} strokeWidth={1.75} />
            </Pressable>
          </Animated.View>
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={[s.emptyText, { color: colors.inkMuted }]}>No reports match your search.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { gap: 16, marginTop: 12, marginBottom: 16 },

  titleRow: { flexDirection: "row", alignItems: "flex-end", gap: 12 },
  eyebrow: { fontSize: 11, fontFamily: "DMSans_500Medium", letterSpacing: 2.5 },
  heading: { fontSize: 36, fontFamily: "Fraunces_400Regular", letterSpacing: -1.2, lineHeight: 42, marginTop: 4 },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  uploadText: { fontSize: 14, fontFamily: "DMSans_600SemiBold" },

  privacyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  privacyText: { fontSize: 12, fontFamily: "DMSans_400Regular", flex: 1 },

  statRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  statValue: { fontSize: 22, fontFamily: "Fraunces_400Regular", letterSpacing: -0.5 },
  statLabel: { fontSize: 10, fontFamily: "DMSans_500Medium", letterSpacing: 0.5, textTransform: "uppercase", marginTop: 2 },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "DMSans_400Regular", padding: 0 },

  chips: { gap: 8, paddingVertical: 2 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontSize: 13, fontFamily: "DMSans_500Medium" },
  resultCount: { fontSize: 12, fontFamily: "DMSans_400Regular" },

  reportRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  fileIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  reportInfo: { flex: 1, gap: 4 },
  reportTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  reportTitle: { flex: 1, fontSize: 14, fontFamily: "DMSans_600SemiBold", letterSpacing: -0.2 },
  typePill: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  typePillText: { fontSize: 9, fontFamily: "DMSans_600SemiBold", letterSpacing: 0.5, textTransform: "uppercase" },
  reportMeta: { fontSize: 11, fontFamily: "DMSans_400Regular" },
  sharedRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  sharedText: { fontSize: 11, fontFamily: "DMSans_400Regular" },

  shareCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  shareTitle: { fontSize: 16, fontFamily: "Fraunces_500Medium", letterSpacing: -0.3 },
  shareSub: { fontSize: 12, fontFamily: "DMSans_400Regular", marginTop: 3, lineHeight: 18 },

  empty: { paddingVertical: 60, alignItems: "center" },
  emptyText: { fontSize: 14, fontFamily: "DMSans_400Regular" },
});
