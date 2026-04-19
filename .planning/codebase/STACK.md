# Technology Stack

**Analysis Date:** 2026-04-03

## Languages

**Primary:**
- TypeScript ~5.9.2 - All application code (`client/**/*.ts`, `client/**/*.tsx`)
- TSX - React Native components and screens

**Secondary:**
- Groovy/Kotlin - Android native build scripts (`android/build.gradle`, `android/app/build.gradle`)
- Batch - Windows development helper scripts (`run-android-emulator.bat`, `install-apk.bat`)

## Runtime

**Environment:**
- React Native 0.81.5 with New Architecture enabled (`newArchEnabled: true` in `android/gradle.properties`)
- Hermes JavaScript engine (enabled via `hermesEnabled=true` in `android/gradle.properties`)
- React Compiler experiment enabled (`"reactCompiler": true` in `app.json`)

**Package Manager:**
- npm (inferred from `package-lock.json`)
- Lockfile: present (`package-lock.json`)

## Frameworks

**Core:**
- Expo SDK 54 (`expo@^54.0.23`) - Managed workflow with dev-client for native builds
- React 19.1.0 - UI rendering
- React Native 0.81.5 - Cross-platform mobile framework
- React Navigation 7.x - Navigation (stack + bottom tabs)
  - `@react-navigation/native@^7.1.8`
  - `@react-navigation/native-stack@^7.3.16`
  - `@react-navigation/bottom-tabs@^7.4.0`
  - `@react-navigation/elements@^2.6.3`

**State and Data:**
- TanStack React Query 5.x (`@tanstack/react-query@^5.90.7`) - Server state management, API query caching
- AsyncStorage (`@react-native-async-storage/async-storage@^2.2.0`) - Local persistent storage (all portfolio data)
- Zod 3.x (`zod@^3.24.2`) - Runtime schema validation

**Build/Dev:**
- Expo CLI (`npx expo start`, `npx expo run:android`, `npx expo export`)
- Babel (`babel-preset-expo`) with `babel-plugin-module-resolver` for path aliases
- Gradle (Android native builds)

**Testing:**
- Not detected - no test framework, test runner, or test configuration files present

## Key Dependencies

**Critical (Core Functionality):**
- `@react-native-async-storage/async-storage@^2.2.0` - All portfolio data persistence; the entire data layer depends on this
- `@tanstack/react-query@^5.90.7` - API communication layer and caching
- `react-native-gesture-handler@~2.28.0` - Gesture support (draggable lists, swipe navigation)
- `react-native-reanimated@~4.1.1` - Animations (bar charts, transitions)
- `react-native-screens@~4.16.0` - Native navigation screens

**UI and Visualization:**
- `victory-native@^41.20.2` - Charting library (though custom charts are also implemented)
- `react-native-svg@^15.15.1` - SVG rendering for donut charts and custom graphics
- `react-native-draggable-flatlist@^4.0.3` - Reorderable portfolio holding lists
- `@expo/vector-icons@^15.0.2` - Icon set (Feather icons used throughout)
- `expo-blur@^15.0.7` - Blur effects for iOS tab bar
- `expo-glass-effect@~0.1.6` - Liquid Glass effect detection for navigation options
- `react-native-markdown-display@^7.0.2` - Markdown rendering (Manus deep analysis reports)

**Platform Features:**
- `expo-image-picker@^17.0.10` - Camera/gallery access for OCR-based import (dividends, transactions)
- `expo-haptics@~15.0.7` - Haptic feedback on portfolio actions
- `expo-clipboard@^8.0.8` - Clipboard access for backup/restore
- `react-native-webview@^13.16.0` - Embedded web content (dividend calendar)
- `expo-web-browser@~15.0.9` - External link handling
- `@react-native-community/datetimepicker@8.4.4` - Native date pickers
- `react-native-keyboard-controller@^1.20.7` - Keyboard-aware scroll views

**Utilities:**
- `uuid@^13.0.0` - Unique ID generation (note: custom UUID v4 also implemented in `client/lib/storage.ts`)
- `react-native-get-random-values@^2.0.0` - Polyfill for crypto.getRandomValues

## Configuration

**Environment:**
- `.env` file present (gitignored) - contains environment configuration
- Single env var used in code: `EXPO_PUBLIC_DOMAIN` - overrides the default backend URL
- Default backend URL hardcoded in `client/lib/query-client.ts`

**TypeScript:**
- Config: `tsconfig.json` extends `expo/tsconfig.base.json`
- Strict mode enabled
- Path aliases: `@/*` maps to `./client/*` and `@shared/*` maps to `./shared/*` (shared directory does not exist in current codebase)

**Babel:**
- Config: `babel.config.js`
- Preset: `babel-preset-expo`
- Plugins: `module-resolver` (path aliases), `react-native-reanimated/plugin`
- Module resolver aliases mirror TypeScript paths

**Build:**
- Expo export: `npx expo export --platform android`
- Android APK: `cd android && ./gradlew assembleRelease`
- APK output path: `android/app/build/outputs/apk/release/app-release.apk`
- Release signing: uses debug keystore (not production-ready)

**App Configuration (app.json):**
- App name: "Equra AI"
- Slug: `equra-ai`
- Bundle ID / Package: `com.egx.portfolio`
- URL scheme: `egxportfolio`
- Orientation: portrait only
- User interface style: automatic (supports light/dark mode)
- Edge-to-edge enabled on Android
- New Architecture enabled
- React Compiler experiment enabled

## Platform Requirements

**Development:**
- Node.js (version not pinned - no `.nvmrc` or `.node-version`)
- Android SDK with NDK (versions controlled by Expo SDK 54)
- Expo Dev Client (`expo-dev-client@~6.0.20`)
- Java JDK for Android builds

**Production:**
- Android: native APK built via Gradle
- iOS: supported in config but no iOS native directory present
- Web: partial support via `react-native-web@~0.21.0` (single-page output configured)
- Backend API: deployed separately on Railway (see INTEGRATIONS.md)

## Project History

This project was originally a full-stack Replit application (evidenced by `package.json.original`) that included:
- Express.js backend server
- PostgreSQL database (via `pg` and `drizzle-orm`)
- Server-side AI integrations (`@google/generative-ai`)
- WebSocket support (`ws`)

The backend was extracted to a separate repository on GitHub, deployed to Railway, and the mobile app was refactored to be a standalone Expo/React Native client that communicates with the backend via REST API.

---

*Stack analysis: 2026-04-03*