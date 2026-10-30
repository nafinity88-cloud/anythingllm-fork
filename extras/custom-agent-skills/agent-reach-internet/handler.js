// handler.js - Agent Reach internet search wrapper.
// Upstream: https://github.com/Panniantong/Agent-Reach (MIT)
// Runs the local `agent-reach` CLI (read-only: search & read, no posting)
// and returns its stdout as agent context.

const ALLOWED_CHANNELS = new Set([
  "bilibili",
  "v2ex",
  "github",
  "youtube",
  "web",
  "xiaohongshu",
  "xueqiu",
  "boss",
  "xiaoyuzhou",
  "linkedin",
  "reddit",
  "twitter",
  "facebook",
  "instagram",
  "read",
]);

const MAX_CHARS = 12000;
const TIMEOUT_MS = 90000;

module.exports.runtime = {
  handler: async function ({ channel = "", action = "", query = "", url = "" }) {
    const callerId = `${this.config.name}-v${this.config.version}`;
    try {
      const ch = String(channel || "").trim().toLowerCase();
      if (!ch || !ALLOWED_CHANNELS.has(ch)) {
        return (
          `Invalid or missing channel. Allowed: ${[...ALLOWED_CHANNELS].join(", ")}. ` +
          `Examples: {"channel":"bilibili","action":"search","query":"大模型"} or {"channel":"read","url":"https://..."}.`
        );
      }

      const args = [ch];
      if (ch === "read") {
        const u = String(url || "").trim();
        if (!u) return "channel 'read' requires a 'url' parameter.";
        args.push(u);
      } else {
        if (action) args.push(String(action).trim());
        if (query) args.push(String(query).trim());
        if (args.length === 1) args.push("channels");
      }

      const bin =
        (this.runtimeArgs && this.runtimeArgs["AGENT_REACH_BIN"]) ||
        "agent-reach";
      this.introspect(`${callerId}: running ${bin} ${args.join(" ")} ...`);

      let execFile;
      try {
        const { promisify } = require("node:util");
        execFile = promisify(require("node:child_process").execFile);
      } catch (e) {
        return `Cannot load child_process in this runtime: ${e?.message || e}`;
      }

      let stdout = "";
      try {
        const res = await execFile(bin, args, {
          timeout: TIMEOUT_MS,
          maxBuffer: 4 * 1024 * 1024,
          windowsHide: true,
        });
        stdout = res.stdout || "";
      } catch (e) {
        if (e?.code === "ENOENT") {
          this.introspect(`${callerId}: agent-reach CLI not found.`);
          return (
            `agent-reach CLI not found on this server (binary: '${bin}'). ` +
            `Install it first: ask the server admin to follow https://raw.githubusercontent.com/Panniantong/Agent-Reach/main/docs/install.md ` +
            `(needs uv + Python 3.10+, then 'agent-reach channels' to verify). ` +
            `Optional channels (xiaohongshu, xueqiu, reddit, twitter, ...) need one-time login via the CLI.`
          );
        }
        // Non-zero exit still may carry useful stdout (fallback chains).
        stdout = (e.stdout || "") + (e.stderr ? `\n[stderr] ${e.stderr}` : "");
        if (!stdout.trim()) {
          return (
            `agent-reach run failed (code ${e?.code ?? "?"}): ` +
            `${(e?.message || String(e)).slice(0, 1000)}`
          );
        }
      }

      const out =
        stdout.length > MAX_CHARS
          ? stdout.slice(0, MAX_CHARS) +
            `\n\n[...truncated at ${MAX_CHARS} chars of ${stdout.length}]`
          : stdout;
      return `agent-reach ${args.join(" ")}\n\n${out.trim() || "(empty result)"}`;
    } catch (e) {
      this.logger(`${callerId} failed: ${e?.message || e}`);
      return `The tool failed to run. Error: ${e?.message || String(e)}`;
    }
  },
};
