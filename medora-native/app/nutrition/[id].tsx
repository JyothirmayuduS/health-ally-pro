import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Flame,
  Clock,
  Zap,
  Utensils,
  Lightbulb,
  ShieldCheck,
  Info,
  Cpu,
  Shield,
  Activity,
  Sparkles,
  Heart,
  Droplets,
  ChevronRight,
} from "lucide-react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { dietMeals } from "../../lib/mock-data";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { 
  FadeInDown, 
  useAnimatedScrollHandler, 
  useAnimatedStyle, 
  useSharedValue, 
  interpolate, 
  Extrapolate 
} from "react-native-reanimated";

const { width } = Dimensions.get("window");
const HERO_HEIGHT = 320;

export default function MealDetailScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const router = useRouter();
  const scrollY = useSharedValue(0);

  const meal = dietMeals.find((m) => m.id === id);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [HERO_HEIGHT - 100, HERO_HEIGHT - 60],
      [0, 1],
      Extrapolate.CLAMP
    );
    return { 
      opacity,
      backgroundColor: colors.surface,
      borderBottomWidth: opacity > 0.5 ? 1 : 0,
      borderBottomColor: colors.border
    };
  });

  const heroStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [-HERO_HEIGHT, 0],
      [2, 1],
      Extrapolate.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [0, HERO_HEIGHT],
      [0, -HERO_HEIGHT / 2],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ scale }, { translateY }],
    };
  });

  if (!meal) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.inkMuted }}>Meal profile not found</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.clay }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* 🚀 Sticky Navigation Bar (Fades in on scroll) */}
      <Animated.View style={[styles.stickyHeader, headerStyle]}>
         <SafeAreaView edges={["top"]}>
            <View style={styles.headerInner}>
               <Pressable onPress={() => router.back()} style={styles.backBtnSmall}>
                  <ArrowLeft size={20} color={colors.foreground} />
               </Pressable>
               <Text style={[styles.stickyTitle, { color: colors.foreground }]} numberOfLines={1}>
                  {meal.name}
               </Text>
               <View style={{ width: 36 }} />
            </View>
         </SafeAreaView>
      </Animated.View>

      <Animated.ScrollView 
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={styles.container} 
        contentContainerStyle={styles.scrollContentOuter}
        showsVerticalScrollIndicator={false}
      >
        {/* 📸 Parallax Hero Image */}
        <Animated.View style={[styles.heroContainer, heroStyle]}>
          {meal.imageUrl ? (
             <Image 
              source={{ uri: meal.imageUrl }} 
              style={styles.heroImage} 
              resizeMode="cover"
             />
          ) : (
             <View style={[styles.heroImage, { backgroundColor: colors.clay + "20", justifyContent: "center", alignItems: "center" }]}>
                <Utensils size={40} color={colors.clay} />
             </View>
          )}
          <LinearGradient
            colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0.2)", "transparent"]}
            style={StyleSheet.absoluteFill}
          />
          
          <SafeAreaView edges={["top"]}>
             <View style={styles.headerFloating}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                   <ArrowLeft size={24} color="#FFF" />
                </Pressable>
                <View style={[styles.headerBadge, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                   <Text style={styles.headerBadgeText}>{meal.mealType.toUpperCase()}</Text>
                </View>
             </View>
          </SafeAreaView>
        </Animated.View>

        {/* Content Card */}
        <View style={[styles.contentCard, { backgroundColor: colors.background }]}>
          <View style={styles.dragHandle} />
          <Animated.View entering={FadeInDown.duration(600)}>
             {/* Title & Metadata */}
             <View style={styles.titleRow}>
                <View style={{ flex: 1 }}>
                   <Text style={[styles.mealName, { color: colors.foreground }]}>{meal.name}</Text>
                   {meal.aiIntelligence && (
                      <View style={styles.aiBadge}>
                         <Cpu size={12} color={colors.clay} />
                         <Text style={[styles.aiBadgeText, { color: colors.clay }]}>
                            {Math.round(meal.aiIntelligence.confidence * 100)}% Clinical Confidence · {meal.aiIntelligence.model}
                         </Text>
                      </View>
                   )}
                </View>
                <View style={[styles.budgetBadge, { backgroundColor: colors.clay + "15" }]}>
                   <Text style={[styles.budgetText, { color: colors.clay }]}>{meal.budget.toUpperCase()}</Text>
                </View>
             </View>

             <View style={styles.metaStrip}>
                <View style={styles.metaItem}>
                   <View style={[styles.metaIcon, { backgroundColor: colors.ink + "05" }]}>
                     <Flame size={14} color={colors.inkMuted} />
                   </View>
                   <Text style={[styles.metaVal, { color: colors.foreground }]}>{meal.calories} kcal</Text>
                </View>
                <View style={styles.metaItem}>
                   <View style={[styles.metaIcon, { backgroundColor: colors.ink + "05" }]}>
                     <Clock size={14} color={colors.inkMuted} />
                   </View>
                   <Text style={[styles.metaVal, { color: colors.foreground }]}>20 min</Text>
                </View>
                <View style={styles.metaItem}>
                   <View style={[styles.metaIcon, { backgroundColor: colors.clay + "10" }]}>
                     <Zap size={14} color={colors.clay} />
                   </View>
                   <Text style={[styles.metaVal, { color: colors.foreground }]}>Protein Rich</Text>
                </View>
             </View>

             {/* 🧪 Metabolic Impact Timeline */}
             {meal.metabolicImpact && (
                <View style={[styles.timelineContainer, { borderLeftColor: colors.border }]}>
                   <Text style={[styles.sectionSubtitle, { color: colors.inkMuted }]}>Metabolic Activation Timeline</Text>
                   {meal.metabolicImpact.map((impact, i) => (
                     <View key={i} style={styles.timelineItem}>
                        <View style={[styles.timelineDot, { backgroundColor: colors.clay }]} />
                        <View style={styles.timelineContent}>
                           <View style={styles.timelineHeader}>
                              <Text style={[styles.timelineTime, { color: colors.clay }]}>{impact.time}</Text>
                              <Text style={[styles.timelineEffect, { color: colors.foreground }]}>{impact.effect}</Text>
                           </View>
                           <Text style={[styles.timelineDesc, { color: colors.inkMuted }]}>{impact.description}</Text>
                        </View>
                     </View>
                   ))}
                </View>
             )}
          </Animated.View>

          {/* 🧠 Clinical Rationale */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
             <View style={styles.sectionHeader}>
                <Info size={18} color={colors.clay} />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Why this meal?</Text>
             </View>
             <View style={[styles.rationaleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.rationaleText, { color: colors.inkMuted }]}>{meal.clinicalRationale}</Text>
             </View>
          </Animated.View>

          {/* 🥙 Systemic Clinical Benefits */}
          {meal.clinicalBenefits && (
            <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
               <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 16 }]}>Systemic Biological Optimization</Text>
               <View style={styles.benefitsGrid}>
                  {meal.clinicalBenefits.map((benefit, i) => {
                    const BenefitIcon = {
                      Activity: Activity,
                      Droplets: Droplets,
                      Shield: Shield,
                      Flame: Flame,
                      Sparkles: Sparkles,
                      Heart: Heart,
                      Flash: Zap,
                    }[benefit.icon] || Sparkles;

                    return (
                      <View key={i} style={[styles.benefitCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                         <View style={[styles.benefitIconWrap, { backgroundColor: colors.clay + "10" }]}>
                            <BenefitIcon size={16} color={colors.clay} />
                         </View>
                         <Text style={[styles.benefitTitle, { color: colors.foreground }]}>{benefit.title}</Text>
                         <Text style={[styles.benefitDesc, { color: colors.inkMuted }]}>{benefit.description}</Text>
                      </View>
                    );
                  })}
               </View>
            </Animated.View>
          )}

          {/* 🥙 Ingredients */}
          <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
             <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 16 }]}>Essential Ingredients</Text>
             <View style={styles.ingredientsGrid}>
                {meal.ingredients.map((ing, i) => (
                  <View key={i} style={[styles.ingredientChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                     <View style={[styles.ingDot, { backgroundColor: colors.clay }]} />
                     <Text style={[styles.ingredientText, { color: colors.foreground }]}>{ing}</Text>
                  </View>
                ))}
             </View>
          </Animated.View>

          {/* 📚 Instructions */}
          <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
             <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 20 }]}>Preparation strategy</Text>
             {meal.instructions && meal.instructions.map((step, i) => (
               <View key={i} style={styles.stepRow}>
                  <View style={[styles.stepNumber, { backgroundColor: colors.ink }]}>
                     <Text style={styles.stepNumberText}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.stepText, { color: colors.inkMuted }]}>{step}</Text>
               </View>
             ))}
          </Animated.View>

          {/* 💡 Absorption Guard Protocol */}
          {meal.protocol && (
            <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
               <LinearGradient
                 colors={[colors.clay, "#8D5D48"]}
                 start={{ x: 0, y: 0 }}
                 end={{ x: 1, y: 1 }}
                 style={styles.protocolCardGradient}
               >
                  <View style={styles.protocolHeader}>
                     <View style={[styles.shieldBox, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                        <ShieldCheck size={20} color="#FFF" />
                     </View>
                     <Text style={[styles.protocolTitle, { color: "#FFF" }]}>Absorption Guard Protocol</Text>
                  </View>

                  <View style={styles.gapStrip}>
                     <View style={[styles.gapBadge, { backgroundColor: "rgba(255,255,255,0.9)" }]}>
                        <Clock size={16} color={colors.clay} />
                        <Text style={[styles.gapText, { color: colors.clay }]}>{meal.protocol.medGap} Gap</Text>
                     </View>
                     <Text style={[styles.gapLabel, { color: "rgba(255,255,255,0.8)" }]}>Required after taking Levothyroxine</Text>
                  </View>
               <View style={styles.cautionList}>
                     {meal.protocol.caution.map((c, i) => (
                       <View key={i} style={styles.cautionItem}>
                          <View style={[styles.cautionDot, { backgroundColor: "rgba(255,255,255,0.6)" }]} />
                          <Text style={[styles.cautionText, { color: "#FFF" }]}>{c}</Text>
                       </View>
                     ))}
                  </View>

                  <Pressable 
                    onPress={() => router.push(`/clinical-rules/${meal.id}`)}
                    style={[styles.viewRulesBtn, { backgroundColor: "rgba(255,255,255,0.2)" }]}
                  >
                     <Text style={styles.viewRulesText}>View clinical rules</Text>
                     <ChevronRight size={14} color="#FFF" />
                  </Pressable>
               </LinearGradient>
            </Animated.View>
          )}

          <View style={{ height: 60 }} />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerInner: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  stickyTitle: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    flex: 1,
    textAlign: "center",
  },
  heroContainer: {
    height: HERO_HEIGHT,
    width: "100%",
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: width,
    height: HERO_HEIGHT,
  },
  headerFloating: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  backBtnSmall: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  headerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  headerBadgeText: { 
    color: "#FFF", 
    fontSize: 10, 
    fontFamily: "Outfit-Bold", 
    letterSpacing: 2 
  },
  scrollContentOuter: {
    paddingTop: 0,
  },
  contentCard: {
    flex: 1,
    marginTop: -40,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 20,
    paddingTop: 24,
    minHeight: Dimensions.get("window").height - 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 20,
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.1)",
    alignSelf: "center",
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  mealName: {
    fontSize: 28,
    fontFamily: "Outfit-Bold",
    flex: 1,
    marginRight: 16,
  },
  budgetBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  budgetText: { fontSize: 10, fontFamily: "Outfit-Bold" },
  metaStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 32,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  metaIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  metaVal: { fontSize: 13, fontFamily: "Outfit-Bold" },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontFamily: "Outfit-Bold" },
  rationaleCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  rationaleText: { fontSize: 15, fontFamily: "Outfit-Regular", lineHeight: 24, opacity: 0.8 },
  ingredientsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  ingredientChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  ingDot: { width: 6, height: 6, borderRadius: 3 },
  ingredientText: { fontSize: 14, fontFamily: "Outfit-Medium" },
  stepRow: { flexDirection: "row", gap: 16, marginBottom: 24 },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  stepNumberText: { color: "#FFF", fontSize: 13, fontFamily: "Outfit-Bold" },
  stepText: { flex: 1, fontSize: 15, fontFamily: "Outfit-Regular", lineHeight: 24 },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  aiBadgeText: { fontSize: 11, fontFamily: "Outfit-Bold", textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionSubtitle: { fontSize: 13, fontFamily: 'Outfit-Bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  timelineContainer: { marginLeft: 10, borderLeftWidth: 2, paddingLeft: 24, gap: 24, marginBottom: 32 },
  timelineItem: { position: 'relative' },
  timelineDot: { position: 'absolute', left: -29, top: 0, width: 8, height: 8, borderRadius: 4 },
  timelineHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  timelineTime: { fontSize: 13, fontFamily: 'Outfit-Bold' },
  timelineEffect: { fontSize: 15, fontFamily: 'Outfit-Bold' },
  timelineDesc: { fontSize: 14, fontFamily: 'Outfit-Regular', lineHeight: 20 },
  benefitsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  benefitCard: { flex: 1, minWidth: 160, padding: 16, borderRadius: 20, borderWidth: 1, gap: 8 },
  benefitIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  benefitTitle: { fontSize: 15, fontFamily: 'Outfit-Bold' },
  benefitDesc: { fontSize: 12, fontFamily: 'Outfit-Regular', lineHeight: 18 },
  protocolCardGradient: { padding: 24, borderRadius: 28, overflow: 'hidden' },
  protocolHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  shieldBox: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  protocolTitle: { fontSize: 17, fontFamily: "Outfit-Bold" },
  gapStrip: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.15)" },
  gapBadge: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  gapText: { fontSize: 13, fontFamily: "Outfit-Bold" },
  gapLabel: { fontSize: 13, fontFamily: "Outfit-Medium", flex: 1 },
  cautionList: { gap: 12 },
  cautionItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  cautionDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.6)' },
  cautionText: { fontSize: 13, fontFamily: "Outfit-Regular" },
  viewRulesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  viewRulesText: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
  },
});
