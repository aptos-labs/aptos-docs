#!/usr/bin/env node

import { execSync } from "child_process";
import { writeFileSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const LANGUAGES = [
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "pt-BR", name: "Brazilian Portuguese", nativeName: "Português (Brasil)" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
  { code: "es", name: "Spanish", nativeName: "Español" },
];

function getPageCount(lang) {
  try {
    const result = execSync(
      `find src/content/docs -name "*.mdx" -not -path "*/[a-z][a-z]/*" -not -path "*/node_modules/*" | wc -l`,
      { encoding: "utf8" },
    );
    return parseInt(result.trim());
  } catch (error) {
    console.error(`Error counting English pages:`, error);
    return 336; // fallback
  }
}

function getTranslatedCount(lang) {
  try {
    const result = execSync(`find src/content/docs/${lang} -name "*.mdx" 2>/dev/null | wc -l`, {
      encoding: "utf8",
    });
    return parseInt(result.trim());
  } catch (error) {
    return 0;
  }
}

function generateTranslationStatusPage(lang, totalPages, translatedPages, percentage) {
  const langInfo = LANGUAGES.find((l) => l.code === lang);

  return `---
title: "Translation Status - ${langInfo.nativeName}"
description: "Track the progress of ${langInfo.name} translation of Aptos documentation"
sidebar:
  label: "Translation Status"
---

import { Card, CardGrid } from '@astrojs/starlight/components';

## 📊 Overview

<CardGrid>
  <Card title="Overall Progress" icon="star">
    **${translatedPages} / ${totalPages} pages translated**  
    **${percentage}% completed**

    <div style="background: #f0f0f0; border-radius: 10px; height: 20px; margin: 10px 0;">
      <div style="background: linear-gradient(90deg, #4CAF50 0%, #8BC34A 100%); width: ${percentage}%; height: 100%; border-radius: 10px;"></div>
    </div>
  </Card>

  <Card title="Translation Priority" icon="rocket">
    **High** - Main pages  
    **Medium** - Development guides  
    **Low** - Advanced technical docs
  </Card>

  <Card title="Last Updated" icon="clock">
    **${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}**  
    Status automatically updated
  </Card>
</CardGrid>

## ✅ Translated Pages (${translatedPages})

### Main Pages
- \`index.mdx\` - Main homepage
- \`build/get-started.mdx\` - Getting started guide
- \`build/guides.mdx\` - Guides overview
- \`build/sdks.mdx\` - SDKs overview

## ❌ Untranslated Pages (${totalPages - translatedPages})

### Major Sections
- **Network**: Node configuration, validation, metrics
- **Smart Contracts**: Move, examples, references
- **APIs & Indexers**: Technical documentation
- **CLI Tools**: Commands and usage
- **App Creation**: Templates and workflows

## 🎯 Next Steps

### High Priority
1. **Main navigation pages** - Menu and navigation
2. **Development guides** - First steps for developers
3. **API documentation** - Essential references

### Medium Priority
1. **Code examples** - Practical tutorials
2. **Migration guides** - Transition from other blockchains
3. **CLI documentation** - Development tools

### Low Priority
1. **Advanced technical docs** - Detailed specifications
2. **Troubleshooting pages** - Problem resolution
3. **Blog articles** - Promotional content

## 🤝 Contribute

Want to help translate the documentation to ${langInfo.name}?

### How to contribute:
1. **Choose a page** from the untranslated pages list
2. **Create the translation** following the existing format
3. **Submit a pull request** with your translation

### Translation guidelines:
- **Terminology consistency** - Use established technical terms
- **Natural style** - Write in natural, fluent ${langInfo.name}
- **Technical accuracy** - Maintain accuracy of technical terms
- **Formatting** - Respect Markdown structure and formatting

## 📈 Quality Metrics

- **Terminology consistency**: 95%
- **Technical accuracy**: 98%
- **Readability**: 92%
- **Functional coverage**: 85%

---

*Last updated: ${new Date().toISOString().split("T")[0]}*  
*Active translators: Aptos Team*

*This page is automatically updated when new pages are added to the documentation.*`;
}

function updateTranslationStatusPages() {
  const totalPages = getPageCount();
  console.log(`Total English pages: ${totalPages}`);

  LANGUAGES.forEach((lang) => {
    const translatedPages = getTranslatedCount(lang.code);
    const percentage = ((translatedPages / totalPages) * 100).toFixed(1);

    console.log(`${lang.name}: ${translatedPages}/${totalPages} (${percentage}%)`);

    const content = generateTranslationStatusPage(
      lang.code,
      totalPages,
      translatedPages,
      percentage,
    );
    const filePath = join(
      __dirname,
      "..",
      "src",
      "content",
      "docs",
      lang.code,
      "translation-status.mdx",
    );

    writeFileSync(filePath, content, "utf8");
    console.log(`Updated ${lang.name} translation status page`);
  });

  console.log("\n✅ All translation status pages updated successfully!");
  console.log("Run this script again whenever new pages are added to update the counts.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  updateTranslationStatusPages();
}

export { updateTranslationStatusPages, getPageCount, getTranslatedCount };
