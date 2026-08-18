import { defineMcp } from "@lovable.dev/mcp-js";
import listCategoriesTool from "./tools/list-categories";
import searchArticlesTool from "./tools/search-articles";
import getArticleTool from "./tools/get-article";

export default defineMcp({
  name: "snoopy-kb-mcp",
  title: "Snoopy Knowledge Base",
  version: "0.1.0",
  instructions:
    "Read-only access to the Peanuts Store Knowledge Base. Use `list_categories` to browse, `search_articles` to find relevant pages by keyword, and `get_article` to fetch full article content by ID.",
  tools: [listCategoriesTool, searchArticlesTool, getArticleTool],
});
