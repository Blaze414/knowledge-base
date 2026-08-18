import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "shopping-preorders-availability",
  categoryId: "shopping-products",
  title: "How to understand pre-orders and product availability",
  steps: [
    "Use the product page to check the item's current availability and expected ship information.",
    "Use the Ordering Policy definitions: In Stock means the item is ready for purchase; Out of Stock or Sold Out means it is not currently available.",
  ],
  note: "The linked Ordering Policy does not publish a general pre-order procedure. Follow product-specific messaging or contact Customer Service before ordering if the product page is unclear.",
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
  tags: ["preorder", "availability"],
});
