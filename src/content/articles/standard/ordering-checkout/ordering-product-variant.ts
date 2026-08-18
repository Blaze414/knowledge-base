import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "ordering-product-variant",
  categoryId: "ordering-checkout",
  title: "How to choose a size, colour, or product variant",
  steps: [
    "Open the product page and select each required option, such as size, colour, design, or device model.",
    "Confirm that the product image, availability, price, and selected options are correct before adding the item to your cart.",
  ],
  sources: [
    {
      label: "Products",
      url: "https://peanuts.store/collections/all",
    },
  ],
  tags: ["variant", "size", "colour"],
});
