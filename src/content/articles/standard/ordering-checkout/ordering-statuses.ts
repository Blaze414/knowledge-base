import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "ordering-statuses",
  categoryId: "ordering-checkout",
  title: "How to interpret order statuses such as New, Processing, Complete, or Closed",
  steps: [
    "Read New as accepted and awaiting processing, and Processing as sent to the packing or shipping team.",
    "Read Complete as fully shipped and charged, Closed as refunded, and Canceled as canceled without the card being billed.",
  ],
  sources: [
    {
      label: "Ordering policy",
      url: "https://peanuts.store/pages/ordering-policy",
    },
  ],
  tags: ["order-status", "processing"],
});
