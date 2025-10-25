import React from "react";
import { View, Text, TextInput} from "react-native";
import styles from "../../Styles/main";
import AppHeader from "../../components/AppHeader";

export default function FriendsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.backgroundWhiteBox}>
        <AppHeader />
        <View >
          <TextInput
            style={styles.input}
            placeholder="Search for friends..."
            placeholderTextColor="#888"
            width="80%"
          />
        </View>
      </View>
    </View>
  );
}
