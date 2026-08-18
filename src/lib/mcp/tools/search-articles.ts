import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { buildSearchableRecords, createFuse } from "@/lib/kb-search";
import { searchKnowledgeBase } from "@/lib/smart-search";

export default defineTool({
  name: "search_articles",
  title: "Search articles",
  description:
    "Smart search the Snoopy knowledge base using keywords, intent, synonyms, stemming, and spelling tolerance.",
  inputSchema: {
    query: z.string().min(1).describe("Search query text."),
    limit: z
      .number()
      .int()
      .min(1)
      .max(25)
      .optional()
      .describe("Max results to return (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ query, limit }) => {
    const records = buildSearchableRecords();
    const fuse = createFuse(records);
    const response = searchKnowledgeBase(query, records, fuse, { limit: limit ?? 10 });
    const results = [response.bestMatch, ...response.related]
      .filter((result) => result !== null)
      .map((result) => ({
        id: result.id,
        title: result.title,
        categoryId: result.categoryId,
        categoryName: result.categoryName,
        score: result.score,
        confidence: result.confidence,
        snippet: result.snippet,
      }));
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      structuredContent: { status: response.status, results },
    };
  },
});
