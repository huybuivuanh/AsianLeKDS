import {
  subscribeToActiveDineInOrders,
  updateOrderItems,
} from "@/services/firebase/orders";
import { DineInOrder, KitchenType, OrderItem, OrderStatus } from "@/types/types";
import { useEffect, useState } from "react";

export interface KDSOrder {
  order: DineInOrder;
  items: OrderItem[];
}

const MAX_COMPLETED = 3;

const isOrderCompleted = (o: KDSOrder): boolean =>
  o.items.length > 0 && o.items.every((i) => i.completed);

function buildDisplayItems(order: DineInOrder): OrderItem[] {
  return order.orderItems.filter((i) => i.kitchenType !== KitchenType.Drink);
}

function withDrinksCompleted(orderItems: OrderItem[]): OrderItem[] | null {
  const needsUpdate = orderItems.some(
    (i) => i.kitchenType === KitchenType.Drink && !i.completed,
  );
  if (!needsUpdate) return null;
  return orderItems.map((i) =>
    i.kitchenType === KitchenType.Drink ? { ...i, completed: true } : i,
  );
}

export function useKDSOrders() {
  const [kdsOrders, setKdsOrders] = useState<KDSOrder[]>([]);

  useEffect(() => {
    return subscribeToActiveDineInOrders((order, type) => {
      if (type === "added") {
        const drinkUpdated = withDrinksCompleted(order.orderItems);
        if (drinkUpdated) {
          void updateOrderItems(order.id!, drinkUpdated);
        }
        const effectiveOrder = drinkUpdated
          ? { ...order, orderItems: drinkUpdated }
          : order;

        setKdsOrders((prev) => {
          if (prev.find((o) => o.order.id === order.id)) return prev;
          return [
            ...prev,
            { order: effectiveOrder, items: buildDisplayItems(effectiveOrder) },
          ];
        });
      }

      if (type === "modified") {
        setKdsOrders((prev) =>
          prev.map((o) =>
            o.order.id !== order.id
              ? o
              : { ...o, order, items: buildDisplayItems(order) },
          ),
        );
      }

      if (type === "removed") {
        if (order.status === OrderStatus.Completed) {
          setKdsOrders((prev) =>
            prev.map((o) =>
              o.order.id === order.id && !isOrderCompleted(o)
                ? { ...o, items: o.items.map((i) => ({ ...i, completed: true })) }
                : o,
            ),
          );
        } else {
          setKdsOrders((prev) => prev.filter((o) => o.order.id !== order.id));
        }
      }
    });
  }, []);

  const toggleItem = (orderId: string, itemIndex: number) => {
    const orderEntry = kdsOrders.find((o) => o.order.id === orderId);
    if (!orderEntry) return;

    const newCompleted = !orderEntry.items[itemIndex].completed;
    const targetId = orderEntry.items[itemIndex].id;

    const newRawItems = orderEntry.order.orderItems.map((raw) =>
      raw.id === targetId ? { ...raw, completed: newCompleted } : raw,
    );

    setKdsOrders((prev) =>
      prev.map((o) => {
        if (o.order.id !== orderId) return o;
        const items = o.items.map((item, i) =>
          i === itemIndex ? { ...item, completed: newCompleted } : item,
        );
        return { ...o, order: { ...o.order, orderItems: newRawItems }, items };
      }),
    );

    void updateOrderItems(orderId, newRawItems);
  };

  const completeOrder = (orderId: string) => {
    const orderEntry = kdsOrders.find((o) => o.order.id === orderId);
    if (!orderEntry) return;

    const newRawItems = orderEntry.order.orderItems.map((raw) => ({
      ...raw,
      completed: true,
    }));

    setKdsOrders((prev) => {
      const updated = prev.map((o) =>
        o.order.id === orderId
          ? {
              ...o,
              order: { ...o.order, orderItems: newRawItems },
              items: o.items.map((i) => ({ ...i, completed: true })),
            }
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

    void updateOrderItems(orderId, newRawItems);
  };

  const activeOrders = kdsOrders.filter((o) => !isOrderCompleted(o));
  const completedOrders = kdsOrders.filter(isOrderCompleted);

  return { activeOrders, completedOrders, toggleItem, completeOrder };
}
