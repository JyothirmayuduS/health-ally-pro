import React from "react";
import { View, TextInput, type TextInputProps } from "react-native";
import { Search } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";

interface SearchInputProps extends TextInputProps {
  containerClassName?: string;
}

export function SearchInput({ containerClassName = "", ...props }: SearchInputProps) {
  const { colors } = useTheme();

  return (
    <View className={`relative flex-row items-center ${containerClassName}`}>
      <View className="absolute left-4 z-10">
        <Search size={16} color={colors.inkMuted} strokeWidth={1.75} />
      </View>
      <TextInput
        className="flex-1 rounded-full border border-border bg-surface py-3 pl-11 pr-5 text-sm font-sans text-ink"
        placeholderTextColor={colors.inkMuted}
        {...props}
      />
    </View>
  );
}
