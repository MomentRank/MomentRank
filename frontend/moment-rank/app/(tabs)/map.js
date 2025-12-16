import React, { useState, useEffect, useRef } from "react";
import { View, Text, Alert, ActivityIndicator, TouchableOpacity, Platform } from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import styles from "../../Styles/main";
import AppHeader from "../../components/AppHeader";

export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const webViewRef = useRef(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        setLoading(false);
        return;
      }

      await getCurrentLocation();
    } catch (error) {
      setErrorMsg("Error requesting location permission");
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
      setLoading(false);
    } catch (error) {
      setErrorMsg("Error getting current location");
      setLoading(false);
    }
  };

  const handleRecenterMap = () => {
    if (location && webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        map.setView([${location.latitude}, ${location.longitude}], 15);
        true;
      `);
    }
  };

  const getMapHTML = () => {
    if (!location) return "";
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
            body { margin: 0; padding: 0; }
            #map { width: 100%; height: 100vh; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            var map = L.map('map').setView([${location.latitude}, ${location.longitude}], 15);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors',
              maxZoom: 19
            }).addTo(map);
            
            
            // Add location circle
            L.circle([${location.latitude}, ${location.longitude}], {
              color: '#FF9500',
              fillColor: '#FF9500',
              fillOpacity: 0.2,
              radius: 50
            }).addTo(map);
          </script>
        </body>
      </html>
    `;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.backgroundWhiteBox}>
          <AppHeader />
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={[styles.text, { marginTop: 10 }]}>Loading map...</Text>
          </View>
        </View>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.container}>
        <View style={styles.backgroundWhiteBox}>
          <AppHeader />
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
            <Text style={[styles.h2, { color: "#ff4444", marginBottom: 10 }]}>Error</Text>
            <Text style={[styles.text, { textAlign: "center" }]}>{errorMsg}</Text>
            <TouchableOpacity
              onPress={requestLocationPermission}
              style={{
                backgroundColor: "#4CAF50",
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 5,
                marginTop: 20,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.backgroundWhiteBox}>
        <AppHeader />
        <View style={{flex: 1, width: '100%', marginBottom: '20%'}}>
          <WebView
            ref={webViewRef}
            source={{ html: getMapHTML() }}
            style={{ flex: 1 }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="#4CAF50" />
              </View>
            )}
          />

          {/* Recenter button */}
          <TouchableOpacity
            onPress={handleRecenterMap}
            style={{
              position: "absolute",
              bottom: 80,
              right: 20,
              backgroundColor: "#FF9500",
              width: 50,
              height: 50,
              borderRadius: 25,
              justifyContent: "center",
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>📍</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
