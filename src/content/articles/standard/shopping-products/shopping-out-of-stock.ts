import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "shopping-out-of-stock",
  categoryId: "shopping-products",
  title: "How to sign up for an out-of-stock notification",
  steps: [
    "Open the out-of-stock product and select Email me when available.",
    "Enter your email address to receive the store's one-time availability notification.",
  ],
  note: "The Ordering Policy recommends adding contact@peanutsstoresupport.com to your address book so the notification is less likely to be filtered.",
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
  tags: ["availability", "restock", "email"],
});
