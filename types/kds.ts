import { DineInOrder, OrderItem } from "./types";

export interface KDSOrderItem extends OrderItem {
  completed: boolean;
}

export interface KDSOrder {
  order: DineInOrder;
  items: KDSOrderItem[];
  status: "active" | "completed";
  completedAt?: number;
}
