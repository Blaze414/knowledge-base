import {
  CircleUserRound,
  CreditCard,
  Gift,
  RotateCcw,
  ShoppingBag,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { pageContents, resolvedGroups } from "./articles";
import type { KnowledgeBaseGroup } from "./catalog";
import type { SidebarCategory } from "./types";

const categoryIcons: Record<KnowledgeBaseGroup["icon"], LucideIcon> = {
  shopping: ShoppingBag,
  checkout: CreditCard,
  shipping: Truck,
  returns: RotateCcw,
  gifts: Gift,
  support: CircleUserRound,
};

/**
 * Sidebar categories resolve article IDs against the auto-discovered article
 * modules, including modules the catalogue never listed. Titles and nesting
 * remain owned by each article, while `catalog.ts` owns category grouping and
 * the order of the articles it does list.
 */
export const sidebarCategories: SidebarCategory[] = resolvedGroups.map((group) => {
  const Icon = categoryIcons[group.icon];
  return {
    id: group.id,
    name: group.name,
    icon: <Icon className="h-4 w-4" />,
    subPages: group.articleIds.map((articleId) => ({
      id: articleId,
      title: pageContents[articleId]?.title ?? articleId,
      parentId: group.id,
      parentArticleId: pageContents[articleId]?.parentArticleId,
    })),
  };
});

export function findCategoryForPage(pageId: string): SidebarCategory | undefined {
  return sidebarCategories.find((category) =>
    category.subPages.some((subPage) => subPage.id === pageId),
  );
}
