import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, Dimensions, PanResponder, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import BASE_URL from '../Config';
import styles from '../Styles/main';

const API_URL = BASE_URL;
const { width, height } = Dimensions.get('window');

export default function RankingScreen() {
    const router = useRouter();
    const { eventId, eventName } = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const [matchup, setMatchup] = useState(null);
    const [photoA, setPhotoA] = useState(null);
    const [photoB, setPhotoB] = useState(null);
    const [comparing, setComparing] = useState(false);
    const [remainingComparisons, setRemainingComparisons] = useState(null);

    // Swipe gesture state
    const pan = useRef(new Animated.Value(0)).current;

    const handlePanGesture = (gestureState) => {
        const clampedDx = Math.max(-60, Math.min(60, gestureState.dx * 0.4));
        pan.setValue(clampedDx);
    };

    const handlePanRelease = (gestureState) => {
        // Snap to nearest lock point: -60 (left), 0 (center), 60 (right)
        let snapPoint = 0;
        if (gestureState.dx > 90) {
            snapPoint = 60; // Lock right
        } else if (gestureState.dx < -90) {
            snapPoint = -60; // Lock left
        }

        Animated.spring(pan, {
            toValue: snapPoint,
            useNativeDriver: false,
        }).start();
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => !comparing,
            onMoveShouldSetPanResponder: () => !comparing,
            onPanResponderMove: (_, gestureState) => handlePanGesture(gestureState),
            onPanResponderRelease: (_, gestureState) => handlePanRelease(gestureState),
        })
    ).current;

    const sliderPanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => !comparing,
            onMoveShouldSetPanResponder: () => !comparing,
            onPanResponderTerminationRequest: () => false,
            onPanResponderGrant: (evt) => {
                // locationX is relative to the View that has panHandlers (90% of screen minus padding)
                const touchX = evt.nativeEvent.locationX;
                // The actual width of the slider bar itself
                const sliderBarWidth = (width - 40) * 0.9;
                const centerX = sliderBarWidth / 2;
                const offset = touchX - centerX;
                const newValue = Math.max(-60, Math.min(60, -(offset / centerX) * 60));
                pan.setValue(newValue);
            },
            onPanResponderMove: (evt) => {
                const touchX = evt.nativeEvent.locationX;
                const sliderBarWidth = (width - 40) * 0.9;
                const centerX = sliderBarWidth / 2;
                const offset = touchX - centerX;
                const newValue = Math.max(-60, Math.min(60, -(offset / centerX) * 60));
                pan.setValue(newValue);
            },
            onPanResponderRelease: (_, gestureState) => {
                const currentValue = pan._value;
                let snapPoint = 0;
                if (currentValue > 30) {
                    snapPoint = 60;
                } else if (currentValue < -30) {
                    snapPoint = -60;
                }

                Animated.spring(pan, {
                    toValue: snapPoint,
                    useNativeDriver: false,
                }).start();
            },
        })
    ).current;

    // Calculate scale based on pan position
    const leftScale = pan.interpolate({
        inputRange: [-60, 0, 60],
        outputRange: [0.75, 0.9, 1.1],
        extrapolate: 'clamp',
    });

    const rightScale = pan.interpolate({
        inputRange: [-60, 0, 60],
        outputRange: [1.1, 0.9, 0.75],
        extrapolate: 'clamp',
    });

    const leftOpacity = pan.interpolate({
        inputRange: [-60, 0, 60],
        outputRange: [0.5, 1, 1],
        extrapolate: 'clamp',
    });

    const rightOpacity = pan.interpolate({
        inputRange: [-60, 0, 60],
        outputRange: [1, 1, 0.5],
        extrapolate: 'clamp',
    });

    // Translation to move photos toward/away from center
    const leftTranslateX = pan.interpolate({
        inputRange: [-60, 0, 60],
        outputRange: [60, 0, -30],
        extrapolate: 'clamp',
    });

    const rightTranslateX = pan.interpolate({
        inputRange: [-60, 0, 60],
        outputRange: [30, 0, -60],
        extrapolate: 'clamp',
    });

    // Flex values to adjust container sizes
    const leftFlex = pan.interpolate({
        inputRange: [-60, 0, 60],
        outputRange: [0.25, 1, 2.5],
        extrapolate: 'clamp',
    });

    const rightFlex = pan.interpolate({
        inputRange: [-60, 0, 60],
        outputRange: [2.5, 1, 0.25],
        extrapolate: 'clamp',
    });

    // Margins for enlarged sides
    const leftMargin = pan.interpolate({
        inputRange: [-60, 0, 60],
        outputRange: [0, 0, 60],
        extrapolate: 'clamp',
    });

    const rightMargin = pan.interpolate({
        inputRange: [-60, 0, 60],
        outputRange: [60, 0, 0],
        extrapolate: 'clamp',
    });

    useEffect(() => {
        loadNextMatchup();
        loadRemainingComparisons();
    }, []);

    const loadNextMatchup = async () => {
        try {
            setLoading(true);

            const token = await AsyncStorage.getItem('token');
            if (!token) {
                Alert.alert('Error', 'Please login first');
                setLoading(false);
                setPhotoA(null);
                setPhotoB(null);
                return;
            }

            const response = await axios.post(`${API_URL}/ranking/matchup/next`, {
                eventId: parseInt(eventId)
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (response.data) {
                // Check if response indicates no matchups available
                if (response.data.message || response.data.reason) {
                    setPhotoA(null);
                    setPhotoB(null);
                    return;
                }

                // Valid matchup data
                if (response.data.photoA && response.data.photoB) {
                    setMatchup(response.data);
                    setPhotoA(response.data.photoA);
                    setPhotoB(response.data.photoB);
                    // Update remaining comparisons from matchup response
                    if (response.data.remainingInSession !== undefined) {
                        setRemainingComparisons(response.data.remainingInSession);
                    }
                } else {
                    // Invalid data, show leaderboard view
                    setPhotoA(null);
                    setPhotoB(null);
                }
            }
        } catch (error) {
            console.error('Load matchup error:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            // On any error, show leaderboard view instead of closing
            setPhotoA(null);
            setPhotoB(null);
        } finally {
            setLoading(false);
        }
    };

    const loadRemainingComparisons = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            const response = await axios.post(`${API_URL}/ranking/session/remaining`, {
                eventId: parseInt(eventId)
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (response.data && response.data.remainingComparisons !== undefined) {
                setRemainingComparisons(response.data.remainingComparisons);
            }
        } catch (error) {
            console.error('Load remaining comparisons error:', error);
        }
    };

    const handleVote = async (winnerPhotoId, loserPhotoId) => {
        try {
            setComparing(true);

            const token = await AsyncStorage.getItem('token');
            if (!token) {
                Alert.alert('Error', 'Please login first');
                return;
            }

            const compareResponse = await axios.post(`${API_URL}/ranking/compare`, {
                eventId: parseInt(eventId),
                category: matchup?.category ?? 0,
                photoAId: photoA.id,
                photoBId: photoB.id,
                winnerPhotoId: winnerPhotoId
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            // Update remaining comparisons from response
            if (compareResponse.data && compareResponse.data.remainingInSession !== undefined) {
                setRemainingComparisons(compareResponse.data.remainingInSession);

                // Navigate to leaderboard if no votes remaining
                if (compareResponse.data.remainingInSession === 0) {
                    router.push({
                        pathname: '/leaderboard',
                        params: { eventId: eventId.toString(), eventName: eventName }
                    });
                    return;
                }
            }

            // Check if more matchups are available
            if (compareResponse.data && compareResponse.data.moreMatchupsAvailable === false) {
                setPhotoA(null);
                setPhotoB(null);
                return;
            }

            await loadNextMatchup();
        } catch (error) {
            console.error('Vote error:', error);
            Alert.alert('Error', 'Failed to submit vote');
        } finally {
            setComparing(false);
        }
    };

    const handleSkip = async () => {
        try {
            setComparing(true);
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                Alert.alert('Error', 'Please login first');
                return;
            }

            const skipResponse = await axios.post(`${API_URL}/ranking/skip`, {
                eventId: parseInt(eventId),
                category: matchup?.category ?? 0,  // Use category from matchup or default to BestMoment
                photoAId: photoA.id,
                photoBId: photoB.id
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            // Update remaining comparisons from response
            if (skipResponse.data && skipResponse.data.remainingInSession !== undefined) {
                setRemainingComparisons(skipResponse.data.remainingInSession);

                // Navigate to leaderboard if no votes remaining
                if (skipResponse.data.remainingInSession === 0) {
                    router.push({
                        pathname: '/leaderboard',
                        params: { eventId: eventId.toString(), eventName: eventName }
                    });
                    return;
                }
            }

            // Check if more matchups are available
            if (skipResponse.data && skipResponse.data.moreMatchupsAvailable === false) {
                setPhotoA(null);
                setPhotoB(null);
                return;
            }

            await loadNextMatchup();
        } catch (error) {
            console.error('Skip error:', error);
            Alert.alert('Error', 'Failed to skip matchup');
        } finally {
            setComparing(false);
        }
    };

    const handleViewLeaderboard = () => {
        router.push({
            pathname: '/leaderboard',
            params: { eventId: eventId.toString(), eventName: eventName }
        });
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text style={{ marginTop: 20, fontSize: 16, color: '#666' }}>Loading voting matchup...</Text>
            </View>
        );
    }

    if (!photoA || !photoB) {
        router.push({
            pathname: '/leaderboard',
            params: { eventId: eventId.toString(), eventName: eventName }
        });
        return null;
    }

    // Get category name for display
    const getCategoryName = (category) => {
        const categories = {
            0: 'Best Moment',
            1: 'Funniest',
            2: 'Most Beautiful',
            3: 'Most Creative',
            4: 'Most Emotional'
        };
        return categories[category] || 'Best Moment';
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={{ backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
                <Text style={[styles.h2, { marginBottom: 10 }]}>{eventName || 'Event Ranking'}</Text>
                {matchup?.category !== undefined && (
                    <Text style={{ fontSize: 14, color: '#FF9500', fontWeight: '600', marginBottom: 8, textAlign: 'center' }}>
                        Category: {getCategoryName(matchup.category)}
                    </Text>
                )}
                <Text style={[styles.h2, { fontSize: 18, marginBottom: 5 }]}>
                    {matchup?.prompt || 'Which photo is better?'}
                </Text>

            </View>

            <View style={{ flex: 1, flexDirection: 'column', backgroundColor: '#fff' }}>
                <View style={{ flex: 1, flexDirection: 'row' }} {...panResponder.panHandlers}>
                    <Animated.View
                        style={{
                            flex: leftFlex,
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: 10,
                            paddingRight: 15,
                            marginLeft: leftMargin,
                            opacity: leftOpacity,
                            transform: [{ scale: leftScale }, { translateX: leftTranslateX }]
                        }}
                    >
                        <View style={{ width: '100%', aspectRatio: 3 / 4, position: 'relative' }}>
                            <Image
                                source={{ uri: `${API_URL}/${photoA.filePath}` }}
                                style={{ width: '100%', height: '100%', borderRadius: 10 }}
                                resizeMode="cover"
                            />
                            {comparing && (
                                <View style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: 'rgba(0,0,0,0.3)',
                                    borderRadius: 10
                                }} />
                            )}
                        </View>
                    </Animated.View>

                    <View style={{ width: 1, backgroundColor: 'transparent' }} />

                    <Animated.View
                        style={{
                            flex: rightFlex,
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: 10,
                            paddingLeft: 15,
                            marginRight: rightMargin,
                            opacity: rightOpacity,
                            transform: [{ scale: rightScale }, { translateX: rightTranslateX }]
                        }}
                    >
                        <View style={{ width: '100%', aspectRatio: 3 / 4, position: 'relative' }}>
                            <Image
                                source={{ uri: `${API_URL}/${photoB.filePath}` }}
                                style={{ width: '100%', height: '100%', borderRadius: 10 }}
                                resizeMode="cover"
                            />
                            {comparing && (
                                <View style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: 'rgba(0,0,0,0.3)',
                                    borderRadius: 10
                                }} />
                            )}
                        </View>
                    </Animated.View>
                </View>

                {/* Vote buttons */}
                <View style={{ flexDirection: 'row', paddingHorizontal: 15, paddingVertical: 10, gap: 10 }}>
                    <TouchableOpacity
                        style={[styles.openButton, { flex: 1, backgroundColor: '#FF9500' }]}
                        onPress={() => !comparing && handleVote(photoA.id, photoB.id)}
                        disabled={comparing}
                    >
                        <Text style={styles.openButtonText}>Vote Left</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.openButton, { flex: 1, backgroundColor: '#FF9500' }]}
                        onPress={() => !comparing && handleVote(photoB.id, photoA.id)}
                        disabled={comparing}
                    >
                        <Text style={styles.openButtonText}>Vote Right</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Slider indicator */}
            <View style={{ backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 20 }}>
                <View style={{ alignItems: 'center' }}>
                    <View
                        style={{ width: '90%' }}
                        {...sliderPanResponder.panHandlers}
                    >
                        <Text style={{ fontSize: 12, color: '#999', marginBottom: 8, textAlign: 'center', pointerEvents: 'none' }}>Swipe to view better</Text>
                        <View style={{ paddingVertical: 15, pointerEvents: 'none' }}>
                            <View style={{ width: '100%', height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, position: 'relative' }}>
                                <Animated.View
                                    style={{
                                        position: 'absolute',
                                        top: -4,
                                        left: 0,
                                        width: 16,
                                        height: 16,
                                        backgroundColor: '#FF9500',
                                        borderRadius: 8,
                                        transform: [{
                                            translateX: pan.interpolate({
                                                inputRange: [-60, 60],
                                                outputRange: [(width - 40) * 0.9 - 16, 0],
                                                extrapolate: 'clamp',
                                            })
                                        }]
                                    }}
                                />
                            </View>
                        </View>
                        <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', pointerEvents: 'none' }}>
                            <Text style={{ fontSize: 10, color: '#FF9500' }}>Left</Text>
                            <Text style={{ fontSize: 10, color: '#999' }}>Equal</Text>
                            <Text style={{ fontSize: 10, color: '#FF9500' }}>Right</Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={{ backgroundColor: '#fff', padding: 15, borderTopWidth: 1, borderTopColor: '#e0e0e0' }}>
                <TouchableOpacity
                    style={[styles.openButton, { backgroundColor: '#dc3545' }]}
                    onPress={handleSkip}
                    disabled={comparing}
                >
                    <Text style={styles.openButtonText}>Skip</Text>
                </TouchableOpacity>
            </View>

            {comparing && (
                <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={{ color: '#fff', marginTop: 10, fontSize: 16 }}>Submitting vote...</Text>
                </View>
            )}
        </View>
    );
}
