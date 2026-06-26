import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, MapPin, MessageCircle, Phone } from "lucide-react-native";
import { format } from "date-fns";
import { useTheme } from "@/theme/ThemeProvider";
import { appointments, doctors } from "@/lib/mock-data";

export default function VisitDetailScreen() {
  const { visitId } = useLocalSearchParams<{ visitId: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  const appointment = appointments.find((a) => a.id === visitId);
  const doctor = appointment ? doctors.find((d) => d.id === appointment.doctorId) : undefined;

  if (!appointment || !doctor) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground, textAlign: "center", marginTop: 40 }}>
          Visit not found
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <ChevronLeft size={24} color={colors.foreground} strokeWidth={2.25} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[s.eyebrow, { color: colors.clay }]}>Visit details</Text>
          <Text style={[s.title, { color: colors.foreground }]}>{appointment.reason}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[s.avatar, { backgroundColor: colors.clay + "22" }]}>
            <Text style={[s.avatarText, { color: colors.foreground }]}>{doctor.initials}</Text>
          </View>
          <Text style={[s.doctorName, { color: colors.foreground }]}>{doctor.name}</Text>
          <Text style={[s.doctorMeta, { color: colors.inkMuted }]}>{doctor.specialty}</Text>
          <Text style={[s.doctorMeta, { color: colors.inkMuted, marginTop: 4 }]}>{doctor.hospital}</Text>

          <View style={s.actions}>
            <Pressable
              onPress={() => Linking.openURL("tel:+15550123456")}
              style={[s.actionBtn, { borderColor: colors.border }]}
            >
              <Phone size={14} color={colors.foreground} strokeWidth={1.75} />
              <Text style={[s.actionText, { color: colors.foreground }]}>Call</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/settings/support")}
              style={[s.actionBtn, { borderColor: colors.border }]}
            >
              <MessageCircle size={14} color={colors.foreground} strokeWidth={1.75} />
              <Text style={[s.actionText, { color: colors.foreground }]}>Message</Text>
            </Pressable>
          </View>
        </View>

        {[
          { label: "Date", value: format(new Date(appointment.date), "EEEE, MMM d, yyyy") },
          { label: "Time", value: appointment.time },
          { label: "Status", value: appointment.status },
          {
            label: "Location",
            value: appointment.room ?? `${doctor.hospital} · Outpatient`,
          },
        ].map(({ label, value }) => (
          <View key={label} style={[s.detailRow, { borderColor: colors.border }]}>
            <Text style={[s.detailLabel, { color: colors.inkMuted }]}>{label}</Text>
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 6, flex: 1 }}>
              {label === "Location" ? (
                <MapPin size={14} color={colors.inkMuted} strokeWidth={1.75} style={{ marginTop: 2 }} />
              ) : null}
              <Text style={[s.detailValue, { color: colors.foreground }]}>{value}</Text>
            </View>
          </View>
        ))}
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
    fontSize: 26,
    marginTop: 4,
  },
  content: { paddingHorizontal: 20, paddingBottom: 32, gap: 10 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    padding: 18,
    marginBottom: 8,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontFamily: "Fraunces_500Medium",
    fontSize: 18,
  },
  doctorName: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 17,
  },
  doctorMeta: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 12,
  },
  detailRow: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 14,
  },
  detailLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  detailValue: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    flex: 1,
  },
});
