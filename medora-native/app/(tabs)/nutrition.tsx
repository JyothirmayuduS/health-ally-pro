import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  Sparkles, 
  ChefHat, 
  Beef, 
  Leaf, 
  Zap, 
  Wallet, 
  ArrowRight,
  Droplets,
  Award,
  ShieldCheck,
} from "lucide-react-native";
import Animated, { 
  FadeInDown, 
  FadeInRight, 
  Layout, 
  SlideInRight,
  FadeIn
} from "react-native-reanimated";

import { useTheme } from "@/theme/ThemeProvider";
import { dietMeals, medications } from "@/lib/mock-data";

import { useRouter } from "expo-router";

export default function NutritionScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [budget, setBudget] = useState<"essential" | "balanced" | "elite">("balanced");
  const [dietType, setDietType] = useState<"all" | "vegan" | "non-veg" | "indian">("all");
  const [lactoseFree, setLactoseFree] = useState(true);

  // Check if patient takes Levothyroxine for clinical warnings
  const takesThyroidMeds = medications.some(m => m.name.includes("Levothyroxine"));

  // Filter Logic
  const filteredMeals = useMemo(() => {
    return dietMeals.filter(m => {
      const budgetMatch = m.budget === budget;
      const typeMatch = dietType === "all" || m.type === dietType || (dietType === "indian" && m.id.startsWith("in"));
      const lactoseMatch = !lactoseFree || m.lactoseFree === true;
      return budgetMatch && typeMatch && lactoseMatch;
    });
  }, [budget, dietType, lactoseFree]);

  const mealsByTime = {
    breakfast: filteredMeals.filter(m => m.mealType === "breakfast"),
    lunch: filteredMeals.filter(m => m.mealType === "lunch"),
    dinner: filteredMeals.filter(m => m.mealType === "dinner"),
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <View style={s.header}>
            <Text style={[s.title, { color: colors.foreground }]}>Your Clinical Diet</Text>
            <Text style={[s.subtitle, { color: colors.inkMuted }]}>
              Nutritionally optimized for {takesThyroidMeds ? "Thyroid Support" : "Metabolic Health"}
            </Text>
          </View>
        </Animated.View>

        {/* 1. Budget Selector (Zero-Gravity Segmented Control) */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <View style={[s.budgetBar, { backgroundColor: colors.surface }]}>
            {(["essential", "balanced", "elite"] as const).map((b) => (
              <Pressable 
                key={b} 
                onPress={() => setBudget(b)} 
                style={[
                  s.budgetBtn, 
                  budget === b && { backgroundColor: colors.ink }
                ]}
              >
                <Text style={[
                  s.budgetTxt, 
                  { color: budget === b ? colors.primaryForeground : colors.inkMuted }
                ]}>
                  {b.charAt(0).toUpperCase() + b.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* 2. Preference Filters (Chips) */}
        <Animated.View entering={FadeInRight.duration(400).delay(200)}>
           <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
              {[
                { id: "all", label: "All Food", icon: ChefHat },
                { id: "indian", label: "Indian", icon: Sparkles },
                { id: "vegan", label: "Vegan", icon: Leaf },
                { id: "non-veg", label: "Non-Veg", icon: Beef },
              ].map((f) => (
                <Pressable 
                   key={f.id} 
                   onPress={() => setDietType(f.id as any)}
                   style={[
                     s.filterChip, 
                     { backgroundColor: colors.surface, borderColor: dietType === f.id ? colors.clay : colors.border },
                     dietType === f.id && { borderWidth: 1.5 }
                   ]}
                >
                   <f.icon size={14} color={dietType === f.id ? colors.clay : colors.inkMuted} />
                   <Text style={[s.filterTxt, { color: dietType === f.id ? colors.foreground : colors.inkMuted }]}>{f.label}</Text>
                </Pressable>
              ))}
              <Pressable 
                 onPress={() => setLactoseFree(!lactoseFree)}
                 style={[
                    s.filterChip, 
                    { backgroundColor: colors.surface, borderColor: lactoseFree ? "#4CAF7D" : colors.border },
                    lactoseFree && { borderWidth: 1.5 }
                 ]}
              >
                 <Droplets size={14} color={lactoseFree ? "#4CAF7D" : colors.inkMuted} />
                 <Text style={[s.filterTxt, { color: lactoseFree ? colors.foreground : colors.inkMuted }]}>Lactose-Free</Text>
              </Pressable>
           </ScrollView>
        </Animated.View>

        {/* 3. Clinical Warning (Absorption Guard) */}
        {takesThyroidMeds && (
          <Animated.View entering={FadeIn.duration(600).delay(300)}>
             <View style={[s.warningCard, { backgroundColor: colors.surface, borderColor: colors.clay + "30" }]}>
                <View style={[s.shieldWrap, { backgroundColor: colors.clay + "15" }]}>
                   <ShieldCheck size={22} color={colors.clay} />
                </View>
                <View style={{ flex: 1 }}>
                   <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <Text style={[s.warningTitle, { color: colors.foreground }]}>Absorption Guard Protocol</Text>
                      <View style={[s.activeBadge, { backgroundColor: "#4CAF7D15" }]}>
                         <Text style={{ fontSize: 9, color: "#4CAF7D", fontFamily: 'DMSans_700Bold' }}>ACTIVE</Text>
                      </View>
                   </View>
                   <Text style={[s.warningBody, { color: colors.inkMuted }]}>
                      Your plan is currently avoiding competitive nutrients (Iron, Calcium, Soy) to maximize medication bioavailability. 
                   </Text>
                   <Pressable 
                     onPress={() => {
                        const firstMeal = filteredMeals[0] || dietMeals[0];
                        router.push(`/clinical-rules/${firstMeal.id}`);
                     }}
                     style={{ marginTop: 10 }}
                   >
                      <Text style={{ fontSize: 13, color: colors.clay, fontFamily: 'DMSans_600SemiBold' }}>View Clinical Rules →</Text>
                   </Pressable>
                </View>
             </View>
          </Animated.View>
        )}

        {/* 4. The Meal Schedule */}
        <View style={s.mealsContainer}>
          {([
            { type: "breakfast", label: "Breakfast (Safe Zone)", icon: Zap },
            { type: "lunch", label: "Lunch (Nutrient Peak)", icon: Award },
            { type: "dinner", label: "Dinner (Restorative)", icon: ChefHat },
          ] as const).map((slot, idx) => {
            const meal = mealsByTime[slot.type][0]; // Take the first matching meal for now
            if (!meal) return null;

            return (
              <Animated.View 
                key={slot.type}
                entering={FadeInDown.duration(400).delay(400 + idx * 100)}
                layout={Layout.springify()}
                style={s.mealBlock}
              >
                <View style={s.slotHeader}>
                   <slot.icon size={16} color={colors.inkMuted} />
                   <Text style={[s.slotTitle, { color: colors.inkMuted }]}>{slot.label}</Text>
                </View>
                
                <Pressable 
                  onPress={() => router.push({ pathname: "/nutrition/[id]", params: { id: meal.id } })}
                  style={[s.mealCard, { backgroundColor: colors.surface }]}
                >
                   <View style={s.mealInfo}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={[s.mealName, { color: colors.foreground }]}>{meal.name}</Text>
                        <ArrowRight size={16} color={colors.border} />
                      </View>
                      <View style={s.nutrientRow}>
                         {meal.nutrients.map(n => (
                           <View key={n} style={[s.nTag, { backgroundColor: colors.border }]}>
                              <Text style={[s.nTagTxt, { color: colors.inkMuted }]}>{n}</Text>
                           </View>
                         ))}
                      </View>
                      <Text style={[s.ingredients, { color: colors.inkMuted }]} numberOfLines={1}>
                        {meal.ingredients.join(" · ")}
                      </Text>
                   </View>
                   <View style={s.kcalWrap}>
                      <Text style={[s.kcalNum, { color: colors.foreground }]}>{meal.calories}</Text>
                      <Text style={[s.kcalUnit, { color: colors.inkMuted }]}>KCAL</Text>
                   </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 100 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontFamily: "Fraunces_600SemiBold", letterSpacing: -0.5 },
  subtitle: { fontSize: 15, fontFamily: "DMSans_400Regular", marginTop: 4 },

  budgetBar: { flexDirection: "row", borderRadius: 20, padding: 4, marginBottom: 24 },
  budgetBtn: { flex: 1, paddingVertical: 12, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  budgetTxt: { fontSize: 13, fontFamily: "DMSans_600SemiBold" },

  filterRow: { gap: 12, marginBottom: 32, paddingRight: 40 },
  filterChip: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100, backgroundColor: "#fff" },
  filterTxt: { fontSize: 13, fontFamily: "DMSans_500Medium" },

  warningCard: { flexDirection: "row", padding: 22, borderRadius: 24, borderWidth: 1, gap: 16, marginBottom: 32, shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  shieldWrap: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  activeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  warningTitle: { fontSize: 16, fontFamily: "DMSans_700Bold" },
  warningBody: { fontSize: 13, fontFamily: "DMSans_400Regular", lineHeight: 20, opacity: 0.8 },

  mealsContainer: { gap: 32 },
  mealBlock: { gap: 12 },
  slotHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  slotTitle: { fontSize: 12, fontFamily: "DMSans_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8 },
  
  mealCard: { flexDirection: "row", padding: 22, borderRadius: 28, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  mealInfo: { flex: 1 },
  mealName: { fontSize: 18, fontFamily: "Fraunces_500Medium", marginBottom: 12 },
  nutrientRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  nTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  nTagTxt: { fontSize: 10, fontFamily: "DMSans_700Bold", textTransform: "uppercase" },
  ingredients: { fontSize: 14, fontFamily: "DMSans_400Regular", lineHeight: 20 },
  
  kcalWrap: { alignItems: "center", justifyContent: "center", borderLeftWidth: 1, borderLeftColor: "rgba(0,0,0,0.05)", paddingLeft: 20, marginLeft: 16 },
  kcalNum: { fontSize: 20, fontFamily: "Fraunces_600SemiBold" },
  kcalUnit: { fontSize: 10, fontFamily: "DMSans_700Bold", marginTop: 2 }
});
