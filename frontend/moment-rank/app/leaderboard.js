import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, FlatList, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import BASE_URL from '../Config';
import styles from '../Styles/main';

const API_URL = BASE_URL;

export default function LeaderboardScreen() {
    const router = useRouter();
    const { eventId, eventName } = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const [leaderboard, setLeaderboard] = useState([]);
    const [category, setCategory] = useState(0);

    const categories = [
        { id: 0, name: 'Overall', label: 'Overall Ranking' },
        { id: 1, name: 'Funny', label: 'Funniest' },
        { id: 2, name: 'Creative', label: 'Most Creative' },
        { id: 3, name: 'Aesthetic', label: 'Most Aesthetic' },
    ];

    useEffect(() => {
        loadLeaderboard();
    }, [category]);

    const loadLeaderboard = async () => {
        try {
            setLoading(true);
            
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                Alert.alert('Error', 'Please login first');
                router.back();
                return;
            }

            const response = await axios.post(`${API_URL}/ranking/leaderboard`, {
                eventId: parseInt(eventId),
                category: category,
                topN: 50
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (response.data && Array.isArray(response.data)) {
                setLeaderboard(response.data);
            }
        } catch (error) {
            console.error('Load leaderboard error:', error);
            Alert.alert('Error', 'Failed to load leaderboard');
        } finally {
            setLoading(false);
        }
    };

    const renderLeaderboardItem = ({ item, index }) => {
        const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
        const medal = index < 3 ? medalColors[index] : null;

        return (
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#fff',
                padding: 15,
                marginBottom: 10,
                borderRadius: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
            }}>
                <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: medal || '#f0f0f0',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 15
                }}>
                    <Text style={{
                        fontSize: 18,
                        fontWeight: 'bold',
                        color: medal ? '#fff' : '#666'
                    }}>
                        {index + 1}
                    </Text>
                </View>

                <Image
                    source={{ uri: `${API_URL}/${item.photo.filePath}` }}
                    style={{ width: 80, height: 80, borderRadius: 8, marginRight: 15 }}
                    resizeMode="cover"
                />

                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 5 }}>
                        By: {item.photo.uploaderUsername || 'Unknown'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, color: '#666', marginRight: 10 }}>
                            Score: {item.score.toFixed(2)}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#999' }}>
                            Wins: {item.wins} | Losses: {item.losses}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: '#f5f5f5' }]}>
            <View style={{ backgroundColor: '#fff', padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 10 }}>
                    <Text style={{ fontSize: 16, color: '#007bff' }}>← Back</Text>
                </TouchableOpacity>
                <Text style={[styles.h2, { marginBottom: 10 }]}>{eventName || 'Event'} Leaderboard</Text>
                
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
                    {categories.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            onPress={() => setCategory(cat.id)}
                            style={{
                                backgroundColor: category === cat.id ? '#007bff' : '#e0e0e0',
                                paddingHorizontal: 15,
                                paddingVertical: 8,
                                borderRadius: 20,
                                marginRight: 10,
                                marginBottom: 10
                            }}
                        >
                            <Text style={{
                                color: category === cat.id ? '#fff' : '#666',
                                fontSize: 12,
                                fontWeight: '600'
                            }}>
                                {cat.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#007bff" />
                    <Text style={{ marginTop: 20, fontSize: 14, color: '#666' }}>Loading leaderboard...</Text>
                </View>
            ) : (
                <FlatList
                    data={leaderboard}
                    renderItem={renderLeaderboardItem}
                    keyExtractor={(item, index) => `${item.photo.id}-${index}`}
                    contentContainerStyle={{ padding: 20 }}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 50 }}>
                            <Text style={{ fontSize: 16, color: '#666' }}>No rankings available yet</Text>
                            <Text style={{ fontSize: 14, color: '#999', marginTop: 10 }}>
                                Photos need more votes to appear here
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}
