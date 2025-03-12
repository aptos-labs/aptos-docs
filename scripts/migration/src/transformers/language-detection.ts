import type { Root } from "mdast";
import type { TransformerOptions } from "../types/index.js";
import { logger } from "../utils/logger.js";

export class LanguageDetectionTransformer {
  // Threshold for considering content as English (percentage of ASCII characters)
  private readonly ENGLISH_THRESHOLD = 90;

  // Japanese-specific particles and common characters to check for
  private readonly JA_MARKERS = [
    "は",
    "が",
    "の",
    "に",
    "を",
    "で",
    "と",
    "も",
    "から",
    "まで",
    "です",
    "ます",
  ];
  // Chinese-specific characters and patterns to check for
  private readonly ZH_MARKERS = [
    "的",
    "了",
    "和",
    "是",
    "在",
    "这",
    "有",
    "个",
    "我",
    "们",
    "你",
    "他",
  ];

  transform(ast: Root, options: TransformerOptions): boolean {
    // Always keep English content
    if (!options.language || options.language === "en") {
      return true;
    }

    // Get the raw content for analysis
    const content = this.getContentForAnalysis(ast);

    // Calculate language metrics
    const metrics = this.analyzeContent(content, options.language);

    // Log the analysis results
    logger.log("LanguageDetection", `File analysis for ${options.filePath}:`, {
      asciiPercentage: metrics.asciiPercentage.toFixed(2) + "%",
      languageMarkerCount: metrics.languageMarkerCount,
      hasNonAsciiTitle: metrics.hasNonAsciiTitle,
    });

    // Decision logic
    const shouldKeep = this.shouldKeepContent(metrics);

    if (!shouldKeep) {
      logger.log(
        "LanguageDetection",
        `Skipping file that appears to be English: ${options.filePath}`,
        {
          language: options.language,
          metrics,
        },
      );
    }

    return shouldKeep;
  }

  private getContentForAnalysis(ast: Root): string {
    // Convert AST back to text for analysis, excluding frontmatter and imports
    let content = "";
    let inFrontmatter = false;

    for (const node of ast.children) {
      if (node.type === "yaml") {
        // Store frontmatter separately for title analysis
        content += node.value + "\n";
      } else if (node.type === "mdxjsEsm") {
        // Skip imports
        continue;
      } else if (node.type === "text") {
        content += node.value + "\n";
      } else if ("value" in node) {
        content += (node as any).value + "\n";
      }
    }

    return content;
  }

  private analyzeContent(
    content: string,
    language: string,
  ): {
    asciiPercentage: number;
    languageMarkerCount: number;
    hasNonAsciiTitle: boolean;
  } {
    // Remove code blocks as they're likely to contain ASCII regardless of language
    const contentWithoutCode = content.replace(/```[\s\S]*?```/g, "");

    // Count characters
    const nonAsciiChars = contentWithoutCode.replace(/[\x00-\x7F]/g, "").length;
    const totalChars = contentWithoutCode.replace(/\s/g, "").length || 1;
    const asciiPercentage = ((totalChars - nonAsciiChars) / totalChars) * 100;

    // Check for language-specific markers
    const markers = language === "ja" ? this.JA_MARKERS : this.ZH_MARKERS;
    const languageMarkerCount = markers.reduce(
      (count, marker) => count + (content.match(new RegExp(marker, "g")) || []).length,
      0,
    );

    // Check if title contains non-ASCII characters
    const titleMatch = content.match(/title:\s*["']([^"']+)["']/);
    const hasNonAsciiTitle = titleMatch ? /[^\x00-\x7F]/.test(titleMatch[1]) : false;

    return {
      asciiPercentage,
      languageMarkerCount,
      hasNonAsciiTitle,
    };
  }

  private shouldKeepContent(metrics: {
    asciiPercentage: number;
    languageMarkerCount: number;
    hasNonAsciiTitle: boolean;
  }): boolean {
    // Keep if:
    // 1. Title contains non-ASCII characters
    if (metrics.hasNonAsciiTitle) {
      return true;
    }

    // 2. Has significant language-specific markers
    if (metrics.languageMarkerCount >= 3) {
      return true;
    }

    // 3. Has significant non-ASCII content
    if (metrics.asciiPercentage < this.ENGLISH_THRESHOLD) {
      return true;
    }

    // Otherwise, likely English content
    return false;
  }
}
