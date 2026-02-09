#!/bin/sh
# This script installs the Aptos CLI.
# It will perform the following steps:
# - Determine what platform (OS + arch) the script is being invoked from
# - Download the CLI
# - Put it in an appropriate location

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Default values
SCRIPT="aptos"
TEST_COMMAND="$SCRIPT info"
BIN_DIR="$HOME/.local/bin"
FORCE=false
ACCEPT_ALL=false
VERSION=""
GENERIC_LINUX=false
FROM_SOURCE=false
UNDO=false
UNIVERSAL_INSTALLER_URL="https://raw.githubusercontent.com/gregnazario/universal-installer/main/scripts/install_pkg.sh"
APTOS_REPO_URL="https://github.com/aptos-labs/aptos-core.git"

# Print colored message
print_message() {
    color=$1
    shift
    printf "%b%s%b\n" "$color" "$*" "$NC"
}

# Print error and exit
die() {
    print_message "$RED" "Error: $1"
    exit 1
}

# Check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Retry function for network operations
retry_command() {
    local max_retries=4
    local attempt=1
    local exit_code=0
    
    while [ $attempt -le $max_retries ]; do
        "$@"
        exit_code=$?
        
        if [ $exit_code -eq 0 ]; then
            if [ $attempt -gt 1 ]; then
                print_message "$GREEN" "✓ $command_description succeeded on attempt $attempt"
            fi
            return 0
        fi
        
        if [ $attempt -lt $max_retries ]; then
            wait_time=$((2 ** (attempt - 1)))  # Exponential backoff: 1s, 2s, 4s
            print_message "$YELLOW" "Network operation failed on attempt $attempt, retrying in ${wait_time}s..."
            sleep $wait_time
        else
            print_message "$RED" "Network operation failed after $max_retries attempts"
        fi
        
        attempt=$((attempt + 1))
    done
    
    return $exit_code
}

# Install required packages using universal installer
install_required_packages() {
    # Download universal installer if not present
    print_message "$YELLOW" "Downloading universal installer..."
    if command_exists curl; then
        retry_command curl -s "$UNIVERSAL_INSTALLER_URL" -o /tmp/install_pkg.sh || die "Failed to download universal installer"
    elif command_exists wget; then
        retry_command wget -q "$UNIVERSAL_INSTALLER_URL" -O /tmp/install_pkg.sh || die "Failed to download universal installer"
    else
        die "Neither curl nor wget is installed. Please install one of them manually."
    fi
    chmod +x /tmp/install_pkg.sh

    # Install unzip if not present
    if ! command_exists unzip; then
        print_message "$YELLOW" "Installing unzip..."
        /tmp/install_pkg.sh unzip || die "Failed to install unzip"
        rm /tmp/install_pkg.sh
    fi
}

# Validate version string contains only safe characters
validate_version() {
    version=$1
    # Allow digits, dots, hyphens, and alphanumeric characters
    if ! echo "$version" | grep -qE '^[a-zA-Z0-9.\-]+$'; then
        die "Invalid version string: $version. Version should only contain alphanumeric characters, dots, and hyphens."
    fi
}

# Check for major version upgrade and warn user
warn_major_upgrade() {
    old_version=$1
    new_version=$2

    if [ -z "$old_version" ] || [ -z "$new_version" ]; then
        return
    fi

    old_major=$(echo "$old_version" | cut -d. -f1)
    new_major=$(echo "$new_version" | cut -d. -f1)

    if [ "$old_major" != "$new_major" ]; then
        printf "\n"
        print_message "$YELLOW" "WARNING: This is a major version upgrade (v${old_major}.x.x -> v${new_major}.x.x)."
        print_message "$YELLOW" "Major version upgrades may include breaking changes."
        print_message "$YELLOW" "Please review the CHANGELOG before continuing:"
        print_message "$CYAN" "  https://github.com/aptos-labs/aptos-core/blob/main/crates/aptos/CHANGELOG.md"
        printf "\n"
    fi
}

# Backup the current CLI binary before overwriting (keeps only one backup)
backup_current_binary() {
    if [ -x "$BIN_DIR/$SCRIPT" ]; then
        backup_path="$BIN_DIR/$SCRIPT.backup"
        print_message "$CYAN" "Backing up current CLI binary to $backup_path..."
        cp "$BIN_DIR/$SCRIPT" "$backup_path" || die "Failed to backup current binary"
        print_message "$GREEN" "Backup complete. Use --undo to restore the previous version."
    fi
}

# Restore the previously backed up CLI binary
undo_upgrade() {
    backup_path="$BIN_DIR/$SCRIPT.backup"
    if [ ! -f "$backup_path" ]; then
        die "No backup found at $backup_path. Nothing to undo."
    fi

    print_message "$CYAN" "Restoring previous CLI version..."
    mv "$backup_path" "$BIN_DIR/$SCRIPT" || die "Failed to restore backup"
    chmod +x "$BIN_DIR/$SCRIPT"

    if "$BIN_DIR/$SCRIPT" --version >/dev/null 2>&1; then
        restored_version=$("$BIN_DIR/$SCRIPT" --version 2>/dev/null | awk '{print $NF}')
        print_message "$GREEN" "Successfully restored Aptos CLI version $restored_version."
    else
        print_message "$GREEN" "Previous CLI version restored."
    fi
}

# Sort version tags - with fallback for systems without GNU sort -V
sort_version_tags() {
    # Try GNU sort -V first, fall back to basic sort if not available
    if sort --version 2>/dev/null | grep -q "GNU"; then
        sort -V
    else
        # Fallback: basic sort (may not handle all version formats correctly)
        sort -t. -k1,1n -k2,2n -k3,3n 2>/dev/null || sort
    fi
}

# Install CLI from source
# Note: The minimal_cli_build.sh script handles installation of all required
# dependencies (Rust, build tools, etc.). Git is required to clone the repository.
install_from_source() {
    version=$1
    
    print_message "$CYAN" "Installing Aptos CLI from source..."
    
    # Validate version string if provided
    if [ -n "$version" ]; then
        validate_version "$version"
    fi
    
    # Create bin directory if it doesn't exist
    mkdir -p "$BIN_DIR"
    
    # Create temporary directory for building
    tmp_dir=$(mktemp -d)
    trap 'rm -rf "$tmp_dir"' EXIT
    
    print_message "$CYAN" "Cloning aptos-core repository..."
    
    if [ -n "$version" ]; then
        # Clone specific version
        print_message "$CYAN" "Checking out version $version..."
        retry_command git clone --depth 1 --branch "aptos-cli-v$version" "$APTOS_REPO_URL" "$tmp_dir/aptos-core" || die "Failed to clone aptos-core repository"
    else
        # Clone repository - use filter to reduce download size while still getting all tags
        # (shallow clones may miss tags if there have been many commits since the tag)
        retry_command git clone --filter=blob:none "$APTOS_REPO_URL" "$tmp_dir/aptos-core" || die "Failed to clone aptos-core repository"
        cd "$tmp_dir/aptos-core" || die "Failed to change directory to cloned repository"
        latest_tag=$(git tag -l 'aptos-cli-v*' | sort_version_tags | tail -1)
        if [ -z "$latest_tag" ]; then
            die "Could not find any aptos-cli release tags"
        fi
        version=$(echo "$latest_tag" | sed 's/aptos-cli-v//')
        
        # Check if the latest version is already installed (skip build if so)
        if [ "$FORCE" = false ]; then
            installed_version=""
            if [ -x "$BIN_DIR/$SCRIPT" ]; then
                installed_version=$("$BIN_DIR/$SCRIPT" --version 2>/dev/null | awk 'NF{print $NF}')
            fi
            if [ -n "$installed_version" ] && [ "$installed_version" = "$version" ]; then
                print_message "$GREEN" "Aptos CLI version $version is already installed. Use --force to rebuild."
                exit 0
            fi
            if [ -n "$installed_version" ]; then
                warn_major_upgrade "$installed_version" "$version"
            fi
        fi
        
        print_message "$CYAN" "Checking out $latest_tag..."
        git checkout "$latest_tag" || die "Failed to checkout $latest_tag"
    fi
    
    cd "$tmp_dir/aptos-core" || die "Failed to change directory to cloned repository"
    
    print_message "$CYAN" "Building Aptos CLI (this may take several minutes)..."
    
    # Ensure the minimal build script exists before attempting to run it
    if [ ! -f "./scripts/minimal_cli_build.sh" ]; then
        die "Build script ./scripts/minimal_cli_build.sh not found in cloned aptos-core repository"
    fi
    
    # Ensure the build script is executable
    chmod +x "./scripts/minimal_cli_build.sh" || die "Failed to make build script executable"
    
    # Build the CLI using the minimal build script
    ./scripts/minimal_cli_build.sh || die "Failed to build Aptos CLI"
    
    # Move the binary to the bin directory
    if [ -f "target/release/aptos" ]; then
        backup_current_binary
        mv "target/release/aptos" "$BIN_DIR/" || die "Failed to move binary to $BIN_DIR"
        chmod +x "$BIN_DIR/aptos"
        print_message "$GREEN" "Aptos CLI version $version installed successfully from source!"
    else
        die "Build succeeded but could not find the aptos binary"
    fi
}

# Get the latest version from GitHub API
get_latest_version() {
    local tmp_file="/tmp/releases.json"
    
    if command_exists curl; then
        retry_command curl -s "https://api.github.com/repos/aptos-labs/aptos-core/releases?per_page=100" -o "$tmp_file" || die "Failed to get latest version"
    elif command_exists wget; then
        retry_command wget -qO "$tmp_file" "https://api.github.com/repos/aptos-labs/aptos-core/releases?per_page=100" || die "Failed to get latest version"
    else
        die "Neither curl nor wget is installed. Please install one of them."
    fi
    
    grep -m 1 '"tag_name": "aptos-cli-v' "$tmp_file" | \
    cut -d'"' -f4 | \
    sed 's/aptos-cli-v//'
    
    rm -f "$tmp_file"
}

# Determine the target platform
get_target() {
    case "$(uname -s)" in
        Linux*)
            # Check for musl libc
            if ldd --version 2>&1 | grep -q musl; then
                die "MUSL libc is not supported. Please install from source."
            fi

            case "$(uname -m)" in
                x86_64|amd64)
                    if [ "$GENERIC_LINUX" = true ]; then
                        echo "Linux-x86_64"
                    else
                        # Check for Ubuntu version
                        if [ -f /etc/os-release ]; then
                            . /etc/os-release
                            case "$VERSION_ID" in
                                24.04*) echo "Ubuntu-24.04-x86_64" ;;
                                22.04*) echo "Ubuntu-22.04-x86_64" ;;
                                *) echo "Linux-x86_64" ;;
                            esac
                        else
                            echo "Linux-x86_64"
                        fi
                    fi
                    ;;
                aarch64|arm64)
                    echo "Linux-aarch64"
                    ;;
                *)
                    die "Unsupported architecture: $(uname -m)"
                    ;;
            esac
            ;;
        Darwin*)
            case "$(uname -m)" in
                x86_64|amd64)
                    echo "macos-x86_64"
                    ;;
                arm64|aarch64)
                    echo "macos-arm64"
                    ;;
                *)
                    die "Unsupported architecture: $(uname -m)"
                    ;;
            esac
            ;;
        *)
            die "Unsupported operating system: $(uname -s)"
            ;;
    esac
}

# Download and install the CLI
install_cli() {
    version=$1
    target=$2
    
    print_message "$CYAN" "Downloading Aptos CLI version $version for $target..."
    
    # Create bin directory if it doesn't exist
    mkdir -p "$BIN_DIR"
    
    # Download URL
    url="https://github.com/aptos-labs/aptos-core/releases/download/aptos-cli-v$version/aptos-cli-$version-$target.zip"
    
    # Create temporary directory
    tmp_dir=$(mktemp -d)
    trap 'rm -rf "$tmp_dir"' EXIT
    
    # Download and extract
    if command_exists curl; then
        retry_command curl -L "$url" -o "$tmp_dir/aptos-cli.zip" || die "Failed to download CLI binary"
    elif command_exists wget; then
        retry_command wget "$url" -O "$tmp_dir/aptos-cli.zip" || die "Failed to download CLI binary"
    else
        die "Neither curl nor wget is installed. Please install one of them."
    fi
    
    # Extract the zip file
    if command_exists unzip; then
        unzip -q "$tmp_dir/aptos-cli.zip" -d "$tmp_dir"
    else
        die "unzip is not installed. Please install it."
    fi
    
    # Backup current binary before overwriting
    backup_current_binary

    # Move the binary to the bin directory
    mv "$tmp_dir/aptos" "$BIN_DIR/"
    chmod +x "$BIN_DIR/aptos"
    
    print_message "$GREEN" "Aptos CLI installed successfully!"
}

# Main installation process
main() {
    # Parse command line arguments
    while [ $# -gt 0 ]; do
        case "$1" in
            -f|--force)
                FORCE=true
                shift
                ;;
            -y|--yes)
                ACCEPT_ALL=true
                shift
                ;;
            --bin-dir)
                BIN_DIR="$2"
                shift 2
                ;;
            --cli-version)
                VERSION="$2"
                shift 2
                ;;
            --generic-linux)
                GENERIC_LINUX=true
                shift
                ;;
            --from-source)
                FROM_SOURCE=true
                shift
                ;;
            --undo)
                UNDO=true
                shift
                ;;
            *)
                die "Unknown option: $1"
                ;;
        esac
    done

    # Handle undo (no packages or network needed)
    if [ "$UNDO" = true ]; then
        undo_upgrade
        exit 0
    fi

    # Install required packages
    install_required_packages
    
    # Handle installation from source
    if [ "$FROM_SOURCE" = true ]; then
        # Get version if specified, otherwise install_from_source will get latest
        if [ -n "$VERSION" ]; then
            # Check if CLI is already installed with this version
            if [ -x "$BIN_DIR/aptos" ] && [ "$FORCE" = false ]; then
                current_version=$("$BIN_DIR/aptos" --version | awk '{print $NF}')
                if [ "$current_version" = "$VERSION" ]; then
                    print_message "$YELLOW" "Aptos CLI version $VERSION is already installed."
                    exit 0
                fi
                warn_major_upgrade "$current_version" "$VERSION"
            fi
        fi
        
        install_from_source "$VERSION"
    else
        # Get version if not specified
        if [ -z "$VERSION" ]; then
            VERSION=$(get_latest_version)
        fi
        
        # Get target platform
        target=$(get_target)
        
        # Check if CLI is already installed
        if [ -x "$BIN_DIR/aptos" ] && [ "$FORCE" = false ]; then
            current_version=$("$BIN_DIR/aptos" --version | awk '{print $NF}')
            if [ "$current_version" = "$VERSION" ]; then
                print_message "$YELLOW" "Aptos CLI version $VERSION is already installed."
                exit 0
            fi
            warn_major_upgrade "$current_version" "$VERSION"
        fi
        
        # Install the CLI
        install_cli "$VERSION" "$target"
    fi
    
    # Add to PATH if not already there
    if ! echo "$PATH" | grep -q "$BIN_DIR"; then
        print_message "$YELLOW" "Adding $BIN_DIR to PATH..."
        case "$SHELL" in
            */fish)
                echo "set -U fish_user_paths $BIN_DIR \$fish_user_paths" >> "$HOME/.config/fish/config.fish"
                ;;
            *)
                echo "export PATH=\"$BIN_DIR:\$PATH\"" >> "$HOME/.profile"
                ;;
        esac
        print_message "$GREEN" "Please restart your terminal or run 'source ~/.profile' to update your PATH."
    fi
    
    # Test the installation
    print_message "$CYAN" "Testing the installation..."
    if "$BIN_DIR/aptos" --version >/dev/null 2>&1; then
        print_message "$GREEN" "Aptos CLI is working correctly!"
    else
        print_message "$RED" "There was a problem with the installation."
        exit 1
    fi
}

# Run the main function
main "$@" 