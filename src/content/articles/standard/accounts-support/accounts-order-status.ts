import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "accounts-order-status",
  categoryId: "accounts-support",
  title: "How to check an order's status",
  steps: [
    "Open the order information available through the Store account or order emails and locate the current status.",
    "Use the Ordering Policy definitions: New is accepted, Processing is being prepared, Complete is fully shipped, Closed is refunded, and Canceled was not billed.",
  ],
  sources: [
    {
      label: "Ordering policy",
      url: "https://peanuts.store/pages/ordering-policy",
    },
  ],
  tags: ["account", "order-status", "tracking"],
});
