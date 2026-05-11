import { DineInOrder, OrderItem, OrderStatus } from "@/types/types";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  type DocumentChangeType,
} from "firebase/firestore";
import { db } from "./config";

export type OrderChangeHandler = (
  order: DineInOrder,
  type: DocumentChangeType,
) => void;

/**
 * Subscribes to active DineIn orders sorted oldest-first.
 * Returns an unsubscribe function — call it on cleanup.
 */
export function subscribeToActiveDineInOrders(
  onChange: OrderChangeHandler,
): () => void {
  const q = query(
    collection(db, "dineInOrders"),
    where("status", "==", OrderStatus.InProgress),
    orderBy("createdAt", "asc"),
  );

  return onSnapshot(q, (snap) => {
    for (const change of snap.docChanges()) {
      const order = { id: change.doc.id, ...change.doc.data() } as DineInOrder;
      onChange(order, change.type);
    }
  });
}

export async function updateOrderItems(
  orderId: string,
  orderItems: OrderItem[],
): Promise<void> {
  await updateDoc(doc(db, "dineInOrders", orderId), { orderItems });
}
