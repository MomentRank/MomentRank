import React, {useState} from "react";
import { View, Text, TouchableOpacity, TextInput, Image } from "react-native";
import { useRouter } from "expo-router";
import styles from "../../Styles/main";
import AppHeader from "../../components/AppHeader";
import { logout } from "../../services/authService";
import axios from "axios";
import BASE_URL from "../../Config";

const API_URL = BASE_URL;

export default function ProfileScreen() {
  const router = useRouter();
  

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.backgroundWhiteBox}>
        <AppHeader/>
        <View>
          <Image
            source={require('../../assets/profile-icon.png')}
            style={styles.profileImage}
          />
          <Text style={[styles.h2, { textAlign: "center", marginTop: 10 }]}>Username</Text>
          <Text style={[styles.text, { textAlign: "center", marginBottom: 20 }]}>@username</Text>
          <Text style={[styles.text, { textAlign: "center", marginBottom: 20 }]}>This is the user bio. It can be a short description about the user.</Text>
          <Text style={[styles.h2, { textAlign: "center", marginBottom: 10 }]}>My albums</Text>
          <View style={{ alignItems: 'center' }}>
            {[0, 1].map(row => (
              <View
                key={row}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  width: '90%',
                  marginBottom: 10,
                }}
              >
                {[0, 1, 2].map(col => {
                  const idx = row * 3 + col;
                  return (
                    <Image
                      key={idx}
                      source={require('../../assets/stock-photo.png')}
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

