import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Pill,
  User,
  Info,
  ChevronRight,
  X,
  FileText,
} from "lucide-react-native";
import { medications, doctors } from "@/lib/mock-data";
import {
  formatRxRelative,
  listPatientPrescriptions,
  subscribePatientRx,
  type PatientRxRecord,
} from "@/lib/patient-prescription-store";
import { useTheme } from "@/theme/ThemeProvider";
import Animated, { FadeInDown } from "react-native-reanimated";

function statusColor(status: PatientRxRecord["status"], clay: string) {
  if (status === "active") return clay;
  if (status === "dispensed") return "#4CAF7D";
  return "#8A8F8C";
}

export default function PrescriptionsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { doctor: doctorParam } = useLocalSearchParams<{ doctor?: string }>();
  const [eRxList, setERxList] = useState<PatientRxRecord[]>(() => listPatientPrescriptions());

  useEffect(() => {
    return subscribePatientRx(() => setERxList(listPatientPrescriptions()));
  }, []);

  const pastMedications = medications.filter(
    (m) => !doctorParam || m.prescribedBy === doctorParam,
  );

  const filteredRx = doctorParam
    ? eRxList.filter((r) => r.doctor_name === doctorParam)
    : eRxList;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.ink} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Prescriptions</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={[styles.eyebrow, { color: colors.clay }]}>YOUR CARE</Text>
          <Text style={[styles.heading, { color: colors.foreground }]}>E-prescriptions</Text>
          <Text style={[styles.subheading, { color: colors.inkMuted }]}>
            Signed Rx from your doctors — open, share with pharmacy, or print.
          </Text>
        </Animated.View>

        {doctorParam ? (
          <Animated.View entering={FadeInDown.duration(400)}>
            <View style={[styles.filterBar, { backgroundColor: colors.clay + "10", borderColor: colors.clay + "30" }]}>
              <View style={styles.filterLeft}>
                <User size={14} color={colors.clay} />
                <Text style={[styles.filterText, { color: colors.foreground }]}>
                  Filtered by <Text style={{ fontFamily: "DMSans_700Bold" }}>{doctorParam}</Text>
                </Text>
              </View>
              <Pressable
                onPress={() => router.setParams({ doctor: undefined })}
                style={[styles.clearBtn, { backgroundColor: colors.clay }]}
              >
                <X size={12} color="#fff" strokeWidth={3} />
              </Pressable>
            </View>
          </Animated.View>
        ) : null}

        <View style={styles.list}>
          {filteredRx.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <FileText size={28} color={colors.inkMuted} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No e-prescriptions yet</Text>
              <Text style={[styles.emptySub, { color: colors.inkMuted }]}>
                When your doctor sends a prescription, it appears here automatically.
              </Text>
            </View>
          ) : (
            filteredRx.map((rx, index) => (
              <Animated.View key={rx.id} entering={FadeInDown.duration(400).delay(80 + index * 40)}>
                <Pressable
                  onPress={() => router.push(`/prescriptions/${rx.rx_number}`)}
                  style={[styles.erxCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={styles.erxTop}>
                    <View style={[styles.iconWrap, { backgroundColor: colors.clay + "15" }]}>
                      <Pill size={20} color={colors.clay} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={[styles.rxNum, { color: colors.foreground }]}>{rx.rx_number}</Text>
                        <View style={[styles.statusPill, { backgroundColor: statusColor(rx.status, colors.clay) + "20" }]}>
                          <Text style={[styles.statusText, { color: statusColor(rx.status, colors.clay) }]}>
                            {rx.status}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.erxDiagnosis, { color: colors.foreground }]} numberOfLines={1}>
                        {rx.diagnosis}
                      </Text>
                      <Text style={[styles.erxMeta, { color: colors.inkMuted }]}>
                        {rx.doctor_name} · {formatRxRelative(rx.sent_at)} · {rx.lines.length} med
                        {rx.lines.length === 1 ? "" : "s"}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={colors.inkMuted} />
                  </View>
                </Pressable>
              </Animated.View>
            ))
          )}
        </View>

        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={{ marginTop: 32 }}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Medication history</Text>
          <Text style={[styles.sectionSub, { color: colors.inkMuted }]}>
            Historical dosages and clinical rationale from your chart.
          </Text>
        </Animated.View>

        <View style={styles.list}>
          {pastMedications.map((med, index) => (
            <Animated.View
              key={med.id}
              entering={FadeInDown.duration(400).delay(240 + index * 50)}
            >
              <View style={[styles.medCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.medHeader}>
                  <View style={[styles.iconWrap, { backgroundColor: colors.ink + "10" }]}>
                    <Pill size={20} color={colors.ink} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.medName, { color: colors.foreground }]}>{med.name}</Text>
                    <Text style={[styles.medDosage, { color: colors.inkMuted }]}>
                      {med.dosage} · {med.frequency}
                    </Text>
                  </View>
                </View>

                <View style={[styles.infoRow, { borderTopColor: colors.border }]}>
                  <View style={styles.infoItem}>
                    <User size={14} color={colors.clay} />
                    <Text style={[styles.infoText, { color: colors.foreground }]}>{med.prescribedBy}</Text>
                  </View>
                </View>

                <View style={[styles.reasonCard, { backgroundColor: colors.background }]}>
                  <View style={styles.reasonHeader}>
                    <Info size={14} color={colors.clay} />
                    <Text style={[styles.reasonTitle, { color: colors.clay }]}>Clinical rationale</Text>
                  </View>
                  <Text style={[styles.reasonText, { color: colors.inkMuted }]}>{med.reason}</Text>
                </View>
              </View>
            </Animated.View>
          ))}
        </View>

        <View style={{ height: 40 }} />
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
  scrollContent: { paddingHorizontal: 20, paddingTop: 12 },
  eyebrow: {
    fontSize: 11,
    fontFamily: "DMSans_500Medium",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  heading: {
    fontSize: 32,
    fontFamily: "Fraunces_400Regular",
    letterSpacing: -1,
    marginTop: 4,
  },
  subheading: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    marginTop: 8,
    lineHeight: 22,
  },
  sectionLabel: { fontSize: 20, fontFamily: "Fraunces_500Medium", letterSpacing: -0.3 },
  sectionSub: { fontSize: 13, fontFamily: "DMSans_400Regular", marginTop: 4, marginBottom: 16 },
  list: { marginTop: 20, gap: 12 },
  erxCard: { borderRadius: 20, borderWidth: 1, padding: 16 },
  erxTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  rxNum: { fontSize: 14, fontFamily: "DMSans_700Bold" },
  statusPill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 10, fontFamily: "DMSans_700Bold", textTransform: "uppercase" },
  erxDiagnosis: { fontSize: 15, fontFamily: "DMSans_600SemiBold", marginTop: 4 },
  erxMeta: { fontSize: 12, fontFamily: "DMSans_400Regular", marginTop: 2 },
  emptyCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontFamily: "DMSans_600SemiBold", marginTop: 8 },
  emptySub: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  medCard: { borderRadius: 24, borderWidth: 1, padding: 20, gap: 16 },
  medHeader: { flexDirection: "row", alignItems: "center", gap: 16 },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  medName: { fontSize: 18, fontFamily: "DMSans_600SemiBold", letterSpacing: -0.4 },
  medDosage: { fontSize: 14, fontFamily: "DMSans_400Regular", marginTop: 2 },
  infoRow: { flexDirection: "row", paddingTop: 16, borderTopWidth: 1 },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { fontSize: 13, fontFamily: "DMSans_500Medium" },
  reasonCard: { borderRadius: 16, padding: 16, gap: 8 },
  reasonHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  reasonTitle: {
    fontSize: 12,
    fontFamily: "DMSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  reasonText: { fontSize: 14, fontFamily: "DMSans_400Regular", lineHeight: 22 },
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 24,
  },
  filterLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  filterText: { fontSize: 13, fontFamily: "DMSans_400Regular" },
  clearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
});
