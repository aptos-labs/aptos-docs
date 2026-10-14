# auth.md

You are an agent reading authentication instructions for `https://aptos.dev`.

**This origin does not offer agent registration.** There is no `register_uri`, no `POST /agent/auth`, and no ID-JAG or claim ceremony. Do not send registration requests.

## Audience

- Documentation on [https://aptos.dev](https://aptos.dev) is public. Fetch HTML or Markdown with no access token.
- The Aptos MCP server advertised at [https://aptos.dev/.well-known/mcp/server-card.json](https://aptos.dev/.well-known/mcp/server-card.json) is a local stdio process (`npx @aptos-labs/aptos-mcp`). It is not an OAuth resource.
- The Aptos Testnet Faucet at `https://faucet.testnet.aptoslabs.com` is the only API documented here that requires a bearer token. It uses Google sign-in through Firebase Auth (human OIDC), not auth.md agent registration.

## Discover OAuth metadata

Protected Resource Metadata ([RFC 9728](https://www.rfc-editor.org/rfc/rfc9728)):

[https://aptos.dev/.well-known/oauth-protected-resource](https://aptos.dev/.well-known/oauth-protected-resource)

OAuth 2.0 Authorization Server Metadata ([RFC 8414](https://www.rfc-editor.org/rfc/rfc8414)):

[https://aptos.dev/.well-known/oauth-authorization-server](https://aptos.dev/.well-known/oauth-authorization-server)

OpenID Connect Discovery:

[https://aptos.dev/.well-known/openid-configuration](https://aptos.dev/.well-known/openid-configuration)

The `resource` identifier is `https://aptos.dev` so origin-based RFC 9728 clients accept this document. Pages on this host do not require tokens. The `authorization_servers` list — Firebase `https://securetoken.google.com/aptos-api-gateway-prod` and `https://accounts.google.com` — is the OIDC issuers that mint the Google ID tokens the Testnet Faucet accepts on `Authorization: Bearer …`.

`issuer` in the authorization-server document matches that Firebase issuer. Google's authorization server does not implement an `agent_auth` registration profile; this file is the complete registration story (there is none).

## Documentation (no credentials)

Request any docs URL with `GET`. For Markdown, append `.md` to the page path or send `Accept: text/markdown`. See [https://aptos.dev/build/ai.md](https://aptos.dev/build/ai.md).

## Testnet Faucet (Google OIDC, human)

Human-facing UI: [https://aptos.dev/network/faucet](https://aptos.dev/network/faucet)

API:

```http
POST https://faucet.testnet.aptoslabs.com/fund
Authorization: Bearer <Firebase ID token>
x-is-jwt: true
Content-Type: application/json

{"address":"<aptos testnet address>"}
```

Obtain the ID token by signing a human user into Google through Firebase Auth for project `aptos-api-gateway-prod`, requesting scopes `openid`, `email`, and `profile`. A Google account holder must complete that OAuth/OIDC flow; there is no agent-registration shortcut.

The Devnet faucet at `https://faucet.devnet.aptoslabs.com` does not use this Google flow. See [https://aptos.dev/build/apis/faucet-api.md](https://aptos.dev/build/apis/faucet-api.md).

## Supported methods

| Method | Supported |
| --- | --- |
| Public unauthenticated access to `aptos.dev` | Yes |
| Google OIDC (Firebase) for the Testnet Faucet | Yes (human sign-in) |
| auth.md agent registration (ID-JAG, verified-email claim, anonymous) | No |
