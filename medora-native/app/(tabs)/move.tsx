import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Dumbbell, Heart, Wind, Check } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import {
  getTodayAdherence,
  isRoutineCompletedToday,
  recordExerciseCompletion,
} from "@/lib/exercise-session-store";

const ROUTINES = [
  {
    id: "r1",
    name: "Gentle neck mobility",
    duration: "8 min",
    category: "Mobility",
    icon: Dumbbell,
  },
  {
    id: "r2",
    name: "Thyroid-safe cardio walk",
    duration: "12 min",
    category: "Cardio",
    icon: Heart,
  },
  {
    id: "r3",
    name: "Box breathing reset",
    duration: "5 min",
    category: "Breathing",
    icon: Wind,
  },
];

export default function MoveScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [adherence, setAdherence] = useState({ completed: 0, prescribed: ROUTINES.length, pct: 0 });

  useEffect(() => {
    void (async () => {
      const next: Record<string, boolean> = {};
      for (const routine of ROUTINES) {
        next[routine.id] = await isRoutineCompletedToday(routine.id);
      }
      setCompleted(next);
      setAdherence(await getTodayAdherence(ROUTINES.length));
    })();
  }, []);

  const completeRoutine = async (routine: (typeof ROUTINES)[number]) => {
    await recordExerciseCompletion({
      routineId: routine.id,
      routineName: routine.name,
      slot: "morning",
      painLevel: 3,
      difficulty: "ok",
      durationSeconds: Number.parseInt(routine.duration, 10) * 60 || 480,
    });
    setCompleted((prev) => ({ ...prev, [routine.id]: true }));
    setAdherence(await getTodayAdherence(ROUTINES.length));
  };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={s.header}>
        <Pressable
          onPress={() => router.back()}
          style={s.backBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Returns to the previous screen"
        >
          <ChevronLeft size={24} color={colors.foreground} strokeWidth={2.25} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[s.eyebrow, { color: colors.clay }]}>Recovery movement</Text>
          <Text style={[s.title, { color: colors.foreground }]}>Move</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={[s.subtitle, { color: colors.inkMuted }]}>
          Med-synced routines for mobility, cardio, and breathing recovery.
        </Text>
        <Text style={[s.adherence, { color: colors.ink }]}>
          Today: {adherence.completed}/{adherence.prescribed} · {adherence.pct}%
        </Text>

        {ROUTINES.map((routine) => {
          const Icon = routine.icon;
          const done = completed[routine.id];
          return (
            <Pressable
              key={routine.id}
              style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              accessibilityRole="button"
              accessibilityLabel={routine.name}
              accessibilityHint={
                done ? "Already completed today" : "Marks routine complete and saves to device storage"
              }
              onPress={() => void completeRoutine(routine)}
            >
              <View style={[s.iconBox, { backgroundColor: colors.clay + "18" }]}>
                <Icon size={20} color={colors.clay} strokeWidth={1.75} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.cardTitle, { color: colors.foreground }]}>{routine.name}</Text>
                <Text style={[s.cardMeta, { color: colors.inkMuted }]}>
                  {routine.category} · {routine.duration}
                </Text>
              </View>
              {done ? <Check size={20} color={colors.clay} strokeWidth={2.5} /> : null}
            </Pressable>
          );
        })}
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
    fontSize: 32,
    marginTop: 4,
  },
  content: { paddingHorizontal: 20, paddingBottom: 32, gap: 12 },
  subtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  adherence: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 14,
    marginBottom: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    padding: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 16,
  },
  cardMeta: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    marginTop: 2,
  },
});
