import React, { useState } from "react";
import { View, TextInput, Alert, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import styles from "../Styles/main";
import AppHeader from "../components/AppHeader";
import InfoFooter from "../components/InfoFooter";
import { register } from "../services/authService";

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      await register(name, email, password);
      Alert.alert("Success", "Account created successfully", [
        { text: "OK", onPress: () => router.replace("/(tabs)") }
      ]);
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.backgroundWhiteBox} />
      <AppHeader />

      <View style={styles.signinContainer}>
        <Text style={styles.h2}>Create an account</Text>
        
        <Text style={styles.text}>Name</Text>
        <TextInput
          style={[styles.input, {color: name ? "#000000" : "rgba(0,0,0,0.3)"}]}
          placeholder="Enter your name"
          placeholderTextColor={"rgba(0,0,0,0.3)"}
          value={name}
          onChangeText={setName}
        />

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

        <Text style={styles.text}>Confirm password</Text>
        <TextInput
          style={[styles.input, {color: confirmPassword ? "#000000" : "rgba(0,0,0,0.3)"}]}
          placeholder="Confirm your password"
          placeholderTextColor={"rgba(0,0,0,0.3)"}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <View style={styles.passwordRequirements}>
          <Text style={styles.requirementText}>• Password must be made up of at least 8 symbols</Text>
          <Text style={styles.requirementText}>• Password must contain at least 1 number</Text>
          <Text style={styles.requirementText}>• Password must contain at least 1 capital and lowercase letter</Text>
          <Text style={styles.requirementText}>• Password must contain at least 1 special symbol (#@!$%^&*)</Text>
        </View>

        <TouchableOpacity onPress={handleSubmit} style={styles.buttonBig}> 
          <Text style={styles.buttonBigText}>SIGN UP</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}
