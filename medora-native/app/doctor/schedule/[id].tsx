import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  Clock,
  ChevronRight,
  CheckCircle2,
} from "lucide-react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { doctors } from "../../../lib/mock-data";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { useState } from "react";

const { width } = Dimensions.get("window");

export default function ScheduleDetailScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const router = useRouter();
  const doc = doctors.find((d) => d.id === id);

  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  if (!doc) return null;

  const dates = [
    { day: "Mon", date: "20", label: "Today" },
    { day: "Tue", date: "21", label: "Tomorrow" },
    { day: "Wed", date: "22", label: "Wed" },
    { day: "Thu", date: "23", label: "Thu" },
    { day: "Fri", date: "24", label: "Fri" },
  ];

  const slots = [
    "09:00 AM", "09:30 AM", "10:15 AM", "11:00 AM",
    "02:30 PM", "03:15 PM", "04:00 PM", "04:45 PM"
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, { borderColor: colors.border }]}>
            <ArrowLeft size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Select Schedule</Text>
          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Clinician Summary */}
        <Animated.View entering={FadeInDown.duration(400)} style={[styles.docBrief, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.initialsBox, { backgroundColor: colors.clay + "15" }]}>
            <Text style={[styles.initialsText, { color: colors.clay }]}>{doc.initials}</Text>
          </View>
          <View>
            <Text style={[styles.docName, { color: colors.foreground }]}>{doc.name}</Text>
            <Text style={[styles.docSpec, { color: colors.inkMuted }]}>{doc.specialty}</Text>
          </View>
        </Animated.View>

        {/* Date Selector */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Available Dates</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateList}>
            {dates.map((d, i) => (
              <Pressable 
                key={i} 
                onPress={() => setSelectedDate(i)}
                style={[
                  styles.dateCard, 
                  { backgroundColor: selectedDate === i ? colors.ink : colors.surface, borderColor: colors.border }
                ]}
              >
                <Text style={[styles.dateDay, { color: selectedDate === i ? "#FFF" : colors.inkMuted }]}>{d.day}</Text>
                <Text style={[styles.dateNum, { color: selectedDate === i ? "#FFF" : colors.foreground }]}>{d.date}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Time slots */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Time Slots</Text>
            <View style={styles.tzBadge}>
              <Text style={[styles.tzText, { color: colors.inkMuted }]}>GMT +5:30</Text>
            </View>
          </View>
          <View style={styles.slotGrid}>
            {slots.map((s, i) => (
              <Pressable 
                key={i} 
                onPress={() => setSelectedSlot(s)}
                style={[
                  styles.slotCard, 
                  { 
                    backgroundColor: selectedSlot === s ? colors.clay + "15" : colors.surface, 
                    borderColor: selectedSlot === s ? colors.clay : colors.border 
                  }
                ]}
              >
                <Clock size={16} color={selectedSlot === s ? colors.clay : colors.inkMuted} />
                <Text style={[styles.slotText, { color: selectedSlot === s ? colors.clay : colors.foreground }]}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Professional Note */}
        <Animated.View entering={FadeIn.delay(300)} style={[styles.noteBox, { backgroundColor: colors.ink + "05" }]}>
          <Calendar size={18} color={colors.inkMuted} />
          <Text style={[styles.noteText, { color: colors.inkMuted }]}>
            Appointments booked here are confirmed instantly. You can cancel or reschedule up to 12 hours before the start time.
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Action Footer */}
      <SafeAreaView edges={["bottom"]} style={[styles.footer, { borderTopColor: colors.border }]}>
        <Pressable 
          style={[
            styles.confirmBtn, 
            { backgroundColor: selectedSlot ? colors.ink : colors.border }
          ]}
          disabled={!selectedSlot}
        >
          <Text style={styles.confirmText}>Confirm Appointment</Text>
          <CheckCircle2 size={18} color="#FFF" />
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 17, fontFamily: "Outfit-Bold" },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 },
  docBrief: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 32,
  },
  initialsBox: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  initialsText: { fontSize: 18, fontFamily: "Outfit-Bold" },
  docName: { fontSize: 18, fontFamily: "Outfit-Bold" },
  docSpec: { fontSize: 14, fontFamily: "Outfit-Medium" },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontFamily: "Outfit-Bold" },
  tzBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: "rgba(0,0,0,0.03)" },
  tzText: { fontSize: 11, fontFamily: "Outfit-Medium" },
  dateList: { gap: 12, paddingRight: 20 },
  dateCard: {
    width: 64,
    height: 80,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  dateDay: { fontSize: 12, fontFamily: "Outfit-Medium" },
  dateNum: { fontSize: 20, fontFamily: "Outfit-Bold" },
  slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  slotCard: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  slotText: { fontSize: 14, fontFamily: "Outfit-Bold" },
  noteBox: {
    padding: 20,
    borderRadius: 20,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  noteText: { flex: 1, fontSize: 13, fontFamily: "Outfit-Medium", lineHeight: 20 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  confirmBtn: {
    height: 56,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  confirmText: { color: "#FFF", fontSize: 16, fontFamily: "Outfit-Bold" },
});
