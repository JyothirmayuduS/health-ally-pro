import React from "react";
import { View, Text } from "react-native";

interface BadgeProps {
  label: string;
  variant?: "default" | "clay" | "muted";
}

export function Badge({ label, variant = "default" }: BadgeProps) {
  const bgClass =
    variant === "clay"
      ? "bg-clay-soft"
      : variant === "muted"
        ? "bg-surface-2"
        : "bg-surface";
  const textClass = variant === "clay" ? "text-clay" : "text-ink-muted";

  return (
    <View className={`${bgClass} rounded-full px-2.5 py-0.5`}>
      <Text
        className={`${textClass} text-[10px] font-sans-medium uppercase`}
        style={{ letterSpacing: 2.5 }}
      >
        {label}
      </Text>
    </View>
  );
}
