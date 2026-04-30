import { subscribeToActiveDineInOrders } from "@/services/firebase/orders";
import { KDSOrder } from "@/types/kds";
import { groupOrderItemsBySignature } from "@/utils/groupOrderItems";
import { preprocessOrderItems } from "@/utils/preprocessOrderItems";
import { useEffect, useState } from "react";

const MAX_COMPLETED = 3;

export function useKDSOrders() {
  const [kdsOrders, setKdsOrders] = useState<KDSOrder[]>([]);
  const [startTimes, setStartTimes] = useState<Record<string, number>>({});

  useEffect(() => {
    return subscribeToActiveDineInOrders((order, type) => {
      if (type === "added") {
        setKdsOrders((prev) => {
          if (prev.find((o) => o.order.id === order.id)) return prev;
          return [
            ...prev,
            {
              order,
              items: preprocessOrderItems(
                groupOrderItemsBySignature(order.orderItems),
              ).map((item) => ({
                ...item,
                completed: false,
              })),
              status: "active",
            },
          ];
        });
        setStartTimes((prev) => ({ ...prev, [order.id!]: Date.now() }));
      }

      if (type === "modified") {
        setKdsOrders((prev) =>
          prev.map((o) => {
            if (o.order.id !== order.id || o.status === "completed") return o;
            const existingById = new Map(
              o.items.filter((i) => i.id).map((i) => [i.id, i]),
            );
            const items = preprocessOrderItems(
              groupOrderItemsBySignature(order.orderItems),
            ).map((item) => ({
              ...item,
              completed: existingById.get(item.id)?.completed ?? false,
            }));
            return { ...o, order, items };
          }),
        );
      }

      if (type === "removed") {
        setKdsOrders((prev) =>
          prev.map((o) =>
            o.order.id === order.id && o.status === "active"
              ? { ...o, status: "completed", completedAt: Date.now() }
              : o,
          ),
        );
      }
    });
  }, []);

  const toggleItem = (orderId: string, itemIndex: number) => {
    setKdsOrders((prev) =>
      prev.map((o) => {
        if (o.order.id !== orderId) return o;
        const items = o.items.map((item, i) =>
          i === itemIndex ? { ...item, completed: !item.completed } : item,
        );
        const allDone = items.every((item) => item.completed);
        if (o.status === "completed" && !allDone) {
          const { completedAt: _, ...rest } = o;
          return { ...rest, items, status: "active" as const };
        }
        return { ...o, items };
      }),
    );
  };

  const completeOrder = (orderId: string) => {
    setKdsOrders((prev) => {
      const updated = prev.map((o) =>
        o.order.id === orderId
          ? { ...o, status: "completed" as const, completedAt: Date.now() }
          : o,
      );

      // Drop oldest completed orders beyond the cap
      const completed = updated
        .filter((o) => o.status === "completed")
        .sort((a, b) => (a.completedAt ?? 0) - (b.completedAt ?? 0));

      const overflow = completed.slice(
        0,
        Math.max(0, completed.length - MAX_COMPLETED),
      );
      const removeIds = new Set(overflow.map((o) => o.order.id));

      return updated.filter((o) => !removeIds.has(o.order.id ?? ""));
    });
  };

  const activeOrders = kdsOrders.filter((o) => o.status === "active");
  const completedOrders = kdsOrders.filter((o) => o.status === "completed");

  return {
    activeOrders,
    completedOrders,
    startTimes,
    toggleItem,
    completeOrder,
  };
}
