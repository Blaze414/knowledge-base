import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "ordering-newsletter-discount",
  categoryId: "ordering-checkout",
  title: "How to claim the newsletter's 10% discount",
  steps: [
    "Use the newsletter sign-up form and enter an email address that can receive the confirmation message.",
    "Open the promotional email, copy the supplied code, and apply it to an eligible order at checkout.",
  ],
  note: "Check the current sign-up offer and its terms because promotional values and exclusions can change.",
  sources: [
    {
      label: "Promotion terms",
      url: "https://peanuts.store/pages/promotional-disclaimers",
    },
  ],
  tags: ["newsletter", "coupon", "discount"],
});
