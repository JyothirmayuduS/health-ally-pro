import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { 
  ArrowLeft, 
  Send, 
  Sparkles, 
  HelpCircle, 
  MessageSquare,
  ChevronRight,
  Paperclip,
  Mic
} from "lucide-react-native";
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  Layout, 
  ZoomIn 
} from "react-native-reanimated";
import { useTheme } from "@/theme/ThemeProvider";
import { AILoader } from "@/components/ai/AILoader";
import { classifyAndAnswer, AIResponse, AIIntent } from "@/lib/ai/brain";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  intent?: AIIntent;
  source?: string;
  suggestedAction?: { label: string; route: string };
}

export default function AIAssistantScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      text: "Hello! I'm your Medora Intelligence assistant. How can I help you today with your diet, symptoms, or medications?", 
      isBot: true 
    }
  ]);
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState("");
  const [currentIntent, setCurrentIntent] = useState<AIIntent>('GENERAL');
  
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), text: input, isBot: false };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // The Brain now uses LangChain-style callbacks to update status in real-time
      const response: AIResponse = await classifyAndAnswer(userMsg.text, (step) => {
        setAnalysisStatus(step);
      });

      setCurrentIntent(response.intent);

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: response.answer,
        isBot: true,
        intent: response.intent,
        source: response.source,
        suggestedAction: response.suggestedAction
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.background }]} edges={["top"]}>
      {/* ── Header ────────────────────────────────────────── */}
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft size={22} color={colors.ink} />
        </Pressable>
        <View style={s.headerTitleGroup}>
          <Text style={[s.title, { color: colors.foreground }]}>Medora AI</Text>
          <View style={[s.statusBadge, { backgroundColor: '#4CAF7D20' }]}>
            <View style={[s.statusDot, { backgroundColor: '#4CAF7D' }]} />
            <Text style={[s.statusText, { color: '#4CAF7D' }]}>Active Intelligence</Text>
          </View>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "padding"} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={s.scrollContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Dynamic Visual Anchor ───────────────────────── */}
          <View style={s.visualContainer}>
            <AILoader intent={currentIntent} isLoading={isLoading} colors={colors} />
          </View>

          {messages.map((msg) => (
            <Animated.View 
              key={msg.id} 
              entering={msg.isBot ? FadeInDown.duration(400) : FadeInUp.duration(400)}
              layout={Layout.springify()}
              style={[
                s.messageWrapper,
                msg.isBot ? s.botWrapper : s.userWrapper
              ]}
            >
              <View style={[
                s.bubble,
                msg.isBot 
                  ? [s.botBubble, { backgroundColor: colors.surface, borderColor: colors.border }] 
                  : [s.userBubble, { backgroundColor: colors.ink }]
              ]}>
                <Text style={[
                  s.messageText, 
                  { color: msg.isBot ? colors.foreground : colors.primaryForeground }
                ]}>
                  {msg.text}
                </Text>
                
                {msg.source && (
                  <View style={[s.sourceBox, { borderTopColor: colors.border + '40' }]}>
                    <Sparkles size={10} color={colors.clay} />
                    <Text style={[s.sourceText, { color: colors.inkMuted }]}>
                      Source: {msg.source}
                    </Text>
                  </View>
                )}
              </View>

              {msg.suggestedAction && (
                <Animated.View entering={ZoomIn.delay(300)}>
                  <Pressable 
                    onPress={() => router.push(msg.suggestedAction!.route as any)}
                    style={[s.actionBtn, { borderColor: colors.clay }]}
                  >
                    <Text style={[s.actionText, { color: colors.clay }]}>{msg.suggestedAction.label}</Text>
                    <ChevronRight size={14} color={colors.clay} />
                  </Pressable>
                </Animated.View>
              )}
            </Animated.View>
          ))}

          {isLoading && (
            <Animated.View entering={FadeInDown} style={s.botWrapper}>
              <View style={[s.bubble, s.statusBubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator size="small" color={colors.clay} />
                  <Text style={{ fontSize: 12, color: colors.inkMuted, fontFamily: "DMSans_500Medium" }}>
                    {analysisStatus}
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}
      </ScrollView>

      {/* ── Input Bar ──────────────────────────────────────── */}
      <View style={[
        s.inputContainer, 
        { 
          borderTopColor: colors.border, 
          backgroundColor: colors.background,
          paddingBottom: isFocused ? 4 : Math.max(insets.bottom, 12)
        }
      ]}>
        <View style={[s.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable style={s.attachBtn}>
            <Paperclip size={20} color={colors.inkMuted} />
          </Pressable>
          <TextInput
            value={input}
            onChangeText={setInput}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={!isFocused && !input ? "Ask about diet, symptoms, or meds…" : ""}
            placeholderTextColor={colors.inkMuted}
            style={[s.input, { color: colors.foreground }]}
            multiline
          />
          <Pressable style={s.micBtn}>
            <Mic size={20} color={colors.inkMuted} />
          </Pressable>
          <Pressable 
            onPress={handleSend}
            disabled={!input.trim() || isLoading}
            style={[
              s.sendBtn, 
              { backgroundColor: input.trim() ? colors.ink : colors.border }
            ]}
          >
            <Send size={18} color="#FFF" />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleGroup: { alignItems: 'center' },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontFamily: "Fraunces_500Medium",
    letterSpacing: -0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 2,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontFamily: "DMSans_600SemiBold", letterSpacing: 0.2 },
  
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  visualContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  
  messageWrapper: {
    marginBottom: 20,
    maxWidth: '85%',
  },
  botWrapper: { alignSelf: 'flex-start' },
  userWrapper: { alignSelf: 'flex-end' },
  
  bubble: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
  },
  botBubble: {
    borderBottomLeftRadius: 4,
  },
  statusBubble: {
    borderBottomLeftRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    lineHeight: 22,
  },
  sourceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sourceText: {
    fontSize: 10,
    fontFamily: "DMSans_400Regular",
    fontStyle: 'italic',
  },
  
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    backgroundColor: '#FFF',
  },
  actionText: {
    fontSize: 13,
    fontFamily: "DMSans_600SemiBold",
  },

  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  attachBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  micBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    paddingTop: 8,
    paddingBottom: 8,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
});
