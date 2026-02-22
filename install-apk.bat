@echo off
title EQura AI - Build and Install APK
echo ============================================
echo   EQura AI - Build and Install Release APK
echo ============================================
echo.

set ADB="C:\Users\mohab\AppData\Local\Android\Sdk\platform-tools\adb.exe"
set PROJECT_DIR=%~dp0
set GRADLE_USER_HOME=C:\Users\mohab\.gradle

:: Check device connection
echo [1/5] Checking device connection...
%ADB% devices | findstr /R /C:"device$" >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: No device found! Please connect your phone via USB.
    echo Make sure USB debugging is enabled.
    pause
    exit /b 1
)
echo       Device connected.
echo.

:: Stop stale Gradle daemons
echo [2/5] Stopping stale Gradle daemons...
cd /d "%PROJECT_DIR%android"
call gradlew.bat --stop >nul 2>&1
echo       Done.
echo.

:: Clear JS bundle cache
echo [3/5] Clearing JS bundle cache...
if exist "%PROJECT_DIR%android\app\build\generated\assets\createBundleReleaseJsAndAssets" (
    rmdir /s /q "%PROJECT_DIR%android\app\build\generated\assets\createBundleReleaseJsAndAssets"
)
if exist "%PROJECT_DIR%android\app\build\intermediates\assets\release" (
    rmdir /s /q "%PROJECT_DIR%android\app\build\intermediates\assets\release"
)
echo       Cache cleared.
echo.

:: Build APK
echo [4/5] Building release APK (this may take 2-3 minutes)...
cd /d "%PROJECT_DIR%android"
call gradlew.bat assembleRelease
if errorlevel 1 (
    echo.
    echo ============================================
    echo   BUILD FAILED - see errors above
    echo ============================================
    pause
    exit /b 1
)
echo       Build successful.
echo.

:: Install and launch
echo [5/5] Installing on device and launching...
%ADB% install -r "%PROJECT_DIR%android\app\build\outputs\apk\release\app-release.apk"
if errorlevel 1 (
    echo.
    echo ERROR: Installation failed!
    pause
    exit /b 1
)
%ADB% shell am start -n com.egx.portfolio/.MainActivity >nul 2>&1
echo.
echo ============================================
echo   Done! App installed and running.
echo ============================================
echo.
pause
