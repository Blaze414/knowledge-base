import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "returns-refund-timing",
  categoryId: "returns-refunds",
  title: "How to check when a refund should appear",
  steps: [
    "Allow 2-3 weeks for the return to be processed after the package is received at the warehouse.",
    "After the refund is issued to the original payment method, allow 5-7 business days for the credit to appear, depending on the financial institution.",
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
  tags: ["refund", "timing"],
});
