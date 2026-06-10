import { NextResponse } from "next/server";

export async function POST(request) {
  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME || "Onboarding";

  if (!apiKey || !baseId) {
    return NextResponse.json({ error: "Airtable not configured" }, { status: 500 });
  }

  const res = await fetch(
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}/${id}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields: { "Double Outreach Interest": true } }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("Airtable interest PATCH error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
