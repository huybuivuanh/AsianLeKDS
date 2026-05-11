import { Text, TouchableOpacity, View } from "react-native";

interface Props {
  activeCount: number;
  completedCount: number;
  onLogout?: () => void;
}

export function KDSHeader({ activeCount, completedCount, onLogout }: Props) {
  return (
    <View className="bg-[#1a1d27] px-4 py-3 flex-row items-center justify-between border-b border-white/10">
      {/* Left: status indicator + title */}
      <View className="flex-row items-center gap-2">
        <Text className="text-white font-semibold text-sm">
          Kitchen Display — Dine In
        </Text>
      </View>

      {/* Center: counters */}
      <View className="flex-row gap-4">
        <Text className="text-white/60 text-sm">
          Active <Text className="text-white font-bold">{activeCount}</Text>
        </Text>
        <Text className="text-white/60 text-sm">
          Done <Text className="text-white font-bold">{completedCount}</Text>
        </Text>
      </View>

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
