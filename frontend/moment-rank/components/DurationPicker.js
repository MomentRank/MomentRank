import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

// Helper to get the current date/time or the existing endsAt date (with fallback)
const getInitialDate = (endsAt) => {
  if (!endsAt) return new Date();
  if (endsAt instanceof Date) return new Date(endsAt.getTime());
  const parsed = new Date(endsAt);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
};

const clampToNow = (date) => {
  const now = new Date();
  return date < now ? now : date;
};

export default function DurationPicker({ endsAt, setEndsAt, onOpenPicker }) { 
  const [showPicker, setShowPicker] = useState(false);
  const [mode, setMode] = useState("date"); 

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

  // Keep the temporary date in sync if the parent updates endsAt (e.g., start vote)
  useEffect(() => {
    setTempDate(getInitialDate(endsAt));
  }, [endsAt]);

  const onChange = (event, selectedDate) => {
    const isSet = event?.type === 'set' || Platform.OS === 'android';
    const isDismissed = event?.type === 'dismissed';

    // Close picker on any Android response or explicit iOS set/dismiss
    if (Platform.OS === 'android' || isSet || isDismissed) {
      setShowPicker(false);
    }

    // Only process when a value is actually set
    if (!selectedDate) return;

    let newDate = new Date(selectedDate);

    // Use the most recent tempDate as the base (avoids stale endsAt during a session)
    const baseDate = tempDate || getInitialDate(endsAt);

    if (mode === "time") {
      newDate.setFullYear(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        baseDate.getDate()
      );
    } else if (mode === "date") {
      newDate.setHours(
        baseDate.getHours(),
        baseDate.getMinutes(),
        0,
        0
      );
    }

    // Enforce now-or-future
    const clamped = clampToNow(newDate);

    setTempDate(clamped);
    setEndsAt(clamped);
};

  const selectedDateObject = tempDate || getInitialDate(endsAt);

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
          value={selectedDateObject} // Keep aligned with latest selection
          mode={mode}
          display={Platform.OS === "ios" ? "spinner" : "default"} 
          // Only block past dates; time mode has no minimum so future-day morning times remain selectable
          minimumDate={mode === "date" ? new Date() : undefined}
          onChange={onChange}
        />
      )}
    </View>
  );
}