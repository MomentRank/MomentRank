import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import axios from "axios"; // Import axios
import styles from "../../Styles/main";
import AppHeader from "../../components/AppHeader";
import API_URL from "../../Config"

const ContentCard = ({ imageSource, description, onPress }) => {
    const source = typeof imageSource === "string" ? { uri: imageSource } : imageSource;

    return (
        <View style={styles.contentCard}>
            <Image source={source} style={styles.stockImage} resizeMode="cover" />
            <View style={styles.descriptionLabelContainer}>
                <Text style={styles.descriptionLabel}>Description</Text>
            </View>
            <View style={styles.descriptionTextContainer}>
                <Text style={styles.descriptionText}>{description}</Text>
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

            const response = await axios.post(
                `${API_URL}/event/list`, // URL
                null, // POST body (null because your API doesn’t expect a body)
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 5000, // optional
                    params: {
                        includeOwned: true,  // optional query parameters
                        statusFilter: 10
                    }
                }
            );

            const data = response.data; // Axios already parses JSON
            console.log(data);

        } catch (error) {
            console.error("Error fetching events:", error);
        } finally{
            setLoading(false);
        }
    };

    useEffect(() => {
        getEvents();
    }, []);

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
                            description={card.description}
                            onPress={() => handleOpen(card.id)}
                        />
                    ))}
                </ScrollView>
            </View>
        </View>
    );
}
