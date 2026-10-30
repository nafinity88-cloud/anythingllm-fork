// handler.js - Context7 up-to-date docs fetcher.
// Upstream: https://github.com/upstash/context7 (MIT)
// REST endpoints per https://context7.com/docs/api-guide :
//   GET /api/v2/libs/search?libraryName=&query=   (resolve-library-id)
//   GET /api/v2/context?libraryId=&query=&type=json (query-docs)
//   GET /api/v3/search?query=&library=&language=   (one-shot search)

const BASE = "https://context7.com";
const MAX_CHARS = 12000;
const TIMEOUT_MS = 30000;

async function getJson(url, apiKey) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    });
    const body = await res.text();
    let data = null;
    try {
      data = JSON.parse(body);
    } catch {
      data = null;
    }
    return { status: res.status, data, raw: body };
  } catch (e) {
    return { status: 0, data: null, raw: "", error: e?.message || String(e) };
  } finally {
    clearTimeout(t);
  }
}

function formatDocs(data, libraryId) {
  const parts = [];
  if (libraryId) parts.push(`Library: ${libraryId}`);
  const codeSnippets = (data && data.codeSnippets) || [];
  const infoSnippets = (data && data.infoSnippets) || [];
  if (data && data.version) {
    parts.push(`Served version: ${JSON.stringify(data.version)}`);
  }
  for (const s of codeSnippets.slice(0, 8)) {
    parts.push(`\n## ${s.codeTitle || "(untitled snippet)"}`);
    if (s.codeDescription) parts.push(String(s.codeDescription).slice(0, 500));
    for (const c of (s.codeList || []).slice(0, 3)) {
      const code = String(c.code || "").slice(0, 2000);
      parts.push("```" + (c.language || "") + "\n" + code + "\n```");
    }
  }
  for (const info of infoSnippets.slice(0, 6)) {
    parts.push(`\n- ${String(info.content || "").slice(0, 800)}`);
  }
  if (!codeSnippets.length && !infoSnippets.length) {
    parts.push("(no documentation snippets returned)");
  }
  return parts.join("\n");
}

module.exports.runtime = {
  handler: async function ({ query = "", libraryName = "", libraryId = "", language = "" }) {
    const callerId = `${this.config.name}-v${this.config.version}`;
    try {
      const q = String(query || "").trim();
      if (!q) {
        return "Missing required parameter 'query'. Example: {\"query\": \"how to use useState?\", \"libraryName\": \"react\"}.";
      }
      const apiKey =
        (this.runtimeArgs && this.runtimeArgs["CONTEXT7_API_KEY"]) || "";
      if (!apiKey) {
        return (
          "CONTEXT7_API_KEY is not configured. Get a free key at https://context7.com/dashboard " +
          "and set it in this skill's setup_args, then call again."
        );
      }

      const lang = String(language || "").trim();
      const langParam = lang ? `&language=${encodeURIComponent(lang)}` : "";

      // Path A: exact library ID -> Get Context directly (follow one 301 redirect).
      let libId = String(libraryId || "").trim();
      if (libId) {
        this.introspect(`${callerId}: fetching docs for ${libId}...`);
        let url = `${BASE}/api/v2/context?libraryId=${encodeURIComponent(libId)}&query=${encodeURIComponent(q)}&type=json${langParam}`;
        let r = await getJson(url, apiKey);
        if (r.status === 301 && r.data && r.data.redirectUrl) {
          libId = r.data.redirectUrl;
          url = `${BASE}/api/v2/context?libraryId=${encodeURIComponent(libId)}&query=${encodeURIComponent(q)}&type=json${langParam}`;
          r = await getJson(url, apiKey);
        }
        if (r.status === 401)
          return "Context7 rejected the API key (401). Check CONTEXT7_API_KEY (format ctx7sk-...).";
        if (r.status === 429)
          return "Context7 rate limit exceeded (429). Wait for the Retry-After window, then retry or add a key with a higher plan.";
        if (r.status === 404)
          return `Library '${libId}' not found (404). Verify the ID or call with libraryName to resolve it first.`;
        if (r.status !== 200 || !r.data)
          return `Context7 request failed (status ${r.status}). ${String((r.data && r.data.message) || r.raw || r.error || "").slice(0, 500)}`;
        const out = formatDocs(r.data, libId);
        return out.length > MAX_CHARS
          ? out.slice(0, MAX_CHARS) + `\n\n[...truncated at ${MAX_CHARS} chars]`
          : out;
      }

      // Path B: library name -> resolve, then Get Context.
      const libName = String(libraryName || "").trim();
      if (libName) {
        this.introspect(`${callerId}: resolving library '${libName}'...`);
        const sUrl = `${BASE}/api/v2/libs/search?libraryName=${encodeURIComponent(libName)}&query=${encodeURIComponent(q)}`;
        const s = await getJson(sUrl, apiKey);
        if (s.status === 401)
          return "Context7 rejected the API key (401). Check CONTEXT7_API_KEY (format ctx7sk-...).";
        if (s.status === 429)
          return "Context7 rate limit exceeded (429). Wait, then retry.";
        if (s.status !== 200 || !s.data)
          return `Library search failed (status ${s.status}). ${String((s.data && s.data.message) || s.raw || s.error || "").slice(0, 500)}`;
        const results = s.data.results || [];
        if (!results.length)
          return `No Context7 library found for '${libName}'. Try the exact repo path as libraryId, e.g. /vercel/next.js.`;
        const best = results[0];
        const alts = results
          .slice(1, 4)
          .map((r2) => `${r2.id} (${r2.title || "?"})`)
          .join("; ");
        this.introspect(`${callerId}: resolved to ${best.id}, fetching docs...`);
        const cUrl = `${BASE}/api/v2/context?libraryId=${encodeURIComponent(best.id)}&query=${encodeURIComponent(q)}&type=json${langParam}`;
        const c = await getJson(cUrl, apiKey);
        if (c.status !== 200 || !c.data)
          return `Resolved ${best.id} but docs fetch failed (status ${c.status}). ${String((c.data && c.data.message) || c.raw || c.error || "").slice(0, 500)}`;
        let out = `Resolved '${libName}' -> ${best.id} (${best.title || ""})`;
        if (alts) out += `\nAlternatives: ${alts}`;
        out += "\n" + formatDocs(c.data, best.id);
        return out.length > MAX_CHARS
          ? out.slice(0, MAX_CHARS) + `\n\n[...truncated at ${MAX_CHARS} chars]`
          : out;
      }

      // Path C: no library hint -> one-shot v3 search.
      this.introspect(`${callerId}: running one-shot docs search...`);
      const v3 = `${BASE}/api/v3/search?query=${encodeURIComponent(q)}&type=json${langParam}`;
      const v = await getJson(v3, apiKey);
      if (v.status === 401)
        return "Context7 rejected the API key (401). Check CONTEXT7_API_KEY (format ctx7sk-...).";
      if (v.status === 404)
        return "Context7 found no matching documentation (404 no_documentation_found). Try a more specific query or add libraryName.";
      if (v.status !== 200 || !v.data)
        return `Docs search failed (status ${v.status}). ${String((v.data && v.data.message) || v.raw || v.error || "").slice(0, 500)}`;
      const out = formatDocs(v.data, "");
      return out.length > MAX_CHARS
        ? out.slice(0, MAX_CHARS) + `\n\n[...truncated at ${MAX_CHARS} chars]`
        : out;
    } catch (e) {
      this.logger(`${callerId} failed: ${e?.message || e}`);
      return `The tool failed to run. Error: ${e?.message || String(e)}`;
    }
  },
};
