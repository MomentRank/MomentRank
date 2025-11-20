import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import BASE_URL from '../Config';

const API_URL = BASE_URL;

/**
 * Uploads a photo asset (manipulated and converted to Base64) to the API.
 * * @param {object} imageAsset - The asset object returned by ImagePicker.
 * @param {function} setLoading - State setter for loading status.
 * @param {function} loadPhotos - Function to refresh the photo list.
 * @param {integer} currentEventId - The ID of the event to upload to.
 */
export const uploadPhoto = async (imageAsset, setLoading, loadPhotos, currentEventId) => {
    try {
        setLoading(true);

        const token = await AsyncStorage.getItem('token');
        if (!token) {
            Alert.alert("Error", "Please login first");
            return;
        }

        // 1. Image Manipulation (Resize and Compress)
        const manipulatedImage = await manipulateAsync(
            imageAsset.uri,
            [{ resize: { width: 1080 } }], // smaller width
            { compress: 0.5, format: SaveFormat.JPEG }
        );

        let base64data;
        let uri = manipulatedImage.uri;

        // 2. Base64 Conversion (Handling different URI types)
        
        // Use FileSystem for local file URIs (most performant)
        if (uri.startsWith('file://')) {
            try {
                base64data = await FileSystem.readAsStringAsync(uri, {
                    encoding: 'base64', // <-- use this instead
                });
            } catch (fileError) {
                console.error('FileSystem read error:', fileError);
                // Fallback to fetch if FileSystem fails (e.g., restricted access)
                const response = await fetch(uri);
                const blob = await response.blob();

                base64data = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        // The result will be "data:image/jpeg;base64,..."
                        const result = reader.result;
                        const base64 = result.includes(',') ? result.split(',')[1] : result;
                        resolve(base64);
                    };
                    reader.onerror = () => reject(new Error('Failed to read file via fetch/FileReader'));
                    reader.readAsDataURL(blob);
                });
            }
        } 
        
        // Use fetch + FileReader for other URIs (e.g., remote or general data URIs)
        else {
            const response = await fetch(uri);
            const blob = await response.blob();

            base64data = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const result = reader.result;
                    const base64 = result.includes(',') ? result.split(',')[1] : result;
                    resolve(base64);
                };
                reader.onerror = () => reject(new Error('Failed to read file via fetch/FileReader'));
                reader.readAsDataURL(blob);
            });
        }
        // 3. Prepare and Send Payload
        let fileName = imageAsset.fileName || 
                        imageAsset.uri.split('/').pop() || 
                        `photo_${new Date().getTime()}.jpg`;

        // CRITICAL: Force .jpg extension since we converted to JPEG
        // Replace .heic, .heif, or any other extension with .jpg
        fileName = fileName.replace(/\.(heic|heif|png|gif|bmp)$/i, '.jpg');
        // Ensure it ends with .jpg if it doesn't have an extension
        if (!fileName.match(/\.(jpg|jpeg)$/i)) {
            fileName = fileName + '.jpg';
        }

const uploadData = {
    eventId: parseInt(currentEventId),
    fileData: base64data,
    fileName: fileName,
    contentType: 'image/jpeg', // Always JPEG since we converted it
    caption: ''
};

        console.log('=== UPLOAD DEBUG ===');
        console.log('fileName:', fileName);
        console.log('contentType:', uploadData.contentType);
        console.log('base64 length:', base64data.length);
        console.log('base64 preview:', base64data.substring(0, 50));
        console.log('uploadData:', { ...uploadData, fileData: `[${base64data.length} chars]` });

        const uploadResponse = await axios.post(
        `${API_URL}/event/photos/upload-base64`,
        uploadData,
        {
            headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            },
            timeout: 20000, // increase for large uploads
        }
        );

        if (uploadResponse.data) {
            Alert.alert("Success", "Photo uploaded successfully!");
            await loadPhotos(); 
            return uploadResponse.data;
        }

    } catch (error) {
        // ... (Error handling logic remains the same) ...
        console.error('Upload error:', error);
        throw error;
    } finally {
        setLoading(false);
    }
};


// --- Publicly Exported Functions ---

/**
 * Opens the image library to pick a photo.
 * NOTE: Needs setLoading, loadPhotos, and currentEventId to call uploadPhoto correctly.
 */
export const pickImage = (setLoading, loadPhotos, currentEventId) => async () => {
    try {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (permissionResult.granted === false) {
            Alert.alert("Permission required", "Permission to access camera roll is required!");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'Images',
            allowsEditing: false,
            quality: 0.5,
            base64: false,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            await uploadPhoto(result.assets[0], setLoading, loadPhotos, currentEventId);
        }
    } catch (error) {
        console.error('Error picking image:', error);
        Alert.alert("Error", "Failed to pick image");
    }
};

/**
 * Opens the camera to take a new photo.
 * NOTE: Needs setLoading, loadPhotos, and currentEventId to call uploadPhoto correctly.
 */
export const takePhoto = (setLoading, loadPhotos, currentEventId) => async () => {
    try {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Permission required", "Permission to access the camera is required!");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images, // Use constant
            allowsEditing: false,
            quality: 0.5,
            base64: false,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            await uploadPhoto(result.assets[0], setLoading, loadPhotos, currentEventId);
        }
    } catch (error) {
        console.error('Error taking photo:', error);
        Alert.alert('Error', 'Failed to take photo');
    }
};