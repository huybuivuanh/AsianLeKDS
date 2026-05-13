import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useKDSOrders } from "@/hooks/useKDSOrders";
import { KDSHeader, OrderCard, QueueDivider } from "@/components/kds";
import { subscribeToActiveAllOrders } from "@/services/firebase/orders";

export default function OrdersScreen() {
  const { activeOrders, completedOrders, toggleItem, completeOrder } =
    useKDSOrders(subscribeToActiveAllOrders, "kds_completed_orders");

  return (
    <SafeAreaView className="flex-1 bg-[#0f1117]" edges={["top", "left", "right"]}>
      <KDSHeader
        title="Kitchen Display — Orders"
        activeCount={activeOrders.length}
        completedCount={completedOrders.length}
      />
      <ScrollView
        horizontal
        className="flex-1"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ alignItems: "stretch", paddingHorizontal: 4 }}
      >
        {activeOrders.map((o) => (
          <OrderCard
            key={o.order.id}
            kdsOrder={o}
            onToggleItem={(index) => toggleItem(o.order.id!, index)}
            onComplete={() => completeOrder(o.order.id!)}
          />
        ))}
        {completedOrders.length > 0 && <QueueDivider />}
        {completedOrders.map((o) => (
          <OrderCard
            key={o.order.id}
            kdsOrder={o}
            onToggleItem={(index) => toggleItem(o.order.id!, index)}
            onComplete={() => completeOrder(o.order.id!)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
