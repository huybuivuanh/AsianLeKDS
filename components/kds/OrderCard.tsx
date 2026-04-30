import { KDSOrder } from "@/types/kds";
import { groupOrderItemsByDisplaySection } from "@/utils/orderItemSections";
import { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { OrderItemRow } from "./OrderItemRow";

interface Props {
  kdsOrder: KDSOrder;
  onToggleItem: (index: number) => void;
  onComplete: () => void;
  startTime: number;
}

export function OrderCard({
  kdsOrder,
  onToggleItem,
  onComplete,
  startTime,
}: Props) {
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
      className={`w-[300px] mx-1.5 my-2 rounded-xl border overflow-hidden flex-col ${
        isCompleted
          ? "opacity-60 bg-white border-white/10"
          : "bg-white border-white/10"
      }`}
      style={{ flexShrink: 0, alignSelf: "stretch" }}
    >
      {/* Card header */}
      <View className="px-3 pt-3 pb-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-slate-900 font-bold text-base">
            Table: {order.tableNumber}
          </Text>
          <View className="bg-slate-100 rounded px-2 py-0.5">
            <Text className="text-slate-600 text-xs" numberOfLines={1}>
              {order.staff}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center justify-between mt-1">
          <Text className="text-slate-500 text-xs">Guests: {order.guests}</Text>
          {isCompleted && <Text className="text-slate-400 text-xs">Done</Text>}
        </View>
      </View>

      <View className="h-px bg-slate-200 mx-3" />

      {/* Items list */}
      <ScrollView
        className="flex-1"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        {(() => {
          const indexByRef = new Map(
            items.map((it, idx) => [it, idx] as const),
          );
          const sections = groupOrderItemsByDisplaySection(
            items as any,
          ) as Array<{
            tier: number;
            title: string;
            items: typeof items;
          }>;

          const tierBadgeClass = (tier: number) => {
            switch (tier) {
              case 0:
                return "bg-amber-200";
              case 2:
                return "bg-teal-200";
              default:
                return "bg-slate-200";
            }
          };

          return sections.map((section) => (
            <View key={section.tier} className="pt-2">
              <View className="px-2 pb-1">
                <View
                  className={`self-start rounded-full px-3 py-1 ${tierBadgeClass(section.tier)}`}
                >
                  <Text className="text-xs font-semibold text-slate-900">
                    {section.title}
                  </Text>
                </View>
              </View>

              {section.items.map((item) => {
                const idx = indexByRef.get(item) ?? -1;
                return (
                  <OrderItemRow
                    key={item.id ?? `${section.tier}-${idx}-${item.name}`}
                    item={item}
                    onToggle={() => idx >= 0 && onToggleItem(idx)}
                    disabled={isCompleted || idx < 0}
                  />
                );
              })}
            </View>
          ));
        })()}
      </ScrollView>

      <View className="h-px bg-slate-200 mx-3" />

      {/* Footer */}
      <View className="px-3 py-2">
        {/* Progress bar */}
        <View className="flex-row items-center gap-2 mb-2">
          <View className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <View
              className="h-full bg-[#22c87a] rounded-full"
              style={{ width: `${pct}%` }}
            />
          </View>
          <Text className="text-slate-500 text-xs">
            {doneCount}/{total}
          </Text>
        </View>

        {!isCompleted && (
          <TouchableOpacity
            onPress={onComplete}
            disabled={!allDone}
            className={`rounded-lg py-2 items-center ${
              allDone ? "bg-[#22c87a]" : "bg-slate-100"
            }`}
            activeOpacity={0.8}
          >
            <Text
              className={`text-xs font-semibold ${
                allDone ? "text-white" : "text-slate-400"
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
