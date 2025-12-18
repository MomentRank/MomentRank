import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import BASE_URL from '../Config';

const API_URL = BASE_URL;

// Configure Google Sign-In
GoogleSignin.configure({
  iosClientId: '734920707150-emfei8cufj25tlk703s4l4gmcvgnkcfh.apps.googleusercontent.com',
  webClientId: '755918280086-opa6m1gk82jhg5956jtuh6o527ma6e60.apps.googleusercontent.com',
  offlineAccess: true,
  scopes: ['profile', 'email'],
});

export const loginWithGoogle = async () => {
  try {
    // Check if device supports Google Play Services (Android)
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // Sign in with Google
    const response = await GoogleSignin.signIn();

    console.log('Google sign-in response:', response);

    // Extract user and token from response
    const user = response.data?.user || response.user;
    const googleIdToken = response.data?.idToken || response.idToken;

    if (!user || !googleIdToken) {
      console.error('Failed to get user information or token from Google');
      return { success: false, error: 'Failed to get user information' };
    }

    console.log('Google user info:', user);
    console.log('Google ID token received');

    // Prepare user profile
    const userProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      givenName: user.givenName,
      familyName: user.familyName,
      photo: user.photo,
    };

    // Authenticate with your backend
    const { appToken, firstTimeLogin, username } = await authenticateWithBackend(googleIdToken, userProfile);

    // Store tokens
    await AsyncStorage.setItem('token', appToken);
    await AsyncStorage.setItem('googleToken', googleIdToken);

    return {
      success: true,
      user: userProfile,
      token: appToken,
      firstTimeLogin: firstTimeLogin,
      username: username,
    };
  } catch (error) {
    console.error('Google Sign-In error:', error);

    if (error.code === 'SIGN_IN_CANCELLED') {
      throw new Error('Sign in was cancelled');
    } else if (error.code === 'IN_PROGRESS') {
      throw new Error('Sign in is already in progress');
    } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
      throw new Error('Google Play Services not available');
    } else {
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  }
};

export const logoutFromGoogle = async () => {
  try {
    await GoogleSignin.signOut();
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('googleToken');
    console.log('Signed out from Google successfully');
  } catch (error) {
    console.error('Error signing out from Google:', error);
    throw error;
  }
};

export const isSignedIn = async () => {
  try {
    return await GoogleSignin.isSignedIn();
  } catch (error) {
    console.error('Error checking sign in status:', error);
    return false;
  }
};

export const getCurrentUser = async () => {
  try {
    const userInfo = await GoogleSignin.signInSilently();
    return userInfo.user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

const authenticateWithBackend = async (googleIdToken, userProfile) => {
  try {
    const response = await axios.post(`${API_URL}/auth/google`, {
      token: googleIdToken,
      user: {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        givenName: userProfile.givenName,
        familyName: userProfile.familyName,
        photo: userProfile.photo,
      },
    });

    return {
      appToken: response.data.token,
      firstTimeLogin: response.data.firstTimeLogin || false,
      username: response.data.user?.username || userProfile.email.split('@')[0],
    };
  } catch (error) {
    console.error('Backend authentication error:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with backend');
  }
};
