import { z } from "zod";

export const NAME_MAX = 100;
export const EMAIL_MAX = 255;
export const SUBJECT_MAX = 150;
export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 2000;

// Zod's email validation is intentionally permissive; require a plausible TLD too.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const contactFieldSchemas = {
  name: z
    .string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(NAME_MAX, { message: `Name must be under ${NAME_MAX} characters` })
    .regex(/^[\p{L}\p{M}'.\- ]+$/u, {
      message: "Use letters, spaces, hyphens or apostrophes only",
    }),
  email: z
    .string()
    .trim()
    .min(1, { message: "Email is required" })
    .max(EMAIL_MAX, { message: `Email must be under ${EMAIL_MAX} characters` })
    .email({ message: "Enter a valid email address" })
    .regex(EMAIL_RE, { message: "Enter a valid email address (e.g. you@example.com)" }),
  subject: z
    .string()
    .trim()
    .min(3, { message: "Subject must be at least 3 characters" })
    .max(SUBJECT_MAX, { message: `Subject must be under ${SUBJECT_MAX} characters` }),
  message: z
    .string()
    .trim()
    .min(MESSAGE_MIN, { message: `Message must be at least ${MESSAGE_MIN} characters` })
    .max(MESSAGE_MAX, { message: `Message must be under ${MESSAGE_MAX} characters` })
    .refine((value) => !/^(.)\1+$/.test(value), {
      message: "Please provide a meaningful message",
    }),
} as const;

export const contactSchema = z.object(contactFieldSchemas);

export const supportSubmissionSchema = contactSchema.extend({
  pageUrl: z.string().url().max(2048).optional(),
  website: z.string().max(200).optional(),
});

export type ContactForm = z.infer<typeof contactSchema>;
export type SupportSubmission = z.infer<typeof supportSubmissionSchema>;
