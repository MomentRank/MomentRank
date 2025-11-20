import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import styles from "../../Styles/main";
import AppHeader from "../../components/AppHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import BASE_URL from "../../Config";

const API_URL = BASE_URL;

export default function FriendsScreen() {
  const [activeTab, setActiveTab] = useState("friends"); // friends, received, sent
  const [friends, setFriends] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "No authentication token found");
        return;
      }

      if (activeTab === "friends") {
        await loadFriends(token);
      } else if (activeTab === "received") {
        await loadReceivedRequests(token);
      } else if (activeTab === "sent") {
        await loadSentRequests(token);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async (token) => {
    const response = await axios.get(`${API_URL}/friends`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setFriends(response.data || []);
  };

  const loadReceivedRequests = async (token) => {
    const response = await axios.get(`${API_URL}/friends/requests/received`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setReceivedRequests(response.data || []);
  };

  const loadSentRequests = async (token) => {
    const response = await axios.get(`${API_URL}/friends/requests/sent`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setSentRequests(response.data || []);
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.post(
        `${API_URL}/friends/request/respond`,
        { requestId, accept: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert("Success", "Friend request accepted");
      loadData();
    } catch (error) {
      Alert.alert("Error", "Failed to accept request");
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.post(
        `${API_URL}/friends/request/respond`,
        { requestId, accept: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert("Success", "Friend request rejected");
      loadData();
    } catch (error) {
      Alert.alert("Error", "Failed to reject request");
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.post(
        `${API_URL}/friends/request/cancel/${requestId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert("Success", "Friend request cancelled");
      loadData();
    } catch (error) {
      Alert.alert("Error", "Failed to cancel request");
    }
  };

  const handleRemoveFriend = async (friendId) => {
    Alert.alert(
      "Remove Friend",
      "Are you sure you want to remove this friend?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              await axios.post(
                `${API_URL}/friends/remove/${friendId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );
              Alert.alert("Success", "Friend removed");
              loadData();
            } catch (error) {
              Alert.alert("Error", "Failed to remove friend");
            }
          },
        },
      ]
    );
  };

  const filteredFriends = friends.filter((friend) =>
    (friend.name || friend.username || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const renderFriendItem = ({ item }) => (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.text, { fontWeight: "bold" }]}>
          {item.name || item.username || "Unknown"}
        </Text>
        {item.username && (
          <Text style={[styles.text, { color: "#666", fontSize: 12 }]}>
            @{item.username}
          </Text>
        )}
      </View>
      <TouchableOpacity
        onPress={() => handleRemoveFriend(item.id || item.userId)}
        style={{
          backgroundColor: "#ff4444",
          paddingHorizontal: 15,
          paddingVertical: 8,
          borderRadius: 5,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  const renderReceivedRequestItem = ({ item }) => (
    <View
      style={{
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
      }}
    >
      <View style={{ marginBottom: 10 }}>
        <Text style={[styles.text, { fontWeight: "bold" }]}>
          {item.senderName || item.senderUsername || "Unknown"}
        </Text>
        {item.senderUsername && (
          <Text style={[styles.text, { color: "#666", fontSize: 12 }]}>
            @{item.senderUsername}
          </Text>
        )}
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <TouchableOpacity
          onPress={() => handleAcceptRequest(item.id || item.requestId)}
          style={{
            backgroundColor: "#4CAF50",
            paddingHorizontal: 20,
            paddingVertical: 8,
            borderRadius: 5,
            flex: 1,
          }}
        >
          <Text
            style={{ color: "#fff", fontWeight: "bold", textAlign: "center" }}
          >
            Accept
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleRejectRequest(item.id || item.requestId)}
          style={{
            backgroundColor: "#ff4444",
            paddingHorizontal: 20,
            paddingVertical: 8,
            borderRadius: 5,
            flex: 1,
          }}
        >
          <Text
            style={{ color: "#fff", fontWeight: "bold", textAlign: "center" }}
          >
            Reject
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSentRequestItem = ({ item }) => (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.text, { fontWeight: "bold" }]}>
          {item.receiverName || item.receiverUsername || "Unknown"}
        </Text>
        {item.receiverUsername && (
          <Text style={[styles.text, { color: "#666", fontSize: 12 }]}>
            @{item.receiverUsername}
          </Text>
        )}
        <Text style={[styles.text, { color: "#999", fontSize: 11 }]}>
          Pending...
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => handleCancelRequest(item.id || item.requestId)}
        style={{
          backgroundColor: "#888",
          paddingHorizontal: 15,
          paddingVertical: 8,
          borderRadius: 5,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.backgroundWhiteBox}>
        <AppHeader />

        {/* Search Bar */}
        {activeTab === "friends" && (
          <View style={{ padding: 10 }}>
            <TextInput
              style={[styles.input, { width: "100%" }]}
              placeholder="Search for friends..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        )}

        {/* Tabs */}
        <View
          style={{
            flexDirection: "row",
            borderBottomWidth: 1,
            borderBottomColor: "#ddd",
          }}
        >
          <TouchableOpacity
            onPress={() => setActiveTab("friends")}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderBottomWidth: activeTab === "friends" ? 2 : 0,
              borderBottomColor: "#FF9500",
            }}
          >
            <Text
              style={{
                textAlign: "center",
                fontWeight: activeTab === "friends" ? "bold" : "normal",
                color: activeTab === "friends" ? "#FF9500" : "#666",
              }}
            >
              Friends ({friends.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("received")}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderBottomWidth: activeTab === "received" ? 2 : 0,
              borderBottomColor: "#FF9500",
            }}
          >
            <Text
              style={{
                textAlign: "center",
                fontWeight: activeTab === "received" ? "bold" : "normal",
                color: activeTab === "received" ? "#FF9500" : "#666",
              }}
            >
              Received ({receivedRequests.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("sent")}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderBottomWidth: activeTab === "sent" ? 2 : 0,
              borderBottomColor: "#FF9500",
            }}
          >
            <Text
              style={{
                textAlign: "center",
                fontWeight: activeTab === "sent" ? "bold" : "normal",
                color: activeTab === "sent" ? "#FF9500" : "#666",
              }}
            >
              Sent ({sentRequests.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              padding: 20,
            }}
          >
            <ActivityIndicator size="large" color="#FF9500" />
          </View>
        ) : (
          <FlatList
            data={
              activeTab === "friends"
                ? filteredFriends
                : activeTab === "received"
                ? receivedRequests
                : sentRequests
            }
            renderItem={
              activeTab === "friends"
                ? renderFriendItem
                : activeTab === "received"
                ? renderReceivedRequestItem
                : renderSentRequestItem
            }
            keyExtractor={(item, index) =>
              (item.id || item.requestId || index).toString()
            }
            ListEmptyComponent={
              <View style={{ padding: 20, alignItems: "center" }}>
                <Text style={[styles.text, { color: "#999" }]}>
                  {activeTab === "friends"
                    ? "No friends yet"
                    : activeTab === "received"
                    ? "No received requests"
                    : "No sent requests"}
                </Text>
              </View>
            }
            style={{ flex: 1 }}
          />
        )}
      </View>
    </View>
  );
}
