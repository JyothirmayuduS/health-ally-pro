import React from "react";
import { View } from "react-native";

interface ProgressDotsProps {
  total: number;
  current: number;
  activeColor?: string;
  partialColor?: string;
}

export function ProgressDots({
  total,
  current,
  activeColor = "bg-clay",
  partialColor = "bg-clay opacity-30",
}: ProgressDotsProps) {
  return (
    <View className="flex-row items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className={`h-1.5 flex-1 rounded-full ${
            i < current ? activeColor : i === current ? partialColor : "bg-border"
          }`}
        />
      ))}
    </View>
  );
}
