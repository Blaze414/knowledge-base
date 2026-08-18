import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "accounts-unsubscribe",
  categoryId: "accounts-support",
  title: "How to unsubscribe from marketing emails",
  steps: [
    "Open a promotional email and select its unsubscribe link.",
    "Alternatively, email the privacy contact listed in the Privacy Policy with UNSUBSCRIBE in the subject line.",
  ],
  note: "The Privacy Policy says non-promotional messages about accounts, transactions, servicing, or ongoing business relationships cannot be opted out of through this process.",
  sources: [
    {
      label: "Privacy policy",
      url: "https://peanuts.store/pages/privacy-policy",
    },
  ],
  tags: ["email", "unsubscribe", "privacy"],
});
