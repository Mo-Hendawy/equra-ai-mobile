@echo off
title Equra AI - Build and Install on Emulator
echo ============================================
echo   Equra AI - Build Release APK for Emulator
echo ============================================
echo.

set ADB=C:\Users\mohab\AppData\Local\Android\Sdk\platform-tools\adb.exe
set EMULATOR=C:\Users\mohab\AppData\Local\Android\Sdk\emulator\emulator.exe
set AVD=Pixel6
set PROJECT_DIR=%~dp0
set GRADLE_USER_HOME=C:\Users\mohab\.gradle
set NODE_ENV=production
set APK=%PROJECT_DIR%android\app\build\outputs\apk\release\app-release.apk
set TMPFILE=%TEMP%\adb_devices.txt

:: ── Step 1: Clear JS cache ──
echo [1/5] Clearing JS bundle cache...
if exist "%PROJECT_DIR%android\app\build\generated\assets\createBundleReleaseJsAndAssets" (
    rmdir /s /q "%PROJECT_DIR%android\app\build\generated\assets\createBundleReleaseJsAndAssets"
)
if exist "%PROJECT_DIR%android\app\build\intermediates\assets\release" (
    rmdir /s /q "%PROJECT_DIR%android\app\build\intermediates\assets\release"
)
echo       Done.
echo.

:: ── Step 2: Build release APK ──
echo [2/5] Building release APK (this may take 2-3 minutes)...
cd /d "%PROJECT_DIR%android"
call gradlew.bat --stop >nul 2>&1
call gradlew.bat assembleRelease
if errorlevel 1 (
    echo.
    echo   BUILD FAILED
    pause
    exit /b 1
)
echo       Build successful.
echo.

:: ── Step 3: Start emulator if not running ──
echo [3/5] Starting emulator...
call :find_emulator
if defined SERIAL (
    echo       Emulator already running: %SERIAL%
    goto :do_install
)

start "" "%EMULATOR%" -avd %AVD%
echo       Emulator launching, waiting for it to fully boot...
echo       (This can take 30-90 seconds)
echo.

"%ADB%" wait-for-device

:: Wait for boot to finish
:wait_boot
timeout /t 3 /nobreak >nul
for /f "tokens=*" %%b in ('"%ADB%" shell getprop sys.boot_completed 2^>nul') do set BOOT=%%b
set BOOT=%BOOT:~0,1%
if not "%BOOT%"=="1" (
    echo       Waiting for boot to complete...
    goto :wait_boot
)

:: Get the serial of the now-booted emulator
call :find_emulator
echo       Emulator ready: %SERIAL%
echo.

:: ── Step 4: Install APK ──
:do_install
echo [4/5] Installing on emulator (%SERIAL%)...

:: Make sure adb is responsive
:verify_adb
"%ADB%" -s %SERIAL% shell echo ok >nul 2>&1
if errorlevel 1 (
    echo       ADB not responsive, waiting 5s...
    timeout /t 5 /nobreak >nul
    goto :verify_adb
)

"%ADB%" -s %SERIAL% uninstall com.egx.portfolio >nul 2>&1
"%ADB%" -s %SERIAL% install -r "%APK%"
if errorlevel 1 (
    echo       First attempt failed, retrying in 10s...
    timeout /t 10 /nobreak >nul
    "%ADB%" -s %SERIAL% install -r "%APK%"
    if errorlevel 1 (
        echo   INSTALL FAILED!
        pause
        exit /b 1
    )
)
echo       Installed.
echo.

:: ── Step 5: Launch app ──
echo [5/5] Launching app...
"%ADB%" -s %SERIAL% shell am start -n com.egx.portfolio/.MainActivity
echo.
echo ============================================
echo   Done! App installed and running on emulator.
echo ============================================
echo.
pause
exit /b 0

:: ── Subroutine: find emulator serial from adb devices ──
:find_emulator
set SERIAL=
"%ADB%" devices >"%TMPFILE%" 2>nul
for /f "usebackq tokens=1,2" %%a in ("%TMPFILE%") do (
    echo %%a | findstr /R "emulator-" >nul 2>&1
    if not errorlevel 1 (
        echo %%b | findstr "device" >nul 2>&1
        if not errorlevel 1 (
            set SERIAL=%%a
        )
    )
)
exit /b 0
