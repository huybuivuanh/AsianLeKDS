import { TouchableOpacity, View, Text } from "react-native";
import { KDSOrderItem } from "@/types/kds";

interface Props {
  item: KDSOrderItem;
  onToggle: () => void;
  disabled: boolean;
}

export function OrderItemRow({ item, onToggle, disabled }: Props) {
  const optionText = item.options?.map((o) => o.name).join(", ");
  const changeTexts = item.changes?.map((c) =>
    c.to ? `${c.from} → ${c.to}` : `no ${c.from}`,
  );
  const extraTexts = item.extras?.map((e) => `+ ${e.description}`);

  return (
    <TouchableOpacity
      onPress={onToggle}
      disabled={disabled}
      className={`py-2 px-2 ${item.completed ? "opacity-40" : ""}`}
      activeOpacity={0.7}
    >
      <View className="flex-row items-start gap-2">
        {/* Circular checkbox */}
        <View
          className={`w-5 h-5 rounded-full border mt-0.5 shrink-0 items-center justify-center ${
            item.completed
              ? "bg-[#22c87a] border-[#22c87a]"
              : "border-white/40 bg-transparent"
          }`}
        >
          {item.completed && (
            <Text className="text-white text-[10px] font-bold">✓</Text>
          )}
        </View>

        {/* Item content */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text
              className={`text-white text-sm font-medium flex-1 ${
                item.completed ? "line-through" : ""
              }`}
            >
              {item.quantity > 1 ? `[${item.quantity}] ` : ""}
              {item.name}
            </Text>
            {item.appetizer && (
              <View className="bg-red-600 rounded-full px-1.5 py-0.5 ml-1">
                <Text className="text-white text-[9px] font-bold">APP</Text>
              </View>
            )}
          </View>

          {optionText ? (
            <Text className="text-white/40 text-xs mt-0.5">{optionText}</Text>
          ) : null}
          {changeTexts?.map((t, i) => (
            <Text key={i} className="text-white/40 text-xs">
              {t}
            </Text>
          ))}
          {extraTexts?.map((t, i) => (
            <Text key={i} className="text-white/40 text-xs">
              {t}
            </Text>
          ))}
          {item.instructions ? (
            <Text className="text-[#f0a020] text-xs italic mt-0.5">
              {item.instructions}
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}
