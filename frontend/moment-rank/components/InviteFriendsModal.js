import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import BASE_URL from '../Config';
import Style from '../Styles/main';

const API_URL = BASE_URL;

const InviteFriendsModal = ({ visible, onClose, eventId, eventName }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadFriends = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      // Mock friends data for now
      setFriends([
        { id: 1, username: 'john_doe', email: 'john@example.com' },
        { id: 2, username: 'jane_smith', email: 'jane@example.com' },
        { id: 3, username: 'mike_wilson', email: 'mike@example.com' },
      ]);
    } catch (error) {
      console.error('Load friends error:', error);
    }
  };

  const inviteFriend = async (friendId, friendUsername) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert("Error", "Please login first");
        return;
      }

      // TODO: Implement actual invite endpoint
      Alert.alert("Success", `${friendUsername} has been invited to ${eventName}!`);
    } catch (error) {
      console.error('Invite friend error:', error);
      Alert.alert("Error", "Failed to send invitation");
    } finally {
      setLoading(false);
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
          keyExtractor={(item) => item.id.toString()}
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
                disabled={loading}
                style={{
                  backgroundColor: loading ? '#ccc' : '#FF9500',
                  paddingHorizontal: 20,
                  paddingVertical: 8,
                  borderRadius: 20
                }}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>
                  {loading ? 'Inviting...' : 'Invite'}
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