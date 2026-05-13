import {
  OrderType,
  TakeOutFulfillment,
  TakeOutFulfillmentKind,
} from "@/types/types";

export const takeoutFulfillmentIsScheduled = (order: {
  orderType?: OrderType;
  fulfillment?: TakeOutFulfillment;
}): boolean => {
  if (order.orderType !== OrderType.TakeOut) return false;
  return order.fulfillment?.kind === TakeOutFulfillmentKind.Scheduled;
};
