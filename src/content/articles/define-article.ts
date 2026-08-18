import type { KnowledgeBaseSource, PageContent } from "../types";

export interface StandardArticleDefinition {
  id: string;
  categoryId: string;
  title: string;
  steps: string[];
  note?: string;
  sources: KnowledgeBaseSource[];
  tags?: string[];
  lastUpdated?: string;
  readTime?: string;
}

function renderSources(sources: KnowledgeBaseSource[]) {
  return sources.map((source) => `- [${source.label}](${source.url})`).join("\n");
}

function splitStep(step: string): { title: string; detail?: string } {
  const clean = step.trim().replace(/\.$/, "");
  const candidates = ["; ", ", "]
    .map((separator) => ({ separator, index: clean.indexOf(separator) }))
    .filter((candidate) => candidate.index >= 24)
    .sort((left, right) => left.index - right.index);
  const split = candidates[0];

  if (!split || split.index > 78) return { title: clean };

  return {
    title: clean.slice(0, split.index),
    detail: `${clean.slice(split.index + split.separator.length)}.`,
  };
}

function renderSteps(steps: string[]) {
  return steps
    .map((step, index) => {
      const { title, detail } = splitStep(step);
      return `## Step ${index + 1}: ${title}${detail ? `\n\n${detail}` : ""}`;
    })
    .join("\n\n");
}

/** Convert a concise, file-owned article definition into renderer-ready content. */
export function defineStandardArticle(definition: StandardArticleDefinition): PageContent {
  const steps = renderSteps(definition.steps);
  const note = definition.note ? `\n\n## Important\n\n${definition.note}` : "";

  return {
    id: definition.id,
    categoryId: definition.categoryId,
    title: definition.title,
    content: `${steps}${note}\n\n## Sources\n\n${renderSources(definition.sources)}\n`,
    lastUpdated: definition.lastUpdated ?? "2026-07-16",
    readTime: definition.readTime ?? "3 min read",
    tags: [definition.categoryId, ...definition.id.split("-"), ...(definition.tags ?? [])],
  };
}
