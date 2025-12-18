import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, FlatList, ActivityIndicator, Alert, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import axios from 'axios';
import BASE_URL from '../Config';
import styles from '../Styles/main';

const API_URL = BASE_URL;
const { width } = Dimensions.get('window');

export default function LeaderboardScreen() {
    const router = useRouter();
    const { eventId, eventName } = useLocalSearchParams();
    const [index, setIndex] = useState(0);
    const [leaderboards, setLeaderboards] = useState({
        0: [], 1: [], 2: [], 3: [], 4: []
    });
    const [loading, setLoading] = useState({
        0: true, 1: false, 2: false, 3: false, 4: false
    });

    const [routes] = useState([
        { key: '0', title: 'Best Moment' },
        { key: '1', title: 'Funniest' },
        { key: '2', title: 'Beautiful' },
        { key: '3', title: 'Creative' },
        { key: '4', title: 'Emotional' },
    ]);

    useEffect(() => {
        loadLeaderboard(index);
    }, [index]);

    useEffect(() => {
        loadLeaderboard(0);
    }, []);

    const loadLeaderboard = async (categoryId) => {
        if (leaderboards[categoryId].length > 0) return;

        try {
            setLoading(prev => ({ ...prev, [categoryId]: true }));
            
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                Alert.alert('Error', 'Please login first');
                router.back();
                return;
            }

            const response = await axios.post(`${API_URL}/ranking/leaderboard`, {
                eventId: parseInt(eventId),
                category: categoryId,
                topN: 50
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (response.data && Array.isArray(response.data)) {
                setLeaderboards(prev => ({ ...prev, [categoryId]: response.data }));
            }
        } catch (error) {
            console.error('Load leaderboard error:', error);
            Alert.alert('Error', 'Failed to load leaderboard');
        } finally {
            setLoading(prev => ({ ...prev, [categoryId]: false }));
        }
    };

    const renderLeaderboardItem = ({ item, index: idx }) => {
        const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
        const medal = idx < 3 ? medalColors[idx] : null;

        return (
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#fff',
                padding: 15,
                marginBottom: 8,
                borderBottomWidth: 1,
                borderBottomColor: '#eee',
            }}>
                <View style={{
                    width: 35,
                    height: 35,
                    borderRadius: 17.5,
                    backgroundColor: medal || '#f0f0f0',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12
                }}>
                    <Text style={{
                        fontSize: 16,
                        fontWeight: 'bold',
                        color: medal ? '#fff' : '#666'
                    }}>
                        {idx + 1}
                    </Text>
                </View>

                <Image
                    source={{ uri: `${API_URL}/${item.photo.filePath}` }}
                    style={{ width: 60, height: 80, borderRadius: 6, marginRight: 12 }}
                    resizeMode="cover"
                />

                <View style={{ flex: 1 }}>
                    <Text style={[styles.text, { fontWeight: 'bold', marginBottom: 4 }]}>
                        {item.photo.uploaderUsername || 'Unknown'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.text, { fontSize: 12, color: '#666', marginRight: 8 }]}>
                            Score: {item.score.toFixed(2)}
                        </Text>
                        <Text style={[styles.text, { fontSize: 12, color: '#999' }]}>
                            {item.wins}W / {item.losses}L
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    const renderScene = ({ route }) => {
        const categoryId = parseInt(route.key);
        const data = leaderboards[categoryId] || [];
        const isLoading = loading[categoryId];

        if (isLoading) {
            return (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
                    <ActivityIndicator size="large" color="#FF9500" />
                    <Text style={{ marginTop: 20, fontSize: 16, color: '#666' }}>Loading...</Text>
                </View>
            );
        }

        return (
            <FlatList
                data={data}
                renderItem={renderLeaderboardItem}
                keyExtractor={(item, index) => `${item.photo.id}-${index}`}
                contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 10 }}
                ListEmptyComponent={
                    <View style={{ alignItems: 'center', marginTop: 50, padding: 20 }}>
                        <Text style={{ fontSize: 16, color: '#999' }}>No rankings available yet</Text>
                        <Text style={{ fontSize: 14, color: '#999', marginTop: 10, textAlign: 'center' }}>
                            Photos need more votes to appear here
                        </Text>
                    </View>
                }
                style={{ backgroundColor: '#fff' }}
            />
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={{ backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10 }}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 10 }}>
                    <Text style={{ fontSize: 16, color: '#FF9500' }}>← Back to Event</Text>
                </TouchableOpacity>
                <Text style={[styles.h2, { marginBottom: 5 }]}>{eventName || 'Event'} Leaderboard</Text>
            </View>

            <TabView
                navigationState={{ index, routes }}
                renderScene={renderScene}
                onIndexChange={setIndex}
                initialLayout={{ width }}
                renderTabBar={props => (
                    <TabBar
                        {...props}
                        scrollEnabled
                        indicatorStyle={{ backgroundColor: '#FF9500', height: 2 }}
                        style={{ backgroundColor: '#fff', elevation: 0, shadowOpacity: 0 }}
                        tabStyle={{ width: 'auto', minWidth: 100 }}
                        labelStyle={{ fontSize: 13, fontWeight: '600', textTransform: 'none' }}
                        activeColor="#FF9500"
                        inactiveColor="#666"
                    />
                )}
            />
        </View>
    );
}
