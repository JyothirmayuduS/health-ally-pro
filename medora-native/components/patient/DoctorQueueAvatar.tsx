import React from "react";
import { Image, StyleSheet, View } from "react-native";
import type { DoctorGender } from "@/lib/doctor-gender";
import { DOCTOR_QUEUE_IMAGES } from "@/lib/queue-persona-assets";

type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, { w: number; h: number }> = {
  sm: { w: 44, h: 56 },
  md: { w: 56, h: 72 },
  lg: { w: 72, h: 96 },
};

type Props = {
  gender: DoctorGender;
  size?: Size;
  active?: boolean;
};

export function DoctorQueueAvatar({ gender, size = "md", active = false }: Props) {
  const dim = SIZES[size];
  return (
    <View style={active ? s.active : undefined}>
      <Image
        source={DOCTOR_QUEUE_IMAGES[gender]}
        style={{ width: dim.w, height: dim.h }}
        resizeMode="contain"
      />
    </View>
  );
}

const s = StyleSheet.create({
  active: {
    shadowColor: "#7A9B7E",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
});
