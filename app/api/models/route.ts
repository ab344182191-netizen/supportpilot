export const runtime = "nodejs";

export async function GET() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return Response.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  const res = await fetch(url);

  const data = await res.json();

  // Sirf helpful info return
  const models = (data.models ?? []).map((m: any) => ({
    // yahan "models/..." aata hai
    name: m.name,
    // SDK ke liye usable name (remove "models/")
    sdkName: (m.name || "").replace(/^models\//, ""),
    supportedGenerationMethods: m.supportedGenerationMethods,
  }));

  return Response.json({ models });
}