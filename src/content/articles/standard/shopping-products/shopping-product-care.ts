import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "shopping-product-care",
  categoryId: "shopping-products",
  title: "How to care for Peanuts apparel and merchandise",
  steps: [
    "Open the product page and check Product Details for any item-specific care information.",
    "Follow the care label supplied with the item. The official source pages reviewed do not publish one care method for all Peanuts merchandise.",
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
  tags: ["care", "apparel", "merchandise"],
});
