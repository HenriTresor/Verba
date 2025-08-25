// OAuth Configuration
// Update these values with your actual OAuth credentials

export const OAUTH_CONFIG = {
    // App Scheme (must match your app.json/app.config.js)
    APP_SCHEME: 'mobile-app', // Matches your app.json scheme

    // Apple OAuth
    APPLE: {
        CLIENT_ID: 'com.henritresor.mobileapp.auth', // Your Service ID (bundle ID + .auth)
        TEAM_ID: 'your-team-id', // Replace with your Apple Team ID
        KEY_ID: 'your-key-id', // Replace with your Apple Key ID
        PRIVATE_KEY: 'your-private-key', // Replace with your Apple Private Key
    },

    // Google OAuth
    GOOGLE: {
        CLIENT_ID: 'your-google-client-id', // Replace with your Google Client ID
        CLIENT_SECRET: 'your-google-client-secret', // Replace with your Google Client Secret
    },

    // Supabase OAuth Redirect URLs
    REDIRECT_URLS: {
        APPLE: 'mobile-app://auth/callback',
        GOOGLE: 'mobile-app://auth/callback',
    },
};

// Instructions for setup:
// 1. Apple OAuth:
//    - Go to https://developer.apple.com/account/
//    - Create a new App ID with bundle ID: com.henritresor.mobileapp
//    - Enable "Sign In with Apple"
//    - Create a new Service ID: com.henritresor.mobileapp.auth
//    - Configure the redirect URL: mobile-app://auth/callback
//    - Generate a private key
//    - Update the APPLE configuration above
//
// 2. Google OAuth:
//    - Go to https://console.developers.google.com/
//    - Create a new project or select existing
//    - Enable Google+ API
//    - Create OAuth 2.0 credentials
//    - Add your redirect URI: mobile-app://auth/callback
//    - Update the GOOGLE configuration above
//
// 3. App Scheme:
//    - Your app.json already has scheme: 'mobile-app' ✓
//    - This matches the configuration above ✓
