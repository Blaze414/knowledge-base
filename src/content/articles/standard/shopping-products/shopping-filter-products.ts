import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "shopping-filter-products",
  categoryId: "shopping-products",
  title: "How to filter products by type and price",
  steps: [
    "Open a product or collection page and expand the available filters.",
    "Choose a product type and price range, then clear or adjust a filter if the results are too narrow.",
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
  tags: ["filters", "price"],
});
