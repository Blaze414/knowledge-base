import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "ordering-missing-newsletter-coupon",
  categoryId: "ordering-checkout",
  title: "How to troubleshoot a missing newsletter coupon",
  steps: [
    "Wait a few minutes, then check spam, promotions, and filtered folders for the welcome email.",
    "Confirm the submitted email address and contact customer support if the message still has not arrived.",
  ],
  sources: [
    {
      label: "Coupon help",
      url: "https://help.peanutsstoresupport.com/hc/en-us/sections/16263559968148-Coupon-Codes-and-Discounts",
    },
  ],
  tags: ["newsletter", "coupon", "email"],
});
