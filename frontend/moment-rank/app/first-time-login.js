import React, { useState } from "react";
import { View, TextInput, Alert, Text, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import styles from "../Styles/main";
import AppHeader from "../components/AppHeader";
import InfoFooter from "../components/InfoFooter";

export default function FirstTimeLoginScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  const handleSubmit = async () => {
    try {
      // Add first time login logic here
      // For now, navigate to main app
      router.replace("/(tabs)");
    } catch (err) {
      Alert.alert("Error", err.message);
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
          style={[styles.input, {color: username ? "#000000" : "rgba(0,0,0,0.3)"}]}
          placeholder="Enter your username"
          placeholderTextColor={"rgba(0,0,0,0.3)"}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
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
