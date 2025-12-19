import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, FlatList, ActivityIndicator, Alert, Dimensions, Modal, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import axios from 'axios';
import BASE_URL from '../Config';
import styles from '../Styles/main';

const API_URL = BASE_URL;
const { width, height } = Dimensions.get('window');

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
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [photos, setPhotos] = useState([]);
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);
    const [aspectRatios, setAspectRatios] = useState({});
    const flatListRef = useRef(null);

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

    const loadPhotos = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                Alert.alert('Error', 'Please login first');
                return;
            }

            const response = await axios.post(`${API_URL}/event/photos/list`, {
                eventId: parseInt(eventId)
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (response.data) {
                setPhotos(response.data);
            }
        } catch (error) {
            console.error('Load photos error:', error);
            Alert.alert('Error', 'Failed to load photos');
        }
    };

    const handleViewPhotos = () => {
        loadPhotos();
        setShowPhotoModal(true);
    };

    const openPhotoViewer = (index) => {
        setSelectedPhotoIndex(index);
    };

    const closePhotoViewer = () => {
        setSelectedPhotoIndex(null);
    };

    const renderFullScreenItem = ({ item: photo, index: idx }) => {
        const ratio = aspectRatios[idx];
        const maxBoxWidth = width * 0.95;
        const maxBoxHeight = height * 0.95;
        const boxWidth = Math.min(maxBoxWidth, (maxBoxHeight * 3) / 4);
        const boxHeight = (boxWidth * 4) / 3;

        let imageHeight;
        if (ratio) {
            imageHeight = Math.min(boxHeight, boxWidth / ratio);
        } else {
            imageHeight = boxHeight * 0.95;
        }

        return (
            <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ width: boxWidth, height: boxHeight, backgroundColor: 'black', borderRadius: 4, position: 'absolute' }} />
                <Image
                    source={{ uri: `${API_URL}/${photo.filePath}` }}
                    style={{ width: boxWidth, height: imageHeight }}
                    resizeMode="contain"
                />
            </View>
        );
    };

    useEffect(() => {
        if (selectedPhotoIndex !== null && flatListRef.current) {
            setTimeout(() => {
                try {
                    flatListRef.current.scrollToIndex({ index: selectedPhotoIndex, animated: false });
                } catch (e) {
                    try {
                        flatListRef.current.scrollToOffset({ offset: selectedPhotoIndex * width, animated: false });
                    } catch (e2) {
                        // ignore
                    }
                }
            }, 50);
        }
    }, [selectedPhotoIndex]);

    useEffect(() => {
        if (selectedPhotoIndex !== null && photos[selectedPhotoIndex]) {
            const uri = `${API_URL}/${photos[selectedPhotoIndex].filePath}`;
            if (!aspectRatios[selectedPhotoIndex]) {
                Image.getSize(uri, (w, h) => {
                    setAspectRatios(prev => ({ ...prev, [selectedPhotoIndex]: w / h }));
                }, (err) => {
                    setAspectRatios(prev => ({ ...prev, [selectedPhotoIndex]: 1.5 }));
                });
            }
        }
    }, [selectedPhotoIndex, photos]);

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

            if (response.data && response.data.rankings && Array.isArray(response.data.rankings)) {
                setLeaderboards(prev => ({ ...prev, [categoryId]: response.data.rankings }));
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
        // Use rank from API if available, otherwise use index
        const displayRank = item.rank || (idx + 1);
        // Calculate losses from comparison count and win count
        const losses = (item.comparisonCount || 0) - (item.winCount || 0);

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
                        {displayRank}
                    </Text>
                </View>

                <Image
                    source={{ uri: `${API_URL}/${item.filePath}` }}
                    style={{ width: 60, height: 80, borderRadius: 6, marginRight: 12 }}
                    resizeMode="cover"
                />

                <View style={{ flex: 1 }}>
                    <Text style={[styles.text, { fontWeight: 'bold', marginBottom: 4 }]}>
                        {item.uploaderUsername || 'Unknown'}
                    </Text>
                    {item.caption && (
                        <Text style={[styles.text, { fontSize: 11, color: '#888', marginBottom: 4 }]} numberOfLines={1}>
                            {item.caption}
                        </Text>
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Text style={[styles.text, { fontSize: 12, color: '#666', marginRight: 8 }]}>
                            ELO: {(item.eloScore || 0).toFixed(1)}
                        </Text>
                        <Text style={[styles.text, { fontSize: 12, color: '#999', marginRight: 8 }]}>
                            {item.winCount || 0}W / {losses}L
                        </Text>
                        {item.winRate !== undefined && (
                            <Text style={[styles.text, { fontSize: 12, color: '#28a745' }]}>
                                {(item.winRate * 100).toFixed(0)}%
                            </Text>
                        )}
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
                keyExtractor={(item, index) => `${item.photoId}-${index}`}
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
            <View style={{ alignItems: 'center', marginTop: 30, marginBottom: 50 }}>
                <TouchableOpacity
                    onPress={handleViewPhotos}
                    style={{
                        backgroundColor: '#FF9500',
                        paddingHorizontal: 20,
                        paddingVertical: 10,
                        borderRadius: 20,
                    }}
                >
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>View Photos</Text>
                </TouchableOpacity>
            </View>

            {/* Photo Viewer Modal */}
            <Modal
                visible={showPhotoModal}
                animationType="slide"
                onRequestClose={() => setShowPhotoModal(false)}
            >
                <View style={{ flex: 1, backgroundColor: '#FFD280' }}>
                    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 50, paddingBottom: 50, marginBottom: '10%', marginTop: '12.4%', marginHorizontal: '1.5%', flex: 1 }}>
                        {/* Header */}
                        <View style={{ backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
                            <TouchableOpacity onPress={() => setShowPhotoModal(false)} style={{ marginBottom: 10 }}>
                                <Text style={{ fontSize: 16, color: '#FF9500' }}>← Back to Leaderboard</Text>
                            </TouchableOpacity>
                            <Text style={[styles.h2, { marginBottom: 5, textAlign: 'center' }]}>{eventName || 'Event'} Photos</Text>
                        </View>

                        {/* Photos Grid */}
                        <ScrollView contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 10, paddingBottom: 100 }}>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                {photos.map((photo, idx) => (
                                    <View key={`${photo.id}-${idx}`} style={{ width: '48%', marginBottom: 15 }}>
                                        <TouchableOpacity onPress={() => openPhotoViewer(idx)}>
                                            <Image
                                                source={{ uri: `${API_URL}/${photo.filePath}` }}
                                                style={{ width: '100%', height: 200, borderRadius: 8 }}
                                                resizeMode="cover"
                                            />
                                        </TouchableOpacity>
                                        <Text style={{ fontSize: 12, marginTop: 8, color: '#666' }}>
                                            {photo.caption || 'No caption'}
                                        </Text>
                                        <Text style={{ fontSize: 10, color: '#999' }}>
                                            by {photo.uploadedByUsername}
                                        </Text>
                                    </View>
                                ))}
                                {photos.length === 0 && (
                                    <View style={{ width: '100%', alignItems: 'center', marginTop: 50 }}>
                                        <Text style={{ fontSize: 16, color: '#999' }}>No photos uploaded yet</Text>
                                    </View>
                                )}
                            </View>
                        </ScrollView>

                        {/* Full Screen Photo Viewer */}
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
                                            { length: width, offset: width * index, index }
                                        )}
                                        initialScrollIndex={selectedPhotoIndex}
                                        renderItem={renderFullScreenItem}
                                        style={{ flex: 1 }}
                                        contentContainerStyle={{ height }}
                                        snapToInterval={width}
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
                    </View>
                </View>
            </Modal>
        </View>
    );
}
