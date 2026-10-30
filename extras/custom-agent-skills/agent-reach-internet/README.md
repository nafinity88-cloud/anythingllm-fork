# Agent Reach Internet Search (custom agent skill)

AnythingLLM custom-skill wrapper around
[Agent-Reach](https://github.com/Panniantong/Agent-Reach) (MIT) — the CLI that
gives agents eyes on Bilibili, YouTube transcripts, V2EX, GitHub, Reddit,
X/Twitter, LinkedIn, Xiaohongshu, Xueqiu, Boss, Xiaoyuzhou, Facebook, Instagram.

## How it works

The handler shells out to the local `agent-reach` binary with an allowlisted
channel (`bilibili|v2ex|github|youtube|web|xiaohongshu|xueqiu|boss|xiaoyuzhou|
linkedin|reddit|twitter|facebook|instagram|read`) and returns stdout
(truncated at 12.000 chars). Read-only usage only — search & read, no posting.

## Requirements (on the AnythingLLM server)

1. Install Agent-Reach per
   `https://raw.githubusercontent.com/Panniantong/Agent-Reach/main/docs/install.md`
   (uv + Python 3.10+, then `agent-reach channels` to verify).
2. Optional: set the binary path in the skill's `AGENT_REACH_BIN` setup arg
   (default: `agent-reach` on PATH).
3. Optional channels (xiaohongshu, xueqiu, reddit, twitter, …) need one-time
   login via the CLI on the server.

If the CLI is missing, the skill returns install instructions instead of failing.

## Examples

- `{ "channel": "bilibili", "action": "search", "query": "大模型" }`
- `{ "channel": "github", "action": "search", "query": "RAG" }`
- `{ "channel": "read", "url": "https://www.v2ex.com/t/123456" }`

## Files

- `plugin.json` — manifest (`hubId: agent-reach-internet`)
- `handler.js` — CLI wrapper, stdlib only (`node:util`, `node:child_process`)
