import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  withRepeat, 
  withSequence, 
  withTiming,
  FadeIn,
  FadeOut,
  Layout
} from 'react-native-reanimated';
import { 
  ChefHat, 
  Activity, 
  Pill, 
  Brain, 
  Sparkles,
  Stethoscopes as Stethoscope
} from 'lucide-react-native';
import { AIIntent } from '@/lib/ai/brain';

interface AILoaderProps {
  intent: AIIntent;
  isLoading: boolean;
  colors: any;
}

export function AILoader({ intent, isLoading, colors }: AILoaderProps) {
  const pulseStyle = useAnimatedStyle(() => {
    if (!isLoading) return { transform: [{ scale: 1 }], opacity: 1 };
    return {
      transform: [
        {
          scale: withRepeat(
            withSequence(
              withTiming(1.1, { duration: 800 }),
              withTiming(1, { duration: 800 })
            ),
            -1,
            true
          ),
        },
      ],
      opacity: withRepeat(
        withSequence(
          withTiming(0.6, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      ),
    };
  });

  const getIcon = () => {
    switch (intent) {
      case 'DIET':
        return <ChefHat size={32} color={colors.clay} strokeWidth={1.5} />;
      case 'SYMPTOM':
        return <Activity size={32} color={colors.clay} strokeWidth={1.5} />;
      case 'MEDICINE':
        return <Pill size={32} color={colors.clay} strokeWidth={1.5} />;
      case 'DOUBT':
        return <Brain size={32} color={colors.clay} strokeWidth={1.5} />;
      default:
        return <Sparkles size={32} color={colors.clay} strokeWidth={1.5} />;
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.ring, { borderColor: colors.clay + '20' }, pulseStyle]}>
        <Animated.View style={[styles.innerRing, { borderColor: colors.clay + '40' }]} />
      </Animated.View>
      <Animated.View 
        key={intent}
        entering={FadeIn.duration(400)}
        exiting={FadeOut.duration(400)}
        layout={Layout.springify()}
        style={styles.iconBox}
      >
        {getIcon()}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#B6785C",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
