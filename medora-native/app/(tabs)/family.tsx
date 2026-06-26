import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { ChevronLeft, Plus, Activity, CalendarClock, ShieldAlert } from "lucide-react-native";
import Svg, { Circle } from "react-native-svg";
import { useTheme } from "@/theme/ThemeProvider";
import { familyMembers, FamilyMember } from "@/lib/mock-data";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function ProgressRing({ progress, color }: { progress: number; color: string }) {
  const size = 64;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeOpacity={0.15}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={{ fontFamily: "DMSans_700Bold", fontSize: 13, color }}>{progress}%</Text>
    </View>
  );
}

function DependentCard({ member, delay }: { member: FamilyMember; delay: number }) {
  const { colors } = useTheme();

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(delay)}>
      <Pressable style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        
        <View style={s.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[s.avatar, { backgroundColor: member.avatarColor }]}>
              <Text style={s.avatarText}>{member.initials}</Text>
            </View>
            <View>
              <Text style={[s.memberName, { color: colors.foreground }]}>{member.name}</Text>
              <View style={s.badgeRow}>
                <View style={[s.relationBadge, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[s.relationText, { color: colors.inkMuted }]}>{member.relation} · {member.age}y</Text>
                </View>
              </View>
            </View>
          </View>
          <ProgressRing progress={member.medicalProgress} color={member.avatarColor} />
        </View>

        <View style={[s.divider, { backgroundColor: colors.border }]} />

        <View style={s.planRow}>
          <View style={[s.iconBox, { backgroundColor: member.avatarColor + '15' }]}>
            <Activity size={16} color={member.avatarColor} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.infoLabel, { color: colors.inkMuted }]}>Current Care Plan</Text>
            <Text style={[s.infoValue, { color: colors.foreground }]}>{member.currentPlan}</Text>
          </View>
        </View>

        {member.nextAppt && (
          <View style={s.planRow}>
            <View style={[s.iconBox, { backgroundColor: colors.clay + '15' }]}>
              <CalendarClock size={16} color={colors.clay} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.infoLabel, { color: colors.inkMuted }]}>Next Consultation</Text>
              <Text style={[s.infoValue, { color: colors.foreground }]}>{member.nextAppt}</Text>
            </View>
          </View>
        )}

      </Pressable>
    </Animated.View>
  );
}

export default function FamilyTrackingScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft size={24} color={colors.foreground} strokeWidth={2} />
        </Pressable>
        <Text style={[s.headerTitle, { color: colors.foreground }]}>Dependents</Text>
        <Pressable 
          onPress={() => router.push("/settings/family-create")}
          style={[s.addBtn, { backgroundColor: colors.ink }]}
        >
          <Plus size={16} color={colors.primaryForeground} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(400)}>
          <View style={[s.banner, { backgroundColor: '#4CAF5015' }]}>
            <ShieldAlert size={18} color="#4CAF50" strokeWidth={2} />
            <Text style={[s.bannerText, { color: '#2E7D32' }]}>
              Family tracking is HIPAA compliant. You have full proxy access to manage these clinical profiles.
            </Text>
          </View>
        </Animated.View>

        {familyMembers.map((fm, i) => (
          <DependentCard key={fm.id} member={fm} delay={100 + i * 100} />
        ))}
      </ScrollView>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center'
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Fraunces_600SemiBold",
  },
  addBtn: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center'
  },
  scroll: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  banner: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginBottom: 4,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
    lineHeight: 20,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: "DMSans_700Bold",
  },
  memberName: {
    fontSize: 20,
    fontFamily: "Fraunces_600SemiBold",
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  relationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  relationText: {
    fontSize: 10,
    fontFamily: "DMSans_600SemiBold",
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: "DMSans_500Medium",
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 14,
    fontFamily: "DMSans_600SemiBold",
  }
});
