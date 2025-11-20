import React, { useState } from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

// Helper to get the current date/time or the existing endsAt date
const getInitialDate = (endsAt) => {
    return endsAt ? new Date(endsAt) : new Date();
};

export default function DurationPicker({ endsAt, setEndsAt, onOpenPicker }) { 
  const [showPicker, setShowPicker] = useState(false);
  const [mode, setMode] = useState("date"); 
  // ...

  const showMode = (currentMode) => {
    // Reset tempDate to reflect current endsAt before opening the picker
    setTempDate(getInitialDate(endsAt)); 
    setMode(currentMode);
    
    if (onOpenPicker) {
        onOpenPicker();
    }
    
    setShowPicker(true);
  };
  // Use endsAt as the initial value for the picker's temporary date
  const [tempDate, setTempDate] = useState(getInitialDate(endsAt)); 

  const onChange = (event, selectedDate) => {
    // 🛑 SOLUTION: Always hide the picker after selection or dismissal
    // We check for 'dismissed' for iOS where the picker is a popover/modal
    if (Platform.OS === "android" || event.type === 'dismissed' || event.type === 'set') {
        setShowPicker(false);
    }
    
    if (selectedDate) {
      let newDate = new Date(selectedDate);
      
      const existingDate = getInitialDate(endsAt);

      // Logic to combine the newly picked value with the existing value
      if (mode === "time") {
        // If picking TIME, use the existing DATE and apply the new TIME
        newDate.setFullYear(
          existingDate.getFullYear(),
          existingDate.getMonth(),
          existingDate.getDate()
        );
      } else if (mode === "date") {
        // If picking DATE, use the existing TIME and apply the new DATE
        newDate.setHours(
          existingDate.getHours(),
          existingDate.getMinutes(),
          0,
          0
        );
      }
      
      setTempDate(newDate);
      setEndsAt(newDate.toISOString()); 

    } else if (Platform.OS === "ios" && event.type === 'dismissed') {
        // If it was explicitly dismissed on iOS (e.g., user hits cancel)
        setShowPicker(false);
    }
};

  const selectedDateObject = getInitialDate(endsAt);

  return (
    <View style={{ marginTop: 20 }}>
      <Text style={{ fontWeight: "bold", marginBottom: 10 }}>End of Event</Text>

      {/* 1. Date Button */}
      <TouchableOpacity
        onPress={() => showMode("date")}
        style={{
          paddingVertical: 15,
          paddingHorizontal: 20,
          borderRadius: 12,
          backgroundColor: "#FFF",
          borderWidth: 1,
          borderColor: "#DDD",
          marginBottom: 10,
        }}
      >
        <Text style={{ fontSize: 16 }}>
          {endsAt // Check the external prop for display
            ? selectedDateObject.toLocaleDateString()
            : "Pick a date"}
        </Text>
      </TouchableOpacity>

      {/* 2. Time Button */}
      <TouchableOpacity
        onPress={() => showMode("time")}
        style={{
          paddingVertical: 15,
          paddingHorizontal: 20,
          borderRadius: 12,
          backgroundColor: "#FFF",
          borderWidth: 1,
          borderColor: "#DDD",
        }}
      >
        <Text style={{ fontSize: 16 }}>
          {endsAt // Check the external prop for display
            ? selectedDateObject.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : "Pick a time"}
        </Text>
      </TouchableOpacity>

      {/* Picker */}
      {showPicker && (
        <DateTimePicker
          value={tempDate} // Use the local state here
          mode={mode}
          display={Platform.OS === "ios" ? "spinner" : "default"} 
          minimumDate={new Date()}
          onChange={onChange}
        />
      )}
    </View>
  );
}