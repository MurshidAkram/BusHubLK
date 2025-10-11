import React from "react";
import RootNavigator from "./src/navigation/RootNavigator";
// Import BackgroundLocationService to ensure TaskManager task is defined at app startup
import "./src/services/backgroundLocationService";

export default function App() {
  console.log("🚀 Driver App starting...");
  return <RootNavigator />;
}
