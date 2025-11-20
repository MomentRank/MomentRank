import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, Animated, Dimensions } from "react-native";

const windowWidth = Dimensions.get('window').width;

export default function VisibilityToggle({ isPublic, setIsPublic }) {
  const [selected, setSelected] = useState(isPublic);
  const slideAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isPublic ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [isPublic]);

  const toggleWidth = windowWidth * 0.8; // wider toggle
  const sliderWidth = toggleWidth / 2;

  const slideInterpolation = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, sliderWidth],
  });

  return (
    <View>
        <Text style={{ fontWeight: "bold"}}>End of Event</Text>
    <View 
      style={{
        width: toggleWidth,
        height: 50,
        backgroundColor: "#E0E0E0",
        borderRadius: 30,
        flexDirection: "row",
        position: "relative",
        marginTop: 10,
        alignSelf: "center",
      }}
    >
      {/* Sliding Highlight */}
      <Animated.View
        style={{
          position: "absolute",
          left: slideInterpolation,
          width: sliderWidth,
          height: 50,
          backgroundColor: "#FF9500",
          borderRadius: 30,
        }}
      />

      {/* Private Button */}
      <TouchableOpacity
        onPress={() => setIsPublic(false)}
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontWeight: "bold" }}>Private</Text>
      </TouchableOpacity>

      {/* Public Button */}
      <TouchableOpacity
        onPress={() => setIsPublic(true)}
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontWeight: "bold" }}>Public</Text>
      </TouchableOpacity>
    </View>
    </View>
  );
}