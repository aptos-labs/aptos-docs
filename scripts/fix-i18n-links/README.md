# fix-i18n-links

A high-performance Rust tool for automatically fixing localized documentation links in Aptos docs.

## Problem

Localized documentation (Spanish, Chinese, etc.) often contains internal links that lack proper locale prefixes. For example, a link to `/guide/setup` in Spanish docs should be `/es/guide/setup`.

## Solution

This tool automatically scans localized `.mdx` files and adds the appropriate locale prefixes to internal links, while preserving:

- External links (starting with `http`)
- Anchor links (starting with `#`)
- Links that already have locale prefixes
- `.txt` files (like `llms.txt`) that should remain unlocalized

## Building

**First time setup:** You need to build the tool before using it:

```bash
cd scripts/fix-i18n-links
./build.sh
```

This auto-detects and builds for your current platform. You can also specify a platform:

- `./build.sh --mac-arm` - macOS Apple Silicon
- `./build.sh --mac-intel` - macOS Intel
- `./build.sh --linux` - Linux
- `./build.sh --windows` - Windows

## Usage

After building, run the tool:

```bash
pnpm fix-i18n-links
```

The tool will:

1. Auto-discover locale directories (e.g., `es/`, `zh/`)
2. Process all `.mdx` files in each locale
3. Fix internal links by adding locale prefixes
4. Report the number of files and links fixed

## Performance

This Rust implementation is significantly faster than shell-based alternatives, especially when processing large documentation sets with hundreds of files.
