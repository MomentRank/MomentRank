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

const ContentCard = ({ imageSource, name, accesibility, onPress, eventId, timeLeft }) => {
    const source = imageSource
    ? (typeof imageSource === "string" ? { uri: imageSource } : imageSource)
    : defaultImage;

    const formatTime = (time) => {
        if (!time) return "Ended";

        const totalSeconds = Math.floor(time.total / 1000);
        const totalMinutes = Math.floor(totalSeconds / 60);
        const totalHours = Math.floor(totalMinutes / 60);
        const totalDays = Math.floor(totalHours / 24);
        const totalYears = Math.floor(totalDays / 365);

        if (totalYears > 0) {
            return `${totalYears}y`;
        } else if (totalDays > 0) {
            return `${totalDays}d`;
        } else {
            // Format as hh:mm:ss
            const hours = String(time.hours).padStart(2, '0');
            const minutes = String(time.minutes).padStart(2, '0');
            const seconds = String(time.seconds).padStart(2, '0');
            return `${hours}:${minutes}:${seconds}`;
        }
    };

    return (
        <View style={styles.contentCard}>
            <Image source={source} style={styles.stockImage} resizeMode="cover" />
            <View style={[styles.titleRow, {
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 5
            }]}>
                <View style={[styles.descriptionLabelContainer, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.descriptionLabel} numberOfLines={1} ellipsizeMode="tail">{name}</Text>
                </View>
                <View style={[styles.timerBadge, {
                    backgroundColor: '#00cc14ff',
                    borderRadius: 12,
                    paddingHorizontal: 6,
                    opacity:0.8,
                    marginRight:10,
                    paddingVertical: 2,
                    borderWidth: 1,
                    borderColor: '#00cc14ff',
                    minWidth: 50
                }]}>
                    <Text style={[styles.timerText, {
                        fontSize: 8,
                        fontWeight: 'bold',
                        color: '#fff',
                        textAlign: 'center',
                        marginBottom: 1
                    }]}>
                        Ends in
                    </Text>
                    <Text style={[styles.timerText, {
                        fontSize: 10,
                        fontWeight: 'bold',
                        color: '#fff',
                        textAlign: 'center'
                    }]}>
                        {formatTime(timeLeft)}
                    </Text>
                </View>
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
    const [timeLeft, setTimeLeft] = useState({});

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
            endsAt: item.endsAt,
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

    // Timer effect to update countdowns
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const updatedTimeLeft = {};

            cardData.forEach(event => {
                if (event.endsAt) {
                    const endTime = new Date(event.endsAt).getTime();
                    const distance = endTime - now;

                    if (distance > 0) {
                        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                        updatedTimeLeft[event.id] = {
                            days,
                            hours,
                            minutes,
                            seconds,
                            total: distance
                        };
                    } else {
                        updatedTimeLeft[event.id] = null; // Event has ended
                    }
                }
            });

            setTimeLeft(updatedTimeLeft);
        }, 1000);

        return () => clearInterval(interval);
    }, [cardData]);

    if (loading) {
        return (
            <ActivityIndicator
                size="large"
                color="#0000ff"
                style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
            />
        );
    }

    // FILTERING LOGIC - exclude events that have already ended
    const currentEvents = cardData.filter(event => {
        if (!event.endsAt) return true; // Include events without end date
        const endTime = new Date(event.endsAt).getTime();
        const now = new Date().getTime();
        return endTime > now; // Only include events that haven't ended yet
    });

    const privateEvents = currentEvents.filter(e => !e.public);
    const publicEvents = currentEvents.filter(e => e.public);

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
                                eventId={card.id}
                                timeLeft={timeLeft[card.id]}
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
                                eventId={card.id}
                                timeLeft={timeLeft[card.id]}
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
