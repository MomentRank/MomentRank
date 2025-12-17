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
  const [activeTab, setActiveTab] = useState("friends"); // friends, received, sent, invites
  const [friends, setFriends] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [eventInvites, setEventInvites] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [respondingId, setRespondingId] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (activeTab === "friends" && searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        searchUsers(searchQuery);
      }, 300); // 300ms debounce

      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery, activeTab]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "No authentication token found");
        return;
      }

      // Load friends and friend requests in parallel
      const [friendsResponse, receivedResponse, sentResponse] = await Promise.all([
        axios.get(`${API_URL}/friends`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/friends/requests/received`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/friends/requests/sent`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setFriends(friendsResponse.data || []);
      setReceivedRequests(receivedResponse.data || []);
      setSentRequests(sentResponse.data || []);
      
      // Load event invites separately with error handling
      try {
        const invitesResponse = await axios.post(
          `${API_URL}/event/invite/list`, 
          { pageNumber: 1, pageSize: 20 }, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        let invitesData = invitesResponse.data;
        console.log('Raw invites response:', invitesData);
        
        if (!Array.isArray(invitesData)) {
          invitesData = invitesData.items || invitesData.invites || [];
        }
        
        console.log('Processed invites data:', invitesData);
        setEventInvites(invitesData);
      } catch (invitesError) {
        console.warn("Could not load event invites:", invitesError.response?.status, invitesError.message);
        // Set empty invites if endpoint doesn't exist or returns error
        setEventInvites([]);
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

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.get(`${API_URL}/profile/search`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { query: query.trim() }
      });
      setSearchResults(response.data || []);
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendFriendRequest = async (userId, username) => {
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.post(
        `${API_URL}/friends/request/send`,
        { receiverId: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert("Success", `Friend request sent to ${username}`);
      // Refresh all data
      loadAllData();
    } catch (error) {
      console.error("Error sending friend request:", error);
      if (error.response?.status === 400) {
        Alert.alert("Error", "Friend request already sent or you're already friends");
      } else {
        Alert.alert("Error", "Failed to send friend request");
      }
    }
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
      loadAllData();
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
      loadAllData();
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
      loadAllData();
    } catch (error) {
      Alert.alert("Error", "Failed to cancel request");
    }
  };

  const handleRespondEventInvite = async (inviteId, accept) => {
    try {
      setRespondingId(inviteId);
      const token = await AsyncStorage.getItem("token");
      await axios.post(
        `${API_URL}/event/invite/respond`,
        { inviteId, accept },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert("Success", accept ? "Invite accepted!" : "Invite declined.");
      setEventInvites(eventInvites.filter(inv => inv.id !== inviteId));
    } catch (error) {
      Alert.alert("Error", "Failed to respond to invite");
    } finally {
      setRespondingId(null);
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
              loadAllData();
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
          backgroundColor: "#ff0000ff",
          paddingHorizontal: 15,
          paddingVertical: 8,
          borderRadius: 5,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEventInviteItem = ({ item }) => (
    <View
      style={{
        backgroundColor: "#f8f8f8",
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        borderLeftWidth: 4,
        borderLeftColor: "#FF9500",
      }}
    >
      <Text style={[styles.text, { fontWeight: "bold", fontSize: 16, marginBottom: 5 }]}>
        {item.event?.name || "Event Invite"}
      </Text>
      {item.sender && (
        <Text style={[styles.text, { color: "#666", fontSize: 12, marginBottom: 3 }]}>
          Invited by: {item.sender.name || item.sender.username || "Unknown"}
        </Text>
      )}
      {item.event?.endsAt && (
        <Text style={[styles.text, { color: "#666", fontSize: 12, marginBottom: 3 }]}>
          Event Date: {new Date(item.event.endsAt).toLocaleDateString()} at {new Date(item.event.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      )}
      {item.event?.public !== undefined && (
        <Text style={[styles.text, { color: item.event.public ? "#4CAF50" : "#FF9500", fontSize: 12, marginBottom: 12 }]}>
          {item.event.public ? "🌍 Public Event" : "🔒 Private Event"}
        </Text>
      )}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <TouchableOpacity
          onPress={() => handleRespondEventInvite(item.id, false)}
          disabled={respondingId === item.id}
          style={{
            flex: 1,
            paddingVertical: 10,
            backgroundColor: respondingId === item.id ? "#ccc" : "#FF3B30",
            borderRadius: 8,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 12 }}>
            {respondingId === item.id ? "..." : "Decline"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleRespondEventInvite(item.id, true)}
          disabled={respondingId === item.id}
          style={{
            flex: 1,
            paddingVertical: 10,
            backgroundColor: respondingId === item.id ? "#ccc" : "#FF9500",
            borderRadius: 8,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 12 }}>
            {respondingId === item.id ? "..." : "Accept"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSearchResultItem = ({ item }) => (
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
        onPress={() => handleSendFriendRequest(item.id || item.userId, item.name || item.username)}
        style={{
          backgroundColor: "#FF9500",
          paddingHorizontal: 15,
          paddingVertical: 8,
          borderRadius: 5,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Add Friend</Text>
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
              placeholder={searchQuery.trim() ? "Searching users..." : "Search friends or find new ones..."}
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
              {activeTab === "friends" && searchQuery.trim() ? "Search Results" : `Friends (${friends.length})`}
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
          <TouchableOpacity
            onPress={() => setActiveTab("invites")}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderBottomWidth: activeTab === "invites" ? 2 : 0,
              borderBottomColor: "#FF9500",
            }}
          >
            <Text
              style={{
                textAlign: "center",
                fontWeight: activeTab === "invites" ? "bold" : "normal",
                color: activeTab === "invites" ? "#FF9500" : "#666",
              }}
            >
              Invites ({eventInvites.length})
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
              activeTab === "friends" && searchQuery.trim()
                ? searchResults
                : activeTab === "friends"
                ? filteredFriends
                : activeTab === "received"
                ? receivedRequests
                : activeTab === "sent"
                ? sentRequests
                : eventInvites
            }
            renderItem={
              activeTab === "friends" && searchQuery.trim()
                ? renderSearchResultItem
                : activeTab === "friends"
                ? renderFriendItem
                : activeTab === "received"
                ? renderReceivedRequestItem
                : activeTab === "sent"
                ? renderSentRequestItem
                : renderEventInviteItem
            }
            keyExtractor={(item, index) =>
              (item.id || item.requestId || item.userId || index).toString()
            }
            contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 10 }}
            ListEmptyComponent={
              <View style={{ padding: 20, alignItems: "center" }}>
                <Text style={[styles.text, { color: "#999" }]}>
                  {activeTab === "friends" && searchQuery.trim()
                    ? isSearching
                      ? "Searching..."
                      : "No users found"
                    : activeTab === "friends"
                    ? "No friends yet"
                    : activeTab === "received"
                    ? "No received requests"
                    : activeTab === "sent"
                    ? "No sent requests"
                    : "No pending event invites"}
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
