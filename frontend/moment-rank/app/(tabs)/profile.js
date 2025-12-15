import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, TextInput, Image, Alert, ScrollView, Modal, FlatList, Dimensions } from "react-native";
import { useRouter, Redirect } from "expo-router";
import styles from "../../Styles/main";
import AppHeader from "../../components/AppHeader";
import { logout } from "../../services/authService";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BASE_URL from "../../Config";

const API_URL = BASE_URL;

export default function ProfileScreen() {
  const handleLogout = async () => {
    setLoading(true);
    await AsyncStorage.removeItem("token");
    router.replace("/");
    setLoading(false);
  };

  var router = useRouter();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [userId, setUserId] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventPhotos, setEventPhotos] = useState([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);
  const flatListRef = useRef(null);
  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;

  const fetchEvents = async (token, userId) => {
    try {
      console.log("Fetching events for userId:", userId);
      const response = await axios.post(
        `${API_URL}/event/list`,
        {
          "includePublic": true
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        }
      );

      const allEvents = response.data || [];
      console.log("All events received:", allEvents.length);
      const currentDate = new Date();
      console.log("Current date:", currentDate);

      // Filter events where user is owner or member, and event has already ended
      // Show all ended events where user is owner, but only private ended events where user is member
      const userEvents = allEvents.filter(event => {
        const isOwner = event.ownerId === userId;
        const isMember = event.memberIds && event.memberIds.includes(userId);
        const hasEnded = event.endsAt && new Date(event.endsAt) < currentDate;

        console.log(`Event ${event.id} (${event.name}): owner=${event.ownerId}, userId=${userId}, isOwner=${isOwner}, isMember=${isMember}, public=${event.public}, hasEnded=${hasEnded}`);

        if (!hasEnded) return false; // Only show ended events

        if (isOwner) return true; // Show all owned events that have ended
        if (isMember && !event.public) return true; // Show only private events where user is member that have ended

        return false;
      });

      console.log("Filtered events:", userEvents.length);
      setEvents(userEvents);
    } catch (error) {
      console.warn("Failed to fetch events:", error);
      Alert.alert("Error", "Failed to load events");
    }
  };

  const openEventAlbum = async (event) => {
    setSelectedEvent(event);
    setSelectedPhotoIndex(0); // Start with first photo
    setModalVisible(true);

    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.post(`${API_URL}/event/photos/list`, {
        eventId: event.id
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      setEventPhotos(response.data || []);
    } catch (error) {
      console.error("Failed to load event photos:", error);
      Alert.alert("Error", "Failed to load event photos");
      setEventPhotos([]);
    }
  };

  const closePhotoViewer = () => {
    setSelectedPhotoIndex(null);
    setModalVisible(false);
  };

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          router.replace("/");
          return;
        }

        const response = await axios.post(
          `${API_URL}/profile/get`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!mounted) return;

        const data = response.data || {};
        console.log("Profile data received:", data);
        setUsername(data.username || "");
        setName(data.name || "");
        setBio(data.bio || "");
        setUserId(data.id || data.userId);
        console.log("UserId set to:", data.id || data.userId);

        // Fetch events after getting user profile
        await fetchEvents(token, data.id || data.userId);
      } catch (err) {
        console.warn("Failed to fetch profile:", err);
        Alert.alert("Error", "Failed to load profile data");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, []);

  // Scroll to selected photo when viewer opens
  useEffect(() => {
    if (selectedPhotoIndex !== null && flatListRef.current && eventPhotos.length > 0) {
      setTimeout(() => {
        try {
          flatListRef.current.scrollToIndex({ index: selectedPhotoIndex, animated: false });
        } catch (e) {
          try {
            flatListRef.current.scrollToOffset({
              offset: selectedPhotoIndex * windowWidth,
              animated: false,
            });
          } catch (e2) {}
        }
      }, 50);
    }
  }, [selectedPhotoIndex, eventPhotos.length, windowWidth]);

  return (
    <View style={styles.container}>
      <View style={styles.backgroundWhiteBox}>
      <AppHeader />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 150 }}>
        <View>
          <Image
            source={require("../../assets/profile-icon.png")}
            style={{
              width: 120,
              height: 120,
              borderRadius: 65,
              alignSelf: "center",
            }}
          />
          <Text style={[styles.h2, { textAlign: "center", marginTop: 10 }]}>
            {name || (loading ? "Loading..." : "No name")}
          </Text>
          <Text style={[styles.text, { textAlign: "center", marginBottom: 20 }]}>
            {username || (loading ? "" : "No username")}
          </Text>
          <Text style={[styles.text, { textAlign: "center", marginBottom: 20 }]}>
            {bio || (loading ? "" : "No bio")}
          </Text>
            <TouchableOpacity
                onPress={handleLogout}
                style={[
                    styles.openButton,
                    {
                        marginVertical: 10,
                        alignSelf: "center",
                        width: "80%",
                        height: 50,
                        justifyContent: "center",
                        borderRadius: 10,
                    },
                ]}
            >
                <Text style={[styles.openButtonText, { fontSize: 18, fontWeight: "600" }]}>
                    Logout
                </Text>
            </TouchableOpacity>

            <View style={styles.lineContainer}>
                <View style={styles.line} />
                    <Text style={styles.lineText}>Archive</Text>
                <View style={styles.line} />
            </View>
        </View>
        {events.length > 0 ? (
          <FlatList
            data={events}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            contentContainerStyle={{ paddingHorizontal: 10 }}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => openEventAlbum(item)}
                style={{
                  flex: 1,
                  margin: 5,
                  backgroundColor: "#f9f9f9",
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#eee",
                  maxWidth: (Dimensions.get('window').width - 30) / 2,
                }}
              >
                <Image
                  source={require("../../assets/event_default.jpg")}
                  style={{
                    width: '100%',
                    height: 120,
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8,
                  }}
                  resizeMode="cover"
                />
                <View style={{ padding: 10 }}>
                  <Text style={[styles.h3, { fontSize: 14, marginBottom: 5 }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.text, { color: "#666", fontSize: 11 }]}>
                    Ended: {new Date(item.endsAt).toLocaleDateString()}
                  </Text>
                  <Text style={[styles.text, { color: "#666", fontSize: 11 }]}>
                    {item.ownerId === userId ? "Owner" : "Member"}
                  </Text>
                  <Text style={[styles.text, { color: item.public ? "#4CAF50" : "#FF9500", fontSize: 11 }]}>
                    {item.public ? "Public" : "Private"}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        ) : (
          <Text style={[styles.text, { textAlign: "center", color: "#999" }]}>
            No expired events found
          </Text>
        )}
      </ScrollView>

        {/* Event Photos Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, paddingTop: 50 }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                {selectedEvent?.name || 'Event Photos'}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{ padding: 10 }}
              >
                <Text style={{ color: '#fff', fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            </View>

            {eventPhotos.length > 0 ? (
              <FlatList
                ref={flatListRef}
                data={eventPhotos}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, idx) => String(item.id || idx)}
                getItemLayout={(data, index) => (
                  { length: windowWidth, offset: windowWidth * index, index }
                )}
                renderItem={({ item, index }) => (
                  <View style={{ width: windowWidth, height: windowHeight, justifyContent: 'center', alignItems: 'center' }}>
                    <Image
                      source={{ uri: item.url || item.imageUrl || `${API_URL}/${item.filePath}` }}
                      style={{ width: windowWidth * 0.9, height: windowHeight * 0.8 }}
                      resizeMode="contain"
                    />
                  </View>
                )}
                style={{ flex: 1 }}
                snapToInterval={windowWidth}
                decelerationRate="fast"
                initialNumToRender={1}
                maxToRenderPerBatch={2}
                windowSize={3}
              />
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 16 }}>No photos in this album</Text>
              </View>
            )}
          </View>
        </Modal>
      </View>
    </View>
  );
}
