import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#1a1d27",
          borderTopColor: "rgba(255,255,255,0.1)",
        },
        tabBarActiveTintColor: "#22c87a",
        tabBarInactiveTintColor: "rgba(255,255,255,0.4)",
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Dine In" }} />
      <Tabs.Screen name="orders" options={{ title: "Orders" }} />
    </Tabs>
  );
}
