import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useKDSOrders } from "@/hooks/useKDSOrders";
import { KDSHeader, OrderCard, QueueDivider } from "@/components/kds";
import { logout } from "@/services/firebase/auth";

export default function KDSScreen() {
  const { activeOrders, completedOrders, startTimes, toggleItem, completeOrder } =
    useKDSOrders();

  return (
    <SafeAreaView className="flex-1 bg-[#0f1117]" edges={["top", "left", "right"]}>
      <KDSHeader
        activeCount={activeOrders.length}
        completedCount={completedOrders.length}
        onLogout={() => {
          void logout();
        }}
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
            startTime={startTimes[o.order.id!] ?? Date.now()}
          />
        ))}
        {completedOrders.length > 0 && <QueueDivider />}
        {completedOrders.map((o) => (
          <OrderCard
            key={o.order.id}
            kdsOrder={o}
            onToggleItem={(index) => toggleItem(o.order.id!, index)}
            onComplete={() => completeOrder(o.order.id!)}
            startTime={startTimes[o.order.id!] ?? Date.now()}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
