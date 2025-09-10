#!/bin/bash

# Build script for fix-i18n-links
# Usage: ./build.sh [--mac-arm|--mac-intel|--linux|--windows]

echo "🔧 Building fix-i18n-links..."

# Change to the script directory
cd "$(dirname "$0")"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf target/
rm -f bin/fix-i18n-links*

case "$1" in
    --mac-arm)
        echo "🍎 Building for macOS Apple Silicon..."
        ~/.cargo/bin/cargo build --release --target aarch64-apple-darwin
        cp target/aarch64-apple-darwin/release/fix-i18n-links bin/fix-i18n-links-macos-arm64
        ;;
    --mac-intel)
        echo "🍎 Building for macOS Intel..."
        ~/.cargo/bin/cargo build --release --target x86_64-apple-darwin
        cp target/x86_64-apple-darwin/release/fix-i18n-links bin/fix-i18n-links-macos-intel
        ;;
    --linux)
        echo "🐧 Building for Linux..."
        CC_x86_64_unknown_linux_musl=x86_64-linux-musl-gcc \
        CARGO_TARGET_X86_64_UNKNOWN_LINUX_MUSL_LINKER=x86_64-linux-musl-gcc \
        ~/.cargo/bin/cargo build --release --target x86_64-unknown-linux-musl
        cp target/x86_64-unknown-linux-musl/release/fix-i18n-links bin/fix-i18n-links-linux
        ;;
    --windows)
        echo "🪟 Building for Windows..."
        ~/.cargo/bin/cargo build --release --target x86_64-pc-windows-gnu
        cp target/x86_64-pc-windows-gnu/release/fix-i18n-links.exe bin/fix-i18n-links-windows.exe
        ;;
    "")
        echo "🏠 Auto-detecting current platform..."
        
        # Detect platform and build accordingly
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            if [[ $(uname -m) == "arm64" ]]; then
                echo "🍎 Detected macOS Apple Silicon"
                ~/.cargo/bin/cargo build --release
                cp target/release/fix-i18n-links bin/fix-i18n-links-macos-arm64
            else
                echo "🍎 Detected macOS Intel"
                ~/.cargo/bin/cargo build --release
                cp target/release/fix-i18n-links bin/fix-i18n-links-macos-intel
            fi
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            echo "🐧 Detected Linux"
            ~/.cargo/bin/cargo build --release
            cp target/release/fix-i18n-links bin/fix-i18n-links-linux
        elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
            echo "🪟 Detected Windows"
            ~/.cargo/bin/cargo build --release
            cp target/release/fix-i18n-links.exe bin/fix-i18n-links-windows.exe
        else
            echo "❓ Unknown platform: $OSTYPE"
            echo "Building with default settings..."
            ~/.cargo/bin/cargo build --release
            # Try to copy with the most likely naming convention
            if [[ -f target/release/fix-i18n-links.exe ]]; then
                cp target/release/fix-i18n-links.exe bin/fix-i18n-links-windows.exe
            else
                cp target/release/fix-i18n-links bin/fix-i18n-links-linux
            fi
        fi
        ;;
    *)
        echo "❌ Unknown option: $1"
        echo ""
        echo "Usage: ./build.sh [--mac-arm|--mac-intel|--linux|--windows]"
        echo "  (no flag)    Auto-detect current platform"
        echo "  --mac-arm    Build for macOS Apple Silicon"
        echo "  --mac-intel  Build for macOS Intel"
        echo "  --linux      Build for Linux"
        echo "  --windows    Build for Windows"
        exit 1
        ;;
esac

echo ""
echo "🎉 Build complete!"
echo "📊 Binary size:"
ls -lh bin/fix-i18n-links* 2>/dev/null

echo ""
echo "💡 Test with: pnpm fix-i18n-links"