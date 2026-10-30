# Context7 Up-to-date Docs (custom agent skill)

AnythingLLM custom-skill wrapper around
[Context7](https://github.com/upstash/context7) (MIT) — up-to-date,
version-specific library documentation and code examples.

## How it works

Three call paths (same as the MCP tools, same REST endpoints per
https://context7.com/docs/api-guide):

| Call | Flow |
| ---- | ---- |
| `{query, libraryId}` | `GET /api/v2/context` directly (follows one 301 redirect) |
| `{query, libraryName}` | `GET /api/v2/libs/search` → best match → `GET /api/v2/context` |
| `{query}` | `GET /api/v3/search` one-shot (Context7 picks the library) |

Optional `language` (e.g. `TypeScript`) ranks code examples. Version pinning:
`/vercel/next.js/v16.2.9` or `/vercel/next.js@v16.2.9`.

## Requirements

- `CONTEXT7_API_KEY` in the skill's `setup_args` (free at
  https://context7.com/dashboard). Without a key the skill refuses with setup
  instructions (rate limits are too low to be useful).
- Outbound HTTPS to `context7.com`. Node.js 18+ (global `fetch`).

## Examples

- `{"query": "How do I stream an OpenAI response from a Next.js route?", "libraryName": "Next.js"}`
- `{"query": "email password sign-up", "libraryId": "/supabase/supabase"}`
- `{"query": "proxy that checks JWT in cookies", "libraryId": "/vercel/next.js", "language": "TypeScript"}`

## Files

- `plugin.json` — manifest (`hubId: context7-docs`)
- `handler.js` — REST client, no dependencies
