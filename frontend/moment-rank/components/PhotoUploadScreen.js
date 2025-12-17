import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ScrollView, TextInput, Dimensions, FlatList, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import BASE_URL from '../Config';
import Style from '../Styles/main';
import AppHeader from './AppHeader';
import { takePhoto, pickImage } from "./CameraFunctions"
import InviteFriendsModal from './InviteFriendsModal';
import ParticipantsModal from './ParticipantsModal';

const API_URL = BASE_URL;

export default function PhotoUploadScreen() {
  const { eventId } = useLocalSearchParams();
  const router = useRouter();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [eventName, setEventName] = useState('Event Photos');
  const [isPublic, setIsPublic] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [eventOwner, setEventOwner] = useState(null);
  const [eventMembers, setEventMembers] = useState([]);

  const currentEventId = eventId || '1';

  const handlePickImage = () => pickImage(setLoading, loadPhotos, currentEventId)();
  const handleTakePhoto = () => takePhoto(setLoading, loadPhotos, currentEventId)();

  const loadPhotos = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        return;
      }

      const response = await axios.post(`${API_URL}/event/photos/list`, {
        eventId: parseInt(currentEventId)
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.data) {
        setPhotos(response.data);
        // Start prefetching/measurement to improve viewer performance
        prefetchAndMeasure(response.data).catch(() => { });
      }
    } catch (error) {
      console.error('Load photos error:', error);
      if (error.response?.status === 401) {
        Alert.alert("Error", "Authentication failed. Please login again.");
      } else if (error.response?.status === 403) {
        Alert.alert("Access Denied", "You don't have access to view photos for this event. This might be a private event that requires membership.");
      } else {
        Alert.alert("Error", "Failed to load photos");
      }
    }
  };

  const loadEventDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        return;
      }

      const response = await axios.post(`${API_URL}/event/read`, {
        id: parseInt(currentEventId)
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data) {
        console.log('Event data:', JSON.stringify(response.data, null, 2));
        setEventName(response.data.name || 'Event Photos');
        setIsPublic(response.data.public);

        // Extract owner info
        if (response.data.owner) {
          console.log('Owner data:', response.data.owner);
          setEventOwner(response.data.owner);
        }

        // Extract members list (excluding owner)
        if (response.data.members && Array.isArray(response.data.members)) {
          console.log('Members data:', response.data.members);
          setEventMembers(response.data.members);
        } else if (response.data.memberIds && Array.isArray(response.data.memberIds)) {
          // If only member IDs are provided, we'll need to fetch member details
          console.log('Member IDs only:', response.data.memberIds);
          setEventMembers(response.data.memberIds.map(id => ({ id })));
        }
      }
    } catch (error) {
      console.error('Load event details error:', error);
      // Keep default title if event details can't be loaded
      setEventName('Event Photos');
    }
  };

  const deletePhoto = async (photoId) => {
    Alert.alert(
      "Delete Photo",
      "Are you sure you want to delete this photo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
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
          }
        }
      ]
    );
  };

  // Load photos and current user when component mounts
  React.useEffect(() => {
    loadEventDetails();
    loadPhotos();
  }, []);

  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);
  const flatListRef = React.useRef(null);
  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;
  const [aspectRatios, setAspectRatios] = useState({});
  const PREFETCH_EAGER_COUNT = 6; // number of images to prefetch/measure eagerly

  // Helper: get image size as promise
  const getSizeAsync = (uri) => new Promise((resolve, reject) => {
    Image.getSize(uri, (w, h) => resolve({ w, h }), reject);
  });

  // Prefetch and measure images to improve viewer performance.
  const prefetchAndMeasure = React.useCallback(async (photoList) => {
    if (!Array.isArray(photoList) || photoList.length === 0) return;

    const eager = photoList.slice(0, PREFETCH_EAGER_COUNT);
    const rest = photoList.slice(PREFETCH_EAGER_COUNT);
    const eagerRatios = {};

    // Eagerly prefetch and measure first few images (blocking-ish) to reduce initial lag.
    await Promise.all(eager.map(async (p, i) => {
      const uri = `${API_URL}/${p.filePath}`;
      try {
        await Image.prefetch(uri);
        const { w, h } = await getSizeAsync(uri);
        eagerRatios[i] = w / h;
      } catch (e) {
        eagerRatios[i] = eagerRatios[i] || 1.5;
      }
    }));

    if (Object.keys(eagerRatios).length > 0) {
      setAspectRatios(prev => ({ ...prev, ...eagerRatios }));
    }

    // Background prefetch + measure remaining images (non-blocking)
    (async () => {
      await Promise.all(rest.map(async (p, idx) => {
        const realIndex = idx + PREFETCH_EAGER_COUNT;
        const uri = `${API_URL}/${p.filePath}`;
        try {
          await Image.prefetch(uri);
          const { w, h } = await getSizeAsync(uri);
          setAspectRatios(prev => ({ ...prev, [realIndex]: w / h }));
        } catch (e) {
          setAspectRatios(prev => ({ ...prev, [realIndex]: prev[realIndex] || 1.5 }));
        }
      }));
    })();
  }, []);


  const handleViewParticipants = () => {
    setShowParticipantsModal(true);
  };

  const handleInviteFriend = () => {
    setShowInviteModal(true);
  };

  // Memoized renderItem for FlatList (must be declared unconditionally)
  const renderFullScreenItem = React.useCallback(({ item: photo, index }) => {
    const ratio = aspectRatios[index];

    // Compute a centered black box with 3:4 aspect ratio that fits the screen.
    // boxWidth / boxHeight = 3/4 => boxHeight = boxWidth * 4/3
    const maxBoxWidth = windowWidth * 0.95;
    const maxBoxHeight = windowHeight * 0.95;
    const boxWidth = Math.min(maxBoxWidth, (maxBoxHeight * 3) / 4);
    const boxHeight = (boxWidth * 4) / 3;

    // Compute image height so it fits within the box while preserving aspect ratio.
    let imageHeight;
    if (ratio) {
      // ratio = w/h => height when width = boxWidth is boxWidth / ratio
      imageHeight = Math.min(boxHeight, boxWidth / ratio);
    } else {
      imageHeight = boxHeight * 0.95;
    }

    return (
      <View style={{ width: windowWidth, height: windowHeight, justifyContent: 'center', alignItems: 'center' }}>
        {/* Black 3:4 background box behind the image */}
        <View style={{ width: boxWidth, height: boxHeight, backgroundColor: 'black', borderRadius: 4, position: 'absolute' }} />

        {/* Keep the blurry/semi-transparent backdrop (already rendered at overlay level) and render image on top */}
        <Image
          source={{ uri: `${API_URL}/${photo.filePath}` }}
          style={{ width: boxWidth, height: imageHeight }}
          resizeMode="contain"
        />
      </View>
    );
  }, [aspectRatios, windowWidth, windowHeight]);

  const openPhotoViewer = (index) => {
    setSelectedPhotoIndex(index);
  };

  const closePhotoViewer = () => {
    setSelectedPhotoIndex(null);
  };

  // Scroll to selected photo when viewer opens
  React.useEffect(() => {
    if (selectedPhotoIndex !== null && flatListRef.current) {
      // small timeout to allow layout to finish
      setTimeout(() => {
        try {
          flatListRef.current.scrollToIndex({ index: selectedPhotoIndex, animated: false });
        } catch (e) {
          // fallback: scrollToOffset
          try {
            flatListRef.current.scrollToOffset({ offset: selectedPhotoIndex * windowWidth, animated: false });
          } catch (e2) {
            // ignore
          }
        }
      }, 50);
    }
  }, [selectedPhotoIndex, windowWidth]);

  // load aspect ratio for selected image so we can size it to fit horizontally
  React.useEffect(() => {
    if (selectedPhotoIndex !== null && photos[selectedPhotoIndex]) {
      const uri = `${API_URL}/${photos[selectedPhotoIndex].filePath}`;
      if (!aspectRatios[selectedPhotoIndex]) {
        Image.getSize(uri, (w, h) => {
          setAspectRatios(prev => ({ ...prev, [selectedPhotoIndex]: w / h }));
        }, (err) => {
          // fallback if fetch fails
          setAspectRatios(prev => ({ ...prev, [selectedPhotoIndex]: 1.5 }));
        });
      }
    }
  }, [selectedPhotoIndex, photos]);

  return (
    <View style={{ backgroundColor: '#FFD280', overflow: 'hidden', flex: 1 }}>
      <View style={{ backgroundColor: '#FFFFFF', borderRadius: 50, paddingBottom: 50, marginBottom: '10%', marginTop: '12.4%', marginHorizontal: '1.5%', flex: 1 }}>

        <AppHeader />

        {/* --- HEADER ROW --- */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          marginTop: 10,
          marginBottom: 10,
          minHeight: 40
        }}>

          {/* Left Button: Participants (Only if Private) */}
          {isPublic ? (
            <View style={{ width: 40 }} />
          ) : (
            <TouchableOpacity
              onPress={handleViewParticipants}
              style={{ padding: 5, width: 40, alignItems: 'flex-start' }}
            >
              <Image
                source={require('../assets/icon_friends.png')} // Replace with Participants Icon
                style={{ width: 24, height: 24, tintColor: '#333' }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}

          {/* Center: Event Name */}
          <Text style={[Style.h2, { textAlign: 'center', flex: 1, marginHorizontal: 5 }]} numberOfLines={1}>
            {eventName}
          </Text>

          {/* Right Button: Invite Friend (Only if Private) */}
          {isPublic ? (
            <View style={{ width: 40 }} />
          ) : (
            <TouchableOpacity
              onPress={handleInviteFriend}
              style={{ padding: 5, width: 40, alignItems: 'flex-end' }}
            >
              <Image
                source={require('../assets/icon_add.png')} // Replace with Invite Icon
                style={{ width: 24, height: 24, tintColor: '#333' }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}
        </View>
        {/* --- HEADER ROW END --- */}


        <ScrollView scrollEnabled={selectedPhotoIndex === null} contentContainerStyle={{ padding: 0, paddingBottom: 100 }}>
          {/* Photos Grid */}
          <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingBottom: 120, marginHorizontal: "3%" }}>
            {photos.map((photo, index) => (
              <View key={photo.id} style={{ width: '48%', marginBottom: 15 }}>
                <View style={{ position: 'relative' }}>
                  <TouchableOpacity onPress={() => openPhotoViewer(index)}>
                    <Image
                      source={{ uri: `${API_URL}/${photo.filePath}` }}
                      style={{ width: '100%', height: 200, borderRadius: 8 }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => deletePhoto(photo.id)}
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      width: 23,
                      height: 23,
                      borderRadius: 14,
                      backgroundColor: '#FF3B30',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10,
                    }}
                  >
                    <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>×</Text>
                  </TouchableOpacity>
                </View>

                <Text style={{ fontSize: 12, marginTop: 8, color: '#666' }}>
                  {photo.caption || 'No caption'}
                </Text>
                <Text style={{ fontSize: 10, color: '#999' }}>
                  by {photo.uploadedByUsername}
                </Text>
              </View>
            ))}
          </View>


          {photos.length === 0 && (
            <Text style={{ textAlign: 'center', color: '#666', marginTop: 20 }}>
              No photos uploaded yet
            </Text>
          )}

        </ScrollView>
      </View>
      <View style={{ position: 'absolute', left: 20, right: 20, bottom: windowHeight * 0.08, flexDirection: 'row', justifyContent: 'space-between', zIndex: 900 }} pointerEvents="box-none">
        <TouchableOpacity
          onPress={() => pickImage(setLoading, loadPhotos, currentEventId)()}
          disabled={loading}
          style={{
            flex: 1,
            marginRight: 10,
            backgroundColor: loading ? '#666' : '#333',
            paddingVertical: 14,
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row'
          }}
        >
          <Image source={require('../assets/icon_upload.png')} style={{ width: 22, height: 22, marginRight: 10, tintColor: 'white' }} />
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
            {loading ? 'Uploading...' : 'Upload'}
          </Text>
        </TouchableOpacity>

        {/* Camera on the right */}
        <TouchableOpacity
          onPress={() => takePhoto(setLoading, loadPhotos, currentEventId)()}
          disabled={loading}
          style={{
            flex: 1,
            marginLeft: 10,
            backgroundColor: loading ? '#CC7700' : '#FF9500',
            paddingVertical: 14,
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row'
          }}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
            {loading ? 'Uploading...' : 'Camera'}
          </Text>
          <Image source={require('../assets/icon_camera.png')} style={{ width: 22, height: 22, marginLeft: 10, tintColor: 'white' }} />
        </TouchableOpacity>
      </View>

      {selectedPhotoIndex !== null && (
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
          }}
        >
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.2)' }} />
          <View style={{ flex: 1, overflow: 'hidden' }}>
            <FlatList
              ref={flatListRef}
              data={photos}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, idx) => String(item.id ?? idx)}
              getItemLayout={(data, index) => (
                { length: windowWidth, offset: windowWidth * index, index }
              )}
              initialScrollIndex={selectedPhotoIndex}
              renderItem={renderFullScreenItem}
              style={{ flex: 1 }}
              contentContainerStyle={{ height: windowHeight }}
              snapToInterval={windowWidth}
              decelerationRate="fast"
              initialNumToRender={1}
              maxToRenderPerBatch={2}
              windowSize={3}
              removeClippedSubviews={true}
            />
            <TouchableOpacity
              onPress={closePhotoViewer}
              style={{
                position: 'absolute',
                top: 40,
                right: 20,
                padding: 10,
              }}
            >
              <Text style={{ color: 'white', fontSize: 30 }}>×</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Invite Friends Modal */}
      {showInviteModal && (
        <InviteFriendsModal
          visible={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          eventId={currentEventId}
          eventName={eventName}
          eventMembers={eventMembers}
        />
      )}

      {/* Participants Modal */}
      {showParticipantsModal && (
        <ParticipantsModal
          visible={showParticipantsModal}
          onClose={() => setShowParticipantsModal(false)}
          eventId={currentEventId}
          eventName={eventName}
          owner={eventOwner}
          members={eventMembers}
        />
      )}

    </View>
  );
}