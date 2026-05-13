import { KDSOrder } from "@/hooks/useKDSOrders";
import { DineInOrder, OrderType, TakeOutOrder } from "@/types/types";
import {
  dineInItemSortTier,
  kitchenTypeSortRank,
} from "@/utils/orderItemSections";
import { useEffect } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { OrderItemRow } from "./OrderItemRow";

interface Props {
  kdsOrder: KDSOrder;
  onToggleItem: (index: number) => void;
  onComplete: () => void;
}

export function OrderCard({ kdsOrder, onToggleItem, onComplete }: Props) {
  const { order, items } = kdsOrder;
  const isCompleted = items.length > 0 && items.every((i) => i.completed);

  const doneCount = items.filter((i) => i.completed).length;
  const total = items.length;
  const pct = total > 0 ? (doneCount / total) * 100 : 0;
  const allDone = doneCount === total && total > 0;

  useEffect(() => {
    if (allDone) onComplete();
  }, [allDone]);

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
          <Text className="text-slate-900 font-bold text-xl" numberOfLines={1}>
            {order.orderType === OrderType.DineIn
              ? `Table: ${(order as DineInOrder).tableNumber}`
              : ((order as TakeOutOrder).customerName ?? "Take Out")}
          </Text>
          <Text className="text-slate-500 text-medium tabular-nums">
            {order.createdAt.toDate().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
          <View className="bg-slate-100 rounded px-2 py-0.5">
            <Text className="text-slate-600 text-medium" numberOfLines={1}>
              {order.staff}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center justify-between mt-1">
          {order.orderType === OrderType.DineIn ? (
            <Text className="text-slate-500 text-medium">
              Guests: {(order as DineInOrder).guests}
            </Text>
          ) : (order as TakeOutOrder).phoneNumber ? (
            <Text className="text-slate-500 text-medium">
              {(order as TakeOutOrder).phoneNumber}
            </Text>
          ) : (
            <View />
          )}
          {isCompleted && (
            <Text className="text-slate-400 text-medium">Done</Text>
          )}
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
          const SECTION_TITLES: Record<number, string> = {
            0: "Appetizers",
            1: "For Table",
            2: "To Go",
          };

          const sorted = items
            .map((item, index) => ({ item, index }))
            .sort((a, b) => {
              const ta = dineInItemSortTier(a.item);
              const tb = dineInItemSortTier(b.item);
              if (ta !== tb) return ta - tb;
              const ra = kitchenTypeSortRank(a.item.kitchenType);
              const rb = kitchenTypeSortRank(b.item.kitchenType);
              if (ra !== rb) return ra - rb;
              return a.index - b.index;
            });

          const byTier = new Map<
            number,
            Array<{ item: (typeof items)[number]; index: number }>
          >([
            [0, []],
            [1, []],
            [2, []],
          ]);

          for (const entry of sorted) {
            const tier = dineInItemSortTier(entry.item);
            byTier.get(tier)?.push(entry);
          }

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

          return ([0, 1, 2] as const)
            .filter((tier) => (byTier.get(tier)?.length ?? 0) > 0)
            .map((tier) => (
              <View key={tier} className="pt-2">
                <View className="px-2 pb-1">
                  <View
                    className={`self-start rounded-full px-3 py-1 ${tierBadgeClass(tier)}`}
                  >
                    <Text className="text-xs font-semibold text-slate-900">
                      {SECTION_TITLES[tier]}
                    </Text>
                  </View>
                </View>

                {byTier.get(tier)!.map(({ item, index }) => (
                  <OrderItemRow
                    key={item.id ?? `${tier}-${index}-${item.name}`}
                    item={item}
                    onToggle={() => onToggleItem(index)}
                    disabled={false}
                  />
                ))}
              </View>
            ));
        })()}
      </ScrollView>

      <View className="h-px bg-slate-200 mx-3" />

      {/* Footer */}
      <View className="px-3 py-2">
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
            className="rounded-lg py-2 items-center bg-[#22c87a]"
            activeOpacity={0.8}
          >
            <Text className="text-xs font-semibold text-white">
              Complete order
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
