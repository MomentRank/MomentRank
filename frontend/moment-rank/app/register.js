import React, { useState, useEffect } from "react";
import { View, TextInput, Alert, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import styles from "../Styles/main";
import AppHeader from "../components/AppHeader";
import InfoFooter from "../components/InfoFooter";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationRequirements, setValidationRequirements] = useState(null);
  const [passwordValid, setPasswordValid] = useState(false);
  const [emailValid, setEmailValid] = useState(false);
  const [usernameValid, setUsernameValid] = useState(false);

  const API_URL = "http://localhost:5121";

  useEffect(() => {
    fetchValidationRequirements();
  }, []);

  const fetchValidationRequirements = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/validation-requirements`);
      setValidationRequirements(response.data);
    } catch (error) {
      console.error("Failed to fetch validation requirements:", error);
    }
  };

  const validatePassword = (pwd) => {
    const hasLength = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasDigit = /\d/.test(pwd);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);
    
    return hasLength && hasUpper && hasLower && hasDigit && hasSpecial;
  };

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 255;
  };

  const validateUsername = (username) => {
    if (!username || username.length < 3 || username.length > 20) return false;
    if (!/^[a-zA-Z0-9]/.test(username)) return false;
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) return false;
    
    // Check for consecutive special characters
    for (let i = 1; i < username.length; i++) {
      if ((username[i] === '_' || username[i] === '-') && 
          (username[i-1] === '_' || username[i-1] === '-')) {
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (!passwordValid) {
      Alert.alert("Error", "Password does not meet requirements");
      return;
    }

    if (!emailValid) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    if (!usernameValid) {
      Alert.alert("Error", "Username does not meet requirements");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        username,
        email,
        password
      });
      
      // Automatically log in the user after successful registration
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      
      // Store the token
      const { access_token } = loginResponse.data;
      await AsyncStorage.setItem("token", access_token);
      
      console.log("Registration and login successful, navigating to first-time login...");
      router.replace(`/first-time-login?username=${encodeURIComponent(username)}`);
    } catch (err) {
      console.error("Registration error:", err);
      if (err.response?.status === 409) {
        Alert.alert("Error", "Username or email already exists");
      } else if (err.response?.status === 400) {
        Alert.alert("Error", "Invalid input data");
      } else {
        Alert.alert("Error", `Registration failed: ${err.message}`);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.backgroundWhiteBox} />
      <AppHeader />

      <View style={styles.signinContainer}>
        <Text style={styles.h2}>Create an account</Text>
        
        <Text style={styles.text}>Username</Text>
        <TextInput
          style={[
            styles.input, 
            {color: username ? "#000000" : "rgba(0,0,0,0.3)"},
            username && !usernameValid ? {borderColor: 'red', borderWidth: 1} : {}
          ]}
          placeholder="Enter your username"
          placeholderTextColor={"rgba(0,0,0,0.3)"}
          value={username}
          onChangeText={(text) => {
            setUsername(text);
            setUsernameValid(validateUsername(text));
          }}
          autoCapitalize="none"
        />

        <Text style={styles.text}>Email</Text>
        <TextInput
          style={[
            styles.input, 
            {color: email ? "#000000" : "rgba(0,0,0,0.3)"},
            email && !emailValid ? {borderColor: 'red', borderWidth: 1} : {}
          ]}
          placeholder="Enter your email"
          placeholderTextColor={"rgba(0,0,0,0.3)"}
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setEmailValid(validateEmail(text));
          }}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.text}>Password</Text>
        <TextInput
          style={[
            styles.input, 
            {color: password ? "#000000" : "rgba(0,0,0,0.3)"},
            password && !passwordValid ? {borderColor: 'red', borderWidth: 1} : {}
          ]}
          placeholder="Enter your password"
          placeholderTextColor={"rgba(0,0,0,0.3)"}
          secureTextEntry
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setPasswordValid(validatePassword(text));
          }}
        />

        <Text style={styles.text}>Confirm password</Text>
        <TextInput
          style={[
            styles.input, 
            {color: confirmPassword ? "#000000" : "rgba(0,0,0,0.3)"},
            confirmPassword && password !== confirmPassword ? {borderColor: 'red', borderWidth: 1} : {}
          ]}
          placeholder="Confirm your password"
          placeholderTextColor={"rgba(0,0,0,0.3)"}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <View style={styles.passwordRequirements}>
          <Text style={styles.requirementText}>Password Requirements:</Text>
          <Text style={[styles.requirementText, password.length >= 8 ? styles.validRequirement : styles.invalidRequirement]}>
            • At least 8 characters
          </Text>
          <Text style={[styles.requirementText, /[A-Z]/.test(password) ? styles.validRequirement : styles.invalidRequirement]}>
            • At least one uppercase letter (A-Z)
          </Text>
          <Text style={[styles.requirementText, /[a-z]/.test(password) ? styles.validRequirement : styles.invalidRequirement]}>
            • At least one lowercase letter (a-z)
          </Text>
          <Text style={[styles.requirementText, /\d/.test(password) ? styles.validRequirement : styles.invalidRequirement]}>
            • At least one number (0-9)
          </Text>
          <Text style={[styles.requirementText, /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? styles.validRequirement : styles.invalidRequirement]}>
            • At least one special character (!@#$%^&*)
          </Text>
        </View>

        <TouchableOpacity onPress={handleSubmit} style={styles.buttonBig}> 
          <Text style={styles.buttonBigText}>SIGN UP</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}
