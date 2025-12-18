import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import BASE_URL from '../Config';
import Style from '../Styles/main';

const API_URL = BASE_URL;

const ParticipantsModal = ({ visible, onClose, eventId, eventName, owner, members = [] }) => {
  const [participants, setParticipants] = useState([]);
  const [removingId, setRemovingId] = useState(null);

  const loadParticipants = async () => {
    try {
      // Combine owner and members with owner marked separately
      const allParticipants = [];

      if (owner) {
        allParticipants.push({
          ...owner,
          isOwner: true
        });
      }

      if (Array.isArray(members)) {
        members.forEach(member => {
          allParticipants.push({
            ...member,
            isOwner: false
          });
        });
      }

      setParticipants(allParticipants);
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
              setRemovingId(participantId);
              const token = await AsyncStorage.getItem('token');
              if (!token) {
                Alert.alert("Error", "Please login first");
                return;
              }

              // TODO: Implement actual remove endpoint when available
              // For now, just remove from local state
              setParticipants(participants.filter(p => p.id !== participantId));
            } catch (error) {
              console.error('Remove participant error:', error);
              Alert.alert("Error", "Failed to remove participant");
            } finally {
              setRemovingId(null);
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
                    {item.username || item.name || item.email || "Unknown User"}
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
              </View>
              {!item.isOwner && (
                <TouchableOpacity
                  onPress={() => removeParticipant(item.id, item.username)}
                  disabled={removingId === item.id}
                  style={{
                    backgroundColor: removingId === item.id ? '#ccc' : '#FF3B30',
                    paddingHorizontal: 15,
                    paddingVertical: 6,
                    borderRadius: 15
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                    {removingId === item.id ? 'Removing...' : 'Remove'}
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