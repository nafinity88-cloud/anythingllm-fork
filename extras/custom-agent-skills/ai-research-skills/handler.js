// handler.js - AI Research Skills router + on-demand SKILL.md fetcher.
// Source library: https://github.com/Orchestra-Research/AI-Research-SKILLs (98 skills, MIT)
// This skill does NOT bundle the 130k-line library. It routes to the right
// specialist skill and fetches its SKILL.md from the public repo on demand so
// the agent gets expert guidance without blowing the context window.

const REPO = "Orchestra-Research/AI-Research-SKILLs";
const RAW = `https://raw.githubusercontent.com/${REPO}/main`;
const MAX_CHARS = 9000;

// category key -> { dir, title, skills[] }
const CATALOG = {
  autoresearch: {
    dir: "0-autoresearch-skill",
    title: "Autonomous research orchestration (end-to-end idea-to-paper loop)",
    skills: ["autoresearch"],
  },
  "model-architecture": {
    dir: "01-model-architecture",
    title: "Model architectures",
    skills: ["litgpt", "mamba", "rwkv", "nanogpt", "torchtitan"],
  },
  tokenization: {
    dir: "02-tokenization",
    title: "Tokenization",
    skills: ["huggingface-tokenizers", "sentencepiece"],
  },
  "fine-tuning": {
    dir: "03-fine-tuning",
    title: "Supervised fine-tuning (SFT, LoRA/QLoRA)",
    skills: ["axolotl", "llama-factory", "unsloth", "peft"],
  },
  "mechanistic-interpretability": {
    dir: "04-mechanistic-interpretability",
    title: "Mechanistic interpretability",
    skills: ["transformer-lens", "saelens", "pyvene", "nnsight"],
  },
  "data-processing": {
    dir: "05-data-processing",
    title: "Data processing & curation",
    skills: ["ray-data", "nemo-curator"],
  },
  "post-training": {
    dir: "06-post-training",
    title: "Post-training & RL (RLHF, GRPO, DPO, preference optimization)",
    skills: [
      "trl-fine-tuning",
      "grpo-rl-training",
      "openrlhf",
      "simpo",
      "verl",
      "slime",
      "miles",
      "torchforge",
    ],
  },
  "safety-alignment": {
    dir: "07-safety-alignment",
    title: "Safety & alignment",
    skills: [
      "constitutional-ai",
      "llamaguard",
      "nemo-guardrails",
      "prompt-guard",
    ],
  },
  "distributed-training": {
    dir: "08-distributed-training",
    title: "Distributed training",
    skills: [
      "megatron-core",
      "deepspeed",
      "pytorch-fsdp2",
      "accelerate",
      "pytorch-lightning",
      "ray-train",
    ],
  },
  infrastructure: {
    dir: "09-infrastructure",
    title: "GPU cloud infrastructure",
    skills: ["modal", "skypilot", "lambda-labs"],
  },
  optimization: {
    dir: "10-optimization",
    title: "Optimization & quantization",
    skills: [
      "flash-attention",
      "bitsandbytes",
      "gptq",
      "awq",
      "hqq",
      "gguf",
    ],
  },
  evaluation: {
    dir: "11-evaluation",
    title: "Model evaluation & benchmarking",
    skills: [
      "lm-evaluation-harness",
      "bigcode-evaluation-harness",
      "nemo-evaluator",
    ],
  },
  "inference-serving": {
    dir: "12-inference-serving",
    title: "Inference & serving",
    skills: ["vllm", "tensorrt-llm", "llama-cpp", "sglang"],
  },
  mlops: {
    dir: "13-mlops",
    title: "MLOps & experiment tracking",
    skills: ["weights-and-biases", "mlflow", "tensorboard"],
  },
  agents: {
    dir: "14-agents",
    title: "Agent frameworks",
    skills: ["langchain", "llamaindex", "crewai", "autogpt"],
  },
  rag: {
    dir: "15-rag",
    title: "RAG & vector search",
    skills: ["chroma", "faiss", "sentence-transformers", "pinecone", "qdrant"],
  },
  "prompt-engineering": {
    dir: "16-prompt-engineering",
    title: "Prompt engineering & structured outputs",
    skills: ["dspy", "instructor", "guidance", "outlines"],
  },
  observability: {
    dir: "17-observability",
    title: "LLM observability",
    skills: ["langsmith", "phoenix"],
  },
  multimodal: {
    dir: "18-multimodal",
    title: "Multimodal (vision, audio, image generation)",
    skills: [
      "clip",
      "whisper",
      "llava",
      "stable-diffusion",
      "segment-anything",
      "blip-2",
      "audiocraft",
    ],
  },
  "emerging-techniques": {
    dir: "19-emerging-techniques",
    title: "Emerging techniques (MoE, merging, long context, distillation, pruning)",
    skills: [
      "moe-training",
      "model-merging",
      "long-context",
      "speculative-decoding",
      "knowledge-distillation",
      "model-pruning",
    ],
  },
  "ml-paper-writing": {
    dir: "20-ml-paper-writing",
    title: "ML paper writing & academic figures",
    skills: ["ml-paper-writing", "academic-plotting"],
  },
  "research-ideation": {
    dir: "21-research-ideation",
    title: "Research ideation & brainstorming",
    skills: ["brainstorming-research-ideas", "creative-thinking-for-research"],
  },
  "agent-native-research-artifact": {
    dir: "22-agent-native-research-artifact",
    title: "Agent-native research artifacts (compile, manage, review rigor)",
    skills: ["compiler", "research-manager", "rigor-reviewer"],
  },
};

// keyword -> category fallback router
const KEYWORD_ROUTES = [
  [/grpo|rlhf|dpo|reward model|preference|ppo|online rl/i, "post-training"],
  [/fine-tun|qlora|lora|sft|axolotl|unsloth/i, "fine-tuning"],
  [/vllm|tensorrt|llama\.cpp|sglang|serving|inference|throughput/i, "inference-serving"],
  [/quant|gptq|awq|gguf|bitsandbytes|flash attention/i, "optimization"],
  [/benchmark|eval harness|humaneval|gpqa/i, "evaluation"],
  [/rag|vector|chroma|faiss|pinecone|qdrant|embed/i, "rag"],
  [/langchain|llamaindex|crewai|autogpt|agent framework/i, "agents"],
  [/paper|neurips|icml|iclr|latex|citation|academic plot/i, "ml-paper-writing"],
  [/idea|brainstorm|research direction|novel/i, "research-ideation"],
  [/deepspeed|fsdp|megatron|distributed|multi-gpu|multi-node/i, "distributed-training"],
  [/whisper|clip|llava|stable diffusion|sam |multimodal|tts|audio/i, "multimodal"],
  [/dspy|instructor|structured output|guidance|outlines/i, "prompt-engineering"],
  [/interpretability|sae |probing|activation/i, "mechanistic-interpretability"],
  [/tokeniz|bpe|sentencepiece/i, "tokenization"],
  [/wandb|mlflow|tensorboard|tracking/i, "mlops"],
  [/langsmith|phoenix|tracing|observability/i, "observability"],
  [/moe|model merg|long context|distill|prun|speculative/i, "emerging-techniques"],
  [/modal|skypilot|lambda labs|gpu cloud/i, "infrastructure"],
  [/curator|ray data|dataset|crawl|deduplicat/i, "data-processing"],
  [/guardrail|jailbreak|safety|red team|constitutional/i, "safety-alignment"],
  [/architect|mamba|rwkv|nanogpt|titans?$/i, "model-architecture"],
];

function norm(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
}

function findSkillDir(skill) {
  const s = norm(skill);
  for (const [key, cat] of Object.entries(CATALOG)) {
    if (cat.skills.includes(s)) return { key, dir: cat.dir, skill: s };
    // allow prefix matches, e.g. "grpo" -> "grpo-rl-training"
    const hit = cat.skills.find(
      (c) => c.startsWith(s) || s.startsWith(c)
    );
    if (hit) return { key, dir: cat.dir, skill: hit };
  }
  return null;
}

async function fetchText(url, timeoutMs = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: "text/plain" },
    });
    if (!res.ok) return { ok: false, status: res.status };
    const text = await res.text();
    return { ok: true, text };
  } catch (e) {
    return { ok: false, status: 0, error: e?.message || String(e) };
  } finally {
    clearTimeout(t);
  }
}

function overview() {
  const lines = [
    "AI Research Skills library (98 skills, 23 categories) - https://github.com/" + REPO,
    "Pass category + skill_name to fetch that skill's expert SKILL.md. Categories:",
  ];
  for (const [key, cat] of Object.entries(CATALOG)) {
    lines.push(`- ${key}: ${cat.title} [${cat.skills.join(", ")}]`);
  }
  return lines.join("\n");
}

module.exports.runtime = {
  handler: async function ({ request = "", category = "", skill_name = "" }) {
    const callerId = `${this.config.name}-v${this.config.version}`;
    try {
      const cat = norm(category);
      const skill = norm(skill_name);

      // 1) Specific skill requested -> fetch its SKILL.md
      if (skill) {
        const found =
          (cat && CATALOG[cat]
            ? { key: cat, dir: CATALOG[cat].dir, skill }
            : null) || findSkillDir(skill);
        if (!found) {
          this.introspect(`${callerId}: unknown skill '${skill_name}'.`);
          return (
            `Unknown skill '${skill_name}'. Available skills per category:\n` +
            overview()
          );
        }
        this.introspect(`${callerId}: fetching SKILL.md for ${found.skill}...`);
        const candidates = [
          `${RAW}/${found.dir}/${found.skill}/SKILL.md`,
          `${RAW}/${found.dir}/SKILL.md`,
        ];
        for (const url of candidates) {
          const r = await fetchText(url);
          if (r.ok && r.text && r.text.length > 50) {
            const body =
              r.text.length > MAX_CHARS
                ? r.text.slice(0, MAX_CHARS) +
                  `\n\n[...truncated at ${MAX_CHARS} chars. Full source: ${url}]`
                : r.text;
            return (
              `Skill: ${found.skill} (category: ${found.key})\nSource: ${url}\n\n` +
              body
            );
          }
        }
        return (
          `Could not fetch SKILL.md for '${found.skill}' from the public repo ` +
          `(network blocked or path changed). Browse manually: https://github.com/${REPO}/tree/main/${found.dir} . ` +
          `Category overview - ${CATALOG[found.key].title}: [${CATALOG[found.key].skills.join(", ")}]`
        );
      }

      // 2) Category only -> list its skills + fetch category landing doc
      if (cat) {
        if (!CATALOG[cat]) {
          return `Unknown category '${category}'.\n` + overview();
        }
        const c = CATALOG[cat];
        this.introspect(`${callerId}: listing category ${cat}.`);
        return (
          `Category: ${cat} - ${c.title}\nSkills: ${c.skills.join(", ")}\n` +
          `Repo path: https://github.com/${REPO}/tree/main/${c.dir}\n` +
          `Call again with skill_name set to one of the above to fetch its expert SKILL.md.`
        );
      }

      // 3) No selectors -> keyword route on request, else full overview
      if (request) {
        for (const [re, target] of KEYWORD_ROUTES) {
          if (re.test(request)) {
            const c = CATALOG[target];
            this.introspect(`${callerId}: routed to ${target}.`);
            return (
              `Best-matching category for your request: ${target} - ${c.title}\n` +
              `Skills: ${c.skills.join(", ")}\n` +
              `Repo path: https://github.com/${REPO}/tree/main/${c.dir}\n` +
              `Call again with category="${target}" and skill_name set to fetch the expert SKILL.md.`
            );
          }
        }
      }
      this.introspect(`${callerId}: returning full catalog overview.`);
      return overview();
    } catch (e) {
      this.logger(`${callerId} failed: ${e?.message || e}`);
      return `The tool failed to run. Error: ${e?.message || String(e)}`;
    }
  },
};
