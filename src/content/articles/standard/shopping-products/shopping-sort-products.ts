import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "shopping-sort-products",
  categoryId: "shopping-products",
  title: "How to sort products by price, popularity, or newest arrival",
  steps: [
    "Open the Sort menu above the product results.",
    "Choose price, best selling, or newest to reorder the current results without removing your filters.",
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
  tags: ["sorting", "browse"],
});
