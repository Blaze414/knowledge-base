import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { sidebarCategories } from "@/content/categories";

export default defineTool({
  name: "list_categories",
  title: "List categories",
  description: "List all knowledge base categories and the article IDs and titles inside each.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const data = sidebarCategories.map((c) => ({
      id: c.id,
      name: c.name,
      articles: c.subPages.map((s) => ({
        id: s.id,
        title: s.title,
        parentArticleId: s.parentArticleId,
      })),
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { categories: data },
    };
  },
});
