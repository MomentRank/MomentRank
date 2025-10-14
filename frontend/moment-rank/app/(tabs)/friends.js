import React from "react";
import { View, Text } from "react-native";
import styles from "../../Styles/main";
import AppHeader from "../../components/AppHeader";

export default function FriendsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.backgroundWhiteBox}>
        <AppHeader />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={styles.h2}>Friends</Text>
          <Text style={styles.text}>Coming soon...</Text>
        </View>
      </View>
    </View>
  );
}
