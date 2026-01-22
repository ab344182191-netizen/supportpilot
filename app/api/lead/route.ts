import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = (body?.name ?? "").toString().trim();
    const phone = (body?.phone ?? "").toString().trim();
    const question = (body?.question ?? "").toString().trim();

    if (!phone || !question) {
      return Response.json(
        { error: "phone and question are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { error } = await supabase.from("leads").insert({
      name: name || null,
      phone,
      question,
    });

    if (error) throw error;

    return Response.json({ ok: true });
  } catch (err: any) {
    console.error("LEAD API ERROR =>", err);
    return Response.json(
      { error: "Server error", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}