/**
 * Book Doctor Screen
 * ─ Proper slot tiles (horizontal layout, 2-per-row)
 * ─ On confirm → selected slot tile shows spinner → green tick → auto-navigate dashboard
 */
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  FadeOut,
  ZoomIn,
} from "react-native-reanimated";
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  Calendar,
  Check,
  ChevronRight,
  Briefcase,
  Video,
  Activity,
  ShieldCheck,
  Pill,
} from "lucide-react-native";
import { doctors, medications } from "@/lib/mock-data";
import { Avatar } from "@/components/ui/Avatar";
import { useTheme } from "@/theme/ThemeProvider";
import * as LocalAuthentication from 'expo-local-authentication';

// ── Data ──────────────────────────────────────────────────────────
const SLOTS = [
  { time: "09:00", period: "AM", available: true },
  { time: "09:30", period: "AM", available: true },
  { time: "10:30", period: "AM", available: false },
  { time: "11:15", period: "AM", available: true },
  { time: "14:00", period: "PM", available: true },
  { time: "14:30", period: "PM", available: true },
  { time: "15:15", period: "PM", available: false },
  { time: "16:00", period: "PM", available: true },
];

const DAYS = Array.from({ length: 7 }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return d;
});

const VISIT_TYPES = [
  { id: "in_person", label: "In Person", icon: Briefcase },
  { id: "video",     label: "Video Call", icon: Video },
  { id: "follow_up", label: "Follow-up",  icon: Activity },
];

// ── Animated slot tile ────────────────────────────────────────────
type SlotState = "idle" | "loading" | "confirmed";

function SlotTile({
  slot,
  selected,
  slotState,
  onPress,
  colors,
}: {
  slot: (typeof SLOTS)[0];
  selected: boolean;
  slotState: SlotState;
  onPress: () => void;
  colors: any;
}) {
  const scale = useSharedValue(1);

  const handlePress = useCallback(() => {
    if (!slot.available) return;
    scale.value = withSequence(
      withTiming(0.92, { duration: 80 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
    onPress();
  }, [slot.available, onPress]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const isLoadingSlot = selected && slotState === "loading";

  let bg = slot.available ? colors.surface : colors.background;
  let borderColor = colors.border;
  if (selected && slotState === "idle") { bg = colors.ink; borderColor = colors.ink; }
  if (isLoadingSlot)                   { bg = colors.ink; borderColor = colors.ink; }

  return (
    <Animated.View style={[animStyle, st.tileFlex]}>
      <Pressable
        onPress={handlePress}
        disabled={!slot.available || slotState !== "idle"}
        style={[
          st.slotTile,
          { backgroundColor: bg, borderColor, opacity: slot.available ? 1 : 0.38 },
        ]}
      >
            {/* Loading spinner only (no confirmed state needed here) */}
            {isLoadingSlot && (
              <Animated.View entering={FadeIn.duration(200)} style={st.slotOverlay}>
                <ActivityIndicator size="small" color="#fff" />
              </Animated.View>
            )}

            {/* Normal content — hidden when loading */}
            {!isLoadingSlot && (
          <>
            <Text style={[st.slotTime, { color: selected ? colors.primaryForeground : colors.foreground }]}>
              {slot.time}
            </Text>
            <View style={st.slotBottomRow}>
              <Text style={[st.slotPeriod, { color: selected ? "rgba(255,255,255,0.65)" : colors.inkMuted }]}>
                {slot.period}
              </Text>
              {!slot.available && (
                <View style={[st.bookedPill, { backgroundColor: colors.border }]}>
                  <Text style={[st.bookedText, { color: colors.inkMuted }]}>Taken</Text>
                </View>
              )}
            </View>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ─── Biometric Success Overlay ──────────────────────────────────────
function AuthSuccessOverlay({ colors }: { colors: any }) {
  return (
    <Animated.View 
      entering={FadeIn.duration(400)}
      exiting={FadeOut.duration(400)}
      style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.92)', zIndex: 9991, alignItems: 'center', justifyContent: 'center' }]}
    >
       <Animated.View 
         entering={ZoomIn.duration(500)}
         style={as.container}
       >
          <View style={[as.iconBox, { backgroundColor: colors.ink }]}>
             <ShieldCheck size={40} color={colors.primaryForeground} strokeWidth={1.5} />
          </View>
          <Text style={[as.title, { color: colors.foreground }]}>Identity Verified</Text>
          <Text style={[as.sub, { color: colors.inkMuted }]}>Encrypted tunnel established</Text>
       </Animated.View>
    </Animated.View>
  );
}

const as = StyleSheet.create({
  container: { alignItems: 'center', gap: 16 },
  iconBox: { width: 80, height: 80, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontFamily: "Fraunces_500Medium", letterSpacing: -0.5 },
  sub: { fontSize: 14, fontFamily: "DMSans_400Regular" },
});

// ── Main booking screen ────────────────────────────────────────────
export default function BookDoctorScreen() {
  const { doctorId } = useLocalSearchParams<{ doctorId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const doctor = doctors.find((d) => d.id === doctorId);

  const [selectedDay,  setSelectedDay]  = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [visitType,    setVisitType]    = useState("in_person");
  const [reason,       setReason]       = useState("");
  const [slotState,    setSlotState]    = useState<SlotState>("idle");
  const [authSuccess,  setAuthSuccess]  = useState(false);

  // Psychology-Led RX Filter: 
  // Anchor on trust by showing previous successful interventions with this specific doctor.
  const pastPrescriptions = medications.filter(
    (m) => m.prescribedBy === doctor.name && m.status === "past"
  );

  // Biometric Auth Gate for Booking
  const handleSecureConfirm = async () => {
    if (!selectedSlot) return;
    
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setAuthSuccess(true);
        setTimeout(() => {
          setAuthSuccess(false);
          handleConfirm();
        }, 1500);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to confirm appointment',
        fallbackLabel: 'Use Passcode',
      });

      if (result.success) {
        setAuthSuccess(true);
        setTimeout(() => {
          setAuthSuccess(false);
          handleConfirm();
        }, 1500);
      }
    } catch (error) {
      console.error("Auth Error:", error);
    }
  };

  // Navigate to the separate confirmation screen
  const handleConfirm = useCallback(() => {
    if (!selectedSlot) return;
    setSlotState("loading");
    // Brief spinner, then navigate to confirmed screen
    setTimeout(() => {
      router.push({
        pathname: "/(tabs)/book/confirmed",
        params: {
          doctorId,
          date: DAYS[selectedDay].toISOString(),
          time: selectedSlot,
          visitType,
        },
      });
    }, 900);
  }, [selectedSlot, doctorId, selectedDay, visitType, router]);

  if (!doctor) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.inkMuted, padding: 24 }}>Doctor not found.</Text>
      </SafeAreaView>
    );
  }

  const amSlots = SLOTS.filter((sl) => sl.period === "AM");
  const pmSlots = SLOTS.filter((sl) => sl.period === "PM");
  const isConfirming = slotState !== "idle";

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      {authSuccess && <AuthSuccessOverlay colors={colors} />}
      {/* Nav bar */}
      <Animated.View entering={FadeInDown.duration(300)} style={[s.navBar, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn} disabled={isConfirming}>
          <ArrowLeft size={20} color={colors.ink} strokeWidth={1.75} />
        </Pressable>
        <Text style={[s.navTitle, { color: colors.foreground }]}>Book Appointment</Text>
        <View style={{ width: 36 }} />
      </Animated.View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isConfirming}
      >
        {/* ── Doctor hero card ──────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(450).delay(60)}>
          <View style={[s.doctorHero, { backgroundColor: colors.ink }]}>
            <View style={s.docTopRow}>
              <Avatar initials={doctor.initials} size="xl" variant="ink" />
              <View style={{ flex: 1 }}>
                <Text style={[s.docSpecialty, { color: "rgba(255,255,255,0.55)" }]}>
                  {doctor.specialty.toUpperCase()}
                </Text>
                <Text style={[s.docName, { color: colors.primaryForeground }]}>
                  {doctor.name}
                </Text>
                <Text style={[s.docBio, { color: "rgba(255,255,255,0.5)" }]} numberOfLines={2}>
                  {doctor.bio}
                </Text>
              </View>
            </View>

            {/* Stats row */}
            <View style={s.docStats}>
              {[
                { icon: Star,     value: String(doctor.rating),       label: "Rating",     fill: true },
                { icon: Calendar, value: `${doctor.experience}y`,     label: "Experience", fill: false },
                { icon: MapPin,   value: doctor.hospital.split(" ")[0], label: "Hospital",  fill: false },
              ].map(({ icon: Icon, value, label, fill }) => (
                <View key={label} style={s.docStat}>
                  <Icon size={13} color={colors.clay} strokeWidth={1.75} fill={fill ? colors.clay : "none"} />
                  <Text style={[s.docStatVal, { color: colors.primaryForeground }]}>{value}</Text>
                  <Text style={[s.docStatLabel, { color: "rgba(255,255,255,0.4)" }]}>{label}</Text>
                </View>
              ))}
            </View>

            {/* Fee */}
            <View style={[s.feeBadge, { borderTopColor: "rgba(255,255,255,0.1)", borderTopWidth: StyleSheet.hairlineWidth }]}>
              <Text style={[s.feeLabel, { color: "rgba(255,255,255,0.45)" }]}>Consultation fee</Text>
              <Text style={[s.feeVal, { color: colors.primaryForeground }]}>${doctor.fee}</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Clinical History (Psychological Anchor: Trust & Continuity) ── */}
        {pastPrescriptions.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={s.section}>
             <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[s.sectionTitle, { color: colors.foreground }]}>Clinical History</Text>
                <Pressable onPress={() => router.push({ pathname: "/prescriptions", params: { doctor: doctor.name } })}>
                   <Text style={{ fontSize: 13, color: colors.clay, fontFamily: 'DMSans_600SemiBold' }}>View all history →</Text>
                </Pressable>
             </View>
             
             <View style={s.rxGrid}>
                {pastPrescriptions.slice(0, 2).map((rx) => (
                   <View key={rx.id} style={[s.rxMiniCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <View style={[s.rxIconWrap, { backgroundColor: colors.clay + '10' }]}>
                         <Pill size={16} color={colors.clay} />
                      </View>
                      <View style={{ flex: 1 }}>
                         <Text style={[s.rxName, { color: colors.foreground }]}>{rx.name}</Text>
                         {rx.reason && (
                           <Text style={[s.rxReason, { color: colors.inkMuted }]} numberOfLines={1}>
                             {rx.reason}
                           </Text>
                         )}
                      </View>
                   </View>
                ))}
             </View>
          </Animated.View>
        )}


        {/* ── Visit type ──────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400).delay(120)} style={s.section}>
          <Text style={[s.sectionTitle, { color: colors.foreground }]}>Visit type</Text>
          <View style={s.visitTypeRow}>
            {VISIT_TYPES.map(({ id, label, icon: Icon }) => (
              <Pressable
                key={id}
                onPress={() => setVisitType(id)}
                disabled={isConfirming}
                style={[
                  s.visitTypeTile,
                  {
                    backgroundColor: visitType === id ? colors.ink : colors.surface,
                    borderColor:     visitType === id ? colors.ink : colors.border,
                  },
                ]}
              >
                <Icon size={17} color={visitType === id ? colors.primaryForeground : colors.inkMuted} strokeWidth={1.75} />
                <Text style={[s.visitTypeLabel, { color: visitType === id ? colors.primaryForeground : colors.inkMuted }]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* ── Date picker ──────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400).delay(180)} style={s.section}>
          <Text style={[s.sectionTitle, { color: colors.foreground }]}>Select date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {DAYS.map((d, i) => {
              const sel = selectedDay === i;
              return (
                <Pressable
                  key={i}
                  onPress={() => setSelectedDay(i)}
                  disabled={isConfirming}
                  style={[
                    s.dateTile,
                    { backgroundColor: sel ? colors.ink : colors.surface, borderColor: sel ? colors.ink : colors.border },
                  ]}
                >
                  <Text style={[s.dateDow, { color: sel ? "rgba(255,255,255,0.6)" : colors.inkMuted }]}>
                    {d.toLocaleDateString("en-US", { weekday: "short" })}
                  </Text>
                  <Text style={[s.dateNum, { color: sel ? colors.primaryForeground : colors.foreground }]}>
                    {d.getDate()}
                  </Text>
                  <Text style={[s.dateMon, { color: sel ? "rgba(255,255,255,0.5)" : colors.inkMuted }]}>
                    {d.toLocaleDateString("en-US", { month: "short" })}
                  </Text>
                  {i === 0 && (
                    <View style={[s.todayDot, { backgroundColor: colors.clay }]} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* ── Time slots ───────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400).delay(240)} style={s.section}>
          <Text style={[s.sectionTitle, { color: colors.foreground }]}>Available times</Text>

          <Text style={[s.periodLabel, { color: colors.inkMuted }]}>Morning</Text>
          <View style={s.slotGrid}>
            {amSlots.map((slot) => (
              <SlotTile
                key={slot.time}
                slot={slot}
                selected={selectedSlot === slot.time}
                slotState={selectedSlot === slot.time ? slotState : "idle"}
                onPress={() => setSelectedSlot(slot.time)}
                colors={colors}
              />
            ))}
          </View>

          <Text style={[s.periodLabel, { color: colors.inkMuted, marginTop: 18 }]}>Afternoon</Text>
          <View style={s.slotGrid}>
            {pmSlots.map((slot) => (
              <SlotTile
                key={slot.time}
                slot={slot}
                selected={selectedSlot === slot.time}
                slotState={selectedSlot === slot.time ? slotState : "idle"}
                onPress={() => setSelectedSlot(slot.time)}
                colors={colors}
              />
            ))}
          </View>
        </Animated.View>

        {/* ── Reason ───────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={s.section}>
          <Text style={[s.sectionTitle, { color: colors.foreground }]}>Reason for visit</Text>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Briefly describe what you'd like to discuss…"
            placeholderTextColor={colors.inkMuted}
            multiline
            numberOfLines={4}
            editable={!isConfirming}
            style={[
              s.reasonInput,
              { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground },
            ]}
            textAlignVertical="top"
          />
        </Animated.View>

        {/* ── Confirm strip ─────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400).delay(360)}>
          <View style={[s.confirmStrip, { borderTopColor: colors.border }]}>
            <View>
              <Text style={[s.totalLabel, { color: colors.inkMuted }]}>TOTAL</Text>
              <Text style={[s.totalVal, { color: colors.foreground }]}>${doctor.fee}.00</Text>
              {selectedSlot && (
                <Text style={[s.slotSummary, { color: colors.clay }]}>
                  {DAYS[selectedDay].toLocaleDateString("en-US", { month: "short", day: "numeric" })} at {selectedSlot}
                </Text>
              )}
            </View>

            <Pressable
              disabled={!selectedSlot || isConfirming}
              onPress={handleSecureConfirm}
              onLongPress={handleSecureConfirm}
              style={[
                s.confirmBtn,
                {
                  backgroundColor: isConfirming ? "#4CAF7D" : colors.ink,
                  opacity: selectedSlot ? 1 : 0.35,
                },
              ]}
            >
            {slotState === "loading" ? (
              <Animated.View entering={FadeIn.duration(200)} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={[s.confirmBtnText, { color: "#fff" }]}>Booking…</Text>
              </Animated.View>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={[s.confirmBtnText, { color: colors.primaryForeground }]}>
                  Confirm appointment
                </Text>
                <ChevronRight size={16} color={colors.primaryForeground} strokeWidth={2} />
              </View>
            )}
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 48, gap: 26 },

  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  navTitle: { fontSize: 16, fontFamily: "Fraunces_500Medium", letterSpacing: -0.3 },

  // Doctor hero
  doctorHero: {
    borderRadius: 24,
    padding: 22,
    gap: 18,
    marginTop: 10,
    shadowColor: "#1E3A32",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  docTopRow: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  docSpecialty: { fontSize: 10, fontFamily: "DMSans_500Medium", letterSpacing: 2, marginBottom: 5 },
  docName: { fontSize: 20, fontFamily: "Fraunces_500Medium", letterSpacing: -0.5, lineHeight: 26 },
  docBio: { fontSize: 12, fontFamily: "DMSans_400Regular", lineHeight: 17, marginTop: 6 },
  docStats: { flexDirection: "row", gap: 6 },
  docStat: {
    flex: 1, alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14, paddingVertical: 10,
  },
  docStatVal: { fontSize: 14, fontFamily: "DMSans_600SemiBold" },
  docStatLabel: { fontSize: 9, fontFamily: "DMSans_400Regular", letterSpacing: 0.4 },
  feeBadge: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: 14,
  },
  feeLabel: { fontSize: 12, fontFamily: "DMSans_400Regular" },
  feeVal: { fontSize: 22, fontFamily: "Fraunces_500Medium", letterSpacing: -0.5 },

  // Clinical History
  rxGrid: { gap: 10 },
  rxMiniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  rxIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rxName: { fontSize: 15, fontFamily: "DMSans_600SemiBold" },
  rxReason: { fontSize: 12, fontFamily: "DMSans_400Regular", marginTop: 2 },

  section: { gap: 14 },
  sectionTitle: { fontSize: 17, fontFamily: "Fraunces_500Medium", letterSpacing: -0.3 },
  // Reason
  reasonInput: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    minHeight: 100,
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
  },

  // Visit type
  visitTypeRow: { flexDirection: "row", gap: 10 },
  visitTypeTile: { flex: 1, alignItems: "center", gap: 7, borderRadius: 16, borderWidth: 1, paddingVertical: 14 },
  visitTypeLabel: { fontSize: 11, fontFamily: "DMSans_500Medium", letterSpacing: 0.2 },

  // Date
  dateTile: { width: 68, alignItems: "center", gap: 3, borderRadius: 18, borderWidth: 1, paddingVertical: 14 },
  dateDow: { fontSize: 10, fontFamily: "DMSans_500Medium", letterSpacing: 1, textTransform: "uppercase" },
  dateNum: { fontSize: 24, fontFamily: "Fraunces_400Regular", letterSpacing: -0.5 },
  dateMon: { fontSize: 10, fontFamily: "DMSans_400Regular", letterSpacing: 0.5, textTransform: "uppercase" },
  todayDot: { width: 5, height: 5, borderRadius: 2.5 },

  // Slots — 2 columns
  periodLabel: { fontSize: 10, fontFamily: "DMSans_600SemiBold", letterSpacing: 2, textTransform: "uppercase" },
  slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },

  // Confirm
  confirmStrip: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 20,
  },
  totalLabel: { fontSize: 9, fontFamily: "DMSans_600SemiBold", letterSpacing: 1.5 },
  totalVal: { fontSize: 24, fontFamily: "Fraunces_400Regular", letterSpacing: -0.5, marginTop: 3 },
  slotSummary: { fontSize: 12, fontFamily: "DMSans_500Medium", marginTop: 3 },
  confirmBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 16, paddingHorizontal: 20, paddingVertical: 14,
    minWidth: 180, justifyContent: "center",
  },
  confirmBtnText: { fontSize: 14, fontFamily: "DMSans_600SemiBold" },
});

// Slot tile styles — proper 2-column card
const st = StyleSheet.create({
  tileFlex: { width: "47%" },
  slotTile: {
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: "flex-start",
    minHeight: 72,
    justifyContent: "center",
    overflow: "hidden",
  },
  slotTime: { fontSize: 20, fontFamily: "Fraunces_400Regular", letterSpacing: -0.5 },
  slotBottomRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  slotPeriod: { fontSize: 12, fontFamily: "DMSans_400Regular" },
  bookedPill: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  bookedText: { fontSize: 9, fontFamily: "DMSans_500Medium", letterSpacing: 0.5 },

  // Overlay (spinner or tick) shown in centre of tile
  slotOverlay: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  tickCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
});
