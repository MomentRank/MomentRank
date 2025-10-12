/* Generated with chat-gpt */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  PanResponder,
  Modal,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_HEIGHT = SCREEN_HEIGHT * 0.85;

const TermsOfServicePopUp = ({ visible, onClose }) => {
  const slideAnim = useRef(new Animated.Value(BOTTOM_SHEET_HEIGHT)).current;
  const pan = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) pan.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > BOTTOM_SHEET_HEIGHT * 0.2) {
          closeSheet();
        } else {
          Animated.spring(pan, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const closeSheet = () => {
    Animated.timing(slideAnim, {
      toValue: BOTTOM_SHEET_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      pan.setValue(0); // reset pan
      onClose();       // trigger parent close
    });
  };

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(BOTTOM_SHEET_HEIGHT);
      pan.setValue(0);
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    }
  }, [visible]);

  if (!visible) return null;

  const translateY = Animated.add(slideAnim, pan).interpolate({
    inputRange: [0, BOTTOM_SHEET_HEIGHT],
    outputRange: [0, BOTTOM_SHEET_HEIGHT],
    extrapolate: 'clamp',
  });

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.modalContainer}>
        {/* Full-screen dim */}
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closeSheet} />

        {/* Bottom sheet */}
        <Animated.View style={[styles.bottomSheet, { transform: [{ translateY }] }]} {...panResponder.panHandlers}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Privacy Policy</Text>
            <TouchableOpacity style={styles.closeButton} onPress={closeSheet}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.sectionTitle}>Terms Of Service</Text>
            <Text style={styles.text}>Lorem Ipsum is simply dummy text of the
              printing and typesetting industry. Lorem Ipsum has been the industry's
              standard dummy text ever since the 1500s, when an unknown printer took
              a galley of type and scrambled it to make a type specimen book.
              It has survived not only five centuries, but also the leap into electronic
              typesetting, remaining essentially unchanged. It was popularised in the 
              1960s with the release of Letraset sheets containing Lorem Ipsum passages,
              and more recently with desktop publishing software like Aldus PageMaker 
              including versions of Lorem Ipsum.</Text>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  bottomSheet: {
    width: '100%',
    height: BOTTOM_SHEET_HEIGHT,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' },
  headerText: { fontSize: 20, fontWeight: 'bold', fontFamily: "Roboto_400Regular"},
  closeButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: { fontSize: 22, color: '#2196F3', fontWeight: 'bold', fontFamily: "Roboto_400Regular",},
  content: { flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 15, marginBottom: 5, fontFamily: "Roboto_400Regular", },
  text: { fontSize: 14, lineHeight: 22, fontFamily: "Roboto_400Regular", },
});

export default TermsOfServicePopUp;
