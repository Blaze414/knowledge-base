import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "shopping-browse-by-character",
  categoryId: "shopping-products",
  title: "How to browse Peanuts products by character",
  steps: [
    "Open the Shop by Character page and choose the character you want to browse.",
    "Use the product filters to narrow the results, then open an item to review its details and availability.",
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
  tags: ["characters", "browse"],
});
