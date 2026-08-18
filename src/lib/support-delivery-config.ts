export const DEFAULT_SUPPORT_RECIPIENT = "yusufalzadid@gmail.com";
export const DEFAULT_SUPPORT_SENDER = "Docs Companion <onboarding@resend.dev>";
export const DEFAULT_SUPPORT_TIME_ZONE = "Australia/Melbourne";

export type SupportDeliveryConfig = {
  apiKey?: string;
  from: string;
  timeZone: string;
  to: string;
};

/**
 * Server-side delivery settings. Environment values make deployments editable
 * without changing application code; the default keeps this project owner-ready.
 */
export const getSupportDeliveryConfig = (): SupportDeliveryConfig => ({
  apiKey: process.env.RESEND_API_KEY?.trim() || undefined,
  from: process.env.SUPPORT_FROM_EMAIL?.trim() || DEFAULT_SUPPORT_SENDER,
  timeZone: process.env.SUPPORT_TIME_ZONE?.trim() || DEFAULT_SUPPORT_TIME_ZONE,
  to: process.env.SUPPORT_TO_EMAIL?.trim() || DEFAULT_SUPPORT_RECIPIENT,
});
