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
    RefreshControl,
    TextInput
} from "react-native";
import { useRouter } from "expo-router";
import styles from "../../Styles/main";
import AppHeader from "../../components/AppHeader";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BASE_URL from "../../Config";
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker'; // Import ImagePicker

const API_URL = BASE_URL;

export default function ProfileScreen() {
    const router = useRouter(); 

    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [profilePhoto, setProfilePhoto] = useState(null);
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
    const [refreshing, setRefreshing] = useState(false);
    
    // Edit modal states
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editType, setEditType] = useState(null); // 'username', 'bio', or 'photo'
    const [editValue, setEditValue] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    
    const flatListRef = useRef(null);
    const windowWidth = Dimensions.get('window').width;
    const windowHeight = Dimensions.get('window').height;

    const handleLogout = async () => {
        setLoading(true);
        await AsyncStorage.removeItem("token");
        router.replace("/");
    };

    const fetchEvents = async (token, currentUserId, page = 1, append = false) => {
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
                pageSize: 4,
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
                const isArchived = event.isArchived;
                const isOwner = event.ownerId === currentUserId;
                const isMember = event.memberIds && Array.isArray(event.memberIds) && event.memberIds.includes(currentUserId);

                return (hasEnded && (isMember || isOwner)) || isOwner;
            });

            if (append) {
                setEvents(prevEvents => {
                    const existingIds = new Set(prevEvents.map(e => e.id));
                    const newEvents = userArchivedEvents.filter(e => !existingIds.has(e.id));
                    return [...prevEvents, ...newEvents];
                });
            } else {
                setEvents(userArchivedEvents);
            }

            const newHasMoreData = eventsData.length === 4; 
            setHasMoreData(newHasMoreData);

        } catch (error) {
            console.warn("Failed to fetch events:", error.response?.data || error.message);
            if (!append) setEvents([]);
            setHasMoreData(false); 
        } finally {
            if (!append) setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    };

    const loadMoreEvents = () => {
        if (!loadingMore && hasMoreData && userId) {
            setLoadingMore(true);
            
            setCurrentPage(prevPage => {
                const nextPage = prevPage + 1;
                fetchEvents(null, userId, nextPage, true);
                return nextPage;
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
            setEventPhotos(photos);
        } catch (error) {
            console.error("Failed to load event photos:", error.response?.data || error.message);
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
        setCurrentPage(1);
        setHasMoreData(true);
        if (userId) {
            await fetchEvents(null, userId, 1, false);
        } else {
            await fetchProfileAndEvents();
        }
        setRefreshing(false);
    };

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
            setProfilePhoto(data.profilePicture || null);
            setUserId(currentUserId);

            setCurrentPage(1);
            setHasMoreData(true);
            await fetchEvents(token, currentUserId, 1, false);

        } catch (err) {
            console.warn("Failed to fetch profile or initial events:", err.message);
            if (err.response?.status === 401) {
                 Alert.alert("Session Expired", "Please log in again.");
                 router.replace("/");
            }
        } finally {
            setLoading(false);
        }
    };

    // Open edit modal
    const openEditModal = (type) => {
        setEditType(type);
        if (type === 'name') {
            setEditValue(name);
        } else if (type === 'bio') {
            setEditValue(bio);
        }
        setEditModalVisible(true);
    };

    // Close edit modal
    const closeEditModal = () => {
        setEditModalVisible(false);
        setEditType(null);
        setEditValue("");
    };

    // Handle profile photo selection
    const handleSelectPhoto = async () => {
        try {
            // Request permission
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (permissionResult.granted === false) {
                Alert.alert("Permission Required", "Please allow access to your photo library.");
                return;
            }

            // Launch image picker
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                await uploadProfilePhoto(result.assets[0].uri);
            }
        } catch (error) {
            console.error("Error selecting photo:", error);
        }
    };

    // Upload profile photo
    const uploadProfilePhoto = async (uri) => {
        setIsSaving(true);
        try {
            const token = await AsyncStorage.getItem("token");
            
            // Read the file as base64
            const filename = uri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const extension = match ? match[1] : 'jpg';
            const contentType = `image/${extension}`;
            
            // Fetch the file and convert to base64
            const response = await fetch(uri);
            const blob = await response.blob();
            const reader = new FileReader();
            
            reader.onloadend = async () => {
                try {
                    const base64data = reader.result.split(',')[1]; // Remove data:image/...;base64, prefix
                    
                    // Step 1: Upload photo to get FilePath
                    const uploadResponse = await axios.post(
                        `${API_URL}/photo/upload`,
                        {
                            fileData: base64data,
                            fileName: filename,
                            contentType: contentType
                        },
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                        }
                    );

                    const uploadedPhoto = uploadResponse.data;
                    const filePath = uploadedPhoto.FilePath || uploadedPhoto.filePath;

                    if (!filePath) {
                        throw new Error("No file path returned from upload");
                    }

                    // Step 2: Update profile picture with the new photo path
                    await axios.post(
                        `${API_URL}/profile/update-picture`,
                        {
                            filePath: filePath
                        },
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                        }
                    );

                    setProfilePhoto(filePath);
                } catch (error) {
                    console.error("Failed to upload or update photo:", error);
                } finally {
                    setIsSaving(false);
                }
            };
            
            reader.onerror = () => {
                console.error("Failed to read file");
                setIsSaving(false);
            };
            
            reader.readAsDataURL(blob);
            
        } catch (error) {
            console.error("Failed to process photo:", error);
            setIsSaving(false);
        }
    };

    // Save edit changes
    const handleSaveEdit = async () => {
        if (!editValue.trim() && editType !== 'photo') {
            return;
        }

        setIsSaving(true);
        try {
            const token = await AsyncStorage.getItem("token");
            const updateData = {};
            
            if (editType === 'name') {
                updateData.name = editValue.trim();
            } else if (editType === 'bio') {
                updateData.bio = editValue.trim();
            }

            await axios.post(
                `${API_URL}/profile/update`,
                updateData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            // Update local state
            if (editType === 'name') {
                setName(editValue.trim());
            } else if (editType === 'bio') {
                setBio(editValue.trim());
            }

            Alert.alert("Success", `${editType === 'name' ? 'Name' : 'Bio'} updated!`);
            closeEditModal();
        } catch (error) {
            console.error("Failed to update profile:", error);
            Alert.alert("Error", `Failed to update ${editType}.`);
        } finally {
            setIsSaving(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchProfileAndEvents();
            return () => {};
        }, [])
    );

    const onMomentumScrollEnd = (event) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const newIndex = Math.round(contentOffsetX / windowWidth);
        setSelectedPhotoIndex(newIndex);
    };

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
                        {/* Profile Photo with Edit Button */}
                        <View style={{ alignSelf: 'center', marginTop: 20, position: 'relative' }}>
                            <Image
                                source={
                                    profilePhoto 
                                        ? { uri: `${API_URL}/${profilePhoto}` }
                                        : require("../../assets/profile-icon.png")
                                }
                                style={{
                                    width: 120,
                                    height: 120,
                                    borderRadius: 60,
                                }}
                            />
                            <TouchableOpacity
                                onPress={handleSelectPhoto}
                                disabled={isSaving}
                                style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    backgroundColor: isSaving ? '#ccc' : '#FF9500',
                                    width: 30,
                                    height: 30,
                                    borderRadius: 18,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    borderWidth: 3,
                                    borderColor: '#fff',
                                }}
                            >
                                {isSaving ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>✎</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Name with Edit Button */}
                        <View style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'row', paddingHorizontal: 20 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                <View style={{ width: 26 }} />
                                <Text style={[styles.h2, { textAlign: "center", fontSize: 24 }]}>
                                    {name || "User Name"}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => openEditModal('name')}
                                    style={{ marginLeft: 8, paddingHorizontal: 4, paddingVertical: 0, height: 26, justifyContent: 'center', alignItems: 'center' }}
                                >
                                    <Text style={{ color: '#FF9500', fontSize: 18 }}>✎</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Username (not editable) */}
                        <Text style={[styles.text, { textAlign: "center", marginBottom: 20 }]}>
                            @{username || "username"}
                        </Text>

                        {/* Bio with Edit Button */}
                        <View style={{ justifyContent: 'center', alignItems: 'center', marginBottom: 20, paddingHorizontal: 20, flexDirection: 'row' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                <View style={{ width: 26 }} />
                                <Text style={[styles.text, { textAlign: "center", fontSize: 16 }]}>
                                    Bio: {bio || "No bio yet."}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => openEditModal('bio')}
                                    style={{ marginLeft: 8, paddingHorizontal: 4, paddingVertical: 0, width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <Text style={{ color: '#FF9500', fontSize: 16 }}>✎</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        
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
                            scrollEnabled={false}
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
                                        maxWidth: (windowWidth - 30) / 2,
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
                    
                    {!hasMoreData && events.length > 0 && !loadingMore && (
                        <View style={{ alignItems: 'center', marginVertical: 20 }}>
                            <Text style={[styles.text, { color: '#666' }]}>
                                End of events.
                            </Text>
                        </View>
                    )}

                    <View style={{ height: 50 }} />
                </ScrollView>

                {/* Edit Modal */}
                <Modal
                    visible={editModalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={closeEditModal}
                >
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <View style={{ 
                            backgroundColor: '#fff', 
                            borderRadius: 12, 
                            padding: 20, 
                            width: '85%',
                            maxWidth: 400,
                        }}>
                            <Text style={[styles.h2, { marginBottom: 15 }]}>
                                Edit {editType === 'name' ? 'Name' : 'Bio'}
                            </Text>
                            
                            <TextInput
                                style={{
                                    borderWidth: 1,
                                    borderColor: '#ddd',
                                    borderRadius: 8,
                                    padding: 12,
                                    fontSize: 16,
                                    marginBottom: 20,
                                    minHeight: editType === 'bio' ? 100 : 50,
                                    textAlignVertical: editType === 'bio' ? 'top' : 'center',
                                }}
                                value={editValue}
                                onChangeText={setEditValue}
                                placeholder={editType === 'name' ? 'Enter name' : 'Enter bio'}
                                multiline={editType === 'bio'}
                                maxLength={editType === 'name' ? 50 : 150}
                            />

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <TouchableOpacity
                                    onPress={closeEditModal}
                                    disabled={isSaving}
                                    style={{
                                        flex: 1,
                                        marginRight: 10,
                                        padding: 15,
                                        backgroundColor: '#f0f0f0',
                                        borderRadius: 8,
                                        alignItems: 'center',
                                    }}
                                >
                                    <Text style={{ fontSize: 16, color: '#333' }}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleSaveEdit}
                                    disabled={isSaving}
                                    style={{
                                        flex: 1,
                                        marginLeft: 10,
                                        padding: 15,
                                        backgroundColor: isSaving ? '#ccc' : '#FF9500',
                                        borderRadius: 8,
                                        alignItems: 'center',
                                    }}
                                >
                                    {isSaving ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={{ fontSize: 16, color: '#fff', fontWeight: '600' }}>Save</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Event Photos Modal */}
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