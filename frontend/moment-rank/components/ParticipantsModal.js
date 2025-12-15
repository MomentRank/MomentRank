import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import BASE_URL from '../Config';
import Style from '../Styles/main';

const API_URL = BASE_URL;

const ParticipantsModal = ({ visible, onClose, eventId, eventName }) => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadParticipants = async () => {
    try {
      // Mock participants data
      setParticipants([
        { id: 1, username: 'john_doe', email: 'john@example.com', isOwner: true },
        { id: 2, username: 'jane_smith', email: 'jane@example.com', isOwner: false },
        { id: 3, username: 'mike_wilson', email: 'mike@example.com', isOwner: false },
      ]);
    } catch (error) {
      console.error('Load participants error:', error);
    }
  };

  const removeParticipant = async (participantId, participantUsername) => {
    Alert.alert(
      "Remove Participant",
      `Are you sure you want to remove ${participantUsername}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              // TODO: Implement actual remove endpoint
              Alert.alert("Success", `${participantUsername} has been removed`);
              loadParticipants(); // Refresh list
            } catch (error) {
              Alert.alert("Error", "Failed to remove participant");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  React.useEffect(() => {
    if (visible) {
      loadParticipants();
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
          <Text style={[Style.h2, { marginBottom: 0 }]}>Participants</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ fontSize: 24, fontWeight: 'bold' }}>×</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ textAlign: 'center', color: '#666', marginBottom: 20 }}>
          {participants.length} participant{participants.length !== 1 ? 's' : ''}
        </Text>

        <FlatList
          data={participants}
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
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', marginRight: 8 }}>
                    {item.username}
                  </Text>
                  {item.isOwner && (
                    <View style={{
                      backgroundColor: '#FF9500',
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 10
                    }}>
                      <Text style={{ color: 'white', fontSize: 10, fontWeight: '600' }}>
                        Owner
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 14, color: '#666' }}>{item.email}</Text>
              </View>
              {!item.isOwner && (
                <TouchableOpacity
                  onPress={() => removeParticipant(item.id, item.username)}
                  disabled={loading}
                  style={{
                    backgroundColor: loading ? '#ccc' : '#FF3B30',
                    paddingHorizontal: 15,
                    paddingVertical: 6,
                    borderRadius: 15
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                    {loading ? 'Removing...' : 'Remove'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', color: '#666', marginTop: 20 }}>
              No participants found
            </Text>
          }
        />
      </View>
    </View>
  );
};

export default ParticipantsModal;