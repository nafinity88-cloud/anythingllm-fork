# AI Research Skills (custom agent skill)

AnythingLLM custom-skill wrapper around the open-source
[AI-Research-SKILLs library](https://github.com/Orchestra-Research/AI-Research-SKILLs)
(98 skills, 23 categories, MIT) by Orchestra Research.

## Why a wrapper?

The full library is ~130.000 lines of `SKILL.md` + references — far too big to
bundle into a `handler.js`. Instead this skill:

1. **Routes** a plain-words research question to the right category/skill
   (keyword router + full catalog overview), then
2. **Fetches** that skill's `SKILL.md` from the public GitHub repo on demand
   and returns it as agent context (truncated at 9000 chars with source URL).

## Usage (agent calls)

- Overview: `{ "request": "I want to do RLHF" }` → routed to `post-training`
- Category: `{ "category": "post-training" }` → skill list + repo path
- Expert doc: `{ "category": "post-training", "skill_name": "grpo-rl-training" }`
  → full `SKILL.md` content for the agent to follow

## Requirements

- Outbound HTTPS to `raw.githubusercontent.com` (for SKILL.md fetch).
  If blocked, the skill falls back to catalog + repo links.
- Node.js 18+ (global `fetch`).

## Files

- `plugin.json` — skill manifest (`hubId: ai-research-skills`)
- `handler.js` — router + fetcher, no dependencies
