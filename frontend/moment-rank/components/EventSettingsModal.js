import React, { useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    ScrollView,
    ActivityIndicator,
    Image,
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import BASE_URL from "../Config";
import Style from "../Styles/main";
import VisibilityToggle from "./PrivacyToggle";
import DurationPicker from "./DurationPicker";

const API_URL = BASE_URL;

export default function EventSettingsModal({ visible, onClose, event, onUpdate }) {
    const [name, setName] = useState(event?.name || "");
    const [isPublic, setIsPublic] = useState(event?.public || false);
    const [duration, setDuration] = useState(null);
    const [draftEndsAt, setDraftEndsAt] = useState(event?.endsAt ? new Date(event.endsAt) : null);
    const [updating, setUpdating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [coverPhoto, setCoverPhoto] = useState(event?.coverPhotoPath || null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [pendingArchive, setPendingArchive] = useState(false);
    const [pendingCancel, setPendingCancel] = useState(false);

    const wasVisible = useRef(false);

    const updateEvent = async (changes = {}) => {
        const trimmedName = name?.trim() ?? "";
        const finalName = trimmedName || event?.name || "";
        if (!finalName) return;

        try {
            setUpdating(true);
            const token = await AsyncStorage.getItem("token");
            if (!token) return;

            const payload = { id: event.id, name: finalName, public: isPublic, ...changes };

            await axios.post(
                `${API_URL}/event/update`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Error updating event:", error);
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteEvent = async () => {
        try {
            setDeleting(true);
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                return;
            }

            await axios.post(
                `${API_URL}/event/delete`,
                { id: event.id },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (onUpdate) {
                onUpdate();
            }
            onClose();
        } catch (error) {
            console.error("Error deleting event:", error);
        } finally {
            setDeleting(false);
        }
    };

    const handleCancelEvent = async () => {
        setPendingCancel(true);
        await updateEvent({ isCancelled: true });
    };

    const handleArchiveEvent = async () => {
        setPendingArchive(true);
        await updateEvent({ isArchived: true });
    };

    const handleStartVote = async () => {
        const now = new Date();
        now.setSeconds(now.getSeconds() + 3);
        setDraftEndsAt(now);
        await updateEvent({ endsAt: now.toISOString() });
    };
    const handleSelectCoverPhoto = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (permissionResult.granted === false) {
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                await uploadCoverPhoto(result.assets[0].uri);
            }
        } catch (error) {
            console.error("Error selecting photo:", error);
        }
    };

    const uploadCoverPhoto = async (uri) => {
        setUploadingPhoto(true);
        try {
            const token = await AsyncStorage.getItem("token");

            const filename = uri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const extension = match ? match[1] : 'jpg';
            const contentType = `image/${extension}`;

            const response = await fetch(uri);
            const blob = await response.blob();
            const reader = new FileReader();

            reader.onloadend = async () => {
                try {
                    const base64data = reader.result.split(',')[1];

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

                    await axios.post(
                        `${API_URL}/event/update-cover-photo`,
                        {
                            eventId: event.id,
                            filePath: filePath
                        },
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                        }
                    );

                    setCoverPhoto(filePath);
                    if (onUpdate) {
                        onUpdate();
                    }
                } catch (error) {
                    console.error("Failed to upload or update photo:", error);
                } finally {
                    setUploadingPhoto(false);
                }
            };

            reader.onerror = () => {
                console.error("Failed to read file");
                setUploadingPhoto(false);
            };

            reader.readAsDataURL(blob);

        } catch (error) {
            console.error("Failed to process photo:", error);
            setUploadingPhoto(false);
        }
    };

    useEffect(() => {
        if (visible && !wasVisible.current && event) {
            setName(event.name || "");
            setIsPublic(event.public ?? false);
            const nextEnds = event.endsAt ? new Date(event.endsAt) : null;
            setDraftEndsAt(nextEnds);

            if (nextEnds) {
                const mins = Math.max(0, Math.floor((nextEnds.getTime() - Date.now()) / 60000));
                setDuration(mins);
            } else {
                setDuration(null);
            }

            setCoverPhoto(event.coverPhotoPath || null);
            setPendingArchive(false);
            setPendingCancel(false);
        }

        wasVisible.current = visible;
    }, [visible, event?.id]);

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={{
                    flex: 1,
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    justifyContent: "center",
                    alignItems: "center",
                }}
                activeOpacity={1}
                onPress={onClose}
            >
                <View
                    style={{
                        backgroundColor: "#fff",
                        borderRadius: 20,
                        width: "90%",
                        maxHeight: "85%",
                        paddingTop: 20,
                    }}
                    onStartShouldSetResponder={() => true}
                    onTouchEnd={(e) => e.stopPropagation()}
                >
                    <TouchableOpacity
                        onPress={onClose}
                        style={{
                            position: 'absolute',
                            top: 15,
                            right: 15,
                            padding: 10,
                            zIndex: 1000,
                        }}
                    >
                        <Text style={{ color: '#333', fontSize: 30 }}>×</Text>
                    </TouchableOpacity>

                    <View style={{ paddingHorizontal: 20, marginBottom: 5 }}>
                        <Text
                            style={{
                                fontSize: 18,
                                fontWeight: "bold",
                                textAlign: "center",
                                marginBottom: 5,
                            }}
                        >
                            Settings
                        </Text>
                    </View>

                    <ScrollView
                        style={{ paddingHorizontal: 20 }}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        showsVerticalScrollIndicator={true}
                    >
                        <Text style={{ marginTop: 5, marginBottom: 5, fontWeight: "bold", fontSize: 14 }}>
                            Event Name
                        </Text>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            onEndEditing={() => updateEvent({})}
                            placeholder="Enter event name"
                            style={[Style.input, { fontSize: 16, paddingVertical: 12, height: 50 }]}
                        />

                        <Text style={{ marginTop: 15, marginBottom: 5, fontWeight: "bold", fontSize: 14 }}>
                            Cover Photo
                        </Text>
                        {coverPhoto && (
                            <Image
                                source={{ uri: `${API_URL}/${coverPhoto}` }}
                                style={{ width: '100%', height: 150, borderRadius: 10, marginBottom: 10 }}
                                resizeMode="cover"
                            />
                        )}
                        <TouchableOpacity
                            onPress={handleSelectCoverPhoto}
                            disabled={uploadingPhoto}
                            style={{
                                backgroundColor: uploadingPhoto ? "#ccc" : "#FF9500",
                                paddingVertical: 12,
                                borderRadius: 10,
                                alignItems: "center",
                                height: 50,
                                justifyContent: "center",
                                width: '100%',
                                marginBottom: 15,
                            }}
                        >
                            {uploadingPhoto ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
                                    Change Photo
                                </Text>
                            )}
                        </TouchableOpacity>

                        <VisibilityToggle
                            isPublic={isPublic}
                            setIsPublic={(next) => {
                                setIsPublic(next);
                                updateEvent({ public: next });
                            }}
                        />

                        {(event?.status === 1 || event?.status === 0) && (
                            <DurationPicker
                                duration={duration}
                                setEndsAt={async (value) => {
                                    setDraftEndsAt(value);

                                    // Avoid redundant calls if nothing changed
                                    if (
                                        (draftEndsAt === null && value === null) ||
                                        (draftEndsAt && value && draftEndsAt.getTime() === value.getTime())
                                    ) {
                                        return;
                                    }

                                    await updateEvent({ endsAt: value ? value.toISOString() : null });
                                }}
                                endsAt={draftEndsAt}
                            />
                        )}

                        <View style={{ marginTop: 15 }}>
                            {event?.status === 1 && (
                                <TouchableOpacity
                                    onPress={handleStartVote}
                                    disabled={updating}
                                    style={{
                                        backgroundColor: updating ? "#7A1F9C" : "#9C27B0",
                                        height: 50,
                                        borderRadius: 25,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginBottom: 10,
                                    }}
                                >
                                    <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
                                        Start Vote
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {event?.status === 2 && (
                                <TouchableOpacity
                                    onPress={handleArchiveEvent}
                                    disabled={updating}
                                    style={{
                                        backgroundColor: updating ? "#474747ff" : "#a4a4a4ff",
                                        height: 50,
                                        borderRadius: 25,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginBottom: 10,
                                    }}
                                >
                                    <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
                                        Archive Event
                                    </Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                onPress={handleCancelEvent}
                                disabled={updating}
                                style={{
                                    backgroundColor: updating ? "#69645eff" : "#d1e000ff",
                                    height: 50,
                                    borderRadius: 25,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginBottom: 10,
                                }}
                            >
                                <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
                                    Cancel Event
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleDeleteEvent}
                                disabled={deleting}
                                style={{
                                    backgroundColor: deleting ? "#CC0000" : "#FF0000",
                                    height: 50,
                                    borderRadius: 25,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginBottom: 10,
                                }}
                            >
                                <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
                                    Delete Event
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}
