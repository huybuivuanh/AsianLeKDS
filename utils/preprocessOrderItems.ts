import { OrderItem } from "@/types/types";

const OPTION_NAMES = {
  EGG_ROLL: "Egg Roll",
  SPRING_ROLL: "Spring Roll",
  RICE: "Rice",
  NOODLES: "Noodles",
};

function preprocessOrderItem(item: OrderItem) {
  const processed = { ...item };
  const qty = processed.quantity;
  processed.quantity = qty;

  if (!Array.isArray(processed.options) || processed.options.length === 0) {
    processed.name = qty > 1 ? `${qty}x ${processed.name}` : processed.name;
    return processed;
  }

  if (processed.name === "#3") {
    const mainOption = processed.options.find(
      (opt) =>
        opt.name !== OPTION_NAMES.EGG_ROLL &&
        opt.name !== OPTION_NAMES.SPRING_ROLL,
    );

    if (mainOption) {
      processed.name = `${processed.name}/${mainOption.name}`;
      processed.options = processed.options.filter((opt) => opt !== mainOption);
    }
  }

  const eggOption = processed.options.find(
    (opt) => opt.name === OPTION_NAMES.EGG_ROLL,
  );

  const springOption = processed.options.find(
    (opt) => opt.name === OPTION_NAMES.SPRING_ROLL,
  );

  if ((eggOption || springOption) && !(eggOption && springOption)) {
    processed.name = `${processed.name}/${eggOption ? "ER" : "SP"}`;
    processed.options = processed.options.filter(
      (opt) => opt !== eggOption && opt !== springOption,
    );
  }

  const riceNoodleOption = processed.options.find(
    (opt) =>
      opt.name === OPTION_NAMES.RICE || opt.name === OPTION_NAMES.NOODLES,
  );

  if (riceNoodleOption) {
    const abbreviation =
      riceNoodleOption.name === OPTION_NAMES.RICE ? "Rice" : "ND";
    processed.name = `${processed.name}/${abbreviation}`;
    processed.options = processed.options.filter(
      (opt) => opt !== riceNoodleOption,
    );
  }

  processed.name = qty > 1 ? `${qty}x ${processed.name}` : processed.name;

  return processed;
}

export function preprocessOrderItems(orderItems: OrderItem[]) {
  if (!Array.isArray(orderItems)) return [];
  return orderItems.map(preprocessOrderItem);
}
