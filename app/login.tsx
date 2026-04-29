import { useState } from "react";
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from "react-native";

import { loginWithEmailPassword } from "@/services/firebase/auth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit() {
    if (isSubmitting) return;
    if (!email.trim() || !password) {
      Alert.alert("Missing info", "Please enter email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await loginWithEmailPassword(email, password);
    } catch (e: any) {
      const message =
        typeof e?.message === "string" ? e.message : "Login failed. Please check your credentials.";
      Alert.alert("Login failed", message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View className="flex-1 items-center justify-center bg-black px-6">
      <View className="w-full max-w-md rounded-2xl bg-white/10 p-6">
        <Text className="text-2xl font-bold text-white">Sign in</Text>
        <Text className="mt-1 text-white/70">Use your Firebase email/password account.</Text>

        <Text className="mt-6 text-sm font-medium text-white/80">Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="name@company.com"
          placeholderTextColor="rgba(255,255,255,0.35)"
          className="mt-2 h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-white"
        />

        <Text className="mt-4 text-sm font-medium text-white/80">Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor="rgba(255,255,255,0.35)"
          className="mt-2 h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-white"
        />

        <TouchableOpacity
          onPress={onSubmit}
          disabled={isSubmitting}
          className="mt-6 h-12 items-center justify-center rounded-xl bg-white">
          {isSubmitting ? (
            <ActivityIndicator />
          ) : (
            <Text className="text-base font-semibold text-black">Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

