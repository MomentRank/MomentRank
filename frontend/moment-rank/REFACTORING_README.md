# MomentRank - Expo Router Refactoring

## Overview
This app has been refactored to use Expo Router for navigation. The code has been separated into organized directories for better maintainability.

## Project Structure

```
moment-rank/
├── app/
│   ├── _layout.js              # Root layout with font loading
│   ├── index.js                # Login screen (entry point)
│   ├── register.js             # Registration screen
│   ├── first-time-login.js     # First-time user setup
│   └── (tabs)/                 # Main app with tab navigation
│       ├── _layout.js          # Tabs layout configuration
│       ├── index.js            # Home/Feed screen
│       ├── friends.js          # Friends screen
│       ├── map.js              # Map screen
│       └── profile.js          # Profile screen
├── components/
│   ├── AppHeader.js            # Reusable header with MomentRank logo
│   └── InfoFooter.js           # Footer with Terms, Privacy, Contact links
├── services/
│   └── authService.js          # Authentication API calls
├── InfoTabs/
│   ├── ContactUs.js
│   ├── PrivacyPolicy.js
│   └── TermsOfService.js
├── Styles/
│   └── main.js                 # Global styles
└── assets/                     # Images and icons
```

## Navigation Flow

1. **Login** (`/`) → User enters credentials
2. **Register** (`/register`) → New user creates account
3. **First-Time Login** (`/first-time-login`) → OAuth users complete profile
4. **Main App** (`/(tabs)`) → Tab navigation with:
   - Home (Feed)
   - Friends
   - Map
   - Profile

## Key Features

### Expo Router
- File-based routing system
- Stack navigation for auth flows
- Tab navigation for main app
- Type-safe navigation with `useRouter()`

### Refactored Components
- **AppHeader**: Displays the MomentRank logo consistently
- **InfoFooter**: Handles Terms, Privacy Policy, and Contact popups
- **authService**: Centralized authentication logic with AsyncStorage

### Navigation Methods
```javascript
import { useRouter } from 'expo-router';

const router = useRouter();

// Navigate to a new screen
router.push('/register');

// Replace current screen (no back navigation)
router.replace('/(tabs)');

// Go back
router.back();
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npx expo start
```

## Changes from Previous Version

### Before:
- Used state-based navigation with conditional rendering
- All forms in separate files with navigation callbacks
- LoginForm, RegisterForm, FirstTimeLoginForm, MainApp as standalone components

### After:
- Expo Router with file-based routing
- Screens organized in `app/` directory following conventions
- Shared components extracted to `components/`
- Services separated into `services/`
- Cleaner navigation with `useRouter()` hook

## Development Notes

- Old files (`app/App.js`, `index.js`) are marked for deletion
- Old component files (`LoginForm.js`, `RegisterForm.js`, `FirstTimeLoginForm.js`, `MainApp.js`) in the app directory should be removed
- AsyncStorage is used for token storage (React Native compatible)
- All fonts are loaded in the root `_layout.js`

## Next Steps

1. Implement actual authentication logic in `authService.js`
2. Add protected route middleware
3. Complete Friends, Map, and Profile screens
4. Add form validation
5. Implement password reset functionality
