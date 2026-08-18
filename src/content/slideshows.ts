/**
 * Central registry of step-by-step image slideshows used in the
 * knowledge base. Each slideshow is a sequence of image-driven steps —
 * useful for visual how-to walkthroughs where text alone is too dry.
 *
 * Reference one from any article using a token on its own line:
 *
 *     [slideshow:day-in-the-life]
 */
import morning from "@/assets/media/optimized/snoopy/snoopy-morning-768.webp";
import dance from "@/assets/media/optimized/snoopy/snoopy-dance-768.webp";
import flyingAce from "@/assets/media/optimized/snoopy/snoopy-flying-ace-768.webp";
import night from "@/assets/media/optimized/snoopy/snoopy-night-768.webp";
import supportFooterLink from "@/assets/media/optimized/support/peanuts-support-footer-link.webp";
import supportSearchHelp from "@/assets/media/optimized/support/peanuts-support-search-help.webp";
import supportOpenRequestForm from "@/assets/media/optimized/support/peanuts-support-open-request-form.webp";
import supportCompleteRequestForm from "@/assets/media/optimized/support/peanuts-support-complete-request-form.webp";
import supportSubmitButton from "@/assets/media/optimized/support/peanuts-support-submit-button.webp";

export interface SlideshowStep {
  /** Display number used by guides with nested steps, e.g. "2.1". */
  stepNumber?: string;
  /** Short step label shown in the top-left badge, e.g. "Step 1". */
  label: string;
  /** Big headline shown above the description on the slide. */
  title: string;
  /** 1–3 sentence description displayed under the title. */
  description: string;
  /** Image URL (imported asset or external src). */
  image: string;
  /** Accessible alt text for the image. */
  alt: string;
}

export interface Slideshow {
  /** Optional overall title shown above the slideshow frame. */
  title?: string;
  /** Stable key used to restore the last viewed step across visits. */
  storageKey?: string;
  /** Visual treatment used by the article renderer. */
  variant?: "article" | "immersive";
  steps: SlideshowStep[];
}

export const slideshows = {
  "day-in-the-life": {
    title: "A day in the life of Snoopy",
    steps: [
      {
        label: "Step 1",
        title: "Wake up on the roof",
        description:
          "Stretch on top of the red doghouse, greet the sunrise, and decide today is going to be a good day.",
        image: morning,
        alt: "Snoopy stretching on top of the red doghouse roof at sunrise",
      },
      {
        label: "Step 2",
        title: "Do the suppertime dance",
        description:
          "Spot Charlie Brown approaching with the bowl, spring onto your hind legs, and dance until the kibble lands.",
        image: dance,
        alt: "Snoopy doing the happy dance next to a full supper bowl as Charlie Brown smiles",
      },
      {
        label: "Step 3",
        title: "Fly a Sopwith Camel mission",
        description:
          "Don the leather helmet and goggles, climb back up the doghouse, and patrol for the Red Baron with Woodstock as co-pilot.",
        image: flyingAce,
        alt: "Snoopy as the Flying Ace on the doghouse with Woodstock perched beside him",
      },
      {
        label: "Step 4",
        title: "Curl up under the stars",
        description:
          "Mission complete. Settle in on the roof beside Woodstock, count a few stars, and drift off for a well-earned beagle nap.",
        image: night,
        alt: "Snoopy and Woodstock sleeping on the doghouse roof under a starry crescent-moon sky",
      },
    ],
  },
  "contact-customer-support": {
    title: "How to Contact Customer Support",
    storageKey: "contact-customer-support",
    variant: "immersive",
    steps: [
      {
        stepNumber: "1",
        label: "Support Centre",
        title: "Open the Support Center",
        description: "Scroll to the bottom of the Peanuts Store page and select Support Center.",
        image: supportFooterLink,
        alt: "Peanuts Store footer with the Support Center link highlighted",
      },
      {
        stepNumber: "2.1",
        label: "Find answers",
        title: "Search for Help",
        description:
          "Use the search bar to look for your question or choose a category to browse related help articles.",
        image: supportSearchHelp,
        alt: "Peanuts Support Center search bar and help categories",
      },
      {
        stepNumber: "2.2",
        label: "Contact support",
        title: "Open the Support Request Form",
        description:
          "If an article does not answer your question, scroll down and select Message Customer Support.",
        image: supportOpenRequestForm,
        alt: "Message Customer Support button near the bottom of the Support Center",
      },
      {
        stepNumber: "3",
        label: "Request details",
        title: "Complete the Submit a Request Form",
        description:
          "Enter your email address, choose the closest issue type, and provide a clear subject and description.",
        image: supportCompleteRequestForm,
        alt: "Submit a request form showing the fields a customer needs to complete",
      },
      {
        stepNumber: "4",
        label: "Send request",
        title: "Submit Your Request",
        description:
          "Review the information you entered, scroll to the bottom of the form, and select Submit.",
        image: supportSubmitButton,
        alt: "Bottom of the support form with the Submit button highlighted",
      },
    ],
  },
} satisfies Record<string, Slideshow>;

export type SlideshowKey = keyof typeof slideshows;

export function getSlideshow(key: string): Slideshow | undefined {
  return (slideshows as Record<string, Slideshow>)[key];
}
