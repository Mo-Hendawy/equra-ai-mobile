---
name: run-mobile-apk
description: Builds the Equra AI mobile app release APK and installs it on a connected Android device. Use when the user asks to run the mobile app, build the APK, install on device, or run "the script."
---

# Run Mobile APK Build and Install

## Quick Start

When the user wants to run the mobile app, build the APK, or install on device, execute the project script:

```bash
install-apk.bat
```

From the equra-ai-mobile project root. Or with full path:

```bash
cd c:\Repos\equra-ai-mobile
.\install-apk.bat
```

## What the Script Does

1. Checks device connection (ADB)
2. Stops stale Gradle daemons
3. Clears JS bundle cache
4. Builds release APK (`gradlew assembleRelease`)
5. Installs on device and launches the app

## Prerequisites

- Android device connected via USB with USB debugging enabled
- ADB at `C:\Users\mohab\AppData\Local\Android\Sdk\platform-tools\adb.exe`
- Gradle user home at `C:\Users\mohab\.gradle`

## Trigger Terms

Use this skill when the user says: "run the script," "build the APK," "install the app," "run the mobile app," or similar.
