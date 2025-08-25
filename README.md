# Mobile Translator App

A React Native mobile application built with Expo for real-time speech translation and conversation management.

## Features

- **Speech Translation**: Record audio and get instant translations
- **Conversations**: Save and manage translation history with favorites
- **Notes**: Create and organize translated content
- **Multi-language Support**: Auto-detect input language and select output language
- **Authentication**: Email login and OAuth (Apple/Google) via Supabase
- **Voice Playback**: Listen to translated text with customizable voices

## Tech Stack

- **Frontend**: React Native with Expo
- **Authentication**: Supabase OAuth
- **State Management**: Custom hooks with AsyncStorage
- **UI Components**: Custom SVG icons, blur effects, animations
- **Audio**: Expo AV for recording and playback
- **Internationalization**: Multi-language support

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npx expo start
   ```

3. Run on device or simulator:
   - Scan QR code with Expo Go app
   - Press 'i' for iOS simulator
   - Press 'a' for Android emulator

## Project Structure

- `app/` - Main app screens and navigation
- `assets/` - Images, SVGs, and static resources
- `store/` - State management and data persistence
- `utils/` - Helper functions and API clients
- `constants/` - App constants and translations

## Environment Setup

Configure your Supabase credentials and OAuth settings in the respective configuration files before running the app.
