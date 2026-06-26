/**
 * Booking Confirmation Screen
 * Navigated to after confirming an appointment.
 * Params: doctorId, date (ISO string), time, visitType
 */
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
} from "react-native-reanimated";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Home,
  Video,
  Briefcase,
  Activity,
} from "lucide-react-native";
import { doctors } from "@/lib/mock-data";
import { Avatar } from "@/components/ui/Avatar";
import { useTheme } from "@/theme/ThemeProvider";

const VISIT_TYPE_MAP: Record<string, { label: string; icon: any }> = {
  in_person: { label: "In Person", icon: Briefcase },
  video:     { label: "Video Call", icon: Video },
  follow_up: { label: "Follow-up", icon: Activity },
};

// ── Pulsing ring behind the tick ──────────────────────────────────
function PulseRing({ colors }: { colors: any }) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(withTiming(1.35, { duration: 1600 }), -1, true);
    opacity.value = withRepeat(withTiming(0, { duration: 1600 }), -1, true);
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        pr.ring,
        ringStyle,
        { backgroundColor: "#4CAF7D20", borderColor: "#4CAF7D40" },
      ]}
    />
  );
}
const pr = StyleSheet.create({
  ring: {
    position: "absolute",
    width: 136,
    height: 136,
    borderRadius: 68,
    borderWidth: 1.5,
  },
});

// ── Main screen ───────────────────────────────────────────────────
export default function BookingConfirmedScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { doctorId, date, time, visitType } = useLocalSearchParams<{
    doctorId: string;
    date: string;
    time: string;
    visitType: string;
  }>();

  const doctor = doctors.find((d) => d.id === doctorId);
  const visit = VISIT_TYPE_MAP[visitType ?? "in_person"];
  const VisitIcon = visit?.icon ?? Briefcase;

  const parsedDate = date ? new Date(date) : new Date();
  const formattedDate = parsedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const [phase, setPhase] = useState<"loading" | "success">("loading");

  // Outer ring entrance
  const outerScale = useSharedValue(0);
  const iconScale  = useSharedValue(0);

  useEffect(() => {
    const t = setTimeout(() => { setPhase("success"); }, 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase === "success") {
      outerScale.value = withDelay(50, withSpring(1, { damping: 10, stiffness: 120 }));
      iconScale.value  = withDelay(250, withSpring(1, { damping: 8,  stiffness: 180 }));
      
      const autoRedirect = setTimeout(() => {
        router.replace("/(tabs)/book");
      }, 5000);
      return () => clearTimeout(autoRedirect);
    }
  }, [phase, router]);

  const outerStyle = useAnimatedStyle(() => ({ transform: [{ scale: outerScale.value }] }));
  const iconStyle  = useAnimatedStyle(() => ({ transform: [{ scale: iconScale.value }] }));

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      {/* ── Success hero ─────────────────────────────────────── */}
      <View style={s.hero}>
        {phase === "loading" ? (
          <View style={[s.outerCircle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ActivityIndicator size="large" color={colors.clay} />
          </View>
        ) : (
          <>
            <PulseRing colors={colors} />
            <Animated.View style={[s.outerCircle, outerStyle, { backgroundColor: "#4CAF7D18", borderColor: "#4CAF7D40" }]}>
              <Animated.View style={[s.innerCircle, iconStyle, { backgroundColor: "#4CAF7D" }]}>
                <CheckCircle2 size={44} color="#fff" strokeWidth={1.75} />
              </Animated.View>
            </Animated.View>
          </>
        )}
      </View>

      {/* ── Text ─────────────────────────────────────────────── */}
      {phase === "loading" ? (
        <Animated.View entering={FadeInDown.duration(400)} style={s.textBlock}>
          <Text style={[s.heading, { color: colors.foreground, fontSize: 32 }]}>
            Confirming...
          </Text>
          <Text style={[s.subHeading, { color: colors.inkMuted }]}>
            Please wait while we secure your slot{doctor ? ` with ${doctor.name}` : ""}.
          </Text>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeInDown.duration(400)} style={s.textBlock}>
          <Text style={[s.heading, { color: colors.foreground }]}>
            You're all{"\n"}
            <Text style={{ color: "#4CAF7D", fontStyle: "italic" }}>booked!</Text>
          </Text>
          <Text style={[s.subHeading, { color: colors.inkMuted }]}>
            Your appointment has been confirmed. Redirecting you to dashboard shortly...
          </Text>
        </Animated.View>
      )}

      {phase === "success" && (
        <>
          {/* ── Booking detail card ───────────────────────────────── */}
      <Animated.View entering={FadeInDown.duration(500).delay(450)} style={s.cardWrap}>
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Doctor row */}
          {doctor && (
            <View style={[s.doctorRow, { borderBottomColor: colors.border }]}>
              <Avatar initials={doctor.initials} size="md" />
              <View style={{ flex: 1 }}>
                <Text style={[s.doctorName, { color: colors.foreground }]}>{doctor.name}</Text>
                <Text style={[s.doctorSpec, { color: colors.inkMuted }]}>{doctor.specialty}</Text>
              </View>
              <View style={[s.visitBadge, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <VisitIcon size={13} color={colors.inkMuted} strokeWidth={1.75} />
                <Text style={[s.visitLabel, { color: colors.inkMuted }]}>{visit?.label}</Text>
              </View>
            </View>
          )}

          {/* Meta rows */}
          <View style={s.metaGrid}>
            {[
              { icon: Calendar, label: "Date",     value: formattedDate },
              { icon: Clock,    label: "Time",     value: time ?? "—" },
              { icon: MapPin,   label: "Location", value: doctor ? `${doctor.hospital}` : "—" },
            ].map(({ icon: Icon, label, value }) => (
              <View key={label} style={s.metaRow}>
                <View style={[s.metaIcon, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Icon size={14} color={colors.inkMuted} strokeWidth={1.75} />
                </View>
                <View>
                  <Text style={[s.metaLabel, { color: colors.inkMuted }]}>{label}</Text>
                  <Text style={[s.metaValue, { color: colors.foreground }]}>{value}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Booking ID */}
          <View style={[s.refRow, { borderTopColor: colors.border }]}>
            <Text style={[s.refLabel, { color: colors.inkMuted }]}>Booking reference</Text>
            <Text style={[s.refValue, { color: colors.foreground }]}>
              #{Math.random().toString(36).substring(2, 8).toUpperCase()}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* ── Actions ───────────────────────────────────────────── */}
      <Animated.View entering={FadeInUp.duration(500).delay(600)} style={s.actions}>
        <Pressable
          onPress={() => router.push("/(tabs)/queue")}
          style={[s.primaryBtn, { backgroundColor: colors.ink }]}
        >
          <Text style={[s.primaryBtnText, { color: colors.primaryForeground }]}>Track live queue</Text>
          <ArrowRight size={16} color={colors.primaryForeground} strokeWidth={2} />
        </Pressable>

        <Pressable
          onPress={() => router.replace("/(tabs)/")}
          style={[s.ghostBtn, { borderColor: colors.border }]}
        >
          <Home size={15} color={colors.ink} strokeWidth={1.75} />
          <Text style={[s.ghostBtnText, { color: colors.ink }]}>Back to dashboard</Text>
        </Pressable>
      </Animated.View>
        </>
      )}
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 24 },

  // Hero
  hero: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
  },
  outerCircle: {
    width: 110, height: 110, borderRadius: 55,
    borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  innerCircle: {
    width: 84, height: 84, borderRadius: 42,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#4CAF7D",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },

  // Text
  textBlock: { alignItems: "center", gap: 10 },
  heading: {
    fontSize: 42, fontFamily: "Fraunces_400Regular",
    letterSpacing: -1.5, lineHeight: 50,
    textAlign: "center",
  },
  subHeading: {
    fontSize: 14, fontFamily: "DMSans_400Regular",
    lineHeight: 21, textAlign: "center",
    paddingHorizontal: 16,
  },

  // Card
  cardWrap: { marginTop: 24 },
  card: {
    borderRadius: 22, borderWidth: 1, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.05,
    shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  doctorRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 16, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  doctorName: { fontSize: 15, fontFamily: "DMSans_600SemiBold", letterSpacing: -0.2 },
  doctorSpec: { fontSize: 12, fontFamily: "DMSans_400Regular", marginTop: 2 },
  visitBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 5,
  },
  visitLabel: { fontSize: 11, fontFamily: "DMSans_500Medium" },

  metaGrid: { padding: 16, gap: 14 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  metaIcon: {
    width: 34, height: 34, borderRadius: 10, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  metaLabel: { fontSize: 10, fontFamily: "DMSans_500Medium", letterSpacing: 0.8, textTransform: "uppercase" },
  metaValue: { fontSize: 14, fontFamily: "DMSans_600SemiBold", marginTop: 2 },

  refRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingVertical: 12,
  },
  refLabel: { fontSize: 11, fontFamily: "DMSans_400Regular" },
  refValue: { fontSize: 13, fontFamily: "DMSans_600SemiBold", letterSpacing: 1, fontVariant: ["tabular-nums"] },

  // Actions
  actions: { marginTop: 24, gap: 12 },
  primaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderRadius: 16, paddingVertical: 16,
  },
  primaryBtnText: { fontSize: 15, fontFamily: "DMSans_600SemiBold" },
  ghostBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderRadius: 16, borderWidth: 1, paddingVertical: 15,
  },
  ghostBtnText: { fontSize: 15, fontFamily: "DMSans_500Medium" },
});
