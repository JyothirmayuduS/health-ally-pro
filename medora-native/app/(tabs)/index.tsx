/**
 * Dashboard – Visual Hierarchy Edition
 *
 * Eye-flow zones:
 *  ① HEADER         – identity anchor (top-left dominance)
 *  ② HERO CARD      – LARGEST element, highest contrast → eye lands here first
 *  ③ STAT STRIP     – compact, horizontal scan (left-to-right F-pattern)
 *  ④ APPOINTMENTS   – clean list with strong doctor name as scan anchor
 *  ⑤ MEDICATIONS    – secondary utility; checkbox affordance drives action
 *  ⑥ REPORTS        – low-priority browse; smallest text, last zone
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import Animated, {
  FadeInDown,
  FadeIn,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import {
  ArrowRight,
  CalendarDays,
  Clock4,
  Stethoscope,
  MessageCircle,
  Video,
  ChefHat,
  Sparkles,
  FileText,
  ChevronRight,
  Phone,
  Pill,
  Bell,
  Moon,
  UtensilsCrossed,
} from "lucide-react-native";
import { format, isSameDay, startOfToday } from "date-fns";
import {
  appointments as mockAppointments,
  doctors as mockDoctors,
  reports,
  patient as mockPatient,
  getNextMealPreview,
} from "@/lib/mock-data";
import { usePatientMedications } from "@/hooks/usePatientMedications";
import {
  formatRxRelative,
  listPatientPrescriptions,
  subscribePatientRx,
  type PatientRxRecord,
} from "@/lib/patient-prescription-store";
import { fetchMobileDashboard } from "@/lib/supabase-queries";
import { LiveQueueHeroCard } from "@/components/patient/LiveQueueHeroCard";
import { DashboardHeader } from "@/components/ui/DashboardHeader";
import { Avatar } from "@/components/ui/Avatar";
import { useTheme } from "@/theme/ThemeProvider";
import { checkNotificationPermission } from "@/lib/notifications";
// ─── helpers ──────────────────────────────────────────────────
function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function statusLabel(status: string) {
  if (status === "in-queue") return "In Queue";
  if (status === "upcoming") return "Upcoming";
  if (status === "completed") return "Completed";
  return status;
}

function statusColor(status: string, colors: any) {
  if (status === "in-queue") return colors.clay;
  if (status === "upcoming") return "#4CAF7D";
  return colors.inkMuted;
}

// ─── Professional Med Card ────────────────────────────────────
function MedCard({ med, colors, delay, onToggle }: { med: any; colors: any; delay: number; onToggle: (id: string, next: boolean) => void }) {
  const router = useRouter();
  const taken = med.taken;
  const cardScale = useSharedValue(1);
  const checkScale = useSharedValue(taken ? 1 : 0);
  const checkProgress = useSharedValue(taken ? 1 : 0);

  const toggle = useCallback((e?: any) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const next = !taken;
    onToggle(med.id, next);

    cardScale.value = withSequence(
      withTiming(0.96, { duration: 80 }),
      withSpring(1, { damping: 14, stiffness: 200 })
    );

    checkScale.value = next
      ? withSequence(withTiming(0, { duration: 60 }), withSpring(1, { damping: 10, stiffness: 240 }))
      : withTiming(0, { duration: 150 });

    checkProgress.value = withTiming(next ? 1 : 0, { duration: 250 });
  }, [taken, med.id, onToggle]);

  // Handle external state sync (e.g. when returning from Med Details modal)
  React.useEffect(() => {
    checkScale.value = withSpring(med.taken ? 1 : 0);
    checkProgress.value = withTiming(med.taken ? 1 : 0);
  }, [med.taken]);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    borderColor: checkProgress.value > 0.5 ? colors.clay : colors.border,
  }));

  const checkFillStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  const checkWrapStyle = useAnimatedStyle(() => ({
    backgroundColor: checkProgress.value > 0.5 ? `rgba(182,120,92,0.15)` : "transparent",
  }));

  const hour = parseInt((med.time || "8:00").split(":")[0], 10);
  const timeBg = hour < 12 ? "#FFF4DC" : "#E8F5E9";
  const timeColor = hour < 12 ? "#B8860B" : "#388E3C";

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(delay)}>
      <Pressable 
        onPress={() => router.push(`/medication/${med.id}`)}
        onPressIn={() => cardScale.value = withTiming(0.98, { duration: 100 })}
        onPressOut={() => cardScale.value = withSpring(1, { damping: 14, stiffness: 200 })}
        accessibilityRole="button"
        accessibilityLabel={`${med.name}, ${med.dosage}`}
        accessibilityHint="Opens medication details"
      >
        <Animated.View style={[mc.card, { backgroundColor: colors.surface }, cardAnimStyle]} pointerEvents="box-none">
          <View style={mc.topRow} pointerEvents="box-none">
            <View style={[mc.badge, { backgroundColor: timeBg }]}>
              <Text style={[mc.badgeText, { color: timeColor }]}>{med.time}</Text>
            </View>
            <Pressable
              onPress={toggle}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              accessibilityRole="checkbox"
              accessibilityLabel={taken ? `Mark ${med.name} as not taken` : `Mark ${med.name} as taken`}
              accessibilityHint="Toggles today's dose adherence"
              accessibilityState={{ checked: taken }}
            >
              <Animated.View style={[mc.checkWrap, { borderColor: taken ? colors.clay : colors.border }, checkWrapStyle]}>
                <Animated.View style={[mc.checkFill, { backgroundColor: colors.clay }, checkFillStyle]}>
                  <Text style={mc.checkMark}>✓</Text>
                </Animated.View>
              </Animated.View>
            </Pressable>
          </View>
          
          <View style={mc.infoWrap} pointerEvents="none">
            <View style={mc.iconWrap}>
              <Pill size={18} color={taken ? colors.inkMuted : colors.clay} />
            </View>
            <Text style={[mc.name, { color: taken ? colors.inkMuted : colors.foreground }, taken && mc.nameStruck]} numberOfLines={1}>
              {med.name}
            </Text>
            <Text style={[mc.dosage, { color: colors.inkMuted }, taken && mc.nameStruck]}>{med.dosage}</Text>
          </View>

          <View style={mc.bottomRow} pointerEvents="none">
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 }}>
              <Clock4 size={12} color={colors.inkMuted} strokeWidth={1.75} />
              <Text style={[mc.takeAt, { color: colors.inkMuted }, taken && mc.nameStruck]}>Take at {med.time}</Text>
            </View>
            {med.instructionTag ? (
              <View style={mc.tagWrap}>
                {med.instructionTag.toLowerCase().includes("food") ? (
                  <UtensilsCrossed size={11} color="#B8735D" strokeWidth={2} />
                ) : med.instructionTag.toLowerCase().includes("bed") ? (
                  <Moon size={11} color="#B8735D" strokeWidth={2} />
                ) : (
                  <Pill size={11} color="#B8735D" strokeWidth={2} />
                )}
                <Text style={mc.tagText}>{med.instructionTag}</Text>
              </View>
            ) : null}
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const mc = StyleSheet.create({
  card: { 
    width: 185, 
    borderRadius: 28, 
    padding: 18, 
    justifyContent: "space-between", 
    height: 185,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText: { fontSize: 11, fontFamily: "DMSans_600SemiBold", letterSpacing: 0.3 },
  checkWrap: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  checkFill: { width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  checkMark: { color: "#fff", fontSize: 11, fontFamily: "DMSans_700Bold" },
  infoWrap: { marginTop: 14 },
  iconWrap: { marginBottom: 6 },
  name: { fontSize: 16, fontFamily: "Fraunces_500Medium", letterSpacing: -0.2 },
  nameStruck: { textDecorationLine: "line-through", opacity: 0.4 },
  dosage: { fontSize: 13, fontFamily: "DMSans_400Regular", marginTop: 2, opacity: 0.8 },
  bottomRow: { marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(0,0,0,0.04)" },
  takeAt: { fontSize: 12, fontFamily: "DMSans_500Medium" },
  tagWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: "#B8735D12",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: { fontSize: 11, fontFamily: "DMSans_500Medium", color: "#B8735D" },
});


// ─── component ────────────────────────────────────────────────
export default function DashboardScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const today = startOfToday();
  const [appointments, setAppointments] = useState(mockAppointments);
  const [doctors, setDoctors] = useState(mockDoctors);
  const [patient, setPatient] = useState(mockPatient);
  const [supabaseConnected, setSupabaseConnected] = useState(false);

  useEffect(() => {
    fetchMobileDashboard().then(({ appointments: a, doctors: d, patient: p, connected }) => {
      setAppointments(a);
      setDoctors(d);
      setPatient(p);
      setSupabaseConnected(connected);
    });
  }, []);

  const inQueue = appointments.find((a) => a.status === "in-queue");
  const queueDoctor = inQueue
    ? doctors.find((d) => d.id === inQueue.doctorId)
    : null;

  // Hero: strictly sync with queue source of truth
  const nextAppt = inQueue ?? appointments.find((a) => a.status === "upcoming" && new Date(a.date) >= today);
  const nextDoc = nextAppt
    ? doctors.find((d) => d.id === nextAppt.doctorId)
    : null;

  const recentAppts = appointments.filter((a) => a.status !== "completed").slice(0, 3);
  const recentReports = reports.slice(0, 2);

  // Medication state & stats — AsyncStorage-backed patient-meds-store
  const { meds: medsList, toggle: toggleMedStore, taken: takenMeds, total: totalMeds, pct: medPct } =
    usePatientMedications();
  const [hasNotifs, setHasNotifs] = useState(true);
  const [eRxList, setERxList] = useState<PatientRxRecord[]>(() => listPatientPrescriptions());
  const nextMeal = getNextMealPreview();

  useEffect(() => {
    return subscribePatientRx(() => setERxList(listPatientPrescriptions()));
  }, []);

  // Check notification status
  const checkNotifs = async () => {
    const granted = await checkNotificationPermission();
    setHasNotifs(granted);
  };

  // Check notification status on focus
  useFocusEffect(
    useCallback(() => {
      checkNotifs();
    }, [])
  );

  const handleMedToggle = useCallback((id: string, next: boolean) => {
    void toggleMedStore(id);
  }, [toggleMedStore]);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      {/* ① HEADER ─────────────────────────────────────────── */}
      <DashboardHeader
        name={patient.name}
        initials={patient.initials}
        notificationCount={3}
        onNotificationPress={() => router.push("/notifications")}
        onSettingsPress={() => router.push("/settings/edit")}
        onAvatarPress={() => router.push("/(tabs)/profile")}
        secureMode
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* 🔔 NOTIFICATION PROMPT (Visible only if not granted) ─── */}
        {!hasNotifs && (
          <Animated.View entering={FadeInDown.duration(400).delay(50)}>
            <Pressable 
              onPress={() => router.push("/notifications/setup")}
              style={[s.notifBanner, { backgroundColor: colors.clay + "10", borderColor: colors.clay + "30" }]}
            >
              <View style={[s.notifIconWrap, { backgroundColor: colors.clay }]}>
                <Bell size={16} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.notifTitle, { color: colors.foreground }]}>Enable Live Updates</Text>
                <Text style={[s.notifSub, { color: colors.inkMuted }]}>Stay synchronized with your care team.</Text>
              </View>
              <ChevronRight size={16} color={colors.clay} />
            </Pressable>
          </Animated.View>
        )}

        {/* ── Section label ─────────────────────────── */}
        <Animated.View entering={FadeIn.duration(400).delay(80)}>
          <Text style={[s.dateLabel, { color: colors.inkMuted }]}>
            {format(today, "EEEE, d MMMM")}
          </Text>
        </Animated.View>

        {/* ② HERO CARD ─────────────────────────────────────── */}
        {/* Largest element – highest contrast – first focal point  */}
        <Animated.View entering={FadeInDown.duration(500).delay(100).springify()}>
          {nextAppt && nextDoc ? (
            nextAppt.status === "in-queue" ? (
              <LiveQueueHeroCard appointment={nextAppt} doctor={nextDoc} />
            ) : (
            <Pressable
              onPress={() => router.push("/(tabs)/queue")}
              style={[
                s.heroCard,
                { backgroundColor: colors.ink },
              ]}
            >
                <>
                  <View style={s.heroBadge}>
                    <View style={[s.heroDot, { backgroundColor: "#4CAF7D" }]} />
                    <Text style={[s.heroBadgeText, { color: colors.primaryForeground }]}>Next appointment</Text>
                  </View>
                  <View style={s.heroDocRow}>
                    <Avatar initials={nextDoc.initials} size="xl" variant="ink" />
                    <View style={{ flex: 1 }}>
                      <Text style={[s.heroDocName, { color: colors.primaryForeground }]}>{nextDoc.name}</Text>
                      <Text style={[s.heroDocSpec, { color: colors.primaryForeground, opacity: 0.65 }]}>
                        {nextDoc.specialty} · {nextDoc.hospital}
                      </Text>
                    </View>
                  </View>
                  <View style={s.heroMeta}>
                    <View style={s.heroChip}>
                      <CalendarDays size={13} color={colors.primaryForeground} strokeWidth={1.75} opacity={0.7} />
                      <Text style={[s.heroChipText, { color: colors.primaryForeground }]}>
                        {isSameDay(new Date(nextAppt.date), today) ? "Today" : format(new Date(nextAppt.date), "MMM d")}
                      </Text>
                    </View>
                    <View style={s.heroChip}>
                      <Clock4 size={13} color={colors.primaryForeground} strokeWidth={1.75} opacity={0.7} />
                      <Text style={[s.heroChipText, { color: colors.primaryForeground }]}>{nextAppt.time}</Text>
                    </View>
                  </View>
                  <View style={s.heroCta}>
                    <Text style={[s.heroCtaText, { color: colors.primaryForeground }]}>View details</Text>
                    <ArrowRight size={15} color={colors.primaryForeground} strokeWidth={2} />
                  </View>
                </>
            </Pressable>
            )
          ) : (
            /* Empty state hero */
            <Pressable
              onPress={() => router.push("/(tabs)/book")}
              style={[s.heroCard, s.heroEmpty, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Stethoscope size={32} color={colors.inkMuted} strokeWidth={1.3} />
              <Text style={[s.emptyTitle, { color: colors.foreground }]}>No upcoming appointments</Text>
              <Text style={[s.emptySubtitle, { color: colors.inkMuted }]}>Book a consultation with 80+ specialists</Text>
              <View style={[s.bookBtn, { backgroundColor: colors.ink }]}>
                <Text style={[s.bookBtnText, { color: colors.primaryForeground }]}>Book Now</Text>
              </View>
            </Pressable>
          )}
        </Animated.View>


        {/* ③ STAT STRIP ─────────────────────────────────────── */}
        {/* Compact row – horizontal scan anchors */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <View style={s.statRow}>
            {/* Medication adherence */}
            <View style={[s.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[s.statValue, { color: colors.foreground }]}>{medPct}%</Text>
              <Text style={[s.statLabel, { color: colors.inkMuted }]}>Adherence</Text>
            </View>
             {/* Total appointments */}
            <View style={[s.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[s.statValue, { color: colors.foreground }]}>
                {appointments.filter((a) => a.status === "completed").length}
              </Text>
              <Text style={[s.statLabel, { color: colors.inkMuted }]}>Visits done</Text>
            </View>
            {/* Reports count */}
            <View style={[s.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[s.statValue, { color: colors.foreground }]}>{reports.length}</Text>
              <Text style={[s.statLabel, { color: colors.inkMuted }]}>Reports</Text>
            </View>
          </View>
        </Animated.View>

        {/* ✧ HORIZONTAL MEDICATIONS ───────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400).delay(230)}>
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>Today's Medications</Text>
            <Pressable onPress={() => router.push("/medications")}>
              <Text style={[s.sectionLink, { color: colors.clay }]}>View all &gt;</Text>
            </Pressable>
          </View>

          <View style={[s.medProgressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={[s.sectionMeta, { color: colors.inkMuted }]}>
                {takenMeds} of {totalMeds} taken today
              </Text>
              <Text style={[s.statValue, { color: colors.foreground, fontSize: 20 }]}>{medPct}%</Text>
            </View>
            <View style={[s.medProgressTrack, { backgroundColor: colors.border, marginTop: 10, marginBottom: 0 }]}>
              <View style={[s.medProgressFill, { backgroundColor: colors.clay, width: `${medPct}%` }]} />
            </View>
          </View>
          
          <View style={{ height: 200, marginTop: 14 }}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12, gap: 14 }}
              style={{ marginHorizontal: -20 }}
              snapToInterval={199}
              decelerationRate="fast"
            >
              {medsList.map((med, i) => (
                <MedCard key={med.id} med={med} colors={colors} delay={200 + i * 80} onToggle={handleMedToggle} />
              ))}
            </ScrollView>
          </View>
        </Animated.View>

        {/* 🥗 NEXT MEAL PREVIEW ─────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(450).delay(250)}>
           <View style={s.sectionHeader}>
              <Text style={[s.sectionTitle, { color: colors.foreground }]}>Your Meal Plan</Text>
              <Pressable onPress={() => router.push("/(tabs)/nutrition")}>
                <Text style={[s.sectionLink, { color: colors.clay }]}>View all</Text>
              </Pressable>
           </View>
           
           <Pressable 
              onPress={() => router.push("/(tabs)/nutrition")}
              style={[s.nextMealCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
           >
              <View style={[s.mealIconWrap, { backgroundColor: colors.clay + "15" }]}>
                 <ChefHat size={20} color={colors.clay} />
              </View>
              <View style={{ flex: 1 }}>
                 <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={[s.mealCategory, { color: colors.inkMuted }]}>
                      NEXT: {nextMeal?.mealType?.toUpperCase() ?? "LUNCH"}
                    </Text>
                    <Text style={[s.mealKcal, { color: colors.foreground }]}>{nextMeal?.calories ?? 520} kcal</Text>
                 </View>
                 <Text style={[s.nextMealName, { color: colors.foreground }]}>
                   {nextMeal?.name ?? "Roasted Chicken & Quinoa"}
                 </Text>
                 <View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
                    {nextMeal?.lactoseFree ? (
                      <View style={[s.clinicalTag, { backgroundColor: "#4CAF7D20" }]}>
                         <Text style={[s.clinicalTagText, { color: "#4CAF7D" }]}>Lactose-Free</Text>
                      </View>
                    ) : null}
                    <View style={[s.clinicalTag, { backgroundColor: colors.clay + "20" }]}>
                       <Text style={[s.clinicalTagText, { color: colors.clay }]}>Thyroid-Sync</Text>
                    </View>
                 </View>
                 <Text style={[s.nextMealSub, { color: colors.inkMuted, marginTop: 6 }]}>
                   High Protein · Metabolic support
                 </Text>
              </View>
              <ArrowRight size={18} color={colors.border} />
           </Pressable>
        </Animated.View>

        {/* ④ APPOINTMENTS LIST ─────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(450).delay(260)}>
          {/* Section header */}
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>
              Appointments
            </Text>
            <Pressable onPress={() => router.push("/visits")}>
              <Text style={[s.sectionLink, { color: colors.clay }]}>View all</Text>
            </Pressable>
          </View>

          <View style={[s.apptList, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
            {recentAppts.map((appt, i) => {
              const doc = doctors.find((d) => d.id === appt.doctorId);
              if (!doc) return null;
              const isLast = i === recentAppts.length - 1;
              return (
                <View
                  key={appt.id}
                  style={[
                    s.apptRow,
                    { flexDirection: "column", alignItems: "stretch", paddingVertical: 12 },
                    !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                  ]}
                >
                  <Pressable onPress={() => router.push(`/visits/${appt.id}`)} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <Avatar initials={doc.initials} size="md" />

                    <View style={s.apptText}>
                      <Text style={[s.apptName, { color: colors.foreground }]}>
                        {doc.name}
                      </Text>
                      <Text style={[s.apptMeta, { color: colors.inkMuted }]}>
                        {doc.specialty}{"  ·  "}
                        {isSameDay(new Date(appt.date), today)
                          ? `Today, ${appt.time}`
                          : `${format(new Date(appt.date), "MMM d")}, ${appt.time}`}
                      </Text>
                    </View>

                    <View
                      style={[
                        s.statusPill,
                        { backgroundColor: statusColor(appt.status, colors) + "1A" },
                      ]}
                    >
                      <Text
                        style={[
                          s.statusText,
                          { color: statusColor(appt.status, colors) },
                        ]}
                      >
                        {statusLabel(appt.status)}
                      </Text>
                    </View>
                  </Pressable>

                  {/* Active Actions Row */}
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 16, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(0,0,0,0.05)" }}>
                    <Pressable style={[s.quickBtn, { backgroundColor: colors.surface , borderColor: colors.border, flex: 1 }]} onPress={() => {}}>
                      <MessageCircle size={15} color={colors.foreground} />
                      <Text style={[s.quickBtnText, { color: colors.foreground }]}>Chat</Text>
                    </Pressable>
                    <Pressable style={[s.quickBtn, { backgroundColor: colors.surface , borderColor: colors.border, flex: 1 }]} onPress={() => {}}>
                      <Phone size={15} color={colors.foreground} />
                      <Text style={[s.quickBtnText, { color: colors.foreground }]}>Audio</Text>
                    </Pressable>
                    <Pressable 
                      style={[s.quickBtn, { backgroundColor: colors.clay + "1A", borderColor: colors.clay + "33", flex: 1 }]} 
                      onPress={() => router.push("/care-team/video-call")}
                    >
                      <Video size={15} color={colors.clay} />
                      <Text style={[s.quickBtnText, { color: colors.clay }]}>Video</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* ⑥ RECENT REPORTS ───────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(450).delay(380)}>
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>
              Recent Reports
            </Text>
            <Pressable onPress={() => router.push("/(tabs)/reports")}>
              <Text style={[s.sectionLink, { color: colors.clay }]}>View all</Text>
            </Pressable>
          </View>

          <View
            style={[
              s.reportCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {recentReports.map((r, i) => (
              <Pressable
                key={r.id}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/reports/[reportId]",
                    params: { reportId: r.id },
                  })
                }
                style={[
                  s.reportRow,
                  i < recentReports.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                {/* Icon */}
                <View style={[s.reportIcon, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <FileText size={15} color={colors.inkMuted} strokeWidth={1.75} />
                </View>

                <View style={s.reportText}>
                  <Text style={[s.reportTitle, { color: colors.foreground }]} numberOfLines={1}>
                    {r.title}
                  </Text>
                  <Text style={[s.reportMeta, { color: colors.inkMuted }]}>
                    {r.type}{"  ·  "}
                    {new Date(r.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </View>

                <ChevronRight size={16} color={colors.inkMuted} strokeWidth={1.75} />
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* 🆕 PAST PRESCRIPTIONS ─────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(450).delay(390)}>
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>Past Prescriptions</Text>
            <Pressable onPress={() => router.push("/prescriptions")}>
              <Text style={[s.sectionLink, { color: colors.clay }]}>View all</Text>
            </Pressable>
          </View>
          <View style={[s.reportCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {(eRxList.length > 0 ? eRxList.slice(0, 2) : []).map((rx, i, arr) => (
              <Pressable
                key={rx.id}
                onPress={() => router.push(`/prescriptions/${rx.rx_number}`)}
                style={[
                  s.reportRow,
                  i < arr.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <View style={[s.reportIcon, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Pill size={15} color={colors.clay} strokeWidth={1.75} />
                </View>
                <View style={s.reportText}>
                  <Text style={[s.reportTitle, { color: colors.foreground }]} numberOfLines={1}>
                    {rx.diagnosis}
                  </Text>
                  <Text style={[s.reportMeta, { color: colors.inkMuted }]}>
                    {rx.rx_number} · {rx.doctor_name} · {formatRxRelative(rx.sent_at)}
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.inkMuted} strokeWidth={1.75} />
              </Pressable>
            ))}
            <Pressable
              onPress={() => router.push("/prescriptions")}
              style={[
                s.reportRow,
                eRxList.length > 0 && {
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: colors.border,
                },
              ]}
            >
              <View style={[s.reportIcon, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Pill size={15} color={colors.clay} strokeWidth={1.75} />
              </View>
              <View style={s.reportText}>
                <Text style={[s.reportTitle, { color: colors.foreground }]}>Medication history</Text>
                <Text style={[s.reportMeta, { color: colors.inkMuted }]}>
                  {eRxList.length + medsList.length} entries · Last update {formatRxRelative(eRxList[0]?.sent_at ?? new Date().toISOString())}
                </Text>
              </View>
              <ChevronRight size={16} color={colors.inkMuted} strokeWidth={1.75} />
            </Pressable>
          </View>
        </Animated.View>

        {/* ⑦ YOUR CARE TEAM ───────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(450).delay(420)}>
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>Your Care Team</Text>
            <Pressable onPress={() => router.push("/visits")}>
               <Text style={[s.sectionLink, { color: colors.clay }]}>View all</Text>
            </Pressable>
          </View>
          <View style={[s.careTeamCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {doctors.filter((d) => appointments.some((a) => a.doctorId === d.id)).slice(0, 2).map((doc, idx) => (
              <Pressable 
                key={doc.id} 
                onPress={() => router.push(`/doctor/${doc.id}`)}
                style={[s.careTeamRow, idx !== 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}
              >
                <Avatar initials={doc.initials} size="md" />
                <View style={{ flex: 1 }}>
                  <Text style={[s.careTeamName, { color: colors.foreground }]}>{doc.name}</Text>
                  <Text style={[s.careTeamSpec, { color: colors.inkMuted }]}>{doc.specialty}</Text>
                </View>
                <View style={s.careTeamActions}>
                  <Pressable 
                    style={[s.careBtn, { backgroundColor: "#4CAF50" + "1A" }]} 
                    onPress={(e) => { e.stopPropagation(); }}
                  >
                    <Phone size={14} color="#4CAF50" />
                  </Pressable>
                  <Pressable style={[s.careBtn, { backgroundColor: colors.clay + "1A" }]} onPress={(e) => { e.stopPropagation(); }}>
                    <MessageCircle size={16} color={colors.clay} />
                  </Pressable>
                  <Pressable 
                    style={[s.careBtn, { backgroundColor: colors.ink + "1A" }]} 
                    onPress={(e) => { e.stopPropagation(); router.push("/care-team/video-call"); }}
                  >
                    <Video size={16} color={colors.ink} />
                  </Pressable>
                </View>
              </Pressable>
            ))}
        </View>
      </Animated.View>
    </ScrollView>

      {/* 🔮 MEDORA AI FLOATING ACTION BUTTON ────────────────── */}
      <Animated.View 
        entering={ZoomIn.duration(500).delay(600)}
        style={s.fabWrapper}
      >
        <Pressable 
          onPress={() => router.push("/ai-assistant")}
          style={[s.fab, { backgroundColor: colors.ink }]}
        >
          <Sparkles size={24} color="#FFF" />
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── styles ────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1 },
  // ── FAB ────────────────────────────────────────────────────
  fabWrapper: {
    position: "absolute",
    bottom: 24,
    right: 20,
    zIndex: 999,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#B6785C",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, gap: 24 },

  dateLabel: {
    fontSize: 12,
    fontFamily: "DMSans_500Medium",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: 6,
  },

  // ── Notification Banner ───────────────────────────────
  notifBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    marginBottom: 8,
  },
  notifIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  notifTitle: {
    fontSize: 15,
    fontFamily: "DMSans_600SemiBold",
  },
  notifSub: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    marginTop: 1,
  },

  // ── ② Hero ─────────────────────────────────────────────────
  heroCard: {
    borderRadius: 32,
    padding: 30,
    gap: 22,
    shadowColor: "#1E3A32",
    shadowOpacity: 0.16,
    shadowRadius: 36,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
  heroEmpty: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 44,
    shadowOpacity: 0.05,
    shadowColor: "#000",
    shadowRadius: 16,
    elevation: 3,
  },

  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  heroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroBadgeText: {
    fontSize: 11,
    fontFamily: "DMSans_500Medium",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    opacity: 0.75,
  },

  heroDocRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  heroDocName: {
    fontSize: 22,
    fontFamily: "Fraunces_500Medium",
    letterSpacing: -0.6,
    lineHeight: 28,
  },
  heroDocSpec: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    marginTop: 3,
    lineHeight: 18,
  },

  heroMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  heroChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroChipText: {
    fontSize: 12,
    fontFamily: "DMSans_500Medium",
    opacity: 0.9,
  },

  heroCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 4,
  },
  heroCtaText: {
    fontSize: 13,
    fontFamily: "DMSans_600SemiBold",
    letterSpacing: 0.2,
  },

  queueBigNumber: {
    fontSize: 48,
    fontFamily: "Fraunces_500Medium",
    letterSpacing: -2,
    lineHeight: 52,
  },
  queueOf: {
    fontSize: 28,
    opacity: 0.45,
    fontFamily: "Fraunces_400Regular",
  },
  waitPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 6,
  },
  waitPillText: {
    fontSize: 12,
    fontFamily: "DMSans_600SemiBold",
  },
  heroDocLine: {
    fontSize: 15,
    fontFamily: "DMSans_500Medium",
    opacity: 0.85,
    marginTop: -8,
  },
  queueTrackRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingVertical: 8,
    marginTop: 4,
  },
  queueTrackSlot: {
    alignItems: "center",
    flex: 1,
  },
  queueTrackCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  queueTrackOffset: {
    fontSize: 9,
    color: "rgba(255,255,255,0.45)",
    marginTop: 4,
    fontFamily: "DMSans_500Medium",
  },

  emptyTitle: {
    fontSize: 17,
    fontFamily: "Fraunces_400Regular",
    letterSpacing: -0.3,
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    textAlign: "center",
    lineHeight: 19,
  },
  bookBtn: {
    marginTop: 8,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  bookBtnText: {
    fontSize: 14,
    fontFamily: "DMSans_600SemiBold",
  },

  // ── ③ Stat strip ───────────────────────────────────────────
  statRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontFamily: "Fraunces_400Regular",
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: "DMSans_500Medium",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  // ── Section headers ─────────────────────────────────────────
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Fraunces_500Medium",
    letterSpacing: -0.3,
  },
  sectionLink: {
    fontSize: 12,
    fontFamily: "DMSans_600SemiBold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  sectionMeta: {
    fontSize: 12,
    fontFamily: "DMSans_500Medium",
  },

  // ── ④ Appointments ─────────────────────────────────────────
  apptList: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#FDFBF9",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  apptRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  apptText: {
    flex: 1,
  },
  apptName: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  apptMeta: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    marginTop: 3,
    lineHeight: 18,
    opacity: 0.8,
  },
  statusPill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "DMSans_600SemiBold",
    letterSpacing: 0.3,
  },

  // ── ⑤ Medications ──────────────────────────────────────────
  medProgressTrack: {
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
  medProgressCard: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 4,
  },
  medProgressFill: {
    height: 3,
    borderRadius: 2,
  },
  medCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  medRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  checkbox: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    fontSize: 15,
    fontFamily: "DMSans_500Medium",
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  medNameTaken: {
    textDecorationLine: "line-through",
    opacity: 0.55,
  },
  medSub: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    marginTop: 2,
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  timeBadgeText: {
    fontSize: 10,
    fontFamily: "DMSans_500Medium",
    letterSpacing: 0.3,
  },

  // ── ⑥ Reports ──────────────────────────────────────────────
  reportCard: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  reportRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  reportIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.03)"
  },
  reportText: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 15,
    fontFamily: "DMSans_600SemiBold",
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  reportMeta: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    marginTop: 3,
    opacity: 0.7,
  },

  // ── New Data Additions ──────────────────────────────────────
  insightCard: { 
    flexDirection: "row", 
    padding: 20, 
    borderRadius: 24, 
    gap: 16, 
    alignItems: "flex-start", 
    marginTop: 6,
    shadowColor: "#B6785C",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  },
  insightIconWrap: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(182,120,92,0.15)", alignItems: "center", justifyContent: "center" },
  insightTextWrap: { flex: 1, gap: 6 },
  insightTitle: { fontSize: 14, fontFamily: "DMSans_700Bold", letterSpacing: 0.5, textTransform: "uppercase" },
  insightBody: { fontSize: 13, fontFamily: "DMSans_400Regular", lineHeight: 22, opacity: 0.8 },

  vitalCard: { width: 130, padding: 16, borderRadius: 20, borderWidth: 1, gap: 8 },
  vitalIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  vitalValue: { fontSize: 18, fontFamily: "Fraunces_600SemiBold" },
  vitalLabel: { fontSize: 11, fontFamily: "DMSans_500Medium" },

  careTeamCard: { 
    borderRadius: 24, 
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  careTeamRow: { flexDirection: "row", padding: 18, alignItems: "center", gap: 14 },
  careTeamName: { fontSize: 16, fontFamily: "DMSans_600SemiBold", letterSpacing: -0.2 },
  careTeamSpec: { fontSize: 13, fontFamily: "DMSans_400Regular", marginTop: 2, opacity: 0.7 },
  careTeamActions: { flexDirection: "row", gap: 10 },
  careBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  quickBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 14, backgroundColor: "rgba(0,0,0,0.03)" },
  quickBtnText: { fontSize: 13, fontFamily: "DMSans_600SemiBold" },

  nextMealCard: { flexDirection: "row", padding: 20, borderRadius: 28, borderWidth: 1, alignItems: "center", gap: 16, shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  mealIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  mealCategory: { fontSize: 10, fontFamily: "DMSans_700Bold", letterSpacing: 1 },
  nextMealName: { fontSize: 16, fontFamily: "Fraunces_500Medium", marginTop: 2 },
  nextMealSub: { fontSize: 13, fontFamily: "DMSans_400Regular", marginTop: 2 },
  mealKcal: { fontSize: 13, fontFamily: "DMSans_600SemiBold" },
  
  // 📈 Charts & Activity
  chartCard: { borderRadius: 28, padding: 22, borderWidth: 1, marginBottom: 4 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  chartTitle: { fontSize: 15, fontFamily: 'Fraunces_500Medium' },
  chartMeta: { fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  chartBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  chartBadgeTxt: { fontSize: 11, fontFamily: 'DMSans_700Bold' },

  activityCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 24, borderWidth: 1, gap: 12, minWidth: 140 },
  activityIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  activityVal: { fontSize: 15, fontFamily: 'Fraunces_600SemiBold' },
  activityLabel: { fontSize: 10, fontFamily: 'DMSans_500Medium', marginTop: 1 },

  clinicalTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  clinicalTagText: { fontSize: 9, fontFamily: 'DMSans_700Bold', textTransform: 'uppercase' },
});
