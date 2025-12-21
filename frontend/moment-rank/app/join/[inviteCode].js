import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import BASE_URL from '../../Config';
import styles from '../../Styles/main';

const API_URL = BASE_URL;

export default function JoinEventScreen() {
    const router = useRouter();
    const { inviteCode } = useLocalSearchParams();
    const [status, setStatus] = useState('joining'); // joining, success, error

    useEffect(() => {
        handleJoinEvent();
    }, []);

    const handleJoinEvent = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                Alert.alert('Error', 'Please log in first', [
                    { text: 'OK', onPress: () => router.replace('/') }
                ]);
                return;
            }

            await axios.post(
                `${API_URL}/event/join-via-code`,
                { inviteCode: inviteCode },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            setStatus('success');
            Alert.alert('Success', 'You have joined the event!', [
                { text: 'OK', onPress: () => router.replace('/(tabs)/home') }
            ]);
        } catch (error) {
            console.error('Join via code error:', error);
            setStatus('error');
            
            let errorMessage = 'Failed to join event';
            if (error.response?.status === 409) {
                errorMessage = "You're already a member of this event or the code is invalid";
            } else if (error.response?.status === 404) {
                errorMessage = 'Invalid invite code';
            }

            Alert.alert('Error', errorMessage, [
                { text: 'OK', onPress: () => router.replace('/(tabs)/home') }
            ]);
        }
    };

    return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color="#FF9500" />
            <Text style={[styles.text, { marginTop: 20, fontSize: 18 }]}>
                {status === 'joining' ? 'Joining event...' : status === 'success' ? 'Success!' : 'Error'}
            </Text>
        </View>
    );
}
