import React from "react";
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, Pressable } from "react-native";
import styles from "./Styles/main";

import { useFonts, JacquesFrancoisShadow_400Regular } from "@expo-google-fonts/jacques-francois-shadow";
import { Roboto_400Regular } from "@expo-google-fonts/roboto";

export default function MainApp() {
  const [fontsLoaded] = useFonts({
    JacquesFrancoisShadow_400Regular,
    Roboto_400Regular,
  });

  const handleOpen = () => {
    // Handle open action
    console.log("Open button pressed");
  };

  return (
    <View style={styles.container}>
      <View style={styles.backgroundWhiteBox} />
      <View style={[styles.containerTitle, {marginTop: '20%'}]}>
        <Text style={styles.title}>
          <Text style={{color: "#4C4C4C"}}>Moment</Text>
          <Text style={{color: "rgba(255, 149, 0, 0.6)"}}>Rank</Text>
        </Text>
      </View>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.contentCard}>
          <Image 
            source={require('./assets/stock-photo.png')} 
            style={styles.stockImage} 
          />
          <View style={styles.descriptionLabelContainer}>
            <Text style={styles.descriptionLabel}>Description</Text>
          </View>
          <View style={styles.descriptionTextContainer}>
            <Text style={styles.descriptionText}>
              Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's
            </Text>
          </View>
          <View style={styles.openButtonContainer}>
            <TouchableOpacity onPress={handleOpen} style={styles.openButton}>
              <Text style={styles.openButtonText}>Open</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Second Content Card */}
        <View style={styles.contentCard}>
          <Image 
            source={require('./assets/stock-photo.png')} 
            style={styles.stockImage} 
          />
          <View style={styles.descriptionLabelContainer}>
            <Text style={styles.descriptionLabel}>Description</Text>
          </View>
          <View style={styles.descriptionTextContainer}>
            <Text style={styles.descriptionText}>
              Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's
            </Text>
          </View>
          <View style={styles.openButtonContainer}>
            <TouchableOpacity onPress={handleOpen} style={styles.openButton}>
              <Text style={styles.openButtonText}>Open</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Third Content Card */}
        <View style={styles.contentCard}>
          <Image 
            source={require('./assets/stock-photo.png')} 
            style={styles.stockImage} 
          />
          <View style={styles.descriptionLabelContainer}>
            <Text style={styles.descriptionLabel}>Description</Text>
          </View>
          <View style={styles.descriptionTextContainer}>
            <Text style={styles.descriptionText}>
              Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's
            </Text>
          </View>
          <View style={styles.openButtonContainer}>
            <TouchableOpacity onPress={handleOpen} style={styles.openButton}>
              <Text style={styles.openButtonText}>Open</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomNavigation}>
        <Pressable>
          <Text style={styles.navIcon}>🏠</Text>
        </Pressable>
        <Pressable>
          <Text style={styles.navIcon}>👥</Text>
        </Pressable>
        <Pressable>
          <Text style={styles.navIcon}>🗺️</Text>
        </Pressable>
        <Pressable>
          <Text style={styles.navIcon}>👤</Text>
        </Pressable>
      </View>
    </View>
  );
}
