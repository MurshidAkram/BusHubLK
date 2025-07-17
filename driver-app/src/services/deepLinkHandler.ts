import { Linking } from "react-native";
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
          // Navigate to password reset screen with token
          this.navigation.navigate("ResetPassword", { token });
        } else {
          console.error("❌ No token found in reset password link");
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
          this.navigation.navigate("ResetPassword", { token: tokenMatch[1] });
        }
      }
    }
  };

  setupDeepLinkListener = () => {
    // Handle app launch from deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log("🚀 App launched with deep link:", url);
        this.handleDeepLink(url);
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
