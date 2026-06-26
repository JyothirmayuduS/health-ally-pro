import React, { useCallback } from "react";
import { View } from "react-native";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts, Fraunces_400Regular, Fraunces_500Medium } from "@expo-google-fonts/fraunces";
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from "@expo-google-fonts/dm-sans";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { usePatientSyncBootstrap } from "@/lib/usePatientSyncBootstrap";

import "../global.css";

SplashScreen.preventAutoHideAsync();

function PatientSyncRoot() {
  usePatientSyncBootstrap();
  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade_from_bottom" }}>
      <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
      <Stack.Screen name="medications" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="medication/[id]" options={{ presentation: "modal" }} />
      <Stack.Screen name="refill/[id]" options={{ presentation: "modal" }} />
      <Stack.Screen name="clinical-rules/[mealId]" options={{ presentation: "card" }} />
      <Stack.Screen name="ai-assistant/index" options={{ presentation: "modal" }} />
      <Stack.Screen name="upload/index" options={{ presentation: "transparentModal", animation: "fade" }} />
      <Stack.Screen name="settings/edit" options={{ presentation: "modal" }} />
      <Stack.Screen name="settings/family-create" options={{ presentation: "transparentModal", animation: "fade" }} />
      <Stack.Screen name="settings/privacy" options={{ presentation: "card" }} />
      <Stack.Screen name="settings/support" options={{ presentation: "card" }} />
      <Stack.Screen name="settings/terms" options={{ presentation: "card" }} />
      <Stack.Screen name="notifications/index" options={{ presentation: "modal" }} />
      <Stack.Screen name="visits/index" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="visits/[visitId]" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_400Regular,
    Fraunces_500Medium,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <View className="flex-1 bg-background" onLayout={onLayoutRootView}>
            <StatusBar style="auto" />
            <PatientSyncRoot />
          </View>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
