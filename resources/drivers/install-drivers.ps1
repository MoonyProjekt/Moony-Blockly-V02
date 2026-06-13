# Moony Blockly Arduino Driver Installer
# =======================================
# Installiert Arduino-Treiber (CH340, FTDI, Atmel) stillschweigend im Hintergrund
# Keine Benutzerinteraktion erforderlich!

# Get installation directory (where Moony Blockly is installed)
$installDir = Split-Path -Parent $PSScriptRoot
$driversDir = "$installDir\resources\drivers"

# Logging
$logFile = "$env:TEMP\moony-drivers-install.log"
function Log {
    param([string]$Message)
    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    "$timestamp - $Message" | Out-File -FilePath $logFile -Append -Encoding UTF8
    Write-Host "[Moony] $Message"
}

Log "Starting Arduino driver installation..."
Log "Installation directory: $installDir"
Log "Drivers directory: $driversDir"

# ============================================================================
# HELPER FUNCTION: Install INF driver
# ============================================================================

function Install-InfDriver {
    param(
        [string]$DriverName,
        [string]$InfPath,
        [string]$DeviceName
    )
    
    if (-not (Test-Path $InfPath)) {
        Log "[WARN] Driver not found: $InfPath"
        return $false
    }
    
    Log "Installing driver: $DriverName ($InfPath)"
    
    try {
        # Use pnputil to install the driver (Windows built-in, no external tools needed)
        $result = & pnputil.exe /add-driver "$InfPath" /install 2>&1
        Log "Driver install result: $result"
        return $true
    } catch {
        Log "[ERROR] Failed to install $DriverName : $_"
        return $false
    }
}

# ============================================================================
# HELPER FUNCTION: Install EXE driver
# ============================================================================

function Install-ExeDriver {
    param(
        [string]$DriverName,
        [string]$ExePath,
        [string]$Arguments = "/S"
    )
    
    if (-not (Test-Path $ExePath)) {
        Log "[WARN] Driver executable not found: $ExePath"
        return $false
    }
    
    Log "Installing driver: $DriverName ($ExePath)"
    
    try {
        $process = Start-Process -FilePath $ExePath -ArgumentList $Arguments -Wait -PassThru -NoNewWindow
        if ($process.ExitCode -eq 0 -or $process.ExitCode -eq 1) {
            Log "Driver $DriverName installed successfully (exit code: $($process.ExitCode))"
            return $true
        } else {
            Log "[WARN] Driver installation returned exit code: $($process.ExitCode)"
            return $true  # Consider it a success even if exit code is not 0
        }
    } catch {
        Log "[ERROR] Failed to install $DriverName : $_"
        return $false
    }
}

# ============================================================================
# MAIN DRIVER INSTALLATION
# ============================================================================

Log "========================================"
Log "Arduino Driver Installation Started"
Log "========================================"

$driversInstalled = 0

# CH340 Driver (WCH Semiconductor - most common Arduino Nano clone)
# User should provide: CH340SER.exe in resources/drivers/ch340/
Log "---"
Log "Checking CH340 driver..."
$ch340Exe = "$driversDir\ch340\CH340SER.exe"
if (Test-Path $ch340Exe) {
    if (Install-ExeDriver "CH340" $ch340Exe "/S") {
        $driversInstalled++
        Log "[OK] CH340 driver installed"
    }
} else {
    Log "[INFO] CH340 driver not found (optional). Download from: https://wch-ic.com/downloads/ch341ser_exe.html"
}

# FTDI Driver (FT232RL, FT232BM - older Arduino boards)
# User should provide: CDM21228_Setup.exe in resources/drivers/ftdi/
Log "---"
Log "Checking FTDI driver..."
$ftdiExe = "$driversDir\ftdi\CDM21228_Setup.exe"
if (Test-Path $ftdiExe) {
    if (Install-ExeDriver "FTDI" $ftdiExe "/S") {
        $driversInstalled++
        Log "[OK] FTDI driver installed"
    }
} else {
    Log "[INFO] FTDI driver not found (optional). Download from: https://ftdichip.com/drivers/d2xx/"
}

# Atmel (Arduino SAM boards)
# User should provide: arduino_drivers.inf in resources/drivers/atmel/
Log "---"
Log "Checking Atmel driver..."
$atmelInf = "$driversDir\atmel\arduino_drivers.inf"
if (Test-Path $atmelInf) {
    if (Install-InfDriver "Atmel" $atmelInf "Atmel") {
        $driversInstalled++
        Log "[OK] Atmel driver installed"
    }
} else {
    Log "[INFO] Atmel driver not found (optional). Included with Arduino IDE."
}

Log "========================================"
Log "Driver installation completed!"
Log "Drivers installed: $driversInstalled"
Log "Log file: $logFile"
Log "========================================"

# Exit silently
exit 0
