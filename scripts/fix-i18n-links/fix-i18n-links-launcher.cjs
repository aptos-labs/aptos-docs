#!/usr/bin/env node

const { execSync } = require("child_process");
const os = require("os");
const path = require("path");
const fs = require("fs");

function getBinaryPath() {
  const platform = os.platform();
  const arch = os.arch();

  // Determine the correct binary based on platform and architecture
  let binaryName;

  if (platform === "darwin") {
    // macOS
    if (arch === "arm64") {
      binaryName = "fix-i18n-links-macos-arm64";
    } else {
      binaryName = "fix-i18n-links-macos-intel";
    }
  } else if (platform === "win32") {
    // Windows
    binaryName = "fix-i18n-links-windows.exe";
  } else {
    // Linux and others
    binaryName = "fix-i18n-links-linux";
  }

  const binaryPath = path.join(__dirname, "bin", binaryName);

  // Check if the binary exists
  if (fs.existsSync(binaryPath)) {
    return binaryPath;
  }

  // Fallback: try to find any available binary
  const fallbacks = [
    "fix-i18n-links-macos-arm64",
    "fix-i18n-links-macos-intel",
    "fix-i18n-links-linux",
    "fix-i18n-links-windows.exe",
  ];

  for (const fallback of fallbacks) {
    const fallbackPath = path.join(__dirname, "bin", fallback);
    if (fs.existsSync(fallbackPath)) {
      console.log(`⚠️  Using fallback binary: ${fallback}`);
      return fallbackPath;
    }
  }

  return null;
}

function showBuildInstructions() {
  const platform = os.platform();
  const arch = os.arch();

  console.log("");
  console.log("🛠️  No compatible binary found for your platform.");
  console.log(`   Platform: ${platform}-${arch}`);
  console.log("");
  console.log("📋 To build a binary for your platform:");
  console.log("   1. Install Rust: https://rustup.rs/");
  console.log("   2. cd scripts/fix-i18n-links");
  console.log("   3. cargo build --release");
  console.log(`   4. cp target/release/fix-i18n-links bin/fix-i18n-links-${platform}-${arch}`);
  console.log("   5. Run pnpm fix-i18n-links again");
  console.log("");
  console.log("🤝 Consider contributing the binary back to the project!");
  console.log("");
}

function main() {
  const binaryPath = getBinaryPath();

  if (binaryPath) {
    try {
      // Make sure the binary is executable
      execSync(`chmod +x "${binaryPath}"`);

      // Run the binary
      execSync(`"${binaryPath}"`, {
        stdio: "inherit",
        cwd: process.cwd(),
      });
    } catch (error) {
      console.error(`❌ Binary failed (${path.basename(binaryPath)}):`, error.message);
      showBuildInstructions();
      process.exit(1);
    }
  } else {
    showBuildInstructions();
    process.exit(1);
  }
}

main();
