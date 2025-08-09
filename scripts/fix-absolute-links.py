#!/usr/bin/env python3
"""
Script to fix absolute links in all documentation to use relative paths.
Handles Spanish (es), Chinese (zh), and English (en) documentation.
Converts /build/... and /network/... links to relative paths based on file depth.

Usage:
    python3 scripts/fix-absolute-links.py

This script will:
1. Find all .mdx files in src/content/docs/
2. Convert absolute links (starting with /build or /network) to relative paths
3. Calculate the correct number of ../ based on each file's directory depth
4. Update files in place with proper relative links
"""

import os
import re
import glob

def count_depth_from_docs(file_path):
    """Count how many directories deep a file is from src/content/docs/"""
    # Remove the base path
    relative_path = file_path.replace('src/content/docs/', '')
    # Count directory separators
    return relative_path.count('/')

def fix_links_in_file(file_path):
    """Fix absolute links in a single file."""
    depth = count_depth_from_docs(file_path)
    
    # Calculate the number of ../ needed to get back to the docs root
    # For files at any depth, we need depth+1 ../ to get to docs/
    dots_needed = depth + 1
    prefix = '../' * dots_needed
    
    print(f"Processing {file_path} (depth: {depth}, prefix: {prefix})")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Pattern to match absolute links: ](/build/...) or ](/network/...)
        # This matches markdown links that start with absolute paths
        pattern = r'\]\((/(?:build|network)[^)]*)\)'
        
        def replace_link(match):
            absolute_path = match.group(1)  # e.g., "/build/indexer/indexer-api"
            # Remove leading slash and add relative prefix
            relative_path = absolute_path.lstrip('/')
            return f']({prefix}{relative_path})'
        
        content = re.sub(pattern, replace_link, content)
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  ✓ Updated {file_path}")
            return True
        else:
            print(f"  - No changes needed in {file_path}")
            return False
    
    except Exception as e:
        print(f"  ✗ Error processing {file_path}: {e}")
        return False

def process_language(lang_code, lang_name):
    """Process all files for a specific language."""
    if lang_code:
        pattern = f'src/content/docs/{lang_code}/**/*.mdx'
        print(f"\n=== Processing {lang_name} ({lang_code}) Documentation ===")
    else:
        # For English, we need to exclude the language-specific directories
        pattern = 'src/content/docs/**/*.mdx'
        print(f"\n=== Processing {lang_name} Documentation ===")
    
    files = glob.glob(pattern, recursive=True)
    
    # For English, filter out files that are in language-specific directories
    if not lang_code:
        files = [f for f in files if not any(f.startswith(f'src/content/docs/{lc}/') for lc in ['es', 'zh'])]
    
    print(f"Found {len(files)} {lang_name} documentation files to process...")
    
    updated_count = 0
    for file_path in sorted(files):
        if fix_links_in_file(file_path):
            updated_count += 1
    
    print(f"Completed {lang_name}! Updated {updated_count} out of {len(files)} files.")
    return updated_count, len(files)

def main():
    """Main function to process all documentation languages."""
    print("🔗 Aptos Documentation Link Fixer")
    print("================================")
    print("Converting absolute links to relative paths across all languages...")
    
    total_updated = 0
    total_files = 0
    
    # Process Spanish documentation
    updated, total = process_language('es', 'Spanish')
    total_updated += updated
    total_files += total
    
    # Process Chinese documentation
    updated, total = process_language('zh', 'Chinese')
    total_updated += updated
    total_files += total
    
    # Process English documentation (everything not in language-specific directories)
    updated, total = process_language(None, 'English')
    total_updated += updated
    total_files += total
    
    print(f"\n🎉 ALL COMPLETED!")
    print(f"📊 Summary: Updated {total_updated} out of {total_files} total files across all languages.")
    
    if total_updated > 0:
        print(f"\n✅ Successfully converted {total_updated} files with absolute links to relative paths.")
        print("💡 Remember to run 'npm run lint' and 'npm run check' to verify everything is working correctly.")
    else:
        print(f"\n✨ All files already have proper relative links! No changes were needed.")

if __name__ == '__main__':
    main() 