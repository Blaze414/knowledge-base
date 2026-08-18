import { createFileRoute } from "@tanstack/react-router";
import { supportSubmissionSchema } from "../../lib/contact-support";
import { getSupportDeliveryConfig } from "../../lib/support-delivery-config";

const MAX_BODY_BYTES = 12_000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 3;

const recentRequests = new Map<string, number[]>();

const jsonError = (error: string, status: number) =>
  Response.json(
    { success: false, error },
    {
      status,
      headers: { "cache-control": "no-store" },
    },
  );

const getClientAddress = (request: Request) =>
  request.headers.get("cf-connecting-ip") ??
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
  "unknown";

const isRateLimited = (key: string) => {
  const now = Date.now();
  const active = (recentRequests.get(key) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );

  if (active.length >= RATE_LIMIT_MAX) {
    recentRequests.set(key, active);
    return true;
  }

  active.push(now);
  recentRequests.set(key, active);
  return false;
};

const sameOrigin = (request: Request) => {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
};

const formatSubmittedAt = (date: Date, timeZone: string) =>
  new Intl.DateTimeFormat("en-AU", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(date);

export const Route = createFileRoute("/api/support")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!sameOrigin(request)) {
          return jsonError("This request could not be verified.", 403);
        }

        if (!request.headers.get("content-type")?.includes("application/json")) {
          return jsonError("Send the request as JSON.", 415);
        }

        const declaredLength = Number(request.headers.get("content-length") ?? 0);
        if (declaredLength > MAX_BODY_BYTES) {
          return jsonError("The message is too large.", 413);
        }

        const rawBody = await request.text();
        if (rawBody.length > MAX_BODY_BYTES) {
          return jsonError("The message is too large.", 413);
        }

        let input: unknown;
        try {
          input = JSON.parse(rawBody);
        } catch {
          return jsonError("The message could not be read.", 400);
        }

        const result = supportSubmissionSchema.safeParse(input);
        if (!result.success) {
          return jsonError("Please check the form fields and try again.", 400);
        }

        // Quietly accept honeypot submissions so automated senders get no useful signal.
        if (result.data.website) {
          return Response.json({ success: true }, { headers: { "cache-control": "no-store" } });
        }

        if (isRateLimited(getClientAddress(request))) {
          return jsonError(
            "Too many messages were sent. Please wait a few minutes and try again.",
            429,
          );
        }

        const { apiKey, to, from, timeZone } = getSupportDeliveryConfig();

        if (!apiKey) {
          console.error("Support delivery is not configured. Set RESEND_API_KEY.");
          return jsonError(
            "Support messaging is temporarily unavailable. Your draft is still saved.",
            503,
          );
        }

        const { name, email, message, pageUrl } = result.data;
        const subject = result.data.subject.replace(/[\r\n]+/g, " ");
        const text = [
          "New support request",
          "",
          `Name: ${name}`,
          `Email: ${email}`,
          pageUrl ? `Page: ${pageUrl}` : null,
          `Submitted: ${formatSubmittedAt(new Date(), timeZone)}`,
          "",
          "Message",
          "-------",
          message,
        ]
          .filter((line): line is string => line !== null)
          .join("\n");

        let deliveryResponse: Response;
        try {
          deliveryResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              authorization: `Bearer ${apiKey}`,
              "content-type": "application/json",
              "idempotency-key": crypto.randomUUID(),
            },
            body: JSON.stringify({
              from,
              to: [to],
              reply_to: email,
              subject: `[Support] ${subject}`,
              text,
              tags: [{ name: "source", value: "docs-companion" }],
            }),
          });
        } catch (error) {
          console.error("Support delivery request failed", error);
          return jsonError(
            "We could not reach the support service. Your draft is still saved.",
            502,
          );
        }

        if (!deliveryResponse.ok) {
          const providerError = await deliveryResponse.text();
          console.error(
            `Support delivery failed (${deliveryResponse.status}): ${providerError.slice(0, 1000)}`,
          );
          return jsonError(
            "We could not send your message. Your draft is still saved. Please try again.",
            502,
          );
        }

        const delivery = (await deliveryResponse.json().catch(() => ({}))) as { id?: string };
        return Response.json(
          { success: true, requestId: delivery.id },
          { headers: { "cache-control": "no-store" } },
        );
      },
    },
  },
});
