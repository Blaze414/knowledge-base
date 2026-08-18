import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "ordering-delivery-estimates",
  categoryId: "ordering-checkout",
  title: "How to review estimated shipping and delivery dates before ordering",
  steps: [
    "Check the product page for processing, pre-order, or availability information.",
    "At checkout, review the available shipping methods and add the processing period to the carrier estimate when planning an arrival date.",
  ],
  note: "Shipping speed begins after processing and does not guarantee a particular arrival date.",
  sources: [
    {
      label: "Shipping policy",
      url: "https://peanuts.store/pages/shipping-policy",
    },
  ],
  tags: ["delivery", "shipping", "estimate"],
});
