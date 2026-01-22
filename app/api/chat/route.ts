import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

const LEAD_TOKEN = "[LEAD_REQUIRED]";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = (body?.message ?? "").toString().trim();

    if (!message) {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return Response.json(
        { error: "Missing GEMINI_API_KEY in .env.local" },
        { status: 500 }
      );
    }
const supabase = getSupabase();
    // FAQs from Supabase
    const { data: faqs, error: faqErr } = await supabase
      .from("faqs")
      .select("question, answer")
      .order("created_at", { ascending: true });

    if (faqErr) throw faqErr;

    const faqText =
      (faqs ?? [])
        .map((f) => `Q: ${f.question}\nA: ${f.answer}`)
        .join("\n\n") || "No FAQs found.";

    // Gemini
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
You are a customer support assistant.
Answer using ONLY the FAQ below.

If the answer is NOT in the FAQ, reply with EXACTLY this token and nothing else:
${LEAD_TOKEN}

FAQ:
${faqText}

User: ${message}
`.trim();

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();

    if (raw === LEAD_TOKEN) {
      return Response.json({
        reply:
          "Main is ka confirm jawab nahi de sakta. Apna naam aur mobile number share kar dein, hum aap se contact kar lenge.",
        needsLead: true,
      });
    }

    return Response.json({ reply: raw, needsLead: false });
  } catch (err: any) {
    console.error("CHAT API ERROR =>", err);
    return Response.json(
      { error: "Server error", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}