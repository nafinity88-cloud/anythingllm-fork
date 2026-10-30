// handler.js - Frontend Slides deck generator.
// Inspired by https://github.com/zarazhangrui/frontend-slides (MIT):
// zero-dependency single HTML file, inline CSS/JS, keyboard nav, 16:9.
// The agent saves the returned HTML with the built-in save-files skill.

const THEMES = {
  "bold-signal": {
    label: "Bold Signal",
    bg: "#0d0d12", surface: "#17171d", fg: "#f5f3ee",
    muted: "#a7a7b3", accent: "#d4ff3f",
    font: "'Inter','Segoe UI',system-ui,sans-serif",
  },
  "electric-studio": {
    label: "Electric Studio",
    bg: "#f4f4f2", surface: "#ffffff", fg: "#111827",
    muted: "#6b7280", accent: "#2563eb",
    font: "'Inter','Segoe UI',system-ui,sans-serif",
  },
  "notebook-tabs": {
    label: "Notebook Tabs",
    bg: "#fbf7ec", surface: "#ffffff", fg: "#2b2b2b",
    muted: "#8a8578", accent: "#e4572e",
    font: "'Georgia','Times New Roman',serif",
  },
  "split-pastel": {
    label: "Split Pastel",
    bg: "#ffd6e0", surface: "#ffffff", fg: "#2b2440",
    muted: "#7a7390", accent: "#5b5bd6",
    font: "'Trebuchet MS','Segoe UI',system-ui,sans-serif",
  },
  "terminal-green": {
    label: "Terminal Green",
    bg: "#0a0f0a", surface: "#0e150e", fg: "#33ff66",
    muted: "#1f7a3d", accent: "#ccff00",
    font: "'Cascadia Code','JetBrains Mono',Consolas,monospace",
  },
  "swiss-modern": {
    label: "Swiss Modern",
    bg: "#ffffff", surface: "#f5f5f5", fg: "#111111",
    muted: "#737373", accent: "#e30613",
    font: "'Helvetica Neue',Helvetica,Arial,sans-serif",
  },
};

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildDeck({ title, author, theme, slides }) {
  const t = THEMES[theme] || THEMES["bold-signal"];
  const n = slides.length;

  const contentSlides = slides
    .map((s, i) => {
      const bullets = (s.bullets || [])
        .map((b) => `<li>${esc(b)}</li>`)
        .join("");
      return `<section class="slide" data-i="${i + 1}">
  <div class="kicker">${esc(s.kicker || `${t.label} · ${i + 1} / ${n}`)}</div>
  <h1>${esc(s.heading || `Slide ${i + 1}`)}</h1>
  ${bullets ? `<ul>${bullets}</ul>` : ""}
</section>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<style>
:root{--bg:${t.bg};--surface:${t.surface};--fg:${t.fg};--muted:${t.muted};--accent:${t.accent}}
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;background:var(--bg);color:var(--fg);font-family:${t.font}}
body{display:flex;align-items:center;justify-content:center;min-height:100vh}
.deck{width:min(96vw,calc(96vh*16/9));aspect-ratio:16/9;position:relative;overflow:hidden;background:var(--bg)}
.slide{display:none;height:100%;padding:6% 7%;flex-direction:column;justify-content:center}
.slide.active{display:flex;animation:fade .35s ease}
.slide.cover{align-items:flex-start;border-left:1.2vw solid var(--accent)}
.slide.end{align-items:center;text-align:center}
.kicker{color:var(--accent);text-transform:uppercase;letter-spacing:.25em;font-size:clamp(10px,1.4vw,15px);margin-bottom:2.5vh;font-weight:700}
h1{font-size:clamp(26px,4.6vw,64px);line-height:1.08;margin-bottom:3vh}
.cover h1{font-size:clamp(32px,5.6vw,80px)}
ul{list-style:none;display:flex;flex-direction:column;gap:1.8vh}
li{font-size:clamp(15px,2.2vw,28px);line-height:1.4;padding-left:3.2vw;position:relative}
li::before{content:"";position:absolute;left:0;top:.55em;width:1.4vw;height:1.4vw;max-width:18px;max-height:18px;background:var(--accent);border-radius:2px}
.sub{color:var(--muted);font-size:clamp(13px,1.8vw,22px);margin-top:3vh}
.counter{position:absolute;bottom:2.5vh;right:3vw;color:var(--muted);font-size:clamp(10px,1.3vw,14px);letter-spacing:.15em}
.hint{position:absolute;bottom:2.5vh;left:3vw;color:var(--muted);font-size:clamp(10px,1.3vw,14px)}
@keyframes fade{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@media print{.deck{width:100%;aspect-ratio:auto}.slide{display:flex!important;page-break-after:always;border:1px solid #ccc}.counter,.hint{display:none}}
</style>
</head>
<body>
<div class="deck" id="deck">
<section class="slide cover active" data-i="0">
<div class="kicker">${esc(t.label)}</div>
<h1>${esc(title)}</h1>
${author ? `<div class="sub">${esc(author)}</div>` : ""}
<div class="sub">Click, tap, or use arrow keys to navigate</div>
</section>
${contentSlides}
<section class="slide end" data-i="${n + 1}">
<div class="kicker">Thank you</div>
<h1>${esc(title)}</h1>
${author ? `<div class="sub">${esc(author)}</div>` : ""}
</section>
<div class="hint">&larr; &rarr; navigate &middot; F fullscreen</div>
<div class="counter" id="counter"></div>
</div>
<script>
(function(){var s=document.querySelectorAll('.slide'),i=0,c=document.getElementById('counter');
function show(k){i=Math.max(0,Math.min(s.length-1,k));s.forEach(function(el,j){el.classList.toggle('active',j===i)});c.textContent=(i+1)+' / '+s.length;}
document.addEventListener('keydown',function(e){if(e.key==='ArrowRight'||e.key===' '||e.key==='PageDown')show(i+1);else if(e.key==='ArrowLeft'||e.key==='PageUp')show(i-1);else if(e.key==='Home')show(0);else if(e.key==='End')show(s.length-1);else if(e.key==='f'||e.key==='F'){var d=document.getElementById('deck');if(document.fullscreenElement)document.exitFullscreen();else if(d.requestFullscreen)d.requestFullscreen();}});
document.getElementById('deck').addEventListener('click',function(){show(i+1)});show(0);})();
</script>
</body>
</html>`;
}

module.exports.runtime = {
  handler: async function ({ title = "", slides = "", theme = "bold-signal", author = "" }) {
    const callerId = `${this.config.name}-v${this.config.version}`;
    try {
      const cleanTitle = String(title || "").trim();
      if (!cleanTitle) {
        return "Missing required parameter 'title'. Example: {\"title\": \"Acme AI Seed Pitch\", \"theme\": \"bold-signal\", \"slides\": \"[{\\\"heading\\\": \\\"Problem\\\", \\\"bullets\\\": [\\\"...\\\"]}]\"}.";
      }
      let items;
      try {
        items = JSON.parse(String(slides || ""));
      } catch {
        return "Parameter 'slides' must be a JSON array string, e.g. [{\"heading\": \"Problem\", \"bullets\": [\"Point one\", \"Point two\"]}]. JSON parse failed — fix quoting and retry.";
      }
      if (!Array.isArray(items) || !items.length) {
        return "Parameter 'slides' must be a non-empty JSON array of {heading, bullets[], kicker?}.";
      }
      if (items.length > 30) items = items.slice(0, 30);
      const themeKey = String(theme || "bold-signal").trim().toLowerCase();
      const used = THEMES[themeKey] ? themeKey : "bold-signal";
      if (themeKey !== used) {
        this.introspect(`${callerId}: unknown theme '${theme}', using bold-signal.`);
      }
      this.introspect(`${callerId}: building ${items.length}-slide deck '${cleanTitle}' (${used})...`);
      const html = buildDeck({
        title: cleanTitle,
        author: String(author || "").trim(),
        theme: used,
        slides: items.map((s) => ({
          heading: s.heading || "",
          bullets: Array.isArray(s.bullets) ? s.bullets.map(String) : [],
          kicker: s.kicker || "",
        })),
      });
      return JSON.stringify({
        status: " Deck generated",
        title: cleanTitle,
        theme: used,
        slide_count: items.length + 2,
        html_chars: html.length,
        next_step:
          "Save the 'html' value below to a .html file with the save-files skill, then open it in a browser (click/arrows to navigate, F for fullscreen, print to PDF).",
        html,
      });
    } catch (e) {
      this.logger(`${callerId} failed: ${e?.message || e}`);
      return `The tool failed to run. Error: ${e?.message || String(e)}`;
    }
  },
};
