import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "ordering-cancel-change",
  categoryId: "ordering-checkout",
  title: "How to cancel or change an order before processing",
  steps: [
    "Check the order status before requesting a change or cancellation.",
    "Contact Customer Service while the status is New. The Store says an order with any other status can no longer be changed or canceled, including its shipping address.",
  ],
  note: "Even while an order is New, the Ordering Policy says a change may only be possible; it is not guaranteed.",
  sources: [
    {
      label: "Ordering policy",
      url: "https://peanuts.store/pages/ordering-policy",
    },
  ],
  tags: ["cancel", "change-order", "support"],
});
