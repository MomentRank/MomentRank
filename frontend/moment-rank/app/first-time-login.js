import React, { useState, useEffect } from "react";
import { View, TextInput, Alert, Text, TouchableOpacity, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "../Styles/main";
import AppHeader from "../components/AppHeader";
import InfoFooter from "../components/InfoFooter";
import BASE_URL from "../Config";
const API_URL = BASE_URL;

export default function FirstTimeLoginScreen() {
  const router = useRouter();
  const { username: passedUsername } = useLocalSearchParams();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (passedUsername) {
      setUsername(passedUsername);
    }
  }, [passedUsername]);

  const handleSubmit = async () => {
    try {
      // Get the JWT token from storage
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "No authentication token found. Please login again.");
        router.replace("/");
        return;
      }

      // Create profile with the backend
      const response = await axios.post(`${API_URL}/profile/create`, {
        name: name.trim() || null,
        bio: bio.trim() || null
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("Profile created successfully:", response.data);
      router.replace("/(tabs)/home");
    } catch (err) {
      console.error("Profile creation error:", err);
      if (err.response?.status === 401) {
        Alert.alert("Error", "Authentication failed. Please login again.");
        router.replace("/");
      } else if (err.response?.status === 400) {
        Alert.alert("Error", "Invalid profile data. Please check your inputs.");
      } else {
        Alert.alert("Error", `Profile creation failed: ${err.message}`);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.backgroundWhiteBox} />
      <AppHeader />

      <View style={styles.signinContainer}>
        <Text style={styles.h2}>First Time Log-in</Text>
        
        <View style={styles.profilePictureContainer}>
          <Image 
            source={require('../assets/profile-icon.png')} 
            style={styles.profilePicture} 
          />
        </View>

        <Text style={styles.text}>Name</Text>
        <TextInput
          style={[styles.input, {color: name ? "#000000" : "rgba(0,0,0,0.3)"}]}
          placeholder="Enter your name"
          placeholderTextColor={"rgba(0,0,0,0.3)"}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.text}>Username</Text>
        <TextInput
          style={[
            styles.input, 
            {color: username ? "#000000" : "rgba(0,0,0,0.3)"},
            passedUsername ? {backgroundColor: "#f5f5f5", color: "#666666"} : {}
          ]}
          placeholder="Enter your username"
          placeholderTextColor={"rgba(0,0,0,0.3)"}
          value={username}
          onChangeText={passedUsername ? undefined : setUsername}
          autoCapitalize="none"
          editable={!passedUsername}
        />

        <Text style={styles.text}>Bio</Text>
        <TextInput
          style={[styles.input, styles.bioInput, {color: bio ? "#000000" : "rgba(0,0,0,0.3)"}]}
          placeholder="Tell us about yourself"
          placeholderTextColor={"rgba(0,0,0,0.3)"}
          multiline
          numberOfLines={4}
          scrollEnabled={true}
          textAlignVertical="top"
          value={bio}
          onChangeText={setBio}
        />

        <TouchableOpacity onPress={handleSubmit} style={styles.buttonBig}> 
          <Text style={styles.buttonBigText}>SIGN UP</Text>
        </TouchableOpacity>

      </View>

    </View>
  );
}
