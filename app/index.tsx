import { Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-2xl font-bold text-blue-500">AsianLeKDS</Text>
      <Text className="mt-2 text-base text-neutral-600">
        NativeWind is set up.
      </Text>
    </View>
  );
}
