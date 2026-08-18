import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "shopping-apparel-size",
  categoryId: "shopping-products",
  title: "How to choose the correct apparel size",
  steps: [
    "Open the product page and follow its Sizing Charts link before choosing a size.",
    "Use the measurements and instructions shown for that product. The linked source does not state that every garment uses the same chart.",
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
  tags: ["apparel", "sizing"],
});
