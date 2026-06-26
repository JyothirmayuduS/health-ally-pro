import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Building2, Calendar, Pill, Printer, User } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { getPatientPrescription } from "@/lib/patient-prescription-store";
import { useTheme } from "@/theme/ThemeProvider";

function formatSentAt(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PrescriptionDetailScreen() {
  const { rxId } = useLocalSearchParams<{ rxId: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const record = rxId ? getPatientPrescription(rxId) : undefined;

  if (!record) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={colors.ink} />
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>Prescription</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.empty}>
          <Text style={{ color: colors.inkMuted }}>Prescription not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleShare = () => {
    void Share.share({
      message: `${record.rx_number}\n${record.diagnosis}\n${record.lines.map((l) => `${l.drug_name} ${l.strength} — ${l.sig}`).join("\n")}\nPrescribed by ${record.doctor_name}`,
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.ink} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>E-prescription</Text>
        <Pressable onPress={handleShare} style={styles.backBtn}>
          <Printer size={20} color={colors.ink} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <View style={[styles.rxPad, { backgroundColor: "#FFFEF9", borderColor: colors.border }]}>
            <Text style={styles.rxEyebrow}>ELECTRONIC PRESCRIPTION</Text>
            <Text style={styles.rxNumber}>{record.rx_number}</Text>
            <Text style={[styles.rxDate, { color: colors.inkMuted }]}>{formatSentAt(record.sent_at)}</Text>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.row}>
              <User size={14} color={colors.clay} />
              <Text style={[styles.rowLabel, { color: colors.inkMuted }]}>Patient</Text>
              <Text style={[styles.rowValue, { color: colors.foreground }]}>Jyothirmayudu S</Text>
            </View>
            <View style={styles.row}>
              <Building2 size={14} color={colors.clay} />
              <Text style={[styles.rowLabel, { color: colors.inkMuted }]}>Prescriber</Text>
              <Text style={[styles.rowValue, { color: colors.foreground }]}>
                {record.doctor_name} · {record.doctor_specialty}
              </Text>
            </View>
            <View style={styles.row}>
              <Calendar size={14} color={colors.clay} />
              <Text style={[styles.rowLabel, { color: colors.inkMuted }]}>Diagnosis</Text>
              <Text style={[styles.rowValue, { color: colors.foreground }]}>{record.diagnosis}</Text>
            </View>

            <Text style={[styles.medHeading, { color: colors.foreground }]}>℞ Medications</Text>
            {record.lines.map((line) => (
              <View key={line.drug_id} style={[styles.medBlock, { borderColor: colors.border }]}>
                <Text style={[styles.medName, { color: colors.foreground }]}>
                  {line.drug_name} {line.strength}
                </Text>
                <Text style={[styles.medSig, { color: colors.inkMuted }]}>{line.sig}</Text>
                <Text style={[styles.medQty, { color: colors.inkMuted }]}>
                  Qty {line.qty_prescribed} · {line.days_supply} days supply
                </Text>
              </View>
            ))}

            {record.patientInstructions ? (
              <View style={[styles.noteBox, { backgroundColor: colors.background }]}>
                <Text style={[styles.noteTitle, { color: colors.clay }]}>Patient instructions</Text>
                <Text style={[styles.noteBody, { color: colors.inkMuted }]}>{record.patientInstructions}</Text>
              </View>
            ) : null}
          </View>
        </Animated.View>

        <Pressable
          onPress={handleShare}
          style={[styles.shareBtn, { backgroundColor: colors.ink }]}
        >
          <Text style={[styles.shareBtnText, { color: colors.primaryForeground }]}>Share with pharmacy</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 56,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 17, fontFamily: "DMSans_600SemiBold" },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  rxPad: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  rxEyebrow: {
    fontSize: 10,
    fontFamily: "DMSans_700Bold",
    letterSpacing: 2,
    color: "#8A8F8C",
  },
  rxNumber: {
    fontSize: 22,
    fontFamily: "DMSans_700Bold",
    marginTop: 6,
    letterSpacing: 0.5,
  },
  rxDate: { fontSize: 12, fontFamily: "DMSans_400Regular", marginTop: 4 },
  divider: { height: 1, marginVertical: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  rowLabel: { fontSize: 12, fontFamily: "DMSans_500Medium", width: 72 },
  rowValue: { flex: 1, fontSize: 13, fontFamily: "DMSans_500Medium" },
  medHeading: { fontSize: 16, fontFamily: "Fraunces_500Medium", marginTop: 8, marginBottom: 12 },
  medBlock: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
  medName: { fontSize: 15, fontFamily: "DMSans_600SemiBold" },
  medSig: { fontSize: 13, fontFamily: "DMSans_400Regular", marginTop: 4, lineHeight: 20 },
  medQty: { fontSize: 11, fontFamily: "DMSans_400Regular", marginTop: 6 },
  noteBox: { borderRadius: 14, padding: 14, marginTop: 8 },
  noteTitle: { fontSize: 11, fontFamily: "DMSans_700Bold", textTransform: "uppercase", letterSpacing: 0.5 },
  noteBody: { fontSize: 13, fontFamily: "DMSans_400Regular", marginTop: 6, lineHeight: 20 },
  shareBtn: {
    marginTop: 20,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
  },
  shareBtnText: { fontSize: 15, fontFamily: "DMSans_600SemiBold" },
});
