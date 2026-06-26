import React, { useMemo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import type { QueueNodeKind, QueuePersona } from "@/lib/patient-queue";
import { buildQueueTimeline } from "@/lib/patient-queue";
import { QUEUE_PERSONA_IMAGES } from "@/lib/queue-persona-assets";

const KIND_RING: Record<QueueNodeKind, { border: string; opacity: number; size: number }> = {
  completed: { border: "rgba(255,255,255,0.15)", opacity: 0.4, size: 26 },
  "in-room": { border: "#7A9B7E", opacity: 1, size: 28 },
  you: { border: "#B8735D", opacity: 1, size: 30 },
  waiting: { border: "rgba(255,255,255,0.2)", opacity: 0.7, size: 26 },
};

function PersonaBubble({ persona, kind }: { persona: QueuePersona; kind: QueueNodeKind }) {
  const ring = KIND_RING[kind];
  return (
    <View
      style={[
        s.bubble,
        {
          width: ring.size,
          height: ring.size,
          borderRadius: ring.size / 2,
          borderColor: ring.border,
          opacity: ring.opacity,
        },
        kind === "you" && s.bubbleYou,
      ]}
    >
      {kind === "in-room" ? <View style={s.liveDot} /> : null}
      <Image
        source={QUEUE_PERSONA_IMAGES[persona]}
        style={s.bubbleImg}
        resizeMode="contain"
      />
    </View>
  );
}

type Props = {
  position: number;
  total: number;
};

export function QueuePersonaStrip({ position, total }: Props) {
  const nodes = useMemo(() => buildQueueTimeline(position, total), [position, total]);

  return (
    <View style={s.wrap}>
      <View style={s.iconRow}>
        {nodes.map((node) => (
          <View key={node.position} style={s.slot}>
            <PersonaBubble persona={node.persona} kind={node.kind} />
            {node.kind === "you" ? (
              <Text style={s.youLabel}>YOU</Text>
            ) : (
              <View style={s.labelSpacer} />
            )}
          </View>
        ))}
      </View>
      <View style={s.segments}>
        {nodes.map((node) => (
          <View
            key={node.position}
            style={[
              s.segment,
              node.kind === "completed" && s.segmentDone,
              node.kind === "in-room" && s.segmentRoom,
              node.kind === "you" && s.segmentYou,
              node.kind === "waiting" && s.segmentWait,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 6 },
  iconRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  slot: { flex: 1, alignItems: "center", gap: 2 },
  bubble: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "flex-end",
    overflow: "hidden",
    paddingBottom: 2,
  },
  bubbleYou: {
    shadowColor: "#B8735D",
    shadowOpacity: 0.45,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  bubbleImg: { width: 18, height: 20, tintColor: "#1B3B2E" },
  liveDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#7A9B7E",
    borderWidth: 1.5,
    borderColor: "#fff",
    zIndex: 2,
  },
  youLabel: {
    fontSize: 8,
    fontFamily: "DMSans_700Bold",
    letterSpacing: 0.8,
    color: "#D4957E",
  },
  labelSpacer: { height: 10 },
  segments: { flexDirection: "row", gap: 3 },
  segment: { flex: 1, height: 4, borderRadius: 2 },
  segmentDone: { backgroundColor: "rgba(122,155,126,0.45)" },
  segmentRoom: { backgroundColor: "#7A9B7E" },
  segmentYou: { height: 5, backgroundColor: "#B8735D" },
  segmentWait: { backgroundColor: "rgba(255,255,255,0.12)" },
});
