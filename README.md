# Equra AI Mobile

React Native mobile app for Equra AI - Egyptian Stock Exchange (EGX) portfolio management.

## Features
- Portfolio management with 12 stocks
- Real-time price updates
- AI-powered stock analysis
- Transaction tracking
- Dividend tracking
- Expense management
- Certificate management

## Setup
```bash
npm install
```

## Build APK
```bash
npx expo export --platform android
cd android
./gradlew assembleRelease
```

APK will be in: `android/app/build/outputs/apk/release/app-release.apk`

## Backend
Backend API should be deployed separately at: https://github.com/Mo-Hendawy/equra-ai-backend
