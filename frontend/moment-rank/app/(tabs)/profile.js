import React, { useState, useEffect, useRef } from "react";
import { 
    View, 
    Text, 
    TouchableOpacity, 
    Image, 
    Alert, 
    ScrollView, 
    Modal, 
    FlatList, 
    Dimensions, 
    ActivityIndicator, 
    RefreshControl // Added RefreshControl for pull-to-refresh
} from "react-native";
import { useRouter } from "expo-router";
import styles from "../../Styles/main";
import AppHeader from "../../components/AppHeader";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BASE_URL from "../../Config";
import { useFocusEffect } from '@react-navigation/native';

const API_URL = BASE_URL;

export default function ProfileScreen() {
    const router = useRouter(); 

    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [userId, setUserId] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true); 
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [eventPhotos, setEventPhotos] = useState([]);
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0); 
    const [currentPage, setCurrentPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMoreData, setHasMoreData] = useState(true);
    const [refreshing, setRefreshing] = useState(false); // State for pull-to-refresh
    
    const flatListRef = useRef(null);
    const windowWidth = Dimensions.get('window').width;
    const windowHeight = Dimensions.get('window').height;

    const handleLogout = async () => {
        setLoading(true);
        await AsyncStorage.removeItem("token");
        router.replace("/");
    };

    /**
     * Fetches events, filters them for expired, and updates the state.
     * @param {string | null} token - Authentication token (optional, retrieved from AsyncStorage if null).
     * @param {number} currentUserId - The ID of the current user.
     * @param {number} page - The page number to fetch.
     * @param {boolean} append - If true, appends new data to existing events.
     */
    const fetchEvents = async (token, currentUserId, page = 1, append = false) => {
        // Prevent simultaneous loading/fetching
        if (loadingMore && append) return; 

        if (!append) setLoading(true);
        else setLoadingMore(true);

        try {
            const tokenToUse = token || await AsyncStorage.getItem("token");
            if (!tokenToUse) {
                if (!append) setLoading(false);
                setLoadingMore(false);
                router.replace("/");
                return; 
            }

            const response = await axios.post(`${API_URL}/event/list`, {
                includePublic: true,
                pageNumber: page,
                pageSize: 4, // Page size remains 4
            }, {
                headers: {
                    Authorization: `Bearer ${tokenToUse}`,
                    'Content-Type': 'application/json',
                },
                timeout: 10000,
            });

            const rawItems = response.data;
            const eventsData = (rawItems && Array.isArray(rawItems.items))
                               ? rawItems.items
                               : (Array.isArray(rawItems) ? rawItems : []);

            const currentDate = new Date();

            const userArchivedEvents = eventsData.filter(event => {
                const endsAtDate = new Date(event.endsAt);
                const hasEnded = !isNaN(endsAtDate.getTime()) && endsAtDate < currentDate;

                // Show events that have ended AND user is owner or member
                // OR show events owned by user (even if not ended yet)
                const isOwner = event.ownerId === currentUserId;
                const isMember = event.memberIds && Array.isArray(event.memberIds) && event.memberIds.includes(currentUserId);

                return (hasEnded && (isMember || isOwner)) || isOwner;
            });

            if (append) {
                setEvents(prevEvents => {
                    // Filter out any duplicates that might have sneaked in
                    const existingIds = new Set(prevEvents.map(e => e.id));
                    const newEvents = userArchivedEvents.filter(e => !existingIds.has(e.id));
                    return [...prevEvents, ...newEvents];
                });
            } else {
                setEvents(userArchivedEvents);
            }

            // Determine if more data might exist based on the page size limit
            const newHasMoreData = eventsData.length === 4; 
            setHasMoreData(newHasMoreData);

        } catch (error) {
            console.warn("Failed to fetch events:", error.response?.data || error.message);
            if (!append) setEvents([]);
            Alert.alert("Error", "Failed to load events archive.");
            // Stop infinite scroll attempts on error
            setHasMoreData(false); 
        } finally {
            if (!append) setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    };

    const loadMoreEvents = () => {
        // Check if a new page request is valid (not currently loading, has more data, and user ID is known)
        if (!loadingMore && hasMoreData && userId) {
            setLoadingMore(true); // Set loading immediately
            
            // Use the functional form to get the current page state, increment it, and then call fetchEvents
            setCurrentPage(prevPage => {
                const nextPage = prevPage + 1;
                // Pass the fresh nextPage value to the fetch function
                fetchEvents(null, userId, nextPage, true);
                return nextPage; // Return the new page number for the state
            });
        }
    };

    const openEventAlbum = async (event) => {
        setSelectedEvent(event);
        setEventPhotos([]); 
        setSelectedPhotoIndex(0); 
        setModalVisible(true);

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await axios.post(`${API_URL}/event/photos/list`, {
                eventId: event.id
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            
            let photos = Array.isArray(response.data) ? response.data : (response.data?.photos || []);
            
            if (photos.length === 0) {

            }
            
            setEventPhotos(photos);
        } catch (error) {
            console.error("Failed to load event photos:", error.response?.data || error.message);
            Alert.alert("Error", "Failed to load event photos");
            setEventPhotos([]);
        }
    };

    const closePhotoViewer = () => {
        setModalVisible(false);
        setSelectedEvent(null);
        setEventPhotos([]);
        setSelectedPhotoIndex(0);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        // Reset state and fetch the first page
        setCurrentPage(1);
        setHasMoreData(true);
        if (userId) {
            await fetchEvents(null, userId, 1, false);
        } else {
            // Re-run the full profile load if userId is missing
            await fetchProfileAndEvents();
        }
        setRefreshing(false);
    };

    // Consolidated logic to fetch profile and initial events
    const fetchProfileAndEvents = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                router.replace("/");
                return;
            }

            const profileResponse = await axios.post(
                `${API_URL}/profile/get`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                }
            );

            const data = profileResponse.data || {};
            const currentUserId = data.id || data.userId;

            setName(data.name || "");
            setUsername(data.username || "");
            setBio(data.bio || "");
            setUserId(currentUserId);

            // Reset and fetch events
            setCurrentPage(1);
            setHasMoreData(true);
            await fetchEvents(token, currentUserId, 1, false);

        } catch (err) {
            console.warn("Failed to fetch profile or initial events:", err.message);
            if (err.response?.status === 401) {
                 Alert.alert("Session Expired", "Please log in again.");
                 router.replace("/");
            } else {
                 Alert.alert("Error", "Failed to load profile data.");
            }
        } finally {
            setLoading(false);
        }
    };


    useFocusEffect(
        React.useCallback(() => {
            fetchProfileAndEvents();
            return () => {}; // Cleanup function for useFocusEffect
        }, [])
    );

    // Track current visible photo index in modal FlatList
    const onMomentumScrollEnd = (event) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const newIndex = Math.round(contentOffsetX / windowWidth);
        setSelectedPhotoIndex(newIndex);
    };

    // Render loading state separately
    if (loading) {
         return (
             <View style={styles.container}>
                 <View style={styles.backgroundWhiteBox}>
                     <AppHeader />
                     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginBottom: '20%'}}>
                         <ActivityIndicator size="large" color="#007bff" />
                         <Text style={[styles.text, { marginTop: 10, color: '#666' }]}>
                             Loading profile...
                         </Text>
                     </View>
                 </View>
             </View>
         );
    }


    return (
        <View style={styles.container}>
            <View style={styles.backgroundWhiteBox}>
                <AppHeader />
                <ScrollView 
                    style={{ flex: 1, marginBottom: '20%'}} 
                    contentContainerStyle={{ paddingBottom: 150 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                    }
                >
                    <View>
                        <Image
                            source={require("../../assets/profile-icon.png")}
                            style={{
                                width: 120,
                                height: 120,
                                borderRadius: 65,
                                alignSelf: "center",
                            }}
                        />
                        <Text style={[styles.h2, { textAlign: "center", marginTop: 10 }]}>
                            {name || "User Name"}
                        </Text>
                        <Text style={[styles.text, { textAlign: "center", marginBottom: 20 }]}>
                            @{username || "username"}
                        </Text>
                        <Text style={[styles.text, { textAlign: "center", marginBottom: 20, paddingHorizontal: 20 }]}>
                            {bio || "No bio yet."}
                        </Text>
                        
                        <TouchableOpacity
                            onPress={handleLogout}
                            style={[
                                styles.openButton,
                                {
                                    marginVertical: 10,
                                    alignSelf: "center",
                                    width: "80%",
                                    height: 50,
                                    justifyContent: "center",
                                    borderRadius: 10,
                                },
                            ]}
                        >
                            <Text style={[styles.openButtonText, { fontSize: 18, fontWeight: "600" }]}>
                                Logout
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.lineContainer}>
                            <View style={styles.line} />
                                <Text style={styles.lineText}>My Events ({events.length})</Text>
                            <View style={styles.line} />
                        </View>
                    </View>
                    {events.length > 0 ? (
                        <FlatList
                            data={events}
                            keyExtractor={(item) => item.id.toString()}
                            numColumns={2}
                            contentContainerStyle={{ paddingHorizontal: 10 }}
                            scrollEnabled={false} // CRITICAL: Disabled so the parent ScrollView handles the scrolling
                            onEndReached={loadMoreEvents}
                            onEndReachedThreshold={0.5}
                            ListFooterComponent={() => (
                                loadingMore && <ActivityIndicator style={{ marginVertical: 20 }} size="small" color="#007bff" />
                            )}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => openEventAlbum(item)}
                                    style={{
                                        flex: 1,
                                        margin: 5,
                                        backgroundColor: "#f9f9f9",
                                        borderRadius: 8,
                                        borderWidth: 1,
                                        borderColor: "#eee",
                                        maxWidth: (windowWidth - 30) / 2, // Ensures two items fit with padding
                                    }}
                                >
                                    <Image
                                        source={
                                            item.coverPhoto 
                                                ? { uri: `${API_URL}/${item.coverPhoto}` } 
                                                : (item.imageSource ? { uri: item.imageSource } : require("../../assets/event_default.jpg"))
                                        }
                                        style={{
                                            width: '100%',
                                            height: 120,
                                            borderTopLeftRadius: 8,
                                            borderTopRightRadius: 8,
                                        }}
                                        resizeMode="cover"
                                    />
                                    <View style={{ padding: 10 }}>
                                        <Text style={[styles.h3, { fontSize: 14, marginBottom: 5 }]} numberOfLines={1}>
                                            {item.name}
                                        </Text>
                                        <Text style={[styles.text, { color: "#666", fontSize: 11 }]}>
                                            Ended: {new Date(item.endsAt).toLocaleDateString()}
                                        </Text>
                                        <Text style={[styles.text, { color: "#666", fontSize: 11 }]}>
                                            {item.ownerId === userId ? "Owner" : "Member"}
                                        </Text>
                                        <Text style={[styles.text, { color: item.public ? "#4CAF50" : "#FF9500", fontSize: 11 }]}>
                                            {item.public ? "Public" : "Private"}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    ) : (
                        <Text style={[styles.text, { textAlign: "center", color: "#999", marginVertical: 20 }]}>
                            No events found.
                        </Text>
                    )}
                    
                    {/* Display "End of Feed" message */}
                    {!hasMoreData && events.length > 0 && !loadingMore && (
                        <View style={{ alignItems: 'center', marginVertical: 20 }}>
                            <Text style={[styles.text, { color: '#666' }]}>
                                End of events.
                            </Text>
                        </View>
                    )}

                    {/* Spacer for bottom padding */}
                    <View style={{ height: 50 }} />
                </ScrollView>

                {/* Event Photos Modal (No changes needed, already well structured) */}
                <Modal
                    visible={modalVisible}
                    animationType="slide"
                    onRequestClose={closePhotoViewer} 
                >
                    <View style={{ flex: 1, backgroundColor: '#000' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, paddingTop: 50 }}>
                            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                                {selectedEvent?.name || 'Event Photos'}
                            </Text>
                            <Text style={{ color: '#aaa', fontSize: 14 }}>
                                {eventPhotos.length > 0 ? `${selectedPhotoIndex + 1} / ${eventPhotos.length}` : '0 / 0'}
                            </Text>
                            <TouchableOpacity
                                onPress={closePhotoViewer} 
                                style={{ padding: 10 }}
                            >
                                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {eventPhotos.length > 0 ? (
                            <FlatList
                                ref={flatListRef}
                                data={eventPhotos}
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(item, idx) => String(item.id || item.url || idx)} 
                                getItemLayout={(data, index) => (
                                    { length: windowWidth, offset: windowWidth * index, index }
                                )}
                                renderItem={({ item }) => (
                                    <View style={{ width: windowWidth, justifyContent: 'center', alignItems: 'center' }}>
                                        <Image
                                            source={{ uri: item.url || item.imageUrl || (item.filePath ? `${API_URL}/${item.filePath}` : '') }}
                                            style={{ width: windowWidth * 0.95, height: windowHeight * 0.75 }} 
                                            resizeMode="contain"
                                        />
                                    </View>
                                )}
                                onMomentumScrollEnd={onMomentumScrollEnd} 
                                style={{ flex: 1 }}
                                snapToInterval={windowWidth}
                                decelerationRate="fast"
                                initialNumToRender={1}
                                maxToRenderPerBatch={2}
                                windowSize={3}
                            />
                        ) : (
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                {/* Show a different message if loading is done and there are no photos */}
                                {modalVisible && !loadingMore ? (
                                    <Text style={{ color: '#fff', fontSize: 16 }}>No photos uploaded to this event.</Text>
                                ) : (
                                    <Text style={{ color: '#fff', fontSize: 16 }}>Loading photos...</Text>
                                )}
                            </View>
                        )}
                    </View>
                </Modal>
            </View>
        </View>
    );
}