/**
 * Live Queue Screen – Position tracker with real-time countdown
 * Visual hierarchy: Large position number → Progress bar → Doctor card → Tips
 */
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  Clock4,
  Bell,
  MapPin,
  Phone,
  ArrowLeft,
  CheckCircle2,
  DoorOpen,
  Users,
} from "lucide-react-native";
import { appointments as mockAppointments, doctors as mockDoctors } from "@/lib/mock-data";
import { fetchMobileDashboard } from "@/lib/supabase-queries";
import { Avatar } from "@/components/ui/Avatar";
import { useTheme } from "@/theme/ThemeProvider";

function PulseDot({ color }: { color: string }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.5, { duration: 700 }), withTiming(1, { duration: 700 })),
      -1,
      true
    );
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: 0.5 }));
  return (
    <View style={{ width: 12, height: 12, alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={[{ position: "absolute", width: 12, height: 12, borderRadius: 6, backgroundColor: color }, style]} />
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
    </View>
  );
}

export default function QueueScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [appointments, setAppointments] = useState(mockAppointments);
  const [doctors, setDoctors] = useState(mockDoctors);

  useEffect(() => {
    fetchMobileDashboard().then(({ appointments: a, doctors: d }) => {
      setAppointments(a);
      setDoctors(d);
    });
  }, []);

  const active = appointments.find((a) => a.status === "in-queue");
  const doctor = active ? doctors.find((d) => d.id === active.doctorId) : null;
  const [wait, setWait] = useState(active?.estimatedWait ?? 0);

  useEffect(() => {
    const id = setInterval(() => setWait((w) => (w > 0 ? w - 1 : 0)), 60000);
    return () => clearInterval(id);
  }, []);

  if (!active || !doctor) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={["top"]}>
        <View style={s.emptyState}>
          <CheckCircle2 size={52} color={colors.inkMuted} strokeWidth={1} />
          <Text style={[s.emptyTitle, { color: colors.foreground }]}>You're not in any queue</Text>
          <Text style={[s.emptySub, { color: colors.inkMuted }]}>
            Book an appointment to track your position live.
          </Text>
          <Pressable
            onPress={() => router.push("/(tabs)/book")}
            style={[s.emptyBtn, { backgroundColor: colors.ink }]}
          >
            <Text style={[s.emptyBtnText, { color: colors.primaryForeground }]}>Book an appointment</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const pos = active.queuePosition!;
  const total = active.queueTotal ?? 6;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      {/* Nav bar */}
      <View style={[s.navBar, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft size={20} color={colors.ink} strokeWidth={1.75} />
        </Pressable>
        <View style={s.liveChip}>
          <PulseDot color={colors.clay} />
          <Text style={[s.liveText, { color: colors.clay }]}>LIVE</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header text */}
        <Animated.View entering={FadeInDown.duration(500)} style={s.titleBlock}>
          <Text style={[s.eyebrow, { color: colors.inkMuted }]}>LIVE QUEUE</Text>
          <Text style={[s.heading, { color: colors.foreground }]}>
            With{" "}
            <Text style={{ color: colors.clay, fontStyle: "italic" }}>{doctor.name}</Text>
          </Text>
          <Text style={[s.subHeading, { color: colors.inkMuted }]}>
            Stay nearby — we'll notify you when it's almost time.
          </Text>
        </Animated.View>

        {/* Big position card */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <View style={[s.posCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>

            {/* Header row */}
            <View style={s.posHeaderRow}>
              <View>
                <Text style={[s.posLabel, { color: colors.inkMuted }]}>
                  YOUR POSITION
                </Text>
                <Text style={[s.posNumber, { color: colors.foreground }]}>
                  {String(pos).padStart(2, "0")}
                  <Text style={[s.posOf, { color: colors.border }]}>
                    /{total}
                  </Text>
                </Text>
              </View>
              {/* Wait badge */}
              <View style={[s.waitBadge, { backgroundColor: colors.background }]}>
                <Clock4 size={13} color={colors.inkMuted} strokeWidth={1.75} />
                <Text style={[s.waitText, { color: colors.foreground }]}>
                  ~{wait} min
                </Text>
              </View>
            </View>

            {/* ── Patient avatar queue track ─────────────────── */}
            <View style={s.queueTrack}>
              {Array.from({ length: total }).map((_, i) => {
                const isDone    = i < pos - 1;
                const isYou     = i === pos - 1;
                const isAhead   = i > pos - 1;
                const isFirst   = i === 0;

                const INITIALS = ["AT", "MK", "SR", "BL", "CJ", "RV"];
                const initials = INITIALS[i] ?? "?";

                // Avatar bg / border for light card
                let avatarBg: string = colors.background;
                let avatarBorder: string = colors.border;
                
                if (isFirst && pos > 1) { avatarBg = colors.clay; avatarBorder = colors.clay; }
                else if (isDone)        { avatarBg = colors.background; avatarBorder = colors.border; }
                else if (isYou)         { avatarBg = colors.clay; avatarBorder = colors.ink; }
                else if (isAhead)       { avatarBg = colors.background; avatarBorder = colors.border; }

                return (
                  <View key={i} style={s.queueSlot}>
                    {/* Connector line */}
                    {i > 0 && (
                      <View style={[
                        s.queueLine,
                        { backgroundColor: isDone ? colors.inkMuted : colors.border },
                      ]} />
                    )}

                    {/* Avatar */}
                    <Animated.View
                      entering={FadeInDown.duration(350).delay(i * 90)}
                      style={[
                         s.queueAvatar,
                        { backgroundColor: avatarBg, borderColor: avatarBorder },
                        isYou && { width: 54, height: 54, borderRadius: 27 },
                      ]}
                    >
                      {isFirst && pos > 1 ? (
                        <Text style={{ fontSize: 17 }}>🩺</Text>
                      ) : isDone ? (
                        <Text style={{ fontSize: 14, color: colors.inkMuted }}>✓</Text>
                      ) : isYou ? (
                        <Text style={{ fontSize: 12, fontFamily: "DMSans_600SemiBold", color: "#fff" }}>YOU</Text>
                      ) : (
                        <Text style={{ fontSize: 10, fontFamily: "DMSans_500Medium", color: colors.inkMuted }}>
                          {initials}
                        </Text>
                      )}
                    </Animated.View>

                    {/* Label */}
                    <Text style={{
                      fontSize: 9,
                      fontFamily: isYou ? "DMSans_600SemiBold" : "DMSans_400Regular",
                      color: isYou ? colors.clay : isDone ? colors.inkMuted : colors.border,
                      letterSpacing: 0.2,
                    }}>
                      {isFirst && pos > 1 ? "Now" : isDone ? "Done" : isYou ? "You" : `+${i - (pos - 1)}`}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Footer */}
            <Text style={{ fontSize: 12, fontFamily: "DMSans_400Regular", color: colors.inkMuted, textAlign: "center" }}>
              {pos - 1} patient{pos - 1 !== 1 ? "s" : ""} ahead of you
            </Text>

          </View>
        </Animated.View>

        {/* ── Doctor's Door card ─────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(500).delay(155)}>
          <View style={[s.doorCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>

            {/* Left: door visual */}
            <View style={[s.doorVisual, { backgroundColor: colors.ink, borderColor: colors.border }]}>
              {/* Door frame */}
              <View style={[s.doorFrame, { borderColor: "rgba(255,255,255,0.15)" }]}>
                {/* Door panel */}
                <View style={[s.doorPanel, { borderColor: "rgba(255,255,255,0.1)" }]} />
                {/* Door knob */}
                <View style={[s.doorKnob, { backgroundColor: colors.clay }]} />
                {/* Light strip above door */}
                <Animated.View
                  style={[
                    s.doorLight,
                    { backgroundColor: pos <= 2 ? "#4CAF7D" : "#F59E0B" },
                  ]}
                />
              </View>
              {/* Room label */}
              <Text style={[s.roomLabel, { color: "rgba(255,255,255,0.5)" }]}>ROOM</Text>
              <Text style={[s.roomNumber, { color: colors.primaryForeground }]}>3A</Text>
            </View>

            {/* Right: info */}
            <View style={s.doorInfo}>
              <Text style={[s.doorTitle, { color: colors.foreground }]}>Doctor's Door</Text>
              <Text style={[s.doorSub, { color: colors.inkMuted }]}>
                {doctor.hospital}
              </Text>

              {/* Status pill */}
              <View style={[
                s.doorStatus,
                {
                  backgroundColor: pos <= 2 ? "#E8F5E9" : "#FFF8E1",
                  borderColor: pos <= 2 ? "#4CAF7D40" : "#F59E0B40",
                },
              ]}>
                <View style={[
                  s.doorStatusDot,
                  { backgroundColor: pos <= 2 ? "#4CAF7D" : "#F59E0B" },
                ]} />
                <Text style={[
                  s.doorStatusText,
                  { color: pos <= 2 ? "#2E7D32" : "#B45309" },
                ]}>
                  {pos === 1
                    ? "Your turn — walk in!"
                    : pos <= 2
                    ? "Almost ready for you"
                    : "Doctor is consulting"}
                </Text>
              </View>

              {/* Queue position context */}
              <View style={s.doorMeta}>
                <Users size={12} color={colors.inkMuted} strokeWidth={1.75} />
                <Text style={[s.doorMetaText, { color: colors.inkMuted }]}>
                  {pos - 1} patient{pos - 1 !== 1 ? "s" : ""} before you
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Doctor detail card */}
        <Animated.View entering={FadeInDown.duration(500).delay(180)}>
          <View style={[s.docCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Doctor row */}
            <View style={s.docRow}>
              <Avatar initials={doctor.initials} size="lg" />
              <View style={{ flex: 1 }}>
                <Text style={[s.docName, { color: colors.foreground }]}>{doctor.name}</Text>
                <Text style={[s.docSpec, { color: colors.inkMuted }]}>{doctor.specialty}</Text>
              </View>
            </View>

            {/* Details */}
            <View style={[s.detailGrid, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
              <View style={s.detailItem}>
                <Text style={[s.detailLabel, { color: colors.inkMuted }]}>Reason</Text>
                <Text style={[s.detailValue, { color: colors.foreground }]}>{active.reason}</Text>
              </View>
              <View style={s.detailItem}>
                <Text style={[s.detailLabel, { color: colors.inkMuted }]}>Time</Text>
                <Text style={[s.detailValue, { color: colors.foreground }]}>{active.time}</Text>
              </View>
              <View style={s.detailItem}>
                <View style={s.detailInline}>
                  <MapPin size={13} color={colors.inkMuted} strokeWidth={1.75} />
                  <Text style={[s.detailValue, { color: colors.foreground }]}>
                    {doctor.hospital} · Suite 4
                  </Text>
                </View>
              </View>
              <View style={s.detailItem}>
                <View style={s.detailInline}>
                  <Phone size={13} color={colors.inkMuted} strokeWidth={1.75} />
                  <Text style={[s.detailValue, { color: colors.foreground }]}>+1 (415) 555-0142</Text>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View style={s.actions}>
              <Pressable style={[s.primaryBtn, { backgroundColor: colors.ink }]}>
                <Bell size={15} color={colors.primaryForeground} strokeWidth={1.75} />
                <Text style={[s.primaryBtnText, { color: colors.primaryForeground }]}>
                  Notify me
                </Text>
              </Pressable>
              <Pressable style={[s.ghostBtn, { borderColor: colors.border }]}>
                <Text style={[s.ghostBtnText, { color: colors.ink }]}>Hold my place</Text>
              </Pressable>
              <Pressable style={[s.ghostBtn, { borderColor: colors.border }]}>
                <Text style={[s.ghostBtnText, { color: colors.destructive }]}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* Pre-visit tips */}
        <Animated.View entering={FadeInDown.duration(500).delay(260)}>
          <Text style={[s.tipsHeading, { color: colors.foreground }]}>Before you're called</Text>
          {[
            { t: "Arrive 10 min early", d: "Check in at the front desk on arrival." },
            { t: "Bring your records", d: "Share relevant reports via the app for faster intake." },
            { t: "Keep your phone on", d: "We'll ping you when it's almost your turn." },
          ].map((tip, i) => (
            <View
              key={i}
              style={[s.tipRow, i < 2 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
            >
              <View style={[s.tipDot, { backgroundColor: colors.clay }]} />
              <View style={{ flex: 1 }}>
                <Text style={[s.tipTitle, { color: colors.foreground }]}>{tip.t}</Text>
                <Text style={[s.tipDesc, { color: colors.inkMuted }]}>{tip.d}</Text>
              </View>
            </View>
          ))}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const CLAY = "#B6785C";

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, gap: 20 },

  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36, height: 36, alignItems: "center", justifyContent: "center",
  },
  liveChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF4F2",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  liveText: { fontSize: 11, fontFamily: "DMSans_600SemiBold", letterSpacing: 1.5 },

  titleBlock: { gap: 6, marginTop: 8 },
  eyebrow: { fontSize: 11, fontFamily: "DMSans_500Medium", letterSpacing: 2 },
  heading: { fontSize: 32, fontFamily: "Fraunces_400Regular", letterSpacing: -1, lineHeight: 38 },
  subHeading: { fontSize: 13, fontFamily: "DMSans_400Regular", lineHeight: 19 },

  posCard: {
    borderRadius: 24,
    padding: 22,
    gap: 20,
    shadowColor: "#1E3A32",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  posHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    width: "100%",
  },
  posLabel: { fontSize: 10, fontFamily: "DMSans_500Medium", letterSpacing: 2.5, marginBottom: 4 },
  posNumber: { fontSize: 64, fontFamily: "Fraunces_400Regular", lineHeight: 70, letterSpacing: -2 },
  posOf: { fontSize: 28, fontFamily: "Fraunces_400Regular", letterSpacing: -1 },

  waitBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 6,
  },
  waitText: { fontSize: 12, fontFamily: "DMSans_600SemiBold" },

  // ── Patient queue track
  queueTrack: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: 8,
  },
  queueSlot: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    position: "relative",
  },
  queueLine: {
    position: "absolute",
    top: 20,
    right: "50%",
    left: "-50%",
    marginRight: 28,
    marginLeft: 28,
    height: 2,
    zIndex: 0,
  },
  queueAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  queueInitials: {
    fontSize: 12,
    fontFamily: "DMSans_600SemiBold",
    color: "#fff",
    letterSpacing: 0.2,
  },
  queueLabel: {
    fontSize: 9,
    fontFamily: "DMSans_400Regular",
    letterSpacing: 0.3,
  },
  aheadText: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    letterSpacing: 0.2,
    textAlign: "center",
    width: "100%",
  },

  // ── Doctor's Door card
  doorCard: {
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    overflow: "hidden",
  },
  doorVisual: {
    width: 90,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 14,
    gap: 2,
  },
  doorFrame: {
    width: 42,
    height: 56,
    borderRadius: 6,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 2,
    position: "relative",
    marginBottom: 6,
    overflow: "hidden",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    paddingBottom: 4,
    paddingRight: 5,
  },
  doorPanel: {
    position: "absolute",
    top: 8,
    left: 6,
    right: 6,
    bottom: 10,
    borderRadius: 4,
    borderWidth: 1,
  },
  doorKnob: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  doorLight: {
    position: "absolute",
    top: -1,
    left: 4,
    right: 4,
    height: 3,
    borderRadius: 2,
  },
  roomLabel: {
    fontSize: 8,
    fontFamily: "DMSans_500Medium",
    letterSpacing: 2,
  },
  roomNumber: {
    fontSize: 18,
    fontFamily: "Fraunces_500Medium",
    letterSpacing: -0.5,
  },

  doorInfo: {
    flex: 1,
    padding: 16,
    gap: 8,
    justifyContent: "center",
  },
  doorTitle: { fontSize: 16, fontFamily: "Fraunces_500Medium", letterSpacing: -0.3 },
  doorSub: { fontSize: 12, fontFamily: "DMSans_400Regular" },
  doorStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  doorStatusDot: { width: 6, height: 6, borderRadius: 3 },
  doorStatusText: { fontSize: 11, fontFamily: "DMSans_600SemiBold" },
  doorMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  doorMetaText: { fontSize: 11, fontFamily: "DMSans_400Regular" },

  docCard: {

    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 16,
  },
  docRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  docName: { fontSize: 18, fontFamily: "Fraunces_500Medium", letterSpacing: -0.4 },
  docSpec: { fontSize: 13, fontFamily: "DMSans_400Regular", marginTop: 3 },

  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
  },
  detailItem: { width: "45%" },
  detailLabel: { fontSize: 10, fontFamily: "DMSans_500Medium", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 },
  detailValue: { fontSize: 13, fontFamily: "DMSans_500Medium" },
  detailInline: { flexDirection: "row", alignItems: "center", gap: 5 },

  actions: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  primaryBtnText: { fontSize: 14, fontFamily: "DMSans_600SemiBold" },
  ghostBtn: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  ghostBtnText: { fontSize: 14, fontFamily: "DMSans_500Medium" },

  tipsHeading: { fontSize: 17, fontFamily: "Fraunces_500Medium", letterSpacing: -0.3, marginBottom: 4 },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 14, paddingVertical: 14 },
  tipDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  tipTitle: { fontSize: 14, fontFamily: "DMSans_600SemiBold", marginBottom: 3 },
  tipDesc: { fontSize: 13, fontFamily: "DMSans_400Regular", lineHeight: 18 },

  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 14 },
  emptyTitle: { fontSize: 22, fontFamily: "Fraunces_400Regular", letterSpacing: -0.5, textAlign: "center" },
  emptySub: { fontSize: 14, fontFamily: "DMSans_400Regular", textAlign: "center", lineHeight: 21 },
  emptyBtn: { marginTop: 8, borderRadius: 16, paddingHorizontal: 28, paddingVertical: 14 },
  emptyBtnText: { fontSize: 15, fontFamily: "DMSans_600SemiBold" },
});
