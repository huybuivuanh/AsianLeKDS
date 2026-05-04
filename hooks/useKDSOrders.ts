import { subscribeToActiveDineInOrders } from "@/services/firebase/orders";
import { KDSOrder } from "@/types/kds";
import { groupOrderItemsBySignature } from "@/utils/groupOrderItems";
import { preprocessOrderItems } from "@/utils/preprocessOrderItems";
import { useEffect, useState } from "react";

const MAX_COMPLETED = 3;

const isOrderCompleted = (o: KDSOrder): boolean =>
  o.items.length > 0 && o.items.every((i) => i.completed);

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
                completed: item.kitchenType === "Drink",
              })),
            },
          ];
        });
        setStartTimes((prev) => ({ ...prev, [order.id!]: Date.now() }));
      }

      if (type === "modified") {
        setKdsOrders((prev) =>
          prev.map((o) => {
            if (o.order.id !== order.id) return o;
            const existingById = new Map(
              o.items.filter((i) => i.id).map((i) => [i.id, i]),
            );
            const items = preprocessOrderItems(
              groupOrderItemsBySignature(order.orderItems),
            ).map((item) => ({
              ...item,
              completed:
                existingById.get(item.id)?.completed ??
                item.kitchenType === "Drink",
            }));
            return { ...o, order, items };
          }),
        );
      }

      if (type === "removed") {
        setKdsOrders((prev) =>
          prev.map((o) =>
            o.order.id === order.id && !isOrderCompleted(o)
              ? { ...o, items: o.items.map((i) => ({ ...i, completed: true })) }
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
        return { ...o, items };
      }),
    );
  };

  const completeOrder = (orderId: string) => {
    setKdsOrders((prev) => {
      const updated = prev.map((o) =>
        o.order.id === orderId
          ? { ...o, items: o.items.map((i) => ({ ...i, completed: true })) }
          : o,
      );

      const completed = updated.filter(isOrderCompleted);

      const overflow = completed.slice(
        0,
        Math.max(0, completed.length - MAX_COMPLETED),
      );
      const removeIds = new Set(overflow.map((o) => o.order.id));

      return updated.filter((o) => !removeIds.has(o.order.id ?? ""));
    });
  };

  const activeOrders = kdsOrders.filter((o) => !isOrderCompleted(o));
  const completedOrders = kdsOrders.filter(isOrderCompleted);

  return {
    activeOrders,
    completedOrders,
    startTimes,
    toggleItem,
    completeOrder,
  };
}
