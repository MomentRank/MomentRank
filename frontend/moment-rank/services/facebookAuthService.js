import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import BASE_URL from "../Config";

WebBrowser.maybeCompleteAuthSession();

const API_URL = BASE_URL;

// Facebook OAuth Configuration
const FACEBOOK_APP_ID = '1509885020039998';


export const loginWithFacebook = async () => {
  try {
    const redirectUri = AuthSession.makeRedirectUri({
      useProxy: true,
    });
    console.log('Redirect URI:', redirectUri);

    const authUrl = `https://www.facebook.com/v24.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=email,public_profile`;

    console.log(authUrl)

    const result = await WebBrowser.openAuthSessionAsync(
      authUrl,
      redirectUri
    );

    if (result.type === 'success') {
      const { url } = result;
      
      const accessToken = extractAccessTokenFromUrl(url);
      
      if (!accessToken) {
        throw new Error('No access token received from Facebook');
      }

      const userProfile = await getFacebookUserProfile(accessToken);
      
      const {appToken, firstTimeLogin} = await authenticateWithBackend(accessToken, userProfile);
      
      await AsyncStorage.setItem('token', appToken);
      await AsyncStorage.setItem('facebookToken', accessToken);
      
      return {
        success: true,
        user: userProfile,
        token: appToken,
        firstTimeLogin: firstTimeLogin
      };
    } else if (result.type === 'cancel') {
      throw new Error('Facebook authentication was cancelled');
    } else {
      throw new Error('Facebook authentication failed');
    }
  } catch (error) {
    console.error('Facebook login error:', error);
    throw error;
  }
};


const extractAccessTokenFromUrl = (url) => {
  const match = url.match(/access_token=([^&]+)/);
  return match ? match[1] : null;
};


const getFacebookUserProfile = async (accessToken) => {
  try {
    const profileUrl = `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`;
    
    const response = await axios.get(profileUrl);
    
    return response.data; // Contains id, name, email, picture
  } catch (error) {
    console.error('Profile fetch error:', error);
    throw new Error('Failed to fetch Facebook profile');
  }
};


const authenticateWithBackend = async (facebookToken, profile) => {
  try {
    const response = await axios.post(`${API_URL}/api/auth/facebook`, {
      accessToken: facebookToken,
    });
    
    return {
        appToken: response.data.access_token,
        firstTimeLogin: response.data.first_time_login
    };

  } catch (error) {
    if (error.response?.status === 400) {
      throw new Error('Invalid Facebook access token');
    }
    if (error.response?.status === 401) {
      throw new Error('Facebook token verification failed');
    }
    console.error('Backend authentication error:', error);
    throw new Error('Failed to authenticate with backend');
  }
};

export const logoutFacebook = async () => {
  try {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('facebookToken');
  } catch (error) {
    console.error('Facebook logout error:', error);
  }
};

export const getFacebookToken = async () => {
  try {
    return await AsyncStorage.getItem('facebookToken');
  } catch (error) {
    console.error('Get Facebook token error:', error);
    return null;
  }
};
