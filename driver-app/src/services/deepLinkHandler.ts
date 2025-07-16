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

    if (url.includes("reset-password")) {
      const urlObj = new URL(url);
      const token = urlObj.searchParams.get("token");

      if (token && this.navigation) {
        // Navigate to password reset screen with token
        this.navigation.navigate("ResetPassword", { token });
      }
    } else if (url.includes("login")) {
      if (this.navigation) {
        this.navigation.navigate("Login");
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
