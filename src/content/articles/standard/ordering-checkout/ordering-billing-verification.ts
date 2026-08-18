import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "ordering-billing-verification",
  categoryId: "ordering-checkout",
  title: "How to avoid billing-address verification delays",
  steps: [
    "Enter the billing address exactly as it appears for the payment method being used.",
    "Review the address before placing the order because the Store screens orders for potential fraud and says a mismatch can delay processing.",
  ],
  sources: [
    {
      label: "Ordering policy",
      url: "https://peanuts.store/pages/ordering-policy",
    },
  ],
  tags: ["billing", "payment", "verification"],
});
