import React, { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ArrowRight, CalendarDays, Clock4, MapPin, Radio } from "lucide-react-native";
import type { Appointment, Doctor } from "@/lib/mock-data";
import {
  formatAppointmentTime,
  formatQueueDate,
  getQueueBoardSummary,
  getQueueProgressCaption,
} from "@/lib/patient-queue";
import { doctorGenderFor } from "@/lib/doctor-gender";
import { DOCTOR_QUEUE_IMAGES } from "@/lib/queue-persona-assets";
import { QueuePersonaStrip } from "@/components/patient/QueuePersonaStrip";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  appointment: Appointment;
  doctor: Doctor;
  linkToQueue?: boolean;
};

export function LiveQueueHeroCard({ appointment, doctor, linkToQueue = true }: Props) {
  const { colors } = useTheme();
  const router = useRouter();
  const position = appointment.queuePosition ?? 3;
  const total = appointment.queueTotal ?? 6;
  const [waitMin, setWaitMin] = useState(appointment.estimatedWait ?? 12);
  const caption = getQueueProgressCaption(position, doctor.name);

  useEffect(() => {
    const id = setInterval(() => setWaitMin((w) => (w > 1 ? w - 1 : w)), 60_000);
    return () => clearInterval(id);
  }, []);

  const content = (
    <>
      <View style={s.liveRow}>
        <View style={s.livePill}>
          <View style={[s.liveDot, { backgroundColor: "#7A9B7E" }]} />
          <Text style={s.livePillText}>LIVE QUEUE</Text>
        </View>
        <View style={s.updatePill}>
          <Radio size={12} color="#7A9B7E" strokeWidth={2} />
          <Text style={s.updateText}>Updating live</Text>
        </View>
      </View>

      <View style={s.posRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.posLabel}>YOUR POSITION</Text>
          <Text style={s.posBig}>
            {String(position).padStart(2, "0")}
            <Text style={s.posOf}> /{String(total).padStart(2, "0")}</Text>
          </Text>
          <Text style={s.posSub}>{getQueueBoardSummary(position, total)}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={s.waitLabel}>EST. WAIT</Text>
          <Text style={s.waitBig}>~{waitMin}m</Text>
        </View>
      </View>

      <View style={s.docCard}>
        <View style={s.docAvatar}>
          <Image
            source={DOCTOR_QUEUE_IMAGES[doctorGenderFor(doctor)]}
            style={{ width: 28, height: 36 }}
            resizeMode="contain"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.docName}>{doctor.name}</Text>
          <Text style={s.docMeta}>
            {doctor.specialty} · {doctor.hospital}
          </Text>
        </View>
      </View>

      <QueuePersonaStrip position={position} total={total} />
      <Text style={s.statusText} numberOfLines={2}>
        {caption}
      </Text>

      <View style={s.metaRow}>
        <MetaChip icon={CalendarDays} label={formatQueueDate(appointment.date)} />
        <MetaChip icon={Clock4} label={formatAppointmentTime(appointment.time)} />
        <MetaChip icon={MapPin} label={appointment.room ?? "Suite 4B"} />
      </View>
      <Text style={s.checkIn}>{appointment.checkInStatus ?? "Checked in · Vitals complete"}</Text>

      {linkToQueue ? (
        <View style={s.cta}>
          <Text style={s.ctaText}>View live queue</Text>
          <ArrowRight size={16} color="#fff" strokeWidth={2} />
        </View>
      ) : null}
    </>
  );

  if (linkToQueue) {
    return (
      <Pressable
        onPress={() => router.push("/(tabs)/queue")}
        style={[s.card, { backgroundColor: colors.ink }]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[s.card, { backgroundColor: colors.ink }]}>{content}</View>;
}

function MetaChip({ icon: Icon, label }: { icon: typeof CalendarDays; label: string }) {
  return (
    <View style={s.chip}>
      <Icon size={12} color="rgba(255,255,255,0.7)" strokeWidth={1.75} />
      <Text style={s.chipText}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 28, padding: 20, gap: 16 },
  liveRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  livePillText: {
    fontSize: 10,
    fontFamily: "DMSans_600SemiBold",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.9)",
  },
  updatePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  updateText: { fontSize: 11, fontFamily: "DMSans_500Medium", color: "rgba(255,255,255,0.85)" },
  posRow: { flexDirection: "row", alignItems: "flex-end", gap: 12 },
  posLabel: {
    fontSize: 11,
    fontFamily: "DMSans_500Medium",
    letterSpacing: 1,
    color: "rgba(255,255,255,0.5)",
  },
  posBig: {
    fontSize: 52,
    fontFamily: "CormorantGaramond_600SemiBold",
    color: "#fff",
    lineHeight: 56,
  },
  posOf: { fontSize: 22, fontFamily: "DMSans_400Regular", color: "rgba(255,255,255,0.45)" },
  posSub: { marginTop: 6, fontSize: 12, fontFamily: "DMSans_400Regular", color: "rgba(255,255,255,0.6)" },
  waitLabel: {
    fontSize: 10,
    fontFamily: "DMSans_500Medium",
    letterSpacing: 0.8,
    color: "rgba(255,255,255,0.45)",
  },
  waitBig: { fontSize: 28, fontFamily: "CormorantGaramond_600SemiBold", color: "#fff" },
  docCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  docAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  docName: { fontSize: 14, fontFamily: "DMSans_600SemiBold", color: "#fff" },
  docMeta: { fontSize: 12, fontFamily: "DMSans_400Regular", color: "rgba(255,255,255,0.65)", marginTop: 2 },
  statusText: {
    fontSize: 11,
    fontFamily: "DMSans_400Regular",
    color: "rgba(255,255,255,0.55)",
    lineHeight: 16,
  },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  chipText: { fontSize: 11, fontFamily: "DMSans_400Regular", color: "rgba(255,255,255,0.75)" },
  checkIn: { fontSize: 11, fontFamily: "DMSans_500Medium", color: "#7A9B7E" },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: 14,
    marginTop: 2,
  },
  ctaText: { fontSize: 14, fontFamily: "DMSans_600SemiBold", color: "rgba(255,255,255,0.9)" },
});
