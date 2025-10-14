import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import styles from "../Styles/main";
import PrivacyPolicyPopUp from "../InfoTabs/PrivacyPolicy";
import TermsOfServicePopUp from "../InfoTabs/TermsOfService";
import ContactUsPopUp from "../InfoTabs/ContactUs";

export default function InfoFooter() {
  const [PrivacyPolicyPopUpVisible, setPrivacyPolicyPopUpVisible] = useState(false);
  const [TermsOfServicePopUpVisible, setTermsOfServicePopUpVisible] = useState(false);
  const [ContactUsPopUpVisible, setContactUsPopUpVisible] = useState(false);

  return (
    <View style={[styles.containerHor]}>
      <TouchableOpacity 
        onPress={() => setTermsOfServicePopUpVisible(true)}
        style={styles.buttonInfo}>
        <Text style={styles.buttonInfoText}>Terms of Service</Text>
      </TouchableOpacity>
      <TermsOfServicePopUp
        visible={TermsOfServicePopUpVisible}
        onClose={() => setTermsOfServicePopUpVisible(false)}
      />
      
      <TouchableOpacity 
        onPress={() => setContactUsPopUpVisible(true)}
        style={styles.buttonInfo}>
        <Text style={styles.buttonInfoText}>Contact Us</Text>
      </TouchableOpacity>
      <ContactUsPopUp
        visible={ContactUsPopUpVisible}
        onClose={() => setContactUsPopUpVisible(false)}
      />

      <TouchableOpacity 
        onPress={() => setPrivacyPolicyPopUpVisible(true)}
        style={styles.buttonInfo}>
        <Text style={styles.buttonInfoText}>Privacy Policy</Text>
      </TouchableOpacity>
      <PrivacyPolicyPopUp
        visible={PrivacyPolicyPopUpVisible}
        onClose={() => setPrivacyPolicyPopUpVisible(false)}
      />
    </View>
  );
}
