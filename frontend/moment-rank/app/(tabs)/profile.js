import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import styles from "../../Styles/main";
import AppHeader from "../../components/AppHeader";
import { logout } from "../../services/authService";

export default function ProfileScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      <View style={styles.backgroundWhiteBox}>
        <AppHeader />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={styles.h2}>Profile</Text>
          <Text style={styles.text}>Coming soon...</Text>
          
          <TouchableOpacity onPress={handleLogout} style={[styles.buttonBig, { marginTop: 20 }]}>
            <Text style={styles.buttonBigText}>LOGOUT</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
