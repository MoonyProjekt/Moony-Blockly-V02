@echo off
REM Moony Blockly Installer Builder
REM ================================
REM One-click build script for creating the installer

REM Set colors
color 0A

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] package.json not found! Run this script from the Moony Blockly root directory.
    pause
    exit /b 1
)

echo ====================================================
echo  MOONY BLOCKLY INSTALLER BUILDER
echo ====================================================
echo.

REM Check if node_modules exists, if not run npm install
if not exist "node_modules" (
    echo [1/4] Installing dependencies (npm install)...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] npm install failed!
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed
    echo.
) else (
    echo [1/4] Dependencies already installed
    echo.
)

REM Check if electron-builder is installed
if not exist "node_modules\electron-builder" (
    echo [ERROR] electron-builder not found! Run: npm install electron-builder
    pause
    exit /b 1
)

REM Check if drivers directory exists
echo [2/4] Checking driver files...
if not exist "resources\drivers" (
    echo [WARN] resources\drivers directory not found! Creating...
    mkdir resources\drivers
)

if not exist "resources\drivers\ch340\CH340SER.exe" (
    echo [WARN] CH340 driver not found at: resources\drivers\ch340\CH340SER.exe
    echo        Download from: https://wch-ic.com/downloads/ch341ser_exe.html
    echo        Place in: resources\drivers\ch340\
) else (
    echo [OK] CH340 driver found
)
echo.

REM Clean old builds
echo [3/4] Cleaning old builds...
if exist "dist" (
    rmdir /s /q dist
    echo [OK] Old dist folder removed
) else (
    echo [OK] No old builds to clean
)
echo.

REM Build the installer
echo [4/4] Building installer with electron-builder...
echo Please wait, this may take a few minutes...
echo.

call npx electron-builder --win --publish=never

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Build failed! Check the output above for details.
    pause
    exit /b 1
)

echo.
echo ====================================================
echo  BUILD SUCCESSFUL!
echo ====================================================
echo.
echo Installer created: dist\Moony-Blockly-1.0.0-Setup.exe
echo.
pause
exit /b 0
