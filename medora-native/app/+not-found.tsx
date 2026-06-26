import React from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background items-center justify-center px-6">
      <Text className="font-serif text-7xl text-foreground">404</Text>
      <Text className="mt-4 font-serif text-2xl text-foreground">Page not found</Text>
      <Text className="mt-2 text-sm text-ink-muted font-sans text-center">
        The page you're looking for doesn't exist or has been moved.
      </Text>
      <Pressable
        onPress={() => router.replace("/")}
        className="mt-6 bg-ink rounded-full px-5 py-2.5"
      >
        <Text className="text-sm font-sans-medium text-primary-foreground">Return home</Text>
      </Pressable>
    </View>
  );
}
