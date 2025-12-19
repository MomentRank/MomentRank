import React, { useState, useEffect } from "react";
import { View, TextInput, Alert, Text, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "../Styles/main";
import AppHeader from "../components/AppHeader";
import InfoFooter from "../components/InfoFooter";
import BASE_URL from "../Config";
import * as ImagePicker from 'expo-image-picker';
const API_URL = BASE_URL;

export default function FirstTimeLoginScreen() {
  const router = useRouter();
  const { username: passedUsername } = useLocalSearchParams();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (passedUsername) {
      setUsername(passedUsername);
    }
  }, [passedUsername]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
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

      // If a photo was selected, upload and update profile picture
      if (profilePhoto) {
        await uploadProfilePhoto(profilePhoto, token);
      }

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
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle profile photo selection
  const handleSelectPhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", "Please allow access to your photo library.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfilePhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error selecting photo:", error);
      Alert.alert("Error", "Failed to select photo.");
    }
  };

  // Upload profile photo
  const uploadProfilePhoto = async (uri, token) => {
    try {
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const extension = match ? match[1] : 'jpg';
      const contentType = `image/${extension}`;

      const response = await fetch(uri);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onloadend = async () => {
          try {
            const base64data = reader.result.split(',')[1];

            // Step 1: Upload photo to get FilePath
            const uploadResponse = await axios.post(
              `${API_URL}/photo/upload`,
              {
                fileData: base64data,
                fileName: filename,
                contentType: contentType
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            const uploadedPhoto = uploadResponse.data;
            const filePath = uploadedPhoto.FilePath || uploadedPhoto.filePath;

            if (!filePath) {
              throw new Error("No file path returned from upload");
            }

            // Step 2: Update profile picture with the new photo path
            await axios.post(
              `${API_URL}/profile/update-picture`,
              {
                filePath: filePath
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            resolve();
          } catch (error) {
            console.error("Failed to upload or update photo:", error);
            Alert.alert("Error", "Failed to update profile photo.");
            reject(error);
          }
        };

        reader.onerror = () => {
          console.error("Failed to read file");
          Alert.alert("Error", "Failed to read image file.");
          reject(new Error("Failed to read file"));
        };

        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Failed to process photo:", error);
      Alert.alert("Error", "Failed to process profile photo.");
    }
  };

  return (
    <View style={styles.container}>

      <AppHeader />

      <View style={styles.signinContainer}>
        <Text style={styles.h2}>First Time Log-in</Text>

        <View style={{ alignSelf: 'center', marginBottom: 20, position: 'relative' }}>
          <Image
            source={
              profilePhoto
                ? { uri: profilePhoto }
                : require('../assets/profile-icon.png')
            }
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
            }}
          />
          <TouchableOpacity
            onPress={handleSelectPhoto}
            disabled={isSubmitting}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              backgroundColor: isSubmitting ? '#ccc' : '#FF9500',
              width: 36,
              height: 36,
              borderRadius: 18,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 3,
              borderColor: '#fff',
            }}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>✎</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.text}>Name</Text>
        <TextInput
          style={[styles.input, { color: name ? "#000000" : "rgba(0,0,0,0.3)" }]}
          placeholder="Enter your name"
          placeholderTextColor={"rgba(0,0,0,0.3)"}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.text}>Username</Text>
        <TextInput
          style={[
            styles.input,
            { color: username ? "#000000" : "rgba(0,0,0,0.3)" },
            passedUsername ? { backgroundColor: "#f5f5f5", color: "#666666" } : {}
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
          style={[styles.input, styles.bioInput, { color: bio ? "#000000" : "rgba(0,0,0,0.3)" }]}
          placeholder="Tell us about yourself"
          placeholderTextColor={"rgba(0,0,0,0.3)"}
          multiline
          numberOfLines={4}
          scrollEnabled={true}
          textAlignVertical="top"
          value={bio}
          onChangeText={setBio}
        />

        <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting} style={styles.buttonBig}>
          <Text style={styles.buttonBigText}>
            {isSubmitting ? 'SIGNING UP...' : 'SIGN UP'}
          </Text>
        </TouchableOpacity>

      </View>

    </View>
  );
}
