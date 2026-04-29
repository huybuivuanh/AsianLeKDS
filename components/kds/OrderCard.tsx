import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { KDSOrder } from "@/types/kds";
import { OrderItemRow } from "./OrderItemRow";

interface Props {
  kdsOrder: KDSOrder;
  onToggleItem: (index: number) => void;
  onComplete: () => void;
  startTime: number;
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

function timerColor(seconds: number): string {
  if (seconds < 300) return "text-[#22c87a]";
  if (seconds < 600) return "text-[#f0a020]";
  return "text-[#e84545]";
}

export function OrderCard({ kdsOrder, onToggleItem, onComplete, startTime }: Props) {
  const [elapsed, setElapsed] = useState(
    Math.floor((Date.now() - startTime) / 1000),
  );

  const { order, items, status } = kdsOrder;
  const isCompleted = status === "completed";

  useEffect(() => {
    if (isCompleted) return;
    const id = setInterval(
      () => setElapsed(Math.floor((Date.now() - startTime) / 1000)),
      1000,
    );
    return () => clearInterval(id);
  }, [isCompleted, startTime]);

  const doneCount = items.filter((i) => i.completed).length;
  const total = items.length;
  const pct = total > 0 ? (doneCount / total) * 100 : 0;
  const allDone = doneCount === total && total > 0;

  return (
    <View
      className={`w-[190px] mx-1.5 my-2 rounded-xl border overflow-hidden flex-col ${
        isCompleted
          ? "opacity-40 bg-[#141720] border-white/[0.04]"
          : "bg-[#1e2235] border-white/10"
      }`}
      style={{ flexShrink: 0, alignSelf: "stretch" }}
    >
      {/* Card header */}
      <View className="px-3 pt-3 pb-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-white font-bold text-base">
            T{order.tableNumber}
          </Text>
          <View className="bg-[#2a2f45] rounded px-2 py-0.5">
            <Text className="text-white/60 text-xs" numberOfLines={1}>
              {order.staff}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center justify-between mt-1">
          <Text className="text-white/50 text-xs">
            {order.guests} guest{order.guests !== 1 ? "s" : ""}
          </Text>
          {isCompleted ? (
            <Text className="text-white/40 text-xs">Done</Text>
          ) : (
            <Text className={`text-xs ${timerColor(elapsed)}`}>
              {formatElapsed(elapsed)}
            </Text>
          )}
        </View>
      </View>

      <View className="h-px bg-white/10 mx-3" />

      {/* Items list */}
      <ScrollView
        className="flex-1"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        {items.map((item, i) => (
          <OrderItemRow
            key={i}
            item={item}
            onToggle={() => onToggleItem(i)}
            disabled={isCompleted}
          />
        ))}
      </ScrollView>

      <View className="h-px bg-white/10 mx-3" />

      {/* Footer */}
      <View className="px-3 py-2">
        {/* Progress bar */}
        <View className="flex-row items-center gap-2 mb-2">
          <View className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <View
              className="h-full bg-[#22c87a] rounded-full"
              style={{ width: `${pct}%` }}
            />
          </View>
          <Text className="text-white/40 text-xs">
            {doneCount}/{total}
          </Text>
        </View>

        {!isCompleted && (
          <TouchableOpacity
            onPress={onComplete}
            disabled={!allDone}
            className={`rounded-lg py-2 items-center ${
              allDone ? "bg-[#22c87a]" : "bg-white/10"
            }`}
            activeOpacity={0.8}
          >
            <Text
              className={`text-xs font-semibold ${
                allDone ? "text-white" : "text-white/30"
              }`}
            >
              Complete order
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
