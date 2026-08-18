import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "shopping-shop-by-collection",
  categoryId: "shopping-products",
  title: "How to shop by collection, holiday, theme, or recipient",
  steps: [
    "Open the store navigation and choose the collection, holiday, theme, or recipient that matches the occasion.",
    "Refine the collection by product type or price before comparing individual products.",
  ],
  sources: [
    {
      label: "Products",
      url: "https://peanuts.store/collections/all",
    },
    {
      label: "Sizing charts",
      url: "https://peanuts.store/pages/sizing-charts",
    },
    {
      label: "Shop by character",
      url: "https://peanuts.store/pages/shop-by-character",
    },
  ],
  tags: ["collections", "gifts"],
});
