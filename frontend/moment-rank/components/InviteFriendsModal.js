import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import BASE_URL from '../Config';
import Style from '../Styles/main';

const API_URL = BASE_URL;

const InviteFriendsModal = ({ visible, onClose, eventId, eventName, eventMembers = [] }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [invitingId, setInvitingId] = useState(null);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_URL}/friends`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      let allFriends = response.data;
      if (!Array.isArray(allFriends)) {
        allFriends = allFriends.friends || allFriends.data || [];
      }

      // Ensure all friends have valid IDs
      allFriends = allFriends.filter(friend => friend && (friend.id || friend.userId || friend.friendId));

      // Normalize IDs
      allFriends = allFriends.map(friend => ({
        ...friend,
        id: friend.id || friend.userId || friend.friendId
      }));

      // Filter out friends that are already in the event
      const memberIds = new Set(eventMembers.map(m => m.id));
      const availableFriends = allFriends.filter(friend => !memberIds.has(friend.id));

      setFriends(availableFriends);
    } catch (error) {
      console.error('Load friends error:', error.response?.data || error.message);
      Alert.alert("Error", "Failed to load friends");
    } finally {
      setLoading(false);
    }
  };

  const inviteFriend = async (friendId, friendUsername) => {
    try {
      setInvitingId(friendId);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert("Error", "Please login first");
        return;
      }

      await axios.post(
        `${API_URL}/event/invite`,
        {
          eventId: eventId,
          inviteeId: friendId
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Remove invited friend from list
      setFriends(friends.filter(f => f.id !== friendId));
    } catch (error) {
      console.error('Invite friend error:', error);
      Alert.alert("Error", error.response?.data?.message || "Failed to send invitation");
    } finally {
      setInvitingId(null);
    }
  };

  React.useEffect(() => {
    if (visible) {
      loadFriends();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 2000,
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <View style={{
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        margin: 20,
        maxHeight: '80%',
        width: '90%'
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Text style={[Style.h2, { marginBottom: 0 }]}>Invite Friends</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ fontSize: 24, fontWeight: 'bold' }}>×</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={friends}
          keyExtractor={(item, index) => item?.id?.toString() || item?.userId?.toString() || index.toString()}
          renderItem={({ item }) => (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#f8f8f8',
              padding: 15,
              marginBottom: 10,
              borderRadius: 10
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600' }}>{item.username}</Text>
                <Text style={{ fontSize: 14, color: '#666' }}>{item.email}</Text>
              </View>
              <TouchableOpacity
                onPress={() => inviteFriend(item.id, item.username)}
                disabled={invitingId === item.id}
                style={{
                  backgroundColor: invitingId === item.id ? '#ccc' : '#FF9500',
                  paddingHorizontal: 20,
                  paddingVertical: 8,
                  borderRadius: 20
                }}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>
                  {invitingId === item.id ? 'Inviting...' : 'Invite'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', color: '#666', marginTop: 20 }}>
              No friends found
            </Text>
          }
        />
      </View>
    </View>
  );
};

export default InviteFriendsModal;