import { imageIds } from "../../images";
import type { PageContent } from "../../types";

const article: PageContent = {
  id: "guides-contact-customer-support",
  categoryId: "accounts-support",
  title: "How to Contact Customer Support",
  lastUpdated: "2026-07-16",
  readTime: "3 min read",
  tags: ["support", "store", "contact", "submit-request", "customer-service"],
  content: `## Step 1: Open the Support Center

Scroll to the bottom of the page and click **Support Center**.

[image:${imageIds.supportFooterLink}]

## Step 2.1: Search for Help

Use the search bar to look for your question or topic, or select one of the available category buttons to browse related help articles.

[image:${imageIds.supportSearchHelp}]

## Step 2.2: Open the Support Request Form

If you cannot find the information you need, scroll down and click **Message Customer Support**.

[image:${imageIds.supportOpenRequestForm}]

## Step 3: Complete the “Submit a Request” Form

Fill in all required information in the **Submit a Request** form.

[image:${imageIds.supportCompleteRequestForm}]

## Step 4: Submit Your Request

After completing the form, scroll to the bottom of the page and click **Submit**.

[image:${imageIds.supportSubmitButton}]
`,
};

export default article;
