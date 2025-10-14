import React, { useState } from "react";
import { View, TextInput, Alert, Text, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import styles from "../Styles/main";
import AppHeader from "../components/AppHeader";
import InfoFooter from "../components/InfoFooter";
import { login } from "../services/authService";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async () => {
    try {
      //const token = await login(email, password);
      // Navigate to main app (tabs)
      router.replace("/(tabs)");
    } catch (err) {
      Alert.alert("Error", err.message);
    }
    // For testing purposes, navigate directly to MainApp
    // router.replace("/(tabs)");
  };

  return (
    <View style={styles.container}>
      <View style={styles.backgroundWhiteBox} />
      <AppHeader />

      <View style={styles.signinContainer}>
        <Text style={styles.h2}>Sign in</Text>
        <Text style={styles.text}>Email</Text>
        <TextInput
          style={[styles.input, {color: email ? "#000000" : "rgba(0,0,0,0.3)"}]}
          placeholder="Enter your email"
          placeholderTextColor={"rgba(0,0,0,0.3)"}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Text style={styles.text}>Password</Text>
        <TextInput
          style={[styles.input, {color: password ? "#000000" : "rgba(0,0,0,0.3)"}]}
          placeholder="Enter your password"
          placeholderTextColor={"rgba(0,0,0,0.3)"}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        
        <TouchableOpacity onPress={handleSubmit} style={styles.buttonSmall}>
          <Text style={styles.buttonSmallText}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSubmit} style={styles.buttonBig}> 
          <Text style={styles.buttonBigText}>NEXT</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.lineContainer}>
        <View style={styles.line} />
        <Text style={styles.lineText}>Or</Text>
        <View style={styles.line} />
      </View>

      <View>

        <TouchableOpacity 
          onPress={() => router.push("/first-time-login")} 
          style={styles.buttonAuth}>
          <Image source={require('../assets/icon_facebook.png')} style={styles.logoImage} />
          <Text style={styles.buttonAuthText}>Continue with Facebook</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.push("/register")} 
          style={styles.buttonCreate}>
          <Text style={styles.buttonCreateText}>Create an Account</Text>
        </TouchableOpacity>
      </View>

      <InfoFooter />
    </View>
  );
}
