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

export const formatPhone = (phone: string) => {
  phone = phone.replace(/\D/g, "");
  if (phone.length > 7) {
    return (
      phone.slice(0, -7) + " " + phone.slice(-7, -4) + "-" + phone.slice(-4)
    );
  } else {
    return phone.slice(0, -4) + "-" + phone.slice(-4);
  }
};
