import { Text, TouchableOpacity, View } from "react-native";

interface Props {
  title: string;
  onLogout?: () => void;
}

export function KDSHeader({ title, onLogout }: Props) {
  return (
    <View className="bg-[#1a1d27] px-4 py-3 flex-row items-center justify-between border-b border-white/10">
      {/* Left: title */}
      <View className="flex-row items-center gap-2">
        <Text className="text-white font-semibold text-sm">
          Asian Le Kitchen Display System
        </Text>
      </View>

      {/* Center: title */}
      <Text className="text-white font-bold">{title}</Text>

      {/* Right: live clock + sign out */}
      <View className="flex-row items-center gap-3">
        {!!onLogout && (
          <TouchableOpacity
            onPress={onLogout}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2"
          >
            <Text className="text-white/80 text-xs font-semibold">
              Sign out
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
