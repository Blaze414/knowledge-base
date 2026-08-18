import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "shopping-wishlist",
  categoryId: "shopping-products",
  title: "How to save products to a wishlist",
  steps: [
    "Select the heart-shaped Open Wishlist control in the Store header.",
    "Use the wishlist interface to review products you have saved. Sign in if the Store asks you to connect the list to an account.",
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
  tags: ["wishlist", "account"],
});
