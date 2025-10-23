import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ScrollView, TextInput } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import BASE_URL from '../Config';

const API_URL = BASE_URL;

export default function PhotoUploadScreen() {
  const { eventId } = useLocalSearchParams();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Use eventId from params or default to 1 for testing
  const currentEventId = eventId || '1';

  const pickImage = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission required", "Permission to access camera roll is required!");
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadPhoto(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const uploadPhoto = async (imageAsset) => {
    try {
      setLoading(true);
      
      // Get JWT token
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert("Error", "Please login first");
        return;
      }

      // Convert image to base64 for React Native
      const response = await fetch(imageAsset.uri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64data = reader.result;
            
            // Send as JSON instead of FormData
            const uploadData = {
              eventId: parseInt(currentEventId),
              fileData: base64data,
              fileName: imageAsset.fileName || 'photo.jpg',
              contentType: 'image/jpeg',
              caption: ''
            };

            const uploadResponse = await axios.post(`${API_URL}/event/photos/upload-base64`, uploadData, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });

            if (uploadResponse.data) {
              Alert.alert("Success", "Photo uploaded successfully!");
              loadPhotos(); // Refresh the list
              resolve(uploadResponse.data);
            }
          } catch (error) {
            console.error('Upload error:', error);
            if (error.response?.status === 401) {
              Alert.alert("Error", "Authentication failed. Please login again.");
            } else if (error.response?.status === 400) {
              Alert.alert("Error", "Invalid file. Please check file size and type.");
            } else {
              Alert.alert("Error", "Failed to upload photo");
            }
            reject(error);
          } finally {
            setLoading(false);
          }
        };
        reader.onerror = () => {
          setLoading(false);
          reject(new Error('Failed to read file'));
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert("Error", "Failed to upload photo");
      setLoading(false);
    }
  };

  const loadPhotos = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log("No token found, skipping photo load");
        return;
      }

      const response = await axios.post(`${API_URL}/event/photos/list`, {
        eventId: currentEventId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data) {
        setPhotos(response.data);
      }
    } catch (error) {
      console.error('Load photos error:', error);
      if (error.response?.status === 401) {
        Alert.alert("Error", "Authentication failed. Please login again.");
      } else {
        Alert.alert("Error", "Failed to load photos");
      }
    }
  };

  const deletePhoto = async (photoId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert("Error", "Please login first");
        return;
      }

      const response = await axios.post(`${API_URL}/event/photos/delete`, {
        photoId: photoId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data) {
        Alert.alert("Success", "Photo deleted successfully!");
        loadPhotos(); // Refresh the list
      }
    } catch (error) {
      console.error('Delete error:', error);
      if (error.response?.status === 401) {
        Alert.alert("Error", "Authentication failed. Please login again.");
      } else if (error.response?.status === 404) {
        Alert.alert("Error", "Photo not found or you don't have permission to delete it.");
      } else {
        Alert.alert("Error", "Failed to delete photo");
      }
    }
  };

  // Load photos when component mounts
  React.useEffect(() => {
    loadPhotos();
  }, []);

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Event Photos
      </Text>

      {/* Upload Button */}
      <TouchableOpacity
        onPress={pickImage}
        disabled={loading}
        style={{
          backgroundColor: '#007AFF',
          padding: 15,
          borderRadius: 8,
          alignItems: 'center',
          marginBottom: 20,
          opacity: loading ? 0.6 : 1,
        }}
      >
        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
          {loading ? 'Uploading...' : 'Upload Photo'}
        </Text>
      </TouchableOpacity>

      {/* Photos Grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        {photos.map((photo) => (
          <View key={photo.id} style={{ width: '48%', marginBottom: 15 }}>
            <Image
              source={{ uri: `${API_URL}/${photo.filePath}` }}
              style={{ width: '100%', height: 150, borderRadius: 8 }}
              resizeMode="cover"
            />
            <Text style={{ fontSize: 12, marginTop: 5, color: '#666' }}>
              {photo.caption || 'No caption'}
            </Text>
            <Text style={{ fontSize: 10, color: '#999' }}>
              by {photo.uploadedByUsername}
            </Text>
            <TouchableOpacity
              onPress={() => deletePhoto(photo.id)}
              style={{
                backgroundColor: '#FF3B30',
                padding: 5,
                borderRadius: 4,
                alignItems: 'center',
                marginTop: 5,
              }}
            >
              <Text style={{ color: 'white', fontSize: 12 }}>Delete</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {photos.length === 0 && (
        <Text style={{ textAlign: 'center', color: '#666', marginTop: 50 }}>
          No photos uploaded yet
        </Text>
      )}
    </ScrollView>
  );
}
