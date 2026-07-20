import { ActivityIndicator, View } from "react-native";
import { Colors } from "../constants/theme";

export default function LoadingScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.background }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}
