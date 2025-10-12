import React, { useState } from "react";
import { StyleSheet, View, TextInput, Button, Alert, Text, TouchableOpacity, Image } from "react-native";
import styles from "./Styles/main";

import { useFonts, JacquesFrancoisShadow_400Regular } from "@expo-google-fonts/jacques-francois-shadow";
import { Roboto_400Regular, Roboto_700Bold } from "@expo-google-fonts/roboto";

import PrivacyPolicyPopUp from "./InfoTabs/PrivacyPolicy";
import TermsOfServicePopUp from "./InfoTabs/TermsOfService";
import ContactUsPopUp from "./InfoTabs/ContactUs";
import RegisterForm from "./RegisterForm";
import FirstTimeLoginForm from "./FirstTimeLoginForm";
import MainApp from "./MainApp";
import { login } from "./AuthService";


export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showFirstTimeLogin, setShowFirstTimeLogin] = useState(false);
  const [showMainApp, setShowMainApp] = useState(false);

  const [PrivacyPolicyPopUpVisible, setPrivacyPolicyPopUpVisible] = useState(false);
  const [TermsOfServicePopUpVisible, setTermsOfServicePopUpVisible] = useState(false);
  const [ContactUsPopUpVisible, setContactUsPopUpVisible] = useState(false);

  const [fontsLoaded] = useFonts({
    JacquesFrancoisShadow_400Regular,
    Roboto_400Regular,
    Roboto_700Bold,
  });

  const handleSubmit = async () => {
    try {
      const token = await login(email, password);
      setShowMainApp(true);
    } catch (err) {
      Alert.alert("Error", err.toString());
    }
  // For testing purposes, navigate directly to MainApp
  setShowMainApp(true);
  };

  if (showMainApp) {
    return <MainApp />;
  }

  if (showRegisterForm) {
    return <RegisterForm onBackToLogin={() => setShowRegisterForm(false)} />;
  }

  if (showFirstTimeLogin) {
    return <FirstTimeLoginForm onBackToLogin={() => setShowFirstTimeLogin(false)} />;
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
        <Text style = {styles.h2}>Sign in</Text>
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
        
        <TouchableOpacity onPress = {handleSubmit} style = {styles.buttonSmall}>
          <Text style={styles.buttonSmallText}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity title="" onPress={handleSubmit} style={styles.buttonBig}> 
          <Text style = {styles.buttonBigText}>NEXT</Text>
        </TouchableOpacity>

      </View>

      <View style={styles.lineContainer}>
        <View style={styles.line} />
        <Text style={styles.lineText}>Or</Text>
        <View style={styles.line} />
      </View>

      <View>

        <TouchableOpacity onPress = {() => setShowFirstTimeLogin(true)} style = {styles.buttonAuth}>
          <Image source={require('./assets/icon_apple.png')} style={styles.logoImage} />
          <Text style = {styles.buttonAuthText}>Continue with Apple</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress = {() => setShowFirstTimeLogin(true)} style = {styles.buttonAuth}>
           <Image source={require('./assets/icon_google.png')} style={styles.logoImage} />
          <Text style = {styles.buttonAuthText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress = {() => setShowFirstTimeLogin(true)} style = {styles.buttonAuth}>
          <Image source={require('./assets/icon_facebook.png')} style={styles.logoImage} />
          <Text style = {styles.buttonAuthText}>Continue with Facebook</Text>
        </TouchableOpacity>


        <TouchableOpacity onPress = {() => setShowRegisterForm(true)} style = {styles.buttonCreate}>
          <Text style={styles.buttonCreateText}>Create an Account</Text>
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
