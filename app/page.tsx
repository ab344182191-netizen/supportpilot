"use client";

import { useState } from "react";

type Msg = { role: "user" | "assistant"; text: string };

export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Salam! Ap kya poochna chahte hain?" },
  ]);

  // Lead capture state
  const [needsLead, setNeedsLead] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<string>("");
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadSaving, setLeadSaving] = useState(false);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.details || data?.error || "Request failed");

      setMessages((m) => [...m, { role: "assistant", text: data.reply }]);

      if (data.needsLead) {
        setNeedsLead(true);
        setPendingQuestion(text);
      } else {
        setNeedsLead(false);
        setPendingQuestion("");
      }
    } catch (err: any) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: `Error: ${err?.message ?? "Unknown error"}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function submitLead(e: React.FormEvent) {
    e.preventDefault();
    if (!leadPhone.trim() || !pendingQuestion) return;

    setLeadSaving(true);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: leadName,
          phone: leadPhone,
          question: pendingQuestion,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.details || data?.error || "Lead save failed");

      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Shukriya! Hum jald aap se contact kar lenge." },
      ]);

      setNeedsLead(false);
      setPendingQuestion("");
      setLeadName("");
      setLeadPhone("");
    } catch (err: any) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: `Error: ${err?.message ?? "Unknown error"}` },
      ]);
    } finally {
      setLeadSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-4 md:p-8">
      <h1 className="text-xl font-bold">SupportPilot</h1>
      <p className="text-sm text-gray-500">AI customer support chatbot (Gemini + Supabase).</p>

      <div className="mt-4 h-[420px] overflow-y-auto rounded-xl border bg-gray-50 p-3">
        {messages.map((m, i) => (
          <div key={i} className="my-3">
            <div className="text-xs text-gray-500">{m.role}</div>
            <div
              className={[
                "whitespace-pre-wrap rounded-xl border p-3",
                m.role === "user" ? "bg-blue-50" : "bg-white",
              ].join(" ")}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 rounded-xl border px-3 py-3 outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl border px-4 py-3 font-medium disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </form>

      {needsLead && (
        <form onSubmit={submitLead} className="mt-4 rounded-xl border p-3">
          <div className="text-sm font-semibold">Contact details</div>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            <input
              value={leadName}
              onChange={(e) => setLeadName(e.target.value)}
              placeholder="Name (optional)"
              className="rounded-xl border px-3 py-3 outline-none"
            />
            <input
              value={leadPhone}
              onChange={(e) => setLeadPhone(e.target.value)}
              placeholder="Mobile number (required)"
              className="rounded-xl border px-3 py-3 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={leadSaving || !leadPhone.trim()}
            className="mt-3 rounded-xl border px-4 py-3 font-medium disabled:opacity-60"
          >
            {leadSaving ? "Saving..." : "Submit"}
          </button>
        </form>
      )}
    </main>
  );
}