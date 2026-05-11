import { NextResponse } from "next/server";

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

  return NextResponse.json({ success: true, id: result.id });
}
