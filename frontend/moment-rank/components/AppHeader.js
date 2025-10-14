import React from "react";
import { View, Text } from "react-native";
import styles from "../Styles/main";

export default function AppHeader() {
  return (
    <View style={styles.containerTitle}>
      <Text style={styles.title}>
        <Text style={{color: "#4C4C4C"}}>Moment</Text>
        <Text style={{color: "rgba(255, 149, 0, 0.6)"}}>Rank</Text>
      </Text>
    </View>
  );
}
