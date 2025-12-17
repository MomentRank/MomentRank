import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, Dimensions } from 'react-native';
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
                router.back();
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
                setMatchup(response.data);
                setPhotoA(response.data.photoA);
                setPhotoB(response.data.photoB);
            }
        } catch (error) {
            console.error('Load matchup error:', error);
            if (error.response?.status === 404) {
                Alert.alert('Voting Complete', 'You have voted on all available matchups!', [
                    { text: 'View Leaderboard', onPress: () => router.push({ pathname: '/leaderboard', params: { eventId } }) },
                    { text: 'Go Back', onPress: () => router.back() }
                ]);
            } else {
                Alert.alert('Error', 'Failed to load voting matchup');
            }
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

            if (response.data !== undefined) {
                setRemainingComparisons(response.data);
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

            await axios.post(`${API_URL}/ranking/compare`, {
                eventId: parseInt(eventId),
                winnerPhotoId: winnerPhotoId,
                loserPhotoId: loserPhotoId
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            await loadRemainingComparisons();
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

            await axios.post(`${API_URL}/ranking/skip`, {
                eventId: parseInt(eventId),
                photoAId: photoA.id,
                photoBId: photoB.id
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

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
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>No More Matchups</Text>
                <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 30 }}>
                    You've voted on all available photo matchups!
                </Text>
                <TouchableOpacity 
                    style={[styles.openButton, { width: 200 }]}
                    onPress={handleViewLeaderboard}
                >
                    <Text style={styles.openButtonText}>View Leaderboard</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.openButton, { width: 200, backgroundColor: '#808080', marginTop: 10 }]}
                    onPress={() => router.back()}
                >
                    <Text style={styles.openButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={{ backgroundColor: '#fff', padding: 20, paddingTop: 60 }}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 10 }}>
                    <Text style={{ fontSize: 16, color: '#007bff' }}>← Back</Text>
                </TouchableOpacity>
                <Text style={[styles.h2, { marginBottom: 5 }]}>{eventName || 'Event Ranking'}</Text>
                <Text style={{ fontSize: 14, color: '#666', marginBottom: 10 }}>Which photo is better?</Text>
                {remainingComparisons !== null && (
                    <Text style={{ fontSize: 12, color: '#999' }}>
                        Remaining votes: {remainingComparisons}
                    </Text>
                )}
            </View>

            <View style={{ flex: 1, flexDirection: 'row' }}>
                <TouchableOpacity 
                    style={{ flex: 1, position: 'relative' }}
                    onPress={() => !comparing && handleVote(photoA.id, photoB.id)}
                    disabled={comparing}
                    activeOpacity={0.7}
                >
                    <Image 
                        source={{ uri: `${API_URL}/${photoA.filePath}` }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                    />
                    <View style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        right: 0, 
                        bottom: 0,
                        backgroundColor: comparing ? 'rgba(0,0,0,0.3)' : 'transparent',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        {!comparing && (
                            <View style={{ 
                                backgroundColor: 'rgba(0,123,255,0.9)', 
                                paddingHorizontal: 20, 
                                paddingVertical: 10, 
                                borderRadius: 20 
                            }}>
                                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                                    Vote
                                </Text>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>

                <View style={{ width: 2, backgroundColor: '#fff' }} />

                <TouchableOpacity 
                    style={{ flex: 1, position: 'relative' }}
                    onPress={() => !comparing && handleVote(photoB.id, photoA.id)}
                    disabled={comparing}
                    activeOpacity={0.7}
                >
                    <Image 
                        source={{ uri: `${API_URL}/${photoB.filePath}` }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                    />
                    <View style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        right: 0, 
                        bottom: 0,
                        backgroundColor: comparing ? 'rgba(0,0,0,0.3)' : 'transparent',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        {!comparing && (
                            <View style={{ 
                                backgroundColor: 'rgba(0,123,255,0.9)', 
                                paddingHorizontal: 20, 
                                paddingVertical: 10, 
                                borderRadius: 20 
                            }}>
                                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                                    Vote
                                </Text>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            </View>

            <View style={{ backgroundColor: '#fff', padding: 20, flexDirection: 'row', justifyContent: 'space-between' }}>
                <TouchableOpacity 
                    style={[styles.openButton, { flex: 1, marginRight: 10, backgroundColor: '#6c757d' }]}
                    onPress={handleSkip}
                    disabled={comparing}
                >
                    <Text style={styles.openButtonText}>Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.openButton, { flex: 1, backgroundColor: '#9C27B0' }]}
                    onPress={handleViewLeaderboard}
                    disabled={comparing}
                >
                    <Text style={styles.openButtonText}>Leaderboard</Text>
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
