# Package Size Analysis: Commit 77249a072

## Summary

**The `firebase` package update from v12.7.0 to v12.8.0 is the primary cause of exceeding the Vercel 5MB serverless function limit.** Specifically, the transitive dependency `@firebase/firestore` jumped from v4.9.3 to v4.10.0, which introduced a new "Pipelines" feature that nearly doubled the package size (+21.6MB).

## Commit Details

- **Commit:** `77249a072c896738d8d39d3a3ce592f54ab207d1`
- **Message:** `[deps] update deps`
- **Author:** Greg Nazario
- **Date:** Tue Jan 20 14:23:17 2026

## Root Cause: `firebase` 12.7.0 → 12.8.0

### Package Size Comparison (all updated packages)

| Package            | Before (KB) | After (KB) | Delta (KB) |
| ------------------ | ----------- | ---------- | ---------- |
| **firebase**       | **32,816**  | **38,464** | **+5,648** |
| @iconify/json      | 398,752     | 399,128    | +376       |
| @scalar/api-client | 8,980       | 9,036      | +56        |
| shiki              | 2,184       | 2,204      | +20        |
| @astrojs/sitemap   | 96          | 104        | +8         |
| @astrojs/starlight | 1,680       | 1,684      | +4         |
| @astrojs/vercel    | 200         | 204        | +4         |
| astro              | 6,068       | 6,036      | -32        |
| astro-mermaid      | 52          | 48         | -4         |
| mermaid            | 66,396      | 66,396     | 0          |
| @swc/core          | 152         | 152        | 0          |

### The Specific Sub-Dependency: `@firebase/firestore`

`firebase@12.8.0` bumped `@firebase/firestore` from v4.9.3 to v4.10.0:

| Sub-package             | v4.9.3 (KB) | v4.10.0 (KB) | Delta (KB)  |
| ----------------------- | ----------- | ------------ | ----------- |
| **@firebase/firestore** | **27,680**  | **49,276**   | **+21,596** |

This is a **+78% size increase** in a single sub-dependency.

### What Changed in @firebase/firestore 4.10.0

The v4.10.0 release introduced **Firestore Pipelines**, a new query API. This added:

1. **New `dist/intermediate/` directory:** +14,152KB (did not exist in 4.9.3)
2. **Expanded `dist/lite/` directory:** 8,492KB → 13,260KB (+4,768KB)
3. **New `dist/firestore/` expansion:** 2,296KB → 3,020KB (+724KB)
4. **New pipeline bundle files at the `firebase` top level:**
   - `firebase-firestore-pipelines.js` (506KB) + map (2,909KB)
   - `firebase-firestore-lite-pipelines.js` (124KB) + map (1,006KB)

### Impact on Vercel Serverless Functions

The project only uses `firebase/app` and `firebase/auth` (not Firestore), but because `firebase` is a monolithic package, the overall package size increase affects the serverless function bundle. The Vercel serverless function limit is **5MB per function**, and this update pushed the deployed function over that threshold.

## Actual Firebase Usage in This Project

The codebase only imports from two Firebase modules:

```typescript
// src/lib/firebase/app.ts
import { initializeApp } from "firebase/app";

// src/lib/firebase/auth.ts
import { getAuth, type Auth } from "firebase/auth";
```

No Firestore functionality is used.

## Recommendations

1. **Pin `firebase` to `12.7.0`** as an immediate fix to stay under the limit.
2. **Consider using individual Firebase packages** (`@firebase/app`, `@firebase/auth`) instead of the monolithic `firebase` package to avoid pulling in unused modules like Firestore.
3. **Add bundle size monitoring** to CI/CD to catch regressions early.
4. **Review the `fileSizeCheckIntegration`** (already in the project at `src/integrations/fileSizeCheck.ts`) - ensure it runs and fails the build when the 5MB limit is exceeded.

## All Package Changes in the Commit

### Dependencies (runtime)

| Package            | Before      | After       |
| ------------------ | ----------- | ----------- |
| @astrojs/node      | ^9.5.1      | ^9.5.2      |
| @astrojs/sitemap   | ^3.6.0      | ^3.7.0      |
| @astrojs/starlight | ^0.37.1     | ^0.37.3     |
| @astrojs/vercel    | ^9.0.2      | ^9.0.4      |
| @iconify/json      | ^2.2.425    | ^2.2.430    |
| astro              | ^5.16.6     | ^5.16.11    |
| astro-mermaid      | ^1.2.0      | ^1.3.1      |
| **firebase**       | **^12.7.0** | **^12.8.0** |

### DevDependencies

| Package                                      | Before  | After    |
| -------------------------------------------- | ------- | -------- |
| @crowdin/cli                                 | ^4.12.0 | ^4.13.0  |
| @expressive-code/plugin-collapsible-sections | ^0.41.5 | ^0.41.6  |
| @readme/openapi-parser                       | ^5.4.0  | ^5.5.0   |
| @scalar/api-client                           | ^2.17.1 | ^2.18.4  |
| @scalar/snippetz                             | ^0.6.1  | ^0.6.5   |
| @swc/core                                    | ^1.15.8 | ^1.15.10 |
| @types/node                                  | ^25.0.3 | ^25.0.9  |
| @types/react                                 | ^19.2.7 | ^19.2.9  |
| @vercel/node                                 | ^5.5.16 | ^5.5.25  |
| baseline-browser-mapping                     | ^2.9.11 | ^2.9.16  |
| prettier                                     | ^3.7.4  | ^3.8.0   |
| shiki                                        | ^3.20.0 | ^3.21.0  |
| typescript-eslint                            | ^8.52.0 | ^8.53.1  |
| vite                                         | ^7.3.0  | ^7.3.1   |

### New Override

- `diff`: `>=8.0.3` (added)
