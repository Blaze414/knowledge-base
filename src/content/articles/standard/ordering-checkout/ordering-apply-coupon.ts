import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "ordering-apply-coupon",
  categoryId: "ordering-checkout",
  title: "How to apply a coupon or discount code at checkout",
  steps: [
    "Enter the code in the discount-code field at checkout and select Apply before submitting payment.",
    "Confirm that the discount appears in the order summary and that the final total changed as expected.",
  ],
  sources: [
    {
      label: "Coupon help",
      url: "https://help.peanutsstoresupport.com/hc/en-us/sections/16263559968148-Coupon-Codes-and-Discounts",
    },
  ],
  tags: ["coupon", "discount", "checkout"],
});
