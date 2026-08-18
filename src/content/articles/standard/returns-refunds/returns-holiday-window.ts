import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "returns-holiday-window",
  categoryId: "returns-refunds",
  title: "How extended holiday returns work",
  steps: [
    "Check whether the item was purchased from 17 November through 31 December and remains otherwise eligible for return.",
    "Under the current Return Policy, most qualifying purchases from that period may be returned until 31 January.",
  ],
  note: "Marketplace seller participation varies. Recheck the Return Policy because the published holiday dates may change in a future season.",
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
  tags: ["holiday", "return-window"],
});
