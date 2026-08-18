import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "returns-paypal-refund",
  categoryId: "returns-refunds",
  title: "How to handle a PayPal refund",
  steps: [
    "Complete the normal eligible-return process and keep the return tracking details.",
    "When the refund is issued, check the original PayPal transaction because the credit is returned through PayPal rather than another payment method.",
  ],
  sources: [
    {
      label: "Return policy",
      url: "https://peanuts.store/pages/return-policy",
    },
    {
      label: "Returns and exchanges help",
      url: "https://help.peanutsstoresupport.com/hc/en-us/sections/16263552225812-Returns-and-Exchanges",
    },
  ],
  tags: ["refund", "paypal"],
});
