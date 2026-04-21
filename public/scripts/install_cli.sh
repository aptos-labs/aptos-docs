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

# --- Inline system package install (replaces external universal-installer) ---
# Used only to install unzip when it is missing from PATH.

get_package_manager() {
    case "$(uname -s)" in
        Darwin)
            if command_exists brew; then
                echo brew
            elif command_exists port; then
                echo port
            else
                die "unzip is required. Install Homebrew (https://brew.sh/) or MacPorts (https://www.macports.org/), then run this script again."
            fi
            ;;
        Linux)
            if command_exists dnf; then
                echo dnf
            elif command_exists yum; then
                echo yum
            elif command_exists apt-get; then
                echo apt-get
            elif command_exists pacman; then
                echo pacman
            elif command_exists apk; then
                echo apk
            elif command_exists zypper; then
                echo zypper
            elif command_exists emerge; then
                echo emerge
            elif command_exists xbps-install; then
                echo xbps
            else
                die "unzip is required. Install unzip with your distribution package manager, then run this script again."
            fi
            ;;
        FreeBSD)
            if command_exists pkg; then
                echo pkg
            else
                die "unzip is required. Install pkg (https://docs.freebsd.org/en/books/handbook/ports/) and unzip, then run this script again."
            fi
            ;;
        OpenBSD)
            if command_exists pkg_add || command_exists pkg_info; then
                echo pkg_add
            else
                die "unzip is required. Install pkg_add/unzip on OpenBSD (https://www.openbsd.org/faq/faq15.html), then run this script again."
            fi
            ;;
        NetBSD)
            if command_exists pkgin; then
                echo pkgin
            elif command_exists pkg_add; then
                echo pkg_add
            else
                die "unzip is required. Install unzip with pkgin or pkg_add (https://www.netbsd.org/docs/pkgsrc/), then run this script again."
            fi
            ;;
        *)
            die "Unsupported OS for automatic unzip install: $(uname -s). Install unzip manually, then run this script again."
            ;;
    esac
}

is_system_package_installed() {
    pkg=$1
    pm=$2

    case "$pm" in
        yum|dnf)
            rpm -q "$pkg" >/dev/null 2>&1
            ;;
        apt-get)
            dpkg -l "$pkg" 2>/dev/null | grep -q '^ii'
            ;;
        pacman)
            pacman -Q "$pkg" >/dev/null 2>&1
            ;;
        apk)
            apk info -e "$pkg" >/dev/null 2>&1
            ;;
        brew)
            brew list "$pkg" >/dev/null 2>&1
            ;;
        port)
            port installed "$pkg" >/dev/null 2>&1
            ;;
        xbps)
            xbps-query "$pkg" >/dev/null 2>&1
            ;;
        pkg)
            pkg info "$pkg" >/dev/null 2>&1
            ;;
        emerge)
            portageq best_version / "$pkg" >/dev/null 2>&1
            ;;
        zypper)
            zypper se -i "$pkg" >/dev/null 2>&1
            ;;
        pkgin)
            pkgin -Q "$pkg" >/dev/null 2>&1
            ;;
        pkg_add)
            pkg_info -q "$pkg" >/dev/null 2>&1
            ;;
        *)
            return 1
            ;;
    esac
}

install_system_package() {
    pkg=$1
    pm=$(get_package_manager)

    if is_system_package_installed "$pkg" "$pm"; then
        return 0
    fi

    pre_cmd=""
    if [ "$(id -u)" -ne 0 ]; then
        if command_exists sudo; then
            pre_cmd="sudo"
        elif command_exists doas; then
            pre_cmd="doas"
        fi
    fi

    # Package managers that typically need root when not already root
    requires_privileges=false
    case "$pm" in
        yum|dnf|apt-get|zypper|emerge|pacman|apk|xbps|pkg|pkgin|pkg_add|port)
            requires_privileges=true
            ;;
    esac
    if [ "$(id -u)" -ne 0 ] && [ -z "$pre_cmd" ] && [ "$requires_privileges" = true ]; then
        die "Installing system package '$pkg' with '$pm' requires root privileges. Re-run this script as root or install and configure sudo or doas."
    fi

    print_message "$YELLOW" "Installing $pkg using $pm..."
    case "$pm" in
        yum)
            $pre_cmd yum install "$pkg" -y || die "Failed to install package: $pkg"
            ;;
        dnf)
            $pre_cmd dnf install "$pkg" -y || die "Failed to install package: $pkg"
            ;;
        apt-get)
            if [ -n "$pre_cmd" ]; then
                $pre_cmd apt-get update -qq || true
            else
                apt-get update -qq || true
            fi
            $pre_cmd apt-get install "$pkg" --no-install-recommends -y || die "Failed to install package: $pkg"
            ;;
        zypper)
            $pre_cmd zypper install -y "$pkg" || die "Failed to install package: $pkg"
            ;;
        emerge)
            $pre_cmd emerge "$pkg" || die "Failed to install package: $pkg"
            ;;
        port)
            if [ "$(id -u)" -eq 0 ]; then
                port install "$pkg" || die "Failed to install package: $pkg"
            else
                $pre_cmd port install "$pkg" || die "Failed to install package: $pkg"
            fi
            ;;
        brew)
            brew install "$pkg" || die "Failed to install package: $pkg"
            ;;
        pacman)
            $pre_cmd pacman -S "$pkg" --noconfirm || die "Failed to install package: $pkg"
            ;;
        apk)
            $pre_cmd apk --update add --no-cache "$pkg" || die "Failed to install package: $pkg"
            ;;
        xbps)
            $pre_cmd xbps-install -y "$pkg" || die "Failed to install package: $pkg"
            ;;
        pkg)
            $pre_cmd pkg install -y "$pkg" || die "Failed to install package: $pkg"
            ;;
        pkgin)
            $pre_cmd pkgin install "$pkg" || die "Failed to install package: $pkg"
            ;;
        pkg_add)
            if [ "$(id -u)" -eq 0 ]; then
                pkg_add -I "$pkg" || die "Failed to install package: $pkg"
            else
                $pre_cmd pkg_add -I "$pkg" || die "Failed to install package: $pkg"
            fi
            ;;
        *)
            die "Unsupported package manager: $pm"
            ;;
    esac
}

# Install unzip if not present (needed to extract CLI release zips)
install_required_packages() {
    if command_exists unzip; then
        return 0
    fi
    install_system_package unzip
}

# Validate version string contains only safe characters
validate_version() {
    version=$1
    # Allow digits, dots, hyphens, and alphanumeric characters
    if ! echo "$version" | grep -qE '^[a-zA-Z0-9.\-]+$'; then
        die "Invalid version string: $version. Version should only contain alphanumeric characters, dots, and hyphens."
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
    
    # Move the binary to the bin directory
    mv "$tmp_dir/aptos" "$BIN_DIR/"
    chmod +x "$BIN_DIR/aptos"
    
    print_message "$GREEN" "Aptos CLI installed successfully!"
}

# Main installation process
main() {
    # Install required packages first
    install_required_packages

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
            *)
                die "Unknown option: $1"
                ;;
        esac
    done
    
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