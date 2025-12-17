import React, { useState, useRef } from "react";
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    Image, 
    Alert,
    ScrollView,
    Dimensions
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import BASE_URL from "../Config";
import Style from "../Styles/main";
import AppHeader from './AppHeader';
import { useRouter } from "expo-router";
import {takePhoto, pickImage, pickCoverImage, takeCoverPhoto, updateCoverPhoto} from "./CameraFunctions" 
import VisibilityToggle from "./PrivacyToggle";
import DurationPicker from "./DurationPicker";

const API_URL = BASE_URL;
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
export default function CreateEventScreen() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [isPublic, setIsPublic] = useState(false);
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [duration, setDuration] = useState(null)
    const [endsAt, setEndsAt] = useState(null);
    const [coverPhotoPath, setCoverPhotoPath] = useState(null);
    const scrollViewRef = useRef(null);

const payload = {
  name,
  public: isPublic,
  endsAt,
};

    const handleCreateEvent = async () => {
        if (!name.trim()) {
            Alert.alert("Error", "Please enter a name for the event.");
            return;
        }

        // Only validate duration if you want it required
        if (duration && isNaN(duration)) {
            Alert.alert("Error", "Duration must be a number in days.");
            return;
        }
        //if (!image) {
        //    Alert.alert("Error", "Please select an event image.");
        //    return;
        //}

        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                Alert.alert("Error", "Please login first.");
                return;
            }

            const payload = {
                name,
                public: isPublic,
                ...(endsAt && { endsAt }), // optional
            };

            const createResponse = await axios.post(
                `${API_URL}/event/create`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const eventId = createResponse.data.id || createResponse.data.eventId;

            // If cover photo was uploaded, update the event with it
            if (coverPhotoPath && eventId) {
                const updateSuccess = await updateCoverPhoto(eventId, coverPhotoPath);
                if (!updateSuccess) {
                    Alert.alert("Warning", "Event created but cover photo update failed. You can update it later.");
                    router.back();
                    return;
                }
            }

            Alert.alert("Success", "Event created successfully!");
            router.back();

        } catch (error) {
            console.error("Error creating event:", error);
            Alert.alert("Error", "Failed to create event.");
        } finally {
            setLoading(false);
        }
    };

return (
    // 1. Outer container (takes full screen, background color)
    <View style={{backgroundColor:'#FFD280', overflow: 'hidden', flex: 1}}> 
        
        {/* 2. White rounded content container 
            Uses flex: 1 to take all space, and 'space-between' to push the button down. */}
        <View style={{
            backgroundColor:'#FFFFFF', 
            borderRadius: 50, 
            marginBottom:'10%', 
            marginTop:'12.4%', 
            marginHorizontal:'1.5%', 
            flex: 1, 
            // Important: Use Flex direction column (default) and space-between
            justifyContent: 'space-between',
        }}>
            
            {/* --- Start Header/Top Content --- */}
            <AppHeader />
            <Text style={[Style.h2, {textAlign: 'center', marginVertical: 10}]}>
                Create a new Event
            </Text>
            {/* --- End Header/Top Content --- */}

            {/* 3. SCROLLABLE AREA - Must take the remaining space (flex: 1) */}
            <View style={{ flex: 1, paddingHorizontal: 20 }}> 
                <ScrollView 
                    contentContainerStyle={{ paddingBottom: 20 }} 
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    ref={scrollViewRef}
                >
                    {/* Event Name */}
                    <Text style={{ marginTop: 20, marginBottom:10, fontWeight: "bold" }}>Event Name</Text>
                    <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="Enter event name"
                        style={Style.input}
                    />

                    {/* Public / Private Toggle */}
                    <VisibilityToggle isPublic={isPublic} setIsPublic={setIsPublic} />

                    {/* Duration */}
                    <DurationPicker duration={duration} 
                        setEndsAt={setEndsAt} 
                        endsAt={endsAt} 
                        onOpenPicker={() => {
                            setTimeout(() => {
                                scrollViewRef.current?.scrollToEnd({ animated: true }); 
                            }, 100);
                        }}
                    />

                    {/* Image Picker */}
                    <Text style={{ marginTop: 20, fontWeight: "bold" }}>Event Image</Text>
                    
                    {coverPhotoPath && (
                        <View style={{ 
                            marginTop: 15, 
                            alignItems: 'center',
                        }}>
                            <View style={{
                                borderRadius: 12,
                                overflow: 'hidden',
                                borderWidth: 2,
                                borderColor: '#FF9500',
                            }}>
                                <Image 
                                    source={{ uri: `${API_URL}/${coverPhotoPath}` }}
                                    style={{ 
                                        width: 120, 
                                        height: 120, 
                                        borderRadius: 10,
                                    }}
                                    resizeMode="cover"
                                />
                            </View>
                            <TouchableOpacity 
                                onPress={() => setCoverPhotoPath(null)}
                                style={{ marginTop: 8 }}
                            >
                                <Text style={{ color: '#999', fontSize: 12 }}>Remove</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View 
                        style={{
                            marginTop: 20,
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: 20,  
                            zIndex: 900
                        }}
                        // Kept this property, but it's a potential area for bugs
                        pointerEvents="box-none" 
                    >
                        {/* Upload Button */}
                        <TouchableOpacity
                            onPress={pickCoverImage(setLoading, setCoverPhotoPath)}
                            disabled={loading}
                            style={{
                                flex: 1,
                                backgroundColor: loading ? '#666' : '#333',
                                paddingVertical: 14,
                                borderRadius: 24,
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'row',
                            }}
                        >
                            <Image 
                                source={require('../assets/icon_upload.png')} 
                                style={{ width: 22, height: 22, marginRight: 10, tintColor: 'white' }} 
                            />
                            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                                {loading ? 'Uploading...' : coverPhotoPath ? 'Uploaded' : 'Upload'}
                            </Text>
                        </TouchableOpacity>

                        {/* Camera Button */}
                        <TouchableOpacity
                            onPress={takeCoverPhoto(setLoading, setCoverPhotoPath)}
                            disabled={loading}
                            style={{
                                flex: 1,
                                backgroundColor: loading ? '#CC7700' : '#FF9500',
                                paddingVertical: 14,
                                borderRadius: 24,
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'row'
                            }}
                        >
                            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                                {loading ? 'Uploading...' : coverPhotoPath ? 'Captured' : 'Camera'}
                            </Text>
                            <Image 
                                source={require('../assets/icon_camera.png')} 
                                style={{ width: 22, height: 22, marginLeft: 10, tintColor: 'white' }} 
                            />
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
            
            {/* 4. FIXED FOOTER/BUTTON - Positioned outside ScrollView */}
            <View style={{ paddingHorizontal: 20, paddingBottom: 30, paddingTop: 10 }}>
                <TouchableOpacity 
                    onPress={handleCreateEvent} 
                    style={[Style.openButton, { 
                        height: 50,
                        justifyContent: "center",
                    }]}
                >
                    <Text style={[Style.buttonAuthText, {color: "#fff"}]}>Create</Text>
                </TouchableOpacity>
            </View>

        </View>
    </View>
);
}
