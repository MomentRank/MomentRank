import React, { useState } from "react";
import { StyleSheet, View, TextInput, Alert, Text, TouchableOpacity, Image } from "react-native";
import styles from "./Styles/main";

import { useFonts, JacquesFrancoisShadow_400Regular } from "@expo-google-fonts/jacques-francois-shadow";
import { Roboto_400Regular } from "@expo-google-fonts/roboto";

import PrivacyPolicyPopUp from "./InfoTabs/PrivacyPolicy";
import TermsOfServicePopUp from "./InfoTabs/TermsOfService";
import ContactUsPopUp from "./InfoTabs/ContactUs";
import MainApp from "./MainApp";

export default function FirstTimeLoginForm({ onBackToLogin }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [showMainApp, setShowMainApp] = useState(false);

  const [PrivacyPolicyPopUpVisible, setPrivacyPolicyPopUpVisible] = useState(false);
  const [TermsOfServicePopUpVisible, setTermsOfServicePopUpVisible] = useState(false);
  const [ContactUsPopUpVisible, setContactUsPopUpVisible] = useState(false);

  const [fontsLoaded] = useFonts({
    JacquesFrancoisShadow_400Regular,
    Roboto_400Regular,
  });

  const handleSubmit = async () => {
    try {
      // Add first time login logic here
      setShowMainApp(true);
    } catch (err) {
      Alert.alert("Error", err.toString());
    }
  };

  if (showMainApp) {
    return <MainApp />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.backgroundWhiteBox} />
      <View style = {styles.containerTitle}>
        <Text style={styles.title}>
          <Text style={{color: "#4C4C4C"}}>Moment</Text>
          <Text style={{color: "rgba(255, 149, 0, 0.6)"}}>Rank</Text>
        </Text>
      </View>

      <View style={styles.signinContainer}>
        <Text style = {styles.h2}>First Time Log-in</Text>
        
        <View style={styles.profilePictureContainer}>
          <Image 
            source={require('./assets/profile-icon.png')} 
            style={styles.profilePicture} 
          />
        </View>

        <Text style = {styles.text}>Name</Text>
        <TextInput
          style={[styles.input, {color: name ? "#000000" : "rgba(0,0,0,0.3)"}]}
          placeholder="Enter your name"
          placeholderTextColor={"rgba(0,0,0,0.3)"}
          value={name}
          onChangeText={setName}
        />

        <Text style = {styles.text}>Username</Text>
        <TextInput
          style={[styles.input, {color: username ? "#000000" : "rgba(0,0,0,0.3)"}]}
          placeholder="Enter your username"
          placeholderTextColor={"rgba(0,0,0,0.3)"}
          value={username}
          onChangeText={setUsername}
        />

        <Text style = {styles.text}>Bio</Text>
        <TextInput
          style={[styles.input, styles.bioInput, {color: bio ? "#000000" : "rgba(0,0,0,0.3)"}]}
          placeholder="Tell us about yourself"
          placeholderTextColor={"rgba(0,0,0,0.3)"}
          multiline
          numberOfLines={4}
          value={bio}
          onChangeText={setBio}
        />

        <TouchableOpacity title="" onPress={handleSubmit} style={styles.buttonBig}> 
          <Text style = {styles.buttonBigText}>SIGN UP</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onBackToLogin} style = {styles.buttonCreate}>
          <Text style={styles.buttonCreateText}>Back to Login</Text>
        </TouchableOpacity>
      </View>

      <View style = {[styles.containerHor]}>
        <TouchableOpacity 
          onPress = {() => setTermsOfServicePopUpVisible(true)}
          onClose={() => setTermsOfServicePopUpVisible(false)}
          style = {styles.buttonInfo}>
          <Text style = {styles.buttonInfoText}>Terms of Service</Text>
        </TouchableOpacity>
        <TermsOfServicePopUp
          visible={TermsOfServicePopUpVisible}
          onClose={() => setTermsOfServicePopUpVisible(false)}
        />
        

        <TouchableOpacity 
          onPress = {() => setContactUsPopUpVisible(true)}
          onClose={() => setContactUsPopUpVisible(false)}
          style = {styles.buttonInfo}>
          <Text style = {styles.buttonInfoText}>Contact Us</Text>
        </TouchableOpacity>
        <ContactUsPopUp
          visible={ContactUsPopUpVisible}
          onClose={() => setContactUsPopUpVisible(false)}
        />

        <TouchableOpacity 
          onPress = {() => setPrivacyPolicyPopUpVisible(true)}
          onClose={() => setPrivacyPolicyPopUpVisible(false)}
          style = {styles.buttonInfo}>
          <Text style = {styles.buttonInfoText}>Privacy Policy</Text>
        </TouchableOpacity>
        <PrivacyPolicyPopUp
        visible={PrivacyPolicyPopUpVisible}
        onClose={() => setPrivacyPolicyPopUpVisible(false)}
        />

      </View>
    </View>
  );
}
