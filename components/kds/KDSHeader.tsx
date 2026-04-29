import { useState, useEffect, useRef } from "react";
import { View, Text, Animated, TouchableOpacity } from "react-native";

interface Props {
  activeCount: number;
  completedCount: number;
  onLogout?: () => void;
}

export function KDSHeader({ activeCount, completedCount, onLogout }: Props) {
  const [time, setTime] = useState(new Date());
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.2,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse]);

  const formatted = time.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <View className="bg-[#1a1d27] px-4 py-3 flex-row items-center justify-between">
      {/* Left: status indicator + title */}
      <View className="flex-row items-center gap-2">
        <Animated.View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: "#22c87a",
            opacity: pulse,
          }}
        />
        <Text className="text-white font-semibold text-sm">
          Kitchen Display — Dine In
        </Text>
      </View>

      {/* Center: counters */}
      <View className="flex-row gap-4">
        <Text className="text-white/60 text-sm">
          Active{" "}
          <Text className="text-white font-bold">{activeCount}</Text>
        </Text>
        <Text className="text-white/60 text-sm">
          Done{" "}
          <Text className="text-white font-bold">{completedCount}</Text>
        </Text>
      </View>

      {/* Right: live clock + sign out */}
      <View className="flex-row items-center gap-3">
        <Text className="text-white/60 text-sm">{formatted}</Text>
        {!!onLogout && (
          <TouchableOpacity
            onPress={onLogout}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2"
          >
            <Text className="text-white/80 text-xs font-semibold">Sign out</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
