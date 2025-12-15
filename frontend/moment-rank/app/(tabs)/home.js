import React, { useEffect, useState, useRef } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, Dimensions } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import axios from "axios";
import styles from "../../Styles/main";
import AppHeader from "../../components/AppHeader";
import BASE_URL from "../../Config";
import { useFocusEffect } from '@react-navigation/native';
import defaultImage from "../../assets/event_default.jpg";

const API_URL = BASE_URL;
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const ContentCard = ({ imageSource, name, accessibility, onPress, eventId, timeLeft }) => {
    const source = imageSource
    ? (typeof imageSource === "string" ? { uri: imageSource } : defaultImage)
    : defaultImage;

    const formatTime = (time) => {
        if (!time || time.total <= 0) return "Ended";

        if (time.total < 0) {
            return "Recently Ended";
        }

        const totalSeconds = Math.floor(time.total / 1000);
        const totalMinutes = Math.floor(totalSeconds / 60);
        const totalHours = Math.floor(totalMinutes / 60);
        const totalDays = Math.floor(totalHours / 24);

        if (totalDays > 0) {
            return `${totalDays}d`;
        } else {
            const hours = String(time.hours).padStart(2, '0');
            const minutes = String(time.minutes).padStart(2, '0');
            const seconds = String(time.seconds).padStart(2, '0');
            return `${hours}:${minutes}:${seconds}`;
        }
    };
    
    const isEnded = !timeLeft || timeLeft.total <= 0;
    
    let badgeColor = isEnded ? '#cc0000ff' : '#00cc14ff'; 

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
                    backgroundColor: badgeColor,
                    borderRadius: 12,
                    paddingHorizontal: 6,
                    opacity: 0.8,
                    marginRight: 10,
                    paddingVertical: 2,
                    borderWidth: 1,
                    borderColor: badgeColor,
                    minWidth: 50
                }]}>
                    <Text style={[styles.timerText, {
                        fontSize: 8,
                        fontWeight: 'bold',
                        color: '#fff',
                        textAlign: 'center',
                        marginBottom: 1
                    }]}>
                        {isEnded ? "Status" : "Ends in"}
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
                <Text style={styles.descriptionText}>{accessibility ? "Public" : "Private"}</Text>
            </View>
            <View style={styles.openButtonContainer}>
                <TouchableOpacity 
                    onPress={onPress} 
                    style={[styles.openButton, isEnded && { backgroundColor: '#808080' }]} 
                    // Button is always active to allow navigation to 'View Archive'
                >
                    <Text style={styles.openButtonText}>{isEnded ? "View Archive" : "Open"}</Text> 
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
    const [currentPage, setCurrentPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMoreData, setHasMoreData] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const scrollViewRef = useRef(null);

    const handleOpen = (cardId) => {
        router.push({
            pathname: "/photo-upload",
            params: { eventId: cardId.toString() },
        });
    };

    const handleCreate = () => {
        router.push("/create-event");
    };

    // 🛠️ FIX 1: Using functional state update to ensure correct nextPage is used.
    const loadMoreEvents = () => {
        if (!loadingMore && !isLoadingMore && hasMoreData) {
            setLoadingMore(true);
            setIsLoadingMore(true);
            
            // Use functional update to guarantee the correct previous page value
            setCurrentPage(prevPage => {
                const nextPage = prevPage + 1;
                getEvents(nextPage, true);
                return nextPage;
            });
        }
    };

    const getEvents = async (page = 1, append = false) => {
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                Alert.alert("Error", "Please login first");
                setLoading(false);
                router.replace("/login");
                return;
            }

            const response = await axios.post(`${API_URL}/event/list`, {
                includePublic: true,
                pageNumber: page,
                pageSize: 5,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                timeout: 5000,
            });

            let rawItems = response.data;
            const itemsArray = (rawItems && Array.isArray(rawItems.items)) 
                               ? rawItems.items 
                               : (Array.isArray(rawItems) ? rawItems : []);
            
            console.log(`Page ${page} Raw Items Array length:`, itemsArray.length);

            const now = new Date().getTime();
            
            // Filter events to only show active or recently ended (within 24 hours)
            const filteredItems = itemsArray.filter(item => {
                if (!item.endsAt) return true; // Keep events without an end date (assuming perpetual/active)

                const endTime = new Date(item.endsAt).getTime();
                const distance = endTime - now;

                // Keep event if: 1. Active (distance > 0) OR 2. Recently ended (distance > -ONE_DAY_IN_MS)
                return distance > 0 || distance > -ONE_DAY_IN_MS;
            });

            const structuredItems = filteredItems.map(item => {
                return {
                    id: item.id,
                    name: item.name,
                    public: item.public === true || item.public === 1, 
                    imageSource: item.imageSource || undefined,
                    endsAt: item.endsAt,
                };
            });

            if (append) {
                // Better duplicate filtering when appending
                setCardData(prevData => {
                    const existingIds = new Set(prevData.map(item => item.id));
                    const uniqueNewItems = structuredItems.filter(item => !existingIds.has(item.id));
                    return [...prevData, ...uniqueNewItems];
                });
            } else {
                setCardData(structuredItems);
            }

            // 🛠️ FIX 2: Use the local 'page' argument for reliable pagination check
            const totalCount = rawItems.totalCount;
            const newHasMoreData = totalCount 
                ? (page * 5) < totalCount
                : (itemsArray.length === 5 && page < 10); // Heuristic

            setHasMoreData(newHasMoreData);
        } catch (error) {
            console.error("Error fetching events:", error.message);
            Alert.alert("Error", "Failed to fetch events. Check the network.");
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setIsLoadingMore(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            // Reset state and load page 1 when screen focuses
            setCurrentPage(1);
            setHasMoreData(true);
            setIsLoadingMore(false);
            getEvents(1, false);
        }, [])
    );

    // Timer effect to update countdowns (logic is correct)
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const updatedTimeLeft = {};

            cardData.forEach(event => {
                if (event.endsAt) {
                    const endTime = new Date(event.endsAt).getTime();
                    const distance = endTime - now;

                    if (distance > 0) {
                        const days = Math.floor(distance / ONE_DAY_IN_MS);
                        const hours = Math.floor((distance % ONE_DAY_IN_MS) / (1000 * 60 * 60));
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
                        updatedTimeLeft[event.id] = { total: distance };
                    }
                }
            });

            setTimeLeft(updatedTimeLeft);
        }, 1000);

        return () => clearInterval(interval);
    }, [cardData]);

    const handleScroll = (event) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        // Check if user scrolled within 20px of the bottom (trigger point)
        const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20; 

        if (isCloseToBottom && !loadingMore && !isLoadingMore && hasMoreData) {
            // This now calls the fixed loadMoreEvents which uses the freshest page number
            loadMoreEvents();
        }
    };

    const privateEvents = cardData.filter(event => !event.public);
    const publicEvents = cardData.filter(event => event.public);

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.backgroundWhiteBox}>
                    <AppHeader />
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#007bff" />
                        <Text style={[styles.text, { marginTop: 10, color: '#666' }]}>
                            Loading events...
                        </Text>
                    </View>
                </View>
            </View>
        );
    }
    
    const renderEventSection = (events, title) => (
        <>
            <View style={styles.lineContainer}>
                <View style={styles.line} />
                <Text style={styles.lineText}>{title}</Text>
                <View style={styles.line} />
            </View>

            {events.length > 0 ? (
                events.map(card => (
                    <ContentCard
                        key={card.id}
                        imageSource={card.imageSource}
                        name={card.name}
                        accessibility={card.public}
                        eventId={card.id}
                        timeLeft={timeLeft[card.id]}
                        onPress={() => handleOpen(card.id)}
                    />
                ))
            ) : (
                <Text style={[styles.emptyText, { textAlign: 'center', marginVertical: 20, color: '#888' }]}>
                    {`No active or recently ended ${title.toLowerCase()}.`}
                </Text>
            )}
        </>
    );

    return (
        <View style={styles.container}>
            <View style={styles.backgroundWhiteBox}>
                <AppHeader />

                <ScrollView
                    ref={scrollViewRef}
                    style={styles.scrollContainer}
                    contentContainerStyle={styles.scrollContentContainer}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                    onScroll={handleScroll}
                    scrollEventThrottle={16} // Good for performance and smooth loading
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
                                width: "80%",
                                height: 50,
                                justifyContent: "center",
                                borderRadius: 10,
                                marginBottom: 30
                            },
                        ]}
                    >
                        <Text style={[styles.openButtonText, { fontSize: 18, fontWeight: "600" }]}>
                            Create New Event
                        </Text>
                    </TouchableOpacity>


                    {/* PRIVATE EVENTS SECTION */}
                    {renderEventSection(privateEvents, "Private Events")}


                    {/* PUBLIC EVENTS SECTION */}
                    {renderEventSection(publicEvents, "Public Events")}

                    {/* LOADING INDICATOR for infinite scroll */}
                    {loadingMore && (
                        <View style={{ alignItems: 'center', marginVertical: 20 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <ActivityIndicator size="small" color="#007bff" />
                                <Text style={[styles.text, { marginLeft: 10, color: '#666' }]}>
                                    Loading more events...
                                </Text>
                            </View>
                        </View>
                    )}
                    
                    {/* NO MORE DATA MESSAGE */}
                    {!hasMoreData && cardData.length > 0 && (
                        <View style={{ alignItems: 'center', marginVertical: 20 }}>
                            <Text style={[styles.text, { color: '#666' }]}>
                                You've reached the end of the recent events feed.
                            </Text>
                        </View>
                    )}
                    <View style={{ height: 50 }} />
                </ScrollView>
            </View>
        </View>
    );
}