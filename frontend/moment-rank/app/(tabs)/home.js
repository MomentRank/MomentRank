import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import axios from "axios";
import styles from "../../Styles/main";
import AppHeader from "../../components/AppHeader";
import BASE_URL from "../../Config";
import { useFocusEffect } from '@react-navigation/native';
import defaultImage from "../../assets/event_default.jpg";

const API_URL = BASE_URL;

const ContentCard = ({ imageSource, name, accesibility, onPress }) => {
    const source = imageSource 
    ? (typeof imageSource === "string" ? { uri: imageSource } : imageSource)
    : defaultImage;

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

    const handleCreate = () => {
        router.push("/create-event");
    };

    const getEvents = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                Alert.alert("Error", "Please login first");
                return;
            }

    const response = await axios.post(
            `${API_URL}/event/list`,
            {
                "includePublic": true
            },
            
            {
                headers: { 
                    Authorization: `Bearer ${token}` 
                },
                timeout: 5000,
            }
        );
        const items = response.data ?? [];

        const structuredItems = items.map(item => ({
            id: item.id,
            name: item.name,
            public: item.public,
            imageSource: item.imageSource || undefined,
        }));

        setCardData(structuredItems); 
        setLoading(false);

        } catch (error) {
            console.error("Error fetching events:", error);
            setCardData([]);
        } 
        finally {
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

    // FILTERING LOGIC
    const privateEvents = cardData.filter(e => !e.public);
    const publicEvents = cardData.filter(e => e.public);

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

                    {/* CREATE EVENT SECTION */}
                    <View style={styles.lineContainer}>
                        <View style={styles.line} />
                            <Text style={styles.lineText}>Create Your Event</Text>
                        <View style={styles.line} />
                    </View>

                    <TouchableOpacity
                        onPress={handleCreate}
                        style={[
                            styles.openButton,
                            {
                                marginVertical: 10,
                                alignSelf: "center",
                                width: "80%",       // makes the button wider
                                height: 50,         // increases height
                                justifyContent: "center",
                                borderRadius: 10,   // keeps rounded corners proportional
                            },
                        ]}
                    >
                        <Text style={[styles.openButtonText, { fontSize: 18, fontWeight: "600" }]}>
                            Create
                        </Text>
                    </TouchableOpacity>


                    {/* PRIVATE EVENTS SECTION */}
                    <View style={styles.lineContainer}>
                        <View style={styles.line} />
                            <Text style={styles.lineText}>Private Events</Text>
                        <View style={styles.line} />
                    </View>

                    {privateEvents.length > 0 ? (
                        privateEvents.map(card => (
                            <ContentCard
                                key={card.id}
                                imageSource={card.imageSource}
                                name={card.name}
                                accesibility={card.public}
                                onPress={() => handleOpen(card.id)}
                            />
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No private events</Text>
                    )}

                    {/* PUBLIC EVENTS SECTION */}
                    <View style={styles.lineContainer}>
                        <View style={styles.line} />
                            <Text style={styles.lineText}>Public Events</Text>
                        <View style={styles.line} />
                    </View>

                    {publicEvents.length > 0 ? (
                        publicEvents.map(card => (
                            <ContentCard
                                key={card.id}
                                imageSource={card.imageSource}
                                name={card.name}
                                accesibility={card.public}
                                onPress={() => handleOpen(card.id)}
                            />
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No public events</Text>
                    )}

                </ScrollView>
            </View>
        </View>
    );
}
