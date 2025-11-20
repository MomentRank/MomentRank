import React, { useState, useEffect } from "react";
import { View, Text, Alert, ActivityIndicator, TouchableOpacity, Platform } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import * as Location from "expo-location";
import styles from "../../Styles/main";
import AppHeader from "../../components/AppHeader";

export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

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
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setLoading(false);
    } catch (error) {
      setErrorMsg("Error getting current location");
      setLoading(false);
    }
  };

  const handleRecenterMap = () => {
    getCurrentLocation();
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
        <View style={{ flex: 1, position: "relative" }}>
          <MapView
            style={{ flex: 1 }}
            provider={PROVIDER_DEFAULT}
            region={location}
            showsUserLocation={true}
            showsMyLocationButton={false}
            showsCompass={true}
            loadingEnabled={true}
          >
            {location && (
              <Marker
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                title="You are here"
                description="Your current location"
                pinColor="#FF9500"
              />
            )}
          </MapView>

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
