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
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

const ContentCard = ({ imageSource, name, accessibility, onPress, eventId, timeLeft, memberIds = [], ownerId, currentUserId, onJoin, status = 1, onRanking }) => {
    const router = useRouter();
    
    const source = imageSource
        ? (typeof imageSource === "string" ? { uri: imageSource } : defaultImage)
        : defaultImage;

    const isOwner = currentUserId && ownerId && Number(currentUserId) === Number(ownerId);
    const isMember = currentUserId && memberIds.some(id => Number(id) === Number(currentUserId));
    const showJoinButton = accessibility && !isMember && !isOwner && currentUserId && status === 1;
    const showArchiveButton = isOwner && status === 3;

    const getStatusInfo = () => {
        switch(status) {
            case 0: return { text: 'Scheduled', color: '#FFA500', button: 'View Details' };
            case 1: return { text: 'Active', color: '#00cc14ff', button: 'Open' };
            case 2: return { text: 'Ranking', color: '#9C27B0', button: 'Vote Now' };
            case 3: return { text: 'Ended', color: '#cc0000ff', button: 'View Results' };
            case 4: return { text: 'Cancelled', color: '#808080', button: 'Cancelled' };
            case 5: return { text: 'Archived', color: '#696969', button: 'View Archive' };
            default: return { text: 'Unknown', color: '#808080', button: 'Open' };
        }
    };

    const statusInfo = getStatusInfo();
    
    // Override status based on actual time remaining
    const actualStatus = (timeLeft && timeLeft.total > 0) ? 1 : status;
    const actualStatusInfo = actualStatus !== status ? getStatusInfo.call({}, actualStatus) : statusInfo;
    const displayColor = (timeLeft && timeLeft.total > 0) ? '#00cc14ff' : statusInfo.color;

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
    
    const isEnded = status >= 2;
    
    let badgeColor = displayColor; 

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
                        {timeLeft && timeLeft.total > 0 ? "Ends in" : "Status"}
                    </Text>
                    <Text style={[styles.timerText, {
                        fontSize: 10,
                        fontWeight: 'bold',
                        color: '#fff',
                        textAlign: 'center'
                    }]}>
                        {timeLeft && timeLeft.total > 0 ? formatTime(timeLeft) : statusInfo.text}
                    </Text>
                </View>
            </View>
            <View style={styles.descriptionTextContainer}>
                <Text style={styles.descriptionText}>{accessibility ? "Public" : "Private"}</Text>
            </View>
            
            <View style={styles.openButtonContainer}>
                {showJoinButton ? (
                    <TouchableOpacity
                        onPress={() => onJoin(eventId, name)}
                        style={[styles.openButton, { backgroundColor: '#28a745' }]}
                    >
                        <Text style={styles.openButtonText}>Join Event</Text>
                    </TouchableOpacity>
                ) : status === 2 ? (
                    <TouchableOpacity 
                        onPress={() => onRanking(eventId, name)} 
                        style={[styles.openButton, { backgroundColor: '#9C27B0' }]}
                    >
                        <Text style={styles.openButtonText}>Vote Now</Text> 
                    </TouchableOpacity>
                ) : status === 3 ? (
                    <TouchableOpacity 
                        onPress={() => router.push({ pathname: '/leaderboard', params: { eventId: eventId.toString(), eventName: name } })} 
                        style={[styles.openButton, { backgroundColor: '#FF9500' }]}
                    >
                        <Text style={styles.openButtonText}>View Results</Text> 
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity 
                        onPress={onPress} 
                        style={[styles.openButton, status === 4 && { backgroundColor: '#808080' }]}
                        disabled={status === 4}
                    >
                        <Text style={styles.openButtonText}>{statusInfo.button}</Text> 
                    </TouchableOpacity>
                )}
                {showArchiveButton ? (
                    <TouchableOpacity
                        onPress={() => onArchive(eventId)}
                        style={[styles.openButton, { backgroundColor: '#28a745' }]}
                    >
                        <Text style={styles.openButtonText}>Archive Event</Text>
                    </TouchableOpacity>
                )}
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
    const [currentUserId, setCurrentUserId] = useState(null);
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

    const handleRanking = (eventId, eventName) => {
        router.push({
            pathname: "/ranking",
            params: { eventId: eventId.toString(), eventName: eventName },
        });
    };

    const handleJoin = async (eventId, eventName) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                Alert.alert("Error", "Please login first");
                return;
            }

            await axios.post(`${API_URL}/event/join`, {
                id: eventId
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            Alert.alert("Success", `You've joined ${eventName}!`);

            setCardData(prevData => {
                const updated = prevData.map(event => {
                    if (event.id === eventId) {
                        const newMemberIds = [...event.memberIds, currentUserId];
                        return { ...event, memberIds: newMemberIds };
                    }
                    return event;
                });
                return updated;
            });
        } catch (error) {
            console.error('Join event error:', error);
            if (error.response?.status === 409) {
                Alert.alert("Info", "You're already a member of this event");
            } else {
                Alert.alert("Error", "Failed to join event");
            }
        }
    };


    const loadMoreEvents = () => {
        if (!loadingMore && !isLoadingMore && hasMoreData) {
            setLoadingMore(true);
            setIsLoadingMore(true);


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
                console.log("No token, redirecting to login");
                setLoading(false);
                router.replace("/");
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

            const structuredItems = itemsArray.map(item => {
                return {
                    id: item.id,
                    name: item.name,
                    public: item.public === true || item.public === 1,
                    imageSource: item.coverPhoto ? `${API_URL}/${item.coverPhoto}` : (item.imageSource || undefined),
                    endsAt: item.endsAt,
                    memberIds: item.memberIds || [],
                    ownerId: item.ownerId,
                    status: item.status !== undefined ? item.status : 1,
                };
            });

            if (append) {

                setCardData(prevData => {
                    const existingIds = new Set(prevData.map(item => item.id));
                    const uniqueNewItems = structuredItems.filter(item => !existingIds.has(item.id));
                    return [...prevData, ...uniqueNewItems];
                });
            } else {
                setCardData(structuredItems);
            }


            const totalCount = rawItems.totalCount;
            const newHasMoreData = totalCount
                ? (page * 5) < totalCount
                : (itemsArray.length === 5 && page < 10);

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

    const getCurrentUser = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            const response = await axios.post(`${API_URL}/profile/get`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });

            console.log('Current user response:', response.data);

            if (response.data && response.data.id) {
                setCurrentUserId(response.data.id);
                console.log('Set currentUserId to:', response.data.id);
            }
        } catch (error) {
            console.error('Error getting current user:', error);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            setCurrentPage(1);
            setHasMoreData(true);
            setIsLoadingMore(false);
            getCurrentUser();
            getEvents(1, false);
        }, [])
    );

    useEffect(() => {
        // Initial calculation - run immediately on mount and when cardData changes
        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const updatedTimeLeft = {};
            let needsRefresh = false;

            cardData.forEach(event => {
                if (event.endsAt) {
                    // Parse UTC timestamp from backend and convert to milliseconds
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
                        // Event just ended, refresh to get updated status from backend
                        if (event.status === 1 && distance <= 0 && distance > -5000) {
                            needsRefresh = true;
                        }
                    }
                }
            });

            setTimeLeft(updatedTimeLeft);
            
            // Refresh events when an active event transitions to ended
            if (needsRefresh) {
                getEvents(1, false);
            }
        };

        // Calculate immediately
        calculateTimeLeft();

        // Then set up interval for updates
        const interval = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(interval);
    }, [cardData]);

    const handleScroll = (event) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;

        const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;

        if (isCloseToBottom && !loadingMore && !isLoadingMore && hasMoreData) {

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
                        memberIds={card.memberIds}
                        ownerId={card.ownerId}
                        currentUserId={currentUserId}
                        status={card.status}
                        onPress={() => handleOpen(card.id)}
                        onJoin={handleJoin}
                        onRanking={handleRanking}
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
                    scrollEventThrottle={16}
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



                    {renderEventSection(privateEvents, "Private Events")}


                    {renderEventSection(publicEvents, "Public Events")}

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