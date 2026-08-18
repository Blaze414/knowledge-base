import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { getPage } from "@/content/articles";

export default defineTool({
  name: "get_article",
  title: "Get article",
  description: "Fetch a single knowledge base article by its ID, including full markdown content.",
  inputSchema: {
    id: z.string().min(1).describe("Article ID (matches list_categories output)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ id }) => {
    const page = getPage(id);
    if (!page) {
      return {
        content: [{ type: "text", text: `No article with id "${id}"` }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: page.content }],
      structuredContent: {
        id: page.id,
        title: page.title,
        categoryId: page.categoryId,
        lastUpdated: page.lastUpdated,
        readTime: page.readTime,
        tags: page.tags,
        content: page.content,
      },
    };
  },
});
