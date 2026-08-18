/**
 * Shared types for the knowledge base content model.
 *
 * - Category order lives in `src/content/catalog.ts` and is resolved through
 *   `src/content/categories.tsx`.
 * - Each article owns its content in a module under `src/content/articles/`
 *   and is auto-discovered into the `pageContents` map.
 */
import type { ReactNode } from "react";

export interface KnowledgeBaseSource {
  label: string;
  url: string;
}

export interface SubPage {
  id: string;
  title: string;
  parentId: string;
  /**
   * Optional id of a sibling article (in the same category) that this
   * sub-page nests beneath. Used to render hierarchical numbering
   * (1.1, 1.2, …) and indented children in the sidebar.
   */
  parentArticleId?: string;
}

export interface SidebarCategory {
  id: string;
  name: string;
  icon: ReactNode;
  subPages: SubPage[];
}

export interface PageContent {
  id: string;
  /** Category id this article belongs to (matches a `SidebarCategory.id`). */
  categoryId: string;
  title: string;
  content: string;
  lastUpdated: string;
  readTime: string;
  /** Full YouTube URL or raw 11-char video ID. */
  video?: string;
  /** Optional content tags used to surface related articles across categories. */
  tags?: string[];
  /**
   * Optional layout override. `"sticky-steps"` opts the article into the
   * sticky-rail step layout — see `[stickysteps]…[/stickysteps]` in
   * `formatContent` for the in-content wrapper.
   */
  layout?: "default" | "sticky-steps" | "immersive-slideshow";
  /**
   * Id of a sibling article (same `categoryId`) that this article nests
   * beneath. Drives dotted numbering and sidebar nesting.
   */
  parentArticleId?: string;
  /** Manual ordering hint among siblings; defaults to declaration order. */
  order?: number;
}
