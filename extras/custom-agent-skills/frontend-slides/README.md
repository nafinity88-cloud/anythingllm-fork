# Frontend Slides (custom agent skill)

AnythingLLM custom-skill port of the
[frontend-slides](https://github.com/zarazhangrui/frontend-slides) idea (MIT):
generate a beautiful single-file HTML deck without npm, build tools, or
external assets.

## How it works

The handler takes a title + slide outline and returns a complete `.html`
document (inline CSS/JS, 6 curated themes, keyboard/click navigation, 16:9,
print-to-PDF friendly). The agent then persists it with the built-in
**save-files** skill. Zero dependencies — works fully offline.

Themes: `bold-signal` (dark, high-impact) · `electric-studio` (clean split) ·
`notebook-tabs` (editorial paper) · `split-pastel` (playful) ·
`terminal-green` (developer) · `swiss-modern` (minimal red/black).

## Example call

```json
{
  "title": "Acme AI — Seed Pitch",
  "author": "Acme Inc",
  "theme": "bold-signal",
  "slides": "[{\"heading\": \"The problem\", \"bullets\": [\"Teams drown in docs\", \"Search misses context\"]}, {\"heading\": \"Our solution\", \"bullets\": [\"One assistant over all tools\"]}]"
}
```

Returns JSON `{status, title, theme, slide_count, html_chars, next_step, html}`.

## Files

- `plugin.json` — manifest (`hubId: frontend-slides`)
- `handler.js` — generator, no dependencies
