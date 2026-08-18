import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "ordering-discount-not-applying",
  categoryId: "ordering-checkout",
  title: "How to understand why a discount does not apply",
  steps: [
    "Confirm that only one code is applied to the order and that the code was entered before the order was submitted.",
    "Check whether the cart contains excluded products such as sale items, already-discounted items, charitable products, or eGift cards.",
  ],
  note: "The Store says coupon codes cannot be added after an order is placed.",
  sources: [
    {
      label: "Promotion terms",
      url: "https://peanuts.store/pages/promotional-disclaimers",
    },
    {
      label: "Coupon help",
      url: "https://help.peanutsstoresupport.com/hc/en-us/sections/16263559968148-Coupon-Codes-and-Discounts",
    },
  ],
  tags: ["coupon", "discount", "troubleshooting"],
});
