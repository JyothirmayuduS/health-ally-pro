import json

with open('scratch.json', 'r') as f:
    chunks = json.load(f)

with open('/Users/s.jyothirmayudu/Downloads/health-ally-pro-main/medora-native/app/(tabs)/index.tsx', 'r') as f:
    content = f.read()

new_chunk1 = """// ─── Minimal Progress Ring ──────────────────────────────────
function MedMiniRing({ pct, colors }: { pct: number; colors: any }) {
  const size = 38;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * pct) / 100;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <SvgCircle cx={size / 2} cy={size / 2} r={radius} stroke={colors.border} strokeWidth={strokeWidth} fill="none" />
        <SvgCircle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={colors.clay} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transform: [{ rotate: "-90deg" }], transformOrigin: "center" }}
        />
      </Svg>
      <Text style={{ fontSize: 11, fontFamily: "Fraunces_600SemiBold", color: colors.foreground }}>{pct}%</Text>
    </View>
  );
}

// ─── Professional Med Card ────────────────────────────────────
function MedCard({ med, colors, delay, onToggle }: { med: any; colors: any; delay: number; onToggle: (id: string, next: boolean) => void }) {
  const taken = med.taken;
  const cardScale = useSharedValue(1);
  const checkScale = useSharedValue(taken ? 1 : 0);
  const checkProgress = useSharedValue(taken ? 1 : 0);

  const toggle = useCallback(() => {
    const next = !taken;
    onToggle(med.id, next);

    cardScale.value = withSequence(
      withTiming(0.96, { duration: 80 }),
      withSpring(1, { damping: 14, stiffness: 200 })
    );

    checkScale.value = next
      ? withSequence(withTiming(0, { duration: 60 }), withSpring(1, { damping: 10, stiffness: 240 }))
      : withTiming(0, { duration: 150 });

    checkProgress.value = withTiming(next ? 1 : 0, { duration: 250 });
  }, [taken]);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    borderColor: checkProgress.value > 0.5 ? colors.clay : colors.border,
  }));

  const checkFillStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  const checkWrapStyle = useAnimatedStyle(() => ({
    backgroundColor: checkProgress.value > 0.5 ? `rgba(182,120,92,0.15)` : "transparent",
  }));

  const hour = parseInt((med.time || "8:00").split(":")[0], 10);
  const timeBg = hour < 12 ? "#FFF4DC" : "#E8F5E9";
  const timeColor = hour < 12 ? "#B8860B" : "#388E3C";

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(delay)} style={[mc.card, { backgroundColor: colors.surface }, cardAnimStyle]}>
      <View style={mc.topRow}>
        <View style={[mc.badge, { backgroundColor: timeBg }]}>
          <Text style={[mc.badgeText, { color: timeColor }]}>{med.time}</Text>
        </View>
        <Pressable onPress={toggle} hitSlop={15}>
          <Animated.View style={[mc.checkWrap, { borderColor: taken ? colors.clay : colors.border }, checkWrapStyle]}>
            <Animated.View style={[mc.checkFill, { backgroundColor: colors.clay }, checkFillStyle]}>
              <Text style={mc.checkMark}>✓</Text>
            </Animated.View>
          </Animated.View>
        </Pressable>
      </View>
      
      <View style={mc.infoWrap}>
        <View style={mc.iconWrap}>
          <Pill size={18} color={taken ? colors.inkMuted : colors.clay} />
        </View>
        <Text style={[mc.name, { color: taken ? colors.inkMuted : colors.foreground }, taken && mc.nameStruck]} numberOfLines={1}>
          {med.name}
        </Text>
        <Text style={[mc.dosage, { color: colors.inkMuted }]}>{med.dosage}</Text>
      </View>

      <View style={mc.bottomRow}>
        <Text style={[mc.reason, { color: colors.inkMuted }]} numberOfLines={1}>{med.reason}</Text>
      </View>
    </Animated.View>
  );
}

const mc = StyleSheet.create({
  card: { width: 170, borderRadius: 24, borderWidth: 1, padding: 16, justifyContent: "space-between", height: 165 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontFamily: "DMSans_600SemiBold", letterSpacing: 0.2 },
  checkWrap: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  checkFill: { width: 14, height: 14, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  checkMark: { color: "#fff", fontSize: 10, fontFamily: "DMSans_700Bold" },
  infoWrap: { marginTop: 12 },
  iconWrap: { marginBottom: 6 },
  name: { fontSize: 15, fontFamily: "DMSans_600SemiBold", letterSpacing: -0.2 },
  nameStruck: { textDecorationLine: "line-through", opacity: 0.6 },
  dosage: { fontSize: 12, fontFamily: "DMSans_400Regular", marginTop: 2 },
  bottomRow: { marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(0,0,0,0.06)" },
  reason: { fontSize: 11, fontFamily: "DMSans_500Medium", lineHeight: 15 }
});
"""

new_chunk2 = """        {/* ✧ HORIZONTAL MEDICATIONS ───────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400).delay(230)}>
          <View style={s.sectionHeader}>
            <View>
              <Text style={[s.sectionTitle, { color: colors.foreground }]}>
                Today's Medications
              </Text>
              <Text style={[s.sectionMeta, { color: colors.inkMuted, marginTop: 4 }]}>
                {takenMeds} of {totalMeds} taken today
              </Text>
            </View>
            <MedMiniRing pct={medPct} colors={colors} />
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ gap: 14 }}
            snapToInterval={170 + 14}
            decelerationRate="fast"
          >
            {medsList.map((med, i) => (
              <MedCard key={med.id} med={med} colors={colors} delay={200 + i * 80} onToggle={handleMedToggle} />
            ))}
          </ScrollView>
        </Animated.View>
"""

new_chunk3 = ""

content = content.replace(chunks['chunk1'], new_chunk1)
content = content.replace(chunks['chunk2'], new_chunk2)
content = content.replace(chunks['chunk3'], new_chunk3)

# Remove unused mp and mr styles so we don't have dangling code
content = content.replace('// ─── styles ────────────────────────────────────────────────────', '''// ─── styles ────────────────────────────────────────────────────\n''')

with open('/Users/s.jyothirmayudu/Downloads/health-ally-pro-main/medora-native/app/(tabs)/index.tsx', 'w') as f:
    f.write(content)

print("Replaced successfully!")
