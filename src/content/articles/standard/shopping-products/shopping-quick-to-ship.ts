import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "shopping-quick-to-ship",
  categoryId: "shopping-products",
  title: "How to find quick-to-ship and last-minute gifts",
  steps: [
    "Open Gifts and choose Quick to Ship under Last Minute Gifts.",
    "Open the product page and review its expected ship date and estimated delivery information before ordering.",
  ],
  note: "Shipping time begins after processing. The Shipping Policy says delivery dates are estimates and expedited methods are not available for every item.",
  sources: [
    {
      label: "Quick to Ship",
      url: "https://peanuts.store/collections/quick-to-ship",
    },
    {
      label: "Shipping policy",
      url: "https://peanuts.store/pages/shipping-policy",
    },
  ],
  tags: ["gifts", "availability", "shipping"],
});
