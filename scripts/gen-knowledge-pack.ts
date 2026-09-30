// Generates packages/ally5-knowledge/gamedev-knowledge.json from the TS source of truth.
import { GAMEDEV_KNOWLEDGE, KNOWLEDGE_CATEGORY_LABELS, KNOWLEDGE_STATS } from "../src/lib/ally5-knowledge.ts";

const pack = {
  pack: "Ally-5 game-development knowledge base",
  version: "5.4.0",
  description:
    "The curriculum Ally-5 was fed: patterns, game feel, design theory, genre recipes, the Lapia engine API and shipping checklists. Loaded at runtime by the in-browser retrieval engine (keyword scoring).",
  categories: KNOWLEDGE_CATEGORY_LABELS,
  stats: KNOWLEDGE_STATS,
  articles: GAMEDEV_KNOWLEDGE.map((a) => ({
    id: a.id,
    title: a.title,
    category: a.category,
    keywords: a.keywords,
    summary: a.summary,
    body: a.body,
  })),
};

await Bun.write("packages/ally5-knowledge/gamedev-knowledge.json", JSON.stringify(pack, null, 2) + "\n");
console.log(`Wrote ${pack.articles.length} articles · ~${KNOWLEDGE_STATS.approxWords} words`);
