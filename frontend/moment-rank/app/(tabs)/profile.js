import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, Image } from "react-native";
import { useRouter, Redirect } from "expo-router";
import styles from "../../Styles/main";
import AppHeader from "../../components/AppHeader";
import { logout } from "../../services/authService";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BASE_URL from "../../Config";

const API_URL = BASE_URL;

export default function ProfileScreen() {
  const response = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      Alert.alert("Error", "No authentication token found. Please login again.");
      router.replace("/");
      return;
    }
    const response = await axios.post(
      `${API_URL}/profile/get`,
      {},
      {
        headers: {
          Authorization: `Bearer ${await AsyncStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      }
    );
  };
  const handleLogout = async () => {
    setLoading(true);
    await AsyncStorage.removeItem("token");
    router.replace("/");
    setLoading(false);
  };

  var router = useRouter();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          router.replace("/");
          return;
        }

        const response = await axios.post(
          `${API_URL}/profile/get`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!mounted) return;

        const data = response.data || {};
        setUsername(data.username || "");
        setName(data.name || "");
        setBio(data.bio || "");
      } catch (err) {
        console.warn("Failed to fetch profile:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.backgroundWhiteBox}>
        <AppHeader />
        <View>
          <Image
            source={require("../../assets/profile-icon.png")}
            style={styles.profileImage}
          />
          <Text style={[styles.h2, { textAlign: "center", marginTop: 10 }]}>
            {name || (loading ? "Loading..." : "No name")}
          </Text>
          <Text style={[styles.text, { textAlign: "center", marginBottom: 20 }]}>
            {username || (loading ? "" : "No username")}
          </Text>
          <Text style={[styles.text, { textAlign: "center", marginBottom: 20 }]}>
            {bio || (loading ? "" : "No bio")}
          </Text>
          <Text style={[styles.h2, { textAlign: "center", marginBottom: 10 }]}>
            My albums
          </Text>
          <View style={{ alignItems: "center" }}>
            {[0, 1].map((row) => (
              <View
                key={row}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  width: "90%",
                  marginBottom: 10,
                }}
              >
                {[0, 1, 2].map((col) => {
                  const idx = row * 3 + col;
                  return (
                    <Image
                      key={idx}
                      source={require("../../assets/stock-photo.png")}
                      style={{ width: 100, height: 100, borderRadius: 8 }}
                      resizeMode="cover"
                    />
                  );
                })}
              </View>
            ))}
          </View>

          <TouchableOpacity onPress={handleLogout} style={[styles.buttonBig, { marginTop: 20 }]}>
            <Text style={styles.buttonBigText}>LOGOUT</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

styles.profileImage = {
  width: 150,
  height: 150,
  borderRadius: 75,
  alignSelf: "center",
};
