import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Platform, Alert } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeOutDown, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { X, FileUp, Camera, Image as ImageIcon, FolderArchive, ShieldCheck } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function UploadActionSheet() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const simulateSecureUpload = (fileName: string) => {
    setSelectedFileName(fileName);
    setIsUploading(true);
    
    // Simulate real network/encryption latency
    setTimeout(() => {
      setIsUploading(false);
      Alert.alert("Encryption Complete", `${fileName} has been securely vaulted.`);
      router.back();
    }, 2500);
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Medora needs camera access to scan documents.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      const fileName = result.assets[0].uri.split('/').pop() || 'scanned_document.jpg';
      simulateSecureUpload(fileName);
    }
  };

  const handleGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      const fileName = result.assets[0].uri.split('/').pop() || 'selected_image.jpg';
      simulateSecureUpload(fileName);
    }
  };

  const handleFiles = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*', 'application/zip', 'text/plain'],
      copyToCacheDirectory: true,
    });

    if (!result.canceled) {
      simulateSecureUpload(result.assets[0].name);
    }
  };

  return (
    <View style={s.overlay}>
      {/* Background Dim */}
      <Animated.View 
        entering={FadeInDown.duration(300)} 
        exiting={FadeOutDown.duration(300)}
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]} 
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => router.back()} />
      </Animated.View>

      {/* Action Sheet */}
      <Animated.View 
        entering={SlideInDown.duration(300)}
        exiting={SlideOutDown.duration(250)}
        style={[
          s.sheet, 
          { 
            backgroundColor: colors.background, 
            paddingBottom: Math.max(insets.bottom, 24) 
          }
        ]}
      >
        {/* Drag Handle */}
        <View style={s.handleWrap}>
          <View style={[s.handle, { backgroundColor: colors.border }]} />
        </View>

        {/* HEADER */}
        <View style={s.header}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <ShieldCheck size={14} color={colors.inkMuted} strokeWidth={2} />
              <Text style={[s.encryptionText, { color: colors.inkMuted }]}>SECURE CLINICAL VAULT</Text>
            </View>
            <Text style={[s.title, { color: colors.foreground }]}>Vault Medical Record</Text>
          </View>
          <Pressable 
            style={[s.closeBtn, { backgroundColor: colors.surface }]} 
            onPress={() => router.back()}
          >
            <X size={20} color={colors.foreground} />
          </Pressable>
        </View>

        {/* OPTIONS (APPLE STYLE) */}
        <View style={s.optionsWrapper}>
          <Pressable 
            style={({ pressed }) => [s.actionItem, pressed && { backgroundColor: "rgba(0,0,0,0.02)" }]} 
            onPress={handleFiles}
          >
            <View style={[s.actionIconBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <FolderArchive size={20} color={colors.foreground} strokeWidth={1.5} />
            </View>
            <View style={s.actionTextWrap}>
              <Text style={[s.actionTitle, { color: colors.foreground }]}>Browse Local Files</Text>
              <Text style={[s.actionSub, { color: colors.inkMuted }]}>PDF, DOC, ZIP</Text>
            </View>
          </Pressable>

          <View style={[s.divider, { backgroundColor: colors.border }]} />

          <Pressable 
            style={({ pressed }) => [s.actionItem, pressed && { backgroundColor: "rgba(0,0,0,0.02)" }]} 
            onPress={handleCamera}
          >
            <View style={[s.actionIconBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Camera size={20} color={colors.foreground} strokeWidth={1.5} />
            </View>
            <View style={s.actionTextWrap}>
              <Text style={[s.actionTitle, { color: colors.foreground }]}>Scan Paper Document</Text>
              <Text style={[s.actionSub, { color: colors.inkMuted }]}>Uses high-res camera</Text>
            </View>
          </Pressable>

          <View style={[s.divider, { backgroundColor: colors.border }]} />

          <Pressable 
            style={({ pressed }) => [s.actionItem, pressed && { backgroundColor: "rgba(0,0,0,0.02)" }]} 
            onPress={handleGallery}
          >
            <View style={[s.actionIconBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ImageIcon size={20} color={colors.foreground} strokeWidth={1.5} />
            </View>
            <View style={s.actionTextWrap}>
              <Text style={[s.actionTitle, { color: colors.foreground }]}>Choose from Gallery</Text>
              <Text style={[s.actionSub, { color: colors.inkMuted }]}>Photos and screenshots</Text>
            </View>
          </Pressable>
        </View>
      </Animated.View>

      {/* FULL SCREEN ENCRYPTION LOAD */}
      {isUploading && (
        <Animated.View 
          entering={FadeInDown.duration(300)} 
          exiting={FadeOutDown.duration(300)} 
          style={[StyleSheet.absoluteFill, s.loadingOverlay, { backgroundColor: 'rgba(255,255,255,0.96)' }]}
        >
          <View style={[s.loadingBox, { backgroundColor: '#FFF', borderColor: '#E5E5E5' }]}>
            <Animated.View entering={FadeInDown.duration(400)}>
              <ShieldCheck size={36} color={colors.foreground} strokeWidth={1.5} style={{ marginBottom: 20 }} />
            </Animated.View>
            <Text style={[s.loadingTitle, { color: '#1A1A1A' }]}>Securing Payload</Text>
            <Text style={[s.loadingSub, { color: '#666', textAlign: 'center', paddingHorizontal: 20 }]} numberOfLines={2}>
              Encrypting <Text style={{ fontFamily: "DMSans_600SemiBold", color: '#1A1A1A'}}>{selectedFileName}</Text>...
            </Text>
          </View>
        </Animated.View>
      )}

    </View>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    width: '100%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -5 },
    elevation: 20,
  },
  handleWrap: {
    alignItems: "center",
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  encryptionText: {
    fontSize: 11,
    fontFamily: "DMSans_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontFamily: "Fraunces_500Medium",
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  optionsWrapper: {
    width: '100%',
    alignItems: 'stretch',
    paddingBottom: 8,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    width: '100%',
    alignSelf: 'stretch',
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTextWrap: {
    marginLeft: 16,
    flexShrink: 1,
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
    marginBottom: 2,
  },
  actionSub: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 68, 
    marginRight: 8,
    marginVertical: 4,
  },
  loadingOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  loadingBox: {
    padding: 32,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    width: '85%',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
  },
  loadingTitle: {
    fontSize: 20,
    fontFamily: "Fraunces_600SemiBold",
    marginBottom: 8,
  },
  loadingSub: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
  }
});
