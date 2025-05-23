import { StyleSheet, Text, View, ImageBackground, TouchableOpacity, SafeAreaView } from "react-native"
import { StatusBar } from "expo-status-bar"
import { useNavigation } from "@react-navigation/native"
import { Asset } from "expo-asset"

export default function OnboardingScreen() {
  const navigation = useNavigation()

  const handleGetStarted = () => {
    navigation.navigate("Login" as never)
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ImageBackground 
        source={require("../../assets/images/onboarding-bg.jpg")} 
        style={styles.backgroundImage}
      >
        <SafeAreaView style={styles.content}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Đắm say hương vị cà phê - Phiêu bồi cùng niềm vui!</Text>
            <Text style={styles.subtitle}>
            Chào mừng đến góc cà phê ấm cúng của chúng tôi, nơi mỗi ly đều mang đến niềm vui cho bạn!
            </Text>
          </View>
          <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
            <Text style={styles.buttonText}>Bắt đầu ngay</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </ImageBackground>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 20,
    paddingBottom: 40,
  },
  textContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  button: {
    backgroundColor: "#C87D55",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
})
