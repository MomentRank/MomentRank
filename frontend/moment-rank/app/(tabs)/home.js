import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import axios from "axios"; // Import axios
import styles from "../../Styles/main";
import AppHeader from "../../components/AppHeader";
import BASE_URL from "../../Config"
import { useFocusEffect } from '@react-navigation/native';

const API_URL = BASE_URL;

const ContentCard = ({ imageSource, name, accesibility, onPress }) => {
    const source = typeof imageSource === "string" ? { uri: imageSource } : imageSource;

    return (
        <View style={styles.contentCard}>
            <Image source={source} style={styles.stockImage} resizeMode="cover" />
            <View style={styles.descriptionLabelContainer}>
                <Text style={styles.descriptionLabel}>{name}</Text>
            </View>
            <View style={styles.descriptionTextContainer}>
                <Text style={styles.descriptionText}>{accesibility ? "Public" : "Private"}</Text>
            </View>
            <View style={styles.openButtonContainer}>
                <TouchableOpacity onPress={onPress} style={styles.openButton} activeOpacity={0.7}>
                    <Text style={styles.openButtonText}>Open</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default function HomeScreen() {
    const router = useRouter();
    const [cardData, setCardData] = useState([]);
    const [loading, setLoading] = useState(true);

    const handleOpen = (cardId) => {
        router.push({
            pathname: "/photo-upload",
            params: { eventId: cardId.toString() },
        });
    };

    const getEvents = async () => {
        try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
            Alert.alert("Error", "Please login first");
            return;
        }

            const response = await axios.post(
            `${API_URL}/event/list`, 
                {
                    includePublic: true, // query parameter
                    pageNumber: 0,
                    pageSize: 32
                }, 
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    timeout: 5000,
                }
            );

            const data = response.data; // Axios already parses JSON
            console.log(data);

            setCardData(data.items);
            setLoading(false);

        } catch (error) {
            console.error("Error fetching events:", error);
        } finally{
            setLoading(false);
        }
    };

    
    useFocusEffect(
    React.useCallback(() => {
        getEvents();
    }, [])
    );

    if (loading) {
        return (
            <ActivityIndicator
                size="large"
                color="#0000ff"
                style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
            />
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.backgroundWhiteBox}>
                <AppHeader />
                <ScrollView
                    style={styles.scrollContainer}
                    contentContainerStyle={styles.scrollContentContainer}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                >
                    {cardData.map((card) => (
                        <ContentCard
                            key={card.id}
                            imageSource={card.imageSource}
                            name={card.name}
                            accesibility={card.public}
                            onPress={() => handleOpen(card.id)}
                        />
                    ))}
                </ScrollView>
            </View>
        </View>
    );
}
