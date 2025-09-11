use colored::*;
use regex::Regex;
use std::fs;
use std::path::Path;
use walkdir::WalkDir;

/// Check if a URL should be excluded from localization
fn should_exclude_url(url: &str, locale: &str) -> bool {
    url.starts_with(&format!("/{}/", locale)) ||
    url.starts_with("http") ||
    url.starts_with("#") ||
    url.ends_with(".txt")
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("{}", "🔧 Fixing localized documentation links...".bright_cyan());

    let docs_dir = Path::new("./src/content/docs");
    
    if !docs_dir.exists() {
        eprintln!("{}", "❌ Error: Docs directory not found at ./src/content/docs".red());
        std::process::exit(1);
    }

    let mut total_files = 0;
    let mut modified_files = 0;
    let mut total_links_fixed = 0;

    // Smart locale detection - matches 2-letter codes with optional country codes
    let locale_regex = Regex::new(r"^[a-z]{2}(-[A-Z]{2})?$")?;
    
    // Regex to find markdown links that need fixing
    let link_regex = Regex::new(r"\[([^\]]*)\]\((/[^)#][^)]*)\)")?;
    
    // Regex to find LinkCard href attributes that need fixing
    let linkcard_regex = Regex::new(
        r##"(<LinkCard\s+[^>]*href=")(/[^"#][^"]*)"([^>]*>)"##
    )?;


    // Auto-discover locale directories
    let mut locales = Vec::new();
    for entry in fs::read_dir(docs_dir)? {
        let entry = entry?;
        let path = entry.path();
        
        if !path.is_dir() {
            continue;
        }
        
        let locale = path.file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("");
            
        if locale_regex.is_match(locale) {
            locales.push((locale.to_string(), path));
        }
    }

    if locales.is_empty() {
        println!("{}", "ℹ️  No locale directories found (looking for 2-letter codes like es, zh)".yellow());
        return Ok(());
    }

    // Sort locales for consistent output
    locales.sort_by(|a, b| a.0.cmp(&b.0));

    // Process each detected locale
    for (locale, locale_path) in locales {
        println!("{} {}", "🌍 Processing locale:".bright_green(), locale.bright_white());
        
        let mut locale_files = 0;
        let mut locale_modified = 0;
        let mut locale_links_fixed = 0;
        
        // Process all .mdx files in this locale
        for entry in WalkDir::new(&locale_path).into_iter().filter_map(|e| e.ok()) {
            let file_path = entry.path();
            
            if !file_path.extension().map_or(false, |ext| ext == "mdx") {
                continue;
            }
            
            total_files += 1;
            locale_files += 1;
            
            let content = match fs::read_to_string(file_path) {
                Ok(content) => content,
                Err(e) => {
                    eprintln!("  {} Failed to read {}: {}", "⚠️".yellow(), file_path.display(), e);
                    continue;
                }
            };
            
            let mut modified = false;
            let mut links_fixed_in_file = 0;
            
            // First, fix markdown links
            let content_after_markdown = link_regex.replace_all(&content, |caps: &regex::Captures| {
                let text = &caps[1];
                let url = &caps[2];
                
                // Skip if URL should be excluded from localization
                if should_exclude_url(url, &locale) {
                    return caps[0].to_string();
                }
                
                // Fix the link by adding locale prefix
                modified = true;
                links_fixed_in_file += 1;
                format!("[{}](/{}{})", text, locale, url)
            });
            
            // Then, fix LinkCard href attributes
            let new_content = linkcard_regex.replace_all(&content_after_markdown, |caps: &regex::Captures| {
                let before = &caps[1];
                let url = &caps[2];
                let after = &caps[3];
                
                // Skip if URL should be excluded from localization
                if should_exclude_url(url, &locale) {
                    return caps[0].to_string();
                }
                
                // Fix the LinkCard href by adding locale prefix
                modified = true;
                links_fixed_in_file += 1;
                format!("{}/{}{}\"{}",  before, locale, url, after)
            });
            
            if modified {
                match fs::write(file_path, new_content.as_ref()) {
                    Ok(_) => {
                        modified_files += 1;
                        locale_modified += 1;
                        total_links_fixed += links_fixed_in_file;
                        locale_links_fixed += links_fixed_in_file;
                        
                        let filename = file_path.file_name().unwrap().to_str().unwrap();
                        println!("  {} Fixed {} links in: {}", 
                            "✅".green(), 
                            links_fixed_in_file.to_string().bright_yellow(),
                            filename.bright_white()
                        );
                    }
                    Err(e) => {
                        eprintln!("  {} Failed to write {}: {}", "❌".red(), file_path.display(), e);
                    }
                }
            }
        }
        
        if locale_files > 0 {
            println!("  {} Locale summary: {}/{} files modified, {} links fixed ",
                "📊".bright_blue(),
                locale_modified.to_string().bright_yellow(),
                locale_files.to_string().bright_white(),
                locale_links_fixed.to_string().bright_yellow()
            );
        } else {
            println!("  {} No .mdx files found in {}", "ℹ️".yellow(), locale);
        }
        println!();
    }

    println!("{}", "🎉 Locale link fixing complete!".bright_green());
    println!("{}", "📊 Overall Summary:".bright_blue());
    println!("   - Total files processed: {}", total_files.to_string().bright_white());
    println!("   - Total files modified: {}", modified_files.to_string().bright_yellow());
    println!("   - Total links fixed: {}", total_links_fixed.to_string().bright_green());
    println!();
    println!("{}", "💡 Run pnpm build to verify the fixes resolved all locale inconsistency errors.".bright_cyan());

    if total_links_fixed == 0 {
        println!("All locale links are already correct!");
    }

    Ok(())
}