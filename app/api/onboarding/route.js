import { NextResponse } from "next/server";
import {
  renderOnboardingRecapEmail,
  renderOnboardingRecapText,
} from "../../../lib/emails/onboarding-recap";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Guards double-sends from client retries that land on the same warm
// instance. Cross-instance retries are not covered — there is no persistent
// store here, and each retry creates a fresh Airtable record anyway.
const recentRecapSends = new Map();
const RECAP_DEDUPE_WINDOW_MS = 5 * 60 * 1000;

async function sendRecapEmail(fields) {
  const to = (fields["Email"] || "").trim();
  if (!EMAIL_RE.test(to)) {
    console.error(
      "Recap email skipped: missing or malformed Email field:",
      JSON.stringify(to)
    );
    return;
  }

  const dedupeKey = to.toLowerCase();
  const last = recentRecapSends.get(dedupeKey);
  if (last && Date.now() - last < RECAP_DEDUPE_WINDOW_MS) {
    console.warn("Recap email skipped: already sent to", to, "in dedupe window");
    return;
  }
  // Claim the slot before the await so a concurrent duplicate request on
  // this instance can't race past the check.
  recentRecapSends.set(dedupeKey, Date.now());

  let sender = process.env.BREVO_SENDER_EMAIL || "partners@outbound.consulting";
  if (!sender.toLowerCase().trim().endsWith("@outbound.consulting")) {
    console.warn(
      "BREVO_SENDER_EMAIL is off-domain; using partners@outbound.consulting instead"
    );
    sender = "partners@outbound.consulting";
  }

  const subjectName =
    (fields["Company"] || "").trim() || (fields["Full Name"] || "").trim();
  const subject = subjectName
    ? `Your Launch Blueprint — ${subjectName}`
    : "Your Launch Blueprint";

  const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { email: sender, name: "Outbound Consulting" },
      to: [{ email: to, name: fields["Full Name"] || "" }],
      bcc: [{ email: "eric@outbound.consulting" }],
      subject,
      // specialistName intentionally unset — template falls back to
      // "your launch specialist" until specialist assignment is wired.
      htmlContent: renderOnboardingRecapEmail(fields, {}),
      textContent: renderOnboardingRecapText(fields),
    }),
  });

  if (!brevoRes.ok) {
    const body = await brevoRes.text().catch(() => "(unreadable body)");
    recentRecapSends.delete(dedupeKey);
    console.error(
      `Recap email Brevo error: status ${brevoRes.status}, body: ${body}`
    );
    return;
  }

  const ok = await brevoRes.json().catch(() => ({}));
  console.log("Recap email sent to", to, "messageId:", ok.messageId || "(none)");
}

export async function POST(request) {
  const data = await request.json();

  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME || "Onboarding";

  if (!apiKey || !baseId) {
    console.error("Airtable env vars missing");
    return NextResponse.json(
      { error: "Airtable not configured" },
      { status: 500 }
    );
  }

  const fields = {
    "Full Name": data.name || "",
    "Email": data.email || "",
    "Company": data.company || "",
    "Business Description": data.q2 || "",
    "Ideal Client": data.q3 || "",
    "Discovery Questions": data.q4 || "",
    "Top 3 Obstacles": data.q5 || "",
    "Solutions to Obstacles": data.q6 || "",
    "Differentiators": data.q7 || "",
    "Client Results": data.q8 || "",
    "Most Recognized Client": data.q9 || "",
    "Lead Offer": data.q10 || "",
    "Offer Improvements": data.q11 || "",
    "Additional Notes": data.q12 || "",
    "Submitted At": new Date().toISOString(),
  };

  const airtableRes = await fetch(
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    }
  );

  if (!airtableRes.ok) {
    const err = await airtableRes.json().catch(() => ({}));
    console.error("Airtable error:", err);
    return NextResponse.json(
      { error: "Failed to save to Airtable", details: err },
      { status: 500 }
    );
  }

  const result = await airtableRes.json();

  // Recap email is best-effort: the Airtable write is the thing that matters,
  // and a failed email must never surface as a failed form submission.
  if (process.env.BREVO_API_KEY) {
    try {
      await sendRecapEmail(fields);
    } catch (err) {
      console.error("Recap email failed (non-blocking):", err);
    }
  } else {
    console.error("Recap email skipped: BREVO_API_KEY not set");
  }

  return NextResponse.json({ success: true, id: result.id });
}
