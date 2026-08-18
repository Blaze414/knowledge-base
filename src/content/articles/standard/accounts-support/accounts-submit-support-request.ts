import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "accounts-submit-support-request",
  categoryId: "accounts-support",
  title: "How to submit a support request",
  steps: [
    "Search the Support Centre first, then open the request form if an article does not answer the question.",
    "Enter your email address, choose the closest issue type, add a subject and description, and include an optional attachment when it helps explain the request.",
  ],
  note: "Use the [Submit a request](https://help.peanutsstoresupport.com/hc/en-us/requests/new) form for store enquiries.",
  sources: [
    {
      label: "Support Centre",
      url: "https://help.peanutsstoresupport.com/hc/en-us",
    },
    {
      label: "Submit a request",
      url: "https://help.peanutsstoresupport.com/hc/en-us/requests/new",
    },
  ],
  tags: ["support", "request", "contact"],
});
