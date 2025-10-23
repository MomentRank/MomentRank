import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = "http://localhost:5121"; // adjust port if needed

export const register = async (username, email, password) => {
  try {
    await axios.post(`${API_URL}/auth/register`, {
      username,
      email,
      password
    });
    return true; // success
  } catch (error) {
    if (error.response?.status === 400) throw new Error("Missing required fields.");
    if (error.response?.status === 409) throw new Error("User already exists.");
    throw new Error("Registration failed.");
  }
};

export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });
    const { access_token } = response.data;
    // Use AsyncStorage for React Native instead of localStorage
    await AsyncStorage.setItem("token", access_token);
    return access_token;
  } catch (error) {
    if (error.response?.status === 400) throw new Error("Missing email or password.");
    if (error.response?.status === 401) throw new Error("Invalid credentials.");
    throw new Error("Login failed.");
  }
};

export const logout = async () => {
  try {
    await AsyncStorage.removeItem("token");
  } catch (error) {
    console.error("Logout error:", error);
  }
};

export const getToken = async () => {
  try {
    return await AsyncStorage.getItem("token");
  } catch (error) {
    console.error("Get token error:", error);
    return null;
  }
};
