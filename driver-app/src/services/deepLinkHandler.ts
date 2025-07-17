import { Linking, Alert } from "react-native";
import { NavigationContainerRef } from "@react-navigation/native";

export interface DeepLinkHandler {
  handleDeepLink: (url: string) => void;
  setupDeepLinkListener: () => void;
}

class DeepLinkService implements DeepLinkHandler {
  private navigation: NavigationContainerRef<any> | null = null;

  setNavigation(navigation: NavigationContainerRef<any>) {
    this.navigation = navigation;
  }

  handleDeepLink = (url: string) => {
    console.log("🔗 Handling deep link:", url);

    try {
      if (url.includes("reset-password")) {
        const urlObj = new URL(url);
        const token = urlObj.searchParams.get("token");

        console.log("🔑 Reset password token found:", token);

        if (token && this.navigation) {
          // Show a brief success message that the link was opened
          Alert.alert(
            "Link Opened",
            "Password reset link opened successfully!",
            [{ text: "Continue", style: "default" }]
          );

          // Navigate to password reset screen with token
          this.navigation.navigate("ResetPassword", { token });
        } else {
          console.error("❌ No token found in reset password link");
          Alert.alert(
            "Error",
            "Invalid reset link. Please request a new password reset.",
            [{ text: "OK", style: "default" }]
          );
        }
      } else if (url.includes("login")) {
        console.log("🔐 Login deep link detected");
        if (this.navigation) {
          this.navigation.navigate("Login");
        }
      } else {
        console.log("🤷‍♂️ Unknown deep link format:", url);
      }
    } catch (error) {
      console.error("❌ Error parsing deep link:", error);

      // Fallback: try to extract token from URL string directly
      if (url.includes("reset-password") && url.includes("token=")) {
        const tokenMatch = url.match(/token=([^&]+)/);
        if (tokenMatch && tokenMatch[1] && this.navigation) {
          console.log(
            "🔧 Fallback token extraction successful:",
            tokenMatch[1]
          );

          Alert.alert(
            "Link Opened",
            "Password reset link opened successfully!",
            [{ text: "Continue", style: "default" }]
          );

          this.navigation.navigate("ResetPassword", { token: tokenMatch[1] });
        } else {
          Alert.alert(
            "Error",
            "Could not process the reset link. Please try again.",
            [{ text: "OK", style: "default" }]
          );
        }
      }
    }
  };

  setupDeepLinkListener = () => {
    // Handle app launch from deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log("🚀 App launched with deep link:", url);
        // Add a small delay to ensure navigation is ready
        setTimeout(() => {
          this.handleDeepLink(url);
        }, 1000);
      }
    });

    // Handle deep links when app is already running
    const subscription = Linking.addEventListener("url", ({ url }) => {
      console.log("📱 Deep link received while app running:", url);
      this.handleDeepLink(url);
    });

    return () => subscription?.remove();
  };
}

export const deepLinkService = new DeepLinkService();
