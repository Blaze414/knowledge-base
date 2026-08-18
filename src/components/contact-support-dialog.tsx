import React, { useEffect, useRef, useState } from "react";
import { Mail, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IconTile } from "@/components/ui/icon-tile";
import {
  contactFieldSchemas,
  contactSchema,
  EMAIL_MAX,
  MESSAGE_MAX,
  MESSAGE_MIN,
  NAME_MAX,
  SUBJECT_MAX,
  type ContactForm,
} from "@/lib/contact-support";

const DRAFT_STORAGE_KEY = "rtoradar:contact-support-draft";
const DRAFT_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
type FieldErrors = Partial<Record<keyof ContactForm, string>>;
type TouchedFields = Partial<Record<keyof ContactForm, boolean>>;

const validateField = (key: keyof ContactForm, value: string): string | undefined => {
  const result = contactFieldSchemas[key].safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
};

type StoredDraft = {
  values: ContactForm;
  savedAt: number;
};

const readDraft = (): ContactForm | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredDraft>;
    if (
      !parsed ||
      typeof parsed.savedAt !== "number" ||
      Date.now() - parsed.savedAt > DRAFT_TTL_MS
    ) {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      return null;
    }
    const v = parsed.values ?? ({} as Partial<ContactForm>);
    const draft: ContactForm = {
      name: typeof v.name === "string" ? v.name.slice(0, 100) : "",
      email: typeof v.email === "string" ? v.email.slice(0, 255) : "",
      subject: typeof v.subject === "string" ? v.subject.slice(0, 150) : "",
      message: typeof v.message === "string" ? v.message.slice(0, 2000) : "",
    };
    const hasContent = draft.name || draft.email || draft.subject || draft.message;
    return hasContent ? draft : null;
  } catch {
    return null;
  }
};

const writeDraft = (values: ContactForm) => {
  if (typeof window === "undefined") return;
  const hasContent = values.name || values.email || values.subject || values.message;
  try {
    if (!hasContent) {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      return;
    }
    const payload: StoredDraft = { values, savedAt: Date.now() };
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Quota or privacy mode — silently ignore.
  }
};

const clearDraft = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
};

export const ContactSupportDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contextPageTitle?: string;
}> = ({ open, onOpenChange, contextPageTitle }) => {
  const [values, setValues] = useState<ContactForm>(() => {
    const draft = readDraft();
    if (draft) return draft;
    return {
      name: "",
      email: "",
      subject: contextPageTitle ? `Help with: ${contextPageTitle}` : "",
      message: "",
    };
  });
  const [restored, setRestored] = useState<boolean>(() => readDraft() !== null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [website, setWebsite] = useState("");
  const submitAbortRef = useRef<AbortController | null>(null);

  // Re-sync subject when the context page changes while dialog is closed.
  useEffect(() => {
    if (!open && contextPageTitle) {
      setValues((prev) => ({
        ...prev,
        subject: prev.subject ? prev.subject : `Help with: ${contextPageTitle}`,
      }));
    }
  }, [contextPageTitle, open]);

  // Restore latest draft each time the dialog opens (in case another tab updated it).
  useEffect(() => {
    if (!open) return;
    const draft = readDraft();
    if (draft) {
      setValues(draft);
      setRestored(true);
    }
  }, [open]);

  // Persist draft on change (debounced).
  useEffect(() => {
    if (sent) return;
    const handle = window.setTimeout(() => writeDraft(values), 300);
    return () => window.clearTimeout(handle);
  }, [values, sent]);

  useEffect(() => () => submitAbortRef.current?.abort(), []);

  const update = <K extends keyof ContactForm>(key: K, value: ContactForm[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    // Re-validate live only after the field has been touched (blurred once).
    if (touched[key]) {
      setErrors((prev) => ({ ...prev, [key]: validateField(key, value) }));
    } else if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const handleBlur = (key: keyof ContactForm) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    setErrors((prev) => ({ ...prev, [key]: validateField(key, values[key]) }));
  };

  const reset = () => {
    setValues({
      name: "",
      email: "",
      subject: contextPageTitle ? `Help with: ${contextPageTitle}` : "",
      message: "",
    });
    setErrors({});
    setTouched({});
    setSent(false);
    setRestored(false);
    setSubmitError(null);
    setWebsite("");
  };

  const handleClose = (next: boolean) => {
    if (!next) {
      submitAbortRef.current?.abort();
      submitAbortRef.current = null;
      setSubmitting(false);
    }
    onOpenChange(next);
    if (!next) {
      // Slight delay so the closing animation isn't jarring.
      setTimeout(reset, 200);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const result = contactSchema.safeParse(values);
    if (!result.success) {
      const next: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof ContactForm | undefined;
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      setTouched({ name: true, email: true, subject: true, message: true });
      // Focus the first invalid field for accessibility.
      const firstInvalid = (["name", "email", "subject", "message"] as const).find((k) => next[k]);
      if (firstInvalid && typeof document !== "undefined") {
        const el = document.getElementById(`cs-${firstInvalid}`);
        el?.focus();
      }
      return;
    }

    const controller = new AbortController();
    submitAbortRef.current?.abort();
    submitAbortRef.current = controller;
    setSubmitting(true);

    let didTimeout = false;
    const timeout = window.setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, 15_000);

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...result.data,
          pageUrl: window.location.href,
          website,
        }),
        signal: controller.signal,
      });
      const payload = (await response.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
      } | null;

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "We could not send your message. Please try again.");
      }

      setSent(true);
      clearDraft();
      setRestored(false);
    } catch (error) {
      if (controller.signal.aborted && !didTimeout) return;
      setSubmitError(
        didTimeout
          ? "Sending took too long. Your draft is still saved. Please try again."
          : error instanceof Error
            ? error.message
            : "We could not send your message. Your draft is still saved. Please try again.",
      );
    } finally {
      window.clearTimeout(timeout);
      if (submitAbortRef.current === controller) {
        submitAbortRef.current = null;
        setSubmitting(false);
      }
    }
  };

  const hasAnyErrors = Object.values(errors).some(Boolean);
  const isValid = contactSchema.safeParse(values).success;

  const fieldClass = (key: keyof ContactForm) =>
    errors[key]
      ? "border-destructive focus-visible:ring-destructive/40"
      : touched[key] && values[key]
        ? "border-primary/40"
        : "";

  const renderError = (key: keyof ContactForm, id: string) =>
    errors[key] ? (
      <p id={id} role="alert" className="flex items-start gap-1 text-xs text-destructive">
        <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>{errors[key]}</span>
      </p>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100%_-_1rem)] gap-3 overflow-y-auto overscroll-contain p-4 [scrollbar-gutter:stable] sm:max-h-[calc(100dvh-2rem)] sm:max-w-lg sm:gap-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" /> Contact Support
          </DialogTitle>
          <DialogDescription>
            Send us a message and our team will get back to you within one business day.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="py-6 text-center space-y-3">
            <IconTile tone="amber" size="lg" className="mx-auto">
              <CheckCircle2 />
            </IconTile>
            <p className="text-sm text-foreground font-medium">Message sent</p>
            <p className="text-xs text-muted-foreground">
              We received your request and will reply to {values.email} within one business day.
            </p>
            <div className="pt-2">
              <Button variant="outline" size="sm" onClick={() => handleClose(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4" noValidate>
            <div
              className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden"
              aria-hidden="true"
            >
              <Label htmlFor="cs-website">Website</Label>
              <Input
                id="cs-website"
                name="website"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
            {restored && (
              <div className="flex items-start justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-foreground">
                <span className="flex-1">
                  We restored your saved draft. Continue editing or start fresh.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    clearDraft();
                    setValues({
                      name: "",
                      email: "",
                      subject: contextPageTitle ? `Help with: ${contextPageTitle}` : "",
                      message: "",
                    });
                    setErrors({});
                    setTouched({});
                    setRestored(false);
                  }}
                  className="text-primary underline-offset-2 hover:underline shrink-0"
                >
                  Clear draft
                </button>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cs-name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cs-name"
                  value={values.name}
                  onChange={(e) => update("name", e.target.value)}
                  onBlur={() => handleBlur("name")}
                  maxLength={NAME_MAX}
                  autoComplete="name"
                  required
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "cs-name-error" : undefined}
                  className={fieldClass("name")}
                  placeholder="Your full name"
                />
                {renderError("name", "cs-name-error")}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cs-email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cs-email"
                  type="email"
                  value={values.email}
                  onChange={(e) => update("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
                  maxLength={EMAIL_MAX}
                  autoComplete="email"
                  inputMode="email"
                  required
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "cs-email-error" : undefined}
                  className={fieldClass("email")}
                  placeholder="you@example.com"
                />
                {renderError("email", "cs-email-error")}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cs-subject">
                Subject <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cs-subject"
                value={values.subject}
                onChange={(e) => update("subject", e.target.value)}
                onBlur={() => handleBlur("subject")}
                maxLength={SUBJECT_MAX}
                required
                aria-invalid={!!errors.subject}
                aria-describedby={errors.subject ? "cs-subject-error" : undefined}
                className={fieldClass("subject")}
                placeholder="Short summary of your question"
              />
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">{renderError("subject", "cs-subject-error")}</div>
                <span
                  className={`text-[11px] tabular-nums ${
                    values.subject.length > SUBJECT_MAX - 20
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {values.subject.length}/{SUBJECT_MAX}
                </span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cs-message">
                Message <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="cs-message"
                value={values.message}
                onChange={(e) => update("message", e.target.value)}
                onBlur={() => handleBlur("message")}
                maxLength={MESSAGE_MAX}
                rows={5}
                required
                placeholder="Describe what you need help with..."
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? "cs-message-error" : undefined}
                className={fieldClass("message")}
              />
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  {errors.message ? (
                    renderError("message", "cs-message-error")
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      Minimum {MESSAGE_MIN} characters. Include any error messages or steps to
                      reproduce.
                    </p>
                  )}
                </div>
                <span
                  className={`text-[11px] tabular-nums shrink-0 ${
                    values.message.length > MESSAGE_MAX - 100
                      ? "text-destructive"
                      : values.message.length >= MESSAGE_MIN
                        ? "text-primary"
                        : "text-muted-foreground"
                  }`}
                  aria-live="polite"
                >
                  {values.message.length}/{MESSAGE_MAX}
                </span>
              </div>
            </div>
            {hasAnyErrors && (
              <p role="alert" className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                Please fix the highlighted fields before sending.
              </p>
            )}
            {submitError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-brand border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs text-destructive"
              >
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}
            <DialogFooter className="gap-2 [&_button]:w-full sm:[&_button]:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !isValid} variant="cta">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                  </>
                ) : sent ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Sent
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" /> Send message
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
