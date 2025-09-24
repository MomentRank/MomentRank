import axios from "axios";

const API_URL = "http://localhost:5000/auth"; // adjust port if needed

export const register = async (username, email, password) => {
  try {
    await axios.post(`${API_URL}/register`, {
      username,
      email,
      password
    });
    return true; // success
  } catch (error) {
    if (error.response?.status === 400) throw "Missing required fields.";
    if (error.response?.status === 409) throw "User already exists.";
    throw "Registration failed.";
  }
};

export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, {
      email,
      password
    });
    const { access_token } = response.data;
    localStorage.setItem("token", access_token);
    return access_token;
  } catch (error) {
    if (error.response?.status === 400) throw "Missing email or password.";
    if (error.response?.status === 401) throw "Invalid credentials.";
    throw "Login failed.";
  }
};
