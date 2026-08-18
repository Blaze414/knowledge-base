import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "ordering-taxes-duties",
  categoryId: "ordering-checkout",
  title: "How to understand sales tax, Canadian GST/HST, and possible duties",
  steps: [
    "For a United States delivery address, review the sales tax calculated at checkout from the delivery address.",
    "For a Canadian delivery address, review the GST or HST charged at checkout and allow for customs duties that may be charged when the goods arrive.",
  ],
  note: "The Ordering Policy states that GST/HST for Canadian deliveries ranges from 5% to 15%.",
  sources: [
    {
      label: "Ordering policy",
      url: "https://peanuts.store/pages/ordering-policy",
    },
  ],
  tags: ["tax", "canada", "duties"],
});
