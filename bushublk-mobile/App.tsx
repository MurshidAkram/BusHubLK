import React from "react";
import { SafeAreaView, StatusBar } from "react-native";
import HomeScreen from "./src/screens/HomeScreen";

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <HomeScreen />
    </SafeAreaView>
  );
}
