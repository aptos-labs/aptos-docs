export const cspDirectives: Record<string, string[]> = {
  "default-src": ["'self'"],
  "script-src": [
    "'self'",
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
    "https://pagead2.googlesyndication.com",
    "https://vercel.live",
    "https://va.vercel-scripts.com",
    // hashes will be inserted dynamically
  ],
  "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
  "img-src": ["'self'", "data:", "https:"],
  "connect-src": [
    "'self'",
    "https://www.google-analytics.com",
    "https://region1.google-analytics.com",
    "https://api.mainnet.aptoslabs.com",
    "https://api.testnet.aptoslabs.com",
    "https://api.devnet.aptoslabs.com",
  ],
  "frame-src": ["'self'", "https://www.youtube.com", "https://vercel.live"],
  "object-src": ["none"],
  "base-uri": ["'self'"],
  "frame-ancestors": ["none"],
};
