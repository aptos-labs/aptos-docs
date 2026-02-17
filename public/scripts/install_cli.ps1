# This script installs the Aptos CLI on Windows.
# It will perform the following steps:
# - Determine the system architecture
# - Download the CLI
# - Put it in an appropriate location

# ANSI color codes for PowerShell
$ESC = [char]0x1B
$RED = "${ESC}[31m"
$GREEN = "${ESC}[32m"
$YELLOW = "${ESC}[33m"
$BLUE = "${ESC}[34m"
$CYAN = "${ESC}[36m"
$BOLD = "${ESC}[1m"
$NC = "${ESC}[0m"

# Default values
$SCRIPT = "aptos.exe"
$TEST_COMMAND = "$SCRIPT info"
$BIN_DIR = "$env:USERPROFILE\.aptoscli\bin"
$FORCE = $false
$ACCEPT_ALL = $false
$VERSION = ""
$UNDO = $false

# Show usage information
function Show-Usage {
    Write-Host @"
Usage: install_cli.ps1 [OPTIONS]

Installs the latest version of the Aptos CLI on Windows.

During upgrades, the installer automatically backs up the current binary
so you can roll back with --undo. If the upgrade crosses a major version
boundary (e.g. v1.x.x -> v2.x.x), a warning is displayed with a link to
the CHANGELOG for breaking changes:
  https://github.com/aptos-labs/aptos-core/blob/main/crates/aptos/CHANGELOG.md

OPTIONS:
  -f, --force          Install even if the same version is already installed
  -y, --yes            Accept all prompts automatically
  --bin-dir DIR        Install the CLI binary to DIR
                       (default: %USERPROFILE%\.aptoscli\bin)
  --cli-version VER    Install a specific version instead of the latest
  --undo               Restore the previous CLI version from the backup
                       created during the last upgrade. Only one backup is
                       kept at a time. No network access is required.
  -h, --help           Show this help message and exit

EXAMPLES:
  # Install the latest version
  .\install_cli.ps1

  # Install a specific version
  .\install_cli.ps1 --cli-version 3.5.0

  # Roll back to the previously installed version
  .\install_cli.ps1 --undo
"@
}

# Print colored message
function Write-ColorMessage {
    param(
        [string]$Color,
        [string]$Message
    )
    Write-Host "$Color$Message$NC"
}

# Print error and exit
function Die {
    param([string]$Message)
    Write-ColorMessage -Color $RED -Message "Error: $Message"
    exit 1
}

# Check if a command exists
function Test-CommandExists {
    param([string]$Command)
    return [bool](Get-Command -Name $Command -ErrorAction SilentlyContinue)
}

# Check for major version upgrade and warn user
function Test-MajorVersionUpgrade {
    param(
        [string]$OldVersion,
        [string]$NewVersion
    )

    if (-not $OldVersion -or -not $NewVersion) {
        return
    }

    $oldMajor = $OldVersion.Split('.')[0]
    $newMajor = $NewVersion.Split('.')[0]

    if ($oldMajor -ne $newMajor) {
        Write-Host ""
        Write-ColorMessage -Color $YELLOW -Message "WARNING: This is a major version upgrade (v${oldMajor}.x.x -> v${newMajor}.x.x)."
        Write-ColorMessage -Color $YELLOW -Message "Major version upgrades may include breaking changes."
        Write-ColorMessage -Color $YELLOW -Message "Please review the CHANGELOG before continuing:"
        Write-ColorMessage -Color $CYAN -Message "  https://github.com/aptos-labs/aptos-core/blob/main/crates/aptos/CHANGELOG.md"
        Write-Host ""
    }
}

# Backup the current CLI binary before overwriting (keeps only one backup)
function Backup-CurrentBinary {
    $cliPath = Join-Path $BIN_DIR $SCRIPT
    if (Test-Path $cliPath) {
        $backupPath = "$cliPath.backup"
        Write-ColorMessage -Color $CYAN -Message "Backing up current CLI binary to $backupPath..."
        Copy-Item -Path $cliPath -Destination $backupPath -Force
        Write-ColorMessage -Color $GREEN -Message "Backup complete. Use --undo to restore the previous version."
    }
}

# Restore the previously backed up CLI binary
function Undo-Upgrade {
    $cliPath = Join-Path $BIN_DIR $SCRIPT
    $backupPath = "$cliPath.backup"
    if (-not (Test-Path $backupPath)) {
        Die "No backup found at $backupPath. Nothing to undo."
    }

    Write-ColorMessage -Color $CYAN -Message "Restoring previous CLI version..."
    Move-Item -Path $backupPath -Destination $cliPath -Force

    $restoredVersion = (& $cliPath --version | Select-String -Pattern '\d+\.\d+\.\d+').Matches.Value
    if ($restoredVersion) {
        Write-ColorMessage -Color $GREEN -Message "Successfully restored Aptos CLI version $restoredVersion."
    } else {
        Write-ColorMessage -Color $GREEN -Message "Previous CLI version restored."
    }
}

# Get the latest version from GitHub API
function Get-LatestVersion {
    try {
        $response = Invoke-RestMethod -Uri "https://api.github.com/repos/aptos-labs/aptos-core/releases?per_page=100"
        $latestRelease = $response | Where-Object { $_.tag_name -match 'aptos-cli-v' } | Select-Object -First 1
        return $latestRelease.tag_name -replace 'aptos-cli-v', ''
    }
    catch {
        Die "Failed to get latest version: $_"
    }
}

# Determine the target platform
function Get-Target {
    $arch = (Get-WmiObject -Class Win32_Processor).Architecture
    switch ($arch) {
        0 { return "Windows-x86_64" }  # x86
        9 { return "Windows-x86_64" }  # x64
        default { Die "Unsupported architecture: $arch" }
    }
}

# Download and install the CLI
function Install-CLI {
    param(
        [string]$Version,
        [string]$Target
    )
    
    Write-ColorMessage -Color $CYAN -Message "Downloading Aptos CLI version $Version for $Target..."
    
    # Create bin directory if it doesn't exist
    if (-not (Test-Path $BIN_DIR)) {
        New-Item -ItemType Directory -Path $BIN_DIR -Force | Out-Null
    }
    
    # Download URL
    $url = "https://github.com/aptos-labs/aptos-core/releases/download/aptos-cli-v$Version/aptos-cli-$Version-$Target.zip"
    $zipPath = Join-Path $env:TEMP "aptos-cli.zip"
    
    try {
        # Download the file
        # Check if curl is installed
        if (-not (Test-CommandExists "curl.exe")) {
            Invoke-WebRequest -Uri $url -OutFile $zipPath
        } else {
            # Use curl to download the file
            curl.exe -L $url -o $zipPath
        }
        
        # Backup current binary before overwriting
        Backup-CurrentBinary

        # Extract the zip file
        Expand-Archive -Path $zipPath -DestinationPath $BIN_DIR -Force
        
        # Clean up
        Remove-Item $zipPath -Force
    }
    catch {
        Die "Failed to download or extract CLI: $_"
    }
    
    Write-ColorMessage -Color $GREEN -Message "Aptos CLI installed successfully!"
}

# Main installation process
function Main {
    # Parse command line arguments
    for ($i = 0; $i -lt $args.Count; $i++) {
        switch ($args[$i]) {
            '-f' { $FORCE = $true }
            '--force' { $FORCE = $true }
            '-y' { $ACCEPT_ALL = $true }
            '--yes' { $ACCEPT_ALL = $true }
            '--bin-dir' {
                if ($i + 1 -lt $args.Count) {
                    $BIN_DIR = $args[$i + 1]
                    $i++
                }
                else {
                    Die "No directory specified for --bin-dir"
                }
            }
            '--cli-version' {
                if ($i + 1 -lt $args.Count) {
                    $VERSION = $args[$i + 1]
                    $i++
                }
                else {
                    Die "No version specified for --cli-version"
                }
            }
            '--undo' { $UNDO = $true }
            '-h' {
                Show-Usage
                return
            }
            '--help' {
                Show-Usage
                return
            }
            default {
                Die "Unknown option: $($args[$i]). Use --help for usage information."
            }
        }
    }

    # Handle undo (no network needed)
    if ($UNDO) {
        Undo-Upgrade
        return
    }
    
    # Get version if not specified
    if (-not $VERSION) {
        $VERSION = Get-LatestVersion
    }
    
    # Get target platform
    $target = Get-Target
    
    # Check if CLI is already installed
    $cliPath = Join-Path $BIN_DIR $SCRIPT
    if ((Test-Path $cliPath) -and (-not $FORCE)) {
        $currentVersion = (& $cliPath --version | Select-String -Pattern '\d+\.\d+\.\d+').Matches.Value
        if ($currentVersion -eq $VERSION) {
            Write-ColorMessage -Color $YELLOW -Message "Aptos CLI version $VERSION is already installed."
            return
        }
        Test-MajorVersionUpgrade -OldVersion $currentVersion -NewVersion $VERSION
    }
    
    # Install the CLI
    Install-CLI -Version $VERSION -Target $target
    
    # Add to PATH if not already there
    $currentPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    if (-not $currentPath.Contains($BIN_DIR)) {
        Write-ColorMessage -Color $YELLOW -Message "Adding $BIN_DIR to PATH..."
        [Environment]::SetEnvironmentVariable('Path', "$currentPath;$BIN_DIR", 'User')
        Write-ColorMessage -Color $GREEN -Message "Please restart your terminal to update your PATH."
    }
    
    # Test the installation
    Write-ColorMessage -Color $CYAN -Message "Testing the installation..."
    if (& $cliPath --version) {
        Write-ColorMessage -Color $GREEN -Message "Aptos CLI is working correctly!"
    }
    else {
        Write-ColorMessage -Color $RED -Message "There was a problem with the installation."
        return
    }
}

# Run the main function
Main $args 
