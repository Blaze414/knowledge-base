import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "shopping-gifts-by-price",
  categoryId: "shopping-products",
  title: "How to find gifts under $25 or $50",
  steps: [
    "Open Gifts in the store navigation and choose Gifts Under $25 or Gifts Under $50.",
    "Open a product from the selected collection and check its current price before adding it to the cart.",
  ],
  note: "Delivery charges and taxes may change the final checkout total.",
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
  tags: ["gifts", "price", "budget"],
});
