import React from "react";
import * as Linking from "expo-linking";
import RootNavigator from "./src/navigation/RootNavigator";

export default function App() {
  // Handle deep links
  React.useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      console.log("🤷‍♂️ Deep link received:", event.url);

      // Handle different deep link formats
      if (event.url.startsWith('exp://')) {
        // Handle Expo deep links (development)
        console.log("Expo deep link detected:", event.url);
        // Parse the URL and navigate accordingly
      } else if (event.url.includes('/password-reset/')) {
        // Handle password reset deep links
        console.log("Password reset deep link detected:", event.url);
        // Extract token and email from URL and navigate to reset screen
        const url = new URL(event.url);
        const token = url.pathname.split('/').pop();
        const email = url.searchParams.get('email');

        if (token && email) {
          console.log("Navigating to password reset with token:", token, "email:", email);
          // TODO: Navigate to ResetPasswordScreen with token and email
          // You can use navigation.navigate('ResetPassword', { token, email })
        }
      } else if (event.url.startsWith('bushublkapp://')) {
        // Handle custom scheme deep links (production)
        console.log("Custom scheme deep link detected:", event.url);
      }
    };

    // Listen for deep links
    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Check if app was opened from a deep link
    Linking.getInitialURL().then((url: string | null) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  return <RootNavigator />;
}
