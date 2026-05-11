import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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

  if (data.email && process.env.BREVO_API_KEY) {
    const firstName = (data.name || "").split(" ")[0] || "there";

    const htmlTemplate = fs.readFileSync(
      path.join(process.cwd(), "kickoff-email", "kickoff-confirmation.html"),
      "utf8"
    );
    const htmlContent = htmlTemplate.replace(/\{\{name\}\}/g, firstName);

    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "Outbound Consulting",
          email: process.env.BREVO_SENDER_EMAIL || "hello@outbound.consulting",
        },
        to: [{ email: data.email, name: data.name || "" }],
        subject: "Your kickoff call is booked — one thing to do before we talk",
        htmlContent,
      }),
    }).catch((err) => console.error("Brevo send error:", err));
  }

  return NextResponse.json({ success: true, id: result.id });
}
