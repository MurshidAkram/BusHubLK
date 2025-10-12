declare module "@expo/vector-icons" {
  import type * as React from "react";
  import type { TextProps } from "react-native";

  type IconProps = TextProps & {
    name: string;
    size?: number;
    color?: string;
  };

  type IconComponent = React.ComponentType<IconProps> & {
    glyphMap: Record<string, string>;
  };

  export const Ionicons: IconComponent;
  export const MaterialIcons: IconComponent;
  export const FontAwesome: IconComponent;
  export const Feather: IconComponent;
  export const AntDesign: IconComponent;
  export const MaterialCommunityIcons: IconComponent;
  export const Entypo: IconComponent;
  export const SimpleLineIcons: IconComponent;
  export const Foundation: IconComponent;
  export const EvilIcons: IconComponent;
  export const Octicons: IconComponent;
  export const Zocial: IconComponent;
}
