import React, { useState } from "react";
import { StyleSheet, View, TextInput, Alert, Text, TouchableOpacity } from "react-native";
import styles from "./Styles/main";

import { useFonts, JacquesFrancoisShadow_400Regular } from "@expo-google-fonts/jacques-francois-shadow";
import { Roboto_400Regular } from "@expo-google-fonts/roboto";

import PrivacyPolicyPopUp from "./InfoTabs/PrivacyPolicy";
import TermsOfServicePopUp from "./InfoTabs/TermsOfService";
import ContactUsPopUp from "./InfoTabs/ContactUs";
import MainApp from "./MainApp";

export default function RegisterForm({ onBackToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
      // Add registration logic here
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
        <Text style = {styles.h2}>Create an account</Text>
        
        <Text style = {styles.text}>Name</Text>
        <TextInput
          style={[styles.input, {color: name ? "#000000" : "rgba(0,0,0,0.3)"}]}
          placeholder="Enter your name"
          placeholderTextColor={"rgba(0,0,0,0.3)"}
          value={name}
          onChangeText={setName}
        />

        <Text style = {styles.text}>Email</Text>
        <TextInput
          style={[styles.input, {color: email ? "#000000" : "rgba(0,0,0,0.3)"}]}
          placeholder="Enter your email"
          placeholderTextColor={"rgba(0,0,0,0.3)"}
          value={email}
          onChangeText={setEmail}
        />

        <Text style = {styles.text}>Password</Text>
        <TextInput
          style={[styles.input, {color: password ? "#000000" : "rgba(0,0,0,0.3)"}]}
          placeholder="Enter your password"
          placeholderTextColor={"rgba(0,0,0,0.3)"}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Text style = {styles.text}>Confirm password</Text>
        <TextInput
          style={[styles.input, {color: confirmPassword ? "#000000" : "rgba(0,0,0,0.3)"}]}
          placeholder="Confirm your password"
          placeholderTextColor={"rgba(0,0,0,0.3)"}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <View style={styles.passwordRequirements}>
          <Text style={styles.requirementText}>• Password must be made up of at least 8 symbols</Text>
          <Text style={styles.requirementText}>• Password must contain at least 1 number</Text>
          <Text style={styles.requirementText}>• Password must contain at least 1 capital and lowercase letter</Text>
          <Text style={styles.requirementText}>• Password must contain at least 1 special symbol (#@!$%^&*)</Text>
        </View>

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
