# Contributing Translations

This project uses a hybrid translation workflow that combines Crowdin's professional translation platform with direct GitHub contributions. This guide explains both approaches and helps you choose the best method for your contribution.

## Translation Workflow Overview

Our translation process combines AI-powered initial translations with human review and contributions through either Crowdin or GitHub:

1. New content is automatically pre-translated using Crowdin's AI / Machine Translation service
2. Translations can be reviewed and improved through:
   - Crowdin's web interface (recommended for larger contributions)
   - Direct GitHub pull requests (ideal for quick fixes)
3. All changes are synchronized between GitHub and Crowdin
4. Changes undergo review before being merged

## Option 1: Contributing via Crowdin (Recommended for Large Contributions)

Crowdin provides a professional translation interface with helpful features:

### Benefits

- Translation Memory suggestions
- Glossary support
- Built-in QA checks
- Context and screenshots
- Collaboration tools

### Getting Started with Crowdin

1. Visit our Crowdin project at `[Aptos Crowdin Project URL]`
2. Create a free Crowdin account
3. Join the project as a translator
4. Select your language and start translating

### Best Practices in Crowdin

- Use the Translation Memory for consistency
- Consult the project glossary for technical terms
- Leave comments for complex translations
- Use the QA checks to ensure quality

## Option 2: Contributing via GitHub (Best for Quick Fixes)

Direct GitHub contributions are perfect for:

- Small improvements
- Quick fixes
- Typo corrections
- Technical term updates

### GitHub Translation Process

1. Fork the repository
2. Create a new branch for your translations
3. Make your changes
4. Include `[translate]` in your commit message
5. Submit a pull request using the translation template

### GitHub Contribution Guidelines

1. **File Structure**: Maintain the existing file structure

   - Source files: `src/content/docs/**/*.md`
   - Translations: `src/content/docs/[language_code]/**/*.md`

2. **Formatting**

   - Preserve all Markdown formatting
   - Maintain all front matter
   - Keep all code blocks unchanged
   - Preserve all variables and placeholders

3. **Commit Messages**

   - Include `[translate]` to trigger Crowdin sync
   - Specify the language in the commit message
   - Example: `[translate] ja: Update installation guide`

4. **Pull Requests**
   - Use the translation PR template
   - Fill out all sections of the template
   - Link to related issues if applicable

## Translation Guidelines

### General Rules

1. **Accuracy**

   - Maintain the meaning of the original text
   - Preserve all technical information
   - Keep code examples unchanged

2. **Consistency**

   - Use consistent terminology
   - Follow existing translation patterns
   - Maintain consistent style and tone

3. **Technical Content**

   - Don't translate code snippets
   - Don't translate CLI commands
   - Don't translate configuration keys
   - Preserve all variables and placeholders

4. **Formatting**
   - Maintain all Markdown syntax
   - Preserve all links
   - Keep all front matter structures
   - Retain all HTML tags

### Language-Specific Guidelines

#### Chinese (简体中文)

- Use standard Simplified Chinese characters
- Follow Chinese technical writing conventions
- Maintain proper spacing around English words

#### Japanese (日本語)

- Use standard Japanese writing style
- Follow technical writing conventions
- Maintain proper spacing around English words
- Use appropriate keigo level

## Quality Assurance

All translations go through multiple quality checks:

1. **Automated Checks**

   - Format verification
   - Placeholder validation
   - Link checking
   - Syntax validation

2. **Manual Review**
   - Native speaker review
   - Technical accuracy check
   - Consistency verification
   - Context appropriateness

## Synchronization Process

Our automated workflow ensures all translations stay in sync:

1. **GitHub → Crowdin**

   - Source content updates
   - Direct translation contributions
   - Triggered by `[translate]` commits

2. **Crowdin → GitHub**
   - Professional translations
   - AI pre-translations
   - Daily automated sync

## Need Help?

- Join our community chat
- Check the [translation status dashboard](link-to-dashboard)
- Contact the maintainers
- Review existing translations for examples

## License

All contributions must be licensed under the same license as the project. By contributing translations, you agree to license your contributions under these terms.
