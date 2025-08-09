# Aptos Documentation Performance Improvement Plan

Based on a comprehensive analysis of the Aptos documentation codebase, this plan outlines specific performance improvements to enhance the site's speed, responsiveness, and build efficiency.

## 1. Image Optimization

### High Priority

- **Enhance ThemedImage Component**
  - Add quality parameter to control image optimization level
  - Implement responsive image support with srcset and sizes attributes
  - Add support for modern image formats (AVIF, WebP) with fallbacks
  - Implement conditional loading strategy that only loads the current theme's image initially

```typescript
// Example implementation in ThemedImage.astro
<Image
  src={lightSrc as ImageMetadata}
  alt={alt}
  width={width}
  height={height}
  loading={loading}
  decoding={decoding}
  format={format || "webp"}
  quality={quality || 80}
  class={`light:sl-block dark:sl-hidden ${className}`}
  densities={[1, 2]}
  sizes={sizes || "100vw"}
/>
```

- **Update Badge Images**
  - Convert all HTTP badge URLs to HTTPS for security
  - Add explicit width and height attributes to prevent layout shifts
  - Implement local caching of frequently used badges

- **Enhance Vercel Image Configuration**
  - Add more size options to better match common viewport sizes
  - Configure quality settings for different image types
  - Add support for additional image formats

```javascript
// Example configuration in astro.config.mjs
imagesConfig: {
  domains: [],
  sizes: [320, 480, 640, 768, 1024, 1280, 1536, 1920],
  formats: ["image/avif", "image/webp", "image/png", "image/jpeg"],
  minimumCacheTTL: 60 * 60 * 24 * 7, // 1 week
  quality: 80,
}
```

## 2. JavaScript Optimization

### High Priority

- **Implement Code Splitting for GraphQLEditor**
  - Modify GraphQLEditor.tsx to use dynamic imports for GraphiQL library
  - Update GraphQLEditor.astro to use client:visible directive
  - Add loading state to improve user experience during lazy loading

```typescript
// Example implementation in GraphQLEditor.tsx
import { lazy, Suspense } from "react";
const GraphiQL = lazy(() => import("graphiql"));

// In the component render function
return (
  <Suspense fallback={<div className="graphiql-loading">Loading GraphQL Editor...</div>}>
    <GraphiQL
      fetcher={fetcher}
      query={query}
      variables={isEmptyVariables(variables) ? undefined : variables}
      // ...other props
    />
  </Suspense>
);
```

```astro
<!-- Example implementation in GraphQLEditor.astro -->
<div transition:persist>
  <ReactGraphQLEditor
    network={network}
    query={query}
    variables={variables}
    client:visible
  />
</div>
```

- **Optimize CSS Imports**
  - Move GraphiQL CSS import to the component level
  - Implement CSS code splitting to only load styles when needed
  - Reduce unused CSS with better tree-shaking

## 3. Configuration Refactoring

### Medium Priority

- **Split Sidebar Configuration**
  - Create separate files for each top-level section
  - Implement utility function to merge configurations
  - Update imports in astro.sidebar.ts

```typescript
// Example implementation
// src/config/sidebar/guides.ts
import { group } from "../sidebar";

export const guidesSidebar = group("guides", {
  items: [
    group("guides.group.getStarted", {
      collapsed: true,
      items: [
        "build/get-started",
        "build/guides",
        // ...other items
      ],
    }),
    // ...other groups
  ],
});

// src/config/sidebar/index.ts
import { guidesSidebar } from "./guides";
import { sdksAndToolsSidebar } from "./sdks-and-tools";
// ...other imports

export const sidebarSections = [
  guidesSidebar,
  sdksAndToolsSidebar,
  // ...other sections
];

// astro.sidebar.ts
import { sidebarSections } from "./src/config/sidebar";
export const sidebar = sidebarSections;
```

## 4. Build Process Optimization

### Medium Priority

- **Implement Caching for Middleware Route Discovery**
  - Add file hash-based caching to avoid regenerating routes when content hasn't changed
  - Store discovered routes in a cache file
  - Only regenerate when source files have changed

```javascript
// Example implementation in generate-middleware-matcher.js
import * as crypto from "crypto";
import * as fs from "fs";

// Function to calculate hash of directory contents
function getDirectoryHash(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  const hashContent = files
    .map((file) => {
      const path = `${dir}/${file.name}`;
      if (file.isDirectory()) return getDirectoryHash(path);
      return `${file.name}:${fs.statSync(path).mtimeMs}`;
    })
    .join("|");
  return crypto.createHash("md5").update(hashContent).digest("hex");
}

// Check if we can use cached routes
const contentHash = getDirectoryHash(contentDocsPath);
const cacheFile = path.join(rootDir, ".cache/middleware-routes.json");
const cacheMetaFile = path.join(rootDir, ".cache/middleware-routes-meta.json");

if (fs.existsSync(cacheFile) && fs.existsSync(cacheMetaFile)) {
  const cacheMeta = JSON.parse(fs.readFileSync(cacheMetaFile, "utf8"));
  if (cacheMeta.contentHash === contentHash) {
    console.log("Using cached middleware routes");
    return;
  }
}

// Generate routes as before...

// Save to cache
fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
fs.writeFileSync(cacheFile, JSON.stringify(ALL_PATHS));
fs.writeFileSync(cacheMetaFile, JSON.stringify({ contentHash }));
```

- **Add Incremental Build Support for Middleware**
  - Modify the middleware build process to support incremental builds
  - Only rebuild when source files have changed
  - Implement watch mode optimizations

## 5. Dependency Optimizations

### Low Priority

- **Contribute Patches Upstream**
  - Submit internationalization support for starlight-openapi to the upstream repository
  - Contribute React component handling improvements for starlight-llms-txt
  - Reduce maintenance burden by getting patches merged upstream

- **Implement Automated Dependency Updates**
  - Set up Dependabot for automated dependency updates
  - Configure security scanning for dependencies
  - Implement automated testing for dependency updates

## 6. Performance Monitoring

### Medium Priority

- **Implement Lighthouse CI**
  - Set up automated performance testing with Lighthouse CI
  - Configure performance budgets for key metrics
  - Add performance testing to CI/CD pipeline

```yaml
# Example GitHub Actions workflow
name: Performance Testing
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 22
      - name: Install dependencies
        run: pnpm install
      - name: Build site
        run: pnpm build
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            https://preview-url.vercel.app/
          budgetPath: ./lighthouse-budget.json
          uploadArtifacts: true
```

- **Create Performance Dashboard**
  - Implement a performance dashboard to track metrics over time
  - Monitor key performance indicators
  - Set up alerts for performance regressions

## Implementation Timeline

1. **Week 1**: Image optimization and JavaScript code splitting
2. **Week 2**: Build process optimization and sidebar refactoring
3. **Week 3**: Dependency optimizations and performance monitoring setup
4. **Week 4**: Testing, validation, and documentation

## Expected Outcomes

- **Page Load Time**: 30% reduction in initial page load time
- **Time to Interactive**: 25% improvement in time to interactive
- **Build Time**: 40% reduction in build time for incremental builds
- **Bundle Size**: 20% reduction in JavaScript bundle size
- **Lighthouse Score**: Achieve and maintain 90+ performance score
