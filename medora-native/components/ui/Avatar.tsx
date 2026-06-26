import React from "react";
import { View, Text } from "react-native";

interface AvatarProps {
  initials: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "clay" | "ink" | "surface";
}

const sizes = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
  xl: "h-20 w-20",
};

const textSizes = {
  sm: "text-[10px]",
  md: "text-xs",
  lg: "text-lg",
  xl: "text-2xl",
};

export function Avatar({ initials, size = "md", variant = "clay" }: AvatarProps) {
  const bgClass = variant === "clay" ? "bg-clay-soft" : variant === "ink" ? "bg-ink" : "bg-surface-2";
  const textClass = variant === "ink" ? "text-primary-foreground" : "text-ink";

  return (
    <View className={`${sizes[size]} ${bgClass} rounded-full items-center justify-center`}>
      <Text className={`font-serif ${textSizes[size]} ${textClass}`}>
        {initials}
      </Text>
    </View>
  );
}
