import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  addDays,
  format,
  isSameDay,
  startOfWeek,
} from "date-fns";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  List,
  Moon,
  Package,
  Pill,
  UtensilsCrossed,
} from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { type Medication } from "@/lib/mock-data";
import { useTheme } from "@/theme/ThemeProvider";
import { AccessiblePressable } from "@/components/ui/AccessiblePressable";
import { usePatientMedications } from "@/hooks/usePatientMedications";

type Tab = "today" | "timetable";

function dosePct(meds: Medication[]) {
  if (!meds.length) return 0;
  return Math.round((meds.filter((m) => m.taken).length / meds.length) * 100);
}

function InstructionTag({ label }: { label: string }) {
  const isFood = label.toLowerCase().includes("food");
  const isBed = label.toLowerCase().includes("bed");
  const Icon = isFood ? UtensilsCrossed : isBed ? Moon : Pill;
  return (
    <View style={tagStyles.wrap}>
      <Icon size={11} color="#B8735D" strokeWidth={2} />
      <Text style={tagStyles.text}>{label}</Text>
    </View>
  );
}

function DoseRow({
  med,
  colors,
  onToggle,
}: {
  med: Medication;
  colors: ReturnType<typeof useTheme>["colors"];
  onToggle: (id: string) => void;
}) {
  const router = useRouter();
  const takenLabel = med.taken
    ? `Mark ${med.name} as not taken`
    : `Mark ${med.name} as taken`;

  return (
    <View
      style={[rowStyles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <AccessiblePressable
        label={takenLabel}
        hint="Toggles today's dose adherence"
        accessibilityRole="checkbox"
        checked={med.taken}
        onPress={() => onToggle(med.id)}
        style={rowStyles.checkHitArea}
      >
        <View
          style={[
            rowStyles.check,
            {
              borderColor: med.taken ? colors.clay : colors.border,
              backgroundColor: med.taken ? colors.clay + "20" : "transparent",
            },
          ]}
        >
          {med.taken ? <Text style={[rowStyles.checkMark, { color: colors.clay }]}>✓</Text> : null}
        </View>
      </AccessiblePressable>

      <AccessiblePressable
        label={takenLabel}
        hint="Toggles today's dose adherence"
        accessibilityRole="checkbox"
        checked={med.taken}
        onPress={() => onToggle(med.id)}
        style={rowStyles.rowBody}
      >
        <View style={[rowStyles.pillIcon, { backgroundColor: colors.clay + "15" }]}>
          <Pill size={16} color={colors.clay} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              rowStyles.name,
              { color: med.taken ? colors.inkMuted : colors.foreground },
              med.taken && rowStyles.nameTaken,
            ]}
          >
            {med.name}
          </Text>
          <Text style={[rowStyles.meta, { color: colors.inkMuted }]}>
            Take at {med.time} · {med.dosage}
          </Text>
          {med.instructionTag ? <InstructionTag label={med.instructionTag} /> : null}
        </View>
      </AccessiblePressable>

      <AccessiblePressable
        label={`Open ${med.name} details`}
        hint="Opens medication detail screen"
        onPress={() => router.push(`/medication/${med.id}`)}
        style={rowStyles.detailHitArea}
      >
        <ChevronRight size={18} color={colors.inkMuted} />
      </AccessiblePressable>
    </View>
  );
}

export default function MedicationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [tab, setTab] = useState<Tab>("today");
  const { meds, toggle, pct, taken } = usePatientMedications();
  const today = new Date();

  useFocusEffect(
    useCallback(() => {
      /* hook subscribes to store — focus refresh optional */
    }, []),
  );

  const toggleMed = (id: string) => {
    void toggle(id);
  };

  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i));

  const sortedByTime = [...meds].sort((a, b) => {
    const parse = (t: string) => {
      const m = t.match(/(\d+)/);
      return m ? Number(m[1]) : 0;
    };
    return parse(a.time) - parse(b.time);
  });

  return (
    <View style={[s.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft size={24} color={colors.foreground} strokeWidth={2.5} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[s.title, { color: colors.foreground }]}>Medications</Text>
          <Text style={[s.dateLine, { color: colors.inkMuted }]}>
            {format(today, "EEEE, d MMMM")}
          </Text>
        </View>
        <View style={[s.pctBadge, { backgroundColor: colors.clay + "18" }]}>
          <Text style={[s.pctBadgeText, { color: colors.clay }]}>{pct}%</Text>
        </View>
      </View>

      <View style={[s.toggle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Pressable
          onPress={() => setTab("today")}
          style={[s.toggleBtn, tab === "today" && { backgroundColor: colors.ink }]}
        >
          <List size={16} color={tab === "today" ? "#fff" : colors.inkMuted} />
          <Text style={[s.toggleText, { color: tab === "today" ? "#fff" : colors.inkMuted }]}>
            Today
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab("timetable")}
          style={[s.toggleBtn, tab === "timetable" && { backgroundColor: colors.ink }]}
        >
          <CalendarDays size={16} color={tab === "timetable" ? "#fff" : colors.inkMuted} />
          <Text style={[s.toggleText, { color: tab === "timetable" ? "#fff" : colors.inkMuted }]}>
            Timetable
          </Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 32 }}
      >
        <Pressable
          onPress={() => router.push("/medications/refill-history")}
          style={[s.refillLink, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={[s.refillIcon, { backgroundColor: "#D35E50" + "15" }]}>
            <Package size={18} color="#D35E50" />
          </View>
          <Text style={[s.refillLinkText, { color: colors.foreground }]}>Refill Requests</Text>
          <ChevronRight size={18} color={colors.inkMuted} />
        </Pressable>

        <View style={s.summaryRow}>
          <View style={[s.progressCard, s.summaryHalf, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.progressTitle, { color: colors.foreground }]}>
              {taken} of {meds.length} doses taken
            </Text>
            <Text style={[s.progressSub, { color: colors.inkMuted }]}>
              Tap a dose for instructions, interactions, and refill info.
            </Text>
            <View style={[s.track, { backgroundColor: colors.border }]}>
              <View style={[s.fill, { backgroundColor: colors.clay, width: `${pct}%` }]} />
            </View>
          </View>

          <View style={[s.adherenceCard, s.summaryHalf, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.adherenceLabel, { color: colors.inkMuted }]}>OVERALL ADHERENCE</Text>
            <Text style={[s.adherencePct, { color: colors.foreground }]}>0%</Text>
            <View style={[s.track, { backgroundColor: colors.border, marginTop: 12 }]}>
              <View style={[s.fill, { backgroundColor: colors.border, width: "0%" }]} />
            </View>
          </View>
        </View>

        {tab === "timetable" ? (
          <>
            <Text style={[s.weekLabel, { color: colors.inkMuted }]}>THIS WEEK</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              <View style={s.weekRow}>
                {weekDays.map((day) => {
                  const active = isSameDay(day, today);
                  return (
                    <View
                      key={day.toISOString()}
                      style={[
                        s.dayCard,
                        {
                          backgroundColor: active ? colors.ink : colors.surface,
                          borderColor: active ? colors.ink : colors.border,
                        },
                      ]}
                    >
                      <Text style={[s.dayName, { color: active ? "#fff" : colors.inkMuted }]}>
                        {format(day, "EEE").toUpperCase()}
                      </Text>
                      <Text style={[s.dayNum, { color: active ? "#fff" : colors.foreground }]}>
                        {format(day, "d")}
                      </Text>
                      {active ? <View style={s.dayDot} /> : null}
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            <Text style={[s.sectionTitle, { color: colors.foreground }]}>Schedule · Today</Text>
            <View style={s.timeline}>
              {sortedByTime.map((med, i) => (
                <View key={med.id} style={s.timelineRow}>
                  <Text style={[s.timeLabel, { color: colors.clay }]}>{med.time}</Text>
                  <View style={s.timelineRail}>
                    <View style={[s.timelineDot, { borderColor: colors.border, backgroundColor: colors.surface }]} />
                    {i < sortedByTime.length - 1 ? (
                      <View style={[s.timelineLine, { backgroundColor: colors.border }]} />
                    ) : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <DoseRow med={med} colors={colors} onToggle={toggleMed} />
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>Today&apos;s doses</Text>
            <Animated.View entering={FadeInDown.duration(300)} style={{ gap: 12 }}>
              {meds.map((med) => (
                <DoseRow key={med.id} med={med} colors={colors} onToggle={toggleMed} />
              ))}
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const tagStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#B8735D12",
  },
  text: { fontSize: 11, fontFamily: "DMSans_500Medium", color: "#B8735D" },
});

const rowStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 72,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  checkHitArea: {
    minWidth: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 12,
    alignSelf: "stretch",
  },
  rowBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 48,
    paddingVertical: 12,
    paddingRight: 8,
  },
  detailHitArea: {
    minWidth: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingRight: 12,
    alignSelf: "stretch",
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: { fontSize: 12, fontFamily: "DMSans_700Bold" },
  pillIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 16, fontFamily: "DMSans_600SemiBold" },
  nameTaken: { textDecorationLine: "line-through", opacity: 0.65 },
  meta: { fontSize: 13, fontFamily: "DMSans_400Regular", marginTop: 2 },
});

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 28, fontFamily: "Fraunces_500Medium", letterSpacing: -0.5 },
  dateLine: { fontSize: 13, fontFamily: "DMSans_400Regular", marginTop: 2 },
  pctBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, marginTop: 4 },
  pctBadgeText: { fontSize: 13, fontFamily: "DMSans_600SemiBold" },
  toggle: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
  },
  toggleText: { fontSize: 14, fontFamily: "DMSans_600SemiBold" },
  refillLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  refillIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  refillLinkText: { flex: 1, fontSize: 16, fontFamily: "DMSans_600SemiBold" },
  progressCard: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  summaryHalf: {
    flex: 1,
    marginBottom: 0,
    minHeight: 132,
    justifyContent: "space-between",
  },
  progressTitle: { fontSize: 17, fontFamily: "DMSans_600SemiBold" },
  progressSub: { fontSize: 13, fontFamily: "DMSans_400Regular", marginTop: 6, lineHeight: 20 },
  track: { height: 4, borderRadius: 2, marginTop: 14, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 2 },
  adherenceCard: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
  },
  adherenceLabel: {
    fontSize: 10,
    fontFamily: "DMSans_600SemiBold",
    letterSpacing: 1,
  },
  adherencePct: { fontSize: 36, fontFamily: "Fraunces_400Regular", marginTop: 4 },
  weekLabel: {
    fontSize: 10,
    fontFamily: "DMSans_600SemiBold",
    letterSpacing: 1,
    marginBottom: 10,
  },
  weekRow: { flexDirection: "row", gap: 8 },
  dayCard: {
    width: 52,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  dayName: { fontSize: 10, fontFamily: "DMSans_600SemiBold" },
  dayNum: { fontSize: 18, fontFamily: "DMSans_600SemiBold", marginTop: 2 },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#fff",
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "Fraunces_500Medium",
    marginBottom: 14,
  },
  timeline: { gap: 4 },
  timelineRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  timeLabel: {
    width: 58,
    fontSize: 12,
    fontFamily: "DMSans_600SemiBold",
    paddingTop: 18,
    textAlign: "right",
  },
  timelineRail: { width: 16, alignItems: "center", paddingTop: 20 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
  timelineLine: { width: 2, flex: 1, minHeight: 48, marginTop: 4 },
});
